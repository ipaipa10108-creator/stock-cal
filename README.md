# 台股即時庫存與交易計算系統 (Taiwan Stock Calculator)

> 專為台股投資人與高頻交易者設計的**極速、隱私、高效率**本機即時庫存與成交試算系統。採用 **Vite + React (TypeScript) + Zustand + Dexie.js (IndexedDB) + Tailwind CSS** 現代化架構開發。

---

## 🌟 核心特色與功能亮點

### 1. ⚡ 交易時間動態判定與 TWSE/TPEx 公開 API 行情連動
- **交易時段智慧判定**：自動判斷台北時間 (Mon-Fri 09:00 - 13:30)。
  - **盤中連動 (`🟢 連動中 (盤中)`)**：每 15 秒實時對接證交所 (TWSE) 與櫃買中心 (TPEx) 公開 API 更新現價與漲跌。
  - **盤後/假日 (`🟡 連動中 (盤後價)`)**：自動載入當日最新真實盤後收盤價，停止頻繁請求節省網路流量。
- **價格視覺閃爍動畫**：現價變動時自動觸發台灣股市規範之紅漲（`flash-up`）與綠跌（`flash-down`）閃爍動畫。

### 2. 🔍 全台股與主動/被動型 ETF 即時過濾搜尋
- **全台股與熱門 ETF 資料庫**：支援搜尋代號（如 `2330`、`2603`、`00878`）或名稱（如 `台積電`、`長榮`）。
- **完整支援主動型 ETF**：包含 `00403A` (主動統一升級50)、`00405A` (主動富邦台灣龍耀) 等最新主動型 ETF。
- **手動價位自由修改**：搜尋點擊帶入報價後，買進價與現價仍保持完全可手動輸入與調整。
- **自訂標的保底機制**：輸入任意尚未掛牌或特殊代號皆可快速新增點選。

### 3. 📊 ETF 基金淨值 (NAV) 與折溢價金額換算
- **折溢價點數試算**：輸入估計淨值 (NAV) 即時計算每股折溢價差額 (`+$0.50`) 與百分比 (`+0.29%`)。
- **持股折溢價金額換算**：自動依據持股張數/股數，換算全持股相當於多付或省下多少新台幣元（例如：`持股溢價總額 +$2,500 元`）。
- **專屬顏色徽章**：庫存卡牌上以亮紅 (溢價) 與翡翠綠 (折價) 標示。

### 4. 🔗 點擊股票代號連至 Yahoo 股市 (Yahoo Finance)
- **一鍵跳轉查 K 線**：點擊庫存卡牌、歷史紀錄或熱門觀察清單之股票代號，自動開啟新分頁連至 Yahoo 股市行情頁面 (`https://tw.stock.yahoo.com/quote/SYMBOL.TW`)。

### 5. 🧮 7 種台股標準交易類型與 0 折手續費試算
- 支援 **多-現股交易**、**多-資買券賣**、**空-券賣資買**、**多-資買資賣**、**空-券賣券買**、**多-現股當沖**、**空-現股當沖**。
- 精準計算手續費（支援 0 折免手續費與低限金額）、證交稅（股票 0.3%, ETF 0.1%, 當沖 0.15%）、做多做空損益與打平保本價。

### 6. 🔒 100% 本機數據隱私與 JSON 備份還原
- **零伺服器傳輸**：採用 Dexie.js (IndexedDB) 儲存於使用者本機瀏覽器中，資料完全個人掌控。
- **JSON 備份與還原**：支援完整庫存、歷史紀錄與券商折數一鍵匯出 JSON 備份檔與極速還原。

---

## 🛠️ 技術棧 (Tech Stack)

- **前端框架**：React 18 (TypeScript)
- **構建工具**：Vite 5
- **狀態管理**：Zustand 4 (Atomic 輕量狀態訂閱，60fps 不卡頓)
- **本機資料庫**：Dexie.js 4 (IndexedDB)
- **UI 與 CSS**：Tailwind CSS 3 + FontAwesome 6 Icons
- **數據源**：TWSE 台灣證券交易所與 TPEx 櫃買中心 OpenAPI

---

## 📁 專案結構 (Directory Structure)

```text
stock-cal/
├── index.html                  # Vite 主入口點
├── package.json                # 專案依賴與腳本
├── vite.config.ts              # Vite 構建設定
├── tailwind.config.js          # Tailwind 樣式設定
├── tsconfig.json               # TypeScript 設定
├── src/
│   ├── types/
│   │   └── stock.ts            # 股票、帳戶與表單型別定義
│   ├── utils/
│   │   └── stockMath.ts        # 交易計算、手續費、折溢價純函數
│   ├── services/
│   │   └── twseApi.ts          # TWSE/TPEx OpenAPI 與交易時間判定
│   ├── db/
│   │   └── stockDb.ts          # Dexie.js IndexedDB 本機資料庫
│   ├── store/
│   │   └── useStockStore.ts    # Zustand 全域狀態庫
│   ├── components/
│   │   ├── Header.tsx          # 頂部帳戶切換與總市值卡片
│   │   ├── HoldingsTab.tsx     # 庫存管理與折溢價卡片
│   │   ├── CalculatorTab.tsx   # 成交試算
│   │   ├── HistoryTab.tsx      # 歷史平倉紀錄與勝率
│   │   ├── MarketTab.tsx       # 熱門觀察清單
│   │   ├── SettingsTab.tsx     # 折數設定與 JSON 備份還原
│   │   └── modals/
│   │       ├── AddHoldingModal.tsx    # 新增庫存 (z-50)
│   │       ├── TradeTypeModal.tsx     # 交易類型選擇對話框 (z-[60])
│   │       ├── ProfitSummaryModal.tsx # 獲利試算彈窗
│   │       ├── SellModal.tsx          # 平倉賣出彈窗
│   │       └── AccountModal.tsx       # 帳戶切換彈窗
│   ├── App.tsx                 # 主應用組件
│   ├── main.tsx                # 入口檔案
│   └── index.css               # 全域 CSS 與閃爍動畫
└── README.md
```

---

## 🚀 快速開始 (Quick Start)

### 本地開發 (Local Development)

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器 (Vite Dev Server)
npm run dev
```

### 打包構建與 GitHub Pages 靜態部署

```bash
# 編譯打包靜態資源
npm run build
```

打包產出之 `dist/` 目錄包含 100% 純靜態資源（HTML/JS/CSS），可直接部署至 GitHub Pages 免費託管。

---

## 📜 授權條款 (License)

MIT License. 歡迎自由改寫與個人使用！
