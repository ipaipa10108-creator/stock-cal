# 台股即時庫存與交易計算系統 (Taiwan Stock Calculator)

> 專為台股投資人與高頻交易者設計的**極速、隱私、高效率**本機即時庫存與成交試算系統。採用 **Vite + React (TypeScript) + Zustand + Dexie.js (IndexedDB) + Tailwind CSS** 現代化架構開發，支援 **PWA 獨立桌面程式安裝** 與 **GitHub Actions 自動化部署**。

---

## 🌟 最新功能與修改更新說明 (Release Updates)

### 1. 💼 帳戶 1-5 自訂名稱編輯 (Custom Account Names)
- **自訂證券戶名稱**：帳戶 1-5 與臨時帳戶名稱可由使用者自行編輯（例如可將「帳戶-1」自訂為「元大證券」、「國泰證券」或「富邦證券」），方便辨識真實證券庫存。
- **內聯編輯與持久化**：在「切換與管理帳戶」彈窗中提供鉛筆按鈕即時修改，名稱自動持久化儲存於 `localStorage` 並支援 JSON 備份檔匯入匯出。

### 2. 📲 庫存文字分享、匯入與「臨時帳戶」一鍵轉存 (Share & Import Holdings Text)
- **標準格式文字分享**：支援指定單一股票或全部庫存一鍵導出標準文字版格式（包含股票/ETF名稱、代號、買價、股數、手續折扣與購買時間），支援一鍵複製與手機系統原生分享。
- **文字解析與匯入**：收到分享文字的使用者只需在 App 中貼上文字，系統自動智慧解析各欄位並寫入專屬【臨時帳戶】。
- **一鍵轉存個人帳戶**：處於【臨時帳戶】時提供顯眼提示橫幅與轉存彈窗，讓使用者可一鍵決定將臨時庫存轉存歸冊至指定個人帳戶（帳戶 1-5）。

### 3. 🎓 主題圖卡式「教學」分頁指南 (Interactive Guide & Theme Cards)
- **獨立教學分頁**：底部導覽列新增 **「教學」** 標籤，收錄三大主題圖卡：
  - **1. 交易類型全解析**：說明現股交易、現股當沖（享證交稅減半 0.15%）、信用當沖（資買券賣/券賣資買）與跨日平倉（資買資賣/券賣券買）之運作邏輯與稅費計算。
  - **2. Stock-Cal 軟體操作教學**：當天當沖試算、當沖未平倉轉留倉設定、文字分享與轉存完整步驟。
  - **3. 券商實務與營業員溝通指南**：當沖與信用戶開通條件、券商 APP 盤後自動對沖規則，並內建「當沖失敗改留倉」、「申請調降折扣」、「確認資券對沖」之**一鍵複製營業員話術卡片**。
- **彈窗快捷連結**：在交易類型選擇彈窗（`TradeTypeModal`）下方新增快捷鈕，點擊可直達教學頁面。

### 4. 📈 台股檔位 (Tick Size) 距離保本/賺錢檔位直觀顯化 (Ticks Position Badge)
- **6 階升降單位精密計算**：依據台股官方檔位表（<10元: 0.01、10~50元: 0.05、50~100元: 0.10、100~500元: 0.50、500~1000元: 1.00、>=1000元: 5.00）跨區間計算。
- **持股位置一目了然**：負報酬顯示「距離保本打平還差上漲 X 檔 (保本價 $YY.YY)」，正報酬顯示「目前已經賺了 X 檔」，讓投資人直觀掌握持股位階。

### 5. 📊 ETF 當下價位折溢價全流程連動顯化 (Live ETF Premium/Discount)
- **新增時即時帶入與預覽**：選擇/搜尋 ETF 時自動帶入當下最新市價與預估淨值 (NAV)，並在彈窗中即時預覽折/溢價點數與金額。
- **庫存隨市價連動顯化**：在庫存卡牌隨即時現價連動計算並顯示當下價位之單股折溢價金額、百分比與持股相當折溢總金額。

### 6. 🌐 全球國際指數持久化與智慧更新加速 (Global Market Indices & Speedup)
- **指數紀錄本機持久化**：國際指數數據 (`globalIndicesData`) 與最後更新時間標籤會持久化儲存於 `localStorage`，關閉 App 或重新整理頁面後仍保留最後讀取的真實指數與時間，不再重置回舊預設值。
- **智慧更新讀取加速**：優化 Yahoo API 代理請求機制，加入 2.5 秒 `AbortController` 請求逾時控管與 Proxy 競速備援，解決以往智慧更新過慢的問題。

