  -- Classify how an agent ended up in a user's collection: built from scratch,
  -- forked from a free listing, or purchased from a paid listing.

  alter table agents add column source text not null default 'created'
    check (source in ('created', 'forked_free', 'purchased'));
