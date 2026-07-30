import React, { useState } from 'react';
import { useStockStore } from '../store/useStockStore';
import { formatNum, formatPct, getPnlColorClass, getTradeTypeStyle } from '../utils/stockMath';

export const HistoryTab: React.FC = () => {
  const {
    historyData,
    currentAccountId,
    historyFilter,
    setHistoryFilter,
    themeMode,
    openEditHistoryModal,
    deleteHistoryItem,
    restoreHistoryToHoldings
  } = useStockStore();

  const [tradeTypeFilter, setTradeTypeFilter] = useState<'all' | '現股交易' | '當沖' | '信用'>('all');

  const isLight = themeMode === 'light';
  const currentList = historyData[currentAccountId] || [];

  const filtered = currentList.filter((item) => {
    if (historyFilter.startDate && historyFilter.endDate) {
      if (item.sellDate < historyFilter.startDate || item.sellDate > historyFilter.endDate) {
        return false;
      }
    }
    if (tradeTypeFilter === '現股交易') {
      return !item.tradeType || item.tradeType.includes('現股交易');
    } else if (tradeTypeFilter === '當沖') {
      return item.tradeType && item.tradeType.includes('當沖');
    } else if (tradeTypeFilter === '信用') {
      return item.tradeType && (item.tradeType.includes('資') || item.tradeType.includes('券'));
    }
    return true;
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
      <div className={`p-3 rounded-xl border transition-colors shadow-sm space-y-2.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex justify-between items-center">
          <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>歷史平倉紀錄查詢</div>
          {/* 交易類型篩選切換 */}
          <div className="flex items-center space-x-1">
            {[
              { key: 'all', label: '全部' },
              { key: '現股交易', label: '現股' },
              { key: '當沖', label: '當沖' },
              { key: '信用', label: '信用' }
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setTradeTypeFilter(btn.key as any)}
                className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                  tradeTypeFilter === btn.key
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : (isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:bg-slate-700')
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

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

      {/* 歷史清單 (手機 1 欄、iPad 2 欄、PC 3 欄) */}
      {filtered.length === 0 ? (
        <div className={`text-center py-10 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          目前時間區間內尚無已平倉紀錄
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-start">
          {filtered.map((item) => {
            const tradeStyle = getTradeTypeStyle(item.tradeType);
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border shadow-sm space-y-2 transition-colors ${
                  isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-800 border-slate-700/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
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
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border shadow-sm ${tradeStyle.badgeClass}`}>
                        {tradeStyle.shortLabel}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      均買: ${item.buyPrice} | 賣出: ${item.sellPrice}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>損益 :</div>
                    <div className={`font-black text-sm ${getPnlColorClass(item.realizedPnl)}`}>
                      {item.realizedPnl >= 0 ? '+' : ''}{formatNum(item.realizedPnl)}
                    </div>
                    <div className={`text-xs font-bold ${getPnlColorClass(item.returnPct)}`}>
                      {formatPct(item.returnPct)}
                    </div>
                  </div>
                </div>

                {item.lots && item.lots.length > 1 && (
                  <div className={`p-2 rounded-lg text-xs border space-y-1 ${
                    isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-slate-900/80 border-amber-500/30 text-amber-200'
                  }`}>
                    <div className="font-bold flex items-center space-x-1 text-[11px]">
                      <i className="fa-solid fa-list-check text-amber-500"></i>
                      <span>包含 {item.lots.length} 筆合併平倉紀錄：</span>
                    </div>
                    <div className="divide-y divide-amber-200/30 text-[11px]">
                      {item.lots.map((lot, idx) => (
                        <div key={lot.id || idx} className="py-0.5 flex justify-between items-center">
                          <span>第 {idx + 1} 筆 買入: <strong>{lot.date}</strong> (${lot.buyPrice})</span>
                          <span className="flex items-center space-x-1">
                            {lot.tradeType && (
                              <span className="text-[9px] opacity-75">({lot.tradeType})</span>
                            )}
                            <span><strong>{formatNum(lot.shares)}股</strong></span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`flex justify-between items-center text-xs pt-1.5 border-t ${
                  isLight ? 'border-slate-100 text-slate-500' : 'border-slate-700/50 text-slate-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span>股數: {formatNum(item.shares)} 股</span>
                    <span className="text-[10px] opacity-60">({item.buyDate} ~ {item.sellDate})</span>
                  </div>
                  
                  {/* 修改、退回庫存與刪除按鈕 */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => restoreHistoryToHoldings(item.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                        isLight ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/60'
                      }`}
                      title="一鍵將此筆平倉紀錄退回庫存"
                    >
                      <i className="fa-solid fa-rotate-left text-[10px]"></i>
                      <span>退回庫存</span>
                    </button>
                    <button
                      onClick={() => openEditHistoryModal(item)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                        isLight ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-amber-900/40 text-amber-300 hover:bg-amber-800/60'
                      }`}
                      title="修改此筆歷史紀錄"
                    >
                      <i className="fa-solid fa-pen-to-square text-[10px]"></i>
                      <span>修改</span>
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                        isLight ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-rose-900/40 text-rose-400 hover:bg-rose-800/60'
                      }`}
                      title="刪除此筆歷史紀錄"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                      <span>刪除</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


