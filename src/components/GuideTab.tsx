import React, { useState } from 'react';
import { useStockStore } from '../store/useStockStore';

export const GuideTab: React.FC = () => {
  const { themeMode, setActiveTab, setToastMessage } = useStockStore();
  const [activeCategory, setActiveCategory] = useState<'types' | 'app' | 'broker'>('types');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const isLight = themeMode === 'light';

  const copyText = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(title);
    setToastMessage(`已複製話術：${title}`);
    setTimeout(() => setCopiedScript(null), 2000);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4 pb-6 animate-fadeIn">
      {/* 頂部主題卡片 Header */}
      <div className={`p-4 rounded-2xl border shadow-lg transition-colors ${
        isLight
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-slate-900'
          : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-slate-100'
      }`}>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 className="font-extrabold text-lg">交易類型與操作教學指南</h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              主題圖卡全解析：搞懂當沖、資券、沖銷邏輯與券商溝通技巧
            </p>
          </div>
        </div>

        {/* 分類切換鈕 */}
        <div className={`flex rounded-xl p-1 border text-xs font-bold mt-3 ${
          isLight ? 'bg-white border-amber-200' : 'bg-slate-900/80 border-slate-700'
        }`}>
          <button
            onClick={() => setActiveCategory('types')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeCategory === 'types'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <i className="fa-solid fa-[#fa-list] fa-layer-group"></i>
            <span>1. 交易類型解析</span>
          </button>
          <button
            onClick={() => setActiveCategory('app')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeCategory === 'app'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <i className="fa-solid fa-mobile-screen-button"></i>
            <span>2. 本軟體操作</span>
          </button>
          <button
            onClick={() => setActiveCategory('broker')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1 ${
              activeCategory === 'broker'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
          >
            <i className="fa-solid fa-comments"></i>
            <span>3. 券商溝通指南</span>
          </button>
        </div>
      </div>

      {/* CATEGORY 1: 交易類型全解析 */}
      {activeCategory === 'types' && (
        <div className="space-y-3">
          {/* 現股交易 */}
          <div className={`p-4 rounded-2xl border shadow transition ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 font-bold rounded-lg text-xs border border-blue-500/30">
                多-現股交易
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>標準現股買賣</span>
            </div>
            <h3 className="font-extrabold text-base mb-1">現股交易（做多）</h3>
            <p className={`text-xs leading-relaxed mb-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              全額使用自己的現金買進股票，T+2日扣款。無到期日與利息壓力，適合波段與長期投資。
            </p>
            <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
              isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-900/70 text-slate-300'
            }`}>
              <div>• <strong>買進費用</strong>：成交金額 × 0.1425% × 手續折扣</div>
              <div>• <strong>賣出費用</strong>：成交金額 × (0.1425% × 折扣 + <strong>0.3% 證交稅</strong>)</div>
            </div>
          </div>

          {/* 現股當沖 */}
          <div className={`p-4 rounded-2xl border shadow transition ${
            isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-800 border-emerald-800/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/30">
                多-現股當沖 / 空-現股當沖
              </span>
              <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                ⚡ 證交稅減半 (0.15%)
              </span>
            </div>
            <h3 className="font-extrabold text-base mb-1">現股當沖（當日沖銷）</h3>
            <p className={`text-xs leading-relaxed mb-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              當天開盤後買進並於當天收盤前賣出（或先賣後買）。無需準備全額股票交割款，只結算買賣價差與手續費。
            </p>
            <div className={`p-2.5 rounded-xl text-xs space-y-1.5 ${
              isLight ? 'bg-white text-slate-800 border border-emerald-100' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <div className="text-emerald-500 font-bold">💡 稅率優勢與沖銷規則：</div>
              <div>• 賣出時<strong>證券交易稅直接減半為 0.15%</strong>（大幅節省交易成本）。</div>
              <div>• 當天必須完成相反方向交易平倉，否則需辦理現股留倉或借券。</div>
            </div>
          </div>

          {/* 信用當沖 (資買券賣 / 券賣資買) */}
          <div className={`p-4 rounded-2xl border shadow transition ${
            isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-800 border-purple-800/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 font-bold rounded-lg text-xs border border-purple-500/30">
                多-資買券賣 / 空-券賣資買
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>信用當沖</span>
            </div>
            <h3 className="font-extrabold text-base mb-1">信用當沖（資券相抵）</h3>
            <p className={`text-xs leading-relaxed mb-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              開立信用戶後，當天透過「融資買進」與「融券賣出」（或券賣資買）進行對沖。適合無法現股當沖之標的或做空操作。
            </p>
            <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
              isLight ? 'bg-white text-slate-800 border border-purple-100' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <div>• <strong>資買券賣</strong>：做多當沖，當天資買與券賣由券商自動沖銷相抵。</div>
              <div>• <strong>券賣資買</strong>：做空當沖，先借股票賣出，尾盤融資買回平倉。</div>
            </div>
          </div>

          {/* 跨日平倉 (資買資賣 / 券賣券買) */}
          <div className={`p-4 rounded-2xl border shadow transition ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 bg-slate-500/20 text-slate-400 font-bold rounded-lg text-xs border border-slate-500/30">
                多-資買資賣 / 空-券賣券買
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>信用跨日平倉</span>
            </div>
            <h3 className="font-extrabold text-base mb-1">融資融券平倉（跨日留倉）</h3>
            <p className={`text-xs leading-relaxed mb-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              融資買進後持有數日才賣出（資賣平倉），或融券賣出後持有數日才買回（券買平倉）。需注意融資利息（約6-7%/年）與融券費率。
            </p>
          </div>

          {/* 信用交易維持率與斷頭機制教學 */}
          <div className={`p-4 rounded-2xl border shadow transition sm:col-span-2 ${
            isLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-indigo-950/40 border-indigo-800/60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs border border-indigo-500 shadow-xs">
                信用交易維持率教學
              </span>
              <span className={`text-xs font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>130% 斷頭警戒</span>
            </div>
            <h3 className="font-extrabold text-base mb-1 text-indigo-950 dark:text-indigo-100">
              融資/融券維持率計算與斷頭機制
            </h3>
            <p className={`text-xs leading-relaxed mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              維持率是衡量股票市值與券商借款比率的風險指標。當股票市值下跌（融資）或上漲（融券）導致整戶維持率跌破 130% 時，券商將發出追繳通知，若未限期補足將遭強制賣出平倉（斷頭）。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-white border-indigo-100 text-slate-800' : 'bg-slate-900/90 border-slate-700 text-slate-200'
              }`}>
                <div className="font-black text-blue-600 dark:text-blue-400">📈 融資維持率 (Margin Long)</div>
                <div>• <strong>公式</strong>：股票市值 ÷ 融資金額 × 100%</div>
                <div>• <strong>融資比率</strong>：上市股票最高融資 6 成（自備款 4 成）</div>
                <div>• <strong>初始維持率</strong>：100% ÷ 60% ≒ <strong>166.67%</strong></div>
                <div>• <strong>130% 斷頭價</strong>：買進價格 × 60% × 1.3 ＝ <strong>買價 × 78%</strong></div>
              </div>
              <div className={`p-3 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-white border-indigo-100 text-slate-800' : 'bg-slate-900/90 border-slate-700 text-slate-200'
              }`}>
                <div className="font-black text-purple-600 dark:text-purple-400">📉 融券維持率 (Margin Short)</div>
                <div>• <strong>公式</strong>：(融券賣出價款 + 融券保證金) ÷ 當前股票市值 × 100%</div>
                <div>• <strong>保證金成數</strong>：通常為 9 成（自備 90% 保證金）</div>
                <div>• <strong>初始維持率</strong>：(100% + 90%) ＝ <strong>190.00%</strong></div>
                <div>• <strong>130% 斷頭價</strong>：賣出價格 × 190% ÷ 130% ≒ <strong>賣價 × 146.15%</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 2: 本軟體操作 */}
      {activeCategory === 'app' && (
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border shadow space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className="font-extrabold text-base text-amber-500 flex items-center space-x-1.5">
              <i className="fa-solid fa-calculator"></i>
              <span>1. 盤中當沖極速試算</span>
            </h3>
            <div className={`p-3 rounded-xl text-xs space-y-2 leading-relaxed ${
              isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <div className="font-bold flex items-center space-x-1 text-emerald-500">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
                <span>切換交易類型為「現股當沖」</span>
              </div>
              <p className="pl-6">在試算頁面中點擊交易類型選單，選擇「多-現股當沖」或「空-現股當沖」。</p>
              <div className="font-bold flex items-center space-x-1 text-emerald-500">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">2</span>
                <span>系統自動應用 0.15% 減半證交稅</span>
              </div>
              <p className="pl-6">本 App 會自動調整預估交割稅與損益平衡點，讓您秒知賺多少 Tick 即開始獲利！</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border shadow space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className="font-extrabold text-base text-amber-500 flex items-center space-x-1.5">
              <i className="fa-solid fa-box-archive"></i>
              <span>2. 當沖留倉與隔天沖銷處理</span>
            </h3>
            <div className={`p-3 rounded-xl text-xs space-y-2 leading-relaxed ${
              isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <div className="font-bold text-amber-600">🌙 當天當沖未平倉（轉留倉）：</div>
              <p>如果在 App 記錄了當沖，但尾盤未成功賣出變留倉，請在【庫存】點擊編輯，將交易類型改為「多-現股交易」或「多-資買資賣」。</p>
              <div className="font-bold text-amber-600">☀️ 隔天平倉：</div>
              <p>隔天賣出時點擊「賣出平倉」，證交稅將恢復為標準 0.3%，賣出後筆記會自動歸冊至【歷史】交易紀錄。</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border shadow space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className="font-extrabold text-base text-amber-500 flex items-center space-x-1.5">
              <i className="fa-solid fa-share-nodes"></i>
              <span>3. 分享與臨時帳戶匯入</span>
            </h3>
            <div className={`p-3 rounded-xl text-xs space-y-2 leading-relaxed ${
              isLight ? 'bg-slate-50 text-slate-800' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <p>• 點擊庫存卡片上的「分享」按鈕，可產生標準文字版庫存資訊傳給朋友。</p>
              <p>• 收到文字的朋友點擊「匯入分享文字」貼上，即可一鍵寫入【臨時帳戶】並可轉存至個人正式帳戶 (1-5)。</p>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 3: 券商溝通指南 */}
      {activeCategory === 'broker' && (
        <div className="space-y-3">
          {/* 開通條件提醒 */}
          <div className={`p-4 rounded-2xl border shadow space-y-2 ${
            isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-800 border-amber-800/50'
          }`}>
            <h3 className="font-extrabold text-base text-amber-500 flex items-center space-x-1.5">
              <i className="fa-solid fa-id-card"></i>
              <span>交易權限開通條件提醒</span>
            </h3>
            <div className={`p-3 rounded-xl text-xs space-y-1.5 leading-relaxed ${
              isLight ? 'bg-white text-slate-800 border border-amber-200' : 'bg-slate-900/80 text-slate-200'
            }`}>
              <div>• <strong>現股當沖權限</strong>：需證券開戶滿 3 個月、近一年交易筆數滿 15 筆，且在券商 APP 簽署「當沖同意書」。</div>
              <div>• <strong>信用交易權限（融資融券）</strong>：需開戶滿 3 個月、近一年交易滿 10 筆、累積成交金額達申請額度 50%、並提供財力證明。</div>
            </div>
          </div>

          {/* 話術卡片 1 */}
          <div className={`p-4 rounded-2xl border shadow space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-rose-500 flex items-center space-x-1">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>情境一：當沖失敗無法平倉（轉現股/借券）</span>
              </h4>
              <button
                onClick={() => copyText(
                  '你好，我今天［股票代號/名稱］原本預計做現股當沖，但尾盤無法平倉買回。請幫我改為【現股留倉】（或辦理借券/改融資留倉），謝謝！',
                  '當沖失敗轉留倉話術'
                )}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <i className="fa-solid fa-copy"></i>
                <span>複製話術</span>
              </button>
            </div>
            <div className={`p-3 rounded-xl text-xs font-mono border leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}>
              「你好，我今天［股票代號/名稱］原本預計做現股當沖，但尾盤無法平倉買回。請幫我改為【現股留倉】（或辦理借券/改融資留倉），謝謝！」
            </div>
          </div>

          {/* 話術卡片 2 */}
          <div className={`p-4 rounded-2xl border shadow space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-emerald-500 flex items-center space-x-1">
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <span>情境二：向營業員爭取手續費折扣</span>
              </h4>
              <button
                onClick={() => copyText(
                  '你好，我最近在貴券商的月交易量約［X00萬］，目前手續費折扣是［6折/5折］。請問是否有空間幫我申請調降至［2.8折 / 38折］？',
                  '申請手續費折扣話術'
                )}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <i className="fa-solid fa-copy"></i>
                <span>複製話術</span>
              </button>
            </div>
            <div className={`p-3 rounded-xl text-xs font-mono border leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}>
              「你好，我最近在貴券商的月交易量約［X00萬］，目前手續費折扣是［6折/5折］。請問是否有空間幫我申請調降至［2.8折 / 38折］？」
            </div>
          </div>

          {/* 話術卡片 3 */}
          <div className={`p-4 rounded-2xl border shadow space-y-2 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-sky-500 flex items-center space-x-1">
                <i className="fa-solid fa-rotate"></i>
                <span>情境三：確認資券自動對沖與帳務</span>
              </h4>
              <button
                onClick={() => copyText(
                  '你好，請幫我確認我今天帳戶裡的［股票代號］融資買進與融券賣出是否有順利自動對沖沖銷，謝謝！',
                  '確認資券對沖話術'
                )}
                className="px-2.5 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <i className="fa-solid fa-copy"></i>
                <span>複製話術</span>
              </button>
            </div>
            <div className={`p-3 rounded-xl text-xs font-mono border leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}>
              「你好，請幫我確認我今天帳戶裡的［股票代號］融資買進與融券賣出是否有順利自動對沖沖銷，謝謝！」
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
