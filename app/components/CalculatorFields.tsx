import React from "react";
// 修正路徑
import { CalculatorOutputs, CalculatorInputs } from "../../lib/useRetirementCalculator"; 
import { FieldError } from "../../lib/useFieldValidation";

// ----------------------------------------------------------------------
// Interfaces and Types
// ----------------------------------------------------------------------

interface Option { label: string; value: string }
interface SegmentProps { label: string; value: string; onChange: (v: string) => void; options: Option[] }
// 移除 KpiProps，因為 Kpi 已經被 ResultBox 取代且不在此元件內使用。
interface InputFieldProps { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  error?: FieldError;
}

interface CalculatorProps {
    inputs: CalculatorInputs;
    handleInputChange: (field: keyof CalculatorInputs, value: string) => void;
    outputs: CalculatorOutputs; // 確保是非 undefined 的物件
    errors?: { [key: string]: FieldError };
}

// ----------------------------------------------------------------------
// Sub Components 
// ----------------------------------------------------------------------

// 格式化數字字串為帶逗號的字串 (用於顯示)
const formatCurrency = (value: string) => {
    // 移除所有非數字和小數點的字元
    const cleaned = value.replaceAll(",", "").replace(/[^0-9.]/g, '');
    if (cleaned === '') return '';
    
    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    
    // 對整數部分進行千分位格式化
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return formattedInteger + decimalPart;
};


/** 數字輸入欄位 (NumberField) - 僅允許整數，用於年齡、年限 */
export function NumberField({ label, value, onChange, placeholder, error }: InputFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 僅允許數字
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        onChange(rawValue);
    };

    const hasError = error?.hasError;
    const borderClass = hasError 
      ? 'ring-2 ring-red-400/50 bg-red-50/50' 
      : 'bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-400/50';

    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder || "請輸入數字"}
                    className={`w-full rounded-2xl border-0 px-5 py-4 text-base outline-none transition-all duration-200 shadow-sm text-gray-900 placeholder-gray-400 ${borderClass}`}
                />
                {hasError && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xl">
                    ⚠️
                  </div>
                )}
            </div>
            {hasError && (
              <p className="mt-2 text-xs text-red-600 font-medium">
                {error.errorMessage}
              </p>
            )}
        </div>
    );
}

/** 金額輸入欄位 (CurrencyField) - 允許小數點和逗號 */
export function CurrencyField({ label, value, onChange, placeholder, error }: InputFieldProps) {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 傳回的值包含逗號（由 page.tsx 儲存），但只保留有效字元
        // 核心邏輯在 useRetirementCalculator 內部清理
        onChange(e.target.value); 
    };

    // 顯示時自動格式化
    const displayValue = formatCurrency(value);

    const hasError = error?.hasError;
    const borderClass = hasError 
      ? 'ring-2 ring-red-400/50 bg-red-50/50' 
      : 'bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-400/50';

    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue} 
                    onChange={handleChange}
                    placeholder={placeholder || "請輸入金額"}
                    className={`w-full rounded-2xl border-0 px-5 py-4 text-base outline-none transition-all duration-200 shadow-sm text-gray-900 placeholder-gray-400 ${borderClass}`}
                />
                {hasError && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xl">
                    ⚠️
                  </div>
                )}
            </div>
            {hasError && (
              <p className="mt-2 text-xs text-red-600 font-medium">
                {error.errorMessage}
              </p>
            )}
        </div>
    );
}

/** 百分比輸入欄位 (PercentField) - 允許小數點 */
export function PercentField({ label, value, onChange, placeholder, error }: InputFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 允許數字和單個小數點
        const cleaned = e.target.value.replace(/[^\d.]/g,"").replace(/^(\d*\.\d*).*$/,"$1");
        onChange(cleaned);
    };

    const hasError = error?.hasError;
    const borderClass = hasError 
      ? 'ring-2 ring-red-400/50 bg-red-50/50' 
      : 'bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-400/50';

    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder || "例如 2 或 2.5"}
                        className={`w-full rounded-2xl border-0 px-5 py-4 text-base outline-none transition-all duration-200 shadow-sm text-gray-900 placeholder-gray-400 ${borderClass}`}
                    />
                    {hasError && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xl">
                        ⚠️
                      </div>
                    )}
                </div>
                <span className="text-base font-semibold text-gray-600 min-w-[24px]">%</span>
            </div>
            {hasError && (
              <p className="mt-2 text-xs text-red-600 font-medium">
                {error.errorMessage}
              </p>
            )}
        </div>
    );
}

