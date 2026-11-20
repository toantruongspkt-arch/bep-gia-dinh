import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Minus,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CuisineStyle,
  DietaryType,
  FamilyPreferences,
  PantryItem,
  Recipe,
} from '../types';
import {
  EvaluatedRecipe,
  evaluateRecipe,
  suggestMealCombo,
} from '../utils/recipeMatcher';
import { normalizeVi } from '../utils/units';
import { BroccoliIcon, SproutPotIcon } from './VeggieIcons';

interface RecipeDiscoveryViewProps {
  recipes: Recipe[];
  pantry: PantryItem[];
  prefs: FamilyPreferences;
  onUpdatePrefs: (patch: Partial<FamilyPreferences>) => void;
  onSelectRecipe: (evaluated: EvaluatedRecipe) => void;
  onQuickCook: (evaluated: EvaluatedRecipe) => void;
  onOpenCustomRecipe: () => void;
}

export const RecipeDiscoveryView: React.FC<RecipeDiscoveryViewProps> = ({
  recipes,
  pantry,
  prefs,
  onUpdatePrefs,
  onSelectRecipe,
  onQuickCook,
  onOpenCustomRecipe,
}) => {
  const [dietaryFilter, setDietaryFilter] = useState<'all' | DietaryType>('all');
  const [cuisineFilter, setCuisineFilter] = useState<'all' | CuisineStyle>('all');
  const [maxMinutes, setMaxMinutes] = useState<number>(0); // 0 = all
  const [onlyReady, setOnlyReady] = useState<boolean>(false);
  const [selectedPriorityIds, setSelectedPriorityIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMealCombo, setShowMealCombo] = useState<boolean>(true);

  const priorityCandidates = useMemo(() => {
    return pantry
      .filter((i) => i.quantity > 0 && i.category === 'fresh_ingredient')
      .sort((a, b) => {
        const score = (p?: string) =>
          p === 'use_now' ? 0 : p === 'use_soon' ? 1 : 2;
        return score(a.priority) - score(b.priority);
      });
  }, [pantry]);

  const togglePriorityId = (id: string) => {
    setSelectedPriorityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const evaluatedAll = useMemo(() => {
    return recipes.map((r) =>
      evaluateRecipe(r, pantry, prefs, selectedPriorityIds)
    );
  }, [recipes, pantry, prefs, selectedPriorityIds]);

  const filteredRecipes = useMemo(() => {
    const q = normalizeVi(searchQuery);
    return evaluatedAll
      .filter((ev) => {
        const { recipe, totalMinutes } = ev;
        if (dietaryFilter !== 'all' && recipe.dietary !== dietaryFilter) return false;
        if (cuisineFilter !== 'all' && recipe.cuisine !== cuisineFilter) return false;
        if (prefs.lowOil && !recipe.isLowOil) return false;
        if (prefs.lowSodium && !recipe.isLowSodiumFriendly) return false;
        if (prefs.quickCook && totalMinutes > 25) return false;
        if (maxMinutes > 0 && totalMinutes > maxMinutes) return false;
        if (onlyReady && ev.missingOrInsufficientCount > 0) return false;
        if (!ev.matchesSelectedPriorityIds) return false;

        if (q) {
          const inTitle = normalizeVi(recipe.name).includes(q);
          const inMethod = normalizeVi(recipe.method).includes(q);
          const inIng = recipe.ingredients.some((i) =>
            normalizeVi(i.name).includes(q)
          );
          if (!inTitle && !inMethod && !inIng) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.missingOrInsufficientCount !== b.missingOrInsufficientCount) {
          return a.missingOrInsufficientCount - b.missingOrInsufficientCount;
        }
        if (a.priorityFreshHits.length !== b.priorityFreshHits.length) {
          return b.priorityFreshHits.length - a.priorityFreshHits.length;
        }
        return a.totalMinutes - b.totalMinutes;
      });
  }, [
    evaluatedAll,
    dietaryFilter,
    cuisineFilter,
    prefs,
    maxMinutes,
    onlyReady,
    searchQuery,
  ]);

  const mealCombo = useMemo(
    () => suggestMealCombo(filteredRecipes),
    [filteredRecipes]
  );

  const readyCount = useMemo(
    () => filteredRecipes.filter((r) => r.missingOrInsufficientCount === 0).length,
    [filteredRecipes]
  );

  return (
    <div className="space-y-6">
      {/* Hero / Workspace Intro + Servings & Family Preferences */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Thực đơn phù hợp kho bếp hôm nay
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Tự động đối chiếu kho nguyên liệu gia đình · Hiện có{' '}
            <span className="font-mono-num font-semibold text-stone-900">
              {readyCount}
            </span>{' '}
            món nấu được ngay trên tổng{' '}
            <span className="font-mono-num font-semibold text-stone-900">
              {filteredRecipes.length}
            </span>{' '}
            công thức phù hợp.
          </p>
        </div>

        {/* Servings Stepper */}
        <div className="flex items-center gap-3 self-start lg:self-auto bg-white border border-stone-200 rounded-xl px-3.5 py-2">
          <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">
            Khẩu phần:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({ servings: Math.max(1, prefs.servings - 1) })
              }
              aria-label="Giảm số người ăn"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-[66px] text-center font-mono-num text-sm font-bold text-stone-900">
              {prefs.servings} người
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({ servings: Math.min(10, prefs.servings + 1) })
              }
              aria-label="Tăng số người ăn"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Family Habit Panel */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center p-1 bg-stone-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Tất cả món' },
                  { id: 'vegan', label: 'Thực vật (Chay)' },
                  { id: 'non_vegan', label: 'Món mặn' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDietaryFilter(opt.id)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    dietaryFilter === opt.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center p-1 bg-stone-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Mọi ẩm thực' },
                  { id: 'vietnamese', label: 'Món Việt Nam' },
                  { id: 'international', label: 'Món nước ngoài' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCuisineFilter(opt.id)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cuisineFilter === opt.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món ăn hoặc nguyên liệu..."
                className="w-full pl-9 pr-8 py-2 min-h-[40px] text-xs sm:text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(Number(e.target.value))}
              aria-label="Thời gian nấu tối đa"
              className="px-3 py-2 min-h-[40px] text-xs sm:text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:border-[#15803D]"
            >
              <option value={0}>Mọi thời gian</option>
              <option value={15}>≤ 15 phút</option>
              <option value={20}>≤ 20 phút</option>
              <option value={30}>≤ 30 phút</option>
            </select>
          </div>
        </div>

        {/* Row 2: Default Family Preferences */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 mr-1">
              Xu hướng gia đình:
            </span>
            <button
              type="button"
              onClick={() => onUpdatePrefs({ lowSodium: !prefs.lowSodium })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                prefs.lowSodium
                  ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${prefs.lowSodium ? 'opacity-100' : 'opacity-35'}`} />
              <span>Khẩu vị ăn nhạt</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdatePrefs({ quickCook: !prefs.quickCook })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                prefs.quickCook
                  ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${prefs.quickCook ? 'opacity-100' : 'opacity-35'}`} />
              <span>Chế biến nhanh (≤ 25p)</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdatePrefs({ lowOil: !prefs.lowOil })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                prefs.lowOil
                  ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${prefs.lowOil ? 'opacity-100' : 'opacity-35'}`} />
              <span>Ít dầu mỡ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyReady(!onlyReady)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              onlyReady
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <span>Chỉ hiện món đủ nguyên liệu</span>
          </button>
        </div>

        {/* Row 3: Priority Ingredients Selector */}
        {priorityCandidates.length > 0 && (
          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 shrink-0">
              Ưu tiên dùng nguyên liệu tươi:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {priorityCandidates.slice(0, 9).map((item) => {
                const selected = selectedPriorityIds.includes(item.id);
                const urgent = item.priority === 'use_now';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePriorityId(item.id)}
                    className={`px-2.5 py-1.5 min-h-[34px] rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selected
                        ? 'bg-[#15803D] border-[#15803D] text-white'
                        : urgent
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900 hover:bg-amber-100/70'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {item.name}
                    {urgent && !selected ? ' (Dùng ngay)' : ''}
                  </button>
                );
              })}
              {selectedPriorityIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPriorityIds([])}
                  className="px-2 py-1 text-xs font-medium text-stone-500 hover:text-stone-900 underline cursor-pointer"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Meal Combo Suggestion Strip */}
      {mealCombo && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BroccoliIcon className="w-5 h-5 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Thiết kế mâm cơm gợi ý cho {prefs.servings} người
              </h2>
              <span className="hidden sm:inline text-xs text-stone-500">
                · {mealCombo.isFullyReady ? 'Đủ nguyên liệu trong kho' : 'Cần mua bổ sung ít mục'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowMealCombo(!showMealCombo)}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {showMealCombo ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>

          {showMealCombo && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Món chính', item: mealCombo.mainDish },
                { label: 'Món canh', item: mealCombo.soupDish },
                { label: 'Món rau / gỏi ăn kèm', item: mealCombo.sideDish },
              ]
                .filter((slot): slot is { label: string; item: EvaluatedRecipe } => slot.item !== null)
                .map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => onSelectRecipe(slot.item)}
                    className="text-left p-3.5 rounded-lg border border-stone-200 hover:border-[#15803D] hover:bg-stone-50/70 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#15803D]">
                      {slot.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-stone-900 line-clamp-1">
                      {slot.item.recipe.name}
                    </div>
                    <div className="mt-1 text-xs text-stone-500">
                      {slot.item.recipe.method} ·{' '}
                      <span className="font-mono-num">{slot.item.totalMinutes}</span> phút ·{' '}
                      {slot.item.missingOrInsufficientCount === 0
                        ? 'Đủ nguyên liệu'
                        : `Thiếu ${slot.item.missingOrInsufficientCount} mục`}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
          <SproutPotIcon className="w-10 h-10 mx-auto" />
          <p className="text-base font-semibold text-stone-800">
            Chưa có công thức nào khớp hoàn toàn với tất cả bộ lọc đang chọn
          </p>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Bạn có thể nới lỏng bộ lọc thời gian, bỏ chọn bớt nguyên liệu ưu tiên hoặc tự thiết kế nhanh một món mới từ đồ đang có trong tủ lạnh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setDietaryFilter('all');
                setCuisineFilter('all');
                setMaxMinutes(0);
                setOnlyReady(false);
                setSelectedPriorityIds([]);
                setSearchQuery('');
              }}
              className="px-4 py-2 min-h-[40px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
            <button
              type="button"
              onClick={onOpenCustomRecipe}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tự thiết kế món mới</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((ev) => {
            const { recipe } = ev;
            const isReady = ev.missingOrInsufficientCount === 0;

            return (
              <article
                key={recipe.id}
                className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-stone-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-500">
                    <span className="font-medium text-stone-700">
                      {recipe.dietary === 'vegan' ? 'Thực vật (Chay)' : 'Món mặn'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {recipe.cuisine === 'vietnamese' ? 'Việt Nam' : 'Nước ngoài'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.method}</span>
                    {recipe.isCustom && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#15803D] font-medium">Tự thiết kế</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 leading-snug text-balance">
                    {recipe.name}
                  </h3>

                  <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
                    {recipe.subtitle}
                  </p>

                  <div className="pt-1 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      {isReady ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            Đủ nguyên liệu ({ev.availableCount}/{ev.matchedIngredients.length})
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Cần mua thêm {ev.missingOrInsufficientCount} mục ({ev.availableCount}/{ev.matchedIngredients.length} có sẵn)
                          </span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-stone-500 font-mono-num shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.totalMinutes}p
                      </span>
                    </div>

                    {ev.priorityFreshHits.length > 0 && (
                      <div className="text-amber-800">
                        Ưu tiên dùng:{' '}
                        <span className="font-medium">
                          {ev.priorityFreshHits.map((p) => p.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectRecipe(ev)}
                    className="flex-1 px-3.5 py-2 min-h-[42px] rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Xem công thức
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickCook(ev)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Đã nấu</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
