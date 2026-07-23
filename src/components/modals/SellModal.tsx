import React, { useState, useEffect } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { calcTradeDetails, formatNum, getPnlColorClass } from '../../utils/stockMath';

export const SellModal: React.FC = () => {
  const {
    showSellModal,
    setShowSellModal,
    sellTarget,
    sellForm,
    confirmSell,
    globalDiscount
  } = useStockStore();

  const [price, setPrice] = useState(0);
  const [shares, setShares] = useState(0);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (sellTarget) {
      setPrice(sellForm.price);
      setShares(sellForm.shares);
      setDate(sellForm.date);
    }
  }, [sellTarget, sellForm]);

  if (!showSellModal || !sellTarget) return null;

  const itemDisc = sellTarget.discount !== undefined ? sellTarget.discount : globalDiscount;
  const buyFee = calcTradeDetails(sellTarget.buyPrice, shares, itemDisc, sellTarget.minFee || 20, true, sellTarget.assetType, sellTarget.tradeType, globalDiscount).fee;
  const buyCost = (sellTarget.buyPrice * shares) + buyFee;

  const sellDetails = calcTradeDetails(price, shares, itemDisc, sellTarget.minFee || 20, false, sellTarget.assetType, sellTarget.tradeType, globalDiscount);
  const proceeds = (price * shares) - sellDetails.fee - sellDetails.tax;
  const realizedPnl = proceeds - buyCost;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h3 className="font-bold text-base text-slate-100">
            平倉賣出 - {sellTarget.symbol} {sellTarget.name}
          </h3>
          <button onClick={() => setShowSellModal(false)} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">賣出價格 (NT$)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">賣出股數 (持有: {sellTarget.shares})</label>
            <input
              type="number"
              step="1"
              max={sellTarget.shares}
              value={shares}
              onChange={(e) => setShares(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">賣出日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>
        </div>

        {/* 預計實現損益計算 */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-1 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>預估賣出入帳:</span>
            <span className="font-bold">${formatNum(proceeds)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>淨已實現損益:</span>
            <span className={`font-bold ${getPnlColorClass(realizedPnl)}`}>
              {realizedPnl >= 0 ? '+' : ''}{formatNum(realizedPnl)}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 pt-1">
          <button
            onClick={confirmSell}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm"
          >
            確認平倉賣出
          </button>
          <button
            onClick={() => setShowSellModal(false)}
            className="px-4 bg-slate-700 text-slate-300 rounded-xl text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
