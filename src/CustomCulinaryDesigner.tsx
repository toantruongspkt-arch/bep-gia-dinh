import {
  requestCustomRecipe,
  type CuisineStyle,
  type CustomRecipeRequest,
  type CustomRecipeResult,
  type RecipeVariant,
} from "./requestCustomRecipe";

interface Props {
  pantryItems: string[];
  onSaveToHistory: (recipe: CustomRecipeResult) => void;
}

const CATEGORIES: { value: CustomRecipeRequest["category"]; label: string }[] = [
  { value: "mon_an", label: "Món ăn" },
  { value: "gia_vi_uop", label: "Gia vị ướp" },
  { value: "nuoc_sot_cham", label: "Nước sốt / Nước chấm" },
  { value: "do_uong_sinh_to", label: "Đồ uống / Sinh tố" },
  { value: "lam_banh", label: "Làm bánh" },
  { value: "rau_cu_ngam_chua", label: "Rau củ ngâm chua" },
];

const CUISINE_OPTIONS: { value: CuisineStyle; shortLabel: string }[] = [
  { value: "auto_global", shortLabel: "Tự do thế giới" },
  { value: "vietnamese", shortLabel: "Việt Nam" },
  { value: "western", shortLabel: "Âu / Địa Trung Hải" },
  { value: "east_asian", shortLabel: "Nhật - Hàn - Trung" },
  { value: "southeast_asian", shortLabel: "Đông Nam Á" },
  { value: "south_asian_middle_eastern", shortLabel: "Ấn Độ - Trung Đông" },
];

const FLAVOR_LEVELS = ["Nhạt/Ít", "Nhẹ", "Vừa", "Đậm"];

