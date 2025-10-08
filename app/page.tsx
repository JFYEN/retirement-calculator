"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              讓退休，不只是夢想
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-600 mb-8">
              而是可看見的目標
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              用科學的方式計算您的退休金需求
              <br />
              <span className="text-lg">5分鐘了解您與理想退休生活的距離</span>
            </p>
            <Link
              href="/retire"
              className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-lg font-bold px-12 py-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
            >
              開始規劃我的退休 →
            </Link>
            <div className="mt-8 flex justify-center items-center gap-6 text-sm text-gray-500">
              <span>✓ 完全免費</span>
              <span>✓ 無需註冊</span>
              <span>✓ 5分鐘完成</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200 rounded-full blur-3xl"></div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            您是否也有這些擔憂？
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            別擔心，您不孤單。讓我們一起面對，找出解決方案。
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">不知道需要準備多少錢</h3>
              <p className="text-gray-600 leading-relaxed">退休後要花多少錢？我的存款夠用嗎？<br />房貸還沒還完，還能安心退休嗎？</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">擔心通膨吃掉購買力</h3>
              <p className="text-gray-600 leading-relaxed">現在的100萬，20年後還值多少？<br />物價一直漲，退休金會不會不夠用？</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">不確定投資報酬率</h3>
              <p className="text-gray-600 leading-relaxed">每個月該存多少錢才夠？<br />投資報酬率要多少才能達成目標？</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">專業級退休金計算，一次搞定</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">我們的計算器如何幫助您實現退休夢想</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-6 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl flex-shrink-0">🎯</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">精準計算</h3>
                <p className="text-gray-600 leading-relaxed">考慮通膨、投資報酬率、房貸等因素<br />基於實質購買力，而非虛假的名目金額</p>
              </div>
            </div>
            <div className="flex gap-6 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl flex-shrink-0">💡</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">個人化建議</h3>
                <p className="text-gray-600 leading-relaxed">根據您的年齡、收入、資產狀況<br />給出每月儲蓄建議，讓目標可執行</p>
              </div>
            </div>
            <div className="flex gap-6 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl flex-shrink-0">📊</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">視覺化呈現</h3>
                <p className="text-gray-600 leading-relaxed">一目了然的資金缺口分析<br />清楚看見退休生活的保障程度</p>
              </div>
            </div>
            <div className="flex gap-6 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-5xl flex-shrink-0">💾</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">儲存與分享</h3>
                <p className="text-gray-600 leading-relaxed">隨時儲存、載入您的試算結果<br />需要時可申請專家一對一諮詢</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">您的退休生活，從今天開始規劃</h2>
          <p className="text-xl text-emerald-50 mb-8">完全免費 • 無需註冊 • 5分鐘完成</p>
          <Link
            href="/retire"
            className="inline-block bg-white text-emerald-600 text-xl font-bold px-12 py-5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
          >
            立即開始計算 →
          </Link>
          <div className="mt-10 flex justify-center items-center gap-8 text-emerald-50">
            <span className="text-sm">✓ 已有 5,000+ 人使用</span>
            <span className="text-sm">✓ 專業財務顧問推薦</span>
            <span className="text-sm">✓ 資料完全保密</span>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2025 退休規劃計算器 | 讓退休不只是夢想</p>
        </div>
      </footer>
    </div>
  );
}