### 7. 🇺🇸 美股四大指數盤中狀態標籤修正 (US Market Hours Fix)
- **精準開盤狀態判斷**：重構開盤狀態判斷邏輯，除了 API `marketState` 與交易區間欄位外，加入美股時區 (`America/New_York`) 時間計算備援（台灣時間美股夏令 21:30 - 04:00 / 冬令 22:30 - 05:00），解決台灣時間晚上 11 點美股盤中誤顯示為「盤後」的問題。

### 8. ➕ 成交試算一鍵轉為新增庫存 (One-Click Convert Trial to Holding)
- **快速轉換試算筆記**：成交試算分頁新增 **【一鍵轉為新增庫存】** 按鈕，點擊後自動提取當前試算設定之標的代號/名稱、買價、股數、折扣、低限與交易類型，直接匯入目前選擇的帳戶庫存中並提示 Toast 訊息。

### 9. 📲 PWA 裝置桌面程式化 (Desktop & Mobile PWA App)
- **獨立 App 視窗體驗**：支援 Windows / Mac 桌面圖示與 iOS / Android 手機主畫面安裝。
- **一鍵觸發安裝**：介面頂部與設定頁新增「📲 安裝 App」按鈕，點擊即可直接喚起瀏覽器原生安裝提示。
- **離線快取支援**：配置 `sw.js` (Service Worker)，斷網狀態下亦可開啟應用程式存取本機庫存。

### 5. 📊 ETF 基金淨值 (NAV) 與折溢價金額換算
- **即時折溢價試算**：新增/編輯 ETF 持股時填寫估計淨值 (NAV)，自動計算每股折溢價點數 (如 `+$0.50`) 與百分比 (`+0.29%`)。
- **持股折溢價金額換算**：依據持股數量，自動換算全持股相當於多付或省下多少新台幣元（如 `持股溢價總額 +$2,500 元`）。
- **專屬顏色徽章**：庫存卡牌項目以亮紅（溢價）與翡翠綠（折價）顯示提示區塊。

### 6. 🔍 主動型 ETF (`00403A` / `00405A`) 與全上櫃標的對接
- **雙重 API 報價對接**：同時對接 `TWSE` 證交所與 `TPEx` 櫃買中心公開 API，實時抓取上櫃股票與主動型 ETF 價格。
- **預載與模糊比對**：預載包含 `00403A` (主動統一升級50)、`00405A` (主動富邦台灣龍耀) 等熱門主動型 ETF，支援不分大小寫比對（如輸入 `00403a`）。
- **保底自訂新增**：輸入任意新掛牌或特殊代號，自動提供「點擊手動填價」選項，100% 無阻礙帶入。

### 7. 🔗 點擊股票代號跳轉 Yahoo 股市 (Yahoo Finance)
- **一鍵查 K 線與即時走勢**：點擊庫存卡牌標題或觀察清單旁的外連圖示 <i class="fa-solid fa-arrow-up-right-from-square"></i>，自動於新分頁開啟 Yahoo 股市對應行情頁面（如 `https://tw.stock.yahoo.com/quote/00403A.TW`）。

### 8. 🤖 GitHub Actions 自動化 CI/CD 部署 (修復 404 / 空白網頁)
- **自動化 Build & Deploy**：內建 `.github/workflows/deploy.yml`。推送程式碼至 `main` 分支時，GitHub Actions 會自動完成 `npm run build` 並部署至 GitHub Pages，徹底避免舊版純靜態伺服器讀取未編譯 `.tsx` 導致的 404 與空白網頁問題。

---

## ⚡ 核心基礎特色

### 1. 交易時間動態判定與實時行情連動
- **交易時段智慧判定**：台北時間 Mon-Fri 09:00 - 13:30 (`🟢 連動中 (盤中)`) 每 15 秒連動最新現價；非交易時段 (`🟡 連動中 (盤後價)`) 顯示最新盤後真實收盤價。
- **紅漲綠跌閃爍動畫**：現價跳動時自動發送台灣股市規範之紅漲（`flash-up`）與綠跌（`flash-down`）閃爍動畫。

### 2. 7 種台股標準交易類型與 0 折手續費試算
- 支援 **多-現股交易**、**多-資買券賣**、**空-券賣資買**、**多-資買資賣**、**空-券賣券買**、**多-現股當沖**、**空-現股當沖**。
- 精準計算手續費（支援 0 折免手續費與低限金額）、證交稅（股票 0.3%, ETF 0.1%, 當沖 0.15%）、做多做空損益與打平保本價。

### 3. 100% 本機數據隱私與 JSON 備份還原
- **零伺服器傳輸**：採用 Dexie.js (IndexedDB) 儲存於使用者本機瀏覽器中，資料完全個人掌控。
- **JSON 備份與還原**：支援完整庫存、歷史紀錄與券商折數一鍵匯出 JSON 備份檔與還原。

