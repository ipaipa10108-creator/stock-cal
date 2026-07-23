import React from 'react';
import { useStockStore } from '../../store/useStockStore';
import { TradeTypeOption } from '../../types/stock';

const tradeTypeOptions: TradeTypeOption[] = [
  '多-現股交易',
  '多-資買券賣',
  '空-券賣資買',
  '多-資買資賣',
  '空-券賣券買',
  '多-現股當沖',
  '空-現股當沖'
];

export const TradeTypeModal: React.FC = () => {
  const {
    showTradeTypeModal,
    setShowTradeTypeModal,
    tradeTypeContext,
    calcForm,
    setCalcForm,
    holdingForm,
    setHoldingForm
  } = useStockStore();

  if (!showTradeTypeModal) return null;

  const currentSelected = tradeTypeContext === 'calc' ? calcForm.tradeType : holdingForm.tradeType;

  const handleSelect = (option: TradeTypeOption) => {
    if (tradeTypeContext === 'calc') {
      setCalcForm({ tradeType: option });
    } else {
      setHoldingForm({ tradeType: option });
    }
    setShowTradeTypeModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-xs overflow-hidden shadow-2xl text-slate-900 animate-fade-in">
        <div className="p-2.5 border-b border-slate-200 font-bold text-center text-sm bg-slate-50 text-slate-700">
          請選擇交易類型
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {tradeTypeOptions.map((typeOption) => (
            <label
              key={typeOption}
              onClick={() => handleSelect(typeOption)}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition"
            >
              <span className="text-sm font-semibold text-slate-800">{typeOption}</span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  currentSelected === typeOption ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                }`}
              >
                {currentSelected === typeOption && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
