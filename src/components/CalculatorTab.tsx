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
    globalDiscount
  } = useStockStore();

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
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <h2 className="font-bold text-lg text-slate-100 flex items-center space-x-2">
          <i className="fa-solid fa-calculator text-blue-400"></i>
          <span>成交試算 (含完整交易類型)</span>
        </h2>
        <button onClick={clearCalc} className="text-xs text-slate-400 hover:text-slate-200">
          清空欄位
        </button>
      </div>

      {/* 搜尋或輸入標的 */}
      <div className="relative">
        <label className="block text-xs text-slate-400 mb-1">快速套用標的 (自動帶入價格)</label>
        <div className="relative">
          <input
            type="text"
            value={calcQuery}
            onChange={(e) => {
              setCalcQuery(e.target.value);
              searchCalcStock(e.target.value);
            }}
            placeholder="搜尋股票代號或名稱 (如: 2330, 台積電, 2603)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          {/* 搜尋下拉清單 */}
          {calcSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              {calcSearchResults.map((s) => (
                <div
                  key={s.code}
                  onClick={() => selectCalcStock(s)}
                  className="p-2.5 hover:bg-slate-700 cursor-pointer flex justify-between items-center text-xs border-b border-slate-700/50"
                >
                  <div>
                    <span className="font-bold text-white">{s.code}</span>
                    <span className="ml-2 text-slate-300">{s.name}</span>
                  </div>
                  <span className="text-amber-400 font-bold">
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
          <label className="block text-xs text-slate-400 mb-1">買價 :</label>
          <input
            type="number"
            step="0.01"
            value={calcForm.buyPrice || ''}
            onChange={(e) => setCalcForm({ buyPrice: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">賣價 :</label>
          <input
            type="number"
            step="0.01"
            value={calcForm.sellPrice || ''}
            onChange={(e) => setCalcForm({ sellPrice: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">買進股數 :</label>
          <input
            type="number"
            step="1"
            value={calcForm.buyShares || ''}
            onChange={(e) => setCalcForm({ buyShares: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">賣出股數 :</label>
          <input
            type="number"
            step="1"
            value={calcForm.sellShares || ''}
            onChange={(e) => setCalcForm({ sellShares: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">折扣 :</label>
          <input
            type="number"
            step="0.01"
            value={calcForm.discount}
            onChange={(e) => setCalcForm({ discount: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">低限 :</label>
          <select
            value={calcForm.minFee}
            onChange={(e) => setCalcForm({ minFee: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          >
            <option value={20}>$20 (一般)</option>
            <option value={1}>$1 (零股優惠)</option>
            <option value={0}>$0 (無低限)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">類型 :</label>
          <select
            value={calcForm.assetType}
            onChange={(e) => setCalcForm({ assetType: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          >
            <option value="股票">股票</option>
            <option value="ETF">ETF</option>
          </select>
        </div>

        {/* 交易類型按鈕 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">交易類型 :</label>
          <button
            type="button"
            onClick={openTradeTypeSelector}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white text-left flex justify-between items-center"
          >
            <span>{calcForm.tradeType}</span>
            <i className="fa-solid fa-caret-down text-slate-400"></i>
          </button>
        </div>
      </div>

      {/* 試算結果呈現區域 */}
      <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-700 space-y-2">
        <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800">
          <span className="text-slate-300 font-medium">損益 :</span>
          <span className={`font-bold text-base ${getPnlColorClass(pnl)}`}>
            ${formatNum(pnl)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm py-1 border-b border-slate-800">
          <span className="text-slate-300 font-medium">獲利率 :</span>
          <span className={`font-bold ${getPnlColorClass(pnl)}`}>
            {formatPct(returnPct)}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-300 py-1 border-b border-slate-800">
          <span>總匯出金額 :</span>
          <span className="text-slate-100 font-semibold">${formatNum(totalCost)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-300 py-1 border-b border-slate-800">
          <span>總入帳金額 :</span>
          <span className="text-slate-100 font-semibold">${formatNum(totalProceeds)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>手續費 :</span>
          <span className="text-slate-200">${formatNum(buyFeeObj.fee + sellFeeObj.fee)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>交易稅 :</span>
          <span className="text-slate-200">${formatNum(sellFeeObj.tax)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-amber-400 pt-2 border-t border-slate-800">
          <span>打平保本價 (售價高於):</span>
          <span className="font-bold">${isNaN(breakEvenPrice) ? '0.00' : breakEvenPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
