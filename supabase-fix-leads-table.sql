-- 修復 leads 表的 schema 和 RLS 政策

-- 步驟 1: 確保 leads 表有正確的結構
-- 檢查是否缺少欄位，如果缺少就新增

-- 新增 name 欄位（如果不存在）
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS name text;

-- 確保其他必要欄位存在
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS plan_id uuid;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'calculator';

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS inputs jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 步驟 2: 建立索引
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_plan_id ON public.leads (plan_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- 步驟 3: 刪除舊的 RLS 政策
DROP POLICY IF EXISTS "leads_insert_anonymous" ON public.leads;
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;

-- 步驟 4: 建立新的 RLS 政策（允許匿名用戶插入）

-- 允許任何人插入 leads（用於匿名諮詢）
CREATE POLICY "leads_insert_anonymous"
ON public.leads FOR INSERT
WITH CHECK (true);

-- 允許查看自己的 leads
CREATE POLICY "leads_select_own"
ON public.leads FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.plans WHERE id = plan_id
  )
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 步驟 5: 確保 RLS 已啟用
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 步驟 6: 增加註解
COMMENT ON COLUMN public.leads.name IS '用戶姓名';
COMMENT ON COLUMN public.leads.phone IS '聯絡電話';
COMMENT ON COLUMN public.leads.email IS '聯絡 Email';
COMMENT ON COLUMN public.leads.plan_id IS '關聯的試算方案 ID';
COMMENT ON COLUMN public.leads.source IS '來源（calculator, landing_page 等）';
COMMENT ON COLUMN public.leads.status IS '狀態（new, contacted, converted 等）';
COMMENT ON COLUMN public.leads.inputs IS '試算輸入資料（快照）';
COMMENT ON COLUMN public.leads.utm IS 'UTM 追蹤參數';

-- 驗證表結構
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;

-- 驗證 RLS 政策
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
WHERE tablename = 'leads';
