import { buildSystemPrompt } from "@/lib/tutor";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { Lesson } from "@/lib/lessons";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`tutor:${ip}`, 15, 60_000)) {
    return Response.json({ error: "Too many questions, slow down and try again in a minute." }, { status: 429 });
  }

  const { question, lesson, concept } = (await req.json()) as {
    question: string;
    lesson: Lesson;
    concept: string;
  };

  if (!question || !lesson) {
    return Response.json({ error: "Missing question or lesson" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 28000);

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    signal: controller.signal,
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "AI Agents from Scratch",
    },
    body: JSON.stringify({
      model: "mistralai/ministral-3b-2512",
      max_tokens: 1000,
      stream: true,
      messages: [
        { role: "system", content: buildSystemPrompt(lesson, concept ?? "") },
        { role: "user",   content: question },
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
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
