import { getChatContext } from '@/lib/chatContexts';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { LESSONS } from '@/lib/lessons';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`chat:${ip}`, 30, 60_000)) {
    return Response.json({ error: 'Too many messages, slow down.' }, { status: 429 });
  }

  const { featureName, message, chatHistory } = (await req.json()) as {
    featureName: string;
    message: string;
    chatHistory: Array<{ role: string; content: string }>;
  };

  if (!featureName || !message) {
    return Response.json({ error: 'Missing featureName or message' }, { status: 400 });
  }

  const context = getChatContext(featureName as any);
  if (!context) {
    return Response.json({ error: 'Invalid feature' }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Build system prompt
  let systemPrompt = context.systemPrompt;
  if (featureName === 'learn') {
    const lessonList = LESSONS.slice(0, 14)
      .map(l => `Lesson ${String(l.num).padStart(2, '0')}: ${l.title} (${l.tag})`)
      .join('\n');
    systemPrompt += `\n\nCurriculum:\n${lessonList}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    signal: controller.signal,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Agent Learn Chat',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(chatHistory || []),
        { role: 'user', content: message }
      ],
    }),
  });

  clearTimeout(timeout);

  if (!upstream.ok) {
    const err = await upstream.text();
    return Response.json({ error: `OpenRouter error: ${err}` }, { status: 500 });
  }

  /* Pipe the SSE stream directly to the browser */
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
