-- Extends the existing CRM; run after the three 20261009 migrations.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  title text not null check(length(title) between 5 and 200),
  slug text not null unique check(length(slug) between 3 and 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null check(length(excerpt) between 20 and 500),
  content text not null check(length(content) between 100 and 100000),
  cover_image text not null default '' check(length(cover_image)<=2048 and (cover_image='' or cover_image ~* '^https://' or cover_image ~ '^/[^/]')),
  author text not null check(length(author) between 2 and 120),
  category text not null check(category in ('Custom AI','Computer Vision','Predictive Analytics','Automation')),
  tags text[] not null default '{}' check(cardinality(tags)<=12),
  seo_title text not null default '' check(length(seo_title)<=200),
  seo_description text not null default '' check(length(seo_description)<=500),
  featured boolean not null default false,
  status text not null default 'draft' check(status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(status<>'published' or published_at is not null)
);
create index blog_published_idx on public.blog_posts(published_at desc) where status='published';
create index blog_org_idx on public.blog_posts(organization_id,updated_at desc);
alter table public.blog_posts enable row level security;
grant select on public.blog_posts to anon,authenticated;
grant insert,update,delete on public.blog_posts to authenticated;
create policy public_published_blog on public.blog_posts for select to anon,authenticated
  using(status='published' and published_at<=now());
create policy managers_read_blog on public.blog_posts for select to authenticated
  using(organization_id=private.current_org() and private.manager());
create policy managers_insert_blog on public.blog_posts for insert to authenticated
  with check(organization_id=private.current_org() and private.manager());
create policy managers_update_blog on public.blog_posts for update to authenticated
  using(organization_id=private.current_org() and private.manager())
  with check(organization_id=private.current_org() and private.manager());
create policy managers_delete_blog on public.blog_posts for delete to authenticated
  using(organization_id=private.current_org() and private.manager());

create function private.guard_blog_post() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='UPDATE' then
    if new.id<>old.id or new.organization_id<>old.organization_id or new.created_at<>old.created_at then
      raise exception 'Immutable blog ownership';
    end if;
    new.updated_at:=now();
  end if;
  if new.status='published' then
    new.published_at:=coalesce(new.published_at,now());
  end if;
  return new;
end $$;
revoke all on function private.guard_blog_post() from public;
create trigger guard_blog_post before insert or update on public.blog_posts for each row execute function private.guard_blog_post();
-- The CRM audit trigger assumes assignment fields; use its audit table with
-- a blog-specific trigger that records field names, never article content.
create function private.audit_blog_post() returns trigger language plpgsql security definer set search_path='' as $$
declare changed text[];
begin
  if TG_OP='UPDATE' then
    select array_agg(key) into changed from jsonb_each(to_jsonb(new))
    where value is distinct from to_jsonb(old)->key and key<>'updated_at';
  end if;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,changed_fields)
  values(new.organization_id,auth.uid(),TG_OP,'blog_posts',new.id,coalesce(changed,'{}'));
  return new;
end $$;
revoke all on function private.audit_blog_post() from public;
create trigger audit_blog_post after insert or update on public.blog_posts for each row execute function private.audit_blog_post();
