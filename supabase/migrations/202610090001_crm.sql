-- Additive Sanctum CRM migration. Review against an existing database before applying.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id),
  full_name text not null default '', email text not null check(email=lower(trim(email))),
  role text not null default 'STAFF' check(role in ('SUPER_ADMIN','ADMIN','STAFF')),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,email)
);
create index profiles_org_idx on public.profiles(organization_id);
create function private.current_org() returns uuid language sql stable security definer set search_path='' as $$
  select organization_id from public.profiles where id=auth.uid() and active
  and (not exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified') or auth.jwt()->>'aal'='aal2')
$$;
create function private.current_role() returns text language sql stable security definer set search_path='' as $$
  select role from public.profiles where id=auth.uid() and organization_id=private.current_org() and active
$$;
create function private.manager() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(private.current_role() in ('SUPER_ADMIN','ADMIN'), false)
$$;

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  email text not null check(email=lower(trim(email))), full_name text not null default '',
  role text not null check(role in ('ADMIN','STAFF')), invited_by uuid not null references public.profiles(id),
  status text not null default 'PENDING' check(status in ('PENDING','ACCEPTED','CANCELLED')),
  expires_at timestamptz not null default now()+interval '7 days',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,email)
);
create unique index one_pending_invitation_per_email on public.staff_invitations(email) where status='PENDING';

create table public.customers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null check(length(name) between 1 and 200), email text check(email=lower(trim(email))),
  phone text, industry text, website text, primary_contact text, services text, notes text,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','PROSPECT','INACTIVE')),
  assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index customers_email_unique on public.customers(organization_id,email) where email is not null and archived_at is null;
create table public.customer_team (
  customer_id uuid not null references public.customers(id) on delete cascade,
  profile_id uuid not null references public.profiles(id), primary key(customer_id,profile_id)
);
create function private.customer_member(customer uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.customer_team where customer_id=customer and profile_id=auth.uid())
$$;
create table public.contacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id), name text not null, email text check(email=lower(trim(email))),
  phone text, job_title text, notes text, assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index contacts_email_unique on public.contacts(customer_id,email) where email is not null and archived_at is null;
create index contacts_customer_idx on public.contacts(customer_id);
create table public.leads (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, email text not null check(email=lower(trim(email))), phone text, company text, website text,
  requested_service text, estimated_budget numeric(14,2) check(estimated_budget>=0), message text, notes text,
  source text not null default 'INTERNAL',
  status text not null default 'NEW' check(status in ('NEW','QUALIFIED','MEETING','PROPOSAL','WON','LOST')),
  follow_up_at timestamptz, customer_id uuid references public.customers(id), assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id), archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index leads_email_duplicates_idx on public.leads(organization_id,email);
