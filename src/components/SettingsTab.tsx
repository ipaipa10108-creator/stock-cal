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
    triggerPwaInstall,
    themeMode,
    setThemeMode
  } = useStockStore();

  const isLight = themeMode === 'light';
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
    <div className={`rounded-xl p-4 border transition-colors shadow-sm space-y-4 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
    }`}>
      <h2 className={`font-bold text-lg flex items-center space-x-2 border-b pb-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
        <i className="fa-solid fa-gear text-slate-400"></i>
        <span>系統設定與主題選擇</span>
      </h2>

      <div className="space-y-4">
        {/* 主題選擇區 */}
        <div>
          <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>介面主題 (日間 / 夜間模式)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-2.5 rounded-lg border flex items-center justify-center space-x-2 text-xs font-bold transition ${
                themeMode === 'dark'
                  ? 'bg-slate-900 border-amber-400 text-amber-300 shadow'
                  : (isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900/60 border-slate-700 text-slate-400')
              }`}
            >
              <i className="fa-solid fa-moon text-base text-sky-400"></i>
              <span>夜間模式 (Dark)</span>
            </button>

            <button
              onClick={() => setThemeMode('light')}
              className={`p-2.5 rounded-lg border flex items-center justify-center space-x-2 text-xs font-bold transition ${
                themeMode === 'light'
                  ? 'bg-amber-50 border-amber-500 text-amber-800 shadow font-extrabold'
                  : (isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900/60 border-slate-700 text-slate-400')
              }`}
            >
              <i className="fa-solid fa-sun text-base text-amber-500"></i>
              <span>日間模式 (Light)</span>
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>預設券商手續費折數 (折)</label>
          <input
            type="number"
            step="0.01"
            value={globalDiscount}
            onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
            className={`w-full border rounded-lg p-2 text-sm font-bold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          />
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>如：3.8折請填 0.38；0 折免手續費請填 0</p>
        </div>

        <div>
          <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>投資上限金額設定 (NT$)</label>
          <input
            type="number"
            placeholder="留空代表 未設定"
            value={accountLimitInput ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAccountLimitInput(isNaN(val) ? null : val);
            }}
            className={`w-full border rounded-lg p-2 text-sm font-bold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
          />
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            用於『獲利試算』對話框中顯示『投資上限』與『尚可投資』
          </p>
        </div>

        <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>桌面與手機 APP 安裝 (PWA)</div>
          <button
            onClick={triggerPwaInstall}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1.5 shadow transition"
          >
            <i className="fa-solid fa-desktop"></i>
            <span>安裝至電腦桌面 / 手機主畫面 App</span>
          </button>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            支援 Windows / Mac 桌面圖示與 iOS / Android 沉浸式獨立 App 開啟。
          </p>
        </div>

        <div className={`pt-2 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <div className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>資料備份與還原</div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className={`flex-1 p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1 transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <i className="fa-solid fa-download"></i>
              <span>備份資料 (JSON)</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 p-2.5 rounded-lg text-xs font-bold flex justify-center items-center space-x-1 transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
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

        <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-700'}`}>
          <button
            onClick={resetCurrentAccountData}
            className={`w-full p-2.5 rounded-lg text-xs font-bold transition border ${
              isLight
                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                : 'bg-rose-900/40 hover:bg-rose-900/70 border-rose-700 text-rose-300'
            }`}
          >
            清除目前帳戶所有庫存與歷史
          </button>
        </div>
      </div>
    </div>
  );
};

