import React from 'react';
import { useStockStore } from '../../store/useStockStore';
import { formatNum } from '../../utils/stockMath';

export const AccountModal: React.FC = () => {
  const {
    showAccountModal,
    setShowAccountModal,
    accounts,
    currentAccountId,
    setCurrentAccountId,
    accountLimitInput
  } = useStockStore();

  if (!showAccountModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xs p-4 space-y-3 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h3 className="font-bold text-base text-slate-100">選擇帳戶</h3>
          <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-white">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="space-y-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => setCurrentAccountId(acc.id)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                currentAccountId === acc.id
                  ? 'bg-blue-900/40 border-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i
                  className={`fa-solid ${
                    currentAccountId === acc.id ? 'fa-circle-dot text-emerald-400' : 'fa-circle text-slate-600'
                  }`}
                ></i>
                <div>
                  <div className="font-bold text-sm text-white">{acc.name}</div>
                  <div className="text-[11px] text-slate-400">
                    上限: {accountLimitInput ? `$${formatNum(accountLimitInput)}` : '未設定'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
