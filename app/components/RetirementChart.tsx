"use client";

import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { YearlyData } from '@/lib/useRetirementCalculator';

interface RetirementChartProps {
  data: YearlyData[];
  formatter: (n: number) => string;
}

// 自訂 Tooltip - 簡化版本
const CustomTooltip = ({ active, payload, formatter }: { active?: boolean; payload?: any[]; formatter: (n: number) => string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const balance = data.assets;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-300">
        <p className="font-bold text-gray-900 mb-3 text-center border-b pb-2">
          {data.age} 歲
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-gray-600">剩餘資產</span>
            <span className={`font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              NT$ {formatter(balance)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-gray-600">已花費</span>
            <span className="font-bold text-orange-600">
              NT$ {formatter(data.expenses)}
            </span>
          </div>
          <div className="pt-2 border-t mt-2">
            <p className={`text-sm text-center font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '✅ 資金充足' : '⚠️ 資金不足'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function RetirementChart({ data, formatter }: RetirementChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
        請填寫完整資料以查看退休資產變化圖表
      </div>
    );
  }

    // 計算 Y 軸的範圍
  const maxAssets = Math.max(...data.map(d => d.assets));
  const minAssets = Math.min(...data.map(d => d.assets));
  const maxExpenses = Math.max(...data.map(d => d.expenses));
  
  // Y 軸最大值：取正數中的最大值
  const yAxisMax = Math.max(maxAssets, maxExpenses) * 1.1;
  
  // Y 軸最小值：如果有負數，則取負數的最小值（乘以 1.1 留邊距）
  const yAxisMin = minAssets < 0 ? minAssets * 1.1 : 0;

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
        {/* 圖表小標題 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <h4 className="text-xl font-bold text-gray-700">資產與支出變化趨勢</h4>
        </div>
        
        {/* 圖表 */}
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              {/* 資金缺口區域的漸層 */}
              <linearGradient id="deficitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="age" 
              label={{ value: '年齡 (歲)', position: 'insideBottom', offset: -10 }}
              stroke="#6b7280"
            />
            
            <YAxis 
              tickFormatter={(value) => {
                const absValue = Math.abs(value);
                if (absValue >= 1000000) {
                  return `${value < 0 ? '-' : ''}${(absValue / 1000000).toFixed(0)}M`;
                } else if (absValue >= 1000) {
                  return `${value < 0 ? '-' : ''}${(absValue / 1000).toFixed(0)}K`;
                } else {
                  return value.toFixed(0);
                }
              }}
              label={{ value: '金額', angle: -90, position: 'insideLeft' }}
              stroke="#6b7280"
              domain={[yAxisMin, yAxisMax]}
            />
            
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* 資金缺口區域（當支出 > 資產時） */}
            {data.map((point, index) => {
              if (point.expenses > point.assets && index < data.length - 1) {
                const nextPoint = data[index + 1];
                return (
                  <ReferenceLine
                    key={`deficit-${index}`}
                    segment={[
                      { x: point.age, y: point.expenses },
                      { x: nextPoint.age, y: nextPoint.expenses }
                    ]}
                    stroke="#ef4444"
                    strokeWidth={0}
                    ifOverflow="extendDomain"
                  />
                );
              }
              return null;
            })}
            
            {/* 累計支出線（橘色） */}
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
              name="累計已花費"
            />
            
            {/* 剩餘資產線（綠色） */}
            <Line
              type="monotone"
              dataKey="assets"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="剩餘資產"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 圖表說明 - 簡化版 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800 leading-relaxed">
            <span className="font-bold text-emerald-700">綠線</span> 代表您每個年齡的「剩餘資產」
            （已扣除生活支出，且考慮投資增值）。
            <br />
            <span className="font-bold text-orange-600">橘線</span> 代表「累計已花費的金額」。
            <br />
            <span className="text-gray-600 text-xs mt-2 inline-block">
              💡 將滑鼠移到圖表上，可以看到每個年齡的詳細數據
            </span>
          </p>
        </div>

        {/* 關鍵指標卡片 - 重新設計 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <p className="text-sm text-emerald-700 font-semibold">退休那一刻的資產</p>
            </div>
            <p className="text-2xl font-extrabold text-emerald-800">
              NT$ {formatter(data[0]?.assets || 0)}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg border-2 ${
            data[data.length - 1]?.assets >= 0
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
              : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{data[data.length - 1]?.assets >= 0 ? '✅' : '⚠️'}</span>
              <p className={`text-sm font-semibold ${
                data[data.length - 1]?.assets >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {data[data.length - 1]?.age} 歲時的資產狀況
              </p>
            </div>
            <p className={`text-2xl font-extrabold ${
              data[data.length - 1]?.assets >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              {data[data.length - 1]?.assets >= 0
                ? `還剩 NT$ ${formatter(data[data.length - 1]?.assets)}`
                : `不足 NT$ ${formatter(Math.abs(data[data.length - 1]?.assets))}`
              }
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {data[data.length - 1]?.assets >= 0
                ? '💚 太好了！您的退休資產足夠使用'
                : '💡 建議增加儲蓄或調整退休計畫'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
