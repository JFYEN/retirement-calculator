-- 修復 RLS 政策：移除對 auth.users 的引用，改用純 user_email 查詢

-- 刪除舊的 SELECT 政策
DROP POLICY IF EXISTS "plans_select_own" ON public.plans;
DROP POLICY IF EXISTS "plans_select_public" ON public.plans;

-- 建立新的 SELECT 政策（允許匿名用戶根據 email 查詢）
CREATE POLICY "plans_select_own"
ON public.plans FOR SELECT
USING (
  -- 已登入用戶可以查看自己的資料
  (auth.uid() = user_id)
  OR
  -- 任何人都可以根據 user_email 查詢（用於匿名用戶載入）
  (user_email IS NOT NULL)
);

-- 公開方案政策
CREATE POLICY "plans_select_public"
ON public.plans FOR SELECT
USING (is_public = true);

-- 驗證政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'plans';
