export type PantryCategory =
  | 'dry_spice'
  | 'liquid_spice'
  | 'dry_ingredient'
  | 'fresh_ingredient';

export type FreshnessPriority = 'use_now' | 'use_soon' | 'fresh';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: string;
  lowThreshold: number;
  priority?: FreshnessPriority;
  note?: string;
  updatedAt: string;
}

export type DietaryType = 'vegan' | 'non_vegan';

export type CuisineStyle = 'vietnamese' | 'international';

export type CookingMethod =
  | 'Hấp'
  | 'Luộc'
  | 'Áp chảo ít dầu'
  | 'Nấu canh'
  | 'Trộn / Gỏi'
  | 'Kho / Rim nhạt'
  | 'Xào nhanh ít dầu';

export interface RecipeIngredient {
  name: string;
  aliases?: string[];
  category: PantryCategory;
  amountPerServing: number;
  lowSodiumAmountPerServing?: number;
  unit: string;
  isSaltyOrOil?: 'salty' | 'oil';
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  subtitle: string;
  dietary: DietaryType;
  cuisine: CuisineStyle;
  method: CookingMethod;
  prepMinutes: number;
  cookMinutes: number;
  defaultServings: number;
  isLowOil: boolean;
  isLowSodiumFriendly: boolean;
  isQuick: boolean;
  lowSodiumTip: string;
  lowOilTip: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  isCustom?: boolean;
}

export interface FamilyPreferences {
  lowSodium: boolean;
  quickCook: boolean;
  lowOil: boolean;
  servings: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: string;
  checked: boolean;
  sourceRecipeName?: string;
  addedAt: string;
}

export interface UsedIngredientLog {
  name: string;
  amount: number;
  unit: string;
  pantryItemId?: string;
}

export interface CookHistoryEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  dietary: DietaryType;
  cuisine: CuisineStyle;
  method: CookingMethod;
  servings: number;
  cookedAt: string;
  lowSodiumApplied: boolean;
  lowOilApplied: boolean;
  usedIngredients: UsedIngredientLog[];
  checkinPhotos?: string[];
  memoryNote?: string;
}

export type AppTab = 'recipes' | 'pantry' | 'diet' | 'shopping' | 'history';

export type DayOfWeekKey =
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'
  | 'sun';

export interface DayMeals {
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

export interface BodyMetrics {
  weightKg: string;
  waistCm: string;
  upperBellyCm: string;
  lowerBellyCm: string;
  note?: string;
}

export interface DietWeekRecord {
  weekStart: string; // YYYY-MM-DD (Monday)
  days: Record<DayOfWeekKey, DayMeals>;
  metrics: BodyMetrics;
  updatedAt: string;
}

export interface WifeDietProfile {
  heightCm: string;
  targetWeightKg: string;
}

export const DAY_LABELS: { key: DayOfWeekKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Thứ 2', short: 'T2' },
  { key: 'tue', label: 'Thứ 3', short: 'T3' },
  { key: 'wed', label: 'Thứ 4', short: 'T4' },
  { key: 'thu', label: 'Thứ 5', short: 'T5' },
  { key: 'fri', label: 'Thứ 6', short: 'T6' },
  { key: 'sat', label: 'Thứ 7', short: 'T7' },
  { key: 'sun', label: 'Chủ nhật', short: 'CN' },
];

export const CATEGORY_LABELS: Record<PantryCategory, string> = {
  dry_spice: 'Gia vị khô',
  liquid_spice: 'Gia vị lỏng / nước',
  dry_ingredient: 'Nguyên liệu khô',
  fresh_ingredient: 'Nguyên liệu tươi',
};

export const PRIORITY_LABELS: Record<FreshnessPriority, string> = {
  use_now: 'Dùng ngay (Sắp hết hạn)',
  use_soon: 'Ưu tiên dùng sớm',
  fresh: 'Tươi mới',
};
