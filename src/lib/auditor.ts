import { LESSONS } from './lessons';
import { callOpenRouterRaw } from './battleJudge';

export interface AuditFix {
  issue: string;
  fix: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AuditSubscores {
  reasoning_loop: number;
  tool_definitions: number;
  error_handling: number;
  prompt_design: number;
}

export interface AuditReport {
  grade: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  fixes: AuditFix[];
  subscores: AuditSubscores;
  timestamp: string;
  lessonId: number;
}

export interface AuditOutput {
  json: AuditReport;
  markdown: string;
}

function buildAuditSystemPrompt(lessonId: number): string {
  const lesson = LESSONS.find(l => l.num === lessonId);
  const lessonContext = lesson
    ? `**Lesson:** ${lesson.num} — ${lesson.title} (${lesson.tag})\n**Pattern:** ${lesson.desc}\n**Key concepts:** ${lesson.keys.join(', ')}`
    : `**Lesson:** #${lessonId}`;

  return `You are a senior code auditor for the "AI Agents from Scratch" course. Your job is to review a student's agent code and provide a structured quality audit.

${lessonContext}

The student's agent code is provided below. Audit it thoroughly for:
- Reasoning loop validity (termination, exit conditions, infinite-loop risk)
- Tool definitions (clarity, schema, safety, required params)
- Error handling (retries, timeouts, graceful failure)
- Prompt/system design (clarity, scope, output format enforcement)
- Memory/state management (retrieval sanity, context-window risks)
- General code soundness (bugs, unsanitized inputs, anti-patterns)

Keep all text fields SHORT: summary max 2 sentences, each strength/weakness/fix max 1 sentence. Maximum 3 fixes.

Return ONLY a valid JSON object with NO markdown, NO code fences, NO extra text:
{"grade":"A","score":85,"summary":"Text here.","strengths":["s1","s2"],"weaknesses":["w1"],"fixes":[{"issue":"i","fix":"f","severity":"high"}],"subscores":{"reasoning_loop":80,"tool_definitions":85,"error_handling":75,"prompt_design":90}}`;
}

/** Repair truncated JSON: close unterminated strings, brackets, and braces. */
function tryParseJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let candidate = text.slice(start);
  // Strip trailing code fence if present
  candidate = candidate.replace(/```[\s\S]*$/, '').trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // attempt repair of truncated JSON
  }

  let inString = false;
  let escape = false;
  const stack: string[] = [];
  for (const ch of candidate) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  let repaired = candidate;
  if (inString) repaired += '"';
  // Drop trailing comma/colon fragments
  repaired = repaired.replace(/[,:]\s*$/, '');
  while (stack.length > 0) repaired += stack.pop();

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

function parseAuditResponse(raw: string, lessonId: number): AuditReport {
  const timestamp = new Date().toISOString();
  const parsedJson = tryParseJson(raw);

  if (parsedJson) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = parsedJson as any;
      const grade = typeof parsed.grade === 'string' ? parsed.grade : 'F';
      const scoreRaw = Number(parsed.score);
      const score = Number.isFinite(scoreRaw) ? Math.min(100, Math.max(0, Math.round(scoreRaw))) : 0;
      const summary = typeof parsed.summary === 'string' ? parsed.summary : 'No summary provided.';
      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.filter((s: unknown) => typeof s === 'string') : [];
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((w: unknown) => typeof w === 'string') : [];
      const fixes = Array.isArray(parsed.fixes)
        ? parsed.fixes.filter(
            (f: unknown) =>
              typeof f === 'object' &&
              f !== null &&
              typeof (f as Record<string, unknown>).issue === 'string' &&
              typeof (f as Record<string, unknown>).fix === 'string' &&
              typeof (f as Record<string, unknown>).severity === 'string'
          )
        : [];

      const subscores: AuditSubscores = {
        reasoning_loop: clampScore(parsed.subscores?.reasoning_loop),
        tool_definitions: clampScore(parsed.subscores?.tool_definitions),
        error_handling: clampScore(parsed.subscores?.error_handling),
        prompt_design: clampScore(parsed.subscores?.prompt_design),
      };

      return { grade, score, summary, strengths, weaknesses, fixes, subscores, timestamp, lessonId };
    } catch {
      // fall through to error fallback
    }
  }

  console.error('[Auditor] Failed to parse LLM response. Raw output:', raw.slice(0, 500));

  return {
    grade: 'F',
    score: 0,
    summary: 'Failed to parse audit response from LLM.',
    strengths: [],
    weaknesses: ['Unable to complete audit analysis.'],
    fixes: [{ issue: 'Audit parsing failed', fix: 'Retry or submit valid code', severity: 'critical' }],
    subscores: { reasoning_loop: 0, tool_definitions: 0, error_handling: 0, prompt_design: 0 },
    timestamp,
    lessonId,
  };
}

function clampScore(val: unknown): number {
  const num = Number(val);
  return Number.isFinite(num) ? Math.min(100, Math.max(0, Math.round(num))) : 0;
}

function generateMarkdown(report: AuditReport): string {
  const lines = [
    `# Agent Audit Report`,
    ``,
    `**Grade:** ${report.grade} (${report.score}/100)`,
    `**Audited:** ${new Date(report.timestamp).toLocaleString()}`,
    ``,
    `## Summary`,
    report.summary,
    ``,
  ];

