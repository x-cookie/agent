import { LESSONS } from './lessons';

function buildAgentSystemPrompt(lessonId: string, code: string): string {
  const lesson = LESSONS.find(l => l.folder === lessonId);
  const lessonContext = lesson
    ? `**Lesson:** ${lesson.num} — ${lesson.title} (${lesson.tag})\n**Pattern:** ${lesson.desc}\n**Key concepts:** ${lesson.keys.join(', ')}`
    : `**Lesson:** ${lessonId}`;

  return `You are simulating the execution of a Node.js AI agent written by a student in the "AI Agents from Scratch" course.

${lessonContext}

The student's agent code:
\`\`\`js
${code.slice(0, 3000)}
\`\`\`

Act as if you ARE this agent running against the scenario below. Follow the reasoning pattern implied by the lesson and produce realistic console-style output ending with a final answer. Keep it under 200 words. Do not explain the code — actually run the persona.`;
}

async function callOpenRouterRaw(systemPrompt: string, userPrompt: string): Promise<string> {
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/ministral-3b-2512',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!upstream.ok) throw new Error(`OpenRouter error: ${await upstream.text()}`);
  const data = await upstream.json();
  return data.choices?.[0]?.message?.content ?? '[No output returned]';
}

/** Run one agent's persona against a shared battle scenario. */
export async function callAgentForScenario(lessonId: string, code: string, scenario: string): Promise<string> {
  return callOpenRouterRaw(buildAgentSystemPrompt(lessonId, code), scenario);
}

const REASONING_KEYS = ['reasoning', 'reason', 'explanation', 'rationale', 'justification'];

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')   // code fences
    .replace(/`[^`]*`/g, '')          // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')    // italic
    .replace(/^#+\s*/gm, '')          // headings
    .replace(/\n{3,}/g, '\n\n')       // excess newlines
    .trim();
}

function resolveWinner(raw: string, nameA: string, nameB: string): 'a' | 'b' | 'tie' | null {
  const lower = raw.toLowerCase();
  const nA = nameA.toLowerCase();
  const nB = nameB.toLowerCase();
  const hitsA = [
    'winner: a', '"winner":"a"', '"winner": "a"', 'winner is a', 'agent a wins', 'agent a is the winner',
    `winner: ${nA}`, `${nA} wins`, `${nA} is the winner`, `winner is ${nA}`,
  ].filter(p => lower.includes(p)).length;
  const hitsB = [
    'winner: b', '"winner":"b"', '"winner": "b"', 'winner is b', 'agent b wins', 'agent b is the winner',
    `winner: ${nB}`, `${nB} wins`, `${nB} is the winner`, `winner is ${nB}`,
  ].filter(p => lower.includes(p)).length;
  if (hitsA > hitsB) return 'a';
  if (hitsB > hitsA) return 'b';
  return null;
}

/** Extract { winner, reasoning } from a judge model's raw text response. */
export function parseJudgeResponse(
  raw: string,
  agentNames?: { nameA: string; nameB: string }
): { winner: 'a' | 'b' | 'tie'; reasoning: string } {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // Accept 'a'/'b'/'tie' directly, or resolve from agent name if model used the full name
      let winner: 'a' | 'b' | 'tie' = 'tie';
      if (parsed.winner === 'a' || parsed.winner === 'b') {
        winner = parsed.winner;
      } else if (agentNames && typeof parsed.winner === 'string') {
        const v = parsed.winner.toLowerCase();
        if (v.includes(agentNames.nameA.toLowerCase())) winner = 'a';
        else if (v.includes(agentNames.nameB.toLowerCase())) winner = 'b';
        else if (v === 'agent a') winner = 'a';
        else if (v === 'agent b') winner = 'b';
      }
      const reasoningKey = REASONING_KEYS.find(key => typeof parsed[key] === 'string');
      const rawReasoning = reasoningKey ? parsed[reasoningKey] : '';
      const reasoning = rawReasoning ? stripMarkdown(rawReasoning) : 'No reasoning provided.';
      return { winner, reasoning };
    } catch {
      // fall through
    }
  }
  // Text-based fallback — use agent names if provided
  const nameA = agentNames?.nameA ?? 'agent a';
  const nameB = agentNames?.nameB ?? 'agent b';
  const textWinner = resolveWinner(raw, nameA, nameB);
  if (textWinner) {
    return { winner: textWinner, reasoning: stripMarkdown(raw).slice(0, 500) };
  }
  return { winner: 'tie', reasoning: raw.length > 20 ? stripMarkdown(raw).slice(0, 500) : 'No verdict could be determined.' };
}

/** Ask the LLM to judge which of two agent outputs better handles the scenario. */
export async function judgeBattle(
  scenario: string,
  agentAName: string,
  outputA: string,
  agentBName: string,
  outputB: string
): Promise<{ winner: 'a' | 'b' | 'tie'; reasoning: string }> {
  const systemPrompt = `You are an impartial judge scoring two AI agents that responded to the same scenario. Compare their reasoning quality, accuracy, and how well they followed their stated pattern.

Respond with ONLY a JSON object, no other text before or after it. Use exactly these two keys, "winner" and "reasoning" — do not rename them or add extra keys.

Example of a valid response: {"winner": "a", "reasoning": "Agent A gave a more structured, concrete plan while Agent B's answer was vague."}`;
  const userPrompt = `Scenario:\n${scenario}\n\nAgent A (${agentAName}):\n${outputA}\n\nAgent B (${agentBName}):\n${outputB}`;
  const raw = await callOpenRouterRaw(systemPrompt, userPrompt);
  return parseJudgeResponse(raw, { nameA: agentAName, nameB: agentBName });
}