create index leads_followup_idx on public.leads(organization_id,follow_up_at) where archived_at is null;
create table public.deals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, customer_id uuid references public.customers(id), lead_id uuid references public.leads(id),
  status text not null default 'NEW' check(status in ('NEW','QUALIFIED','MEETING','PROPOSAL','WON','LOST')),
  value numeric(14,2) not null default 0 check(value>=0), probability integer not null default 0 check(probability between 0 and 100),
  expected_close date, notes text, assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, description text, customer_id uuid references public.customers(id), lead_id uuid references public.leads(id), deal_id uuid references public.deals(id),
  status text not null default 'TODO' check(status in ('TODO','IN_PROGRESS','DONE')),
  priority text not null default 'MEDIUM' check(priority in ('LOW','MEDIUM','HIGH','URGENT')),
  due_at timestamptz, assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.proposals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, customer_id uuid not null references public.customers(id), deal_id uuid references public.deals(id),
  status text not null default 'DRAFT' check(status in ('DRAFT','SENT','ACCEPTED','REJECTED')),
  notes text, currency text not null default 'NZD' check(currency ~ '^[A-Z]{3}$'),
  assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.proposal_items (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.proposals(id) on delete cascade,
  description text not null, quantity numeric(12,2) not null default 1 check(quantity>0), unit_cost numeric(14,2) not null default 0 check(unit_cost>=0),
  position integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.activities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, body text not null, customer_id uuid references public.customers(id), lead_id uuid references public.leads(id),
  deal_id uuid references public.deals(id), proposal_id uuid references public.proposals(id),
  kind text not null default 'NOTE' check(kind in ('NOTE','CALL','MEETING','EMAIL','STATUS')),
  assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, customer_id uuid references public.customers(id), proposal_id uuid references public.proposals(id),
  storage_path text not null unique, mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg','text/plain')),
  size_bytes integer not null check(size_bytes between 1 and 5242880), uploaded boolean not null default false,
  assigned_to uuid references public.profiles(id), created_by uuid references public.profiles(id),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(customer_id is not null or proposal_id is not null)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  profile_id uuid not null references public.profiles(id), title text not null, href text not null, read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid,
  changed_fields text[] not null default '{}', created_at timestamptz not null default now()
);
create index audit_org_created_idx on public.audit_logs(organization_id,created_at desc);
create index notifications_profile_idx on public.notifications(profile_id,created_at desc);
create index items_proposal_idx on public.proposal_items(proposal_id);
create index deals_customer_idx on public.deals(customer_id);
create index deals_lead_idx on public.deals(lead_id);
create index tasks_due_idx on public.tasks(organization_id,due_at) where archived_at is null and status<>'DONE';
create index tasks_customer_idx on public.tasks(customer_id);
create index tasks_lead_idx on public.tasks(lead_id);
create index tasks_deal_idx on public.tasks(deal_id);
create index proposals_customer_idx on public.proposals(customer_id);
create index proposals_deal_idx on public.proposals(deal_id);
create index activities_customer_idx on public.activities(customer_id,created_at desc);
create index activities_lead_idx on public.activities(lead_id,created_at desc);
create index activities_deal_idx on public.activities(deal_id,created_at desc);
create index activities_proposal_idx on public.activities(proposal_id,created_at desc);
create index attachments_customer_idx on public.attachments(customer_id);
create index attachments_proposal_idx on public.attachments(proposal_id);

