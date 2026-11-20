import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  CookingMethod,
  CuisineStyle,
  DietaryType,
  PantryCategory,
  PantryItem,
  Recipe,
  RecipeIngredient,
} from '../types';

interface CustomRecipeModalProps {
  pantry: PantryItem[];
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

const METHODS: CookingMethod[] = [
  'Hấp',
  'Luộc',
  'Áp chảo ít dầu',
  'Nấu canh',
  'Trộn / Gỏi',
  'Kho / Rim nhạt',
  'Xào nhanh ít dầu',
];

export const CustomRecipeModal: React.FC<CustomRecipeModalProps> = ({
  pantry,
  onClose,
  onSaveRecipe,
}) => {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [dietary, setDietary] = useState<DietaryType>('vegan');
  const [cuisine, setCuisine] = useState<CuisineStyle>('vietnamese');
  const [method, setMethod] = useState<CookingMethod>('Hấp');
  const [prepMinutes, setPrepMinutes] = useState('5');
  const [cookMinutes, setCookMinutes] = useState('12');
  const [isLowSodium, setIsLowSodium] = useState(true);
  const [isLowOil, setIsLowOil] = useState(true);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [stepsText, setStepsText] = useState(
    'Sơ chế và rửa sạch các nguyên liệu.\nChế biến theo phương pháp đã chọn với lượng gia vị nhạt và ít dầu.\nTrình bày ra đĩa và dùng nóng.'
  );

  // Quick ingredient draft row
  const [ingName, setIngName] = useState('');
  const [ingCategory, setIngCategory] = useState<PantryCategory>('fresh_ingredient');
  const [ingAmount, setIngAmount] = useState('100');
  const [ingUnit, setIngUnit] = useState('g');

  const quickPickFromPantry = (p: PantryItem) => {
    if (ingredients.some((i) => i.name.toLowerCase() === p.name.toLowerCase())) {
      return;
    }
    const defaultAmt =
      p.unit === 'g' || p.unit === 'ml' ? (p.category === 'fresh_ingredient' ? 100 : 5) : 1;
    setIngredients((prev) => [
      ...prev,
      {
        name: p.name,
        category: p.category,
        amountPerServing: defaultAmt,
        unit: p.unit,
      },
    ]);
  };

  const addCustomIngredient = () => {
    const trimmed = ingName.trim();
    if (!trimmed) return;
    setIngredients((prev) => [
      ...prev,
      {
        name: trimmed,
        category: ingCategory,
        amountPerServing: Math.max(0.1, Number(ingAmount) || 1),
        unit: ingUnit.trim() || 'g',
      },
    ]);
    setIngName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || ingredients.length === 0) return;

    const prep = Math.max(1, Number(prepMinutes) || 5);
    const cook = Math.max(1, Number(cookMinutes) || 10);
    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newRecipe: Recipe = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      subtitle: subtitle.trim() || `${method} nhanh gọn, hợp khẩu vị gia đình.`,
      dietary,
      cuisine,
      method,
      prepMinutes: prep,
      cookMinutes: cook,
      defaultServings: 2,
      isLowOil,
      isLowSodiumFriendly: isLowSodium,
      isQuick: prep + cook <= 25,
      lowSodiumTip: 'Nêm gia vị mặn ở mức nhẹ, ưu tiên hương thơm tự nhiên của nguyên liệu.',
      lowOilTip: 'Ưu tiên hấp, luộc hoặc áp chảo chống dính với lượng dầu tối thiểu.',
      ingredients,
      steps: steps.length > 0 ? steps : ['Sơ chế nguyên liệu và nấu chín tới.'],
      isCustom: true,
    };

    onSaveRecipe(newRecipe);
  };

  const availablePantry = pantry.filter((p) => p.quantity > 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-recipe-title"
    >
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 id="custom-recipe-title" className="text-lg font-bold text-stone-900">
              Thiết kế món ăn mới của gia đình
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chọn nguyên liệu đang có trong kho để tạo công thức riêng và tự trừ kho sau khi nấu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tên món ăn *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Cải thìa luộc chấm xì dầu tỏi ớt"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mô tả ngắn
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Nhẹ bụng, nấu nhanh 10 phút"
                className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Chế độ món
              </label>
              <select
                value={dietary}
                onChange={(e) => setDietary(e.target.value as DietaryType)}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-white"
              >
                <option value="vegan">Món thực vật (Chay)</option>
                <option value="non_vegan">Món mặn</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phong cách ẩm thực
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value as CuisineStyle)}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-white"
              >
                <option value="vietnamese">Món Việt Nam</option>
                <option value="international">Món nước ngoài (Á/Âu)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Phương pháp chế biến
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as CookingMethod)}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg bg-white"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Chuẩn bị (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={prepMinutes}
                  onChange={(e) => setPrepMinutes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono-num border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nấu (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={cookMinutes}
                  onChange={(e) => setCookMinutes(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono-num border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-stone-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLowSodium}
                onChange={(e) => setIsLowSodium(e.target.checked)}
                className="w-4 h-4 accent-[#15803D]"
              />
              <span>Hợp khẩu vị ăn nhạt</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLowOil}
                onChange={(e) => setIsLowOil(e.target.checked)}
                className="w-4 h-4 accent-[#15803D]"
              />
              <span>Ít dầu mỡ</span>
            </label>
          </div>

          {/* Quick Pick From Pantry */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-stone-700">
              Chọn nhanh từ kho đang có (định lượng tính cho 1 người ăn):
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 border border-stone-200 rounded-lg bg-stone-50">
              {availablePantry.map((p) => {
                const picked = ingredients.some(
                  (i) => i.name.toLowerCase() === p.name.toLowerCase()
                );
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => quickPickFromPantry(p)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      picked
                        ? 'bg-[#15803D] border-[#15803D] text-white'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-[#15803D]'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Ingredient Adder */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Hoặc thêm nguyên liệu khác
              </label>
              <input
                type="text"
                value={ingName}
                onChange={(e) => setIngName(e.target.value)}
                placeholder="Tên nguyên liệu..."
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Định lượng / 1 người
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={ingAmount}
                onChange={(e) => setIngAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num border border-stone-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Đơn vị
              </label>
              <input
                type="text"
                value={ingUnit}
                onChange={(e) => setIngUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={addCustomIngredient}
                className="w-full h-[38px] inline-flex items-center justify-center gap-1 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Selected Ingredients List */}
          {ingredients.length > 0 && (
            <div className="border border-stone-200 rounded-lg divide-y divide-stone-100">
              {ingredients.map((ing, idx) => (
                <div
                  key={`${ing.name}-${idx}`}
                  className="px-3 py-2 flex items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium text-stone-900">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={ing.amountPerServing}
                      onChange={(e) => {
                        const val = Math.max(0.1, Number(e.target.value) || 1);
                        setIngredients((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, amountPerServing: val } : item
                          )
                        );
                      }}
                      className="w-16 px-2 py-1 text-right font-mono-num text-xs border border-stone-200 rounded"
                    />
                    <span className="text-xs text-stone-500 min-w-[30px]">
                      {ing.unit}/người
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setIngredients((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-stone-400 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Các bước thực hiện (mỗi dòng là 1 bước)
            </label>
            <textarea
              rows={4}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!name.trim() || ingredients.length === 0}
              className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-45 text-white text-sm font-semibold cursor-pointer"
            >
              Lưu công thức mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
