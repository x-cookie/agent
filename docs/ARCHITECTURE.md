# Agent Learn — Architecture & Infrastructure

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| **Hosting** | Vercel | Existing, free tier, Next.js native |
| **Database** | Supabase (PostgreSQL) | Free tier, auth included, realtime capable |
| **Auth** | Supabase Auth | Built-in, no extra service, supports future wallet |
| **Storage** | Supabase Storage | Code/artifacts, free 1GB |
| **Realtime** | Supabase Realtime | Phase 3+ multiplayer, skip phase 1 |

---

## Database Schema (Supabase PostgreSQL)

### Phase 1 Tables

```sql
-- Users (auth via Supabase Auth, but we track metadata)
CREATE TABLE users (
  id UUID PRIMARY KEY,           -- Supabase user ID
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  last_seen TIMESTAMP DEFAULT now()
);

-- Saved agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT,                -- "01_intro", "09_react-agent", etc
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, lesson_id, name)  -- no duplicate agent names per lesson
);

-- Progress (replace localStorage)
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  marked_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Capstone checkpoints (phase 1 basic, phase 2 full)
CREATE TABLE capstone_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stage_id TEXT,                 -- "fundamentals", "agent-patterns", "advanced-reasoning"
  checkpoint_num INT,            -- 1-6 per capstone
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  UNIQUE(user_id, stage_id, checkpoint_num)
);
```

### Phase 2+ Tables (reserve columns, don't populate yet)

```sql
-- Deployments (phase 2)
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  deployed_at TIMESTAMP DEFAULT now(),
  public_url TEXT UNIQUE,        -- agentlearn.fun/agents/{id}
  is_public BOOLEAN DEFAULT false,
  metadata JSONB                 -- for storing extra info
);

-- Execution logs (phase 3)
CREATE TABLE execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID REFERENCES deployments(id),
  executed_by UUID REFERENCES users(id),
  input TEXT,
  output TEXT,
  tokens_used INT,
  cost_cents INT,                -- x402 microtransaction cost
  executed_at TIMESTAMP DEFAULT now()
);

-- On-chain metadata (phase 2, provenance)
CREATE TABLE chain_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  tx_hash TEXT UNIQUE,           -- Solana transaction hash
  minted_at TIMESTAMP,
  metadata_uri TEXT              -- Arweave/IPFS pointer
);
```

---

## API Routes (Vercel Functions)

### Phase 1 Endpoints

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/auth/callback` | GET | Supabase redirect | - |
| `/api/agents` | GET | List user's agents | Required |
| `/api/agents` | POST | Save new agent | Required |
| `/api/agents/[id]` | GET | Load agent code | Required |
| `/api/agents/[id]` | PATCH | Rename agent | Required |
| `/api/agents/[id]` | DELETE | Delete agent | Required |
| `/api/progress` | GET | List completed lessons | Required |
| `/api/progress/[lessonId]` | POST | Mark lesson complete | Required |
| `/api/capstone/[stageId]` | GET | Get capstone progress | Required |
| `/api/capstone/[stageId]/checkpoint/[num]` | POST | Mark checkpoint complete | Required |

### Request/Response Shape

```typescript
// POST /api/agents
{
  "lessonId": "09_react-agent",
  "name": "My ReAct v2",
  "code": "const agent = async (prompt) => { ... }"
}
→ 201
{
  "id": "uuid",
  "name": "My ReAct v2",
  "createdAt": "2026-06-17T...",
  "updatedAt": "2026-06-17T..."
}

// GET /api/agents
→ 200
[
  { "id": "uuid", "name": "...", "lessonId": "...", "createdAt": "..." },
  ...
]

