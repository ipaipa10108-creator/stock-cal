import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { formatNum, formatPct, getPnlColorClass } from '../utils/stockMath';

export const HistoryTab: React.FC = () => {
  const {
    historyData,
    currentAccountId,
    historyFilter,
    setHistoryFilter,
    themeMode
  } = useStockStore();

  const isLight = themeMode === 'light';
  const currentList = historyData[currentAccountId] || [];

  const filtered = currentList.filter((item) => {
    if (!historyFilter.startDate || !historyFilter.endDate) return true;
    return item.sellDate >= historyFilter.startDate && item.sellDate <= historyFilter.endDate;
  });

  let totalPnl = 0;
  let wins = 0;
  let totalReturn = 0;

  filtered.forEach((i) => {
    totalPnl += i.realizedPnl;
    totalReturn += i.returnPct;
    if (i.realizedPnl > 0) wins++;
  });

  const avgReturnPct = filtered.length > 0 ? totalReturn / filtered.length : 0;
  const winRate = filtered.length > 0 ? (wins / filtered.length) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* 篩選列 */}
      <div className={`p-3 rounded-xl border transition-colors shadow-sm space-y-2 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>歷史平倉紀錄查詢</div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={historyFilter.startDate}
            onChange={(e) => setHistoryFilter({ ...historyFilter, startDate: e.target.value })}
            className={`border rounded p-1.5 text-xs font-bold flex-1 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          />
          <span className={isLight ? 'text-slate-400 font-bold' : 'text-slate-500'}>~</span>
          <input
            type="date"
            value={historyFilter.endDate}
            onChange={(e) => setHistoryFilter({ ...historyFilter, endDate: e.target.value })}
            className={`border rounded p-1.5 text-xs font-bold flex-1 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          />
        </div>
      </div>

      {/* 歷史總結標頭 */}
      <div className={`rounded-xl p-3 border shadow-sm flex justify-around text-center transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div>
          <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>總損益</div>
          <div className={`text-lg font-black ${getPnlColorClass(totalPnl)}`}>
            ${formatNum(totalPnl)}
          </div>
        </div>
        <div className={`border-r ${isLight ? 'border-slate-200' : 'border-slate-700'}`}></div>
        <div>
          <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>獲利率</div>
          <div className={`text-lg font-black ${getPnlColorClass(totalPnl)}`}>
            {formatPct(avgReturnPct)}
          </div>
        </div>
        <div className={`border-r ${isLight ? 'border-slate-200' : 'border-slate-700'}`}></div>
        <div>
          <div className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>勝率</div>
          <div className="text-lg font-black text-amber-500">
            {winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 歷史清單 */}
      {filtered.length === 0 ? (
        <div className={`text-center py-10 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          目前時間區間內尚無已平倉紀錄
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border shadow-sm space-y-1.5 transition-colors ${
                isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-800 border-slate-700/80'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <a
                    href={`https://tw.stock.yahoo.com/quote/${item.symbol.toUpperCase()}.TW`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="在 Yahoo 股市查看即時行情與線圖"
                    className={`font-extrabold hover:underline text-sm flex items-center space-x-1 group ${
                      isLight ? 'text-slate-900 hover:text-amber-600' : 'text-white hover:text-amber-300'
                    }`}
                  >
                    <span>{item.symbol} - {item.name}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-500 opacity-80 group-hover:opacity-100"></i>
                  </a>
                  <div className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    均買: ${item.buyPrice} | 賣出: ${item.sellPrice}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>損益 :</div>
                  <div className={`font-black text-sm ${getPnlColorClass(item.realizedPnl)}`}>
                    {item.realizedPnl >= 0 ? '+' : ''}{formatNum(item.realizedPnl)}
                  </div>
                  <div className={`text-xs font-bold ${getPnlColorClass(item.realizedPnl)}`}>
                    {formatPct(item.returnPct)}
                  </div>
                </div>
              </div>

              <div className={`flex justify-between items-center text-xs pt-1 border-t ${
                isLight ? 'border-slate-100 text-slate-500' : 'border-slate-700/50 text-slate-400'
              }`}>
                <span>股數: {formatNum(item.shares)} 股</span>
                <span>
                  {item.buyDate} ~ {item.sellDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

