import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Minus,
  Plus,
  ShoppingBasket,
  X,
} from 'lucide-react';
import { FamilyPreferences, PantryItem, Recipe } from '../types';
import { evaluateRecipe, MatchedIngredient } from '../utils/recipeMatcher';
import { formatQty } from '../utils/units';

interface RecipeDetailModalProps {
  recipe: Recipe;
  pantry: PantryItem[];
  prefs: FamilyPreferences;
  onUpdatePrefs: (patch: Partial<FamilyPreferences>) => void;
  onClose: () => void;
  onAddMissingToShopping: (items: MatchedIngredient[], recipeName: string) => void;
  onStartCookConfirm: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  pantry,
  prefs,
  onUpdatePrefs,
  onClose,
  onAddMissingToShopping,
  onStartCookConfirm,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [addedBanner, setAddedBanner] = useState<string | null>(null);

  const evaluated = evaluateRecipe(recipe, pantry, prefs);
  const availableItems = evaluated.matchedIngredients.filter(
    (m) => m.status === 'available'
  );
  const missingItems = evaluated.matchedIngredients.filter(
    (m) => m.status !== 'available'
  );

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleAddSingle = (item: MatchedIngredient) => {
    onAddMissingToShopping([item], recipe.name);
    setAddedBanner(`Đã thêm "${item.ingredient.name}" vào danh sách đi chợ.`);
  };

  const handleAddAllMissing = () => {
    if (missingItems.length === 0) return;
    onAddMissingToShopping(missingItems, recipe.name);
    setAddedBanner(`Đã thêm ${missingItems.length} mục cần mua vào danh sách đi chợ.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <div className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">
                {recipe.dietary === 'vegan' ? 'Món thực vật (Chay)' : 'Món mặn'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{recipe.cuisine === 'vietnamese' ? 'Món Việt Nam' : 'Món nước ngoài'}</span>
              <span aria-hidden="true">·</span>
              <span>{recipe.method}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-num">
                <Clock className="w-3.5 h-3.5" />
                Chuẩn bị {recipe.prepMinutes}p + Nấu {recipe.cookMinutes}p
              </span>
            </div>
            <h2
              id="recipe-detail-title"
              className="mt-1 text-xl sm:text-2xl font-bold text-stone-900 text-balance"
            >
              {recipe.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng công thức"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Serving & Low Sodium Live Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-stone-700">
                Khẩu phần thực tế:
              </span>
              <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePrefs({ servings: Math.max(1, prefs.servings - 1) })
                  }
                  className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 rounded-l-lg cursor-pointer"
                  aria-label="Giảm khẩu phần"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-mono-num text-sm font-bold text-stone-900">
                  {prefs.servings} người
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePrefs({ servings: Math.min(10, prefs.servings + 1) })
                  }
                  className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 rounded-r-lg cursor-pointer"
                  aria-label="Tăng khẩu phần"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpdatePrefs({ lowSodium: !prefs.lowSodium })}
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                prefs.lowSodium
                  ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                  : 'bg-white border-stone-200 text-stone-600'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${prefs.lowSodium ? 'opacity-100' : 'opacity-35'}`} />
              <span>
                {prefs.lowSodium ? 'Đang áp dụng định lượng ăn nhạt' : 'Định lượng nêm thông thường'}
              </span>
            </button>
          </div>

          {addedBanner && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm">
              <span>{addedBanner}</span>
              <button
                type="button"
                onClick={() => setAddedBanner(null)}
                className="p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Family Cooking Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
              <div className="font-semibold text-stone-900">Mẹo nêm nhạt tự nhiên</div>
              <p className="mt-1 text-stone-600 leading-relaxed">{recipe.lowSodiumTip}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
              <div className="font-semibold text-stone-900">Cách chế biến ít dầu mỡ</div>
              <p className="mt-1 text-stone-600 leading-relaxed">{recipe.lowOilTip}</p>
            </div>
          </div>

          {/* Ingredients Split: Available vs Missing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-stone-900">
                Nguyên liệu & gia vị cho {prefs.servings} người
              </h3>
              {missingItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllMissing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold cursor-pointer"
                >
                  <ShoppingBasket className="w-3.5 h-3.5" />
                  <span>Thêm tất cả mục thiếu ({missingItems.length})</span>
                </button>
              )}
            </div>

            {/* Missing / Need to Buy */}
            {missingItems.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl overflow-hidden divide-y divide-amber-200/70">
                <div className="px-4 py-2.5 bg-amber-100/60 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4" />
                  <span>Cần mua thêm / Không đủ trong kho ({missingItems.length})</span>
                </div>
                {missingItems.map((m) => (
                  <div
                    key={m.ingredient.name}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-stone-900">
                        {m.ingredient.name}
                      </div>
                      <div className="text-xs text-stone-600">
                        Cần{' '}
                        <span className="font-mono-num font-semibold">
                          {formatQty(m.requiredAmount)} {m.ingredient.unit}
                        </span>
                        {m.pantryItem ? (
                          <span>
                            {' '}
                            · Trong kho hiện còn{' '}
                            <span className="font-mono-num">
                              {formatQty(m.pantryItem.quantity)} {m.pantryItem.unit}
                            </span>
                          </span>
                        ) : (
                          <span> · Chưa có trong kho</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSingle(m)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Đi chợ</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Available in Pantry */}
            <div className="border border-stone-200 bg-white rounded-xl overflow-hidden divide-y divide-stone-100">
              <div className="px-4 py-2.5 bg-stone-50 flex items-center gap-2 text-xs font-bold text-[#15803D]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã có sẵn trong kho ({availableItems.length})</span>
              </div>
              {availableItems.length === 0 ? (
                <div className="px-4 py-3 text-sm text-stone-500">
                  Chưa có nguyên liệu nào khớp sẵn trong kho.
                </div>
              ) : (
                availableItems.map((m) => (
                  <div
                    key={m.ingredient.name}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-stone-900">
                        {m.ingredient.name}
                      </div>
                      {m.pantryItem && (
                        <div className="text-xs text-stone-500">
                          Kho đang có:{' '}
                          <span className="font-mono-num">
                            {formatQty(m.pantryItem.quantity)} {m.pantryItem.unit}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="font-mono-num text-sm font-semibold text-stone-900 shrink-0">
                      {formatQty(m.requiredAmount)}{' '}
                      <span className="font-sans text-xs font-normal text-stone-500">
                        {m.ingredient.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-stone-900">
              Các bước chế biến (chạm để đánh dấu khi đang nấu)
            </h3>
            <ol className="space-y-2.5">
              {recipe.steps.map((step, idx) => {
                const done = checkedSteps.includes(idx);
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => toggleStep(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        done
                          ? 'bg-emerald-50/60 border-emerald-200 text-stone-500'
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono-num shrink-0 mt-0.5 ${
                          done
                            ? 'bg-[#15803D] text-white'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </span>
                      <span
                        className={`text-sm sm:text-base leading-relaxed ${
                          done ? 'line-through' : ''
                        }`}
                      >
                        {step}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-5 py-4 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            Đóng lại
          </button>
          <button
            type="button"
            onClick={onStartCookConfirm}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>Xác nhận đã nấu / Sử dụng nguyên liệu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
