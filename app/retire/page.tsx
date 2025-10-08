// app/retire/page.tsx (最終修正 JSX 編譯錯誤 V2)

"use client";

import { useState, useMemo } from "react";
// 修正路徑：從 app/retire/ 往上兩層到 /lib
import { useRetirementCalculator, BRAND, CalculatorInputs } from "../../lib/useRetirementCalculator"; 
// 修正路徑：從 app/retire/ 往上兩層到 /lib，假設 supabaseClient.ts 導出 { supabase }
import { supabase } from "../../lib/supabaseClient"; 
// 修正路徑：從 app/retire/ 往上到 /components
import { CalculatorFields } from "../components/CalculatorFields"; 

// =================================================================
// 介面與預設值
// =================================================================


export const defaultInputs: CalculatorInputs = {
    age: "", retireAge: "", lifeExp: "",
    monthlyExpense: "", monthlySaving: "", postFixedIncome: "", 
    cash: "", invest: "", realEstate: "",
    mortgageBalance: "", mortgageAprPct: "", mortgageYearsLeft: "",
    rPrePct: "", rPostPct: "", inflationPct: "", 
    reAppPct: "", medicalLateBoostPct: "",
    reMode: "keep", 
    sellCostRatePct: "", 
    rentNetMonthly: "", 
    saleAge: "",
    mode: "real",
};

// =================================================================
// 輔助組件 (ResultBox - 用於顯示 Kpi)
// =================================================================

interface ResultBoxProps {
    title: string;
    value: string;
    className?: string;
    valueClass?: string;
}

const ResultBox = ({ title, value, className = 'bg-white', valueClass = 'text-gray-800' }: ResultBoxProps) => (
    <div className={`p-4 rounded-lg shadow-md border border-gray-100 flex flex-col items-center justify-center ${className}`}>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className={`text-xl font-extrabold ${valueClass} break-all text-center`}>{value}</p>
    </div>
);


// =================================================================
// 主組件
// =================================================================

