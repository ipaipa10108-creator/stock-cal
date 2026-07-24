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
  ComputedHolding
} from '../types/stock';
import { calcTradeDetails } from '../utils/stockMath';
import { checkTradingHours, fetchTwseOpenApiQuotes, fetchSingleYahooQuote } from '../services/twseApi';
import { initialStockDictionary } from '../db/stockDictionary';

interface StockStore {
  // Navigation & Modals
  activeTab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings';
  setActiveTab: (tab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings') => void;

  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  toggleThemeMode: () => void;

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

  // PWA Installation
  deferredPrompt: any;
  canInstallPwa: boolean;
  setDeferredPrompt: (promptEvent: any) => void;
  triggerPwaInstall: () => Promise<void>;

  // Accounts & Data
  accounts: Account[];
  currentAccountId: string;
  setCurrentAccountId: (id: string) => void;

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
  refreshPrices: () => Promise<void>;

  // Filters & Sorting
  holdingTradeTypeFilter: string;
  setHoldingTradeTypeFilter: (filter: string) => void;
  sortMode: 'pnl' | 'marketValue' | 'symbol';
  toggleSort: () => void;
  historyFilter: { startDate: string; endDate: string };
  setHistoryFilter: (filter: { startDate: string; endDate: string }) => void;

  // Forms
  holdingForm: HoldingFormState;
  setHoldingForm: (form: Partial<HoldingFormState>) => void;
  addSearchResults: StockQuote[];
  searchAddStock: (query: string) => void;
  selectAddStock: (stk: StockQuote) => void;

  calcForm: CalcFormState;
  setCalcForm: (form: Partial<CalcFormState>) => void;
  calcQuery: string;
  setCalcQuery: (query: string) => void;
  calcSearchResults: StockQuote[];
  searchCalcStock: (query: string) => void;
  selectCalcStock: (stk: StockQuote) => void;

  sellTarget: HoldingItem | null;
  sellForm: { price: number; shares: number; date: string };
  openSellModal: (item: HoldingItem) => void;
  confirmSell: () => void;

  // Holding CRUD
  openAddModal: () => void;
  openEditModal: (item: HoldingItem) => void;
  saveHolding: () => void;
  deleteHolding: (id: string) => void;
  resetCurrentAccountData: () => void;
  importDataFromJson: (parsed: any) => boolean;

  // Storage
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const todayStr = new Date().toISOString().split('T')[0];

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
    { id: 'acc-5', name: '帳戶-5' }
  ],
  currentAccountId: 'acc-1',
  setCurrentAccountId: (id) => {
    set({ currentAccountId: id, showAccountModal: false });
    get().saveToStorage();
  },

  holdingsData: {},
  historyData: {},
  fullStockMap: initialStockDictionary,
  presetStockList: [
    { code: '1101', name: '台泥', price: 23.85, change: -0.5, changePct: -2.05, type: '股票' },
    { code: '6116', name: '彩晶', price: 14.75, change: -0.2, changePct: -1.34, type: '股票' },
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
    if (next) get().refreshPrices();
  },
  isRefreshing: false,
  isMarketOpen: false,

  checkAndUpdateMarketHours: () => {
    set({ isMarketOpen: checkTradingHours() });
  },

