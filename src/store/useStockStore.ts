import { create } from 'zustand';
import {
  Account,
  HoldingItem,
  HistoryItem,
  StockQuote,
  TradeTypeOption,
  AssetType,
  HoldingFormState,
  CalcFormState,
  ComputedHolding,
  ApiProvider,
  HoldingLot,
  HoldingDisplaySettings
} from '../types/stock';
import { calcTradeDetails } from '../utils/stockMath';
import { checkTradingHours, fetchQuotesByProvider, fetchSingleQuote, fetchTwseOpenApiQuotes } from '../services/twseApi';
import { initialStockDictionary } from '../db/stockDictionary';
import { GlobalIndexQuote, initialGlobalIndices } from '../services/marketIndices';
import { parseShareText } from '../utils/shareUtils';

interface StockStore {
  // Navigation & Modals
  activeTab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings' | 'guide';
  setActiveTab: (tab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings' | 'guide') => void;

  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  toggleThemeMode: () => void;

  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;

  holdingDisplaySettings: HoldingDisplaySettings;
  setHoldingDisplaySettings: (settings: Partial<HoldingDisplaySettings>) => void;

  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;

  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  isEditingHolding: boolean;
  
  showTradeTypeModal: boolean; // TradeType selection modal (z-[60])
  setShowTradeTypeModal: (val: boolean) => void;
  tradeTypeContext: 'calc' | 'add';
  setTradeTypeContext: (ctx: 'calc' | 'add') => void;

  showProfitSummaryModal: boolean;
  setShowProfitSummaryModal: (val: boolean) => void;
  showAccountModal: boolean;
  setShowAccountModal: (val: boolean) => void;
  showSellModal: boolean;
  setShowSellModal: (val: boolean) => void;
  showEditHistoryModal: boolean;
  setShowEditHistoryModal: (val: boolean) => void;
  editingHistoryItem: HistoryItem | null;
  openEditHistoryModal: (item: HistoryItem) => void;
  updateHistoryItem: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => void;

  // Share & Import Modals
  showShareModal: boolean;
  setShowShareModal: (val: boolean) => void;
  shareTargetItem: HoldingItem | null;
  openShareModal: (item?: HoldingItem | null) => void;

  showTransferModal: boolean;
  setShowTransferModal: (val: boolean) => void;

  // PWA Installation
  deferredPrompt: any;
  canInstallPwa: boolean;
  setDeferredPrompt: (promptEvent: any) => void;
  triggerPwaInstall: () => Promise<void>;

  // Accounts & Data
  accounts: Account[];
  currentAccountId: string;
  setCurrentAccountId: (id: string) => void;
  updateAccountName: (id: string, name: string) => void;
  importShareText: (text: string) => { success: boolean; count: number; message?: string };
  transferTempHoldings: (targetAccountId: string) => void;

  holdingsData: Record<string, HoldingItem[]>;
  historyData: Record<string, HistoryItem[]>;
  fullStockMap: Record<string, StockQuote>;
  presetStockList: StockQuote[];

  // Settings
  globalDiscount: number;
  setGlobalDiscount: (val: number) => void;
  accountLimitInput: number | null;
  setAccountLimitInput: (val: number | null) => void;

  // Live status
  isLiveSimulating: boolean;
  toggleLiveSim: () => void;
  isRefreshing: boolean;
  isMarketOpen: boolean;
  checkAndUpdateMarketHours: () => void;
  refreshPrices: (isManual?: boolean) => Promise<void>;


  // Filters & Sorting
  holdingTradeTypeFilter: string;
  setHoldingTradeTypeFilter: (filter: string) => void;
  sortMode: 'createdAt' | 'pnl' | 'marketValue' | 'symbol';
  toggleSort: () => void;
  historyFilter: { startDate: string; endDate: string };
  setHistoryFilter: (filter: { startDate: string; endDate: string }) => void;

  // Forms
  holdingForm: HoldingFormState;
  setHoldingForm: (form: Partial<HoldingFormState>) => void;
  addSearchResults: StockQuote[];
  searchAddStock: (query: string) => void;
  selectAddStock: (stk: StockQuote) => Promise<void>;

  calcForm: CalcFormState;
  setCalcForm: (form: Partial<CalcFormState>) => void;
  calcQuery: string;
  setCalcQuery: (query: string) => void;
  calcSearchResults: StockQuote[];
  searchCalcStock: (query: string) => void;
  selectCalcStock: (stk: StockQuote) => Promise<void>;

  sellTarget: HoldingItem | null;
  sellForm: { price: number; shares: number; date: string };
  openSellModal: (item: HoldingItem) => void;
  confirmSell: (overridePrice?: number, overrideShares?: number, overrideDate?: string) => void;

  // Holding CRUD
  openAddModal: () => void;
  openEditModal: (item: HoldingItem) => void;
  saveHolding: () => Promise<void>;
  deleteHolding: (id: string) => void;
  splitMergedHolding: (holdingId: string) => void;
  resetCurrentAccountData: () => void;
  importDataFromJson: (parsed: any) => boolean;

  // Global Indices Persistence
  globalIndicesData: GlobalIndexQuote[];
  indicesLastUpdated: string;
  setGlobalIndicesData: (indices: GlobalIndexQuote[], timeStr?: string) => void;

  addCalcToHoldings: () => void;

  // Pin & Custom Ordering
  togglePinHolding: (id: string) => void;
  moveHoldingOrder: (id: string, direction: 'up' | 'down') => void;

  // Storage
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const todayStr = new Date().toISOString().split('T')[0];

let addSearchTicket = 0;
let calcSearchTicket = 0;

const restoreLotsToHoldings = (
  accId: string,
  symbol: string,
  name: string,
  lotsToReturn: HoldingLot[],
  tradeType?: TradeTypeOption,
  assetType?: AssetType,
  discount?: number,
  minFee?: number,
  getStore?: () => StockStore,
  setStore?: (state: Partial<StockStore> | ((state: StockStore) => Partial<StockStore>)) => void
) => {
  if (!lotsToReturn || lotsToReturn.length === 0) return;
  const holdings = { ...getStore!().holdingsData };
  if (!holdings[accId]) holdings[accId] = [];

  const totalReturnedShares = lotsToReturn.reduce((sum, l) => sum + l.shares, 0);
  if (totalReturnedShares <= 0) return;

  const existingIdx = holdings[accId].findIndex(
    h => h.symbol.toUpperCase() === symbol.toUpperCase() && 
         (!tradeType || h.tradeType === tradeType)
  );

  if (existingIdx !== -1) {
    const existing = holdings[accId][existingIdx];
    const existingLots = existing.lots && existing.lots.length > 0
      ? existing.lots
      : [{
          id: 'lot-' + existing.id,
          buyPrice: existing.buyPrice,
          shares: existing.shares,
          date: existing.date,
          tradeType: existing.tradeType
        }];

    const mergedLots = [...existingLots, ...lotsToReturn];
    const totalShares = existing.shares + totalReturnedShares;
    const totalCost = mergedLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
    const weightedPrice = parseFloat((totalCost / totalShares).toFixed(2));

    holdings[accId][existingIdx] = {
      ...existing,
      shares: totalShares,
      buyPrice: weightedPrice,
      lots: mergedLots
    };
  } else {
    const totalCost = lotsToReturn.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
    const weightedPrice = parseFloat((totalCost / totalReturnedShares).toFixed(2));
    const curPrice = getStore!().fullStockMap[symbol]?.price || weightedPrice;

    const newHolding: HoldingItem = {
      id: 'h-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      symbol,
      name,
      buyPrice: weightedPrice,
      currentPrice: curPrice,
      shares: totalReturnedShares,
      discount: discount !== undefined ? discount : getStore!().globalDiscount,
      minFee: minFee || 20,
      assetType: assetType || (symbol.startsWith('00') ? 'ETF' : '股票'),
      tradeType: tradeType || '多-現股交易',
      date: lotsToReturn[0]?.date || todayStr,
      lots: lotsToReturn
    };

    holdings[accId].unshift(newHolding);
  }

  setStore!({ holdingsData: holdings });
};

export const useStockStore = create<StockStore>((set, get) => ({
  activeTab: 'holdings',
  setActiveTab: (tab) => set({ activeTab: tab }),

  themeMode: 'dark',
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    get().saveToStorage();
  },
  toggleThemeMode: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: next });
    get().saveToStorage();
  },

