import React from "react";
// 修正路徑
import { CalculatorOutputs, CalculatorInputs } from "../../lib/useRetirementCalculator"; 
import { supabase } from "@/lib/supabaseClient";

// ----------------------------------------------------------------------
// Interfaces and Types
// ----------------------------------------------------------------------

interface Option { label: string; value: string }
interface SegmentProps { label: string; value: string; onChange: (v: string) => void; options: Option[] }
// 移除 KpiProps，因為 Kpi 已經被 ResultBox 取代且不在此元件內使用。
interface InputFieldProps { label: string; value: string; onChange: (v: string) => void; placeholder?: string; }

interface CalculatorProps {
    inputs: CalculatorInputs;
    handleInputChange: (field: keyof CalculatorInputs, value: string) => void;
    outputs: CalculatorOutputs; // 確保是非 undefined 的物件
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
export function NumberField({ label, value, onChange, placeholder }: InputFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 僅允許數字
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        onChange(rawValue);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={handleChange}
                placeholder={placeholder || "請輸入數字"}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors shadow-sm text-gray-900"
            />
        </div>
    );
}

/** 金額輸入欄位 (CurrencyField) - 允許小數點和逗號 */
export function CurrencyField({ label, value, onChange, placeholder }: InputFieldProps) {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 傳回的值包含逗號（由 page.tsx 儲存），但只保留有效字元
        // 核心邏輯在 useRetirementCalculator 內部清理
        onChange(e.target.value); 
    };

    // 顯示時自動格式化
    const displayValue = formatCurrency(value);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label} (NTD)</label>
            <input
                type="text"
                inputMode="numeric"
                value={displayValue} 
                onChange={handleChange}
                placeholder={placeholder || "請輸入金額"}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors shadow-sm text-gray-900"
            />
        </div>
    );
}

/** 百分比輸入欄位 (PercentField) - 允許小數點 */
export function PercentField({ label, value, onChange, placeholder }: InputFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 允許數字和單個小數點
        const cleaned = e.target.value.replace(/[^\d.]/g,"").replace(/^(\d*\.\d*).*$/,"$1");
        onChange(cleaned);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex items-center">
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder || "例如 2 或 2.5"}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors shadow-sm text-gray-900"
                />
                <span className="ml-3 text-base font-medium text-neutral-600">%</span>
            </div>
        </div>
    );
}

