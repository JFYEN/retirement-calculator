// lib/useRetirementCalculator.ts

import { useMemo } from "react";

// ----------------------------------------------------------------------
// 🚨 介面定義
// ----------------------------------------------------------------------

// 定義輸入參數的型別 (與 page.tsx 的 useState 欄位完全對應)
interface CalculatorInputs {
    age: string; retireAge: string; lifeExp: string;
    monthlyExpense: string; monthlySaving: string; postFixedIncome: string;
    cash: string; invest: string; realEstate: string;
    mortgageBalance: string; mortgageAprPct: string; mortgageYearsLeft: string;
    rPrePct: string; rPostPct: string; inflationPct: string; reAppPct: string; medicalLateBoostPct: string;
    reMode: "keep" | "sell" | "rent"; sellCostRatePct: string; rentNetMonthly: string; saleAge: string;
    mode: "real" | "nominal";
}

// 定義輸出結果的型別
interface CalculatorOutputs {
    needForDisplay: number;
    assetsForDisplay: number;
    gap: number;
    coverage: number;
    yearsCovered: number;
    netAnnual_real: number;
    monthsToRetire: number;
    yrsAfter: number; // 👈 修復：page.tsx 需要它來顯示目標年數
    // 輸出供 page.tsx 儲存用的 helper functions
    fmt: (n: number) => string;
}

/** 外觀 */
export const BRAND = { from: "from-emerald-600", to: "to-teal-500", bg: "bg-emerald-600" };

/** 小工具 */
export const fmt = (n: number) => Math.round(n).toLocaleString();
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
  return (monthly * (Math.pow(1 + rm, months) - 1) * (1 + rm)) / rm; // 假設期初付款 (1+rm)
}


/**
 * 退休試算的核心邏輯 Custom Hook
 * @param inputs 所有來自 UI 的字串輸入
 * @returns 所有的計算結果，供 UI 顯示
 */
export function useRetirementCalculator(inputs: CalculatorInputs): CalculatorOutputs {
    // 使用 useMemo 來確保只有在輸入改變時才重新計算，提升效能
    return useMemo(() => {
        // 解構輸入
        const {
            age, retireAge, lifeExp,
            monthlyExpense, monthlySaving, postFixedIncome,
            cash, invest, realEstate,
            mortgageBalance, mortgageAprPct, mortgageYearsLeft,
            rPrePct, rPostPct, inflationPct, reAppPct, medicalLateBoostPct,
            reMode, sellCostRatePct, rentNetMonthly, saleAge,
            mode
        } = inputs;

        // -----------------------------------------------------
        // ✅ 這裡貼上所有計算程式碼
        // -----------------------------------------------------

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
        const yrsAfter    = Math.max(lifeExpN - retireAgeN, 0); // 👈 這裡定義了 yrsAfter
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
        const yearsCovered = (() => {
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
        })();

        // -----------------------------------------------------
        // ✅ 計算程式碼貼上結束！
        // -----------------------------------------------------

        // 回傳所有需要顯示的結果
        return {
            needForDisplay,
            assetsForDisplay,
            gap,
            coverage,
            yearsCovered,
            netAnnual_real,
            monthsToRetire,
            yrsAfter, // 👈 修復：確保回傳 yrsAfter
            fmt
        };
    }, [inputs]); // 確保當 inputs 改變時，Hook 會重新計算
}