// POST /api/progress/09_react-agent
→ 201
{ "lessonId": "09_react-agent", "completed": true, "markedAt": "..." }
```

---

## Client Architecture

### `agentStore` Abstraction (Phase 1)

```typescript
// src/lib/agentStore.ts
interface SavedAgent {
  id: string;
  name: string;
  lessonId: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

class AgentStore {
  // Public API — same signature, swappable backend
  async list(): Promise<SavedAgent[]>
  async save(agent: Omit<SavedAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedAgent>
  async load(id: string): Promise<SavedAgent>
  async delete(id: string): Promise<void>
  async rename(id: string, newName: string): Promise<SavedAgent>
  
  // Internal — swappable backend
  private backend: 'localStorage' | 'api'
}

// Usage (same everywhere)
const store = new AgentStore();
const agents = await store.list();
await store.save({ name: "v1", lessonId: "09_react-agent", code: "..." });
```

**Phase 1 implementation:** localStorage backend (same as before).
**Phase 2 implementation:** Swap to API backend, no usage changes.

---

## Migration Path (localStorage → Postgres)

### Phase 1 → Phase 2 Transition

**Step 1:** Add auth to the site
- Supabase Auth modal on landing + signup flow
- localStorage still works for logged-out users (read-only)

**Step 2:** Sync localStorage to DB
- On login, POST `/api/sync-legacy`
- Move user's localStorage `agentlearn:agents` → DB agents table
- Delete localStorage, use API from now on

**Step 3:** Drop localStorage
- Phase 2.5, fully sunset localStorage

---

## Data Flow Diagrams

### Phase 1 (No auth yet, localStorage only)

```
Browser
  ↓
[Local Storage: afs_progress, agentlearn:agents]
  ↓
agentStore (localStorage backend)
  ↓
UI (React components)
```

### Phase 1.5 (Auth added, dual-write)

```
Browser
  ↓
[Auth modal] → Supabase Auth
  ↓
agentStore (API backend if logged in, localStorage if not)
  ↓
[If logged in: POST /api/agents → Supabase]
[If not logged in: localStorage]
  ↓
UI
```

### Phase 2+ (Postgres primary)

```
Browser
  ↓
[Auth required] → Supabase Auth
  ↓
agentStore (API backend only)
  ↓
Next.js API routes
  ↓
Supabase PostgreSQL
```

---

## Deployment Checklist

### Phase 1 (MVP)
- [ ] Create Supabase project (free tier)
- [ ] Create PostgreSQL schema (copy above)
- [ ] Create Vercel environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- [ ] Implement `agentStore` with localStorage backend
- [ ] Implement `/api/agents/*` routes (no auth yet, use cookies/sessions)
- [ ] Test: save/load/delete agents via localStorage

### Phase 1.5 (Auth)
- [ ] Add Supabase Auth component to landing
- [ ] Update `agentStore` to check `useUser()` → route to API if logged in
- [ ] Test: signup → save agent → reload → still there

### Phase 2 (Public deployments)
- [ ] Add `deployments` table logic
- [ ] Implement `/api/deploy` endpoint
- [ ] Add public agent URL generation
- [ ] Test: deploy agent → public URL works

---

## Cost Estimate (Free tier all the way to Phase 3)

| Component | Free Tier | Limits | Hit when? |
|---|---|---|---|
| Supabase DB | 500MB | ~100k agents | Phase 3+ if viral |
| Supabase Auth | Unlimited | - | Never (free) |
| Supabase Storage | 1GB | Code storage | Phase 3+ (thousands of agents) |
| Vercel Functions | 100GB/month | Per-function invocations | Phase 2+ if high traffic |
| Vercel Bandwidth | 100GB/month | Download traffic | Phase 3+ marketplace |

**Upgrade strategy:** Phase 2, pay for Supabase Pro ($25/mo) if usage grows. Phase 3, consider Vercel Pro if functions hit limits.

---

## Security Notes

### Phase 1
- No auth yet, so no secrets to protect
- agentStore uses plain localStorage
- DB is read-only (no write API yet)

### Phase 1.5+
- Supabase Auth handles user isolation (RLS = Row-Level Security)
- API routes check `req.user.id` before returning/writing agents
- Code stored in DB is plaintext (fine for now, encryption phase 4+)

### Phase 2+
- Deployments are public-read, but can only be deployed by owner
- x402 microtransactions signed client-side (phase 3)
- On-chain provenance verifiable (phase 2+)

---

## Notes for Future Phases

**Phase 3 (Marketplace):**
- Add `marketplace_listing` table
- Implement `/api/fork` → clone agent for buyer
- Integrate x402 SDK for micropayments

**Phase 4 (Token):**
- Add `token_earnings` table (track per-execution royalties)
- Revenue-share logic in `/api/execute` route

**Phase 5 (Verifiable execution):**
- Consider move to Solana validators (for untamperable execution logs)
- Keep Supabase as metadata cache only
- Implement proof verification

---

## Next Steps

1. ✅ **Approve this architecture**
2. **Create Supabase project** (free tier)
3. **Copy schema** to Supabase SQL editor, run
4. **Set up Vercel env vars**
5. **Implement Phase 1** (agentStore + /api/agents routes)
6. **Test locally** before push

---

**Document version:** 2026-06-17
**Status:** Ready for Phase 1 implementation
**Owner:** Dev team
