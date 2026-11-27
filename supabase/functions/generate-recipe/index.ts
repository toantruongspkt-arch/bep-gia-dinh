// supabase/functions/generate-recipe/index.ts
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type CuisineStyle =
  | "auto_global"
  | "vietnamese"
  | "western"
  | "east_asian"
  | "southeast_asian"
  | "south_asian_middle_eastern";

export interface CustomRecipeRequest {
  category:
    | "mon_an"
    | "gia_vi_uop"
    | "nuoc_sot_cham"
    | "do_uong_sinh_to"
    | "lam_banh"
    | "rau_cu_ngam_chua";
  cuisineStyle?: CuisineStyle;
  selectedIngredients: string[];
  customIngredients: string[];
  prepTime: string;
  tasteStyle: string;
  flavors: {
    sour: number;  // 0 - 3
    spicy: number; // 0 - 3
    salty: number; // 0 - 3
    sweet: number; // 0 - 3
  };
  extraNotes?: string;
}

export interface RecipeVariant {
  title: string;
  summary: string;
  ingredients: string[];
  steps: string[];
  substitutions: { missingOrItem: string; replacement: string; note: string }[];
}

export interface CustomRecipeResult {
  id: string;
  createdAt: string;
  category: CustomRecipeRequest["category"];
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

const cuisineLabelMap: Record<CuisineStyle, string> = {
  auto_global:
    "Đa dạng ẩm thực thế giới (tự do chọn phong cách phù hợp nhất từ Việt Nam, Âu, Nhật, Hàn, Trung Hoa, Đông Nam Á, Địa Trung Hải, Ấn Độ...)",
  vietnamese: "Ẩm thực Việt Nam",
  western: "Ẩm thực phương Tây (Âu, Ý, Pháp, Địa Trung Hải...)",
  east_asian: "Ẩm thực Đông Á (Nhật Bản, Hàn Quốc, Trung Hoa...)",
  southeast_asian: "Ẩm thực Đông Nam Á (Thái Lan, Indonesia, Malaysia...)",
  south_asian_middle_eastern: "Ẩm thực Nam Á & Trung Đông (Ấn Độ, Levant, Trung Đông...)",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CustomRecipeRequest;
    const allIngredients = Array.from(
      new Set([
        ...(body.selectedIngredients || []),
        ...(body.customIngredients || []),
      ].map((s) => s.trim()).filter(Boolean))
    );

    if (allIngredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Vui lòng nhập hoặc chọn ít nhất 1 nguyên liệu." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const selectedCuisine: CuisineStyle = body.cuisineStyle || "auto_global";

    const prompt = `
Bạn là đầu bếp đa quốc gia & chuyên gia ẩm thực thế giới am hiểu sâu sắc cả ẩm thực truyền thống lẫn hiện đại từ Á, Âu, Địa Trung Hải, Trung Đông, châu Mỹ đến Việt Nam. Hãy thiết kế công thức chuẩn xác, thực tế, dễ áp dụng tại căn bếp gia đình dựa trên thông tin sau:
- Danh mục thành phẩm: ${body.category}
- Nền / phong cách ẩm thực: ${cuisineLabelMap[selectedCuisine]}
- Nguyên liệu & gia vị hiện có: ${allIngredients.join(", ")}
- Thời gian thực hiện mong muốn: ${body.prepTime}
- Khẩu vị / chế độ: ${body.tasteStyle}
- Mức độ vị (0=Không/Rất nhẹ, 1=Nhẹ, 2=Vừa, 3=Đậm): Chua=${body.flavors.sour}, Cay=${body.flavors.spicy}, Mặn=${body.flavors.salty}, Ngọt=${body.flavors.sweet}
- Ghi chú thêm: ${body.extraNotes || "Không có"}

Yêu cầu bắt buộc:
1. Nếu phong cách là "auto_global", hãy chọn nền ẩm thực phù hợp nhất với bộ nguyên liệu/mức vị hiện có để người dùng có trải nghiệm phong phú.
2. Đưa ra "standardRecipe" (công thức chuẩn, định lượng rõ ràng, các bước làm tuần tự, mẹo chỉnh vị theo mức chua-cay-mặn-ngọt và thời gian).
3. Dựa trên CÙNG danh sách nguyên liệu đầu vào, thiết kế song song:
   - "savoryVersion" (phong cách Mặn): giữ nét đậm đà đặc trưng của nền ẩm thực đã chọn, kèm gợi ý nguyên liệu thay thế hợp lý.
   - "veganVersion" (phong cách Chay): chuyển đổi sang thuần chay hợp lý, giữ tinh thần thành phẩm, kèm gợi ý nguyên liệu thay thế tương ứng.
4. Chỉ trả về JSON hợp lệ theo đúng cấu trúc yêu cầu, không bọc markdown \`\`\`.
`;

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        dishName: { type: "STRING" },
        tasteProfileLabel: { type: "STRING" },
        standardRecipe: {
          type: "OBJECT",
          properties: {
            ingredients: { type: "ARRAY", items: { type: "STRING" } },
            steps: { type: "ARRAY", items: { type: "STRING" } },
            tips: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["ingredients", "steps", "tips"],
        },
        savoryVersion: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            summary: { type: "STRING" },
            ingredients: { type: "ARRAY", items: { type: "STRING" } },
            steps: { type: "ARRAY", items: { type: "STRING" } },
            substitutions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  missingOrItem: { type: "STRING" },
                  replacement: { type: "STRING" },
                  note: { type: "STRING" },
                },
                required: ["missingOrItem", "replacement", "note"],
              },
            },
          },
          required: ["title", "summary", "ingredients", "steps", "substitutions"],
        },
        veganVersion: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            summary: { type: "STRING" },
            ingredients: { type: "ARRAY", items: { type: "STRING" } },
            steps: { type: "ARRAY", items: { type: "STRING" } },
            substitutions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  missingOrItem: { type: "STRING" },
                  replacement: { type: "STRING" },
                  note: { type: "STRING" },
                },
                required: ["missingOrItem", "replacement", "note"],
              },
            },
          },
          required: ["title", "summary", "ingredients", "steps", "substitutions"],
        },
      },
      required: ["dishName", "tasteProfileLabel", "standardRecipe", "savoryVersion", "veganVersion"],
    };

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.75,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Gemini API error", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    const result: CustomRecipeResult = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      category: body.category,
      cuisineStyle: selectedCuisine,
      prepTime: body.prepTime,
      ...parsed,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
