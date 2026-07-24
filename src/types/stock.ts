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
}

export interface ComputedHolding extends HoldingItem {
  buyCost: number;
  estProceeds: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  nav?: number;
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
}

