-- Agent Evolution stats: power/intel/reputation grow from battles, jobs, and marketplace
-- activity. Level is derived from xp (level N requires N*100 cumulative xp).
alter table agents add column power int not null default 10;
alter table agents add column intel int not null default 10;
alter table agents add column reputation int not null default 0;
alter table agents add column xp int not null default 0;
alter table agents add column level int not null default 1;
