export const MOCK_RESPONSES: Record<string, string> = {
  '07_simple-agent': `The agent received your query and is thinking...
Thought: I need to use a tool to help with this.
Action: Call search_tool with your query.
Observation: Found relevant information.
Final Answer: Based on the search, here's the answer to your question.`,

  '09_react-agent': `[Thought] I need to gather information and act.
[Action] Calling tool: get_weather with city="NYC"
[Observation] Weather in NYC: 72°F, sunny
[Thought] Good, I have the information I need.
[Final Answer] The weather in NYC is sunny and 72°F.`,

  '10_aot-agent': `Planning the task:
Step 1: Gather requirements
Step 2: Decompose into subtasks
Step 3: Execute in dependency order
Step 4: Aggregate results

Execution starting...
✓ Subtask 1 complete
✓ Subtask 2 complete
✓ Subtask 3 complete
✓ All tasks complete`,

  '12_tree-of-thought': `Generating 3 reasoning branches...
Branch A: Direct approach → score 0.7
Branch B: Decomposition → score 0.85
Branch C: Sequential reasoning → score 0.6

Best branch (B) scores 0.85
Executing branch B...
✓ Solution found with confidence 0.85`,

  '14_chain-of-thought': `Reasoning phase 1 (facts): Gathered 5 relevant facts
Reasoning phase 2 (signals): Derived 3 key insights
Reasoning phase 3 (policy): Applied decision rules
Reasoning phase 4 (final): Reached conclusion

Audit trail:
[Fact] Input premise A
[Signal] Implication B from A
[Policy] Rule C applies
[Decision] Conclusion D`,
};

export async function mockLLM(lessonId: string, prompt: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

  const response = MOCK_RESPONSES[lessonId];
  if (!response) {
    return `[Mock LLM] No response defined for lesson ${lessonId}.\n\nPrompt received: "${prompt.slice(0, 100)}..."`;
  }

  // Return response with a brief echo of the prompt
  return `[Mock LLM Response for ${lessonId}]\n\nUser input: "${prompt.slice(0, 50)}..."\n\n${response}`;
}
