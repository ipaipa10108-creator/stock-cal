import React from 'react';
import { useStockStore } from '../../store/useStockStore';
import { calcTradeDetails, calcEtfPremiumDiscount, formatNum } from '../../utils/stockMath';

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
    globalDiscount,
    themeMode,
    fullStockMap
  } = useStockStore();

  if (!showAddModal) return null;

  const isLight = themeMode === 'light';

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

  const handleApplyLivePrice = () => {
    const raw = (holdingForm.symbolSearch || holdingForm.symbol).trim().toUpperCase();
    if (!raw) return;
    const stk = fullStockMap[raw] || Object.values(fullStockMap).find(s => s.code.toUpperCase() === raw || s.name.toUpperCase() === raw || s.code.toUpperCase().includes(raw));
    if (stk && stk.price > 0) {
      setHoldingForm({
        symbol: stk.code,
        name: stk.name,
        symbolSearch: `${stk.code} - ${stk.name}`,
        currentPrice: stk.price,
        buyPrice: holdingForm.buyPrice > 0 ? holdingForm.buyPrice : stk.price,
        assetType: stk.type || (stk.code.startsWith('00') ? 'ETF' : '股票')
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl relative max-h-[90vh] overflow-y-auto border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className="font-bold text-base">
            {isEditingHolding ? '編輯庫存筆記' : '新增庫存股票'}
          </h3>
          <button onClick={() => setShowAddModal(false)} className={`transition ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 股票搜尋區 */}
        <div className="relative">
          <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            股票代號或名稱 (輸入代號/部分名稱即時帶入)
          </label>
          <div className="flex space-x-1">
            <input
              type="text"
              value={holdingForm.symbolSearch}
              onChange={(e) => {
                setHoldingForm({ symbolSearch: e.target.value });
                searchAddStock(e.target.value);
              }}
              onBlur={() => {
                setTimeout(handleApplyLivePrice, 200);
              }}
              placeholder="如: 2330, 台積電, 鴻海, 00878"
              className={`flex-1 p-2 text-sm font-bold rounded-lg border focus:outline-none focus:border-blue-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                searchAddStock(holdingForm.symbolSearch);
                handleApplyLivePrice();
              }}
              className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg text-white font-bold text-xs"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          {/* 下拉搜尋結果 */}
          {addSearchResults.length > 0 && (
            <div className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-2xl z-30 max-h-48 overflow-y-auto divide-y ${
              isLight ? 'bg-white border-slate-200 divide-slate-100' : 'bg-slate-900 border-slate-700 divide-slate-800'
            }`}>
              {addSearchResults.map((s) => (
                <div
                  key={s.code}
                  onClick={() => selectAddStock(s)}
                  className={`p-2.5 cursor-pointer flex justify-between items-center text-xs transition ${
                    isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold px-1.5 py-0.5 rounded border ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}>
                      {s.code}
                    </span>
                    <span className="font-bold">{s.name}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded border ${
                      isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {s.type || (s.code.startsWith('00') ? 'ETF' : '股票')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-500 font-extrabold">
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
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買進價 (NT$)</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.buyPrice || ''}
              onChange={(e) => setHoldingForm({ buyPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>現價 (即時連動/可修改)</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.currentPrice || ''}
              onChange={(e) => setHoldingForm({ currentPrice: parseFloat(e.target.value) || 0 })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-amber-600' : 'bg-slate-900 border-slate-700 text-amber-400'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>股數 (1張=1000股)</label>
            <input
              type="number"
              step="1"
              value={holdingForm.shares || ''}
              onChange={(e) => setHoldingForm({ shares: parseInt(e.target.value) || 0 })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>優惠折扣</label>
            <input
              type="number"
              step="0.01"
              value={holdingForm.discount ?? globalDiscount}
              onChange={(e) => setHoldingForm({ discount: parseFloat(e.target.value) || 0 })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>證券類型</label>
            <select
              value={holdingForm.assetType}
              onChange={(e) => setHoldingForm({ assetType: e.target.value as any })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="股票">股票</option>
              <option value="ETF">ETF</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>交易類型</label>
            <button
              type="button"
              onClick={openTradeTypeSelector}
              className={`w-full border rounded-lg p-2 text-xs font-bold text-left flex justify-between items-center ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <span>{holdingForm.tradeType}</span>
              <i className="fa-solid fa-caret-down text-slate-400"></i>
            </button>
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>交易日期</label>
            <input
              type="date"
              value={holdingForm.date}
              onChange={(e) => setHoldingForm({ date: e.target.value })}
              className={`w-full border rounded-lg p-2 text-xs font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>費用低限</label>
            <input
              type="number"
              value={holdingForm.minFee}
              onChange={(e) => setHoldingForm({ minFee: parseInt(e.target.value) || 0 })}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>
        </div>

        {/* ETF 專屬：淨值 (NAV) 欄位與折溢價即時提示 */}
        {(holdingForm.assetType === 'ETF' || holdingForm.symbol.startsWith('00')) && (
          <div className={`p-2.5 rounded-xl border space-y-1.5 ${
            isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-900/90 border-amber-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs text-amber-600 font-bold flex items-center space-x-1">
                <i className="fa-solid fa-chart-pie"></i>
                <span>ETF 基金淨值 (NAV) :</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="輸入估計淨值"
                value={holdingForm.nav || ''}
                onChange={(e) => setHoldingForm({ nav: parseFloat(e.target.value) || 0 })}
                className={`w-32 rounded px-2 py-1 text-xs text-right font-bold focus:outline-none border ${
                  isLight ? 'bg-white border-amber-300 text-amber-800' : 'bg-slate-800 border-amber-500/50 text-amber-300'
                }`}
              />
            </div>

            {(() => {
              const pd = calcEtfPremiumDiscount(holdingForm.currentPrice, holdingForm.nav, holdingForm.shares);
              if (!pd) return <p className="text-[11px] text-slate-500">填寫淨值後將自動計算折溢價點數與持股總金額</p>;
              return (
                <div
                  className={`p-2 rounded-lg text-xs border flex flex-col space-y-0.5 ${
                    pd.isPremium
                      ? (isLight ? 'bg-rose-100 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/60 text-rose-300')
                      : (isLight ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300')
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
        <div className={`p-2.5 rounded-lg border text-xs flex justify-between font-medium ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
        }`}>
          <span>預估匯出總金額 (含手續費):</span>
          <span className="font-extrabold text-emerald-600">${formatNum(totalCost)}</span>
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
            className={`px-4 rounded-xl text-sm transition ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

