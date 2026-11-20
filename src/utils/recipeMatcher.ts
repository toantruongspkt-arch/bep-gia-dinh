import {
  FamilyPreferences,
  PantryItem,
  Recipe,
  RecipeIngredient,
} from '../types';
import { convertUnit, normalizeVi } from './units';

export interface MatchedIngredient {
  ingredient: RecipeIngredient;
  requiredAmount: number;
  pantryItem: PantryItem | null;
  availableInRecipeUnit: number | null;
  status: 'available' | 'insufficient' | 'missing';
}

export interface EvaluatedRecipe {
  recipe: Recipe;
  totalMinutes: number;
  matchedIngredients: MatchedIngredient[];
  availableCount: number;
  missingOrInsufficientCount: number;
  readinessPercent: number;
  priorityFreshHits: PantryItem[];
  matchesSelectedPriorityIds: boolean;
}

export function findPantryMatch(
  ingredient: RecipeIngredient,
  pantry: PantryItem[]
): PantryItem | null {
  const targetNames = [
    ingredient.name,
    ...(ingredient.aliases || []),
  ].map(normalizeVi);

  // Exact normalized match first
  for (const item of pantry) {
    const itemNorm = normalizeVi(item.name);
    if (targetNames.includes(itemNorm)) {
      return item;
    }
  }

  // Partial token containment fallback (e.g., "nước tương" matches "Nước tương (Xì dầu)")
  for (const item of pantry) {
    const itemNorm = normalizeVi(item.name);
    for (const target of targetNames) {
      if (
        (itemNorm.includes(target) && target.length >= 4) ||
        (target.includes(itemNorm) && itemNorm.length >= 4)
      ) {
        return item;
      }
    }
  }

  return null;
}

export function getEffectiveAmountPerServing(
  ing: RecipeIngredient,
  lowSodium: boolean
): number {
  if (lowSodium && typeof ing.lowSodiumAmountPerServing === 'number') {
    return ing.lowSodiumAmountPerServing;
  }
  return ing.amountPerServing;
}

export function evaluateRecipe(
  recipe: Recipe,
  pantry: PantryItem[],
  prefs: FamilyPreferences,
  selectedPriorityIds: string[] = []
): EvaluatedRecipe {
  const matchedIngredients: MatchedIngredient[] = recipe.ingredients.map(
    (ing) => {
      const perServing = getEffectiveAmountPerServing(ing, prefs.lowSodium);
      const requiredAmount = Math.round(perServing * prefs.servings * 100) / 100;
      const pantryItem = findPantryMatch(ing, pantry);

      if (!pantryItem || pantryItem.quantity <= 0) {
        return {
          ingredient: ing,
          requiredAmount,
          pantryItem: pantryItem ?? null,
          availableInRecipeUnit: pantryItem ? 0 : null,
          status: 'missing',
        };
      }

      const converted = convertUnit(
        pantryItem.quantity,
        pantryItem.unit,
        ing.unit
      );

      if (converted === null) {
        // Different non-convertible units but item is in stock > 0
        return {
          ingredient: ing,
          requiredAmount,
          pantryItem,
          availableInRecipeUnit: null,
          status: 'available',
        };
      }

      const status =
        converted + 0.001 >= requiredAmount ? 'available' : 'insufficient';

      return {
        ingredient: ing,
        requiredAmount,
        pantryItem,
        availableInRecipeUnit: Math.round(converted * 100) / 100,
        status,
      };
    }
  );

  const availableCount = matchedIngredients.filter(
    (m) => m.status === 'available'
  ).length;
  const missingOrInsufficientCount =
    matchedIngredients.length - availableCount;
  const readinessPercent =
    matchedIngredients.length > 0
      ? Math.round((availableCount / matchedIngredients.length) * 100)
      : 100;

  const priorityFreshHits = matchedIngredients
    .filter(
      (m) =>
        m.status === 'available' &&
        m.pantryItem &&
        m.pantryItem.category === 'fresh_ingredient' &&
        (m.pantryItem.priority === 'use_now' ||
          m.pantryItem.priority === 'use_soon')
    )
    .map((m) => m.pantryItem!);

  const matchesSelectedPriorityIds =
    selectedPriorityIds.length === 0 ||
    selectedPriorityIds.every((id) =>
      matchedIngredients.some(
        (m) => m.pantryItem?.id === id && m.pantryItem.quantity > 0
      )
    );

  return {
    recipe,
    totalMinutes: recipe.prepMinutes + recipe.cookMinutes,
    matchedIngredients,
    availableCount,
    missingOrInsufficientCount,
    readinessPercent,
    priorityFreshHits,
    matchesSelectedPriorityIds,
  };
}

export interface DesignedMealCombo {
  mainDish: EvaluatedRecipe | null;
  soupDish: EvaluatedRecipe | null;
  sideDish: EvaluatedRecipe | null;
  totalMinutes: number;
  isFullyReady: boolean;
}

export function suggestMealCombo(
  evaluatedList: EvaluatedRecipe[]
): DesignedMealCombo | null {
  if (evaluatedList.length === 0) return null;

  const sorted = [...evaluatedList].sort((a, b) => {
    if (a.missingOrInsufficientCount !== b.missingOrInsufficientCount) {
      return a.missingOrInsufficientCount - b.missingOrInsufficientCount;
    }
    if (a.priorityFreshHits.length !== b.priorityFreshHits.length) {
      return b.priorityFreshHits.length - a.priorityFreshHits.length;
    }
    return a.totalMinutes - b.totalMinutes;
  });

  const soupDish =
    sorted.find((e) => e.recipe.method === 'Nấu canh') ?? null;

  const sideDish =
    sorted.find(
      (e) =>
        e.recipe.id !== soupDish?.recipe.id &&
        (e.recipe.method === 'Trộn / Gỏi' ||
          (e.recipe.method === 'Hấp' && e.recipe.dietary === 'vegan'))
    ) ?? null;

  const mainDish =
    sorted.find(
      (e) =>
        e.recipe.id !== soupDish?.recipe.id &&
        e.recipe.id !== sideDish?.recipe.id
    ) ?? sorted[0] ?? null;

  const chosen = [mainDish, soupDish, sideDish].filter(
    (x): x is EvaluatedRecipe => x !== null
  );
  if (chosen.length === 0) return null;

  const totalMinutes = chosen.reduce(
    (max, item) => Math.max(max, item.totalMinutes),
    0
  );
  const isFullyReady = chosen.every((c) => c.missingOrInsufficientCount === 0);

  return {
    mainDish,
    soupDish,
    sideDish,
    totalMinutes,
    isFullyReady,
  };
}