export default function RetirePage() {
    const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);

    // 儲存試算相關狀態
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveForm, setSaveForm] = useState({ name: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // 載入試算相關狀態
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [loadEmail, setLoadEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadStatus, setLoadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // 核心計算 Hook - 確保 outputs 永遠是完整的物件
    const outputs = useRetirementCalculator(inputs);
    
    // 從 outputs 解構必要的屬性
    const { fmt, needForDisplay, assetsForDisplay, gap, coverage, yearsCovered } = outputs; 
    
    // 處理輸入變化
    const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const inputProps = useMemo(() => ({
        inputs,
        handleInputChange,
        outputs,
    }), [inputs, outputs]);

    // 儲存試算處理函數
    const handleSavePlan = async () => {
        setSaving(true);
        setSaveStatus(null);
        
        try {
            // 清理輸入資料
            const cleanedInputs = Object.fromEntries(
                Object.entries(inputs).map(([key, value]) => [
                    key,
                    typeof value === 'string' ? value.replaceAll(",", "").replace(/[^0-9.]/g, '') : value
                ])
            ) as CalculatorInputs;

            // 自動生成標題
            const planName = `${saveForm.name} 的退休規劃 - ${new Date().toLocaleDateString('zh-TW')}`;

            // 儲存到 plans 表
            const { error } = await supabase
                .from('plans')
                .insert({
                    user_id: null,
                    user_email: saveForm.email,
                    name: planName,
                    inputs: cleanedInputs,
                    outputs: outputs,
                    is_public: false
                });

            if (error) throw error;

            setSaveStatus({ type: 'success', message: `${saveForm.name}，您的試算結果已成功儲存！` });
            setSaveForm({ name: '', email: '' });
            setTimeout(() => {
                setShowSaveModal(false);
                setSaveStatus(null);
            }, 2000);
            
        } catch (err) {
            console.error('儲存錯誤:', err);
            const errorMessage = err instanceof Error ? err.message : '請稍後再試';
            setSaveStatus({ type: 'error', message: `儲存失敗: ${errorMessage}` });
        } finally {
            setSaving(false);
        }
    };

    // 載入試算處理函數
    const handleLoadPlan = async () => {
        setLoading(true);
        setLoadStatus(null);
        
        try {
            // 查詢最新一筆記錄
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .eq('user_email', loadEmail)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;

            if (!data) {
                setLoadStatus({ type: 'error', message: '找不到與此 Email 相關的試算記錄，請確認 Email 是否正確。' });
                return;
            }

            // 從 name 中解析出用戶名稱（例如："王小明 的退休規劃 - 2025/10/8" -> "王小明"）
            const userName = data.name.split(' 的退休規劃')[0] || '您';

            // 載入資料到表單
            setInputs(data.inputs as CalculatorInputs);
            
            setLoadStatus({ type: 'success', message: `${userName}您好，這是您前一次的試算結果。` });
            setTimeout(() => {
                setShowLoadModal(false);
                setLoadStatus(null);
                setLoadEmail('');
            }, 2000);
            
        } catch (err) {
            console.error('載入錯誤:', err);
            const errorMessage = err instanceof Error ? err.message : '請稍後再試';
            setLoadStatus({ type: 'error', message: `載入失敗: ${errorMessage}` });
        } finally {
            setLoading(false);
        }
    };

    // 計算退休前年數 (用於儲蓄建議)
    const currentAge = Number(inputs.age) || 0;
    const retireAge = Number(inputs.retireAge) || 0;
    const yearsToRetire = Math.max(0, retireAge - currentAge);


    // =================================================================
    // 渲染計算結果區塊
    // =================================================================

    const renderResults = () => {
        
        // 🎯 結果區塊永遠渲染 (不檢查 errorMessage)
        
        return (
            <div className="my-6">
                
                {/* 修正 JSX 語法錯誤的計算說明區塊：避免使用連續的特殊符號 */}
                <div className="p-4 bg-gray-100 rounded-lg mb-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-700 mb-2">計算方式與邏輯說明</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>**核心原則**: **實質購買力 (Real Value)** 計算。所有金額均已考慮通膨因素，避免名目金額失真。</li>
                        {/* 關鍵修正點：將公式寫成更容易解析的純文字 */}
                        <li>**實質報酬率**: 公式為 **(名目報酬率 - 通膨率) 除以 (1 + 通膨率)**。</li>
                        <li>**資金缺口**: 資產與需求的比較是在**同一時間點 (退休時點)** 的實質購買力基礎上進行。</li>
                        {/* 修正點：避免使用 < 符號，改用文字描述 */}
                        <li>**年齡限制**: 必須滿足 **當前年齡要小於退休年齡，退休年齡要小於預估壽命**。</li>
                    </ul>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-emerald-700 border-b pb-2">5. 計算結果</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <ResultBox title="退休所需金額 (實質)" value={`NT$ ${fmt(needForDisplay)}`} />
                    <ResultBox title="預估退休資產 (實質)" value={`NT$ ${fmt(assetsForDisplay)}`} />
                    <ResultBox 
                        title="資金缺口" 
                        value={`NT$ ${fmt(gap)}`} 
                        className={gap < 0 ? 'bg-red-50' : 'bg-emerald-50'}
                        valueClass={gap < 0 ? 'text-red-600' : 'text-emerald-600'}
                    /> 
                </div>
                <p className="text-center text-sm mt-4 text-gray-600">
                    覆蓋率: **{(coverage * 100).toFixed(1)}%** (目標 {yearsCovered || '--'} 年)。
                    以實質購買力計算可支撐約 **{yearsCovered}** 年。
                </p>
                
                {yearsToRetire > 0 && (
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-lg">
                        <h4 className="text-xl font-bold text-blue-800 mb-2">6. 每月儲蓄建議</h4>
                        <p className="text-2xl font-extrabold text-blue-600 text-center">
                            建議每月儲蓄金額: NT$ {fmt(Math.max(0, -gap / yearsToRetire / 12))}
                        </p>
                        <p className="text-sm text-blue-600 text-center mt-2">（根據資金缺口平攤至退休前剩餘 {yearsToRetire} 年）</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Header */}
            <div className={`w-full p-8 text-center text-white shadow-md ${BRAND}`}>
                <h1 className="text-3xl font-bold md:text-4xl">
                    讓退休，不只是夢想，而是可看見的目標
                </h1>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow w-full max-w-4xl px-4 py-8 md:p-8">
                {/* 輸入欄位和年齡警告 (錯誤訊息會在 CalculatorFields 內部處理) */}
                <CalculatorFields {...inputProps} /> 
                
                {/* 計算結果區塊 - 永遠渲染 (結果為 0 或計算值) */}
                {renderResults()}
            </main>

            {/* Fixed Footer */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur ring-1 ring-gray-200 z-10">
                <div className="max-w-4xl mx-auto w-full p-3 grid grid-cols-2 gap-3 md:gap-4">
                    <button
                        className="rounded-xl px-3 py-3 text-sm font-semibold border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition"
                        onClick={() => setShowLoadModal(true)}
                    >
                        載入試算
                    </button>
                    <button
                        className="rounded-xl px-3 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                        onClick={() => setShowSaveModal(true)}
                    >
                        儲存試算
                    </button>
                </div>
            </footer>

            {/* 儲存試算彈窗 */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowSaveModal(false);
                                setSaveStatus(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">儲存您的試算結果</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleSavePlan(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    用戶名稱 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="請輸入您的姓名"
                                    required
                                    value={saveForm.name}
                                    onChange={e => setSaveForm(prev => ({ ...prev, name: e.target.value }))}
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
                                    value={saveForm.email}
                                    onChange={e => setSaveForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                                />
                            </div>
                            {saveStatus && (
                                <div className={`p-3 border rounded ${
                                    saveStatus.type === 'success'
                                        ? 'bg-green-100 text-green-800 border-green-400'
                                        : 'bg-red-100 text-red-800 border-red-400'
                                }`}>
                                    {saveStatus.message}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                            >
                                {saving ? '儲存中...' : '儲存'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 載入試算彈窗 */}
            {showLoadModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowLoadModal(false);
                                setLoadStatus(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">載入您的試算結果</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleLoadPlan(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="請輸入您儲存時使用的 Email"
                                    required
                                    value={loadEmail}
                                    onChange={e => setLoadEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900"
                                />
                                <p className="text-sm text-gray-500 mt-1">我們會載入您最近一次的試算記錄</p>
                            </div>
                            {loadStatus && (
                                <div className={`p-3 border rounded ${
                                    loadStatus.type === 'success'
                                        ? 'bg-green-100 text-green-800 border-green-400'
                                        : 'bg-red-100 text-red-800 border-red-400'
                                }`}>
                                    {loadStatus.message}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                            >
                                {loading ? '載入中...' : '載入'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}