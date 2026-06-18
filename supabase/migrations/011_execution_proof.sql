-- Phase 3: verifiable execution. Each paid run gets an on-chain memo receipt
-- recording a hash of its output, so the result can't be silently altered later.

alter table execution_logs add column proof_tx text;
alter table execution_logs add column output_hash text;
