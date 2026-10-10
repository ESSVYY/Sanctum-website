begin;
create function public.crm_metrics() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'total_leads',(select count(*) from public.leads where archived_at is null),
    'new_leads',(select count(*) from public.leads where archived_at is null and status='NEW'),
    'qualified_leads',(select count(*) from public.leads where archived_at is null and status='QUALIFIED'),
    'won_leads',(select count(*) from public.leads where archived_at is null and status='WON'),
    'active_customers',(select count(*) from public.customers where archived_at is null and status='ACTIVE'),
    'pipeline_value',(select coalesce(sum(value),0) from public.deals where archived_at is null and status not in ('WON','LOST')),
    'open_deals',(select count(*) from public.deals where archived_at is null and status not in ('WON','LOST')),
    'overdue_tasks',(select count(*) from public.tasks where archived_at is null and status<>'DONE' and due_at<now()),
    'proposals_sent',(select count(*) from public.proposals where archived_at is null and status='SENT'),
    'proposals_accepted',(select count(*) from public.proposals where archived_at is null and status='ACCEPTED'),
    'stages',(select coalesce(jsonb_agg(row_to_json(stage)),'[]'::jsonb) from (select status,count(*) as count from public.leads where archived_at is null group by status) stage),
    'workload',(select coalesce(jsonb_agg(row_to_json(work)),'[]'::jsonb) from (select p.full_name,p.email,count(t.id) as count from public.profiles p join public.tasks t on t.assigned_to=p.id where t.archived_at is null and t.status<>'DONE' group by p.id,p.full_name,p.email) work)
  )
$$;
create function public.replace_proposal_items(proposal uuid, items jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare item jsonb; position integer:=0;
begin
  if not private.record_access('proposals',proposal) or jsonb_typeof(items)<>'array' or jsonb_array_length(items)>100 then raise exception 'Invalid proposal items'; end if;
  -- Serialize concurrent edits and keep replacement atomic.
  perform 1 from public.proposals where id=proposal for update;
  delete from public.proposal_items where proposal_id=proposal;
  for item in select * from jsonb_array_elements(items) loop
    if length(item->>'description') not between 1 and 1000 then raise exception 'Invalid description'; end if;
    insert into public.proposal_items(proposal_id,description,quantity,unit_cost,position)
    values(proposal,item->>'description',(item->>'quantity')::numeric,(item->>'unit_cost')::numeric,position);
    position:=position+1;
  end loop;
end $$;
revoke all on function public.crm_metrics(),public.replace_proposal_items(uuid,jsonb) from public,anon;
grant execute on function public.crm_metrics(),public.replace_proposal_items(uuid,jsonb) to authenticated;
commit;
