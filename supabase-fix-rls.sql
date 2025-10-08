-- 第一步：先查詢 plans 表的結構，確認欄位名稱
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'plans'
ORDER BY ordinal_position;
