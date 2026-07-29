-- Consolidate daily_plan_items DELETE access into one policy so Supabase RLS
-- advisors do not re-evaluate auth helpers per row or flag duplicate policies.

begin;

drop policy if exists daily_plan_items_delete_admin on public.daily_plan_items;
drop policy if exists daily_plan_items_delete_employee_selection on public.daily_plan_items;
drop policy if exists daily_plan_items_delete_access on public.daily_plan_items;

create policy daily_plan_items_delete_access
  on public.daily_plan_items
  for delete
  to authenticated
  using (
    public.current_user_is_admin()
    or (
      is_completed = false
      and public.current_user_is_employee()
      and exists (
        select 1
        from public.daily_plans plan
        where plan.id = public.daily_plan_items.daily_plan_id
          and plan.employee_id = (select auth.uid())
          and plan.status = 'in_progress'
          and public.current_employee_has_work_schedule(plan.client_id, plan.work_date)
      )
    )
  );

commit;
