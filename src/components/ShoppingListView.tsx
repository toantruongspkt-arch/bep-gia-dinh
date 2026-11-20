import React, { useState } from 'react';
import {
  ArrowRightCircle,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { CATEGORY_LABELS, PantryCategory, ShoppingItem } from '../types';
import { formatQty } from '../utils/units';
import { TomatoIcon } from './VeggieIcons';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onAddManual: (item: Omit<ShoppingItem, 'id' | 'addedAt' | 'checked'>) => void;
  onToggleChecked: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  onImportOneToPantry: (item: ShoppingItem) => void;
  onImportCheckedToPantry: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onAddManual,
  onToggleChecked,
  onUpdateQty,
  onDelete,
  onImportOneToPantry,
  onImportCheckedToPantry,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PantryCategory>('fresh_ingredient');
  const [qty, setQty] = useState('200');
  const [unit, setUnit] = useState('g');

  const checkedCount = items.filter((i) => i.checked).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddManual({
      name: name.trim(),
      category,
      quantity: Math.max(0.1, Number(qty) || 1),
      unit: unit.trim() || 'g',
    });
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Danh sách đi chợ
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Tổng hợp các món cần mua từ công thức và đồ sắp hết trong kho. Đánh dấu đã mua để nhập thẳng vào kho.
          </p>
        </div>

        {checkedCount > 0 && (
          <button
            type="button"
            onClick={onImportCheckedToPantry}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>Nhập {checkedCount} mục đã mua vào kho</span>
          </button>
        )}
      </div>

      {/* Add Manual Item Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-stone-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Tên món cần mua
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Sả tươi, Măng tây, Nấm kim châm..."
            className="w-full px-3 py-2 min-h-[40px] text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Nhóm kho
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PantryCategory)}
            className="w-full px-3 py-2 min-h-[40px] text-sm border border-stone-200 rounded-lg bg-white"
          >
            <option value="fresh_ingredient">Nguyên liệu tươi</option>
            <option value="dry_ingredient">Nguyên liệu khô</option>
            <option value="liquid_spice">Gia vị lỏng / nước</option>
            <option value="dry_spice">Gia vị khô</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Số lượng
          </label>
          <input
            type="number"
            min="0.1"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full px-3 py-2 min-h-[40px] text-sm font-mono-num border border-stone-200 rounded-lg"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Đơn vị
          </label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-2.5 py-2 min-h-[40px] text-sm border border-stone-200 rounded-lg"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
        </div>
      </form>

      {/* Shopping Items List */}
      {items.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-2">
          <TomatoIcon className="w-10 h-10 mx-auto" />
          <h2 className="text-base font-semibold text-stone-800">
            Danh sách đi chợ đang trống
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Khi xem công thức có nguyên liệu thiếu hoặc thấy mục hết hàng trong kho, bạn có thể bấm nút thêm nhanh sang đây.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.checked ? 'bg-stone-50/80' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleChecked(item.id)}
                  aria-label={`Đánh dấu đã mua ${item.name}`}
                  className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    item.checked
                      ? 'bg-[#15803D] border-[#15803D] text-white'
                      : 'bg-white border-stone-300 hover:border-[#15803D]'
                  }`}
                >
                  {item.checked && <Check className="w-4 h-4" />}
                </button>
                <div className="min-w-0">
                  <div
                    className={`text-sm sm:text-base font-semibold ${
                      item.checked ? 'line-through text-stone-400' : 'text-stone-900'
                    }`}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    <span>{CATEGORY_LABELS[item.category]}</span>
                    {item.sourceRecipeName && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>Từ món: {item.sourceRecipeName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                <div className="flex items-center border border-stone-200 rounded-lg px-2.5 h-9 bg-white">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      onUpdateQty(item.id, Math.max(0.1, Number(e.target.value) || 1))
                    }
                    className="w-14 text-right font-mono-num text-sm font-semibold text-stone-900 focus:outline-none"
                  />
                  <span className="ml-1.5 text-xs text-stone-500">{item.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onImportOneToPantry(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  <ArrowRightCircle className="w-3.5 h-3.5" />
                  <span>Đã mua → Nhập kho ({formatQty(item.quantity)} {item.unit})</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Xóa ${item.name}`}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:text-red-700 hover:border-red-200 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
