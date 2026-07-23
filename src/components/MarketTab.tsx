import React from 'react';
import { useStockStore } from '../store/useStockStore';

export const MarketTab: React.FC = () => {
  const { presetStockList, selectAddStock, openAddModal } = useStockStore();

  const handleQuickAdd = (stk: any) => {
    openAddModal();
    selectAddStock(stk);
  };

  return (
    <div className="space-y-3">
      {/* 指數指標 */}
      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center space-x-2">
          <i className="fa-solid fa-chart-line text-amber-400"></i>
          <span>即時市場指標速覽</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">加權指數 (TAIEX)</div>
            <div className="text-sm font-bold text-tw-up mt-0.5">23,415.80 (+185.20)</div>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700/60">
            <div className="text-slate-400">櫃買指數 (TPEx)</div>
            <div className="text-sm font-bold text-tw-up mt-0.5">270.45 (+1.82)</div>
          </div>
        </div>
      </div>

      {/* 台股熱門個股動態庫 */}
      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-slate-200">熱門台股動態即時價</h3>
          <span className="text-[11px] text-slate-400">點擊可快速新增</span>
        </div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {presetStockList.map((stk) => (
            <div
              key={stk.code}
              onClick={() => handleQuickAdd(stk)}
              className="bg-slate-900 p-2 rounded-lg flex justify-between items-center hover:bg-slate-700/60 cursor-pointer transition border border-slate-800"
            >
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-xs">{stk.code}</span>
                <span className="text-slate-300 text-xs">{stk.name}</span>
                <a
                  href={`https://tw.stock.yahoo.com/quote/${stk.code.toUpperCase()}.TW`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="在 Yahoo 股市查看行情與 K 線"
                  className="text-slate-400 hover:text-amber-300 p-0.5"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold text-xs ${
                    stk.change >= 0 ? 'text-tw-up' : 'text-tw-down'
                  }`}
                >
                  ${stk.price.toFixed(2)}
                </div>
                <div
                  className={`text-[10px] ${
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
