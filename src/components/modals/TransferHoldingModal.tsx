import React, { useState, useEffect } from 'react';
import { useStockStore } from '../../store/useStockStore';

export const TransferHoldingModal: React.FC = () => {
  const {
    showTransferHoldingModal,
    setShowTransferHoldingModal,
    transferHoldingTarget,
    transferHoldingToAccount,
    accounts,
    currentAccountId,
    holdingsData,
    themeMode
  } = useStockStore();

  const targetAccounts = accounts.filter(a => a.id !== currentAccountId);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  useEffect(() => {
    if (targetAccounts.length > 0) {
      setSelectedTargetId(targetAccounts[0].id);
    }
  }, [currentAccountId, showTransferHoldingModal]);

  if (!showTransferHoldingModal || !transferHoldingTarget) return null;

  const isLight = themeMode === 'light';

  const handleConfirm = () => {
    if (selectedTargetId) {
      transferHoldingToAccount(selectedTargetId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className="flex items-center space-x-2 text-blue-500">
            <i className="fa-solid fa-right-left"></i>
            <h3 className="font-bold text-base">轉移持股至其他帳戶</h3>
          </div>
          <button onClick={() => setShowTransferHoldingModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
          isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-blue-950/40 border-blue-800/50 text-blue-200'
        }`}>
          <div className="font-bold text-sm flex items-center space-x-1.5">
            <span>{transferHoldingTarget.symbol} - {transferHoldingTarget.name}</span>
            <span className="text-xs font-normal">({transferHoldingTarget.shares} 股 @ ${transferHoldingTarget.buyPrice})</span>
          </div>
          <p className="opacity-80 text-[11px]">選擇欲轉移到的目標帳戶（若目標帳戶已包含相同標的，系統將自動加權合併）：</p>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {targetAccounts.map(acc => (
            <div
              key={acc.id}
              onClick={() => setSelectedTargetId(acc.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                selectedTargetId === acc.id
                  ? (isLight ? 'bg-blue-100 border-blue-500 text-blue-900 shadow' : 'bg-blue-900/60 border-blue-500 text-white shadow')
                  : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 hover:bg-slate-700 text-slate-200')
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i className={`fa-solid ${
                  selectedTargetId === acc.id ? 'fa-circle-check text-blue-500' : (isLight ? 'fa-circle text-slate-300' : 'fa-circle text-slate-600')
                }`}></i>
                <span className="font-bold text-sm">{acc.name}</span>
              </div>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ({(holdingsData[acc.id] || []).length} 筆庫存)
              </span>
            </div>
          ))}
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => setShowTransferHoldingModal(false)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-1"
          >
            <i className="fa-solid fa-check"></i>
            <span>確認轉移標的</span>
          </button>
        </div>
      </div>
    </div>
  );
};
