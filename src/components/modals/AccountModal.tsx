import React, { useState } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { formatNum } from '../../utils/stockMath';

export const AccountModal: React.FC = () => {
  const {
    showAccountModal,
    setShowAccountModal,
    accounts,
    currentAccountId,
    setCurrentAccountId,
    updateAccountName,
    accountLimitInput,
    holdingsData,
    setShowTransferModal,
    themeMode
  } = useStockStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  if (!showAccountModal) return null;

  const isLight = themeMode === 'light';

  const handleStartEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editName.trim()) {
      updateAccountName(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-wallet text-amber-500"></i>
            <h3 className="font-bold text-base">切換與管理帳戶</h3>
          </div>
          <button onClick={() => setShowAccountModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          點擊鉛筆圖示可自訂帳戶名稱（例：元大證券、國泰證券）
        </p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {accounts.map((acc) => {
            const isTemp = acc.id === 'acc-temp';
            const tempHoldingsCount = (holdingsData['acc-temp'] || []).length;
            const isEditing = editingId === acc.id;

            return (
              <div
                key={acc.id}
                onClick={() => {
                  if (!isEditing) setCurrentAccountId(acc.id);
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  currentAccountId === acc.id
                    ? (isLight ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-md' : 'bg-blue-900/50 border-blue-500 text-white shadow-md')
                    : (isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800' : 'bg-slate-900/80 border-slate-800 hover:bg-slate-700/80 text-slate-200')
                }`}
              >
                <div className="flex items-center space-x-2.5 flex-1 mr-2">
                  <i
                    className={`fa-solid ${
                      currentAccountId === acc.id
                        ? 'fa-circle-dot text-amber-500 text-base'
                        : isTemp
                        ? 'fa-clock-rotate-left text-purple-400'
                        : (isLight ? 'fa-circle text-slate-300' : 'fa-circle text-slate-600')
                    }`}
                  ></i>
                  <div className="flex-1">
                    {isEditing ? (
                      <form onSubmit={(e) => handleSaveEdit(e, acc.id)} className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className={`px-2 py-0.5 rounded text-xs border font-bold w-full focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-600 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveEdit(e, acc.id)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2 py-0.5 bg-slate-500 hover:bg-slate-400 text-white rounded text-xs"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm">{acc.name}</span>
                        {isTemp && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-semibold border border-purple-500/30">
                            臨時({tempHoldingsCount})
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTemp ? '用於儲存分享文字匯入資料' : `上限: ${accountLimitInput ? `$${formatNum(accountLimitInput)}` : '未設定'}`}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex items-center space-x-1">
                    {isTemp && tempHoldingsCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAccountModal(false);
                          setShowTransferModal(true);
                        }}
                        className="text-[11px] px-2 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition shadow"
                        title="一鍵將臨時帳戶庫存轉存至正式帳戶"
                      >
                        <i className="fa-solid fa-[#fa-share] fa-right-left mr-1"></i>
                        轉存
                      </button>
                    )}
                    <button
                      onClick={(e) => handleStartEdit(e, acc.id, acc.name)}
                      className={`p-1.5 rounded-lg transition ${
                        isLight ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800' : 'hover:bg-slate-700 text-slate-400 hover:text-slate-100'
                      }`}
                      title="編輯帳戶名稱"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


