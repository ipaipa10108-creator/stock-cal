import React, { useEffect } from 'react';
import { useStockStore } from './store/useStockStore';
import { Header } from './components/Header';
import { HoldingsTab } from './components/HoldingsTab';
import { CalculatorTab } from './components/CalculatorTab';
import { HistoryTab } from './components/HistoryTab';
import { MarketTab } from './components/MarketTab';
import { SettingsTab } from './components/SettingsTab';
import { AddHoldingModal } from './components/modals/AddHoldingModal';
import { TradeTypeModal } from './components/modals/TradeTypeModal';
import { ProfitSummaryModal } from './components/modals/ProfitSummaryModal';
import { SellModal } from './components/modals/SellModal';
import { AccountModal } from './components/modals/AccountModal';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    loadFromStorage,
    checkAndUpdateMarketHours,
    refreshPrices,
    isLiveSimulating,
    themeMode,
    toastMessage
  } = useStockStore();

  useEffect(() => {
    loadFromStorage();
    checkAndUpdateMarketHours();
    refreshPrices();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW register notice:', err));
      });
    }

    // Capture PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      useStockStore.getState().setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const timer = setInterval(() => {
      if (useStockStore.getState().isLiveSimulating) {
        refreshPrices();
      }
    }, 15000);

    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        useStockStore.setState({ addSearchResults: [], calcSearchResults: [] });
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      clearInterval(timer);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isLight = themeMode === 'light';

  return (
    <div className={`max-w-md mx-auto min-h-screen shadow-2xl flex flex-col relative border-x transition-colors duration-200 font-sans select-none ${
      isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-100 border-slate-800'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl border border-emerald-400 animate-bounce flex items-center space-x-1.5">
          <i className="fa-solid fa-circle-check"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 頂部列 Header */}
      <Header />

      {/* 主要內容區域 */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
        {activeTab === 'holdings' && <HoldingsTab />}
        {activeTab === 'calculator' && <CalculatorTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'market' && <MarketTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* 底部導覽列 NAVBAR */}
      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 flex justify-around py-2 text-center text-xs border-t transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
      }`}>
        <button
          onClick={() => setActiveTab('holdings')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'holdings' ? 'text-amber-500 font-bold' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
          }`}
        >
          <i className="fa-solid fa-box-archive text-base"></i>
          <span>庫存</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'calculator' ? 'text-amber-500 font-bold' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
          }`}
        >
          <i className="fa-solid fa-calculator text-base"></i>
          <span>試算</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'history' ? 'text-amber-500 font-bold' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left text-base"></i>
          <span>歷史</span>
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'market' ? 'text-amber-500 font-bold' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
          }`}
        >
          <i className="fa-solid fa-globe text-base"></i>
          <span>指數</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'settings' ? 'text-amber-500 font-bold' : (isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200')
          }`}
        >
          <i className="fa-solid fa-sliders text-base"></i>
          <span>設定</span>
        </button>
      </nav>

      {/* 彈窗 Modals */}
      <AddHoldingModal />
      <TradeTypeModal />
      <ProfitSummaryModal />
      <SellModal />
      <AccountModal />
    </div>
  );
};

