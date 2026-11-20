import {
  CookHistoryEntry,
  DayMeals,
  DayOfWeekKey,
  DietWeekRecord,
  FamilyPreferences,
  PantryItem,
  Recipe,
  ShoppingItem,
  WifeDietProfile,
} from '../types';
import { INITIAL_PANTRY_ITEMS } from '../data/initialPantry';

const KEYS = {
  PANTRY: 'bepgon_pantry_v1',
  SHOPPING: 'bepgon_shopping_v1',
  HISTORY: 'bepgon_history_v1',
  CUSTOM_RECIPES: 'bepgon_custom_recipes_v1',
  PREFS: 'bepgon_prefs_v1',
  DIET_WEEKS: 'bepgon_diet_weeks_v1',
  DIET_PROFILE: 'bepgon_diet_profile_v1',
};

export const DEFAULT_PREFS: FamilyPreferences = {
  lowSodium: true,
  quickCook: true,
  lowOil: true,
  servings: 2,
};

export const DEFAULT_WIFE_PROFILE: WifeDietProfile = {
  heightCm: '158',
  targetWeightKg: '50',
};

export function getMondayIso(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

export function createEmptyDayMeals(): DayMeals {
  return { breakfast: '', lunch: '', snack: '', dinner: '' };
}

export function createEmptyDietWeek(weekStart: string): DietWeekRecord {
  const days: Record<DayOfWeekKey, DayMeals> = {
    mon: createEmptyDayMeals(),
    tue: createEmptyDayMeals(),
    wed: createEmptyDayMeals(),
    thu: createEmptyDayMeals(),
    fri: createEmptyDayMeals(),
    sat: createEmptyDayMeals(),
    sun: createEmptyDayMeals(),
  };
  return {
    weekStart,
    days,
    metrics: {
      weightKg: '',
      waistCm: '',
      upperBellyCm: '',
      lowerBellyCm: '',
      note: '',
    },
    updatedAt: new Date().toISOString(),
  };
}

function buildInitialDietWeeks(): DietWeekRecord[] {
  const currentMonday = getMondayIso(new Date());
  const sample = createEmptyDietWeek(currentMonday);
  sample.days.mon = {
    breakfast: 'Yến mạch nấu sữa hạt + 1 quả trứng luộc',
    lunch: 'Ức gà áp chảo ít dầu + bông cải xanh hấp + 1/2 chén cơm gạo lứt',
    snack: '1 quả táo nhỏ hoặc hạt hạnh nhân không muối',
    dinner: 'Đậu hũ non hấp nấm hương + canh cải thìa nhạt',
  };
  sample.days.tue = {
    breakfast: 'Khoai lang luộc + 1 ly sữa đậu nành không đường',
    lunch: 'Cá basa hấp gừng hành + cà rốt hấp sốt dầu mè',
    snack: '1 hũ sữa chua không đường',
    dinner: 'Miến trộn rau củ & nấm đùi gà (ít dầu, nhạt)',
  };
  sample.metrics = {
    weightKg: '54.5',
    waistCm: '70',
    upperBellyCm: '74',
    lowerBellyCm: '82',
    note: 'Tuần bắt đầu theo dõi thực đơn nhạt ít dầu mỡ',
  };
  return [sample];
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function loadPantry(): PantryItem[] {
  const stored = safeRead<PantryItem[] | null>(KEYS.PANTRY, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    safeWrite(KEYS.PANTRY, INITIAL_PANTRY_ITEMS);
    return INITIAL_PANTRY_ITEMS;
  }
  return stored;
}

export function savePantry(items: PantryItem[]): void {
  safeWrite(KEYS.PANTRY, items);
}

export function loadShoppingList(): ShoppingItem[] {
  return safeRead<ShoppingItem[]>(KEYS.SHOPPING, []);
}

export function saveShoppingList(items: ShoppingItem[]): void {
  safeWrite(KEYS.SHOPPING, items);
}

export function loadHistory(): CookHistoryEntry[] {
  return safeRead<CookHistoryEntry[]>(KEYS.HISTORY, []);
}

export function saveHistory(entries: CookHistoryEntry[]): void {
  safeWrite(KEYS.HISTORY, entries);
}

export function loadCustomRecipes(): Recipe[] {
  return safeRead<Recipe[]>(KEYS.CUSTOM_RECIPES, []);
}

export function saveCustomRecipes(recipes: Recipe[]): void {
  safeWrite(KEYS.CUSTOM_RECIPES, recipes);
}

export function loadPrefs(): FamilyPreferences {
  const stored = safeRead<Partial<FamilyPreferences>>(KEYS.PREFS, {});
  return { ...DEFAULT_PREFS, ...stored };
}

export function savePrefs(prefs: FamilyPreferences): void {
  safeWrite(KEYS.PREFS, prefs);
}

export function loadDietWeeks(): DietWeekRecord[] {
  const stored = safeRead<DietWeekRecord[] | null>(KEYS.DIET_WEEKS, null);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    const init = buildInitialDietWeeks();
    safeWrite(KEYS.DIET_WEEKS, init);
    return init;
  }
  return stored;
}

export function saveDietWeeks(weeks: DietWeekRecord[]): void {
  safeWrite(KEYS.DIET_WEEKS, weeks);
}

export function loadWifeProfile(): WifeDietProfile {
  const stored = safeRead<Partial<WifeDietProfile>>(KEYS.DIET_PROFILE, {});
  return { ...DEFAULT_WIFE_PROFILE, ...stored };
}

export function saveWifeProfile(profile: WifeDietProfile): void {
  safeWrite(KEYS.DIET_PROFILE, profile);
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  history: CookHistoryEntry[];
  customRecipes: Recipe[];
  preferences: FamilyPreferences;
  dietWeeks?: DietWeekRecord[];
  wifeProfile?: WifeDietProfile;
}

export function buildBackupPayload(data: {
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  history: CookHistoryEntry[];
  customRecipes: Recipe[];
  preferences: FamilyPreferences;
  dietWeeks: DietWeekRecord[];
  wifeProfile: WifeDietProfile;
}): BackupPayload {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

export function parseBackupPayload(rawText: string): BackupPayload | null {
  try {
    const parsed = JSON.parse(rawText) as Partial<BackupPayload>;
    if (!parsed || !Array.isArray(parsed.pantry)) {
      return null;
    }
    return {
      version: parsed.version ?? 1,
      exportedAt: parsed.exportedAt ?? new Date().toISOString(),
      pantry: parsed.pantry,
      shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      customRecipes: Array.isArray(parsed.customRecipes) ? parsed.customRecipes : [],
      preferences: parsed.preferences
        ? { ...DEFAULT_PREFS, ...parsed.preferences }
        : DEFAULT_PREFS,
      dietWeeks: Array.isArray(parsed.dietWeeks) ? parsed.dietWeeks : undefined,
      wifeProfile: parsed.wifeProfile
        ? { ...DEFAULT_WIFE_PROFILE, ...parsed.wifeProfile }
        : undefined,
    };
  } catch {
    return null;
  }
}
