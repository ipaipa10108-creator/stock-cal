import React, { useState, useEffect } from 'react';
import { useStockStore } from '../../store/useStockStore';

export const EditLotModal: React.FC = () => {
  const {
    showEditLotModal,
    closeEditLotModal,
    editingLotTarget,
    updateHoldingLot,
    themeMode
  } = useStockStore();

  const [buyPrice, setBuyPrice] = useState(0);
  const [shares, setShares] = useState(0);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (editingLotTarget) {
      setBuyPrice(editingLotTarget.lot.buyPrice);
      setShares(editingLotTarget.lot.shares);
      setDate(editingLotTarget.lot.date);
    }
  }, [editingLotTarget]);

  if (!showEditLotModal || !editingLotTarget) return null;

  const isLight = themeMode === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buyPrice <= 0 || shares <= 0) {
      alert('請輸入有效的買進單價與股數');
      return;
    }
    updateHoldingLot(editingLotTarget.holdingId, editingLotTarget.lot.id, {
      buyPrice,
      shares,
      date
    });
    closeEditLotModal();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm md:max-w-md p-4 md:p-6 shadow-2xl space-y-4 border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className="font-bold text-base md:text-lg flex items-center space-x-2">
            <i className="fa-solid fa-[#fa-pen] fa-pen-to-square text-amber-500"></i>
            <span>修改個別買進紀錄</span>
          </h3>
          <button onClick={closeEditLotModal} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買進單價 (NT$)</label>
            <input
              type="number"
              step="0.01"
              value={buyPrice || ''}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買進股數</label>
            <input
              type="number"
              step="1"
              value={shares || ''}
              onChange={(e) => setShares(parseInt(e.target.value) || 0)}
              className={`w-full border rounded-lg p-2 text-sm font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>買進日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full border rounded-lg p-2 text-xs font-bold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-extrabold text-sm shadow transition"
            >
              儲存更新
            </button>
            <button
              type="button"
              onClick={closeEditLotModal}
              className={`px-4 rounded-xl text-sm transition ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
