import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { formatNum, formatPct, getPnlColorClass } from '../utils/stockMath';

export const HistoryTab: React.FC = () => {
  const {
    historyData,
    currentAccountId,
    historyFilter,
    setHistoryFilter
  } = useStockStore();

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
      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
        <div className="text-xs text-slate-400 font-bold">歷史平倉紀錄查詢</div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={historyFilter.startDate}
            onChange={(e) => setHistoryFilter({ ...historyFilter, startDate: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white flex-1"
          />
          <span className="text-slate-500">~</span>
          <input
            type="date"
            value={historyFilter.endDate}
            onChange={(e) => setHistoryFilter({ ...historyFilter, endDate: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white flex-1"
          />
        </div>
      </div>

      {/* 歷史總結標頭 */}
      <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-around text-center">
        <div>
          <div className="text-xs text-slate-400">總損益</div>
          <div className={`text-lg font-bold ${getPnlColorClass(totalPnl)}`}>
            ${formatNum(totalPnl)}
          </div>
        </div>
        <div className="border-r border-slate-700"></div>
        <div>
          <div className="text-xs text-slate-400">獲利率</div>
          <div className={`text-lg font-bold ${getPnlColorClass(totalPnl)}`}>
            {formatPct(avgReturnPct)}
          </div>
        </div>
        <div className="border-r border-slate-700"></div>
        <div>
          <div className="text-xs text-slate-400">勝率</div>
          <div className="text-lg font-bold text-amber-400">
            {winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 歷史清單 */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          目前時間區間內尚無已平倉紀錄
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 p-3 rounded-xl border border-slate-700/80 space-y-1.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <a
                    href={`https://tw.stock.yahoo.com/quote/${item.symbol.toUpperCase()}.TW`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="在 Yahoo 股市查看即時行情與線圖"
                    className="font-bold text-white hover:text-amber-300 hover:underline text-sm flex items-center space-x-1 group"
                  >
                    <span>{item.symbol} - {item.name}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-400 opacity-70 group-hover:opacity-100"></i>
                  </a>
                  <div className="text-xs text-slate-400 mt-0.5">
                    均買: ${item.buyPrice} | 賣出: ${item.sellPrice}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">損益 :</div>
                  <div className={`font-bold text-sm ${getPnlColorClass(item.realizedPnl)}`}>
                    {item.realizedPnl >= 0 ? '+' : ''}{formatNum(item.realizedPnl)}
                  </div>
                  <div className={`text-xs font-semibold ${getPnlColorClass(item.realizedPnl)}`}>
                    {formatPct(item.returnPct)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-700/50">
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
