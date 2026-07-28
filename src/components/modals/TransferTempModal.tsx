import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';

export const TransferTempModal: React.FC = () => {
  const {
    showTransferModal,
    setShowTransferModal,
    accounts,
    holdingsData,
    transferTempHoldings,
    themeMode
  } = useStockStore();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('acc-1');

  if (!showTransferModal) return null;

  const isLight = themeMode === 'light';
  const formalAccounts = accounts.filter(a => a.id !== 'acc-temp');
  const tempItems = holdingsData['acc-temp'] || [];

  const handleConfirmTransfer = () => {
    transferTempHoldings(selectedTargetId);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className="flex items-center space-x-2 text-amber-500">
            <i className="fa-solid fa-right-left"></i>
            <h3 className="font-bold text-base text-slate-100">一鍵轉存庫存</h3>
          </div>
          <button onClick={() => setShowTransferModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-900/20 border-amber-700/40 text-amber-200'
        }`}>
          <div className="font-bold flex items-center space-x-1">
            <i className="fa-solid fa-circle-info"></i>
            <span>【臨時帳戶】目前包含 {tempItems.length} 筆文字匯入的庫存筆記</span>
          </div>
          <p className="opacity-90">請選擇您的個人證券帳戶，系統將自動一鍵將所有資料歸冊至該帳戶中：</p>
        </div>

        <div className="space-y-2">
          {formalAccounts.map(acc => (
            <div
              key={acc.id}
              onClick={() => setSelectedTargetId(acc.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                selectedTargetId === acc.id
                  ? (isLight ? 'bg-amber-100 border-amber-500 text-amber-900 shadow' : 'bg-blue-900/50 border-blue-500 text-white shadow')
                  : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 hover:bg-slate-700 text-slate-200')
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i className={`fa-solid ${
                  selectedTargetId === acc.id ? 'fa-circle-check text-amber-500' : (isLight ? 'fa-circle text-slate-300' : 'fa-circle text-slate-600')
                }`}></i>
                <span className="font-bold text-sm">{acc.name}</span>
              </div>
              <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ({(holdingsData[acc.id] || []).length} 筆原有庫存)
              </span>
            </div>
          ))}
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={() => setShowTransferModal(false)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleConfirmTransfer}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center space-x-1"
          >
            <i className="fa-solid fa-check"></i>
            <span>確認轉存</span>
          </button>
        </div>
      </div>
    </div>
  );
};
