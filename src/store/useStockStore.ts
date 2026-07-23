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
import { checkTradingHours, fetchTwseOpenApiQuotes } from '../services/twseApi';

const defaultStockDictionary: Record<string, StockQuote> = {
  '1101': { code: '1101', name: '台泥', price: 23.85, change: -0.5, changePct: -2.05, type: '股票' },
  '6116': { code: '6116', name: '彩晶', price: 14.75, change: -0.2, changePct: -1.34, type: '股票' },
  '2330': { code: '2330', name: '台積電', price: 980.0, change: 15.0, changePct: 1.55, type: '股票' },
  '2317': { code: '2317', name: '鴻海', price: 205.0, change: 3.5, changePct: 1.74, type: '股票' },
  '2454': { code: '2454', name: '聯發科', price: 1240.0, change: -10.0, changePct: -0.80, type: '股票' },
  '2603': { code: '2603', name: '長榮', price: 185.5, change: 2.5, changePct: 1.37, type: '股票' },
  '2609': { code: '2609', name: '陽明', price: 62.3, change: 0.8, changePct: 1.30, type: '股票' },
  '2618': { code: '2618', name: '長榮航', price: 36.8, change: 0.3, changePct: 0.82, type: '股票' },
  '2303': { code: '2303', name: '聯電', price: 53.2, change: 0.4, changePct: 0.76, type: '股票' },
  '2881': { code: '2881', name: '富邦金', price: 88.5, change: 1.2, changePct: 1.37, type: '股票' },
  '2882': { code: '2882', name: '國泰金', price: 63.8, change: 0.6, changePct: 0.95, type: '股票' },
  '2891': { code: '2891', name: '中信金', price: 37.4, change: 0.2, changePct: 0.54, type: '股票' },
  '3008': { code: '3008', name: '大立光', price: 2750.0, change: -25.0, changePct: -0.90, type: '股票' },
  '2382': { code: '2382', name: '廣達', price: 290.0, change: 4.0, changePct: 1.40, type: '股票' },
  '3231': { code: '3231', name: '緯創', price: 105.5, change: 1.5, changePct: 1.44, type: '股票' },
  '2412': { code: '2412', name: '中華電', price: 121.5, change: 0.5, changePct: 0.41, type: '股票' },
  '00403A': { code: '00403A', name: '主動統一升級50', price: 10.00, change: 0, changePct: 0, type: 'ETF' },
  '00405A': { code: '00405A', name: '主動富邦台灣龍耀', price: 8.39, change: -0.1, changePct: -1.18, type: 'ETF' },
  '0050': { code: '0050', name: '元大台灣50', price: 172.5, change: 1.2, changePct: 0.70, type: 'ETF' },
  '0056': { code: '0056', name: '元大高股息', price: 38.6, change: 0.2, changePct: 0.52, type: 'ETF' },
  '00713': { code: '00713', name: '元大台灣高息低波', price: 57.5, change: 0.3, changePct: 0.52, type: 'ETF' },
  '00878': { code: '00878', name: '國泰永續高股息', price: 22.9, change: 0.15, changePct: 0.66, type: 'ETF' },
  '00918': { code: '00918', name: '大華優利高股息30', price: 24.1, change: 0.1, changePct: 0.42, type: 'ETF' },
  '00919': { code: '00919', name: '群益台灣精選高息', price: 25.4, change: 0.1, changePct: 0.40, type: 'ETF' },
  '00922': { code: '00922', name: '國泰台灣領袖50', price: 21.8, change: 0.2, changePct: 0.93, type: 'ETF' },
  '00929': { code: '00929', name: '復華台灣科技優息', price: 19.8, change: 0.08, changePct: 0.41, type: 'ETF' },
  '00939': { code: '00939', name: '統一台灣高息動能', price: 14.8, change: 0.05, changePct: 0.34, type: 'ETF' },
  '00940': { code: '00940', name: '元大台灣價值高息', price: 9.75, change: 0.03, changePct: 0.31, type: 'ETF' },
  '00941': { code: '00941', name: '中信上游半導體', price: 15.2, change: 0.1, changePct: 0.66, type: 'ETF' },
  '00631L': { code: '00631L', name: '元大台灣50正2', price: 35.30, change: 1.1, changePct: 3.22, type: 'ETF' },
  '00679B': { code: '00679B', name: '元大美債20年', price: 30.5, change: 0.1, changePct: 0.33, type: 'ETF' },
  '00687B': { code: '00687B', name: '國泰20年美債', price: 31.2, change: 0.1, changePct: 0.32, type: 'ETF' },
  '6505': { code: '6505', name: '台塑化', price: 93.30, change: 1.5, changePct: 1.63, type: '股票' },
  '1301': { code: '1301', name: '台塑', price: 68.00, change: 0.8, changePct: 1.19, type: '股票' }
};

