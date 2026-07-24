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
    accountLimitInput,
    themeMode
  } = useStockStore();

  if (!showAccountModal) return null;

  const isLight = themeMode === 'light';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-xs p-4 space-y-3 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <h3 className="font-bold text-base">選擇帳戶</h3>
          <button onClick={() => setShowAccountModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
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
                  ? (isLight ? 'bg-amber-50 border-amber-500 text-amber-900 shadow' : 'bg-blue-900/40 border-blue-500 text-white')
                  : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 hover:bg-slate-700 text-slate-200')
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <i
                  className={`fa-solid ${
                    currentAccountId === acc.id ? 'fa-circle-dot text-amber-500' : (isLight ? 'fa-circle text-slate-300' : 'fa-circle text-slate-600')
                  }`}
                ></i>
                <div>
                  <div className="font-bold text-sm">{acc.name}</div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
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