  apiProvider: 'yahoo',
  setApiProvider: (provider) => {
    set({ apiProvider: provider });
    get().saveToStorage();
    get().refreshPrices(true);
  },

  holdingDisplaySettings: {
    showTickInfo: true,
    showEtfDiscount: true,
    showBreakEvenPrice: true,
    showFeeTaxDetails: true,
    showLotDetails: true
  },
  setHoldingDisplaySettings: (settings) => {
    set((state) => ({
      holdingDisplaySettings: { ...state.holdingDisplaySettings, ...settings }
    }));
    get().saveToStorage();
  },

  toastMessage: null,
  setToastMessage: (msg) => set({ toastMessage: msg }),

  showAddModal: false,
  setShowAddModal: (val) => set({ showAddModal: val }),
  isEditingHolding: false,

  showTradeTypeModal: false,
  setShowTradeTypeModal: (val) => set({ showTradeTypeModal: val }),
  tradeTypeContext: 'add',
  setTradeTypeContext: (ctx) => set({ tradeTypeContext: ctx }),

  showProfitSummaryModal: false,
  setShowProfitSummaryModal: (val) => set({ showProfitSummaryModal: val }),
  showAccountModal: false,
  setShowAccountModal: (val) => set({ showAccountModal: val }),
  showSellModal: false,
  setShowSellModal: (val) => set({ showSellModal: val }),
  showEditHistoryModal: false,
  setShowEditHistoryModal: (val) => set({ showEditHistoryModal: val }),
  editingHistoryItem: null,
  openEditHistoryModal: (item) => set({ editingHistoryItem: item, showEditHistoryModal: true }),
  updateHistoryItem: (item) => {
    const accId = get().currentAccountId;
    const history = { ...get().historyData };
    const currentList = history[accId] || [];
    const idx = currentList.findIndex(h => h.id === item.id);
    if (idx === -1) return;

    const oldItem = currentList[idx];
    const oldShares = oldItem.shares;
    const newShares = item.shares;
    const delta = oldShares - newShares;

    let finalItem: HistoryItem = { ...item };

    if (delta > 0) {
      // User reduced sold shares => return delta shares to inventory
      const oldLots: HoldingLot[] = oldItem.lots && oldItem.lots.length > 0
        ? oldItem.lots.map(l => ({ ...l }))
        : [{
            id: 'lot-' + oldItem.id,
            buyPrice: oldItem.buyPrice,
            shares: oldItem.shares,
            date: oldItem.buyDate,
            tradeType: oldItem.tradeType || '多-現股交易'
          }];

      let remSold = newShares;
      const soldLots: HoldingLot[] = [];
      const returnedLots: HoldingLot[] = [];

      for (const lot of oldLots) {
        if (remSold >= lot.shares) {
          soldLots.push({ ...lot });
          remSold -= lot.shares;
        } else if (remSold > 0) {
          soldLots.push({ ...lot, shares: remSold });
          returnedLots.push({ ...lot, shares: lot.shares - remSold });
          remSold = 0;
        } else {
          returnedLots.push({ ...lot });
        }
      }

      if (soldLots.length > 0) {
        const soldCost = soldLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
        finalItem.buyPrice = parseFloat((soldCost / newShares).toFixed(2));
        finalItem.lots = soldLots;
      } else {
        finalItem.lots = undefined;
      }

      history[accId][idx] = finalItem;
      set({ historyData: history });

      restoreLotsToHoldings(
        accId,
        oldItem.symbol,
        oldItem.name,
        returnedLots,
        oldItem.tradeType,
        oldItem.assetType,
        oldItem.discount,
        oldItem.minFee,
        get,
        set
      );

      get().saveToStorage();
      get().setToastMessage(`已更新歷史紀錄，並將退回的 ${delta} 股返還至庫存！`);
      setTimeout(() => get().setToastMessage(null), 3000);
    } else if (delta < 0) {
      // User increased sold shares => deduct extra shares from inventory if available
      const extraNeeded = Math.abs(delta);
      const holdings = { ...get().holdingsData };
      const hList = holdings[accId] || [];
      const hIdx = hList.findIndex(h => h.symbol.toUpperCase() === item.symbol.toUpperCase());

      if (hIdx !== -1) {
        const targetHolding = hList[hIdx];
        const targetLots = targetHolding.lots && targetHolding.lots.length > 0
          ? targetHolding.lots.map(l => ({ ...l }))
          : [{
              id: 'lot-' + targetHolding.id,
              buyPrice: targetHolding.buyPrice,
              shares: targetHolding.shares,
              date: targetHolding.date,
              tradeType: targetHolding.tradeType
            }];

        let remDeduct = extraNeeded;
        const extraConsumedLots: HoldingLot[] = [];
        const remHoldingLots: HoldingLot[] = [];

        for (const lot of targetLots) {
          if (remDeduct <= 0) {
            remHoldingLots.push({ ...lot });
          } else if (lot.shares <= remDeduct) {
            extraConsumedLots.push({ ...lot });
            remDeduct -= lot.shares;
          } else {
            extraConsumedLots.push({ ...lot, shares: remDeduct });
            remHoldingLots.push({ ...lot, shares: lot.shares - remDeduct });
            remDeduct = 0;
          }
        }

        const existingSoldLots = oldItem.lots && oldItem.lots.length > 0
          ? oldItem.lots
          : [{ id: 'lot-old-' + oldItem.id, buyPrice: oldItem.buyPrice, shares: oldItem.shares, date: oldItem.buyDate }];

        const allSoldLots = [...existingSoldLots, ...extraConsumedLots];
        const newSoldCost = allSoldLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
        finalItem.buyPrice = parseFloat((newSoldCost / newShares).toFixed(2));
        finalItem.lots = allSoldLots;

        if (targetHolding.shares <= extraNeeded) {
          hList.splice(hIdx, 1);
        } else {
          const remainingShares = targetHolding.shares - extraNeeded;
          const remainingCost = remHoldingLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
          targetHolding.shares = remainingShares;
          targetHolding.buyPrice = parseFloat((remainingCost / remainingShares).toFixed(2));
          targetHolding.lots = remHoldingLots;
        }

        holdings[accId] = hList;
        set({ holdingsData: holdings });
      }

      history[accId][idx] = finalItem;
      set({ historyData: history });
      get().saveToStorage();
      get().setToastMessage('已成功更新歷史交易紀錄！');
      setTimeout(() => get().setToastMessage(null), 2500);
    } else {
      history[accId][idx] = finalItem;
      set({ historyData: history });
      get().saveToStorage();
      get().setToastMessage('已成功更新歷史交易紀錄！');
      setTimeout(() => get().setToastMessage(null), 2500);
    }

    set({ showEditHistoryModal: false, editingHistoryItem: null });
  },
  deleteHistoryItem: (id) => {
    if (confirm('確定要刪除這筆歷史交易紀錄嗎？')) {
      const accId = get().currentAccountId;
      const history = { ...get().historyData };
      const currentList = history[accId] || [];
      const itemIdx = currentList.findIndex(h => h.id === id);
      if (itemIdx === -1) return;

      const item = currentList[itemIdx];

      const lotsToReturn: HoldingLot[] = item.lots && item.lots.length > 0
        ? item.lots.map(l => ({ ...l }))
        : [{
            id: 'lot-ret-' + Date.now(),
            buyPrice: item.buyPrice,
            shares: item.shares,
            date: item.buyDate,
            tradeType: item.tradeType || '多-現股交易'
          }];

      history[accId].splice(itemIdx, 1);
      set({ historyData: history });

      restoreLotsToHoldings(
        accId,
        item.symbol,
        item.name,
        lotsToReturn,
        item.tradeType,
        item.assetType,
        item.discount,
        item.minFee,
        get,
        set
      );

      get().saveToStorage();
      get().setToastMessage(`已刪除歷史紀錄，並將 ${item.shares} 股完整退回至庫存！`);
      setTimeout(() => get().setToastMessage(null), 3000);
    }
  },