  refreshPrices: async () => {
    get().checkAndUpdateMarketHours();
    set({ isRefreshing: true });
    
    let quotesMap = await fetchTwseOpenApiQuotes();
    if (!quotesMap) quotesMap = {};

    // Check holdings to see if any holding symbols need a single quote fetch
    const currentHoldings = get().holdingsData;
    const missingSymbols = new Set<string>();
    Object.values(currentHoldings).forEach(list => {
      list.forEach(h => {
        if (!quotesMap![h.symbol]) missingSymbols.add(h.symbol);
      });
    });

    for (const sym of Array.from(missingSymbols)) {
      const q = await fetchSingleYahooQuote(sym);
      if (q) quotesMap[sym] = q;
    }

    const map = get().fullStockMap;
    const updatedMap = { ...map, ...quotesMap };

    // Update preset list
    const updatedPreset = get().presetStockList.map(stk => quotesMap![stk.code] ? { ...quotesMap![stk.code] } : stk);
    
    // Update holding prices & flash animations
    const holdings = { ...get().holdingsData };
    let hasUpdatedAny = false;

    Object.keys(holdings).forEach(accId => {
      holdings[accId] = holdings[accId].map(item => {
        let freshP = item.currentPrice;
        
        if (quotesMap![item.symbol]) {
          freshP = quotesMap![item.symbol].price;
        } else if (get().isLiveSimulating) {
          // Simulated minor fluctuation when offline / after market
          const pct = (Math.random() - 0.48) * 0.008; // -0.4% ~ +0.4%
          const delta = +(item.currentPrice * pct).toFixed(2);
          freshP = +(item.currentPrice + delta).toFixed(2);
        }

        if (freshP > 0 && freshP !== item.currentPrice) {
          hasUpdatedAny = true;
          const isUp = freshP >= item.currentPrice;
          return {
            ...item,
            currentPrice: freshP,
            flashClass: isUp ? 'flash-up' : 'flash-down'
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

    get().setToastMessage(hasUpdatedAny ? '已手動同步最新股票連動價格！' : '即時價位已為最新數據');
    setTimeout(() => { get().setToastMessage(null); }, 2500);

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
  sortMode: 'pnl',
  toggleSort: () => {
    const mode = get().sortMode;
    if (mode === 'pnl') set({ sortMode: 'marketValue' });
    else if (mode === 'marketValue') set({ sortMode: 'symbol' });
    else set({ sortMode: 'pnl' });
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
    const q = query.trim().toUpperCase();
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
    let results = matches.map(m => m.quote).slice(0, 20);

    if (results.length === 0 && q.length >= 2) {
      const yahooQuote = await fetchSingleYahooQuote(q);
      if (yahooQuote) {
        results.push(yahooQuote);
        set({ fullStockMap: { ...get().fullStockMap, [yahooQuote.code]: yahooQuote } });
      } else {
        results.unshift({
          code: q,
          name: q,
          price: 0,
          change: 0,
          changePct: 0,
          type: q.startsWith('00') ? 'ETF' : '股票'
        });
      }
    }

    set({ addSearchResults: results });
  },
  selectAddStock: (stk) => {
    const f = get().holdingForm;
    set({
      holdingForm: {
        ...f,
        symbol: stk.code,
        name: stk.name,
        symbolSearch: `${stk.code} - ${stk.name}`,
        currentPrice: stk.price > 0 ? stk.price : f.currentPrice,
        buyPrice: (!f.buyPrice || f.buyPrice === 0) ? (stk.price > 0 ? stk.price : 0) : f.buyPrice,
        assetType: stk.type || (stk.code.startsWith('00') ? 'ETF' : '股票')
      },
      addSearchResults: []
    });
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
    let results = matches.map(m => m.quote).slice(0, 20);

    if (results.length === 0 && q.length >= 2) {
      const yahooQuote = await fetchSingleYahooQuote(q);
      if (yahooQuote) {
        results.push(yahooQuote);
        set({ fullStockMap: { ...get().fullStockMap, [yahooQuote.code]: yahooQuote } });
      }
    }

    set({ calcSearchResults: results });
  },
  selectCalcStock: (stk) => {
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
  confirmSell: () => {
    const target = get().sellTarget;
    if (!target) return;
    const accId = get().currentAccountId;
    const s = get().sellForm.shares;
    const p = get().sellForm.price;
    const itemDisc = target.discount !== undefined ? target.discount : get().globalDiscount;

    const buyFee = calcTradeDetails(target.buyPrice, s, itemDisc, target.minFee || 20, true, target.assetType, target.tradeType, get().globalDiscount).fee;
    const buyCost = (target.buyPrice * s) + buyFee;

    const sellDetails = calcTradeDetails(p, s, itemDisc, target.minFee || 20, false, target.assetType, target.tradeType, get().globalDiscount);
    const proceeds = (p * s) - sellDetails.fee - sellDetails.tax;
    const realizedPnl = proceeds - buyCost;
    const returnPct = buyCost > 0 ? (realizedPnl / buyCost) * 100 : 0;

    const history = { ...get().historyData };
    if (!history[accId]) history[accId] = [];
    history[accId].unshift({
      id: 'his-' + Date.now(),
      symbol: target.symbol,
      name: target.name,
      buyPrice: target.buyPrice,
      sellPrice: p,
      shares: s,
      realizedPnl,
      returnPct,
      buyDate: target.date,
      sellDate: get().sellForm.date
    });

    const holdings = { ...get().holdingsData };
    const list = holdings[accId] || [];
    const idx = list.findIndex(h => h.id === target.id);
    if (idx !== -1) {
      if (list[idx].shares <= s) {
        list.splice(idx, 1);
      } else {
        list[idx].shares -= s;
      }
    }

    set({
      historyData: history,
      holdingsData: holdings,
      showSellModal: false,
      sellTarget: null
    });
    get().saveToStorage();
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

  saveHolding: () => {
    const f = get().holdingForm;
    const inputRaw = (f.symbolSearch || '').trim().toUpperCase();
    let symbol = f.symbol;
    let name = f.name;
    let curPrice = f.currentPrice;
    let buyPrice = f.buyPrice;

    const map = get().fullStockMap;

    // Resolve stock symbol & name from search or input if not directly selected
    if (!symbol || !inputRaw.includes(symbol.toUpperCase())) {
      if (inputRaw) {
        const found = Object.values(map).find(s => 
          s.code.toUpperCase() === inputRaw || 
          s.name.toUpperCase() === inputRaw ||
          s.code.toUpperCase().includes(inputRaw) ||
          s.name.toUpperCase().includes(inputRaw)
        );

        if (found) {
          symbol = found.code;
          name = found.name;
          if (!curPrice || curPrice === 0) curPrice = found.price;
          if (!buyPrice || buyPrice === 0) buyPrice = found.price;
        } else {
          symbol = inputRaw;
          name = inputRaw;
        }
      } else {
        return;
      }
    }

    if (!buyPrice && curPrice) buyPrice = curPrice;
    if (!curPrice && buyPrice) curPrice = buyPrice;

    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    if (!holdings[accId]) holdings[accId] = [];

    const itemToSave: HoldingItem = {
      ...f,
      symbol,
      name,
      buyPrice: buyPrice || 0,
      currentPrice: curPrice || 0,
      assetType: f.assetType || (symbol.startsWith('00') ? 'ETF' : '股票')
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
      const discount = parsed.discount !== undefined ? parsed.discount : get().globalDiscount;
      const limit = parsed.limit !== undefined ? parsed.limit : get().accountLimitInput;
      const theme = parsed.themeMode || 'dark';
      set({
        holdingsData: holdings,
        historyData: history,
        globalDiscount: discount,
        accountLimitInput: limit,
        themeMode: theme
      });
      get().saveToStorage();
      return true;
    } catch (e) {
      return false;
    }
  },

  loadFromStorage: () => {
    const saved = localStorage.getItem('tw_stock_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        set({
          holdingsData: parsed.holdings || {},
          historyData: parsed.history || {},
          globalDiscount: parsed.discount !== undefined ? parsed.discount : 0.38,
          accountLimitInput: parsed.limit || null,
          themeMode: parsed.themeMode || 'dark'
        });
        return;
      } catch (e) {
        // Fallback to default mock
      }
    }
    // Default initial mock matching screenshot
    set({
      themeMode: 'dark',
      holdingsData: {
        'acc-1': [
          {
            id: 'h-1101',
            symbol: '1101',
            name: '台泥',
            buyPrice: 24.25,
            currentPrice: 23.85,
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
            currentPrice: 14.75,
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
      discount: get().globalDiscount,
      limit: get().accountLimitInput,
      themeMode: get().themeMode
    }));
  }
}));
