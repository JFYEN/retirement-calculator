// lib/useRetirementCalculator.ts (最終優化、容錯版本)

import { useMemo } from 'react';

// =================================================================
// Interfaces and Constants (確保所有屬性都導出)
// =================================================================

// 確保 BRAND 被導出，用於 app/retire/page.tsx
export const BRAND = "from-emerald-600 to-teal-500 bg-gradient-to-r"; 

export interface CalculatorInputs {
    age: string; retireAge: string; lifeExp: string;
    monthlyExpense: string; monthlySaving: string; postFixedIncome: string;
    cash: string; invest: string; realEstate: string;
    mortgageBalance: string; mortgageAprPct: string; mortgageYearsLeft: string;
    rPrePct: string; rPostPct: string; inflationPct: string; reAppPct: string; medicalLateBoostPct: string;
    reMode: "keep" | "sell" | "rent"; sellCostRatePct: string; rentNetMonthly: string; saleAge: string;
    mode: "real" | "nominal";
}

export interface CalculatorOutputs {
    need: number; 
    assets: number;
    gap: number; 
    yearsCovered: number;
    coverage: number;
    needForDisplay: number;
    assetsForDisplay: number;
    fmt: (n: number) => string;
    errorMessage?: string; 
}

// 統一的格式化工具：四捨五入到整數，並加上千分位逗號
const numberFormatter = (n: number) => {
    const num = Math.round(n);
    // 處理負數
    if (num < 0) {
        return `-${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 0 });
};

// 統一的初始/錯誤回傳物件：確保所有屬性都有定義，避免 undefined 錯誤
const getInitialOutput = (errorMessage?: string): CalculatorOutputs => ({
    need: 0, 
    assets: 0, 
    gap: 0, 
    yearsCovered: 0, 
    coverage: 0,
    needForDisplay: 0, 
    assetsForDisplay: 0,
    fmt: numberFormatter, 
    errorMessage: errorMessage,
});


export function useRetirementCalculator(inputs: CalculatorInputs): CalculatorOutputs {

    return useMemo(() => {
        // 1. 數據清理與轉換工具 (容錯處理)
        // 🎯 關鍵：如果欄位為空、空白、或非數字，一律返回 0，讓計算繼續。
        const clean = (s: string) => {
            // 移除逗號，移除所有非數字和小數點的字符
            const num = Number(s.replaceAll(",", "").replace(/[^0-9.]/g, ''));
            // 如果轉換結果是 NaN (例如輸入了純文字)，則返回 0
            return isNaN(num) ? 0 : num;
        };
        const toRate = (pct: string) => clean(pct) / 100;

        // 轉換核心年齡 (如果為空字串，則為 0)
        const nAge = clean(inputs.age);
        const nRetireAge = clean(inputs.retireAge);
        const nLifeExp = clean(inputs.lifeExp);
        const nSaleAge = clean(inputs.saleAge);

        // 檢查核心年齡欄位是否為有效數字（> 0）
        const areAllAgeFieldsValid = nAge > 0 && nRetireAge > 0 && nLifeExp > 0;
        
        let errorMsg = "";

        // --- 2. 嚴格的年齡邏輯檢查 ---

        // 2.1 年齡有效性與範圍檢查 (參考邏輯限制)
        if (nAge <= 0 || nAge > 100) errorMsg = "當前年齡必須為有效正數 (1-100)。";
        else if (nRetireAge <= 0 || nRetireAge > 100) errorMsg = "預計退休年齡必須為有效正數 (1-100)。";
        else if (nLifeExp <= 0 || nLifeExp > 120) errorMsg = "預估壽命必須為有效正數 (1-120)。";
        else if (inputs.reMode === 'sell' && inputs.saleAge && nSaleAge <= 0) errorMsg = "房地產出售年齡必須為有效正數。";

        // 2.2 年齡邏輯關係檢查
        if (!errorMsg && areAllAgeFieldsValid) {
            // 🎯 檢查：當前年齡必須嚴格小於退休年齡
            if (nAge >= nRetireAge) { 
                errorMsg = "當前年齡必須嚴格小於預計退休年齡。"; //
            } 
            // 🎯 檢查：退休年齡必須嚴格小於壽命
            else if (nRetireAge >= nLifeExp) {
                errorMsg = "預計退休年齡必須嚴格小於預估壽命。";
            } 
            // 房產出售年齡檢查
            else if (inputs.reMode === 'sell' && nSaleAge > 0 && nSaleAge <= nAge) {
                errorMsg = "房地產出售年齡必須晚於當前年齡。";
            }
        }
        
        // --- 錯誤返回點: 如果有任何邏輯錯誤，則立即返回錯誤訊息，阻止計算 ---
        if (errorMsg) {
            // 返回包含錯誤訊息的完整物件，但數字保持為 0
            return getInitialOutput(`輸入警告: ${errorMsg}`);
        }
        
        // *** 通過所有檢查，開始核心計算 (空欄位已經被 clean() 視為 0) ***
        
        const rPre = toRate(inputs.rPrePct);
        const rPost = toRate(inputs.rPostPct);
        const inflation = toRate(inputs.inflationPct);
        const reApp = toRate(inputs.reAppPct);
        const medBoost = toRate(inputs.medicalLateBoostPct);
        const sellCostRate = toRate(inputs.sellCostRatePct);

        const monthlyExpense = clean(inputs.monthlyExpense);
        const monthlySaving = clean(inputs.monthlySaving);
        const postFixedIncome = clean(inputs.postFixedIncome);
        const cash = clean(inputs.cash);
        const invest = clean(inputs.invest);
        const realEstate = clean(inputs.realEstate);
        const mortgageBalance = clean(inputs.mortgageBalance);
        const rentNetMonthly = clean(inputs.rentNetMonthly);

        const isRealMode = inputs.mode === 'real';

        // 確保年份計算是正數
        const yearsToRetire = Math.max(0, nRetireAge - nAge);
        const yearsInRetire = Math.max(0, nLifeExp - nRetireAge);

        // 如果年份為 0，且沒有錯誤訊息，則可能只是初始狀態，讓計算結果為 0
        if (yearsToRetire === 0 && yearsInRetire === 0 && !areAllAgeFieldsValid) {
             return getInitialOutput(undefined);
        }
        
        // 輔助函式：淨現值 (Present Value)
        const pv = (rate: number, nper: number, pmt: number) => {
            if (nper <= 0 || pmt === 0) return 0; 
            if (rate === 0) return pmt * nper;
            if (1 + rate === 0) return 0;
            return pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
        };

        // 輔助函式：淨終值 (Future Value)
        const fv = (rate: number, nper: number, pmt: number, pv: number = 0) => {
            if (nper <= 0 && pmt === 0) return pv; 
            if (rate === 0) return pv + pmt * nper;
            return pv * Math.pow(1 + rate, nper) + pmt * (Math.pow(1 + rate, nper) - 1) / rate;
        };

        // 計算實質有效報酬率 (Real Effective Rate)
        const getRealRate = (nominalRate: number, inflationRate: number) => {
            if (isRealMode && (1 + inflationRate) !== 0) {
                // 實質報酬率公式 (Real Rate)
                return (nominalRate - inflationRate) / (1 + inflationRate);
            }
            return nominalRate;
        };
        
        const rEffPre = getRealRate(rPre, inflation);
        const rEffPost = getRealRate(rPost, inflation);
        const rEffReApp = getRealRate(reApp, inflation);

        // 7. 計算退休所需總金額 (NEED)
        const annualExpense = monthlyExpense * 12;
        let annualFixedIncome = postFixedIncome * 12;

        if (inputs.reMode === 'rent') {
            annualFixedIncome += rentNetMonthly * 12;
        }

        const netExpenseFirstYear = Math.max(0, annualExpense - annualFixedIncome);
        const initialTotalAsset = cash + invest + realEstate; 

        if (netExpenseFirstYear === 0) {
            // 如果淨支出為 0
            return { 
                need: 0, assets: initialTotalAsset, gap: initialTotalAsset, 
                yearsCovered: yearsInRetire, coverage: 1, 
                needForDisplay: 0, assetsForDisplay: initialTotalAsset, 
                fmt: numberFormatter, 
                errorMessage: undefined 
            };
        }

        // 考慮晚期醫療費用加成 (假設退休後最後 10 年)
        const medicalBoostYears = 10;
        const medicalBoostStartAge = nLifeExp > medicalBoostYears ? nLifeExp - medicalBoostYears : nRetireAge;
        const yearsNormal = Math.max(0, medicalBoostStartAge - nRetireAge);
        const yearsLate = Math.max(0, nLifeExp - medicalBoostStartAge);

        let totalNeed = 0;
        // 晚期支出增加 (如果 medBoost 是 0，則 lateExpense = netExpenseFirstYear)
        const lateExpense = netExpenseFirstYear * (1 + medBoost); 
        
        // 晚期需求折現到退休開始時
        const pvLate = pv(rEffPost, yearsLate, lateExpense);
        totalNeed += pvLate * Math.pow(1 + rEffPost, yearsNormal);
        
        // 正常期需求折現到退休開始時
        const pvNormal = pv(rEffPost, yearsNormal, netExpenseFirstYear);
        totalNeed += pvNormal;
        
        // 8. 計算預估累積資產 (ASSETS)
    // 退休前預期年報酬率僅計算投資資產，不計算現金與存款
    const initialAsset = invest;
        const annualSaving = monthlySaving * 12;
        // 退休前累積資產 (包含儲蓄終值和當前資產終值)
        const futureAsset = fv(rEffPre, yearsToRetire, annualSaving, initialAsset);

        let futureRealEstate = 0;
        if (inputs.reMode === 'sell' && realEstate > 0) {
            // 如果沒有指定出售年齡，預設為退休年齡
            const currentSaleAge = nSaleAge || nRetireAge; 
            const yearsToSale = Math.max(0, currentSaleAge - nAge); 
            
            if (yearsToSale >= 0) {
                const marketValueAtSale = realEstate * Math.pow(1 + rEffReApp, yearsToSale);
                // 淨出售收入 = 房屋市價 - 貸款餘額 - 交易成本
                const netSale = (marketValueAtSale - mortgageBalance) * (1 - sellCostRate);
                
                let saleProceedsAtRetire = 0;
                if (currentSaleAge <= nRetireAge) {
                    // 退休前出售：資金增值
                    const yearsDiff = nRetireAge - currentSaleAge;
                    saleProceedsAtRetire = netSale * Math.pow(1 + rEffPre, yearsDiff); 
                } else { 
                    // 退休後出售：資金折現
                    const yearsDiff = currentSaleAge - nRetireAge;
                    saleProceedsAtRetire = netSale / Math.pow(1 + rEffPost, yearsDiff);
                }
                futureRealEstate = saleProceedsAtRetire;
            }
        }

        const calculatedAssets = futureAsset + futureRealEstate;

        // 9. 計算結果
        const gap = calculatedAssets - totalNeed;
        const coverage = totalNeed > 0 ? calculatedAssets / totalNeed : 0;
        
        // 計算資產耗盡年限 (簡化模型，用於 Years Covered 顯示)
        let yearsCovered = yearsInRetire;
        if (calculatedAssets < totalNeed && calculatedAssets > 0 && netExpenseFirstYear > 0) {
            // 使用更準確的年限公式
            if (rEffPost !== 0) {
                const term = (calculatedAssets * rEffPost) / netExpenseFirstYear;
                if (term < 1) {
                    // 公式：n = -ln(1 - (A * r) / W) / ln(1 + r)
                    yearsCovered = -Math.log(1 - term) / Math.log(1 + rEffPost);
                }
            } else {
                // 零利率情況
                yearsCovered = calculatedAssets / netExpenseFirstYear;
            }
        }
        // 將年限四捨五入到整數，並確保不超過預估壽命
        yearsCovered = Math.max(0, Math.floor(Math.min(yearsCovered, yearsInRetire)));


        // 10. 最終顯示數值調整
        // nominalFactor 將實質值轉為名目值 (退休時點的通膨水平)
        const nominalFactor = Math.pow(1 + inflation, yearsToRetire);
        
        // 如果是名目模式，則將結果乘以通膨因子
        const needForDisplay = isRealMode ? totalNeed : totalNeed * nominalFactor;
        const assetsForDisplay = isRealMode ? calculatedAssets : calculatedAssets * nominalFactor;

        // 11. 最終回傳 (確保 errorMessage 為 undefined)
        return {
            need: totalNeed,
            assets: calculatedAssets,
            gap: gap,
            yearsCovered: yearsCovered, 
            coverage: coverage,
            needForDisplay: needForDisplay,
            assetsForDisplay: assetsForDisplay,
            fmt: numberFormatter, 
            errorMessage: undefined,
        };

    }, [inputs]);
}