  showShareModal: false,
  setShowShareModal: (val) => set({ showShareModal: val }),
  shareTargetItem: null,
  openShareModal: (item = null) => set({ shareTargetItem: item, showShareModal: true }),

  showTransferModal: false,
  setShowTransferModal: (val) => set({ showTransferModal: val }),

  deferredPrompt: null,
  canInstallPwa: false,
  setDeferredPrompt: (promptEvent) => set({ deferredPrompt: promptEvent, canInstallPwa: !!promptEvent }),
  triggerPwaInstall: async () => {
    const promptEvent = get().deferredPrompt;
    if (!promptEvent) {
      alert('請直接透過瀏覽器選單點擊「加到主畫面」或「安裝應用程式」');
      return;
    }
    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      set({ deferredPrompt: null, canInstallPwa: false });
    }
  },

  accounts: [
    { id: 'acc-1', name: '帳戶-1' },
    { id: 'acc-2', name: '帳戶-2' },
    { id: 'acc-3', name: '帳戶-3' },
    { id: 'acc-4', name: '帳戶-4' },
    { id: 'acc-5', name: '帳戶-5' },
    { id: 'acc-temp', name: '臨時帳戶' }
  ],
  currentAccountId: 'acc-1',
  setCurrentAccountId: (id) => {
    set({ currentAccountId: id, showAccountModal: false });
    get().saveToStorage();
  },
  updateAccountName: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = get().accounts.map(acc => acc.id === id ? { ...acc, name: trimmed } : acc);
    set({ accounts: updated });
    get().saveToStorage();
  },

  importShareText: (text: string) => {
    const parsedItems = parseShareText(text);
    if (parsedItems.length === 0) {
      return { success: false, count: 0, message: '未識別出有效的庫存文字，請確認格式（例如：股票代號：2330...）' };
    }

    const holdings = { ...get().holdingsData };
    if (!holdings['acc-temp']) holdings['acc-temp'] = [];

    const map = get().fullStockMap;
    let addedCount = 0;
    const nowStr = new Date().toISOString().split('T')[0];

    for (const item of parsedItems) {
      let sym = item.symbol || '';
      let nm = item.name || sym;

      if (sym && map[sym]) {
        nm = map[sym].name || nm;
      }

      const curP = item.currentPrice || map[sym]?.price || item.buyPrice || 0;

      const newItem: HoldingItem = {
        id: 'h-temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        symbol: sym,
        name: nm,
        buyPrice: item.buyPrice || curP,
        currentPrice: curP,
        shares: item.shares || 1000,
        discount: item.discount !== undefined ? item.discount : get().globalDiscount,
        assetType: sym.startsWith('00') ? 'ETF' : '股票',
        tradeType: '多-現股交易',
        date: item.date || nowStr,
        minFee: 20,
        lots: item.lots && item.lots.length > 0 ? item.lots : undefined
      };

      holdings['acc-temp'].push(newItem);
      addedCount++;
    }

    set({
      holdingsData: holdings,
      currentAccountId: 'acc-temp',
      showShareModal: false
    });

    get().saveToStorage();
    get().setToastMessage(`已將 ${addedCount} 筆庫存匯入至【臨時帳戶】！`);
    setTimeout(() => get().setToastMessage(null), 3500);

    return { success: true, count: addedCount };
  },

  transferTempHoldings: (targetAccountId: string) => {
    const holdings = { ...get().holdingsData };
    const tempItems = holdings['acc-temp'] || [];
    if (tempItems.length === 0) return;

    if (!holdings[targetAccountId]) holdings[targetAccountId] = [];

    const targetAccount = get().accounts.find(a => a.id === targetAccountId);
    const targetName = targetAccount ? targetAccount.name : targetAccountId;

    tempItems.forEach(item => {
      holdings[targetAccountId].push({
        ...item,
        id: 'h-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
      });
    });

    holdings['acc-temp'] = [];

    set({
      holdingsData: holdings,
      currentAccountId: targetAccountId,
      showTransferModal: false
    });

    get().saveToStorage();
    get().setToastMessage(`已一鍵將庫存轉存至【${targetName}】！`);
    setTimeout(() => get().setToastMessage(null), 3500);
  },

  holdingsData: {},
  historyData: {},
  fullStockMap: initialStockDictionary,
  presetStockList: [
    { code: '1101', name: '台泥', price: 23.80, change: -0.2, changePct: -0.83, type: '股票' },
    { code: '6116', name: '彩晶', price: 14.73, change: -0.2, changePct: -1.34, type: '股票' },
    { code: '2330', name: '台積電', price: 980.0, change: 15.0, changePct: 1.55, type: '股票' },
    { code: '2317', name: '鴻海', price: 205.0, change: 3.5, changePct: 1.74, type: '股票' },
    { code: '2454', name: '聯發科', price: 1240.0, change: -10.0, changePct: -0.80, type: '股票' },
    { code: '2603', name: '長榮', price: 185.5, change: 2.5, changePct: 1.37, type: '股票' },
    { code: '0050', name: '元大台灣50', price: 172.5, change: 1.2, changePct: 0.70, type: 'ETF' },
    { code: '00878', name: '國泰永續高股息', price: 22.9, change: 0.15, changePct: 0.66, type: 'ETF' },
    { code: '00631L', name: '元大台灣50正2', price: 35.30, change: 1.1, changePct: 3.22, type: 'ETF' },
    { code: '6505', name: '台塑化', price: 93.30, change: 1.5, changePct: 1.63, type: '股票' }
  ],

  globalDiscount: 0.38,
  setGlobalDiscount: (val) => {
    set({ globalDiscount: val });
    get().saveToStorage();
  },
  accountLimitInput: null,
  setAccountLimitInput: (val) => {
    set({ accountLimitInput: val });
    get().saveToStorage();
  },

  isLiveSimulating: true,
  toggleLiveSim: () => {
    const next = !get().isLiveSimulating;
    set({ isLiveSimulating: next });
    if (next) get().refreshPrices(false);
  },
  isRefreshing: false,
  isMarketOpen: false,

  checkAndUpdateMarketHours: () => {
    set({ isMarketOpen: checkTradingHours() });
  },

  refreshPrices: async (isManual = false) => {
    get().checkAndUpdateMarketHours();
    set({ isRefreshing: true });
    
    // Collect all symbol codes from holdings & preset list
    const symbolSet = new Set<string>();
    get().presetStockList.forEach(s => symbolSet.add(s.code));
    Object.values(get().holdingsData).forEach(list => {
      list.forEach(h => symbolSet.add(h.symbol));
    });

    const symbols = Array.from(symbolSet);
    const { quotes: quotesMap, sourceName } = await fetchQuotesByProvider(symbols, get().apiProvider);

    const map = get().fullStockMap;
    const updatedMap = { ...map, ...quotesMap };

    // Update preset list with exact real-time prices
    const updatedPreset = get().presetStockList.map(stk => quotesMap[stk.code.toUpperCase()] ? { ...quotesMap[stk.code.toUpperCase()] } : stk);
    
    // Update holding prices with exact real-time prices
    const holdings = { ...get().holdingsData };

    Object.keys(holdings).forEach(accId => {
      holdings[accId] = holdings[accId].map(item => {
        const key = item.symbol.trim().toUpperCase();
        const freshQuote = quotesMap[key];
        let freshP = item.currentPrice;
        let freshNav = item.nav;

        if (freshQuote && freshQuote.price > 0) {
          freshP = freshQuote.price;
        }
        if (freshQuote && freshQuote.nav && freshQuote.nav > 0) {
          freshNav = freshQuote.nav;
        }

        if ((freshP > 0 && freshP !== item.currentPrice) || (freshNav && freshNav !== item.nav)) {
          const isUp = freshP >= item.currentPrice;
          return {
            ...item,
            currentPrice: freshP,
            nav: freshNav,
            flashClass: (freshP !== item.currentPrice) ? (isUp ? 'flash-up' : 'flash-down') : ''
          };
        }
        return item;
      });
    });

    set({
      fullStockMap: updatedMap,
      presetStockList: updatedPreset,
      holdingsData: holdings,
      isRefreshing: false
    });

    if (isManual) {
      get().setToastMessage(`已從 [${sourceName}] 同步最新即時報價！`);
      setTimeout(() => { get().setToastMessage(null); }, 3000);
    }

    setTimeout(() => {
      const resetHoldings = { ...get().holdingsData };
      Object.keys(resetHoldings).forEach(accId => {
        resetHoldings[accId] = resetHoldings[accId].map(i => ({ ...i, flashClass: '' }));
      });
      set({ holdingsData: resetHoldings });
    }, 800);
  },



  holdingTradeTypeFilter: '現股交易',
  setHoldingTradeTypeFilter: (filter) => set({ holdingTradeTypeFilter: filter }),
  sortMode: 'createdAt',
  toggleSort: () => {
    const mode = get().sortMode;
    if (mode === 'createdAt') set({ sortMode: 'pnl' });
    else if (mode === 'pnl') set({ sortMode: 'marketValue' });
    else if (mode === 'marketValue') set({ sortMode: 'symbol' });
    else set({ sortMode: 'createdAt' });
  },

  togglePinHolding: (id: string) => {
    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    const list = holdings[accId] || [];
    const idx = list.findIndex(h => h.id === id);

    if (idx !== -1) {
      const nextPinned = !list[idx].pinned;
      list[idx] = { ...list[idx], pinned: nextPinned };
      set({ holdingsData: holdings });
      get().saveToStorage();

      const item = list[idx];
      get().setToastMessage(
        nextPinned
          ? `已將【${item.symbol} ${item.name}】釘選置頂！`
          : `已取消【${item.symbol} ${item.name}】釘選！`
      );
      setTimeout(() => get().setToastMessage(null), 2500);
    }
  },

  moveHoldingOrder: (id: string, direction: 'up' | 'down') => {
    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    const list = [...(holdings[accId] || [])];
    const idx = list.findIndex(h => h.id === id);

    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (targetIdx >= 0 && targetIdx < list.length) {
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;

      holdings[accId] = list;
      set({ holdingsData: holdings });
      get().saveToStorage();
    }
  },
  historyFilter: { startDate: '2026-07-01', endDate: todayStr },
  setHistoryFilter: (filter) => set({ historyFilter: filter }),

  // Holding form
  holdingForm: {
    id: '',
    symbolSearch: '',
    symbol: '',
    name: '',
    buyPrice: 0,
    currentPrice: 0,
    shares: 1000,
    discount: 0.38,
    assetType: '股票',
    tradeType: '多-現股交易',
    date: todayStr,
    minFee: 20
  },
  setHoldingForm: (form) => set((state) => ({ holdingForm: { ...state.holdingForm, ...form } })),
  addSearchResults: [],
  searchAddStock: async (query) => {
    const currentTicket = ++addSearchTicket;
    const q = query.trim().toUpperCase().replace(/\.(TW|TWO)$/i, '');
    if (!q) {
      set({ addSearchResults: [] });
      return;
    }
    const map = get().fullStockMap;
    const matches: { quote: StockQuote; score: number }[] = [];

    for (const code in map) {
      const s = map[code];
      const codeUpper = s.code.toUpperCase();
      const nameUpper = s.name.toUpperCase();
      let score = 0;

      if (codeUpper === q || nameUpper === q) score = 100;
      else if (codeUpper.startsWith(q) || nameUpper.startsWith(q)) score = 80;
      else if (codeUpper.includes(q) || nameUpper.includes(q)) score = 50;

      if (score > 0) {
        matches.push({ quote: s, score });
      }
    }

    matches.sort((a, b) => b.score - a.score || a.quote.code.localeCompare(b.quote.code));
    let results = matches.map(m => ({ ...m.quote })).slice(0, 15);

    if (currentTicket === addSearchTicket) {
      set({ addSearchResults: results });
    }

    if (results.length > 0) {
      const topCode = results[0].code;
      const liveQuote = await fetchSingleQuote(topCode);
      if (currentTicket !== addSearchTicket) return;

      if (liveQuote && liveQuote.price > 0) {
        const chineseName = (liveQuote.name && !/^[A-Za-z0-9\s.,&-]+$/.test(liveQuote.name)) ? liveQuote.name : (map[topCode]?.name || results[0].name);
        results[0] = { ...liveQuote, name: chineseName };
        set({
          addSearchResults: results,
          fullStockMap: { ...get().fullStockMap, [topCode]: results[0] }
        });
      }
    } else if (q.length >= 2) {
      const yahooQuote = await fetchSingleQuote(q);
      if (currentTicket !== addSearchTicket) return;

      if (yahooQuote && yahooQuote.price > 0) {
        const chineseName = (yahooQuote.name && !/^[A-Za-z0-9\s.,&-]+$/.test(yahooQuote.name)) ? yahooQuote.name : (map[yahooQuote.code]?.name || yahooQuote.name);
        const finalQuote = { ...yahooQuote, name: chineseName };
        results.push(finalQuote);
        set({
          addSearchResults: results,
          fullStockMap: { ...get().fullStockMap, [finalQuote.code]: finalQuote }
        });
      }
    }
  },
  selectAddStock: async (stk) => {
    const f = get().holdingForm;
    const chineseName = get().fullStockMap[stk.code]?.name || stk.name;
    const isEtf = stk.code.startsWith('00') || stk.type === 'ETF';
    const initialNav = stk.nav !== undefined ? stk.nav : get().fullStockMap[stk.code]?.nav;

    set({
      holdingForm: {
        ...f,
        symbol: stk.code,
        name: chineseName,
        symbolSearch: `${stk.code} - ${chineseName}`,
        currentPrice: stk.price > 0 ? stk.price : f.currentPrice,
        buyPrice: (!f.buyPrice || f.buyPrice === 0) ? (stk.price > 0 ? stk.price : 0) : f.buyPrice,
        assetType: isEtf ? 'ETF' : '股票',
        nav: isEtf ? (initialNav !== undefined ? initialNav : (stk.price > 0 ? stk.price : f.nav)) : undefined
      },
      addSearchResults: []
    });

    const live = await fetchSingleQuote(stk.code);
    if (live && live.price > 0) {
      const curF = get().holdingForm;
      const updatedName = (live.name && !/^[A-Za-z0-9\s.,&-]+$/.test(live.name)) ? live.name : chineseName;
      const updatedQuote = { ...live, name: updatedName };
      set({
        holdingForm: {
          ...curF,
          symbol: live.code,
          name: updatedName,
          symbolSearch: `${live.code} - ${updatedName}`,
          currentPrice: live.price,
          buyPrice: (!curF.buyPrice || curF.buyPrice === 0) ? live.price : curF.buyPrice,
          nav: isEtf ? (live.nav !== undefined ? live.nav : live.price) : undefined,
          assetType: isEtf ? 'ETF' : '股票'
        },
        fullStockMap: { ...get().fullStockMap, [live.code]: updatedQuote }
      });
    }
  },

  // Calculator Form
  calcForm: {
    buyPrice: 67.5,
    sellPrice: 70.0,
    buyShares: 1000,
    sellShares: 1000,
    discount: 0.38,
    minFee: 20,
    assetType: '股票',
    tradeType: '多-現股交易'
  },
  setCalcForm: (form) => set((state) => ({ calcForm: { ...state.calcForm, ...form } })),
  calcQuery: '',
  setCalcQuery: (query) => set({ calcQuery: query }),
  calcSearchResults: [],
  searchCalcStock: async (query) => {
    const currentTicket = ++calcSearchTicket;
    const q = query.trim().toUpperCase();
    if (!q) {
      set({ calcSearchResults: [] });
      return;
    }
    const map = get().fullStockMap;
    const matches: { quote: StockQuote; score: number }[] = [];

    for (const code in map) {
      const s = map[code];
      const codeUpper = s.code.toUpperCase();
      const nameUpper = s.name.toUpperCase();
      let score = 0;

      if (codeUpper === q || nameUpper === q) score = 100;
      else if (codeUpper.startsWith(q) || nameUpper.startsWith(q)) score = 80;
      else if (codeUpper.includes(q) || nameUpper.includes(q)) score = 50;

      if (score > 0) {
        matches.push({ quote: s, score });
      }
    }

    matches.sort((a, b) => b.score - a.score || a.quote.code.localeCompare(b.quote.code));
    let results = matches.map(m => ({ ...m.quote })).slice(0, 15);

    if (currentTicket === calcSearchTicket) {
      set({ calcSearchResults: results });
    }

    if (results.length > 0) {
      const topCode = results[0].code;
      const liveQuote = await fetchSingleQuote(topCode);
      if (currentTicket !== calcSearchTicket) return;

      if (liveQuote && liveQuote.price > 0) {
        const chineseName = map[topCode]?.name || results[0].name || liveQuote.name;
        results[0] = { ...liveQuote, name: chineseName };
        set({
          calcSearchResults: results,
          fullStockMap: { ...get().fullStockMap, [topCode]: results[0] }
        });
      }
    } else if (q.length >= 2) {
      const yahooQuote = await fetchSingleQuote(q);
      if (currentTicket !== calcSearchTicket) return;

      if (yahooQuote && yahooQuote.price > 0) {
        const chineseName = map[yahooQuote.code]?.name || yahooQuote.name;
        const finalQuote = { ...yahooQuote, name: chineseName };
        results.push(finalQuote);
        set({
          calcSearchResults: results,
          fullStockMap: { ...get().fullStockMap, [finalQuote.code]: finalQuote }
        });
      }
    }
  },
  selectCalcStock: async (stk) => {
    set((state) => ({
      calcQuery: `${stk.code} - ${stk.name}`,
      calcForm: {
        ...state.calcForm,
        buyPrice: stk.price,
        sellPrice: +(stk.price * 1.03).toFixed(2),
        assetType: stk.type || (stk.code.startsWith('00') ? 'ETF' : '股票')
      },
      calcSearchResults: []
    }));

    const live = await fetchSingleQuote(stk.code);
    if (live && live.price > 0) {
      set((state) => ({
        calcForm: {
          ...state.calcForm,
          buyPrice: live.price,
          sellPrice: +(live.price * 1.03).toFixed(2)
        },
        fullStockMap: { ...get().fullStockMap, [stk.code]: live }
      }));
    }
  },

  globalIndicesData: initialGlobalIndices,
  indicesLastUpdated: '',
  setGlobalIndicesData: (indices, timeStr) => {
    const lastTime = timeStr || new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    set({ globalIndicesData: indices, indicesLastUpdated: lastTime });
    get().saveToStorage();
  },

  addCalcToHoldings: () => {
    const { calcForm, calcQuery, fullStockMap, currentAccountId, holdingsData, globalDiscount, setToastMessage, saveToStorage } = get();
    
    let inputRaw = (calcQuery || '').trim().toUpperCase();
    let symbol = '';
    let name = '';

    if (inputRaw) {
      const cleanRaw = inputRaw.replace(/\s*-\s*.*/, '').trim();
      if (fullStockMap[cleanRaw]) {
        symbol = fullStockMap[cleanRaw].code;
        name = fullStockMap[cleanRaw].name;
      } else {
        const match = Object.values(fullStockMap).find(
          s => s.code.toUpperCase() === cleanRaw || s.name.toUpperCase() === cleanRaw
        );
        if (match) {
          symbol = match.code;
          name = match.name;
        } else {
          symbol = cleanRaw;
          name = cleanRaw;
        }
      }
    }

    if (!symbol) {
      set({
        isEditingHolding: false,
        holdingForm: {
          id: '',
          symbolSearch: '',
          symbol: '',
          name: '',
          buyPrice: calcForm.buyPrice,
          currentPrice: calcForm.buyPrice,
          shares: calcForm.buyShares,
          discount: calcForm.discount,
          assetType: calcForm.assetType,
          tradeType: calcForm.tradeType,
          date: todayStr,
          minFee: calcForm.minFee
        },
        showAddModal: true
      });
      setToastMessage('已打開新增庫存視窗，請填寫股票標的');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    const buyPrice = calcForm.buyPrice || 0;
    const shares = calcForm.buyShares || 1000;
    const discount = calcForm.discount !== undefined ? calcForm.discount : globalDiscount;
    const minFee = calcForm.minFee !== undefined ? calcForm.minFee : 20;
    const assetType = calcForm.assetType || '股票';
    const tradeType = calcForm.tradeType || '多-現股交易';
    const curPrice = buyPrice;

    const holdings = { ...get().holdingsData };
    if (!holdings[currentAccountId]) holdings[currentAccountId] = [];

    const defaultLot: HoldingLot = {
      id: 'lot-' + Date.now(),
      buyPrice,
      shares,
      date: todayStr,
      tradeType
    };

    const itemToSave: HoldingItem = {
      id: 'h-' + Date.now(),
      symbol,
      name,
      buyPrice,
      currentPrice: curPrice,
      shares,
      discount,
      minFee,
      assetType,
      tradeType,
      date: todayStr,
      lots: [defaultLot]
    };

    holdings[currentAccountId].push(itemToSave);

    set({ holdingsData: holdings });
    saveToStorage();
    setToastMessage(`已成功將試算標的【${symbol} ${name}】轉為新增庫存！`);
    setTimeout(() => setToastMessage(null), 3000);
  },

  sellTarget: null,
  sellForm: { price: 0, shares: 0, date: todayStr },
  openSellModal: (item) => {
    set({
      sellTarget: item,
      sellForm: { price: item.currentPrice, shares: item.shares, date: todayStr },
      showSellModal: true
    });
  },
  confirmSell: (overridePrice?: number, overrideShares?: number, overrideDate?: string) => {
    const target = get().sellTarget;
    if (!target) return;
    const accId = get().currentAccountId;
    const p = overridePrice !== undefined ? overridePrice : get().sellForm.price;
    let s = overrideShares !== undefined ? overrideShares : get().sellForm.shares;
    const sellDate = overrideDate || get().sellForm.date || todayStr;

    if (s <= 0 || p <= 0) {
      alert('請輸入有效的賣出價格與股數');
      return;
    }

    if (s > target.shares) {
      s = target.shares;
    }

    const targetLots: HoldingLot[] = target.lots && target.lots.length > 0
      ? target.lots.map(l => ({ ...l }))
      : [{
          id: 'lot-' + target.id,
          buyPrice: target.buyPrice,
          shares: target.shares,
          date: target.date,
          tradeType: target.tradeType
        }];

    let remainingSellShares = s;
    const consumedLots: HoldingLot[] = [];
    const remainingLots: HoldingLot[] = [];

    for (const lot of targetLots) {
      if (remainingSellShares <= 0) {
        remainingLots.push({ ...lot });
      } else if (lot.shares <= remainingSellShares) {
        consumedLots.push({ ...lot });
        remainingSellShares -= lot.shares;
      } else {
        consumedLots.push({
          ...lot,
          shares: remainingSellShares
        });
        remainingLots.push({
          ...lot,
          shares: lot.shares - remainingSellShares
        });
        remainingSellShares = 0;
      }
    }

    const totalConsumedCost = consumedLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
    const avgSoldBuyPrice = s > 0 ? parseFloat((totalConsumedCost / s).toFixed(2)) : target.buyPrice;

    const itemDisc = target.discount !== undefined ? target.discount : get().globalDiscount;

    const buyFee = calcTradeDetails(avgSoldBuyPrice, s, itemDisc, target.minFee || 20, true, target.assetType, target.tradeType, get().globalDiscount).fee;
    const buyCost = (avgSoldBuyPrice * s) + buyFee;

    const sellDetails = calcTradeDetails(p, s, itemDisc, target.minFee || 20, false, target.assetType, target.tradeType, get().globalDiscount);
    const proceeds = (p * s) - sellDetails.fee - sellDetails.tax;
    const realizedPnl = proceeds - buyCost;
    const returnPct = buyCost > 0 ? (realizedPnl / buyCost) * 100 : 0;

    const buyDateStr = consumedLots.length > 0
      ? (consumedLots.length === 1 
          ? consumedLots[0].date 
          : `${consumedLots.reduce((min, l) => l.date < min ? l.date : min, consumedLots[0].date)} ~ ${consumedLots.reduce((max, l) => l.date > max ? l.date : max, consumedLots[0].date)}`)
      : target.date;

    const history = { ...get().historyData };
    if (!history[accId]) history[accId] = [];

    const newHistoryItem: HistoryItem = {
      id: 'his-' + Date.now(),
      symbol: target.symbol,
      name: target.name,
      buyPrice: avgSoldBuyPrice,
      sellPrice: p,
      shares: s,
      realizedPnl: Math.round(realizedPnl),
      returnPct: parseFloat(returnPct.toFixed(2)),
      buyDate: buyDateStr,
      sellDate: sellDate,
      tradeType: target.tradeType,
      assetType: target.assetType,
      discount: target.discount,
      minFee: target.minFee,
      lots: consumedLots
    };

    history[accId].unshift(newHistoryItem);

    const holdings = { ...get().holdingsData };
    const list = holdings[accId] || [];
    const idx = list.findIndex(h => h.id === target.id);
    if (idx !== -1) {
      if (list[idx].shares <= s) {
        list.splice(idx, 1);
      } else {
        const newShares = list[idx].shares - s;
        const newAvgBuyPrice = remainingLots.length > 0
          ? parseFloat((remainingLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0) / newShares).toFixed(2))
          : list[idx].buyPrice;

        list[idx] = {
          ...list[idx],
          shares: newShares,
          buyPrice: newAvgBuyPrice,
          lots: remainingLots
        };
      }
    }

    set({
      historyData: history,
      holdingsData: holdings,
      showSellModal: false,
      sellTarget: null
    });
    get().saveToStorage();
    get().setToastMessage(`已成功平倉賣出【${target.symbol} ${target.name}】 ${s} 股！`);
    setTimeout(() => get().setToastMessage(null), 3000);
  },

  openAddModal: () => {
    set({
      isEditingHolding: false,
      addSearchResults: [],
      holdingForm: {
        id: '',
        symbolSearch: '',
        symbol: '',
        name: '',
        buyPrice: 0,
        currentPrice: 0,
        shares: 1000,
        discount: get().globalDiscount,
        assetType: '股票',
        tradeType: '多-現股交易',
        date: todayStr,
        minFee: 20
      },
      showAddModal: true
    });
  },

  openEditModal: (item) => {
    set({
      isEditingHolding: true,
      addSearchResults: [],
      holdingForm: {
        ...item,
        discount: item.discount !== undefined ? item.discount : get().globalDiscount,
        assetType: item.assetType || '股票',
        tradeType: item.tradeType || '多-現股交易',
        minFee: item.minFee || 20,
        symbolSearch: `${item.symbol} - ${item.name}`
      },
      showAddModal: true
    });
  },

  saveHolding: async () => {
    const f = get().holdingForm;
    const inputRaw = (f.symbolSearch || f.symbol || '').trim().toUpperCase();
    if (!inputRaw) return;

    let symbol = f.symbol ? f.symbol.trim().toUpperCase() : '';
    let name = f.name ? f.name.trim() : '';
    let curPrice = f.currentPrice;
    let buyPrice = f.buyPrice;

    const map = get().fullStockMap;

    // Strict symbol/name resolution to prevent substring matching bugs (e.g. 台塑 matching 台塑化)
    if (symbol && map[symbol]) {
      name = map[symbol].name || name || symbol;
    } else {
      const cleanRaw = inputRaw.replace(/\s*-\s*.*/, '').trim();
      const exactFound = Object.values(map).find(s => 
        s.code.toUpperCase() === cleanRaw || 
        s.name.toUpperCase() === cleanRaw ||
        s.code.toUpperCase() === inputRaw ||
        s.name.toUpperCase() === inputRaw
      );

      if (exactFound) {
        symbol = exactFound.code;
        name = exactFound.name;
      } else {
        symbol = cleanRaw || inputRaw;
        name = cleanRaw || inputRaw;
      }
    }

    // Always fetch live real-time price
    const targetCode = symbol || inputRaw;
    const liveQuote = await fetchSingleQuote(targetCode);

    if (liveQuote && liveQuote.price > 0) {
      symbol = liveQuote.code;
      name = liveQuote.name || name;
      curPrice = liveQuote.price;
      if (!buyPrice || buyPrice === 0) buyPrice = liveQuote.price;
      set({ fullStockMap: { ...get().fullStockMap, [symbol]: liveQuote } });
    } else if (map[symbol] && map[symbol].price > 0) {
      if (!curPrice || curPrice === 0) curPrice = map[symbol].price;
      if (!buyPrice || buyPrice === 0) buyPrice = map[symbol].price;
    }

    if (!buyPrice && curPrice) buyPrice = curPrice;
    if (!curPrice && buyPrice) curPrice = buyPrice;

    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    if (!holdings[accId]) holdings[accId] = [];

    // Duplicate stock detection in active account
    const existingIdx = holdings[accId].findIndex(
      h => h.symbol.toUpperCase() === symbol.toUpperCase() && 
           h.tradeType === f.tradeType && 
           (!get().isEditingHolding || h.id !== f.id)
    );

    if (existingIdx !== -1 && !get().isEditingHolding) {
      const existingItem = holdings[accId][existingIdx];
      const confirmMerge = window.confirm(
        `檢測到目前帳戶已持有相同的股票筆記！\n\n【${symbol} - ${name} (${f.tradeType})】\n` +
        `• 現有持股：${existingItem.shares} 股 @ $${existingItem.buyPrice}\n` +
        `• 新增持股：${f.shares} 股 @ $${buyPrice || 0}\n\n` +
        `【確定】: 自動計算加權平均成本並【合併計算】（保留各筆購買日期細節，可隨時拆回）\n` +
        `【取消】: 保持分開，保存為獨立庫存筆記`
      );

      if (confirmMerge) {
        const existingLots: HoldingLot[] = existingItem.lots && existingItem.lots.length > 0
          ? existingItem.lots
          : [{
              id: 'lot-' + existingItem.id,
              buyPrice: existingItem.buyPrice,
              shares: existingItem.shares,
              date: existingItem.date,
              tradeType: existingItem.tradeType
            }];

        const newLot: HoldingLot = {
          id: 'lot-' + Date.now(),
          buyPrice: buyPrice || 0,
          shares: f.shares,
          date: f.date,
          tradeType: f.tradeType
        };

        const mergedLots = [...existingLots, newLot];
        const totalShares = mergedLots.reduce((sum, l) => sum + l.shares, 0);
        const totalCostSum = mergedLots.reduce((sum, l) => sum + (l.buyPrice * l.shares), 0);
        const weightedBuyPrice = totalShares > 0 ? parseFloat((totalCostSum / totalShares).toFixed(2)) : (buyPrice || 0);

        const mergedItem: HoldingItem = {
          ...existingItem,
          symbol,
          name,
          buyPrice: weightedBuyPrice,
          currentPrice: curPrice || existingItem.currentPrice,
          shares: totalShares,
          lots: mergedLots
        };

        holdings[accId][existingIdx] = mergedItem;
        set({ holdingsData: holdings, showAddModal: false });
        get().saveToStorage();
        get().setToastMessage(`已成功將庫存合併！加權平均價：$${weightedBuyPrice}`);
        setTimeout(() => get().setToastMessage(null), 3000);
        return;
      }
    }

    const defaultLot: HoldingLot = {
      id: 'lot-' + (f.id || Date.now()),
      buyPrice: buyPrice || 0,
      shares: f.shares,
      date: f.date,
      tradeType: f.tradeType
    };

    const isEtfType = f.assetType === 'ETF' || symbol.startsWith('00');
    const computedNav = f.nav !== undefined && f.nav > 0 
      ? f.nav 
      : (map[symbol]?.nav || (curPrice || buyPrice || 0));

    const itemToSave: HoldingItem = {
      ...f,
      symbol,
      name,
      buyPrice: buyPrice || 0,
      currentPrice: curPrice || 0,
      assetType: isEtfType ? 'ETF' : '股票',
      nav: isEtfType ? computedNav : undefined,
      lots: f.lots || [defaultLot]
    };

    if (get().isEditingHolding) {
      const idx = holdings[accId].findIndex(h => h.id === f.id);
      if (idx !== -1) holdings[accId][idx] = itemToSave;
    } else {
      holdings[accId].push({
        ...itemToSave,
        id: 'h-' + Date.now()
      });
    }

    set({ holdingsData: holdings, showAddModal: false });
    get().saveToStorage();
  },

  deleteHolding: (id) => {
    if (confirm('確定要刪除此筆庫存紀錄嗎？')) {
      const accId = get().currentAccountId;
      const holdings = { ...get().holdingsData };
      if (holdings[accId]) {
        holdings[accId] = holdings[accId].filter(h => h.id !== id);
        set({ holdingsData: holdings });
        get().saveToStorage();
      }
    }
  },

  splitMergedHolding: (holdingId) => {
    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    const list = holdings[accId] || [];
    const idx = list.findIndex(h => h.id === holdingId);

    if (idx === -1) return;
    const item = list[idx];
    if (!item.lots || item.lots.length <= 1) return;

    if (confirm(`確定要將【${item.symbol} - ${item.name}】合併筆記拆回成 ${item.lots.length} 筆獨立庫存紀錄嗎？`)) {
      list.splice(idx, 1);

      item.lots.forEach((lot, i) => {
        list.splice(idx + i, 0, {
          id: 'h-split-' + Date.now() + '-' + i,
          symbol: item.symbol,
          name: item.name,
          buyPrice: lot.buyPrice,
          currentPrice: item.currentPrice,
          shares: lot.shares,
          discount: item.discount,
          minFee: item.minFee,
          assetType: item.assetType,
          tradeType: lot.tradeType || item.tradeType,
          date: lot.date,
          nav: item.nav,
          lots: [lot]
        });
      });

      holdings[accId] = list;
      set({ holdingsData: holdings });
      get().saveToStorage();
      get().setToastMessage(`已成功將庫存拆回成 ${item.lots.length} 筆獨立紀錄！`);
      setTimeout(() => get().setToastMessage(null), 3000);
    }
  },

  resetCurrentAccountData: () => {
    if (confirm('確定要清除目前的庫存與歷史交易資料嗎？')) {
      const accId = get().currentAccountId;
      const holdings = { ...get().holdingsData };
      const history = { ...get().historyData };
      holdings[accId] = [];
      history[accId] = [];
      set({ holdingsData: holdings, historyData: history });
      get().saveToStorage();
    }
  },

  importDataFromJson: (parsed) => {
    try {
      const holdings = parsed.holdings || {};
      const history = parsed.history || {};
      let accounts: Account[] = parsed.accounts && Array.isArray(parsed.accounts) ? parsed.accounts : get().accounts;
      if (!accounts.some(a => a.id === 'acc-temp')) {
        accounts.push({ id: 'acc-temp', name: '臨時帳戶' });
      }
      const discount = parsed.discount !== undefined ? parsed.discount : get().globalDiscount;
      const limit = parsed.limit !== undefined ? parsed.limit : get().accountLimitInput;
      const theme = parsed.themeMode || 'dark';
      const provider = parsed.apiProvider || 'yahoo';
      set({
        accounts,
        holdingsData: holdings,
        historyData: history,
        globalDiscount: discount,
        accountLimitInput: limit,
        themeMode: theme,
        apiProvider: provider
      });
      get().saveToStorage();
      return true;
    } catch (e) {
      return false;
    }
  },

  loadFromStorage: () => {
    // Background preload full TWSE/TPEx stock dictionary (~2000+ stocks & ETFs with Chinese names)
    fetchTwseOpenApiQuotes().then((openApiMap: Record<string, StockQuote> | null) => {
      if (openApiMap) {
        set(state => ({
          fullStockMap: { ...state.fullStockMap, ...openApiMap }
        }));
      }
    }).catch(() => {});

    const saved = localStorage.getItem('tw_stock_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let loadedAccounts: Account[] = parsed.accounts || get().accounts;
        if (!loadedAccounts.some(a => a.id === 'acc-temp')) {
          loadedAccounts.push({ id: 'acc-temp', name: '臨時帳戶' });
        }
        set({
          accounts: loadedAccounts,
          holdingsData: parsed.holdings || {},
          historyData: parsed.history || {},
          globalDiscount: parsed.discount !== undefined ? parsed.discount : 0.38,
          accountLimitInput: parsed.limit || null,
          themeMode: parsed.themeMode || 'dark',
          apiProvider: parsed.apiProvider || 'yahoo',
          holdingDisplaySettings: parsed.holdingDisplaySettings ? {
            showTickInfo: true,
            showEtfDiscount: true,
            showBreakEvenPrice: true,
            showFeeTaxDetails: true,
            showLotDetails: true,
            ...parsed.holdingDisplaySettings
          } : {
            showTickInfo: true,
            showEtfDiscount: true,
            showBreakEvenPrice: true,
            showFeeTaxDetails: true,
            showLotDetails: true
          },
          globalIndicesData: parsed.indices && parsed.indices.length > 0 ? parsed.indices : initialGlobalIndices,
          indicesLastUpdated: parsed.indicesLastUpdated || ''
        });
        return;
      } catch (e) {
        // Fallback to default mock
      }
    }
    // Default initial mock matching user's real-time screenshot
    set({
      themeMode: 'dark',
      apiProvider: 'yahoo',
      globalIndicesData: initialGlobalIndices,
      indicesLastUpdated: '',
      holdingDisplaySettings: {
        showTickInfo: true,
        showEtfDiscount: true,
        showBreakEvenPrice: true,
        showFeeTaxDetails: true,
        showLotDetails: true
      },
      holdingsData: {
        'acc-1': [
          {
            id: 'h-1101',
            symbol: '1101',
            name: '台泥',
            buyPrice: 24.25,
            currentPrice: 23.80,
            shares: 5000,
            discount: 0.38,
            minFee: 20,
            assetType: '股票',
            tradeType: '多-現股交易',
            date: '2026-06-11'
          },
          {
            id: 'h-6116',
            symbol: '6116',
            name: '彩晶',
            buyPrice: 19.50,
            currentPrice: 14.73,
            shares: 1000,
            discount: 0.38,
            minFee: 20,
            assetType: '股票',
            tradeType: '多-現股交易',
            date: '2026-06-29'
          }
        ]
      },
      historyData: {
        'acc-1': [
          {
            id: 'his-1',
            symbol: '00405A',
            name: '主動富邦台灣龍耀',
            buyPrice: 9.20,
            sellPrice: 8.39,
            shares: 3000,
            realizedPnl: -2495,
            returnPct: -9.03,
            buyDate: '2026-06-12',
            sellDate: '2026-07-23'
          },
          {
            id: 'his-2',
            symbol: '00631L',
            name: '元大台灣50正2',
            buyPrice: 32.24,
            sellPrice: 35.30,
            shares: 5000,
            realizedPnl: 14979,
            returnPct: 9.29,
            buyDate: '2026-07-20',
            sellDate: '2026-07-23'
          }
        ]
      }
    });
  },

  saveToStorage: () => {
    localStorage.setItem('tw_stock_app_data', JSON.stringify({
      holdings: get().holdingsData,
      history: get().historyData,
      accounts: get().accounts,
      discount: get().globalDiscount,
      limit: get().accountLimitInput,
      themeMode: get().themeMode,
      apiProvider: get().apiProvider,
      holdingDisplaySettings: get().holdingDisplaySettings,
      indices: get().globalIndicesData,
      indicesLastUpdated: get().indicesLastUpdated
    }));
  }

}));
