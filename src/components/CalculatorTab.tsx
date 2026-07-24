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
    themeMode
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
    <div className={`rounded-xl p-4 border transition-colors shadow-sm space-y-4 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
    }`}>
      <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
        <h2 className="font-bold text-lg flex items-center space-x-2">
          <i className="fa-solid fa-calculator text-blue-500"></i>
          <span>成交試算 (含完整交易類型)</span>
        </h2>
        <button onClick={clearCalc} className={`text-xs font-semibold hover:underline ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          清空欄位
        </button>
      </div>

      {/* 搜尋或輸入標的 */}
      <div className="relative">
        <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
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
            placeholder="搜尋股票代號或名稱 (如: 2330, 台積電, 2603)..."
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

      {/* 試算結果呈現區域 */}
      <div className={`rounded-xl p-3.5 border space-y-2 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'
      }`}>
        <div className={`flex justify-between items-center text-sm py-1 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>損益 :</span>
          <span className={`font-black text-base ${getPnlColorClass(pnl)}`}>
            ${formatNum(pnl)}
          </span>
        </div>
        <div className={`flex justify-between items-center text-sm py-1 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>獲利率 :</span>
          <span className={`font-black ${getPnlColorClass(pnl)}`}>
            {formatPct(returnPct)}
          </span>
        </div>
        <div className={`flex justify-between items-center text-xs py-1 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'}`}>
          <span>總匯出金額 :</span>
          <span className="font-bold">${formatNum(totalCost)}</span>
        </div>
        <div className={`flex justify-between items-center text-xs py-1 border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'}`}>
          <span>總入帳金額 :</span>
          <span className="font-bold">${formatNum(totalProceeds)}</span>
        </div>
        <div className={`flex justify-between items-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <span>手續費 :</span>
          <span className="font-semibold">${formatNum(buyFeeObj.fee + sellFeeObj.fee)}</span>
        </div>
        <div className={`flex justify-between items-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <span>交易稅 :</span>
          <span className="font-semibold">${formatNum(sellFeeObj.tax)}</span>
        </div>
        <div className={`flex justify-between items-center text-xs pt-2 border-t font-bold ${
          isLight ? 'border-slate-200 text-amber-600' : 'border-slate-800 text-amber-400'
        }`}>
          <span>打平保本價 (售價高於):</span>
          <span className="font-black text-sm">${isNaN(breakEvenPrice) ? '0.00' : breakEvenPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

