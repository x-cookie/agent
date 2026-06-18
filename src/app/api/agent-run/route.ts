import { LESSONS } from '@/lib/lessons';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

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

Act as if you ARE this agent running against the user's input below. Follow the reasoning pattern implied by the lesson (e.g. ReAct, tree-of-thought, chain-of-thought, plan-and-execute) and produce the kind of console output this agent would print — thought/action/observation steps, or whatever structure fits the pattern, ending with a final answer. Keep it concise (under 200 words). Do not explain the code — actually run the persona.`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(`agent-run:${ip}`, 10, 60_000)) {
      return Response.json({ error: 'Too many runs, slow down and try again in a minute.' }, { status: 429 });
    }

    const { lessonId, code, prompt } = (await req.json()) as {
      lessonId: string;
      code: string;
      prompt: string;
    };

    if (!lessonId || !code) {
      return Response.json({ error: 'Missing lessonId or code' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      signal: controller.signal,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Agents from Scratch',
      },
      body: JSON.stringify({
        model: 'mistralai/ministral-3b-2512',
        max_tokens: 500,
        messages: [
          { role: 'system', content: buildAgentSystemPrompt(lessonId, code) },
          { role: 'user', content: prompt || 'Run the agent.' },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const err = await upstream.text();
      return Response.json({ error: `OpenRouter error: ${err}` }, { status: 500 });
    }

    const data = await upstream.json();
    const output = data.choices?.[0]?.message?.content ?? '[No output returned]';

    return Response.json({ output });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Agent run failed' },
      { status: 500 }
    );
  }
}
