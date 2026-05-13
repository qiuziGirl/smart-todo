-- Smart Note · 启用 RLS 与策略
-- 在 Supabase Dashboard → SQL Editor 中整段执行；可安全重复执行（先 DROP POLICY 再 CREATE）
-- 前提：使用已登录用户的 JWT（anon key + 用户 session）；服务端 Prisma 使用数据库直连角色，不受 RLS 限制

-- ---------------------------------------------------------------------------
-- 1. 清理旧策略（便于重复执行）
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

DROP POLICY IF EXISTS "groups_select_own" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_own" ON public.groups;
DROP POLICY IF EXISTS "groups_update_own" ON public.groups;
DROP POLICY IF EXISTS "groups_delete_own" ON public.groups;

DROP POLICY IF EXISTS "notes_select_own" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_own" ON public.notes;
DROP POLICY IF EXISTS "notes_update_own" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_own" ON public.notes;

DROP POLICY IF EXISTS "todo_items_select_own" ON public.todo_items;
DROP POLICY IF EXISTS "todo_items_insert_own" ON public.todo_items;
DROP POLICY IF EXISTS "todo_items_update_own" ON public.todo_items;
DROP POLICY IF EXISTS "todo_items_delete_own" ON public.todo_items;

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;

-- ---------------------------------------------------------------------------
-- 2. 启用 RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. profiles（id 与 auth.users.id 一致）
-- ---------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. groups
-- ---------------------------------------------------------------------------
CREATE POLICY "groups_select_own"
  ON public.groups FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "groups_insert_own"
  ON public.groups FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "groups_update_own"
  ON public.groups FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "groups_delete_own"
  ON public.groups FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. notes（group_id 若非空，须属于当前用户）
-- ---------------------------------------------------------------------------
CREATE POLICY "notes_select_own"
  ON public.notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notes_insert_own"
  ON public.notes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = group_id
          AND g.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_update_own"
  ON public.notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = group_id
          AND g.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notes_delete_own"
  ON public.notes FOR DELETE
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. todo_items（须归属本人，且所属便签也为本人）
-- ---------------------------------------------------------------------------
CREATE POLICY "todo_items_select_own"
  ON public.todo_items FOR SELECT
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = todo_items.note_id
        AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "todo_items_insert_own"
  ON public.todo_items FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "todo_items_update_own"
  ON public.todo_items FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = todo_items.note_id
        AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "todo_items_delete_own"
  ON public.todo_items FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = todo_items.note_id
        AND n.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. push_subscriptions
-- ---------------------------------------------------------------------------
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
