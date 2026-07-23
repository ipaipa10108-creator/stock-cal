import React, { useRef } from 'react';
import { useStockStore } from '../store/useStockStore';
import { exportAppDataAsJson } from '../db/stockDb';

export const SettingsTab: React.FC = () => {
  const {
    globalDiscount,
    setGlobalDiscount,
    accountLimitInput,
    setAccountLimitInput,
    holdingsData,
    historyData,
    importDataFromJson,
    resetCurrentAccountData,
    canInstallPwa,
    triggerPwaInstall
  } = useStockStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const jsonStr = await exportAppDataAsJson(holdingsData, historyData, globalDiscount, accountLimitInput);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const todayStr = new Date().toISOString().split('T')[0];

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tw_stock_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = importDataFromJson(parsed);
        if (success) {
          alert('資料還原成功！');
        } else {
          alert('備份檔案格式不正確！');
        }
      } catch (err) {
        alert('備份檔案讀取失敗！');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
      <h2 className="font-bold text-lg text-slate-100 flex items-center space-x-2 border-b border-slate-700 pb-2">
        <i className="fa-solid fa-gear text-slate-400"></i>
        <span>系統設定與投資上限設定</span>
      </h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">預設券商手續費折數 (折)</label>
          <input
            type="number"
            step="0.01"
            value={globalDiscount}
            onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <p className="text-[11px] text-slate-500 mt-1">如：3.8折請填 0.38；0 折免手續費請填 0</p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">投資上限金額設定 (NT$)</label>
          <input
            type="number"
            placeholder="留空代表 未設定"
            value={accountLimitInput ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAccountLimitInput(isNaN(val) ? null : val);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            用於『獲利試算』對話框中顯示『投資上限』與『尚可投資』
          </p>
        </div>

        <div className="pt-2 border-t border-slate-700 space-y-2">
          <div className="text-xs font-bold text-slate-300">桌面與手機 APP 安裝 (PWA)</div>
          <button
            onClick={triggerPwaInstall}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1.5 shadow"
          >
            <i className="fa-solid fa-desktop"></i>
            <span>安裝至電腦桌面 / 手機主畫面 App</span>
          </button>
          <p className="text-[11px] text-slate-400">
            支援 Windows / Mac 桌面圖示與 iOS / Android 沉浸式獨立 App 開啟。
          </p>
        </div>

        <div className="pt-2 border-t border-slate-700 space-y-2">
          <div className="text-xs font-bold text-slate-300">資料備份與還原</div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1"
            >
              <i className="fa-solid fa-download"></i>
              <span>備份資料 (JSON)</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1"
            >
              <i className="fa-solid fa-upload"></i>
              <span>還原資料</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              accept=".json"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <button
            onClick={resetCurrentAccountData}
            className="w-full bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700 text-rose-300 p-2.5 rounded-lg text-xs font-bold"
          >
            清除目前帳戶所有庫存與歷史
          </button>
        </div>
      </div>
    </div>
  );
};
