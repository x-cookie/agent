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

/** Extract { winner, reasoning } from a judge model's raw text response. */
export function parseJudgeResponse(raw: string): { winner: 'a' | 'b' | 'tie'; reasoning: string } {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const winner = parsed.winner === 'a' || parsed.winner === 'b' || parsed.winner === 'tie' ? parsed.winner : 'tie';
      const reasoningKey = REASONING_KEYS.find(key => typeof parsed[key] === 'string');
      const reasoning = reasoningKey ? parsed[reasoningKey] : 'No reasoning provided.';
      return { winner, reasoning };
    } catch {
      // fall through to the generic failure below
    }
  }
  return { winner: 'tie', reasoning: 'Judge response could not be parsed.' };
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
  return parseJudgeResponse(raw);
}
