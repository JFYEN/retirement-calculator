# 🚀 部署指南

## 部署到 Vercel (推薦)

### 方法 1: 使用 Vercel Dashboard (最簡單)

1. **前往 Vercel 並登入**
   - 訪問 https://vercel.com
   - 使用 GitHub 帳號登入

2. **匯入專案**
   - 點擊 "Add New..." → "Project"
   - 選擇 `JFYEN/retirement-calculator` repository
   - 點擊 "Import"

3. **設定環境變數**
   在 "Environment Variables" 區塊加入：
   ```
   NEXT_PUBLIC_SUPABASE_URL = your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   ```
   
   取得這些值：
   - 登入 Supabase Dashboard
   - 進入 Settings → API
   - 複製 "Project URL" 和 "anon public" key

4. **部署**
   - 點擊 "Deploy"
   - 等待約 2-3 分鐘
   - 完成！您會得到一個網址如 `https://retirement-calculator-xxx.vercel.app`

### 方法 2: 使用 Vercel CLI

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```
   
4. **設定環境變數**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

5. **重新部署以套用環境變數**
   ```bash
   vercel --prod
   ```

---

## 部署前檢查清單

- [ ] Supabase 資料庫已建立並執行所有 SQL 檔案
  - [ ] `supabase-create-tables.sql`
  - [ ] `supabase-add-missing-columns.sql`
  - [ ] `supabase-allow-null-user-id.sql`
  - [ ] `supabase-fix-rls-select.sql`
  - [ ] `supabase-fix-leads-table.sql`

- [ ] 環境變數已正確設定
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] GitHub repository 已推送最新代碼
  ```bash
  git push origin main
  ```

---

## 部署後測試

部署完成後，請測試以下功能：

1. **Landing Page (`/`)**
   - [ ] 頁面正常顯示
   - [ ] CTA 按鈕可正常導向 /retire

2. **計算器頁面 (`/retire`)**
   - [ ] 輸入欄位可正常使用
   - [ ] 計算結果正確顯示
   - [ ] 儲存試算功能正常
   - [ ] 載入試算功能正常
   - [ ] 專家諮詢功能正常

3. **資料庫連接**
   - [ ] 可成功儲存資料到 Supabase
   - [ ] 可成功從 Supabase 讀取資料

---

## 常見問題

### Q: 部署後出現 500 錯誤
A: 檢查環境變數是否正確設定，特別是 Supabase URL 和 Key

### Q: 資料庫連接失敗
A: 確認 Supabase RLS 政策已正確設定，允許匿名用戶存取

### Q: 如何更新網站？
A: 只需推送新代碼到 GitHub，Vercel 會自動重新部署
```bash
git add .
git commit -m "更新功能"
git push origin main
```

### Q: 如何設定自訂網域？
A: 在 Vercel Dashboard → Settings → Domains 中新增您的網域

---

## 效能優化建議

1. **啟用 Edge Functions**（Vercel 自動處理）
2. **圖片優化**（使用 Next.js Image 元件）
3. **快取策略**（Vercel 自動處理）
4. **CDN 加速**（Vercel 自動處理）

---

## 監控與分析

1. **Vercel Analytics**
   - 在 Vercel Dashboard 中啟用 Analytics
   - 追蹤頁面瀏覽、效能指標

2. **Supabase Logs**
   - 在 Supabase Dashboard 中查看資料庫查詢記錄
   - 監控 API 使用量

---

## 支援

如有問題，請查看：
- [Vercel 文件](https://vercel.com/docs)
- [Next.js 文件](https://nextjs.org/docs)
- [Supabase 文件](https://supabase.com/docs)