/** 區段選擇器 (Segment) */
export function Segment({ label, value, onChange, options }: SegmentProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="grid grid-cols-2 rounded-xl border border-neutral-200 p-1 text-sm bg-gray-50 shadow-inner">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`rounded-lg px-3 py-2 font-semibold transition-all ${
                            option.value === value 
                                ? 'bg-white shadow-md text-emerald-700 ring-1 ring-neutral-200' 
                                : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** 下拉式選單 (Select) */
export function Select({ label, value, onChange, options }: SegmentProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors shadow-sm text-gray-900"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}


// ----------------------------------------------------------------------
// Main Component (主元件)
// ----------------------------------------------------------------------

export function CalculatorFields({ inputs, handleInputChange, outputs }: CalculatorProps) {
    
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
    const isAgeError = outputs.errorMessage &&
        outputs.errorMessage !== "輸入或計算中..." &&
        (outputs.errorMessage.includes("年齡") || outputs.errorMessage.includes("正數"));
    const showHint = isInitial || outputs.errorMessage === "輸入或計算中...";

    const [showContact, setShowContact] = React.useState(false);
    const [contact, setContact] = React.useState({ name: '', phone: '', email: '' });
    const [submitting, setSubmitting] = React.useState(false);
    const [submitStatus, setSubmitStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleContactChange = (field: string, value: string) => {
        setContact(prev => ({ ...prev, [field]: value }));
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus(null);
        try {
            // 準備要插入的資料（user_id 設為 null 以符合匿名用戶 RLS 政策）
            const planData = {
                user_id: null,  // 匿名用戶，user_id 必須為 null
                user_email: contact.email,
                name: '退休規劃方案',
                inputs: inputs,
                outputs: outputs,
                is_public: false
            };
            
            console.log('準備插入 plans 表的資料:', planData);

            // 1. 儲存試算方案到 plans 表
            const { data: plan, error: planError } = await supabase
                .from('plans')
                .insert([planData])
                .select()
                .single();

            if (planError) {
                console.error('Plan Error 詳細資訊:', planError);
                throw planError;
            }

            console.log('Plans 表插入成功:', plan);

            // 準備 leads 資料
            const leadData = {
                plan_id: plan.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                source: 'calculator',
                status: 'new',
                inputs: inputs,
                utm: {}
            };

            console.log('準備插入 leads 表的資料:', leadData);

            // 2. 儲存聯絡資訊到 leads 表
            const { error: leadError } = await supabase
                .from('leads')
                .insert([leadData]);

            if (leadError) {
                console.error('Lead Error 詳細資訊:', leadError);
                throw leadError;
            }

            console.log('Leads 表插入成功');

            setSubmitStatus({ type: 'success', message: '感謝您的填寫，我們會盡快與您聯絡！' });
            setContact({ name: '', phone: '', email: '' });
            setTimeout(() => setShowContact(false), 2000);
            
        } catch (err) {
            console.error('提交錯誤完整資訊:', err);
            const errorMessage = err instanceof Error ? err.message : '請稍後再試';
            setSubmitStatus({ type: 'error', message: `儲存失敗: ${errorMessage}` });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* 1. 填寫基本資料 */}
            <section className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-emerald-700 mb-6 border-b pb-2">1. 填寫基本資料</h2>
                {/* 🎯 初始友善提示 */}
                {showHint && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative mb-6">
                        <strong className="font-bold">提示：</strong>
                        <ul className="list-disc pl-5">
                            <li>請輸入 1-100 歲的當前年齡</li>
                            <li>預計退休年齡需大於當前年齡，且小於壽命</li>
                            <li>預估壽命建議 1-120 歲</li>
                        </ul>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {/* 年齡欄位使用 NumberField，錯誤訊息顯示在下方 */}
                    <div>
                        <NumberField label="當前年齡" value={inputs.age} onChange={(v) => handleNumChange('age', v)} placeholder="年" />
                        {isAgeError && outputs.errorMessage?.includes("當前年齡") && (
                            <div className="text-red-600 text-sm mt-1">當前年齡必須為 1-100 歲，且小於退休年齡。</div>
                        )}
                    </div>
                    <div>
                        <NumberField label="預計退休年齡" value={inputs.retireAge} onChange={(v) => handleNumChange('retireAge', v)} placeholder="年" />
                        {isAgeError && outputs.errorMessage?.includes("退休年齡") && (
                            <div className="text-red-600 text-sm mt-1">退休年齡必須為 1-100 歲，且大於當前年齡、小於壽命。</div>
                        )}
                    </div>
                    <div>
                        <NumberField label="預估壽命" value={inputs.lifeExp} onChange={(v) => handleNumChange('lifeExp', v)} placeholder="年" />
                        {isAgeError && outputs.errorMessage?.includes("壽命") && (
                            <div className="text-red-600 text-sm mt-1">壽命必須為 1-120 歲，且大於退休年齡。</div>
                        )}
                    </div>
                    
                    {/* 金額欄位使用 CurrencyField */}
                    <CurrencyField label="退休後每月支出" value={inputs.monthlyExpense} onChange={(v) => handleInputChange('monthlyExpense', v)} placeholder="NTD" />
                    <CurrencyField label="退休前每月可儲蓄" value={inputs.monthlySaving} onChange={(v) => handleInputChange('monthlySaving', v)} placeholder="NTD" />
                    <CurrencyField label="退休後固定月收入" value={inputs.postFixedIncome} onChange={(v) => handleInputChange('postFixedIncome', v)} placeholder="NTD" />
                </div>
            </section>

            {/* 2. 填寫資產資訊 */}
            <section className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-emerald-700 mb-6 border-b pb-2">2. 填寫資產資訊</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <CurrencyField label="現金與存款" value={inputs.cash} onChange={(v) => handleInputChange('cash', v)} placeholder="NTD" />
                    <CurrencyField label="投資資產 (股票、基金等)" value={inputs.invest} onChange={(v) => handleInputChange('invest', v)} placeholder="NTD" />
                    <CurrencyField label="房地產估值" value={inputs.realEstate} onChange={(v) => handleInputChange('realEstate', v)} placeholder="NTD" />
                    <CurrencyField label="房貸餘額" value={inputs.mortgageBalance} onChange={(v) => handleInputChange('mortgageBalance', v)} placeholder="NTD" />
                    
                    <PercentField label="房貸年利率" value={inputs.mortgageAprPct} onChange={(v) => handleNumChange('mortgageAprPct', v)} placeholder="%" />
                    <NumberField label="房貸剩餘年限" value={inputs.mortgageYearsLeft} onChange={(v) => handleNumChange('mortgageYearsLeft', v)} placeholder="年" />
                </div>
            </section>

            {/* 3. 預期報酬與通膨 */}
            <section className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-emerald-700 mb-6 border-b pb-2">3. 預期報酬與通膨</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <PercentField label="退休前預期年報酬率" value={inputs.rPrePct} onChange={(v) => handleNumChange('rPrePct', v)} placeholder="%" />
                        <div className="text-gray-500 text-xs mt-1">僅計算「投資資產」部分，不包含現金與存款。</div>
                    </div>
                    <PercentField label="退休後預期年報酬率" value={inputs.rPostPct} onChange={(v) => handleNumChange('rPostPct', v)} placeholder="%" />
                    <div>
                        <PercentField label="長期通膨率" value={inputs.inflationPct} onChange={(v) => handleNumChange('inflationPct', v)} placeholder="%" />
                        <div className="text-gray-500 text-xs mt-1">台灣近10年平均約 1.5% ~ 2.5%</div>
                    </div>
                    <div>
                        <PercentField label="房地產年增值率" value={inputs.reAppPct} onChange={(v) => handleNumChange('reAppPct', v)} placeholder="%" />
                        <div className="text-gray-500 text-xs mt-1">台灣近10年平均約 2% ~ 4%（實際依區域波動）</div>
                    </div>
                    <div>
                        <PercentField label="醫療費用晚期加成" value={inputs.medicalLateBoostPct} onChange={(v) => handleNumChange('medicalLateBoostPct', v)} placeholder="%" />
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
            
            {/* 4. 房地產處置 */}
            <section className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-emerald-700 mb-6 border-b pb-2">4. 房地產處置</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <Segment
                        label="處置方式"
                        value={inputs.reMode}
                        onChange={(v) => handleInputChange('reMode', v)}
                        options={reModeOptions}
                    />

                    {inputs.reMode === 'sell' && (
                        <>
                            <PercentField label="出售成本/稅費" value={inputs.sellCostRatePct} onChange={(v) => handleNumChange('sellCostRatePct', v)} placeholder="%" />
                            <NumberField label="預計出售年齡" value={inputs.saleAge} onChange={(v) => handleNumChange('saleAge', v)} placeholder="年" />
                            <div className="sm:col-span-2 text-sm text-gray-500 mt-2">出售所得將納入您的資產計算，並在退休時點折現。</div>
                        </>
                    )}

                    {inputs.reMode === 'rent' && (
                        <>
                            <CurrencyField label="每月淨租金收入" value={inputs.rentNetMonthly} onChange={(v) => handleInputChange('rentNetMonthly', v)} placeholder="NTD" />
                            <div className="sm:col-span-2 text-sm text-gray-500 mt-2">淨租金收入將納入退休後固定月收入計算。</div>
                        </>
                    )}
                </div>
            </section>
            {/* 專家聯絡彈窗 */}
            {showContact && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowContact(false);
                                setSubmitStatus(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">專家諮詢服務</h3>
                        <p className="text-sm text-gray-600 mb-4">我們的專家會根據您的試算結果，提供專業建議。</p>
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    姓名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" 
                                    placeholder="請輸入您的姓名" 
                                    required
                                    value={contact.name} 
                                    onChange={e => handleContactChange('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email" 
                                    placeholder="example@email.com" 
                                    required
                                    value={contact.email} 
                                    onChange={e => handleContactChange('email', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    聯絡電話 <span className="text-gray-400 text-xs">(選填)</span>
                                </label>
                                <input
                                    type="tel" 
                                    placeholder="0912-345-678" 
                                    value={contact.phone} 
                                    onChange={e => handleContactChange('phone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                                />
                            </div>
                            {submitStatus && (
                                <div className={`p-3 border rounded ${
                                    submitStatus.type === 'success' 
                                        ? 'bg-green-100 text-green-800 border-green-400'
                                        : 'bg-red-100 text-red-800 border-red-400'
                                }`}>
                                    {submitStatus.message}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                            >
                                {submitting ? '送出中...' : '立即送出'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* 專家協助按鈕 */}
            <div className="flex justify-center mt-8">
                <button
                    type="button"
                    onClick={() => setShowContact(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:scale-105 transition-transform"
                >
                    我需要專家為我量身規劃
                </button>
            </div>
        </div>
    );
}