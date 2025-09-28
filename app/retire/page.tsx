"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/** 外觀 */
const BRAND = { from: "from-emerald-600", to: "to-teal-500", bg: "bg-emerald-600" };

/** 小工具 */
const fmt = (n: number) => Math.round(n).toLocaleString();
const toNumber = (s: string) => (s ? Number(s.replaceAll(",", "")) || 0 : 0);
const toRate = (s: string) => (s ? Number(s) / 100 : 0);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** 年金現值 */
function annuityPV(annual: number, r: number, years: number) {
  if (years <= 0 || annual <= 0) return 0;
  if (Math.abs(r) < 1e-9) return annual * years;
  return (annual * (1 - Math.pow(1 + r, -years))) / r;
}
/** 年金終值（月繳） */
function annuityFV_monthly(monthly: number, rAnnual: number, months: number) {
  if (months <= 0 || monthly <= 0) return 0;
  const rm = rAnnual / 12;
  if (Math.abs(rm) < 1e-9) return monthly * months;
  return (monthly * (Math.pow(1 + rm, months) - 1)) / rm;
}

export default function Page() {
  /** —— 基本資料 —— */
  const [age, setAge] = useState("");
  const [retireAge, setRetireAge] = useState("");
  const [lifeExp, setLifeExp] = useState("");
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [monthlySaving, setMonthlySaving] = useState("");
  const [postFixedIncome, setPostFixedIncome] = useState("");

  /** —— 資產 —— */
  const [cash, setCash] = useState("");
  const [invest, setInvest] = useState("");
  const [realEstate, setRealEstate] = useState("");

  /** —— 房貸 —— */
  const [mortgageBalance, setMortgageBalance] = useState("");    // 房貸目前餘額 (NTD)
  const [mortgageAprPct, setMortgageAprPct] = useState("");      // 年利率 (%)
  const [mortgageYearsLeft, setMortgageYearsLeft] = useState(""); // 剩餘年期 (年)

  /** —— 進階設定 —— */
  const [rPrePct, setRPrePct] = useState("");
  const [rPostPct, setRPostPct] = useState("");
  const [inflationPct, setInflationPct] = useState("");
  const [reAppPct, setReAppPct] = useState("");
  const [medicalLateBoostPct, setMedicalLateBoostPct] = useState("");

  const [reMode, setReMode] = useState<"keep" | "sell" | "rent">("keep");
  const [sellCostRatePct, setSellCostRatePct] = useState("");
  const [rentNetMonthly, setRentNetMonthly] = useState("");
  const [saleAge, setSaleAge] = useState("");

  /** —— 顯示模式 —— */
  const [mode, setMode] = useState<"real" | "nominal">("real");

  /** ===== 計算用數值 ===== */
  const ageN = toNumber(age);
  const retireAgeN = toNumber(retireAge);
  const lifeExpN = toNumber(lifeExp);

  const monthlyExpenseN = toNumber(monthlyExpense);
  const monthlySavingN  = toNumber(monthlySaving);

  const cashN   = toNumber(cash);
  const investN = toNumber(invest);
  const realEstateN = toNumber(realEstate);

  const rPre = toRate(rPrePct);
  const rPost = toRate(rPostPct);
  const inflation = toRate(inflationPct);
  const reApp = toRate(reAppPct);
  const sellCostRate = clamp(toRate(sellCostRatePct), 0, 1);
  const medicalLateBoost = Math.max(0, toRate(medicalLateBoostPct));

  const postFixedIncomeN = toNumber(postFixedIncome);
  const rentNetMonthlyN  = toNumber(rentNetMonthly);

  const saleAgeN = saleAge ? Number(saleAge.replaceAll(",", "")) : retireAgeN;
  const yrsToSale = Math.max(saleAgeN - ageN, 0);

  const yrsToRetire = Math.max(retireAgeN - ageN, 0);
  const yrsAfter    = Math.max(lifeExpN - retireAgeN, 0);
  const monthsToRetire = yrsToRetire * 12;
  const monthsToSale   = Math.max(yrsToSale * 12, 0);

  /** 資產成長（到退休時） */
  const investAtRetire = Math.max(investN, 0) * Math.pow(1 + rPre, yrsToRetire);
  const reAtRetire     = Math.max(realEstateN, 0) * Math.pow(1 + reApp, yrsToRetire);
  const cashAtRetire   = Math.max(cashN, 0);
  const savingFV       = annuityFV_monthly(Math.max(monthlySavingN, 0), rPre, monthsToRetire);

  /** 退休後固定收入（實質、以退休時購買力） */
  const fixedIncomeMonthly_nominal =
    Math.max(0, postFixedIncomeN) + (reMode === "rent" ? Math.max(0, rentNetMonthlyN) : 0);
  const fixedIncomeMonthly_realAtRetire = fixedIncomeMonthly_nominal / Math.pow(1 + inflation, yrsToRetire);

  /** 退休後實質報酬率 */
  const rRealPost = (1 + rPost) / (1 + inflation) - 1;

  /** 每年淨支出（實質） */
  const netMonthly_real = Math.max(0, monthlyExpenseN / Math.pow(1 + inflation, yrsToRetire) - fixedIncomeMonthly_realAtRetire);
  const netAnnual_real  = netMonthly_real * 12;

  /** 後期醫療分段 */
  const lastYears  = Math.min(10, yrsAfter);
  const frontYears = Math.max(yrsAfter - lastYears, 0);

  /** —— 房貸：本息均攤固定利率 —— */
  const loanP  = toNumber(mortgageBalance);                // 本金（餘額）
  const loanAPR = toRate(mortgageAprPct);                  // 年利率
  const loanN   = Math.max(Math.round(toNumber(mortgageYearsLeft) * 12), 0); // 剩餘月數
  const im = loanAPR / 12;
  const loanMonthlyPay = (loanN > 0)
    ? (Math.abs(im) < 1e-9 ? (loanP / loanN) : loanP * im / (1 - Math.pow(1 + im, -loanN)))
    : 0;

  function loanRemainAfter(kMonths: number) {
    if (loanN <= 0) return 0;
    const k = Math.min(Math.max(kMonths, 0), loanN);
    if (Math.abs(im) < 1e-9) {
      return Math.max(loanP - loanMonthlyPay * k, 0);
    }
    const pow = Math.pow(1 + im, k);
    const remain = loanP * pow - loanMonthlyPay * (pow - 1) / im;
    return Math.max(remain, 0);
  }

  const loanRemainAtRetire = loanRemainAfter(monthsToRetire);
  const loanRemainAtSale   = loanRemainAfter(monthsToSale);

  /** 退休後仍需繳的房貸期數 & 實質月額（以退休當下購買力） */
  const monthsLoanAfterRetire = Math.max(loanN - monthsToRetire, 0);
  const yearsLoanAfterRetire  = Math.min(yrsAfter, monthsLoanAfterRetire / 12);
  const loanMonthly_realAtRetire = loanMonthlyPay / Math.pow(1 + inflation, yrsToRetire);

  /** ▶ 不動產處置：加入「預計出售年齡」＋ 房貸 */
  let realEstateLumpToAssetsAtRetire = 0; // 名目：退休時資產（退休前/當下賣）
  let realEstatePVtoReduceNeed_real = 0;  // 實質：抵減需求（退休後賣）

  if (reMode === "sell") {
    // 出售時點名目價值
    const reAtSale_nominal = Math.max(realEstateN, 0) * Math.pow(1 + reApp, yrsToSale);
    // 出售淨額（名目）：扣出售成本與「出售時剩餘房貸」
    const grossLessCost = reAtSale_nominal * (1 - sellCostRate);
    const netAtSale_nominal = Math.max(grossLessCost - loanRemainAtSale, 0);

    if (saleAgeN <= retireAgeN) {
      // 退休前/當下出售：淨額滾到退休時點（名目）
      const growYears = Math.max(retireAgeN - saleAgeN, 0);
      realEstateLumpToAssetsAtRetire = netAtSale_nominal * Math.pow(1 + rPre, growYears);
    } else {
      // 退休後出售：折成退休時點實質現值，用來抵減所需金額
      const yrsAfterRetire = saleAgeN - retireAgeN;
      const netAtSale_realAtSale = netAtSale_nominal / Math.pow(1 + inflation, yrsToSale);
      realEstatePVtoReduceNeed_real = netAtSale_realAtSale * Math.pow(1 + rRealPost, -yrsAfterRetire);
    }
  }

  /** 退休時資產（名目/實質） */
  let assetsNominalAtRetire = cashAtRetire + investAtRetire + savingFV;
  if (reMode === "keep") {
    // 保留：以淨值入帳（市值－退休時剩餘貸款）
    const equityAtRetire = Math.max(reAtRetire - loanRemainAtRetire, 0);
    assetsNominalAtRetire += equityAtRetire;
  } else if (reMode === "sell") {
    assetsNominalAtRetire += realEstateLumpToAssetsAtRetire;
  }
  // 出租：不把市值算入流動資產（租金已計入固定收入）
  const assetsRealAtRetire = assetsNominalAtRetire / Math.pow(1 + inflation, yrsToRetire);

  /** 退休所需金額（實質） */
  let required_real =
    annuityPV(netAnnual_real, rRealPost, frontYears) +
    annuityPV(netAnnual_real * (1 + medicalLateBoost), rRealPost, lastYears) *
      Math.pow(1 + rRealPost, -frontYears);

  // 退休後出售 → 折現值抵減需求
  if (reMode === "sell" && saleAgeN > retireAgeN) {
    required_real = Math.max(0, required_real - realEstatePVtoReduceNeed_real);
  }

  // 房貸退休後仍需繳 → 折成年金現值，加到需要金額
  if (yearsLoanAfterRetire > 0 && loanMonthly_realAtRetire > 0) {
    const loanAnnual_real = loanMonthly_realAtRetire * 12;
    required_real += annuityPV(loanAnnual_real, rRealPost, yearsLoanAfterRetire);
  }

  /** 名目顯示用 */
  const required_nominalAtRetire = required_real * Math.pow(1 + inflation, yrsToRetire);
  const needForDisplay   = mode === "real" ? required_real : required_nominalAtRetire;
  const assetsForDisplay = mode === "real" ? assetsRealAtRetire : assetsNominalAtRetire;

  const gap = needForDisplay - assetsForDisplay;
  const coverage = needForDisplay > 0 ? assetsForDisplay / needForDisplay : 0;

  /** 以實質視角估算可支撐年數 */
  const yearsCovered = useMemo(() => {
    const annual = netAnnual_real;
    if (annual <= 0 || assetsRealAtRetire <= 0) return 0;
    const rr = rRealPost;
    let lo = 0, hi = Math.max(yrsAfter, 100);
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const pv = annuityPV(annual, rr, mid);
      if (pv > assetsRealAtRetire) hi = mid; else lo = mid;
    }
    return Math.round(lo * 10) / 10;
  }, [netAnnual_real, assetsRealAtRetire, rRealPost, yrsAfter]);

  /** === 儲存試算功能 === */
  async function handleSavePlan() {
    // 1) 確保有 session（匿名登入）
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      const { error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) { alert(`登入失敗：${anonErr.message}`); return; }
    }
    // 2) 取得 user
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) { alert(`取得使用者失敗：${userErr?.message ?? "unknown"}`); return; }

    // 3) 組 inputs（保留所有欄位）
    const inputs = {
      age, retireAge, lifeExp,
      monthlyExpense, monthlySaving, postFixedIncome,
      cash, invest, realEstate,
      mortgageBalance, mortgageAprPct, mortgageYearsLeft,
      rPrePct, rPostPct, inflationPct, reAppPct, medicalLateBoostPct,
      reMode, sellCostRatePct, rentNetMonthly, saleAge,
      mode
    };

    // 4) 寫入 plans
    const { error: insertErr } = await supabase.from("plans").insert({
      user_id: userRes.user.id,
      name: "我的退休試算",
      inputs,
      version: 1
    });
    if (insertErr) alert(`儲存失敗：${insertErr.message}`); else alert("✅ 已成功儲存到 Supabase（plans）！");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* 頂部標語（強烈行銷版） */}
      <header className={`bg-gradient-to-r ${BRAND.from} ${BRAND.to} text-white`}>
        <div className="mx-auto max-w-md px-6 py-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
            讓退休，不只是夢想<br />
            而是確定的未來
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-28 -mt-4 space-y-6">
        {/* 1. 基本資料 */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-neutral-800">1. 填寫基本資料</h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="當前年齡" value={age} onChange={setAge} placeholder="如 44" />
            <NumberField label="預計退休年齡" value={retireAge} onChange={setRetireAge} placeholder="如 60" />
          </div>
          <NumberField label="預估壽命" value={lifeExp} onChange={setLifeExp} placeholder="如 90" />
          <CurrencyField label="退休後每月支出 (NTD)" value={monthlyExpense} onChange={setMonthlyExpense} />
          <CurrencyField label="退休前每月可儲蓄 (NTD)" value={monthlySaving} onChange={setMonthlySaving} />
          <CurrencyField label="退休後固定月收入 (NTD)" value={postFixedIncome} onChange={setPostFixedIncome} />
        </section>

        {/* 2. 資產資訊 */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-neutral-800">2. 填寫資產資訊</h2>
          <CurrencyField label="現金與存款 (NTD)" value={cash} onChange={setCash} />
          <CurrencyField label="金融投資 (NTD)" value={invest} onChange={setInvest} />
          <CurrencyField label="不動產可動用估值 (NTD)" value={realEstate} onChange={setRealEstate} />

          {/* 房貸三欄 */}
          <div className="mt-2 grid grid-cols-1 gap-4">
            <CurrencyField label="房貸目前餘額 (NTD)" value={mortgageBalance} onChange={setMortgageBalance} />
            <PercentField label="房貸年利率 (%)" value={mortgageAprPct} onChange={setMortgageAprPct} placeholder="如 2" />
            <NumberField label="房貸剩餘年期 (年)" value={mortgageYearsLeft} onChange={setMortgageYearsLeft} placeholder="如 20" />
          </div>
        </section>

        {/* 3. 進階設定 */}
        <details className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <summary className="cursor-pointer text-lg font-semibold text-neutral-800">3. 進階設定 ▾</summary>
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <PercentField label="退休前投資報酬率 (年化 %)" value={rPrePct} onChange={setRPrePct} />
              <PercentField label="退休後投資報酬率 (年化 %)" value={rPostPct} onChange={setRPostPct} />
              <PercentField label="年均通膨率 (%)" value={inflationPct} onChange={setInflationPct} />
              <PercentField label="不動產年增率 (%)" value={reAppPct} onChange={setReAppPct} />
            </div>
            <PercentField label="後期醫療支出加成 (%)" value={medicalLateBoostPct} onChange={setMedicalLateBoostPct} />

            <Select label="不動產處置" value={reMode} onChange={(v)=>setReMode(v as any)}
              options={[{label:"保留",value:"keep"},{label:"出售",value:"sell"},{label:"出租",value:"rent"}]} />

            {reMode==="sell" && (
              <div className="grid grid-cols-2 gap-4">
                <NumberField label="預計出售年齡" value={saleAge} onChange={setSaleAge} placeholder="如 70" />
                <PercentField label="出售成本率 (%)" value={sellCostRatePct} onChange={setSellCostRatePct} />
              </div>
            )}
            {reMode==="rent" && (
              <CurrencyField label="出租淨月租 (NTD)" value={rentNetMonthly} onChange={setRentNetMonthly} />
            )}
          </div>
        </details>

        {/* 4. 計算結果 */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-neutral-800">4. 計算結果</h2>
          <p className="text-xs text-neutral-500 -mt-1">請先填寫資料</p>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <Segment value={mode} onChange={(v)=>setMode(v as any)} options={[
              {label:"實質", value:"real"}, {label:"名目", value:"nominal"}
            ]}/>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 text-center">
            <div className="text-sm text-neutral-600 mb-2">差額</div>
            <div className={`text-4xl font-bold ${gap>=0?"text-red-600":"text-emerald-600"} break-all`}>
              {fmt(Math.abs(gap))} 元
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Kpi label="退休所需金額" value={`${fmt(needForDisplay)} 元`} />
              <Kpi label="預估退休資產" value={`${fmt(assetsForDisplay)} 元`} />
            </div>
            <p className="mt-3 text-sm text-neutral-600 break-all">
              覆蓋率 {(coverage*100).toFixed(1)}%；以實質視角估計可支撐約 {yearsCovered} 年（目標 {yrsAfter} 年）。
            </p>
          </div>
        </section>

        {/* 5. 每月儲蓄建議 */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-neutral-800">5. 每月儲蓄建議</h2>
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
            <div className="text-sm text-blue-700 mb-2">建議每月儲蓄金額</div>
            <div className="text-3xl font-bold text-blue-800">
              {gap > 0 ? fmt(Math.ceil(gap / Math.max(monthsToRetire, 1))) : "0"} 元
            </div>
          </div>
        </section>

        {/* 6. 計算說明 */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-800">6. 計算說明</h2>

          {/* 基本公式 */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-lg">
            <h3 className="font-semibold text-neutral-800 mb-2">基本公式</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>• 退休所需金額 = 退休後年支出 × 年金現值係數</li>
              <li>• 預估退休資產 = 各項資產與儲蓄累積的合計（見下方「資產計算邏輯」）</li>
              <li>• 實質報酬率 = (1 + 名目報酬率) ÷ (1 + 通膨率) − 1</li>
              <li>• 後期醫療加成：最後 10 年支出增加 {medicalLateBoostPct || "0"}%</li>
            </ul>
          </div>

          {/* 年金現值係數 */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-lg">
            <h3 className="font-semibold text-neutral-800 mb-2">年金現值係數是什麼？</h3>
            <p className="text-sm text-neutral-700 leading-6">
              將「退休期間每年的固定支出」折算成在退休當下所需的一次性準備金。計算式：<br/>
              年金現值係數 = (1 − (1 + r)<sup>−n</sup>) ÷ r；其中 r 為「退休後實質報酬率」，n 為「退休年數」。
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700">
              <li>• 本工具以 <code>annuityPV(annual, r, years)</code> 實作，上式內嵌於函式中。</li>
              <li>• annual：退休後每年「淨支出」（已扣固定月收入/房租，並以退休當下購買力表示）。</li>
              <li>• years：若有最後 10 年醫療加成，會拆段各自計算再加總。</li>
            </ul>
          </div>

          {/* 資產計算邏輯（含現金/投資/不動產＋房貸） */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-lg">
            <h3 className="font-semibold text-neutral-800 mb-2">資產計算邏輯</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>• 現金：直接加總，假設沒有利息（除非未來加入定存/貨幣基金收益）。</li>
              <li>• 金融投資：依設定的「退休前投資報酬率」做複利成長至退休時。</li>
              <li>• 每月儲蓄：用「年金終值公式」累積至退休時。</li>
              <li>
                • 不動產（依情境選擇）：
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>保留：以「退休時市值 − 退休時剩餘房貸本金」計入淨值。</li>
                  <li>出售：淨額 =「出售價值 × (1 − 出售成本率) − 出售時剩餘房貸本金」。</li>
                  <li>  – 退休前/當下出售：淨額滾入退休資產。</li>
                  <li>  – 退休後出售：將淨額折現回退休時，抵減所需金額。</li>
                  <li>出租：不把市值算入退休資產，但租金收入會加到「退休後固定月收入」。</li>
                </ul>
              </li>
              <li>• 房貸月付：若退休後仍需繳，會以「退休當下購買力」換算為實質月額，並在尚需繳的期間內，折算為年金現值加總至所需金額。</li>
            </ul>
          </div>

          {/* 其他假設 */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 rounded-lg">
            <h3 className="font-semibold text-neutral-800 mb-2">其他假設</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>• 退休前投資報酬率：{rPrePct || "未設定"}%</li>
              <li>• 退休後投資報酬率：{rPostPct || "未設定"}%</li>
              <li>• 年均通膨率：{inflationPct || "未設定"}%</li>
              <li>• 不動產年增率：{reAppPct || "未設定"}%</li>
            </ul>
          </div>
        </section>
      </main>

      {/* 底部功能 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur ring-1 ring-black/5">
        <div className="mx-auto max-w-md px-5 py-3 grid grid-cols-2 gap-3">
          <button
            onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
            className="rounded-xl border border-neutral-300 py-3 text-sm font-medium"
          >
            回到頂端
          </button>
          <button
            className={`rounded-xl py-3 text-sm font-semibold text-white ${BRAND.bg}`}
            onClick={handleSavePlan}
          >
            儲存試算
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─── 共用元件 ─── */
function Segment({ value, onChange, options }:{
  value:string; onChange:(v:string)=>void; options:{label:string;value:string}[];
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg border bg-neutral-50 p-1 text-sm">
      {options.map(o=>{
        const active=value===o.value;
        return (
          <button key={o.value} onClick={()=>onChange(o.value)}
            className={`rounded-md py-1.5 ${active?"bg-white shadow-sm font-semibold":"text-neutral-600"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
function Kpi({ label, value }:{label:string; value:string}) {
  return (
    <div className="rounded-xl border bg-white p-4 text-center">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold break-all">{value}</div>
    </div>
  );
}
function NumberField({ label, value, onChange, placeholder }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type="text" inputMode="numeric"
        value={value}
        onChange={(e)=>onChange(e.target.value.replace(/[^\d]/g,""))}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
        placeholder={placeholder || "請輸入數字"}
      />
    </div>
  );
}
function CurrencyField({ label, value, onChange, placeholder }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
}) {
  const handleChange = (s: string) => {
    const digits = s.replace(/[^\d]/g, "");
    if (!digits) { onChange(""); return; }
    onChange(Number(digits).toLocaleString());
  };
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e)=>handleChange(e.target.value)}
        onBlur={()=>value && onChange(Number(value.replaceAll(",","")).toLocaleString())}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
        placeholder={placeholder || "請輸入金額"}
      />
    </div>
  );
}
function PercentField({ label, value, onChange, placeholder }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
}) {
  const handleChange = (s: string) => {
    const cleaned = s.replace(/[^\d.]/g,"").replace(/^(\d*\.\d*).*$/,"$1");
    onChange(cleaned);
  };
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
      <div className="flex items-center">
        <input
          value={value}
          onChange={(e)=>handleChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          placeholder={placeholder || "例如 2 或 2.5"}
          inputMode="decimal"
        />
        <span className="ml-3 text-sm font-medium text-neutral-600">%</span>
      </div>
    </div>
  );
}
function Select({ label, value, onChange, options }:{
  label:string; value:string; onChange:(v:string)=>void; options:{label:string; value:string}[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}