/** 區段選擇器 (Segment) - iOS Style 支援多選項的美化版本 */
export function Segment({ label, value, onChange, options }: SegmentProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">{label}</label>
            <div className={`grid ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl`}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-xl px-4 py-3.5 font-semibold transition-all duration-200 active:scale-95 ${
                            option.value === value 
                                ? 'bg-white text-emerald-700 shadow-lg scale-[1.02]' 
                                : 'bg-transparent text-gray-600 hover:bg-white/50'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** 下拉式選單 (Select) - iOS Style */
export function Select({ label, value, onChange, options }: SegmentProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border-0 bg-gray-50 px-5 py-4 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-400/50 transition-all duration-200 shadow-sm text-gray-900"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}


// ----------------------------------------------------------------------
// Main Component (主元件)
// ----------------------------------------------------------------------

export function CalculatorFields({ inputs, handleInputChange, outputs, errors = {} }: CalculatorProps) {
    
    // 檢查是否有填寫房地產估值（用於條件式顯示）
    const hasRealEstate = React.useMemo(() => {
        const value = inputs.realEstate?.replaceAll(",", "") || "0";
        return parseFloat(value) > 0;
    }, [inputs.realEstate]);
    
    const reModeOptions = [
        { label: "保留", value: "keep" },
        { label: "出售", value: "sell" },
        { label: "出租", value: "rent" },
    ];
    
    // 輔助函數：處理非金額欄位輸入
    const handleNumChange = (field: string, value: string) => {
        handleInputChange(field as keyof CalculatorInputs, value);
    };

    // 🎯 友善提示與錯誤判斷
    const isInitial = !inputs.age && !inputs.retireAge && !inputs.lifeExp;

    return (
        <div className="space-y-8">
            {/* 1. 基本資料 - iOS Style */}
            <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border-0 transition-all duration-300 hover:shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">您的退休時間軸</h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {/* 年齡欄位使用 NumberField，錯誤訊息顯示在下方 */}
                    <NumberField 
                        label="當前年齡" 
                        value={inputs.age} 
                        onChange={(v) => handleNumChange('age', v)} 
                        placeholder="歲"
                        error={errors.age}
                    />
                    <NumberField 
                        label="預計退休年齡" 
                        value={inputs.retireAge} 
                        onChange={(v) => handleNumChange('retireAge', v)} 
                        placeholder="歲"
                        error={errors.retireAge}
                    />
                    <NumberField 
                        label="預估壽命" 
                        value={inputs.lifeExp} 
                        onChange={(v) => handleNumChange('lifeExp', v)} 
                        placeholder="歲"
                        error={errors.lifeExp}
                    />
                    
                    {/* 金額欄位使用 CurrencyField */}
                    <CurrencyField 
                        label="退休後每月支出" 
                        value={inputs.monthlyExpense} 
                        onChange={(v) => handleInputChange('monthlyExpense', v)} 
                        placeholder="NTD"
                        error={errors.monthlyExpense}
                    />
                    <CurrencyField 
                        label="退休前每月可儲蓄" 
                        value={inputs.monthlySaving} 
                        onChange={(v) => handleInputChange('monthlySaving', v)} 
                        placeholder="NTD"
                        error={errors.monthlySaving}
                    />
                    <CurrencyField 
                        label="退休後固定月收入" 
                        value={inputs.postFixedIncome} 
                        onChange={(v) => handleInputChange('postFixedIncome', v)} 
                        placeholder="NTD"
                        error={errors.postFixedIncome}
                    />
                </div>
            </section>

            {/* 2. 資產資訊 - iOS Style */}
            <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border-0 transition-all duration-300 hover:shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">目前擁有的資產</h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <CurrencyField 
                        label="現金與存款" 
                        value={inputs.cash} 
                        onChange={(v) => handleInputChange('cash', v)} 
                        placeholder="NTD"
                        error={errors.cash}
                    />
                    <CurrencyField 
                        label="投資資產 (股票、基金等)" 
                        value={inputs.invest} 
                        onChange={(v) => handleInputChange('invest', v)} 
                        placeholder="NTD"
                        error={errors.invest}
                    />
                    <CurrencyField 
                        label="房地產估值" 
                        value={inputs.realEstate} 
                        onChange={(v) => handleInputChange('realEstate', v)} 
                        placeholder="NTD"
                        error={errors.realEstate}
                    />
                    
                    {/* 條件式顯示：只有在填寫房地產估值時才顯示房貸相關欄位 */}
                    {hasRealEstate && (
                        <>
                            <CurrencyField 
                                label="房貸餘額" 
                                value={inputs.mortgageBalance} 
                                onChange={(v) => handleInputChange('mortgageBalance', v)} 
                                placeholder="NTD"
                                error={errors.mortgageBalance}
                            />
                            <PercentField 
                                label="房貸年利率" 
                                value={inputs.mortgageAprPct} 
                                onChange={(v) => handleNumChange('mortgageAprPct', v)} 
                                placeholder="%"
                                error={errors.mortgageAprPct}
                            />
                            <NumberField 
                                label="房貸剩餘年限" 
                                value={inputs.mortgageYearsLeft} 
                                onChange={(v) => handleNumChange('mortgageYearsLeft', v)} 
                                placeholder="年"
                                error={errors.mortgageYearsLeft}
                            />
                        </>
                    )}
                </div>
                
                {/* 提示：未填寫房地產時的說明 */}
                {!hasRealEstate && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            💡 <span className="font-semibold">提示：</span>
                            填寫「房地產估值」後，將顯示房貸相關欄位和房地產處置選項。
                        </p>
                    </div>
                )}
            </section>

            {/* 3. 預期報酬與通膨 - iOS Style */}
            <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border-0 transition-all duration-300 hover:shadow-xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">投資報酬與通膨預估</h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <PercentField 
                            label="退休前預期年報酬率" 
                            value={inputs.rPrePct} 
                            onChange={(v) => handleNumChange('rPrePct', v)} 
                            placeholder="%"
                            error={errors.rPrePct}
                        />
                        <div className="text-gray-500 text-xs mt-1">僅計算「投資資產」部分，不包含現金與存款。</div>
                    </div>
                    <PercentField 
                        label="退休後預期年報酬率" 
                        value={inputs.rPostPct} 
                        onChange={(v) => handleNumChange('rPostPct', v)} 
                        placeholder="%"
                        error={errors.rPostPct}
                    />
                    <div>
                        <PercentField 
                            label="長期通膨率" 
                            value={inputs.inflationPct} 
                            onChange={(v) => handleNumChange('inflationPct', v)} 
                            placeholder="%"
                            error={errors.inflationPct}
                        />
                        <div className="text-gray-500 text-xs mt-1">台灣近10年平均約 1.5% ~ 2.5%</div>
                    </div>
                    
                    {/* 條件式顯示：只有在填寫房地產估值時才顯示 */}
                    {hasRealEstate && (
                        <div>
                            <PercentField 
                                label="房地產年增值率" 
                                value={inputs.reAppPct} 
                                onChange={(v) => handleNumChange('reAppPct', v)} 
                                placeholder="%"
                                error={errors.reAppPct}
                            />
                            <div className="text-gray-500 text-xs mt-1">台灣近10年平均約 2% ~ 4%（實際依區域波動）</div>
                        </div>
                    )}
                    
                    <div>
                        <PercentField 
                            label="醫療費用晚期加成" 
                            value={inputs.medicalLateBoostPct} 
                            onChange={(v) => handleNumChange('medicalLateBoostPct', v)} 
                            placeholder="%"
                            error={errors.medicalLateBoostPct}
                        />
                        <div className="text-gray-500 text-xs mt-1">
                            用於模擬退休後最後10年醫療支出增加的幅度。<br />
                            例如填 20，代表晚年每年支出比退休初期多 20%。<br />
                            若不確定可填 0～20。
                        </div>
                    </div>
                    <Select
                        label="計算模式"
                        value={inputs.mode}
                        onChange={(v) => handleInputChange('mode', v)}
                        options={[{ label: "實質 (Real)", value: "real" }, { label: "名目 (Nominal)", value: "nominal" }]}
                    />
                </div>
            </section>
            
            {/* 4. 房地產處置 - iOS Style - 條件式顯示：只有在填寫房地產估值時才顯示 */}
            {hasRealEstate && (
                <section className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-lg border-0 transition-all duration-300 hover:shadow-xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">房地產規劃</h2>
                        <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                    </div>
                    
                    {/* 處置方式選擇 - 全寬顯示 */}
                    <div className="mb-6">
                        <Segment
                            label="處置方式"
                            value={inputs.reMode}
                            onChange={(v) => handleInputChange('reMode', v)}
                            options={reModeOptions}
                        />
                    </div>

                    {/* 根據選擇的處置方式顯示對應欄位 */}
                    {inputs.reMode === 'keep' && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">🏠 保留自住</span><br />
                                房地產將不計入退休資產，但可以減少退休後的居住支出（無需支付房租）。
                            </p>
                        </div>
                    )}

                    {inputs.reMode === 'sell' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <NumberField 
                                label="預計出售年齡" 
                                value={inputs.saleAge} 
                                onChange={(v) => handleNumChange('saleAge', v)} 
                                placeholder="歲"
                                error={errors.saleAge}
                            />
                            <div>
                                <PercentField 
                                    label="出售成本/稅費" 
                                    value={inputs.sellCostRatePct} 
                                    onChange={(v) => handleNumChange('sellCostRatePct', v)} 
                                    placeholder="%"
                                    error={errors.sellCostRatePct}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    💡 <span className="font-semibold">台灣平均參考值：</span><br />
                                    • 房屋稅、地價稅：約 <span className="font-semibold text-blue-600">0.5%~1.5%</span><br />
                                    • 土地增值稅：約 <span className="font-semibold text-blue-600">20%~40%</span>（持有時間越長稅率越低）<br />
                                    • 仲介費、代書費等：約 <span className="font-semibold text-blue-600">3%~6%</span><br />
                                    → 建議填寫：<span className="font-semibold text-emerald-600">6%~10%</span>（保守估計）
                                </div>
                            </div>
                            <div className="sm:col-span-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-sm text-emerald-800">
                                    <span className="font-semibold">📊 計算說明</span><br />
                                    出售所得 = (房屋市值 - 貸款餘額) × (1 - 出售成本%)，並根據出售時間點折現或增值到退休時計入資產。
                                </p>
                            </div>
                        </div>
                    )}

                    {inputs.reMode === 'rent' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <NumberField 
                                label="預計開始出租年齡" 
                                value={inputs.rentAge} 
                                onChange={(v) => handleNumChange('rentAge', v)} 
                                placeholder="歲"
                                error={errors.rentAge}
                            />
                            <CurrencyField 
                                label="每月淨租金收入" 
                                value={inputs.rentNetMonthly} 
                                onChange={(v) => handleInputChange('rentNetMonthly', v)} 
                                placeholder="NTD"
                                error={errors.rentNetMonthly}
                            />
                            <div className="sm:col-span-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-800">
                                    <span className="font-semibold">📊 計算說明</span><br />
                                    從開始出租年齡起，每月淨租金收入將自動納入退休後固定月收入計算，減少實際支出缺口。
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}