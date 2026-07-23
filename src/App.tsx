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
    isLiveSimulating
  } = useStockStore();

  useEffect(() => {
    loadFromStorage();
    checkAndUpdateMarketHours();
    refreshPrices();

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
    };
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-900 shadow-2xl flex flex-col relative border-x border-slate-800 text-slate-100 font-sans select-none">
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
      <nav className="bg-slate-800 border-t border-slate-700 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 flex justify-around py-2 text-center text-xs">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'holdings' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-box-archive text-base"></i>
          <span>庫存</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'calculator' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-calculator text-base"></i>
          <span>試算</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left text-base"></i>
          <span>歷史</span>
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'market' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <i className="fa-solid fa-globe text-base"></i>
          <span>指數</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center space-y-1 ${
            activeTab === 'settings' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
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
