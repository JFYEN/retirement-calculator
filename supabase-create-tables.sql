-- 步驟 1: 建立 plans 表（如果不存在）
-- extension（跑過可忽略）
create extension if not exists "pgcrypto";

-- 表格定義
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- 關聯到認證用戶
  user_email text,                                          -- 用戶email（方便查詢）
  name text not null default '未命名試算',                   -- 方案名稱
  inputs jsonb not null default '{}'::jsonb,               -- 所有輸入欄位
  outputs jsonb default '{}'::jsonb,                       -- 計算結果
  is_public boolean default false,                         -- 是否公開分享
  version int not null default 1,                          -- 版本控制
  created_at timestamptz not null default now(),           -- 建立時間
  updated_at timestamptz not null default now()            -- 更新時間
);

-- 索引
create index if not exists idx_plans_user on public.plans (user_id);
create index if not exists idx_plans_email on public.plans (user_email);

-- 啟用 Row Level Security (RLS)
alter table public.plans enable row level security;

-- 步驟 2: 刪除舊的 RLS 政策
drop policy if exists "plans_select_own" on public.plans;
drop policy if exists "plans_insert_own" on public.plans;
drop policy if exists "plans_update_own" on public.plans;
drop policy if exists "plans_delete_own" on public.plans;
drop policy if exists "plans_select_public" on public.plans;
drop policy if exists "plans_insert_anonymous" on public.plans;

-- 步驟 3: 建立新的 RLS 政策

-- 1. 查看自己的方案
create policy "plans_select_own"
on public.plans for select
using (
  auth.uid() = user_id
  or
  user_email = (select email from auth.users where id = auth.uid())
);

-- 2. 查看公開方案
create policy "plans_select_public"
on public.plans for select
using (is_public = true);

-- 3. 新增方案（允許匿名用戶）
create policy "plans_insert_anonymous"
on public.plans for insert
with check (
  -- 已登入用戶可以插入自己的資料
  (auth.uid() = user_id)
  or
  -- 匿名用戶可以插入資料（user_id 必須為 null，但要有 user_email）
  (auth.uid() is null and user_id is null and user_email is not null)
);

-- 4. 更新自己的方案
create policy "plans_update_own"
on public.plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 5. 刪除自己的方案
create policy "plans_delete_own"
on public.plans for delete
using (auth.uid() = user_id);

-- 自動更新 updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 觸發器設定
drop trigger if exists trg_set_updated_at on public.plans;
create trigger trg_set_updated_at
  before update on public.plans
  for each row execute procedure public.set_updated_at();

-- 增加註解
comment on table public.plans is '退休計畫方案表';
comment on column public.plans.user_id is '關聯到 auth.users 的用戶 ID';
comment on column public.plans.user_email is '用戶 Email（方便未登入用戶查詢）';
comment on column public.plans.inputs is '所有計算器輸入欄位';
comment on column public.plans.outputs is '計算結果';
comment on column public.plans.is_public is '是否公開分享';
comment on column public.plans.version is '方案版本';
