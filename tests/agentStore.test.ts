import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { agentStore, SavedAgent } from '@/lib/agentStore';

describe('AgentStore (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save and list agents', async () => {
    const agent = await agentStore.save({
      name: 'Test Agent',
      lessonId: '09_react-agent',
      code: 'const x = 1;',
    });
    expect(agent.id).toBeDefined();
    expect(agent.createdAt).toBeGreaterThan(0);

    const agents = await agentStore.list();
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('Test Agent');
  });

  it('should load agent by id', async () => {
    const saved = await agentStore.save({
      name: 'Agent 1',
      lessonId: '09_react-agent',
      code: 'const y = 2;',
    });

    const loaded = await agentStore.load(saved.id);
    expect(loaded.code).toBe('const y = 2;');
  });

  it('should delete agent', async () => {
    const saved = await agentStore.save({
      name: 'Agent 2',
      lessonId: '09_react-agent',
      code: 'const z = 3;',
    });

    await agentStore.delete(saved.id);
    const agents = await agentStore.list();
    expect(agents).toHaveLength(0);
  });

  it('should rename agent', async () => {
    const saved = await agentStore.save({
      name: 'Old Name',
      lessonId: '09_react-agent',
      code: 'const a = 4;',
    });

    const renamed = await agentStore.rename(saved.id, 'New Name');
    expect(renamed.name).toBe('New Name');
    expect(renamed.updatedAt).toBeGreaterThan(saved.createdAt);
  });

  it('should throw on load non-existent', async () => {
    await expect(agentStore.load('fake-id')).rejects.toThrow('not found');
  });
});
