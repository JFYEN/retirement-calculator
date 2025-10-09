// app/retire/page.tsx (最終修正 JSX 編譯錯誤 V2)

"use client";

import { useState, useMemo } from "react";
// 修正路徑：從 app/retire/ 往上兩層到 /lib
import { useRetirementCalculator, BRAND, CalculatorInputs } from "../../lib/useRetirementCalculator"; 
// 修正路徑：從 app/retire/ 往上兩層到 /lib，假設 supabaseClient.ts 導出 { supabase }
import { supabase } from "../../lib/supabaseClient"; 
// 修正路徑：從 app/retire/ 往上到 /components
import { CalculatorFields } from "../components/CalculatorFields"; 
// 引入驗證 Hook
import { useFieldValidation } from "../../lib/useFieldValidation";
// 引入圖表組件
import RetirementChart from "../components/RetirementChart";

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
    rentAge: "",
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
    <div className={`p-5 rounded-2xl shadow-sm border-0 flex flex-col items-center justify-center ${className} backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}>
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        <p className={`text-xl font-bold ${valueClass} break-all text-center`}>{value}</p>
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

    // 計算說明收合狀態
    const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

    // 專家聯絡相關狀態
    const [showExpertContact, setShowExpertContact] = useState(false);
    const [expertContact, setExpertContact] = useState({ name: '', phone: '', email: '' });
    const [submittingExpert, setSubmittingExpert] = useState(false);
    const [expertSubmitStatus, setExpertSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // 隱私政策彈窗狀態
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

    // 核心計算 Hook - 確保 outputs 永遠是完整的物件
    const outputs = useRetirementCalculator(inputs);
    
    // 驗證 Hook - 即時驗證所有欄位
    const { errors } = useFieldValidation(inputs);
    
    // 從 outputs 解構必要的屬性
    const { fmt, needForDisplay, assetsForDisplay, gap, coverage, yearsCovered } = outputs; 
    
    // 生成人性化的結果說明文字
    const getHumanizedResultText = () => {
        const retireAge = Number(inputs.retireAge) || 0;
        const lifeExp = Number(inputs.lifeExp) || 0;
        const age = Number(inputs.age) || 0;
        const yearsToRetire = Math.max(0, retireAge - age);
        const yearsInRetire = Math.max(0, lifeExp - retireAge); // 退休期間年數
        const expectedAge = retireAge + yearsCovered;
        
        // 根據不同情況生成不同的說明
        if (gap >= 0) {
            // 資金充足的情況
            if (coverage >= 1.5) {
                return `太棒了！😊 根據您的試算結果，目前的退休準備相當充裕，預計可以安心過到 ${lifeExp} 歲。您可以考慮提早退休，或是把部分資金用在更多想做的事情上喔！`;
            } else if (coverage >= 1.2) {
                return `很不錯！👍 您的退休資金規劃得很好，預計可以撐到 ${lifeExp} 歲。建議持續維持現在的儲蓄習慣，就能安心迎接退休生活囉！`;
            } else {
                return `恭喜您！✨ 目前的規劃剛好可以支應到 ${lifeExp} 歲左右。如果想要生活更寬裕一些，可以考慮多存一點，或是調整投資報酬率假設，讓退休生活更安心喔！`;
            }
        } else {
            // 資金不足的情況
            if (yearsCovered === 0) {
                // 完全沒有資產的情況
                return `⚠️ 目前試算顯示您還沒有退休資產準備。別擔心！現在開始規劃還來得及。建議您可以：(1) 每月固定儲蓄一筆金額 (2) 善用投資工具提高報酬率 (3) 尋求專業理財顧問協助。讓我們一起努力，打造安心的退休生活！`;
            } else if (yearsCovered > 0 && yearsCovered < yearsInRetire) {
                const shortfall = Math.round(lifeExp - expectedAge);
                if (shortfall <= 5) {
                    return `目前的試算顯示，退休金大約可以撐到 ${Math.round(expectedAge)} 歲左右，距離預期壽命還差 ${shortfall} 年。別擔心！😊 只要稍微調整一下儲蓄計畫或報酬率假設，就能更安心囉！`;
                } else if (shortfall <= 10) {
                    return `根據您的試算結果，目前的退休金可以撐到大約 ${Math.round(expectedAge)} 歲左右，距離預期壽命還差 ${shortfall} 年。建議可以增加每月儲蓄，或是調整報酬率假設，讓退休生活更有保障喔！💪`;
                } else {
                    return `提醒您注意！⚠️ 目前的退休準備可能只夠用到 ${Math.round(expectedAge)} 歲左右，距離預期壽命還差 ${shortfall} 年。建議要認真規劃一下了。可以試著提高每月儲蓄金額，或是尋求專業理財顧問的協助，一起找出最適合的退休方案！`;
                }
            } else {
                return `目前的試算顯示退休資金可能會有些吃緊。💡 別擔心！現在開始調整還來得及。建議您可以：(1) 增加每月儲蓄金額 (2) 調整投資組合提高報酬率 (3) 考慮延後退休年齡。讓我們一起努力，打造更安心的退休生活！`;
            }
        }
    };
    
    // 處理輸入變化
    const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const inputProps = useMemo(() => ({
        inputs,
        handleInputChange,
        outputs,
        errors,
    }), [inputs, outputs, errors]);

    // 檢查必要欄位是否已填寫
    const checkRequiredFields = () => {
        const requiredFields = ['age', 'retireAge', 'lifeExp', 'monthlyExpense', 'monthlySaving'];
        const emptyFields = requiredFields.filter(field => !inputs[field as keyof CalculatorInputs]);
        
        if (emptyFields.length > 0) {
            alert('請先填寫基本必要欄位：當前年齡、退休年齡、預期壽命、每月生活費、每月儲蓄金額');
            return false;
        }
        return true;
    };

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

    // 專家聯絡處理函數
    const handleExpertContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingExpert(true);
        setExpertSubmitStatus(null);
        try {
            const planData = {
                user_id: null,
                user_email: expertContact.email,
                name: '退休規劃方案',
                inputs: inputs,
                outputs: outputs,
                is_public: false
            };

            const { data: plan, error: planError } = await supabase
                .from('plans')
                .insert([planData])
                .select()
                .single();

            if (planError) throw planError;

            const leadData = {
                plan_id: plan.id,
                name: expertContact.name,
                phone: expertContact.phone,
                email: expertContact.email,
                source: 'calculator',
                status: 'new',
                inputs: inputs,
                utm: {}
            };

            const { error: leadError } = await supabase
                .from('leads')
                .insert([leadData]);

            if (leadError) throw leadError;

            setExpertSubmitStatus({ type: 'success', message: '感謝您的填寫，我們會盡快與您聯絡！' });
            setExpertContact({ name: '', phone: '', email: '' });
            setTimeout(() => {
                setShowExpertContact(false);
                setExpertSubmitStatus(null);
            }, 2000);
            
        } catch (err) {
            console.error('提交錯誤:', err);
            const errorMessage = err instanceof Error ? err.message : '請稍後再試';
            setExpertSubmitStatus({ type: 'error', message: `儲存失敗: ${errorMessage}` });
        } finally {
            setSubmittingExpert(false);
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
                
                {/* 整合後的主標題 - iOS Style - 更突出的設計 */}
                <div className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl">📊</span>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
                            退休規劃分析結果
                        </h3>
                    </div>
                    <p className="text-center text-white text-xs mt-2 font-normal">
                        根據您的資料，為您量身打造的退休規劃建議
                    </p>
                </div>

                {/* 1. 關鍵數據卡片 - iOS Style */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <ResultBox title="退休所需金額" value={`NT$ ${fmt(needForDisplay)}`} />
                    <ResultBox title="預估退休資產" value={`NT$ ${fmt(assetsForDisplay)}`} />
                    <ResultBox 
                        title={gap >= 0 ? "資金盈餘" : "資金缺口"} 
                        value={`NT$ ${fmt(Math.abs(gap))}`} 
                        className={gap < 0 ? 'bg-red-50/80' : 'bg-emerald-50/80'}
                        valueClass={gap < 0 ? 'text-red-600' : 'text-emerald-600'}
                    /> 
                </div>

                {/* 2. 人性化的結果說明 - iOS Style */}
                <div className={`mb-6 p-6 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                    gap >= 0 ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border border-emerald-100/50' : 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border border-orange-100/50'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className="text-3xl mt-1">
                            {gap >= 0 ? '🎯' : '💡'}
                        </div>
                        <div className="flex-1">
                            <p className={`text-base leading-relaxed ${
                                gap >= 0 ? 'text-emerald-800' : 'text-orange-800'
                            }`}>
                                {getHumanizedResultText()}
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-300 flex justify-between items-center text-xs">
                                <span className="text-gray-600">
                                    覆蓋率: <span className="font-semibold">{(coverage * 100).toFixed(1)}%</span>
                                </span>
                                <span className="text-gray-600">
                                    可支撐年數: <span className="font-semibold">{yearsCovered}</span> 年
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 視覺化圖表 - 整合在同一區塊 */}
                {outputs.chartData && outputs.chartData.length > 0 && (
                    <div className="mb-6">
                        <RetirementChart data={outputs.chartData} formatter={fmt} />
                    </div>
                )}

                {/* 4. 小提示說明 - 移到圖表後方 */}
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        💡 <span className="font-semibold">小提示：</span>
                        「退休所需金額」是將未來所有支出<span className="font-semibold text-blue-700">折現到退休時點的現值</span>，
                        而圖表中的「實際累計支出」則包含了<span className="font-semibold text-blue-700">資產增值的機會成本</span>，
                        因此兩者數字會不同，這是正常的財務計算差異。
                    </p>
                </div>
                
                {yearsToRetire > 0 && gap < 0 && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl mt-1">💰</div>
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-blue-800 mb-3">給您的儲蓄小建議</h4>
                                <p className="text-blue-700 mb-4 leading-relaxed">
                                    距離退休還有 <span className="font-bold text-blue-900">{yearsToRetire}</span> 年的時間，
                                    如果從現在開始每個月多存一點，就能輕鬆填補資金缺口囉！
                                </p>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-gray-600 mb-2">建議每月增加儲蓄金額</p>
                                    <p className="text-3xl font-extrabold text-blue-600">
                                        NT$ {fmt(Math.max(0, -gap / yearsToRetire / 12))}
                                    </p>
                                </div>
                                <p className="text-xs text-blue-600 mt-3 text-center">
                                    💡 這個金額是根據您的資金缺口，平均分攤到退休前的每個月。
                                    當然，您也可以選擇提高投資報酬率或延後退休年齡來達成目標！
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 flex flex-col items-center">
            {/* Header - iOS Style - 進一步縮減高度 + 文字對齊 */}
            <div className={`w-full py-4 md:py-6 text-center text-white shadow-lg ${BRAND} backdrop-blur-md bg-opacity-95`}>
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="leading-tight tracking-tight flex flex-col items-center">
                        {/* 第一行：輔助文字，與第二行等寬 */}
                        <div className="text-base md:text-lg font-light text-white drop-shadow-sm animate-fadeIn inline-block">
                            讓退休，不只是夢想
                        </div>
                        {/* 第二行：核心訊息，最大最粗 */}
                        <div className="mt-1 text-3xl md:text-4xl font-bold text-white drop-shadow-md animate-fadeIn inline-block" style={{animationDelay: '0.1s'}}>
                            而是可看見的目標
                        </div>
                    </h1>
                    {/* 第三行：說明文字 */}
                    <p className="mt-3 text-sm md:text-base text-white font-normal animate-fadeIn" style={{animationDelay: '0.2s'}}>
                        用科學方法規劃您的理想退休生活
                    </p>
                </div>
            </div>

            {/* Main Content Area - 調整上方間距 */}
            <main className="flex-grow w-full max-w-4xl px-4 py-6 md:p-8 mb-20">
                {/* 輸入欄位和年齡警告 (錯誤訊息會在 CalculatorFields 內部處理) */}
                <CalculatorFields {...inputProps} /> 
                
                {/* 計算結果區塊 - 永遠渲染 (結果為 0 或計算值) */}
                {renderResults()}

                {/* 🎯 專家協助按鈕 - iOS Style */}
                <div className="flex justify-center mt-12 mb-8">
                    <button
                        type="button"
                        onClick={() => {
                            setShowExpertContact(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-12 py-6 rounded-full text-base font-semibold shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                        {/* 動畫背景效果 */}
                        <span className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <span className="relative text-2xl">👨‍💼</span>
                        <span className="relative tracking-wide">我需要專家為我量身規劃</span>
                        <span className="relative text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </button>
                </div>

                {/* 📘 可收合的計算方式與邏輯說明 - iOS Style */}
                <div className="mt-8 mb-8 bg-white/70 backdrop-blur-md border-0 rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                    {/* 標題列 - 可點擊收合/展開 */}
                    <button
                        onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                        className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-slate-50/50 to-gray-50/50 hover:from-slate-100/50 hover:to-gray-100/50 transition-all duration-300 active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📘</span>
                            <h3 className="text-lg font-semibold text-gray-800">計算方式與邏輯說明</h3>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-600 transition-transform duration-500 ${isExplanationExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* 詳細內容 - 可展開/收起 */}
                    {isExplanationExpanded && (
                        <div className="p-6 bg-white/50 backdrop-blur-sm space-y-6 animate-fadeIn border-t border-gray-100">
                            
                            {/* 1. 計算方式說明 */}
                            <div>
                                <h4 className="text-base font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                    <span>📊</span> 計算方式說明
                                </h4>
                                <div className="space-y-3 text-sm text-gray-700 ml-7">
                                    <p className="flex items-start gap-2">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>
                                            <strong className="text-gray-800">實質購買力計算：</strong>
                                            我們採用「實質購買力」來計算，也就是說所有金額都已經考慮了通貨膨脹的影響，
                                            讓您看到的數字更貼近未來真實的購買力，不會被表面的大數字給誤導了。
                                        </span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>
                                            <strong className="text-gray-800">報酬率調整：</strong>
                                            投資報酬率會自動扣除通膨率，確保計算出來的是真實增值，而不是虛胖的數字。
                                        </span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>
                                            <strong className="text-gray-800">統一時間基準：</strong>
                                            所有的資產和需求都是在「退休那一刻」的時間點來比較，
                                            就像把所有東西都拿到同一個天秤上秤重，才能真正知道夠不夠用。
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* 2. 各類資產估算方式 */}
                            <div className="border-t pt-4">
                                <h4 className="text-base font-bold text-blue-700 mb-3 flex items-center gap-2">
                                    <span>💰</span> 各類資產估算方式
                                </h4>
                                <div className="space-y-4 text-sm text-gray-700 ml-7">
                                    <div>
                                        <p className="font-semibold text-gray-800 mb-1">💵 現金與存款</p>
                                        <p className="text-gray-600">
                                            不計算報酬率，直接以現值計入退休資產。建議將活存、定存等低風險資產歸類於此。
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 mb-1">📈 投資資產</p>
                                        <p className="text-gray-600">
                                            包含股票、基金、ETF 等投資工具。使用「退休前預期年報酬率」計算增值。
                                            計算公式會自動扣除通膨影響，得出實質報酬。
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 mb-1">🏠 房地產</p>
                                        <p className="text-gray-600">
                                            <strong>保留自住：</strong>不計入退休資產（但可減少退休後房租支出）<br/>
                                            <strong>未來出售：</strong>以「房地產預期增值率」計算未來市值，扣除貸款餘額和交易成本後，
                                            再根據出售時間點折現或增值到退休時點。<br/>
                                            <strong>出租收益：</strong>每月淨租金收入將計入退休後固定月收入，減少實際支出缺口。
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            💡 若未填寫房地產估值，相關欄位將自動隱藏。
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 mb-1">💸 每月儲蓄</p>
                                        <p className="text-gray-600">
                                            從現在到退休前，每月固定儲蓄的金額。使用「終值公式 (Future Value)」計算到退休時的累積總額，
                                            並自動扣除通膨影響。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 退休支出估算 */}
                            <div className="border-t pt-4">
                                <h4 className="text-base font-bold text-orange-700 mb-3 flex items-center gap-2">
                                    <span>🛒</span> 退休支出估算
                                </h4>
                                <div className="space-y-3 text-sm text-gray-700 ml-7">
                                    <p className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold mt-0.5">•</span>
                                        <span>
                                            <strong className="text-gray-800">基本生活費：</strong>
                                            退休後每月的基本開銷，已考慮通膨調整為實質購買力。
                                        </span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold mt-0.5">•</span>
                                        <span>
                                            <strong className="text-gray-800">晚期醫療加成：</strong>
                                            預估壽命的最後 10 年，醫療支出會增加。系統會自動套用「晚期醫療費用加成比例」。
                                        </span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold mt-0.5">•</span>
                                        <span>
                                            <strong className="text-gray-800">支出折現：</strong>
                                            使用「現值公式 (Present Value)」將未來所有支出折現到退休時點，方便與資產比較。
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* 4. 注意事項 */}
                            <div className="border-t pt-4 bg-blue-50 -m-6 mt-4 p-6">
                                <p className="flex items-start gap-2 text-sm text-blue-800">
                                    <span className="text-xl">ℹ️</span>
                                    <span>
                                        <strong>重要提醒：</strong>
                                        本試算工具提供的是「估算參考」，實際退休規劃需考慮更多個人因素（如健康狀況、家庭需求、突發支出等）。
                                        建議定期檢視並調整您的退休計畫，或尋求專業財務顧問協助。
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
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
                        onClick={() => {
                            if (checkRequiredFields()) {
                                setShowSaveModal(true);
                            }
                        }}
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
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">儲存您的試算結果</h3>
                        <p className="text-sm text-gray-600 mb-4">之後可以使用 Email 重新載入最後一次儲存的結果，不需重複輸入</p>
                        <form onSubmit={(e) => { e.preventDefault(); handleSavePlan(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    名稱 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="請輸入您的名稱或暱稱"
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
                                <p className="text-xs text-gray-500 mt-1">請使用可以收信的 Email，以便之後載入試算結果</p>
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
                            
                            {/* 隱私政策同意文字 */}
                            <div className="mt-4 text-xs text-gray-600 leading-relaxed text-center">
                                我了解並同意網站依據
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyPolicy(true)}
                                    className="text-emerald-600 hover:text-emerald-700 font-semibold underline mx-1 transition-colors"
                                >
                                    《隱私政策》
                                </button>
                                使用這些資料，包含提供給合作的退休理財顧問，以便提供後續分析與建議服務。
                            </div>
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

            {/* 專家聯絡彈窗 - iOS Style */}
            {showExpertContact && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full relative transform transition-all duration-300 scale-100 hover:scale-[1.01]">
                        <button
                            type="button"
                            onClick={() => {
                                setShowExpertContact(false);
                                setExpertSubmitStatus(null);
                            }}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200 active:scale-90"
                        >
                            ✕
                        </button>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">專家諮詢服務</h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-3"></div>
                            <p className="text-sm text-gray-600 leading-relaxed">我們的專家會根據您的試算結果，提供專業建議。</p>
                        </div>
                        
                        <form onSubmit={handleExpertContactSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    姓名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={expertContact.name}
                                    onChange={(e) => setExpertContact(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 transition-all duration-200 placeholder-gray-400"
                                    placeholder="請輸入您的姓名"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    電話 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={expertContact.phone}
                                    onChange={(e) => setExpertContact(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 transition-all duration-200 placeholder-gray-400"
                                    placeholder="請輸入您的聯絡電話"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={expertContact.email}
                                    onChange={(e) => setExpertContact(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 transition-all duration-200 placeholder-gray-400"
                                    placeholder="請輸入您的 Email"
                                />
                            </div>
                            {expertSubmitStatus && (
                                <div className={`p-4 border-0 rounded-2xl backdrop-blur-sm ${
                                    expertSubmitStatus.type === 'success'
                                        ? 'bg-green-100/80 text-green-800'
                                        : 'bg-red-100/80 text-red-800'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <span>{expertSubmitStatus.type === 'success' ? '✓' : '⚠️'}</span>
                                        <span>{expertSubmitStatus.message}</span>
                                    </div>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={submittingExpert}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-full font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingExpert ? '送出中...' : '立即送出'}
                            </button>
                            
                            {/* 隱私政策同意文字 */}
                            <div className="mt-4 text-xs text-gray-600 leading-relaxed text-center">
                                我了解並同意網站依據
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyPolicy(true)}
                                    className="text-emerald-600 hover:text-emerald-700 font-semibold underline mx-1 transition-colors"
                                >
                                    《隱私政策》
                                </button>
                                使用這些資料，包含提供給合作的退休理財顧問，以便提供後續分析與建議服務。
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* 隱私政策彈窗 */}
            {showPrivacyPolicy && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white tracking-tight">隱私政策</h3>
                            <button
                                onClick={() => setShowPrivacyPolicy(false)}
                                className="text-white/90 hover:text-white text-3xl font-light leading-none transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto max-h-[calc(85vh-80px)] prose prose-sm max-w-none">
                            <div className="space-y-6 text-gray-700">
                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">1. 資料收集目的</h4>
                                    <p className="leading-relaxed">
                                        本網站（以下簡稱「本站」）收集您的個人資料，僅用於提供退休規劃諮詢服務，包括但不限於：
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 mt-2">
                                        <li>退休財務分析與建議</li>
                                        <li>專業理財顧問聯繫服務</li>
                                        <li>後續追蹤與客製化建議</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">2. 收集的資料類型</h4>
                                    <p className="leading-relaxed">當您使用專家諮詢服務時，我們會收集以下資料：</p>
                                    <ul className="list-disc pl-6 space-y-1 mt-2">
                                        <li><strong>個人識別資料：</strong>姓名、電話、電子郵件地址</li>
                                        <li><strong>財務資訊：</strong>年齡、退休年齡、資產狀況、每月支出等（僅用於計算分析）</li>
                                        <li><strong>技術資料：</strong>IP 位址、瀏覽器類型、裝置資訊（用於系統優化）</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">3. 資料使用方式</h4>
                                    <p className="leading-relaxed">您的個人資料將用於：</p>
                                    <ul className="list-disc pl-6 space-y-1 mt-2">
                                        <li>提供退休規劃分析與建議</li>
                                        <li>轉交給本站合作的專業理財顧問，以便提供後續諮詢服務</li>
                                        <li>改善本站服務品質與用戶體驗</li>
                                        <li>遵守相關法律規定</li>
                                    </ul>
                                    <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                                        <strong>重要提醒：</strong>我們不會將您的資料用於行銷目的，也不會在未經您同意的情況下分享給第三方（合作理財顧問除外）。
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">4. 資料儲存與安全</h4>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>儲存方式：</strong>所有資料將安全儲存於 Supabase 雲端資料庫，採用業界標準加密技術。</li>
                                        <li><strong>儲存期限：</strong>您的資料將保存至服務完成或您要求刪除為止。</li>
                                        <li><strong>安全措施：</strong>我們採用 SSL/TLS 加密傳輸、存取控制、定期安全審查等措施保護您的資料。</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">5. 您的權利（GDPR 合規）</h4>
                                    <p className="leading-relaxed">依據《一般資料保護規則》（GDPR）與相關法規，您擁有以下權利：</p>
                                    <ul className="list-disc pl-6 space-y-2 mt-2">
                                        <li><strong>存取權：</strong>您可以要求查閱我們持有的您的個人資料。</li>
                                        <li><strong>更正權：</strong>如資料有誤，您可要求更正。</li>
                                        <li><strong>刪除權：</strong>您可要求刪除您的個人資料（「被遺忘權」）。</li>
                                        <li><strong>限制處理權：</strong>在特定情況下，您可要求限制資料處理。</li>
                                        <li><strong>資料可攜權：</strong>您可要求以結構化、常用格式取得您的資料。</li>
                                        <li><strong>反對權：</strong>您可反對我們處理您的資料。</li>
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">6. Cookie 使用</h4>
                                    <p className="leading-relaxed">
                                        本站使用 Cookie 技術來改善用戶體驗、分析網站流量。您可以透過瀏覽器設定管理或停用 Cookie，但這可能影響部分功能。
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">7. 第三方服務</h4>
                                    <p className="leading-relaxed">本站使用以下第三方服務：</p>
                                    <ul className="list-disc pl-6 space-y-1 mt-2">
                                        <li><strong>Supabase：</strong>資料庫與後端服務（符合 GDPR 標準）</li>
                                        <li><strong>Vercel：</strong>網站託管服務</li>
                                    </ul>
                                    <p className="mt-2 text-sm">這些服務提供商皆遵守嚴格的資料保護標準。</p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">8. 政策更新</h4>
                                    <p className="leading-relaxed">
                                        本隱私政策可能不定期更新。重大變更時，我們會在網站上發布通知。建議您定期查閱本政策。
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3">9. 聯絡我們</h4>
                                    <p className="leading-relaxed">
                                        如您對本隱私政策有任何疑問，或希望行使上述權利，請透過以下方式聯繫我們：
                                    </p>
                                    <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-1">
                                        <p><strong>電子郵件：</strong> privacy@retirement-planner.com</p>
                                        <p><strong>客服電話：</strong> 0800-123-456</p>
                                        <p className="text-sm text-gray-600 mt-2">我們將在收到請求後 30 天內回覆。</p>
                                    </div>
                                </section>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 text-center">
                                        最後更新日期：2025 年 10 月
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowPrivacyPolicy(false)}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                            >
                                我已閱讀並理解
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}