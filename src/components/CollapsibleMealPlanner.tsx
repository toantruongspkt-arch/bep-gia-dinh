import { useState } from "react";

interface Props {
  maleCount: number;
  femaleCount: number;
  onChangeCounts: (nextMale: number, nextFemale: number, effectiveServings: number) => void;
  summaryText?: string;
}

export const CollapsibleMealPlanner: React.FC<Props> = ({
  maleCount,
  femaleCount,
  onChangeCounts,
  summaryText = "Cần mua bổ sung ít mục",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Hệ số khẩu phần tham khảo: Nam ~ 1.15 phần, Nữ ~ 0.85 phần (tối thiểu 1 người)
  const calcServings = (m: number, f: number) => {
    const totalPeople = Math.max(1, m + f);
    const weighted = m * 1.15 + f * 0.85;
    return Math.max(1, Math.round(weighted * 10) / 10 || totalPeople);
  };

  const updateMale = (delta: number) => {
    const nextM = Math.max(0, Math.min(20, maleCount + delta));
    const nextF = nextM === 0 && femaleCount === 0 ? 1 : femaleCount;
    onChangeCounts(nextM, nextF, calcServings(nextM, nextF));
  };

  const updateFemale = (delta: number) => {
    const nextF = Math.max(0, Math.min(20, femaleCount + delta));
    const nextM = maleCount === 0 && nextF === 0 ? 1 : maleCount;
    onChangeCounts(nextM, nextF, calcServings(nextM, nextF));
  };

  const totalPeople = maleCount + femaleCount;
  const effectiveServings = calcServings(maleCount, femaleCount);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="font-bold text-slate-900">
            Thiết kế mâm cơm gợi ý cho {totalPeople} người ({maleCount} nam · {femaleCount} nữ)
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">{summaryText}</span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-700">
          {isOpen ? "Thu gọn ▴" : "Mở rộng ▾"}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-h-72 space-y-3 overflow-y-auto scroll-smooth border-t border-slate-100 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-800 sm:text-sm">Số người Nam</div>
                  <div className="text-[11px] text-slate-500">Khẩu phần chuẩn ~1.15x</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateMale(-1)}
                    className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900">
                    {maleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateMale(1)}
                    className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-800 sm:text-sm">Số người Nữ</div>
                  <div className="text-[11px] text-slate-500">Khẩu phần chuẩn ~0.85x</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateFemale(-1)}
                    className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900">
                    {femaleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateFemale(1)}
                    className="h-7 w-7 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50/70 px-3.5 py-2 text-xs text-emerald-950">
              Tổng: <strong>{totalPeople} người</strong> ({maleCount} nam, {femaleCount} nữ) — quy đổi{" "}
              <strong>{effectiveServings} khẩu phần tiêu chuẩn</strong> để cân đối lượng món & nguyên liệu.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
