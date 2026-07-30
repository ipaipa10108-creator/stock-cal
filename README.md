# 台股即時庫存與交易計算系統 (Taiwan Stock Calculator)

> 專為台股投資人與高頻交易者設計的**極速、隱私、高效率**本機即時庫存與成交試算系統。採用 **Vite + React (TypeScript) + Zustand + Dexie.js (IndexedDB) + Tailwind CSS** 現代化架構開發，支援 **PWA 獨立桌面程式安裝**、**Windows 視窗與 iPad 平板滿版適配** 與 **GitHub Actions 自動化部署**。

---

## 🌟 最新功能與修改更新說明 (Release Updates)

### 1. 📱 Windows PC 桌面與 iPad 平板滿版適配 (Full-Width Windows & iPad UI)
- **澈底消除兩側黑邊**：打破原先僅適用手機的固定寬度限制，在 Windows 瀏覽器與 iPad 平板視窗上自動擴展為 **100% 全寬滿版橫幅 (`w-full max-w-full lg:max-w-7xl`)**，並與動態主題背景色完美整合。
- **多欄 Split-View 與響應式網格**：
  - **成交試算 (CalculatorTab)**：iPad 與桌機開啓 2 欄 Split-View 佈局（左側搜尋與輸入表單、右側即時分析結果）。
  - **庫存與歷史 (HoldingsTab / HistoryTab)**：開啟 2/3 欄動態卡片網格 (`sm:grid-cols-2 lg:grid-cols-3`)。
  - **頂部儀表板 (Header)**：數據卡片自動展延為 5 欄網格看板（總市值、總成本、未實現損益、庫存檔數、當前帳戶）。

### 2. 🎨 交易類型特色色彩與顯眼卡牌註記 (Trade Type Visual Badges & Annotations)
- **特色醒目標籤**：
  - **現股當沖** `(現股當沖)`：亮琥珀金/橘黃標籤與金色微光邊框 (`bg-amber-500 text-slate-950 font-black`)，讓當沖標的於庫存中極其顯眼。
  - **現股交易** `(現股買進)`：標準寶藍色標籤。
  - **信用交易**：紫/靛/綠/青等專屬特色標籤 (`(資買資賣)`, `(資買券賣)`, `(券買券買)`, `(券賣資買)`)。
- 庫存卡片標題列直觀展示交易類型註記與主題亮色，便於快速辨識當前交易屬性。

### 3. ✏️ 合併筆記長按/點擊修改個別紀錄 (Edit Lot Modal)
- **個別買賣紀錄修改**：合併庫存卡片明細中，支援點擊、長按或點擊 `✏️ 修改` 按鈕，喚起專屬 `EditLotModal` 對話框。
- **動態重算**：可自由修改該筆紀錄之買進/賣出單價、股數與日期，儲存後系統自動重新計算淨持股數與加權平均成本。

### 4. ↩️ 拆回獨立筆記之「復原拆分」 (Undo Split Merged Holdings)
- **拆分快照留存**：將合併筆記拆回獨立庫存卡片時，系統自動紀錄 `lastSplitInfo` 快照。
- **一鍵復原**：於庫存頁面頂部醒目顯示 **`【復原拆分】`** Banner 與快捷按鈕，隨時可一鍵將獨立筆記恢復重新合併。

### 5. 📊 賣出紀錄明細追加與加權平均價賣出/還原歷史履歷 (Weighted Avg Selling & Audit Activity Logs)
- **原始買進明細 100% 保留**：賣出部分庫存股時，原始合併買進明細保持完全獨立，不進行任何股數扣減。
- **追加賣出紀錄為第 N 筆明細**：賣出紀錄自動作為紅色高亮標籤 (如 `第 4 筆 (2026-07-30) : $28.71 (賣價) | 賣出 1,000 股 [✏️ 修改]`) 追加於明細最下方。
- **加權買價與淨股數精準計算**：
  - 淨持股數 = 買進總股數 - 賣出總股數。
  - 加權買價依買進總成本 ÷ 買進總股數算定，不受賣價影響。
- **退回庫存自動對沖**：自歷史紀錄點擊「退回庫存」時，安全移除該賣出明細，庫存與未實現損益無縫復原歸還。
- **📜 交易與變更歷史履歷**：卡片明細中新增「交易與變更履歷」，詳細記錄賣出均價、還原、修改與合併歷史痕跡。

### 6. 💼 帳戶 1-5 自訂名稱編輯 (Custom Account Names)
- **自訂證券戶名稱**：帳戶 1-5 與臨時帳戶名稱可由使用者自行編輯（例如可將「帳戶-1」自訂為「元大證券」、「國泰證券」或「富邦證券」），方便辨識真實證券庫存。
- **內聯編輯與持久化**：在「切換與管理帳戶」彈窗中提供鉛筆按鈕即時修改，名稱自動持久化儲存於 `localStorage` 並支援 JSON 備份檔匯入匯出。

