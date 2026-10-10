begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('crm-files','crm-files',false,5242880,array['application/pdf','image/png','image/jpeg','text/plain']);
create function private.file_access(path text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.attachments a where a.storage_path=path and a.archived_at is null
    and private.record_access('attachments',a.id)
    and (a.customer_id is null or private.record_access('customers',a.customer_id))
    and (a.proposal_id is null or private.record_access('proposals',a.proposal_id)))
$$;
create function private.file_upload(path text) returns boolean language sql stable security definer set search_path='' as $$
  select private.file_access(path) and exists(select 1 from public.attachments where storage_path=path and not uploaded and created_by=auth.uid())
$$;
revoke all on function private.file_access(text),private.file_upload(text) from public;
grant execute on function private.file_access(text),private.file_upload(text) to authenticated;
create policy crm_file_read on storage.objects for select to authenticated using(bucket_id='crm-files' and private.file_access(name));
create policy crm_file_insert on storage.objects for insert to authenticated with check(bucket_id='crm-files' and private.file_upload(name));
-- No overwrite/delete policy. Archival revokes new signed links; server-generated
-- links expire in 60 seconds. Physical deletion is a controlled retention job.
commit;
