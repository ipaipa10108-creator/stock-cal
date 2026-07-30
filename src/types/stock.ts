export type AssetType = '股票' | 'ETF';

export type ApiProvider = 'yahoo' | 'twse_mis' | 'twse_openapi' | 'auto';

export type TradeTypeOption = 
  | '多-現股交易'
  | '多-資買券賣'
  | '空-券賣資買'
  | '多-資買資賣'
  | '空-券賣券買'
  | '多-現股當沖'
  | '空-現股當沖';

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  type?: AssetType;
  nav?: number;
}

export interface HoldingActivityLog {
  id: string;
  timestamp: string;
  date: string;
  action: 'sell' | 'restore' | 'split' | 'unsplit' | 'edit_lot' | 'add_lot';
  shares: number;
  price: number;
  avgBuyPrice?: number;
  note?: string;
}

export interface HoldingLot {
  id: string;
  buyPrice: number;
  shares: number;
  date: string;
  tradeType?: TradeTypeOption;
  discount?: number;
  minFee?: number;
}

export interface HoldingItem {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  currentPrice: number;
  shares: number;
  discount?: number;
  minFee?: number;
  assetType?: AssetType;
  tradeType?: TradeTypeOption;
  date: string;
  flashClass?: string;
  nav?: number;
  lots?: HoldingLot[];
  pinned?: boolean;
  orderIndex?: number;
  activityLogs?: HoldingActivityLog[];
}

export interface ComputedHolding extends HoldingItem {
  buyCost: number;
  estProceeds: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  nav?: number;
  pinned?: boolean;
  orderIndex?: number;
  activityLogs?: HoldingActivityLog[];
}

export interface HistoryItem {
  id: string;
  symbol: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  shares: number;
  realizedPnl: number;
  returnPct: number;
  buyDate: string;
  sellDate: string;
  tradeType?: TradeTypeOption;
  assetType?: AssetType;
  discount?: number;
  minFee?: number;
  lots?: HoldingLot[];
  activityLogs?: HoldingActivityLog[];
}

export interface Account {
  id: string;
  name: string;
}

export interface CalcFormState {
  buyPrice: number;
  sellPrice: number;
  buyShares: number;
  sellShares: number;
  discount: number;
  minFee: number;
  assetType: AssetType;
  tradeType: TradeTypeOption;
}

export interface HoldingFormState {
  id: string;
  symbolSearch: string;
  symbol: string;
  name: string;
  buyPrice: number;
  currentPrice: number;
  shares: number;
  discount: number;
  assetType: AssetType;
  tradeType: TradeTypeOption;
  date: string;
  minFee: number;
  nav?: number;
  lots?: HoldingLot[];
  pinned?: boolean;
  orderIndex?: number;
}

export interface HoldingDisplaySettings {
  showTickInfo: boolean;          // 價差幾檔資訊 (距離保本/獲利檔位數)
  showEtfDiscount: boolean;       // ETF 折溢價資訊 (預估淨值與折溢價差額)
  showBreakEvenPrice: boolean;    // 保本價 (保本參考價格)
  showFeeTaxDetails: boolean;     // 預估交易費用 (賣出手續費與證交稅)
  showLotDetails: boolean;        // 合併筆記明細 (批次買進明細)
}