create function private.record_access(entity text, record_id uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare allowed boolean;
begin
  if entity not in ('customers','contacts','leads','deals','tasks','proposals','activities','attachments') or record_id is null then return false; end if;
  execute format('select organization_id=private.current_org() and (private.manager() or assigned_to=auth.uid()%s) from public.%I where id=$1',
    case when entity='customers' then ' or exists(select 1 from public.customer_team ct where ct.customer_id=id and ct.profile_id=auth.uid())' else '' end, entity)
    into allowed using record_id;
  return coalesce(allowed,false);
end $$;

-- Validate all assignments and links, including direct REST writes, and prevent staff
-- from reassigning, moving tenants, changing ownership or archiving records.
create function private.guard_record() returns trigger language plpgsql security definer set search_path='' as $$
declare payload jsonb := to_jsonb(new); old_payload jsonb; ref record; linked_org uuid; assignee uuid;
begin
  if length(trim(coalesce(payload->>'name',''))) not between 1 and 200 then raise exception 'Invalid name'; end if;
  if payload->>'email' is not null and (length(payload->>'email')>254 or payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid email'; end if;
  if length(coalesce(payload->>'phone',''))>50 or length(coalesce(payload->>'notes',''))>5000 or length(coalesce(payload->>'message',''))>5000 or length(coalesce(payload->>'body',''))>5000 then raise exception 'Input too long'; end if;
  if TG_OP='UPDATE' then
    old_payload:=to_jsonb(old);
    if new.id<>old.id or new.organization_id<>old.organization_id or new.created_by is distinct from old.created_by then raise exception 'Immutable ownership'; end if;
    if auth.uid() is not null and not private.manager() and (new.assigned_to is distinct from old.assigned_to or new.archived_at is distinct from old.archived_at) then raise exception 'Assignment or archive permission denied'; end if;
  elsif auth.uid() is not null then
    new.created_by:=auth.uid();
    if not private.manager() then new.assigned_to:=auth.uid(); end if;
  end if;
  assignee:=new.assigned_to;
  if assignee is not null and not exists(select 1 from public.profiles where id=assignee and organization_id=new.organization_id and active) then raise exception 'Invalid assignee'; end if;
  for ref in select * from (values ('customer_id','customers'),('lead_id','leads'),('deal_id','deals'),('proposal_id','proposals')) as refs(field,entity) loop
    if payload->>ref.field is not null then
      execute format('select organization_id from public.%I where id=$1',ref.entity) into linked_org using (payload->>ref.field)::uuid;
      if linked_org is distinct from new.organization_id then raise exception 'Invalid related record'; end if;
      if auth.uid() is not null and not private.record_access(ref.entity,(payload->>ref.field)::uuid) then raise exception 'Related record access denied'; end if;
    end if;
  end loop;
  if TG_TABLE_NAME='attachments' then
    if new.storage_path<>new.organization_id::text||'/'||new.id::text then raise exception 'Invalid storage path'; end if;
    if TG_OP='UPDATE' and (payload->>'storage_path' is distinct from old_payload->>'storage_path' or payload->>'mime_type' is distinct from old_payload->>'mime_type' or payload->>'size_bytes' is distinct from old_payload->>'size_bytes') then raise exception 'Immutable file metadata'; end if;
  end if;
  new.updated_at:=now();
  return new;
end $$;
create function private.audit_record() returns trigger language plpgsql security definer set search_path='' as $$
declare changed text[]; payload jsonb:=to_jsonb(new);
begin
  if TG_OP='UPDATE' then select array_agg(key) into changed from jsonb_each(payload) where value is distinct from to_jsonb(old)->key and key<>'updated_at'; end if;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,changed_fields)
  values(new.organization_id,auth.uid(),TG_OP,TG_TABLE_NAME,new.id,coalesce(changed,'{}'));
  if TG_OP='UPDATE' and TG_TABLE_NAME in ('leads','deals','proposals') and payload->>'status' is distinct from to_jsonb(old)->>'status' then
    insert into public.activities(organization_id,name,body,kind,lead_id,deal_id,proposal_id,assigned_to,created_by)
    values(new.organization_id,'Status changed',coalesce(to_jsonb(old)->>'status','')||' → '||coalesce(payload->>'status',''),'STATUS',
      case when TG_TABLE_NAME='leads' then new.id end,case when TG_TABLE_NAME='deals' then new.id end,case when TG_TABLE_NAME='proposals' then new.id end,new.assigned_to,auth.uid());
  end if;
  if TG_TABLE_NAME='tasks' and new.assigned_to is not null and (TG_OP='INSERT' or payload->>'assigned_to' is distinct from to_jsonb(old)->>'assigned_to') then
    insert into public.notifications(organization_id,profile_id,title,href) values(new.organization_id,new.assigned_to,'A task has been assigned to you','/admin/tasks/'||new.id);
  end if;
  return new;
end $$;
do $$ declare entity text; begin
  foreach entity in array array['customers','contacts','leads','deals','tasks','proposals','activities','attachments'] loop
    execute format('create index %I on public.%I(organization_id,assigned_to,created_at desc)',entity||'_org_assignment_idx',entity);
    execute format('alter table public.%I enable row level security',entity);
    execute format('create policy read_records on public.%I for select to authenticated using(organization_id=private.current_org() and (private.manager() or assigned_to=auth.uid()%s))',entity,case when entity='customers' then ' or private.customer_member(id)' else '' end);
    execute format('create policy insert_records on public.%I for insert to authenticated with check(organization_id=private.current_org() and (private.manager() or assigned_to=auth.uid()))',entity);
    execute format('create policy update_records on public.%I for update to authenticated using(private.record_access(%L,id)) with check(organization_id=private.current_org() and private.record_access(%L,id))',entity,entity,entity);
    execute format('create trigger guard_record before insert or update on public.%I for each row execute function private.guard_record()',entity);
    execute format('create trigger audit_record after insert or update on public.%I for each row execute function private.audit_record()',entity);
    execute format('revoke all on public.%I from anon,authenticated',entity);
    execute format('grant select,insert,update on public.%I to authenticated',entity);
  end loop;
end $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.customer_team enable row level security;
alter table public.proposal_items enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
create policy organization_read on public.organizations for select to authenticated using(id=private.current_org());
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or organization_id=private.current_org());
create policy invitations_read on public.staff_invitations for select to authenticated using(organization_id=private.current_org() and private.manager());
create policy team_read on public.customer_team for select to authenticated using(private.record_access('customers',customer_id));
create policy items_read on public.proposal_items for select to authenticated using(private.record_access('proposals',proposal_id));
create policy items_insert on public.proposal_items for insert to authenticated with check(private.record_access('proposals',proposal_id));
create policy items_update on public.proposal_items for update to authenticated using(private.record_access('proposals',proposal_id)) with check(private.record_access('proposals',proposal_id));
create policy items_delete on public.proposal_items for delete to authenticated using(private.record_access('proposals',proposal_id));
create policy notifications_read on public.notifications for select to authenticated using(organization_id=private.current_org() and profile_id=auth.uid());
create policy notifications_update on public.notifications for update to authenticated using(organization_id=private.current_org() and profile_id=auth.uid()) with check(organization_id=private.current_org() and profile_id=auth.uid());
create function private.touch_timestamp() returns trigger language plpgsql set search_path='' as $$begin new.updated_at:=now();return new;end$$;
create trigger notification_timestamp before update on public.notifications for each row execute function private.touch_timestamp();
create policy audit_read on public.audit_logs for select to authenticated using(organization_id=private.current_org() and private.current_role()='SUPER_ADMIN');
revoke all on public.organizations,public.profiles,public.staff_invitations,public.customer_team,public.proposal_items,public.notifications,public.audit_logs from anon,authenticated;
grant select on public.organizations,public.profiles,public.staff_invitations,public.customer_team,public.audit_logs to authenticated;
grant select,insert,update,delete on public.proposal_items to authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
-- Keep line-item ownership immutable and log item changes without storing customer text.
create function private.guard_item() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid; pid uuid;
begin
  if TG_OP='UPDATE' and (new.id<>old.id or new.proposal_id<>old.proposal_id) then raise exception 'Immutable proposal item'; end if;
  if TG_OP='DELETE' then pid:=old.proposal_id; else pid:=new.proposal_id; end if;
  select organization_id into org from public.proposals where id=pid;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id) values(org,auth.uid(),TG_OP,'proposal_items',pid);
  if TG_OP='DELETE' then return old; end if;
  new.updated_at:=now(); return new;
