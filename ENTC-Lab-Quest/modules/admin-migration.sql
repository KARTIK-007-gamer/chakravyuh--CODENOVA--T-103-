-- Run once in Supabase SQL Editor for projects that already ran schema.sql.
alter type public.account_role add value if not exists 'admin';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role::text = 'admin'
  );
$$;

create or replace function public.protect_profile_access_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and (new.role is distinct from old.role or new.section is distinct from old.section)
    and not public.is_admin() then
    raise exception 'Only administrators can change account roles and sections.';
  end if;
  return new;
end;
$$;

create trigger protect_profile_access_fields
before update on public.profiles
for each row execute procedure public.protect_profile_access_fields();

drop policy "Users read own profile; teachers read their sections" on public.profiles;
create policy "Users read own profile; teachers read their sections; admins read all"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
  or (section is not null and public.is_teacher_for(section))
);

create policy "Admins update profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy "Users read their teacher-section assignments" on public.teacher_sections;
create policy "Users and admins read teacher-section assignments"
on public.teacher_sections for select to authenticated
using (teacher_id = (select auth.uid()) or public.is_admin());
create policy "Admins assign teacher sections"
on public.teacher_sections for insert to authenticated
with check (public.is_admin());
create policy "Admins update teacher sections"
on public.teacher_sections for update to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Admins remove teacher sections"
on public.teacher_sections for delete to authenticated
using (public.is_admin());

revoke update on public.profiles from authenticated;
grant update (full_name, role, section) on public.profiles to authenticated;
grant insert, update, delete on public.teacher_sections to authenticated;
