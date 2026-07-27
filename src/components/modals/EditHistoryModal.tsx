import React, { useState, useEffect } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { HistoryItem } from '../../types/stock';
import { calcTradeDetails, formatNum, getPnlColorClass } from '../../utils/stockMath';

export const EditHistoryModal: React.FC = () => {
  const {
    showEditHistoryModal,
    setShowEditHistoryModal,
    editingHistoryItem,
    updateHistoryItem,
    globalDiscount,
    themeMode
  } = useStockStore();

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [shares, setShares] = useState(1000);
  const [buyDate, setBuyDate] = useState('');
  const [sellDate, setSellDate] = useState('');
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [isManualPnl, setIsManualPnl] = useState(false);

  useEffect(() => {
    if (editingHistoryItem) {
      setSymbol(editingHistoryItem.symbol);
      setName(editingHistoryItem.name);
      setBuyPrice(editingHistoryItem.buyPrice);
      setSellPrice(editingHistoryItem.sellPrice);
      setShares(editingHistoryItem.shares);
      setBuyDate(editingHistoryItem.buyDate);
      setSellDate(editingHistoryItem.sellDate);
      setRealizedPnl(editingHistoryItem.realizedPnl);
      setIsManualPnl(false);
    }
  }, [editingHistoryItem]);

  // Recalculate PnL automatically unless user manually adjusts PnL
  useEffect(() => {
    if (!isManualPnl && buyPrice > 0 && sellPrice > 0 && shares > 0) {
      const buyFee = calcTradeDetails(buyPrice, shares, globalDiscount, 20, true).fee;
      const buyCost = (buyPrice * shares) + buyFee;

      const sellDetails = calcTradeDetails(sellPrice, shares, globalDiscount, 20, false);
      const proceeds = (sellPrice * shares) - sellDetails.fee - sellDetails.tax;
      const calculatedPnl = Math.round(proceeds - buyCost);
      setRealizedPnl(calculatedPnl);
    }
  }, [buyPrice, sellPrice, shares, globalDiscount, isManualPnl]);

  if (!showEditHistoryModal || !editingHistoryItem) return null;

  const isLight = themeMode === 'light';

  // Calculate return percentage
  const buyFee = calcTradeDetails(buyPrice, shares, globalDiscount, 20, true).fee;
  const buyCost = (buyPrice * shares) + buyFee;
  const returnPct = buyCost > 0 ? (realizedPnl / buyCost) * 100 : 0;

  const handleSave = () => {
    if (!symbol.trim()) return;

    const updatedItem: HistoryItem = {
      ...editingHistoryItem,
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim().toUpperCase(),
      buyPrice,
      sellPrice,
      shares,
      buyDate,
      sellDate,
      realizedPnl,
      returnPct: parseFloat(returnPct.toFixed(2))
    };

    updateHistoryItem(updatedItem);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className="font-bold text-base flex items-center space-x-1.5">
            <i className="fa-solid fa-pen-to-square text-amber-500"></i>
            <span>修改歷史紀錄</span>
          </h3>
          <button
            onClick={() => setShowEditHistoryModal(false)}
            className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>股票代號</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>股票名稱</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>均買價</label>
              <input
                type="number"
                step="0.01"
                value={buyPrice}
                onChange={(e) => {
                  setBuyPrice(parseFloat(e.target.value) || 0);
                  setIsManualPnl(false);
                }}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>賣出價</label>
              <input
                type="number"
                step="0.01"
                value={sellPrice}
                onChange={(e) => {
                  setSellPrice(parseFloat(e.target.value) || 0);
                  setIsManualPnl(false);
                }}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>股數</label>
              <input
                type="number"
                step="1"
                value={shares}
                onChange={(e) => {
                  setShares(parseInt(e.target.value) || 0);
                  setIsManualPnl(false);
                }}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買入日期</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>賣出日期</label>
              <input
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className={`w-full border rounded-lg p-2 text-xs font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 試算與自訂損益區塊 */}
        <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>實現損益 (NT$)</span>
            <span className={`font-black text-sm ${getPnlColorClass(realizedPnl)}`}>
              {realizedPnl >= 0 ? '+' : ''}{formatNum(realizedPnl)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%)
            </span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-700/30">
            <label className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>自訂損益金額:</label>
            <input
              type="number"
              value={realizedPnl}
              onChange={(e) => {
                setRealizedPnl(parseInt(e.target.value) || 0);
                setIsManualPnl(true);
              }}
              className={`flex-1 border rounded px-2 py-1 text-xs font-bold ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-600 text-white'
              }`}
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm shadow transition"
          >
            儲存修改
          </button>
          <button
            onClick={() => setShowEditHistoryModal(false)}
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