end $$;
create trigger item_guard before insert or update or delete on public.proposal_items for each row execute function private.guard_item();

create function public.invite_staff(email_input text, name_input text, role_input text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation_id uuid;
begin
  if not private.manager() or role_input not in ('ADMIN','STAFF') or (role_input='ADMIN' and private.current_role()<>'SUPER_ADMIN') then raise exception 'Permission denied'; end if;
  if length(email_input)>254 or lower(trim(email_input)) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if exists(select 1 from public.profiles where email=lower(trim(email_input))) then raise exception 'User already exists'; end if;
  insert into public.staff_invitations(organization_id,email,full_name,role,invited_by) values(private.current_org(),lower(trim(email_input)),left(name_input,200),role_input,auth.uid())
  on conflict(organization_id,email) do update set full_name=excluded.full_name,role=excluded.role,invited_by=auth.uid(),status='PENDING',expires_at=now()+interval '7 days',updated_at=now()
  returning id into invitation_id;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id) values(private.current_org(),auth.uid(),'INVITE','staff_invitations',invitation_id);
  return invitation_id;
end $$;
create function private.on_invited_user() returns trigger language plpgsql security definer set search_path='' as $$
declare invitation public.staff_invitations;
begin
  select * into invitation from public.staff_invitations where email=lower(trim(new.email)) and status='PENDING' and expires_at>now() for update;
  if invitation.id is not null then
    if not exists(select 1 from public.profiles where id=invitation.invited_by and active and organization_id=invitation.organization_id and (role='SUPER_ADMIN' or (role='ADMIN' and invitation.role='STAFF'))) then raise exception 'Invitation no longer authorised'; end if;
    insert into public.profiles(id,organization_id,email,full_name,role) values(new.id,invitation.organization_id,lower(trim(new.email)),invitation.full_name,invitation.role);
    update public.staff_invitations set status='ACCEPTED',updated_at=now() where id=invitation.id;
  end if;
  -- Dashboard-created auth users have no CRM access until manually provisioned.
  return new;
