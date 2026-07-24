import React from 'react';
import { useStockStore } from '../store/useStockStore';

export const MarketTab: React.FC = () => {
  const { presetStockList, selectAddStock, openAddModal, themeMode } = useStockStore();
  const isLight = themeMode === 'light';

  const handleQuickAdd = (stk: any) => {
    openAddModal();
    selectAddStock(stk);
  };

  return (
    <div className="space-y-3">
      {/* 指數指標 */}
      <div className={`p-3 rounded-xl border transition-colors shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <h3 className={`text-sm font-bold mb-2 flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
          <i className="fa-solid fa-chart-line text-amber-500"></i>
          <span>即時市場指標速覽</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700/60'
          }`}>
            <div className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>加權指數 (TAIEX)</div>
            <div className="text-sm font-black text-tw-up mt-0.5">23,415.80 (+185.20)</div>
          </div>
          <div className={`p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700/60'
          }`}>
            <div className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>櫃買指數 (TPEx)</div>
            <div className="text-sm font-black text-tw-up mt-0.5">270.45 (+1.82)</div>
          </div>
        </div>
      </div>

      {/* 台股熱門個股動態庫 */}
      <div className={`p-3 rounded-xl border transition-colors shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>熱門台股動態即時價</h3>
          <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>點擊可快速新增</span>
        </div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {presetStockList.map((stk) => (
            <div
              key={stk.code}
              onClick={() => handleQuickAdd(stk)}
              className={`p-2 rounded-lg flex justify-between items-center cursor-pointer transition border ${
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