export const CustomCulinaryDesigner: React.FC<Props> = ({
  pantryItems,
  onSaveToHistory,
}) => {
  const [category, setCategory] = useState<CustomRecipeRequest["category"]>("mon_an");
  const [cuisineStyle, setCuisineStyle] = useState<CuisineStyle>("auto_global");
  const [isCuisinePickerOpen, setIsCuisinePickerOpen] = useState(false);
  const [isSwitchCuisineOpen, setIsSwitchCuisineOpen] = useState(false);

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState("20-30 phút");
  const [tasteStyle, setTasteStyle] = useState("Cân bằng gia đình, ít dầu mỡ");
  const [flavors, setFlavors] = useState({
    sour: 1,
    spicy: 1,
    salty: 2,
    sweet: 1,
  });
  const [extraNotes, setExtraNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomRecipeResult | null>(null);
  const [styleTab, setStyleTab] = useState<"savory" | "vegan">("savory");
  const [savedNotice, setSavedNotice] = useState(false);

  const currentCuisine =
    CUISINE_OPTIONS.find((c) => c.value === cuisineStyle) || CUISINE_OPTIONS[0];

  const togglePantryItem = (item: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleAddCustom = () => {
    const parts = customInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      setCustomIngredients((prev) => Array.from(new Set([...prev, ...parts])));
      setCustomInput("");
    }
  };

  const runGenerate = async (overrideCuisine?: CuisineStyle) => {
    const targetCuisine = overrideCuisine ?? cuisineStyle;
    setError(null);
    setSavedNotice(false);
    setIsSwitchCuisineOpen(false);
    setLoading(true);
    try {
      const data = await requestCustomRecipe({
        category,
        cuisineStyle: targetCuisine,
        selectedIngredients,
        customIngredients,
        prepTime,
        tasteStyle,
        flavors,
        extraNotes,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTargetCuisine = async (nextCuisine: CuisineStyle) => {
    setCuisineStyle(nextCuisine);
    await runGenerate(nextCuisine);
  };

  const handleSave = () => {
    if (!result) return;
    onSaveToHistory(result);
    setSavedNotice(true);
  };

  const activeVariant: RecipeVariant | null = result
    ? styleTab === "savory"
      ? result.savoryVersion
      : result.veganVersion
    : null;

  return (
    <div className="space-y-5 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Tự thiết kế món / Sốt / Đồ uống / Làm bánh / Ngâm chua
          </h3>
          <p className="text-sm text-slate-500">
            Ẩm thực đa quốc gia · Công thức chuẩn · Song song Mặn & Chay · Gợi ý nguyên liệu thay thế.
          </p>
        </div>

        {/* Nút rút gọn nền ẩm thực — bấm vào mới mở */}
        <div>
          <button
            type="button"
            onClick={() => setIsCuisinePickerOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
          >
            <span>Ẩm thực: {currentCuisine.shortLabel}</span>
            <span>{isCuisinePickerOpen ? "▴" : "▾"}</span>
          </button>

          {isCuisinePickerOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              {CUISINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCuisineStyle(opt.value);
                    setIsCuisinePickerOpen(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    cuisineStyle === opt.value
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danh mục thành phẩm */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category === c.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Chọn từ kho bếp */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Chọn nhanh từ kho bếp ({selectedIngredients.length} đã chọn)
        </label>
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          {pantryItems.map((item) => {
            const active = selectedIngredients.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => togglePantryItem(item)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nhập tự do nguyên liệu / gia vị */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Nhập tự do thêm nguyên liệu / gia vị (cách nhau bởi dấu phẩy)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
            placeholder="Ví dụ: sả ớt, mật ong, bột bắp, chanh dây..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Thêm
          </button>
        </div>
        {customIngredients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {customIngredients.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900"
              >
                {item}
                <button
                  type="button"
                  onClick={() =>
                    setCustomIngredients((prev) => prev.filter((x) => x !== item))
                  }
                  className="font-bold text-amber-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Thời gian & khẩu vị */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Thời gian thực hiện
          </label>
          <select
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Dưới 10 phút">Dưới 10 phút (nhanh / pha chế / trộn)</option>
            <option value="15-20 phút">15–20 phút</option>
            <option value="20-30 phút">20–30 phút</option>
            <option value="45-60 phút">45–60 phút (hầm / nướng / làm bánh)</option>
            <option value="Ngâm / ủ nhiều giờ hoặc qua đêm">Ngâm / ủ nhiều giờ hoặc qua đêm</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Khẩu vị / chế độ
          </label>
          <input
            type="text"
            value={tasteStyle}
            onChange={(e) => setTasteStyle(e.target.value)}
            placeholder="Ví dụ: Ăn nhạt, ít dầu, hợp người lớn tuổi..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 4 mức vị: Chua - Cay - Mặn - Ngọt */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["sour", "Chua"],
            ["spicy", "Cay"],
            ["salty", "Mặn"],
            ["sweet", "Ngọt"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-xl border border-slate-200 p-2.5">
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
              <span>{label}</span>
              <span className="text-emerald-700">{FLAVOR_LEVELS[flavors[key]]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={flavors[key]}
              onChange={(e) =>
                setFlavors((prev) => ({ ...prev, [key]: Number(e.target.value) }))
              }
              className="w-full accent-emerald-600"
            />
          </div>
        ))}
      </div>

      <input
        type="text"
        value={extraNotes}
        onChange={(e) => setExtraNotes(e.target.value)}
        placeholder="Yêu cầu thêm (tùy chọn): ví dụ làm sốt chấm hải sản, bánh không lò nướng..."
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => runGenerate()}
        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "AI đang thiết kế công thức..." : "Thiết kế công thức chuẩn (Mặn & Chay)"}
      </button>

      {/* Kết quả + Lựa chọn đích danh nước khác + Lưu vào Lịch sử */}
      {result && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">{result.dishName}</h4>
              <p className="text-xs text-slate-600">
                {currentCuisine.shortLabel} · {result.prepTime} · {result.tasteProfileLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsSwitchCuisineOpen((prev) => !prev)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              >
                {loading ? "Đang đổi..." : "Đổi sang phong cách nước khác"}
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
              >
                {savedNotice ? "Đã lưu vào Lịch sử ✓" : "Lưu vào Lịch sử"}
              </button>
            </div>
          </div>

          {/* Dải nút chọn đích danh nước khác khi bấm nút đổi */}
          {isSwitchCuisineOpen && (
            <div className="rounded-xl border border-emerald-200 bg-white p-3">
              <div className="mb-2 text-xs font-bold text-slate-700">
                Chọn nền ẩm thực muốn thử từ cùng bộ nguyên liệu:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CUISINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectTargetCuisine(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      cuisineStyle === opt.value
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-emerald-50"
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Công thức chuẩn */}
          <div className="rounded-xl bg-white p-3.5 shadow-xs">
            <div className="mb-2 text-sm font-bold text-emerald-800">Công thức chuẩn</div>
            <div className="mb-2 text-xs font-semibold text-slate-700">Nguyên liệu & định lượng:</div>
            <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.standardRecipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
            <div className="mb-1 text-xs font-semibold text-slate-700">Các bước thực hiện:</div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {result.standardRecipe.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
          </div>

          {/* Mặn / Chay + Nguyên liệu thay thế */}
          <div className="rounded-xl bg-white p-3.5 shadow-xs">
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStyleTab("savory")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  styleTab === "savory"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Phong cách Mặn
              </button>
              <button
                type="button"
                onClick={() => setStyleTab("vegan")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  styleTab === "vegan"
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                Phong cách Chay
              </button>
            </div>

            {activeVariant && (
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <div className="font-bold text-slate-900">{activeVariant.title}</div>
                  <p className="text-xs text-slate-600">{activeVariant.summary}</p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-800">Cách làm theo phong cách này:</div>
                  <ol className="mt-1 list-decimal space-y-1 pl-5">
                    {activeVariant.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>

                {activeVariant.substitutions.length > 0 && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                    <div className="mb-1 text-xs font-bold text-emerald-900">
                      Nguyên liệu thay thế gợi ý:
                    </div>
                    <ul className="space-y-1 text-xs text-emerald-950">
                      {activeVariant.substitutions.map((sub, idx) => (
                        <li key={idx}>
                          <strong>{sub.missingOrItem}</strong> → <strong>{sub.replacement}</strong> ({sub.note})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
