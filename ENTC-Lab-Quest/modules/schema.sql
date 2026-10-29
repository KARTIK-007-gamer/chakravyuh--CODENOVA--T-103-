-- Run this file in the Supabase SQL Editor.
create type public.account_role as enum ('student', 'teacher', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.account_role not null default 'student',
  section text check (section in ('A', 'B', 'C')),
  created_at timestamptz not null default now()
);

create table public.teacher_sections (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('A', 'B', 'C')),
  primary key (teacher_id, section)
);

create table public.module_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null check (module_key in ('overview', 'logic', 'signals', 'quiz', 'tutor')),
  xp integer not null default 0 check (xp >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_key)
);

create table public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  created_at timestamptz not null default now()
);

create table public.assignments (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('A', 'B', 'C')),
  activity text not null,
  due_on date not null,
  created_at timestamptz not null default now()
);

create function public.is_teacher_for(target_section text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.teacher_sections ts
    where ts.teacher_id = (select auth.uid())
      and ts.section = target_section
  );
$$;

create function public.is_admin()
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

create function public.protect_profile_access_fields()
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

alter table public.profiles enable row level security;
alter table public.teacher_sections enable row level security;
alter table public.module_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.assignments enable row level security;

create policy "Users read own profile; teachers read their sections"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.is_admin()
  or (section is not null and public.is_teacher_for(section))
);
create policy "Users update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
create policy "Admins update profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Users read their teacher-section assignments"
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

create policy "Read own progress or assigned students' progress"
on public.module_progress for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = module_progress.user_id
      and p.section is not null
      and public.is_teacher_for(p.section)
  )
);
create policy "Users insert own progress"
on public.module_progress for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "Users update own progress"
on public.module_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Read own quiz attempts or assigned students' attempts"
on public.quiz_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = quiz_attempts.user_id
      and p.section is not null
      and public.is_teacher_for(p.section)
  )
);
create policy "Users insert own quiz attempts"
on public.quiz_attempts for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Teachers read assignments for their sections"
on public.assignments for select to authenticated
using (public.is_teacher_for(section));
create policy "Students read their section assignments"
on public.assignments for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.section = assignments.section
  )
);
create policy "Teachers create assignments for their sections"
on public.assignments for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and public.is_teacher_for(section)
);

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, section)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'section', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

revoke update on public.profiles from authenticated;
grant update (full_name, role, section) on public.profiles to authenticated;
grant select on public.profiles, public.teacher_sections, public.module_progress,
  public.quiz_attempts, public.assignments to authenticated;
grant insert on public.module_progress, public.quiz_attempts, public.assignments to authenticated;
grant update on public.module_progress to authenticated;
grant insert, update, delete on public.teacher_sections to authenticated;
grant usage, select on sequence public.quiz_attempts_id_seq, public.assignments_id_seq to authenticated;

-- Promote a user to faculty or admin only from the Supabase SQL Editor:
-- update public.profiles set role = 'teacher' where id = '<auth-user-uuid>';
-- update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
-- insert into public.teacher_sections (teacher_id, section)
-- values ('<auth-user-uuid>', 'A'), ('<auth-user-uuid>', 'B');
