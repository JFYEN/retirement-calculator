-- 修改 plans 表，允許 user_id 為 null（以支援匿名用戶）

ALTER TABLE public.plans 
ALTER COLUMN user_id DROP NOT NULL;

-- 驗證修改
SELECT column_name, is_nullable, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'plans'
  AND column_name = 'user_id';