---

## 🛠️ 技術棧 (Tech Stack)

- **前端框架**：React 18 (TypeScript)
- **構建工具**：Vite 5
- **狀態管理**：Zustand 4 (Atomic 輕量狀態訂閱，60fps 不卡頓)
- **本機資料庫**：Dexie.js 4 (IndexedDB) + LocalStorage (快取與指數持久化)
- **UI 與 CSS**：Tailwind CSS 3 + FontAwesome 6 Icons
- **PWA 支援**：Web App Manifest + Service Worker (`sw.js`)
- **數據源**：TWSE 證交所 / TPEx 櫃買中心 OpenAPI + Yahoo Finance API

---

## 📁 專案結構 (Directory Structure)

```text
stock-cal/
├── index.html                  # Vite 主入口點 (PWA 設定)
├── package.json                # 專案依賴與 Build/Deploy 腳本
├── vite.config.ts              # Vite 構建設定
├── tailwind.config.js          # Tailwind 樣式設定
├── tsconfig.json               # TypeScript 設定
├── public/
│   ├── favicon.svg             # PWA 高畫質向量 Icon
│   ├── manifest.json           # Web App Manifest
│   └── sw.js                   # Service Worker 離線快取
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署工作流
├── src/
│   ├── types/
│   │   └── stock.ts            # 股票、NAV與交易類別型別定義
│   ├── utils/
│   │   ├── stockMath.ts        # 交易計算、手續費、折溢價純函數
│   │   └── shareUtils.ts       # 庫存文字格式化與智慧解析純函數
│   ├── services/
│   │   ├── twseApi.ts          # TWSE/TPEx OpenAPI 雙數據源對接
│   │   └── marketIndices.ts    # 國際四大指數與即時/盤後狀態抓取
│   ├── db/
│   │   ├── stockDb.ts          # Dexie.js IndexedDB 本機資料庫
│   │   └── stockDictionary.ts  # 台股與主動型 ETF 字典庫
│   ├── store/
│   │   └── useStockStore.ts    # Zustand 全域狀態、指數持久化與 PWA Prompt
│   ├── components/
│   │   ├── Header.tsx          # 頂部帳戶切換與 PWA 安裝鈕
│   │   ├── HoldingsTab.tsx     # 庫存管理與 ETF 折溢價卡片
│   │   ├── CalculatorTab.tsx   # 即時成交試算與一鍵轉庫存
│   │   ├── HistoryTab.tsx      # 歷史平倉紀錄與勝率
│   │   ├── MarketTab.tsx       # 熱門觀察清單與國際指數速覽
│   │   ├── GuideTab.tsx        # 交易類型與營業員溝通主題圖卡教學
│   │   ├── SettingsTab.tsx     # 折數設定、PWA 安裝與 JSON 備份
│   │   └── modals/
│   │       ├── AddHoldingModal.tsx    # 新增庫存 (z-50)
│   │       ├── TradeTypeModal.tsx     # 交易類型選單 (z-[60])
│   │       ├── ProfitSummaryModal.tsx # 獲利試算彈窗
│   │       ├── SellModal.tsx          # 平倉賣出彈窗
│   │       ├── EditHistoryModal.tsx   # 編輯歷史交易紀錄彈窗
│   │       ├── AccountModal.tsx       # 帳戶切換與名稱自訂彈窗
│   │       ├── ShareModal.tsx         # 庫存文字分享與匯入彈窗
│   │       └── TransferTempModal.tsx  # 臨時帳戶庫存一鍵轉存彈窗
│   ├── App.tsx                 # 主應用組件與 SW 註冊
│   ├── main.tsx                # 入口檔案
│   └── index.css               # 全域 CSS 與閃爍動畫
└── README.md
```

---

## 🚀 快速開始與部署 (Quick Start & Deployment)

### 1. 本地開發 (Local Development)

```bash
# 安裝依賴套件
npm install

# 啟動開發伺服器 (Vite Dev Server)
npm run dev
```

### 2. GitHub Pages 自動化部署 (Automated Deploy)

只需將修改推送到 GitHub 儲存庫：

```bash
git add .
git commit -m "feat: Synchronize README with latest global indices persistence and calc-to-holding features"
git push origin main
```

> **注意**：請確保 GitHub 專案庫 **Settings** ➔ **Pages** ➔ **Source** 選項設定為 **`GitHub Actions`**。推送到分支後，GitHub Actions 會自動執行建置與部署。

---

## 📜 授權條款 (License)

MIT License. 歡迎自由改寫與個人使用！
