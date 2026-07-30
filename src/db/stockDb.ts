import Dexie, { Table } from 'dexie';
import { HoldingItem, HistoryItem, Account, HoldingDisplaySettings, ApiProvider } from '../types/stock';

export interface AppSetting {
  key: string;
  value: any;
}

export class StockDatabase extends Dexie {
  holdings!: Table<HoldingItem & { accountId: string }>;
  history!: Table<HistoryItem & { accountId: string }>;
  settings!: Table<AppSetting>;

  constructor() {
    super('TwStockAppDB');
    this.version(1).stores({
      holdings: 'id, accountId, symbol, date',
      history: 'id, accountId, symbol, sellDate',
      settings: 'key'
    });
  }
}

export const db = new StockDatabase();

export const exportAppDataAsJson = async (
  holdingsData: Record<string, HoldingItem[]>,
  historyData: Record<string, HistoryItem[]>,
  globalDiscount: number,
  accountLimitInput: number | null,
  accounts?: Account[],
  themeMode?: 'dark' | 'light',
  apiProvider?: ApiProvider,
  holdingDisplaySettings?: HoldingDisplaySettings,
  currentAccountId?: string
): Promise<string> => {
  const data = {
    version: '2.0',
    exportTime: new Date().toISOString(),
    holdings: holdingsData,
    history: historyData,
    accounts: accounts,
    discount: globalDiscount,
    limit: accountLimitInput,
    themeMode,
    apiProvider,
    holdingDisplaySettings,
    currentAccountId
  };
  return JSON.stringify(data, null, 2);
};
