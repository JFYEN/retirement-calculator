-- 步驟 1: 新增缺少的欄位到 plans 表

-- 新增 user_email 欄位
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS user_email text;

-- 新增 outputs 欄位
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS outputs jsonb DEFAULT '{}'::jsonb;

-- 新增 is_public 欄位
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_plans_email ON public.plans (user_email);

-- 步驟 2: 刪除所有舊的 RLS 政策
DROP POLICY IF EXISTS "plans_select_own" ON public.plans;
DROP POLICY IF EXISTS "plans_insert_own" ON public.plans;
DROP POLICY IF EXISTS "plans_update_own" ON public.plans;
DROP POLICY IF EXISTS "plans_delete_own" ON public.plans;
DROP POLICY IF EXISTS "plans_select_public" ON public.plans;
DROP POLICY IF EXISTS "plans_insert_anonymous" ON public.plans;

-- 步驟 3: 建立新的 RLS 政策（允許匿名用戶插入）

-- 1. 查看自己的方案
CREATE POLICY "plans_select_own"
ON public.plans FOR SELECT
USING (
  auth.uid() = user_id
  OR
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. 查看公開方案
CREATE POLICY "plans_select_public"
ON public.plans FOR SELECT
USING (is_public = true);

-- 3. 新增方案（允許匿名用戶）
CREATE POLICY "plans_insert_anonymous"
ON public.plans FOR INSERT
WITH CHECK (
  -- 已登入用戶可以插入自己的資料
  (auth.uid() = user_id)
  OR
  -- 匿名用戶可以插入資料（user_id 必須為 null）
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- 4. 更新自己的方案
CREATE POLICY "plans_update_own"
ON public.plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 刪除自己的方案
CREATE POLICY "plans_delete_own"
ON public.plans FOR DELETE
USING (auth.uid() = user_id);

-- 步驟 4: 增加註解
COMMENT ON COLUMN public.plans.user_email IS '用戶 Email（方便未登入用戶查詢）';
COMMENT ON COLUMN public.plans.outputs IS '計算結果';
COMMENT ON COLUMN public.plans.is_public IS '是否公開分享';
