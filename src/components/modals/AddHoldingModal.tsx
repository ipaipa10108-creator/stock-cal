import React from 'react';
import { useStockStore } from '../../store/useStockStore';
import { calcTradeDetails, formatNum } from '../../utils/stockMath';

export const AddHoldingModal: React.FC = () => {
  const {
    showAddModal,
    setShowAddModal,
    isEditingHolding,
    holdingForm,
    setHoldingForm,
    addSearchResults,
    searchAddStock,
    selectAddStock,
    saveHolding,
    setTradeTypeContext,
    setShowTradeTypeModal,
    globalDiscount
  } = useStockStore();

  if (!showAddModal) return null;

  const totalCost = (() => {
    if (!holdingForm.buyPrice || !holdingForm.shares) return 0;
    const feeObj = calcTradeDetails(
      holdingForm.buyPrice,
      holdingForm.shares,
      holdingForm.discount !== undefined ? holdingForm.discount : globalDiscount,
      holdingForm.minFee || 20,
      true,
      holdingForm.assetType,
      holdingForm.tradeType,
      globalDiscount
    );
    return (holdingForm.buyPrice * holdingForm.shares) + feeObj.fee;
  })();

  const openTradeTypeSelector = () => {
    setTradeTypeContext('add');
    setShowTradeTypeModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h3 className="font-bold text-base text-slate-100">
            {isEditingHolding ? '編輯庫存筆記' : '新增庫存股票'}
          </h3>
          <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 股票搜尋區 */}
        <div className="relative">
          <label className="block text-xs text-slate-400 mb-1">股票代號或名稱 (支援即時搜尋)</label>
          <div className="flex space-x-1">
            <input
              type="text"
              value={holdingForm.symbolSearch}
              onChange={(e) => {
                setHoldingForm({ symbolSearch: e.target.value });
                searchAddStock(e.target.value);
              }}
              placeholder="如: 1101, 台泥, 2330, 2603"
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white flex-1 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => searchAddStock(holdingForm.symbolSearch)}
              className="bg-blue-600 px-3 rounded-lg text-white"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          {/* 下拉搜尋結果 */}
          {addSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800">
              {addSearchResults.map((s) => (
                <div
                  key={s.code}
                  onClick={() => selectAddStock(s)}
                  className="p-2.5 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs transition"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      {s.code}
                    </span>
                    <span className="text-slate-200 font-semibold">{s.name}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                      {s.type || (s.code.startsWith('00') ? 'ETF' : '股票')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">
                      {s.price > 0 ? `$${s.price.toFixed(2)}` : '點擊手動填價'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 表單欄位 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">買進價 (NT$)</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.buyPrice || ''}
              onChange={(e) => setHoldingForm({ buyPrice: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-bold"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">現價 (即時連動/可修改)</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.currentPrice || ''}
              onChange={(e) => setHoldingForm({ currentPrice: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-amber-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">股數 (1張=1000股)</label>
            <input
              type="number"
              step="1"
              value={holdingForm.shares || ''}
              onChange={(e) => setHoldingForm({ shares: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">優惠折扣</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.discount ?? globalDiscount}
              onChange={(e) => setHoldingForm({ discount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">證券類型</label>
            <select
              value={holdingForm.assetType}
              onChange={(e) => setHoldingForm({ assetType: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            >
              <option value="股票">股票</option>
              <option value="ETF">ETF</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">交易類型</label>
            <button
              type="button"
              onClick={openTradeTypeSelector}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white text-left flex justify-between items-center"
            >
              <span>{holdingForm.tradeType}</span>
              <i className="fa-solid fa-caret-down text-slate-400"></i>
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">交易日期</label>
            <input
              type="date"
              value={holdingForm.date}
              onChange={(e) => setHoldingForm({ date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">費用低限</label>
            <input
              type="number"
              value={holdingForm.minFee}
              onChange={(e) => setHoldingForm({ minFee: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
        </div>

        {/* ETF 專屬：淨值 (NAV) 欄位與折溢價即時提示 */}
        {(holdingForm.assetType === 'ETF' || holdingForm.symbol.startsWith('00')) && (
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-amber-300 font-bold flex items-center space-x-1">
                <i className="fa-solid fa-chart-pie"></i>
                <span>ETF 基金淨值 (NAV) :</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="輸入估計淨值"
                value={holdingForm.nav || ''}
                onChange={(e) => setHoldingForm({ nav: parseFloat(e.target.value) || 0 })}
                className="w-32 bg-slate-800 border border-amber-500/50 rounded px-2 py-1 text-xs text-amber-300 text-right font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            {(() => {
              const pd = calcEtfPremiumDiscount(holdingForm.currentPrice, holdingForm.nav, holdingForm.shares);
              if (!pd) return <p className="text-[11px] text-slate-400">填寫淨值後將自動計算折溢價點數與持股總金額</p>;
              return (
                <div
                  className={`p-2 rounded-lg text-xs border flex flex-col space-y-0.5 ${
                    pd.isPremium
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span>單股折溢價 :</span>
                    <span>
                      {pd.isPremium ? '溢價 +' : '折價 '}
                      ${pd.diffPerShare.toFixed(2)} ({pd.isPremium ? '+' : ''}{pd.diffPct.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>持股相當折溢價總額 :</span>
                    <span className="font-bold underline">
                      {pd.isPremium ? '溢價總額 +' : '折價總額 '}
                      ${formatNum(pd.totalDiffAmount)} 元
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 預估購買成本預覽 */}
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-xs flex justify-between text-slate-300">
          <span>預估匯出總金額 (含手續費):</span>
          <span className="font-bold text-emerald-400">${formatNum(totalCost)}</span>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={saveHolding}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm shadow"
          >
            {isEditingHolding ? '更新儲存' : '確認新增'}
          </button>
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
