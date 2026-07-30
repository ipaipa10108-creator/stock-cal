import React, { useState, useEffect } from 'react';
import { useStockStore } from '../store/useStockStore';
import { fetchAllGlobalIndices } from '../services/marketIndices';

export const MarketTab: React.FC = () => {
  const {
    presetStockList,
    selectAddStock,
    openAddModal,
    themeMode,
    setToastMessage,
    globalIndicesData,
    indicesLastUpdated,
    setGlobalIndicesData
  } = useStockStore();
  const isLight = themeMode === 'light';

  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isRefreshingIndices, setIsRefreshingIndices] = useState<boolean>(false);

  const loadIndices = async (isManual = false) => {
    setIsRefreshingIndices(true);
    try {
      const updated = await fetchAllGlobalIndices(globalIndicesData);
      const timeStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setGlobalIndicesData(updated, timeStr);
      if (isManual) {
        setToastMessage('已更新全球國際市場指數！');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (e) {
      console.warn('Index fetch notice:', e);
    } finally {
      setIsRefreshingIndices(false);
    }
  };

  useEffect(() => {
    loadIndices();
    const interval = setInterval(() => loadIndices(), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleQuickAdd = (stk: any) => {
    openAddModal();
    selectAddStock(stk);
  };

  const categories = ['全部', '美股四大', '亞太指數', '歐洲指數', '台股'];

  const filteredIndices = globalIndicesData.filter(idx => {
    if (selectedCategory === '全部') return true;
    return idx.category === selectedCategory;
  });

  return (
    <div className="space-y-3">
      {/* 國際市場指數速覽 */}
      <div className={`p-3 rounded-xl border transition-colors shadow-sm space-y-2.5 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className={`text-sm font-bold flex items-center space-x-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            <i className="fa-solid fa-earth-americas text-amber-500"></i>
            <span>即時市場指標速覽 (含盤後標註)</span>
          </h3>
          <button
            onClick={() => loadIndices(true)}
            disabled={isRefreshingIndices}
            className={`text-xs px-2 py-1 rounded-lg font-bold flex items-center space-x-1 transition ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
            title="重新整理指數"
          >
            <i className={`fa-solid fa-rotate-right ${isRefreshingIndices ? 'animate-spin text-amber-500' : ''}`}></i>
            <span>{isRefreshingIndices ? '更新中' : '刷新'}</span>
          </button>
        </div>

        {/* 分類切換按鈕 */}
        <div className="flex space-x-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : (isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-700/70')
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 國際指數卡片網格 (手機 2 欄、iPad 3 欄、PC 4 欄) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 text-xs max-h-[500px] overflow-y-auto pr-0.5">
          {filteredIndices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className={`p-2.5 rounded-lg border flex flex-col justify-between transition ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-extrabold text-xs truncate max-w-[120px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`} title={idx.name}>
                    {idx.name}
                  </span>
                  {/* 即時 / 盤後 標籤 */}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${
                      idx.isMarketOpen
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {idx.marketStateText}
                  </span>
                </div>

                <div className="flex justify-between items-end mt-1">
                  <div className={`text-xs font-black ${isUp ? 'text-tw-up' : 'text-tw-down'}`}>
                    {idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[11px] font-extrabold text-right ${isUp ? 'text-tw-up' : 'text-tw-down'}`}>
                    <div>{isUp ? '+' : ''}{idx.change.toFixed(2)}</div>
                    <div>({isUp ? '+' : ''}{idx.changePct.toFixed(2)}%)</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {indicesLastUpdated && (
          <div className={`text-[10px] text-right font-medium ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            最後更新時間: {indicesLastUpdated}
          </div>
        )}
      </div>

      {/* 台股熱門個股動態庫 (手機 1 欄、iPad 2 欄、PC 3 欄) */}
      <div className={`p-3 md:p-4 rounded-xl border transition-colors shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm md:text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>熱門台股動態即時價</h3>
          <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>點擊可快速新增</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
          {presetStockList.map((stk) => (
            <div
              key={stk.code}
              onClick={() => handleQuickAdd(stk)}
              className={`p-2.5 rounded-lg flex justify-between items-center cursor-pointer transition border ${
                isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-900 hover:bg-slate-700/60 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{stk.code}</span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{stk.name}</span>
                <a
                  href={`https://tw.stock.yahoo.com/quote/${stk.code.toUpperCase()}.TW`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="在 Yahoo 股市查看行情與 K 線"
                  className="text-amber-500 hover:text-amber-600 p-0.5"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
              </div>
              <div className="text-right">
                <div
                  className={`font-black text-xs ${
                    stk.change >= 0 ? 'text-tw-up' : 'text-tw-down'
                  }`}
                >
                  ${stk.price.toFixed(2)}
                </div>
                <div
                  className={`text-[10px] font-bold ${
                    stk.change >= 0 ? 'text-tw-up' : 'text-tw-down'
                  }`}
                >
                  {stk.change >= 0 ? '+' : ''}
                  {stk.changePct.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
