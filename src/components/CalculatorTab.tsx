import React from 'react';
import { useStockStore } from '../store/useStockStore';
import { calcTradeDetails, formatNum, formatPct, getPnlColorClass } from '../utils/stockMath';

export const CalculatorTab: React.FC = () => {
  const {
    calcForm,
    setCalcForm,
    calcQuery,
    setCalcQuery,
    calcSearchResults,
    searchCalcStock,
    selectCalcStock,
    setTradeTypeContext,
    setShowTradeTypeModal,
    globalDiscount,
    themeMode,
    addCalcToHoldings
  } = useStockStore();

  const isLight = themeMode === 'light';

  const buyFeeObj = calcTradeDetails(
    calcForm.buyPrice,
    calcForm.buyShares,
    calcForm.discount,
    calcForm.minFee,
    true,
    calcForm.assetType,
    calcForm.tradeType,
    globalDiscount
  );
  const totalCost = (calcForm.buyPrice * calcForm.buyShares) + buyFeeObj.fee;

  const sellFeeObj = calcTradeDetails(
    calcForm.sellPrice,
    calcForm.sellShares,
    calcForm.discount,
    calcForm.minFee,
    false,
    calcForm.assetType,
    calcForm.tradeType,
    globalDiscount
  );
  const totalProceeds = (calcForm.sellPrice * calcForm.sellShares) - sellFeeObj.fee - sellFeeObj.tax;

  const pnl = totalProceeds - totalCost;
  const returnPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  const taxRate = calcForm.assetType === 'ETF' ? 0.001 : (calcForm.tradeType.includes('當沖') ? 0.0015 : 0.003);
  const discountFeeRate = 0.001425 * calcForm.discount;
  const breakEvenPrice = (calcForm.buyPrice * (1 + discountFeeRate)) / (1 - discountFeeRate - taxRate);

  const clearCalc = () => {
    setCalcQuery('');
    setCalcForm({ buyPrice: 0, sellPrice: 0 });
  };

  const openTradeTypeSelector = () => {
    setTradeTypeContext('calc');
    setShowTradeTypeModal(true);
  };

  return (
    <div className={`rounded-xl p-4 md:p-6 border transition-colors shadow-sm space-y-4 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
    }`}>
      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
        <h2 className="font-bold text-lg md:text-xl flex items-center space-x-2">
          <i className="fa-solid fa-calculator text-blue-500"></i>
          <span>成交試算 (含完整交易類型)</span>
        </h2>
        <button onClick={clearCalc} className={`text-xs md:text-sm font-semibold hover:underline flex items-center space-x-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          <i className="fa-solid fa-rotate-left"></i>
          <span>清空欄位</span>
        </button>
      </div>

      {/* 響應式佈局：行動版單欄，PC/桌機雙欄 (Left: 5 cols, Right: 7 cols) */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 space-y-4 lg:space-y-0 items-start">
        {/* 左欄：搜尋與試算參數輸入 (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 搜尋或輸入標的 */}
          <div className="relative">
            <label className={`block text-xs md:text-sm mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              快速套用標的 (自動帶入價格)
            </label>
            <div className="relative">
              <input
                type="text"
                value={calcQuery}
                onChange={(e) => {
                  setCalcQuery(e.target.value);
                  searchCalcStock(e.target.value);
                }}
                placeholder="搜尋股票代號或名稱 (如: 2330, 台積電)..."
                className={`w-full border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
              {/* 搜尋下拉清單 */}
              {calcSearchResults.length > 0 && (
                <div className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  {calcSearchResults.map((s) => (
                    <div
                      key={s.code}
                      onClick={() => selectCalcStock(s)}
                      className={`p-2.5 cursor-pointer flex justify-between items-center text-xs border-b ${
                        isLight ? 'hover:bg-slate-100 border-slate-100' : 'hover:bg-slate-700 border-slate-700/50'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{s.code}</span>
                        <span className={`ml-2 ${isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}`}>{s.name}</span>
                      </div>
                      <span className="text-amber-500 font-extrabold">
                        {s.price > 0 ? `$${s.price}` : '點擊手動填價'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 試算表單輸入 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買價 :</label>
              <input
                type="number"
                step="0.01"
                value={calcForm.buyPrice || ''}
                onChange={(e) => setCalcForm({ buyPrice: parseFloat(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>賣價 :</label>
              <input
                type="number"
                step="0.01"
                value={calcForm.sellPrice || ''}
                onChange={(e) => setCalcForm({ sellPrice: parseFloat(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買進股數 :</label>
              <input
                type="number"
                step="1"
                value={calcForm.buyShares || ''}
                onChange={(e) => setCalcForm({ buyShares: parseInt(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>賣出股數 :</label>
              <input
                type="number"
                step="1"
                value={calcForm.sellShares || ''}
                onChange={(e) => setCalcForm({ sellShares: parseInt(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>折扣 :</label>
              <input
                type="number"
                step="0.01"
                value={calcForm.discount}
                onChange={(e) => setCalcForm({ discount: parseFloat(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>低限 :</label>
              <select
                value={calcForm.minFee}
                onChange={(e) => setCalcForm({ minFee: parseInt(e.target.value) || 0 })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value={20}>$20 (一般)</option>
                <option value={1}>$1 (零股優惠)</option>
                <option value={0}>$0 (無低限)</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>類型 :</label>
              <select
                value={calcForm.assetType}
                onChange={(e) => setCalcForm({ assetType: e.target.value as any })}
                className={`w-full border rounded-lg p-2 text-sm font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="股票">股票</option>
                <option value="ETF">ETF</option>
              </select>
            </div>

            {/* 交易類型按鈕 */}
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>交易類型 :</label>
              <button
                type="button"
                onClick={openTradeTypeSelector}
                className={`w-full border rounded-lg p-2 text-xs font-bold text-left flex justify-between items-center ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <span>{calcForm.tradeType}</span>
                <i className="fa-solid fa-caret-down text-slate-400"></i>
              </button>
            </div>
          </div>
        </div>

        {/* 右欄：試算結果與動作按鈕 (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`rounded-xl p-4 md:p-5 border space-y-3 shadow-inner ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-700'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              試算結果分析 (即時運算)
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={`p-3 rounded-lg border ${
                pnl >= 0
                  ? (isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-tw-up/20 border-slate-700')
                  : (isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-tw-down/20 border-slate-700')
              }`}>
                <div className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>預估試算損益</div>
                <div className={`text-xl font-black ${getPnlColorClass(pnl)}`}>
                  {pnl >= 0 ? '+' : ''}${formatNum(pnl)}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                pnl >= 0
                  ? (isLight ? 'bg-rose-50/80 border-rose-200' : 'bg-tw-up/20 border-slate-700')
                  : (isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-tw-down/20 border-slate-700')
              }`}>
                <div className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>報酬率 (ROI)</div>
                <div className={`text-xl font-black ${getPnlColorClass(pnl)}`}>
                  {formatPct(returnPct)}
                </div>
              </div>
            </div>

            <div className={`divide-y text-xs pt-1 ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
              <div className="flex justify-between items-center py-2">
                <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>總匯出金額 (交割成本) :</span>
                <span className="font-bold text-sm">${formatNum(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}>總入帳金額 (賣出收入) :</span>
                <span className="font-bold text-sm">${formatNum(totalProceeds)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>總預估手續費 :</span>
                <span className="font-semibold">${formatNum(buyFeeObj.fee + sellFeeObj.fee)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>總預估證交稅 :</span>
                <span className="font-semibold">${formatNum(sellFeeObj.tax)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 font-bold text-amber-500">
                <span>打平保本價 (售價高於):</span>
                <span className="font-black text-base underline">${isNaN(breakEvenPrice) ? '0.00' : breakEvenPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 一鍵轉為新增庫存按鈕 */}
          <button
            type="button"
            onClick={addCalcToHoldings}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer"
          >
            <i className="fa-solid fa-folder-plus text-lg"></i>
            <span>一鍵轉為新增庫存</span>
          </button>
        </div>
      </div>
    </div>
  );
};