interface StockStore {
  // Navigation & Modals
  activeTab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings';
  setActiveTab: (tab: 'holdings' | 'calculator' | 'history' | 'market' | 'settings') => void;

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
  fullStockMap: defaultStockDictionary,
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
    
    const quotesMap = await fetchTwseOpenApiQuotes();
    if (quotesMap) {
      const updatedMap = { ...get().fullStockMap, ...quotesMap };
      const updatedPreset = get().presetStockList.map(stk => quotesMap[stk.code] ? { ...quotesMap[stk.code] } : stk);
      
      // Update holding prices & flash animations
      const holdings = { ...get().holdingsData };
      Object.keys(holdings).forEach(accId => {
        holdings[accId] = holdings[accId].map(item => {
          if (quotesMap[item.symbol]) {
            const freshP = quotesMap[item.symbol].price;
            if (freshP !== item.currentPrice) {
              const isUp = freshP >= item.currentPrice;
              return {
                ...item,
                currentPrice: freshP,
                flashClass: isUp ? 'flash-up' : 'flash-down'
              };
            }
          }
          return item;
        });
      });

      set({
        fullStockMap: updatedMap,
        presetStockList: updatedPreset,
        holdingsData: holdings
      });

      setTimeout(() => {
        const resetHoldings = { ...get().holdingsData };
        Object.keys(resetHoldings).forEach(accId => {
          resetHoldings[accId] = resetHoldings[accId].map(i => ({ ...i, flashClass: '' }));
        });
        set({ holdingsData: resetHoldings });
      }, 800);
    }

    setTimeout(() => { set({ isRefreshing: false }); }, 400);
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
  searchAddStock: (query) => {
    const q = query.trim().toUpperCase();
    if (!q) {
      set({ addSearchResults: [] });
      return;
    }
    const map = get().fullStockMap;
    const matches: StockQuote[] = [];
    let exactMatch = false;

    for (const code in map) {
      const s = map[code];
      const codeUpper = s.code.toUpperCase();
      const nameUpper = s.name.toUpperCase();
      if (codeUpper.includes(q) || nameUpper.includes(q)) {
        matches.push(s);
        if (codeUpper === q || nameUpper === q) exactMatch = true;
        if (matches.length >= 20) break;
      }
    }

    // 如果沒有精準匹配，且輸入長度 >= 2，自動插入一個供快速點擊自訂帶入的選項
    if (!exactMatch && q.length >= 2) {
      matches.unshift({
        code: q,
        name: q,
        price: 0,
        change: 0,
        changePct: 0,
        type: q.startsWith('00') ? 'ETF' : '股票'
      });
    }

    set({ addSearchResults: matches });
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
        buyPrice: (!f.buyPrice || f.buyPrice === 0) ? stk.price : f.buyPrice,
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
  searchCalcStock: (query) => {
    const q = query.trim().toUpperCase();
    if (!q) {
      set({ calcSearchResults: [] });
      return;
    }
    const map = get().fullStockMap;
    const matches: StockQuote[] = [];
    let exactMatch = false;

    for (const code in map) {
      const s = map[code];
      const codeUpper = s.code.toUpperCase();
      const nameUpper = s.name.toUpperCase();
      if (codeUpper.includes(q) || nameUpper.includes(q)) {
        matches.push(s);
        if (codeUpper === q || nameUpper === q) exactMatch = true;
        if (matches.length >= 20) break;
      }
    }

    if (!exactMatch && q.length >= 2) {
      matches.unshift({
        code: q,
        name: q,
        price: 0,
        change: 0,
        changePct: 0,
        type: q.startsWith('00') ? 'ETF' : '股票'
      });
    }

    set({ calcSearchResults: matches });
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
    const inputRaw = (f.symbolSearch || '').trim();
    let symbol = f.symbol;
    let name = f.name;
    let curPrice = f.currentPrice;
    let buyPrice = f.buyPrice;

    if (!symbol || !inputRaw.includes(symbol)) {
      if (inputRaw) {
        const map = get().fullStockMap;
        const matched = map[inputRaw] || Object.values(map).find(s => s.code === inputRaw || s.name === inputRaw);
        if (matched) {
          symbol = matched.code;
          name = matched.name;
          if (!curPrice) curPrice = matched.price;
          if (!buyPrice) buyPrice = matched.price;
        } else {
          symbol = inputRaw;
          name = inputRaw;
        }
      } else {
        return;
      }
    }

    const accId = get().currentAccountId;
    const holdings = { ...get().holdingsData };
    if (!holdings[accId]) holdings[accId] = [];

    const itemToSave: HoldingItem = {
      ...f,
      symbol,
      name,
      buyPrice,
      currentPrice: curPrice
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
      set({
        holdingsData: holdings,
        historyData: history,
        globalDiscount: discount,
        accountLimitInput: limit
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
          accountLimitInput: parsed.limit || null
        });
        return;
      } catch (e) {
        // Fallback to default mock
      }
    }
    // Default initial mock matching screenshot
    set({
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
      limit: get().accountLimitInput
    }));
  }
}));