### 7. 📲 庫存文字分享、匯入與「臨時帳戶」一鍵轉存 (Share & Import Holdings Text)
- **標準格式文字分享**：支援指定單一股票或全部庫存一鍵導出標準文字版格式（包含股票/ETF名稱、代號、買價、股數、手續折扣與購買時間），支援一鍵複製與手機系統原生分享。
- **文字解析與匯入**：收到分享文字的使用者只需在 App 中貼上文字，系統自動智慧解析各欄位並寫入專屬【臨時帳戶】。
- **一鍵轉存個人帳戶**：處於【臨時帳戶】時提供顯眼提示橫幅與轉存彈窗，讓使用者可一鍵決定將臨時庫存轉存歸冊至指定個人帳戶（帳戶 1-5）。

### 8. 🎓 主題圖卡式「教學」分頁指南 (Interactive Guide & Theme Cards)
- **獨立教學分頁**：底部導覽列新增 **「教學」** 標籤，收錄三大主題圖卡：
  - **1. 交易類型全解析**：說明現股交易、現股當沖（享證交稅減半 0.15%）、信用當沖（資買券賣/券賣資買）與跨日平倉（資買資賣/券賣券買）之運作邏輯與稅費計算。
  - **2. Stock-Cal 軟體操作教學**：當天當沖試算、當沖未平倉轉留倉設定、文字分享與轉存完整步驟。
  - **3. 券商實務與營業員溝通指南**：當沖與信用戶開通條件、券商 APP 盤後自動對沖規則，內建一鍵複製營業員溝通話術。

### 9. 📈 台股檔位 (Tick Size) 距離保本/賺錢檔位直觀顯化 (Ticks Position Badge)
- **6 階升降單位精密計算**：依據台股官方檔位表（<10元: 0.01、10~50元: 0.05、50~100元: 0.10、100~500元: 0.50、500~1000元: 1.00、>=1000元: 5.00）跨區間計算。
- **持股位置一目了然**：負報酬顯示「距離保本打平還差上漲 X 檔 (保本價 $YY.YY)」，正報酬顯示「目前已經賺了 X 檔」。

### 10. 📊 ETF 當下價位折溢價全流程連動顯化 (Live ETF Premium/Discount)
- **即時折溢價試算**：填寫估計淨值 (NAV)，自動計算每股折溢價點數 (如 `+$0.50`) 與百分比 (`+0.29%`)。
- **持股折溢價金額換算**：依據持股數量，自動換算全持股相當於多付或省下多少新台幣元（如 `持股溢價總額 +$2,500 元`）。

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
├── index.html                  # Vite 主入口點 (PWA 與滿版設定)
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
│   │   └── stock.ts            # 股票、NAV、買賣明細與履歷型別定義
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
│   │   └── useStockStore.ts    # Zustand 全域狀態、加權賣出與復原拆分邏輯
│   ├── components/
│   │   ├── Header.tsx          # 頂部帳戶切換、5 欄看板與 PC/iPad 頁籤
│   │   ├── HoldingsTab.tsx     # 庫存管理、特色色彩標註與履歷顯示
│   │   ├── CalculatorTab.tsx   # 即時成交試算與 Split-View 雙欄佈局
│   │   ├── HistoryTab.tsx      # 歷史平倉紀錄與勝率
│   │   ├── MarketTab.tsx       # 熱門觀察清單與國際指數速覽
│   │   ├── GuideTab.tsx        # 交易類型與營業員溝通主題圖卡教學
│   │   ├── SettingsTab.tsx     # 折數設定、PWA 安裝與 JSON 備份
│   │   └── modals/
│   │       ├── AddHoldingModal.tsx    # 新增庫存 (z-50)
│   │       ├── TradeTypeModal.tsx     # 交易類型選單 (z-[60])
│   │       ├── ProfitSummaryModal.tsx # 獲利試算彈窗
│   │       ├── SellModal.tsx          # 平倉賣出彈窗
│   │       ├── EditLotModal.tsx       # 編輯個別買賣紀錄彈窗
│   │       ├── EditHistoryModal.tsx   # 編輯歷史交易紀錄彈窗
│   │       ├── AccountModal.tsx       # 帳戶切換與名稱自訂彈窗
│   │       ├── ShareModal.tsx         # 庫存文字分享與匯入彈窗
│   │       ├── TransferTempModal.tsx  # 臨時帳戶庫存一鍵轉存彈窗
│   │       └── TransferHoldingModal.tsx# 跨帳戶轉存彈窗
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
git commit -m "docs: Update README.md with full-width iPad layout, trade badges, lot editing, and weighted sell features"
git push origin main
```

---

## 📜 授權條款 (License)

MIT License. 歡迎自由改寫與個人使用！
