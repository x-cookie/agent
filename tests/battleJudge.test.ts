import { describe, it, expect } from 'vitest';
import { parseJudgeResponse } from '@/lib/battleJudge';

describe('parseJudgeResponse', () => {
  it('parses a clean JSON winner response', () => {
    const raw = '{"winner": "a", "reasoning": "Agent A reasoned more precisely about the tradeoff."}';
    const result = parseJudgeResponse(raw);
    expect(result.winner).toBe('a');
    expect(result.reasoning).toBe('Agent A reasoned more precisely about the tradeoff.');
  });

  it('parses JSON wrapped in a markdown code fence', () => {
    const raw = '```json\n{"winner": "b", "reasoning": "Agent B was more concise."}\n```';
    const result = parseJudgeResponse(raw);
    expect(result.winner).toBe('b');
    expect(result.reasoning).toBe('Agent B was more concise.');
  });

  it('falls back to tie with a generic reasoning when the response has no valid JSON', () => {
    const result = parseJudgeResponse('The model refused to answer.');
    expect(result.winner).toBe('tie');
    expect(result.reasoning).toBe('Judge response could not be parsed.');
  });

  it('falls back to tie when winner field is not a/b/tie', () => {
    const raw = '{"winner": "agent A", "reasoning": "unclear"}';
    const result = parseJudgeResponse(raw);
    expect(result.winner).toBe('tie');
  });

  it('accepts a "reason" key as an alias for "reasoning"', () => {
    const raw = '{"winner": "a", "reason": "Agent A was more concise."}';
    const result = parseJudgeResponse(raw);
    expect(result.winner).toBe('a');
    expect(result.reasoning).toBe('Agent A was more concise.');
  });
});
