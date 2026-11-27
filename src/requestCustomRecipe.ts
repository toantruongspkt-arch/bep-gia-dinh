export type CuisineStyle =
  | "auto_global"
  | "vietnamese"
  | "western"
  | "east_asian"
  | "southeast_asian"
  | "south_asian_middle_eastern";

export type RecipeCategory =
  | "mon_an"
  | "gia_vi_uop"
  | "nuoc_sot_cham"
  | "do_uong_sinh_to"
  | "lam_banh"
  | "rau_cu_ngam_chua";

export interface CustomRecipeRequest {
  category: RecipeCategory;
  cuisineStyle?: CuisineStyle;
  selectedIngredients: string[];
  customIngredients: string[];
  prepTime: string;
  tasteStyle: string;
  flavors: {
    sour: number;
    spicy: number;
    salty: number;
    sweet: number;
  };
  extraNotes?: string;
}

export interface RecipeVariant {
  title: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  substitutions: {
    missingOrItem: string;
    replacement: string;
    note: string;
  }[];
}

export interface CustomRecipeResult {
  id: string;
  createdAt: string;
  category: RecipeCategory;
  cuisineStyle: CuisineStyle;
  dishName: string;
  prepTime: string;
  tasteProfileLabel: string;
  standardRecipe: {
    ingredients: string[];
    steps: string[];
    tips: string[];
  };
  savoryVersion: RecipeVariant;
  veganVersion: RecipeVariant;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function requestCustomRecipe(
  payload: CustomRecipeRequest
): Promise<CustomRecipeResult> {
  const endpoint = `${SUPABASE_URL}/functions/v1/generate-recipe`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Không thể tạo công thức (HTTP ${res.status})`);
  }

  return (await res.json()) as CustomRecipeResult;
}
