import React, { useState, useEffect } from 'react';
import { useStockStore } from '../../store/useStockStore';
import { generateShareText, generateShareTextForMultiple } from '../../utils/shareUtils';

export const ShareModal: React.FC = () => {
  const {
    showShareModal,
    setShowShareModal,
    shareTargetItem,
    holdingsData,
    currentAccountId,
    importShareText,
    setToastMessage,
    themeMode
  } = useStockStore();

  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [scope, setScope] = useState<'single' | 'all'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (shareTargetItem) {
      setScope('single');
      setActiveSubTab('export');
    } else {
      setScope('all');
    }
  }, [shareTargetItem, showShareModal]);

  if (!showShareModal) return null;

  const isLight = themeMode === 'light';
  const currentHoldings = holdingsData[currentAccountId] || [];

  let exportContent = '';
  if (scope === 'single' && shareTargetItem) {
    exportContent = generateShareText(shareTargetItem);
  } else {
    exportContent = generateShareTextForMultiple(currentHoldings);
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopied(true);
      setToastMessage('已成功複製分享文字至剪貼簿！');
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      alert('複製失敗，請手動全選文字進行複製。');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Stock-Cal 庫存資料',
          text: exportContent
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setImportText(text);
      }
    } catch (e) {
      alert('無法存取剪貼簿，請手動貼上文字。');
    }
  };

  const handleDoImport = () => {
    if (!importText.trim()) {
      alert('請先輸入或貼上分享文字！');
      return;
    }
    const res = importShareText(importText);
    if (!res.success) {
      alert(res.message || '匯入失敗');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
      }`}>
        {/* 標題與關閉按鈕 */}
        <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-[#fa-share] fa-share-nodes text-amber-500"></i>
            <h3 className="font-bold text-base">庫存文字分享與匯入</h3>
          </div>
          <button onClick={() => setShowShareModal(false)} className={isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* 分頁開關：匯出文字 / 匯入文字 */}
        <div className={`flex rounded-xl p-1 border text-xs font-bold ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-700'
        }`}>
          <button
            onClick={() => setActiveSubTab('export')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeSubTab === 'export'
                ? 'bg-amber-500 text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <i className="fa-solid fa-arrow-up-from-bracket mr-1"></i>
            分享 / 複製文字
          </button>
          <button
            onClick={() => setActiveSubTab('import')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeSubTab === 'import'
                ? 'bg-amber-500 text-white shadow'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <i className="fa-solid fa-arrow-down-to-bracket mr-1"></i>
            匯入分享文字
          </button>
        </div>

        {activeSubTab === 'export' ? (
          <div className="space-y-3">
            {/* 範圍選擇 (指定個股 vs 全部庫存) */}
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>分享範圍：</span>
              <div className="flex space-x-2">
                {shareTargetItem && (
                  <button
                    onClick={() => setScope('single')}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                      scope === 'single'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                        : (isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-700 border-slate-600 text-slate-300')
                    }`}
                  >
                    指定個股 ({shareTargetItem.symbol})
                  </button>
                )}
                <button
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition ${
                    scope === 'all'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                      : (isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-700 border-slate-600 text-slate-300')
                  }`}
                >
                  全部庫存 ({currentHoldings.length}筆)
                </button>
              </div>
            </div>

            {/* 文字預覽框 */}
            <div className="relative">
              <textarea
                readOnly
                value={exportContent || '（目前帳戶無庫存紀錄）'}
                rows={7}
                className={`w-full p-3 rounded-xl border text-xs font-mono resize-none focus:outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              />
            </div>

            {/* 動作按鈕 */}
            <div className="flex space-x-2">
              <button
                onClick={handleCopy}
                disabled={!exportContent}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copied ? '已複製！' : '一鍵複製分享文字'}</span>
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  disabled={!exportContent}
                  className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                >
                  <i className="fa-solid fa-share-nodes"></i>
                  <span>系統分享</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                貼上收到的分享文字，系統將自動解析並寫入【臨時帳戶】
              </span>
              <button
                onClick={handlePasteFromClipboard}
                className="text-[11px] px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition font-bold"
              >
                <i className="fa-solid fa-paste mr-1"></i>
                自動貼上
              </button>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`格式範例：\n股票（ETF）名稱：台積電\n股票代號：2330\n買入價格：980\n股數：1000\n手續折扣：0.38\n購買時間：20260728`}
              rows={7}
              className={`w-full p-3 rounded-xl border text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
              }`}
            />

            <button
              onClick={handleDoImport}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg"
            >
              <i className="fa-solid fa-file-import"></i>
              <span>解析並匯入至【臨時帳戶】</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