  if (report.strengths.length > 0) {
    lines.push(`## Strengths`);
    report.strengths.forEach(s => lines.push(`- ${s}`));
    lines.push(``);
  }

  if (report.weaknesses.length > 0) {
    lines.push(`## Weaknesses`);
    report.weaknesses.forEach(w => lines.push(`- ${w}`));
    lines.push(``);
  }

  if (report.fixes.length > 0) {
    lines.push(`## Recommended Fixes`);
    report.fixes.forEach(f => {
      lines.push(`### ${f.issue}`);
      lines.push(`**Fix:** ${f.fix}`);
      lines.push(`**Severity:** ${f.severity}`);
      lines.push(``);
    });
  }

  lines.push(`## Subscores`);
  lines.push(`- Reasoning Loop: ${report.subscores.reasoning_loop}/100`);
  lines.push(`- Tool Definitions: ${report.subscores.tool_definitions}/100`);
  lines.push(`- Error Handling: ${report.subscores.error_handling}/100`);
  lines.push(`- Prompt Design: ${report.subscores.prompt_design}/100`);
  lines.push(``);

  return lines.join('\n');
}

/** Audit agent code and return structured report + markdown version. */
export async function auditAgent(code: string, lessonId: number): Promise<AuditOutput> {
  if (!code || code.length === 0) {
    const errorReport: AuditReport = {
      grade: 'F',
      score: 0,
      summary: 'No code provided for audit.',
      strengths: [],
      weaknesses: ['Empty or missing code input.'],
      fixes: [{ issue: 'No code', fix: 'Submit valid agent code', severity: 'critical' }],
      subscores: { reasoning_loop: 0, tool_definitions: 0, error_handling: 0, prompt_design: 0 },
      timestamp: new Date().toISOString(),
      lessonId,
    };
    return { json: errorReport, markdown: generateMarkdown(errorReport) };
  }

  const systemPrompt = buildAuditSystemPrompt(lessonId);
  const userPrompt = `Review this agent code:\n\`\`\`js\n${code.slice(0, 8000)}\n\`\`\``;

  try {
    const raw = await callOpenRouterRaw(systemPrompt, userPrompt, 4000);
    const report = parseAuditResponse(raw, lessonId);
    const markdown = generateMarkdown(report);
    return { json: report, markdown };
  } catch (err) {
    const errorReport: AuditReport = {
      grade: 'F',
      score: 0,
      summary: `Audit request failed: ${err instanceof Error ? err.message : String(err)}`,
      strengths: [],
      weaknesses: ['LLM call error.'],
      fixes: [{ issue: 'Audit failed', fix: 'Retry audit', severity: 'critical' }],
      subscores: { reasoning_loop: 0, tool_definitions: 0, error_handling: 0, prompt_design: 0 },
      timestamp: new Date().toISOString(),
      lessonId,
    };
    return { json: errorReport, markdown: generateMarkdown(errorReport) };
  }
}
