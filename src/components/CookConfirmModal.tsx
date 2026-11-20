import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBasket,
  X,
} from 'lucide-react';
import {
  FamilyPreferences,
  PantryItem,
  Recipe,
  UsedIngredientLog,
} from '../types';
import { evaluateRecipe } from '../utils/recipeMatcher';
import { convertUnit, formatQty, getQuickStep } from '../utils/units';

interface AuditRow {
  key: string;
  ingredientName: string;
  pantryItemId: string;
  used: boolean;
  amountInPantryUnit: number;
  pantryUnit: string;
  currentStock: number;
  lowThreshold: number;
}

interface CookConfirmModalProps {
  recipe: Recipe;
  pantry: PantryItem[];
  prefs: FamilyPreferences;
  onClose: () => void;
  onConfirmDeduction: (
    deductions: { pantryItemId: string; amount: number }[],
    usedLogs: UsedIngredientLog[]
  ) => PantryItem[]; // returns items that became 0 or low after cook
  onAddDepletedToShopping: (items: PantryItem[]) => void;
}

export const CookConfirmModal: React.FC<CookConfirmModalProps> = ({
  recipe,
  pantry,
  prefs,
  onClose,
  onConfirmDeduction,
  onAddDepletedToShopping,
}) => {
  const initialRows = useMemo<AuditRow[]>(() => {
    const evaluated = evaluateRecipe(recipe, pantry, prefs);
    return evaluated.matchedIngredients.map((m, idx) => {
      const pItem = m.pantryItem;
      let amountInPantryUnit = m.requiredAmount;
      if (pItem) {
        const converted = convertUnit(
          m.requiredAmount,
          m.ingredient.unit,
          pItem.unit
        );
        if (converted !== null) {
          amountInPantryUnit = Math.round(converted * 100) / 100;
        }
      }

      return {
        key: `${m.ingredient.name}-${idx}`,
        ingredientName: m.ingredient.name,
        pantryItemId: pItem?.id ?? '',
        used: Boolean(pItem && pItem.quantity > 0),
        amountInPantryUnit: pItem ? amountInPantryUnit : m.requiredAmount,
        pantryUnit: pItem?.unit ?? m.ingredient.unit,
        currentStock: pItem?.quantity ?? 0,
        lowThreshold: pItem?.lowThreshold ?? 0,
      };
    });
  }, [recipe, pantry, prefs]);

  const [rows, setRows] = useState<AuditRow[]>(initialRows);
  const [depletedAfterCook, setDepletedAfterCook] = useState<PantryItem[] | null>(null);
  const [addedToShoppingDone, setAddedToShoppingDone] = useState(false);

  const updateRow = (key: string, patch: Partial<AuditRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  };

  const handleLinkPantryItem = (key: string, pantryId: string) => {
    const target = pantry.find((p) => p.id === pantryId);
    if (!target) {
      updateRow(key, { pantryItemId: '', used: false });
      return;
    }
    updateRow(key, {
      pantryItemId: target.id,
      used: target.quantity > 0,
      pantryUnit: target.unit,
      currentStock: target.quantity,
      lowThreshold: target.lowThreshold,
    });
  };

  const handleSubmit = () => {
    const deductions: { pantryItemId: string; amount: number }[] = [];
    const usedLogs: UsedIngredientLog[] = [];

    for (const r of rows) {
      if (!r.used || r.amountInPantryUnit <= 0) continue;
      if (r.pantryItemId) {
        deductions.push({
          pantryItemId: r.pantryItemId,
          amount: r.amountInPantryUnit,
        });
      }
      usedLogs.push({
        name: r.ingredientName,
        amount: r.amountInPantryUnit,
        unit: r.pantryUnit,
        pantryItemId: r.pantryItemId || undefined,
      });
    }

    const newlyDepleted = onConfirmDeduction(deductions, usedLogs);
    setDepletedAfterCook(newlyDepleted);
  };

  if (depletedAfterCook !== null) {
    return (
      <div
        className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Đã cập nhật kho & lưu lịch sử nấu
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                Kho bếp đã tự động trừ định lượng cho món{' '}
                <span className="font-semibold text-stone-900">{recipe.name}</span>{' '}
                ({prefs.servings} người).
              </p>
            </div>
          </div>

          {depletedAfterCook.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Cảnh báo hết hàng / sắp hết sau khi nấu ({depletedAfterCook.length} mục)
                </span>
              </div>
              <ul className="space-y-1.5 text-sm text-stone-800">
                {depletedAfterCook.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-mono-num text-xs font-semibold text-red-700">
                      {item.quantity <= 0
                        ? 'Hết hàng (0)'
                        : `Còn ${formatQty(item.quantity)} ${item.unit}`}
                    </span>
                  </li>
                ))}
              </ul>

              {!addedToShoppingDone ? (
                <button
                  type="button"
                  onClick={() => {
                    onAddDepletedToShopping(depletedAfterCook);
                    setAddedToShoppingDone(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <ShoppingBasket className="w-4 h-4" />
                  <span>Thêm các mục này vào danh sách đi chợ</span>
                </button>
              ) : (
                <div className="text-xs font-semibold text-[#15803D]">
                  Đã đẩy toàn bộ mục sắp hết vào danh sách đi chợ.
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 min-h-[44px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cook-audit-title"
    >
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-start justify-between gap-3">
          <div>
            <h2 id="cook-audit-title" className="text-lg sm:text-xl font-bold text-stone-900">
              Kiểm kê nguyên liệu đã dùng
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Món: <span className="font-semibold text-stone-800">{recipe.name}</span> ·{' '}
              <span className="font-mono-num">{prefs.servings}</span> người · Bạn có thể sửa lại số lượng nếu thực tế nêm ít hoặc nhiều hơn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-stone-100">
          {rows.map((r) => {
            const remaining = Math.max(
              0,
              Math.round((r.currentStock - (r.used ? r.amountInPantryUnit : 0)) * 100) / 100
            );
            const step = Math.max(1, Math.round((getQuickStep(r.pantryUnit) / 5) * 10) / 10);
            const willBeOut = r.used && r.pantryItemId && remaining <= 0;
            const willBeLow =
              r.used && r.pantryItemId && remaining > 0 && remaining <= r.lowThreshold;

            return (
              <div
                key={r.key}
                className={`py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !r.used ? 'opacity-55' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={r.used}
                    disabled={!r.pantryItemId}
                    onChange={(e) => updateRow(r.key, { used: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#15803D] rounded cursor-pointer"
                    aria-label={`Đánh dấu đã dùng ${r.ingredientName}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-stone-900">
                      {r.ingredientName}
                    </div>
                    {r.pantryItemId ? (
                      <div className="text-xs text-stone-500 mt-0.5 space-x-1.5">
                        <span>
                          Hiện có:{' '}
                          <span className="font-mono-num">
                            {formatQty(r.currentStock)} {r.pantryUnit}
                          </span>
                        </span>
                        <span aria-hidden="true">→</span>
                        <span
                          className={
                            willBeOut
                              ? 'text-red-700 font-semibold'
                              : willBeLow
                              ? 'text-amber-700 font-semibold'
                              : 'text-stone-700 font-medium'
                          }
                        >
                          {willBeOut
                            ? 'Sau nấu: Hết hàng (0)'
                            : `Sau nấu còn: ${formatQty(remaining)} ${r.pantryUnit}`}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <select
                          value={r.pantryItemId}
                          onChange={(e) => handleLinkPantryItem(r.key, e.target.value)}
                          className="text-xs border border-stone-200 rounded-md px-2 py-1 bg-stone-50 text-stone-700"
                        >
                          <option value="">Chưa liên kết mục trong kho (bỏ qua trừ kho)</option>
                          {pantry.map((p) => (
                            <option key={p.id} value={p.id}>
                              Liên kết: {p.name} ({formatQty(p.quantity)} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {r.pantryItemId && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      disabled={!r.used || r.amountInPantryUnit <= 0}
                      onClick={() =>
                        updateRow(r.key, {
                          amountInPantryUnit: Math.max(
                            0,
                            Math.round((r.amountInPantryUnit - step) * 100) / 100
                          ),
                        })
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                      aria-label="Giảm định lượng đã dùng"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center border border-stone-200 rounded-lg px-2 h-9 bg-white">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        disabled={!r.used}
                        value={r.amountInPantryUnit}
                        onChange={(e) =>
                          updateRow(r.key, {
                            amountInPantryUnit: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-14 text-right font-mono-num text-sm font-semibold text-stone-900 focus:outline-none"
                      />
                      <span className="ml-1 text-xs text-stone-500">
                        {r.pantryUnit}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!r.used}
                      onClick={() =>
                        updateRow(r.key, {
                          amountInPantryUnit:
                            Math.round((r.amountInPantryUnit + step) * 100) / 100,
                        })
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                      aria-label="Tăng định lượng đã dùng"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 min-h-[44px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
          >
            Xác nhận trừ kho & lưu lịch sử
          </button>
        </div>
      </div>
    </div>
  );
};