end $$;
create trigger provision_invited_profile after insert on auth.users for each row execute function private.on_invited_user();
create function public.manage_staff(target_id uuid, next_role text, next_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare target public.profiles;
begin
  if not private.manager() then raise exception 'Permission denied'; end if;
  perform 1 from public.organizations where id=private.current_org() for update;
  select * into target from public.profiles where id=target_id and organization_id=private.current_org() for update;
  if target.id is null or next_role not in ('SUPER_ADMIN','ADMIN','STAFF') then raise exception 'Invalid member'; end if;
  if private.current_role()<>'SUPER_ADMIN' and (target.role<>'STAFF' or next_role<>'STAFF') then raise exception 'Privileged role change denied'; end if;
  if target.role='SUPER_ADMIN' and target.active and (next_role<>'SUPER_ADMIN' or not next_active)
     and (select count(*) from public.profiles where organization_id=private.current_org() and role='SUPER_ADMIN' and active)<2 then raise exception 'Last Super Admin cannot be removed'; end if;
  update public.profiles set role=next_role,active=next_active,updated_at=now() where id=target_id;
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,changed_fields) values(target.organization_id,auth.uid(),'MEMBER_UPDATE','profiles',target_id,array['role','active']);
end $$;
create function public.set_customer_team(customer uuid, members uuid[]) returns void language plpgsql security definer set search_path='' as $$
declare member uuid;
begin
  if not private.manager() or not private.record_access('customers',customer) then raise exception 'Permission denied'; end if;
  foreach member in array members loop
    if not exists(select 1 from public.profiles where id=member and organization_id=private.current_org() and active) then raise exception 'Invalid team member'; end if;
  end loop;
  delete from public.customer_team where customer_id=customer;
  insert into public.customer_team(customer_id,profile_id) select customer,unnest(members);
  insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id) values(private.current_org(),auth.uid(),'TEAM_UPDATE','customers',customer);
end $$;
create function public.convert_lead(lead uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare row public.leads; customer uuid;
begin
  if not private.record_access('leads',lead) then raise exception 'Permission denied'; end if;
  select * into row from public.leads where id=lead and archived_at is null for update;
  if row.id is null then raise exception 'Lead unavailable'; end if;
  if row.customer_id is not null then return row.customer_id; end if;
  if exists(select 1 from public.customers where organization_id=row.organization_id and email=row.email and archived_at is null) then raise exception 'Duplicate customer; manager must resolve'; end if;
  insert into public.customers(organization_id,name,email,phone,website,primary_contact,services,notes,assigned_to,created_by)
  values(row.organization_id,coalesce(nullif(row.company,''),row.name),row.email,row.phone,row.website,row.name,row.requested_service,row.message,row.assigned_to,auth.uid()) returning id into customer;
  update public.leads set customer_id=customer,status='WON' where id=lead;
  return customer;
end $$;

-- Only the server's privileged client may ingest public submissions. Anonymous
-- clients have neither table access nor RPC access. Rate limits are atomic/shared.
create table private.rate_limits (key text primary key, hits integer not null, window_end timestamptz not null);
revoke all on private.rate_limits from public,anon,authenticated;
create function public.consume_rate_limit(key_input text, max_hits integer, window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare current_hits integer;
begin
  if length(key_input)>200 or max_hits not between 1 and 100 or window_seconds not between 1 and 86400 then raise exception 'Invalid rate limit'; end if;
  insert into private.rate_limits(key,hits,window_end) values(key_input,1,now()+make_interval(secs=>window_seconds))
  on conflict(key) do update set hits=case when private.rate_limits.window_end<=now() then 1 else private.rate_limits.hits+1 end,
    window_end=case when private.rate_limits.window_end<=now() then now()+make_interval(secs=>window_seconds) else private.rate_limits.window_end end
  returning hits into current_hits;
  return current_hits<=max_hits;
end $$;
create function public.submit_public_lead(org uuid, input jsonb, rate_key text) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.consume_rate_limit('lead:'||rate_key,5,900) then raise exception 'RATE_LIMITED'; end if;
  if length(input->>'name') not between 1 and 200 or length(input->>'email') not between 3 and 254 or length(input->>'message') not between 10 and 5000 then raise exception 'Invalid submission'; end if;
  insert into public.leads(organization_id,name,email,phone,company,website,requested_service,estimated_budget,message,source)
  values(org,input->>'name',lower(trim(input->>'email')),input->>'phone',input->>'company',input->>'website',input->>'requested_service',nullif(input->>'estimated_budget','')::numeric,input->>'message','WEBSITE');
end $$;
revoke all on all functions in schema private from public;
grant execute on function private.current_org(),private.current_role(),private.manager(),private.record_access(text,uuid),private.customer_member(uuid) to authenticated;
revoke all on function public.invite_staff(text,text,text),public.manage_staff(uuid,text,boolean),public.set_customer_team(uuid,uuid[]),public.convert_lead(uuid),public.consume_rate_limit(text,integer,integer),public.submit_public_lead(uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.invite_staff(text,text,text),public.manage_staff(uuid,text,boolean),public.set_customer_team(uuid,uuid[]),public.convert_lead(uuid) to authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer),public.submit_public_lead(uuid,jsonb,text) to service_role;
grant all on all tables in schema public to service_role;
commit;
