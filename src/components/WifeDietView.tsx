import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  BodyMetrics,
  DAY_LABELS,
  DayMeals,
  DayOfWeekKey,
  DietWeekRecord,
  Recipe,
  WifeDietProfile,
} from '../types';
import { createEmptyDietWeek, getMondayIso } from '../utils/storage';
import { AvocadoIcon } from './VeggieIcons';

interface WifeDietViewProps {
  weeks: DietWeekRecord[];
  profile: WifeDietProfile;
  recipes: Recipe[];
  onUpdateProfile: (patch: Partial<WifeDietProfile>) => void;
  onUpsertWeek: (week: DietWeekRecord) => void;
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function formatViShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function formatViDayHeader(weekStart: string, dayOffset: number): string {
  const iso = addDaysIso(weekStart, dayOffset);
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function calculateBmi(weightStr: string, heightStr: string): number | null {
  const w = parseFloat(weightStr);
  const h = parseFloat(heightStr);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 50) {
    return null;
  }
  const hm = h / 100;
  return Math.round((w / (hm * hm)) * 10) / 10;
}

function getBmiAssessment(bmi: number | null): {
  label: string;
  toneClass: string;
} {
  if (bmi === null) {
    return {
      label: 'Nhập chiều cao & cân nặng để tính BMI',
      toneClass: 'text-stone-500',
    };
  }
  if (bmi < 18.5) {
    return {
      label: 'Thiếu cân (< 18.5)',
      toneClass: 'text-amber-700',
    };
  }
  if (bmi < 23) {
    return {
      label: 'Cân đối chuẩn châu Á (18.5 – 22.9)',
      toneClass: 'text-[#15803D]',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Thừa cân nhẹ (23.0 – 24.9)',
      toneClass: 'text-amber-700',
    };
  }
  return {
    label: 'Cần giảm cân (≥ 25.0)',
    toneClass: 'text-red-700',
  };
}

function formatDelta(current: string, prev: string, unit: string): string | null {
  const c = parseFloat(current);
  const p = parseFloat(prev);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
  const diff = Math.round((c - p) * 10) / 10;
  if (diff === 0) return `0 ${unit}`;
  return `${diff > 0 ? '+' : ''}${diff} ${unit}`;
}

export const WifeDietView: React.FC<WifeDietViewProps> = ({
  weeks,
  profile,
  recipes,
  onUpdateProfile,
  onUpsertWeek,
}) => {
  const defaultMonday = getMondayIso(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(() => {
    const hasDefault = weeks.some((w) => w.weekStart === defaultMonday);
    if (hasDefault) return defaultMonday;
    return weeks[0]?.weekStart ?? defaultMonday;
  });

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<DayOfWeekKey>('mon');
  const [quickPickTarget, setQuickPickTarget] = useState<{
    day: DayOfWeekKey;
    meal: keyof DayMeals;
  } | null>(null);

  const currentWeek: DietWeekRecord = useMemo(() => {
    return (
      weeks.find((w) => w.weekStart === selectedWeekStart) ??
      createEmptyDietWeek(selectedWeekStart)
    );
  }, [weeks, selectedWeekStart]);

  const sortedWeeksDesc = useMemo(
    () => [...weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart)),
    [weeks]
  );

  const previousWeek = useMemo(() => {
    const prevStart = addDaysIso(selectedWeekStart, -7);
    return weeks.find((w) => w.weekStart === prevStart) ?? null;
  }, [weeks, selectedWeekStart]);

  const bmi = calculateBmi(currentWeek.metrics.weightKg, profile.heightCm);
  const bmiInfo = getBmiAssessment(bmi);

  const updateMeal = (
    dayKey: DayOfWeekKey,
    mealKey: keyof DayMeals,
    value: string
  ) => {
    const next: DietWeekRecord = {
      ...currentWeek,
      days: {
        ...currentWeek.days,
        [dayKey]: {
          ...currentWeek.days[dayKey],
          [mealKey]: value,
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpsertWeek(next);
  };

  const updateMetric = (field: keyof BodyMetrics, value: string) => {
    const next: DietWeekRecord = {
      ...currentWeek,
      metrics: {
        ...currentWeek.metrics,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpsertWeek(next);
  };

  const handleCopyFromPreviousWeek = () => {
    if (!previousWeek) return;
    const next: DietWeekRecord = {
      ...currentWeek,
      days: JSON.parse(JSON.stringify(previousWeek.days)),
      updatedAt: new Date().toISOString(),
    };
    onUpsertWeek(next);
  };

  const weekEndIso = addDaysIso(selectedWeekStart, 6);

  const mealSlots: {
    key: keyof DayMeals;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: 'breakfast',
      label: 'Bữa sáng',
      placeholder: 'Ví dụ: Yến mạch + trứng luộc / Khoai lang...',
    },
    {
      key: 'lunch',
      label: 'Bữa trưa',
      placeholder: 'Ví dụ: Ức gà áp chảo + rau hấp + 1/2 chén cơm...',
    },
    {
      key: 'snack',
      label: 'Bữa phụ',
      placeholder: 'Ví dụ: Sữa chua không đường / 1 quả táo / Hạt...',
    },
    {
      key: 'dinner',
      label: 'Bữa tối',
      placeholder: 'Ví dụ: Đậu hũ hấp nấm + canh rau nhạt...',
    },
  ];

  const weightDelta = previousWeek
    ? formatDelta(currentWeek.metrics.weightKg, previousWeek.metrics.weightKg, 'kg')
    : null;
  const waistDelta = previousWeek
    ? formatDelta(currentWeek.metrics.waistCm, previousWeek.metrics.waistCm, 'cm')
    : null;
  const upperDelta = previousWeek
    ? formatDelta(currentWeek.metrics.upperBellyCm, previousWeek.metrics.upperBellyCm, 'cm')
    : null;
  const lowerDelta = previousWeek
    ? formatDelta(currentWeek.metrics.lowerBellyCm, previousWeek.metrics.lowerBellyCm, 'cm')
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Week Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 inline-flex items-center gap-2.5">
            <AvocadoIcon className="w-7 h-7 shrink-0" />
            <span>Menu ăn kiêng cho vợ</span>
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Tự nhập thực đơn 4 bữa mỗi ngày theo tuần và theo dõi cân nặng, số đo vòng eo, bụng trên/dưới cùng chỉ số BMI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedWeekStart(addDaysIso(selectedWeekStart, -7))}
            aria-label="Tuần trước"
            className="w-10 h-10 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2 flex items-center gap-2 min-h-[40px]">
            <span className="text-xs font-semibold text-stone-500">Tuần:</span>
            <span className="font-mono-num text-xs sm:text-sm font-bold text-stone-900">
              {formatViShortDate(selectedWeekStart)} – {formatViShortDate(weekEndIso)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedWeekStart(addDaysIso(selectedWeekStart, 7))}
            aria-label="Tuần sau"
            className="w-10 h-10 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedWeekStart(defaultMonday)}
            className="px-3 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-[#15803D] cursor-pointer whitespace-nowrap"
          >
            Tuần này
          </button>
        </div>
      </div>

      {/* Body Metrics & BMI Tracker Section */}
      <section
        aria-labelledby="metrics-section-title"
        className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 id="metrics-section-title" className="text-base sm:text-lg font-bold text-stone-900">
            Chỉ số cơ thể tuần {formatViShortDate(selectedWeekStart)} & BMI
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
              <span className="font-semibold text-stone-600">Chiều cao:</span>
              <input
                type="number"
                min="100"
                max="220"
                step="0.5"
                value={profile.heightCm}
                onChange={(e) => onUpdateProfile({ heightCm: e.target.value })}
                className="w-14 bg-white border border-stone-200 rounded px-1.5 py-0.5 text-right font-mono-num font-bold text-stone-900 focus:outline-none focus:border-[#15803D]"
              />
              <span className="text-stone-500">cm</span>
            </label>

            <label className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5">
              <span className="font-semibold text-stone-600">Mục tiêu:</span>
              <input
                type="number"
                min="30"
                max="150"
                step="0.5"
                value={profile.targetWeightKg}
                onChange={(e) => onUpdateProfile({ targetWeightKg: e.target.value })}
                className="w-14 bg-white border border-stone-200 rounded px-1.5 py-0.5 text-right font-mono-num font-bold text-stone-900 focus:outline-none focus:border-[#15803D]"
              />
              <span className="text-stone-500">kg</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-semibold text-stone-600">
              Cân nặng (kg)
            </label>
            <input
              type="number"
              min="25"
              max="200"
              step="0.1"
              placeholder="54.5"
              value={currentWeek.metrics.weightKg}
              onChange={(e) => updateMetric('weightKg', e.target.value)}
              className="mt-1.5 w-full px-2.5 py-1.5 text-lg font-bold font-mono-num text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
            {weightDelta && (
              <div className="mt-1.5 text-[11px] font-mono-num text-stone-500">
                So với tuần trước: <span className="font-semibold text-stone-800">{weightDelta}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-semibold text-stone-600">
              Vòng eo (cm)
            </label>
            <input
              type="number"
              min="40"
              max="160"
              step="0.5"
              placeholder="70"
              value={currentWeek.metrics.waistCm}
              onChange={(e) => updateMetric('waistCm', e.target.value)}
              className="mt-1.5 w-full px-2.5 py-1.5 text-lg font-bold font-mono-num text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
            {waistDelta && (
              <div className="mt-1.5 text-[11px] font-mono-num text-stone-500">
                So với tuần trước: <span className="font-semibold text-stone-800">{waistDelta}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-semibold text-stone-600">
              Bụng trên (cm)
            </label>
            <input
              type="number"
              min="40"
              max="160"
              step="0.5"
              placeholder="74"
              value={currentWeek.metrics.upperBellyCm}
              onChange={(e) => updateMetric('upperBellyCm', e.target.value)}
              className="mt-1.5 w-full px-2.5 py-1.5 text-lg font-bold font-mono-num text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
            {upperDelta && (
              <div className="mt-1.5 text-[11px] font-mono-num text-stone-500">
                So với tuần trước: <span className="font-semibold text-stone-800">{upperDelta}</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <label className="block text-xs font-semibold text-stone-600">
              Bụng dưới (cm)
            </label>
            <input
              type="number"
              min="40"
              max="170"
              step="0.5"
              placeholder="82"
              value={currentWeek.metrics.lowerBellyCm}
              onChange={(e) => updateMetric('lowerBellyCm', e.target.value)}
              className="mt-1.5 w-full px-2.5 py-1.5 text-lg font-bold font-mono-num text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
            {lowerDelta && (
              <div className="mt-1.5 text-[11px] font-mono-num text-stone-500">
                So với tuần trước: <span className="font-semibold text-stone-800">{lowerDelta}</span>
              </div>
            )}
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
            <div className="text-xs font-semibold text-stone-700">
              Chỉ số BMI tự động
            </div>
            <div className="mt-1 text-2xl font-bold font-mono-num text-[#15803D]">
              {bmi !== null ? bmi.toFixed(1) : '—'}
            </div>
            <div className={`mt-1 text-xs font-semibold leading-snug ${bmiInfo.toneClass}`}>
              {bmiInfo.label}
            </div>
          </div>
        </div>

        <div>
          <input
            type="text"
            value={currentWeek.metrics.note ?? ''}
            onChange={(e) => updateMetric('note', e.target.value)}
            placeholder="Ghi chú sức khỏe tuần này (ví dụ: Ngủ đủ giấc, ít thèm ngọt, đi bộ 30 phút/ngày...)"
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
          />
        </div>
      </section>

      {/* Weekly Meal Planner Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 bg-stone-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Xem cả tuần (7 ngày)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-3.5 py-1.5 min-h-[36px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'day'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Nhập từng ngày
          </button>
        </div>

        {previousWeek && (
          <button
            type="button"
            onClick={handleCopyFromPreviousWeek}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-[#15803D] cursor-pointer self-start sm:self-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Chép thực đơn từ tuần trước</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs when in Day View */}
      {viewMode === 'day' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {DAY_LABELS.map((d, idx) => {
            const active = selectedDay === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedDay(d.key)}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#15803D] border-[#15803D] text-white'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {d.label} ({formatViDayHeader(selectedWeekStart, idx)})
              </button>
            );
          })}
        </div>
      )}

      {/* 7-Day Manual Meal Inputs (4 meals/day) */}
      <div
        className={
          viewMode === 'week'
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
            : 'grid grid-cols-1 gap-4'
        }
      >
        {DAY_LABELS.filter((d) => viewMode === 'week' || d.key === selectedDay).map(
          (day) => {
            const dayIdx = DAY_LABELS.findIndex((x) => x.key === day.key);
            const meals = currentWeek.days[day.key];
            const filledCount = [
              meals.breakfast,
              meals.lunch,
              meals.snack,
              meals.dinner,
            ].filter((x) => x.trim().length > 0).length;

            return (
              <div
                key={day.key}
                className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      {day.label}
                    </h3>
                    <span className="font-mono-num text-xs text-stone-500">
                      {formatViDayHeader(selectedWeekStart, dayIdx)}
                    </span>
                  </div>
                  <span className="font-mono-num text-xs font-medium text-[#15803D]">
                    {filledCount}/4 bữa
                  </span>
                </div>

                <div className="space-y-3">
                  {mealSlots.map((slot) => {
                    const isPicking =
                      quickPickTarget?.day === day.key &&
                      quickPickTarget?.meal === slot.key;

                    return (
                      <div key={slot.key} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-stone-700">
                            {slot.label}
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setQuickPickTarget(
                                isPicking ? null : { day: day.key, meal: slot.key }
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Chèn nhanh món</span>
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={meals[slot.key]}
                          onChange={(e) =>
                            updateMeal(day.key, slot.key, e.target.value)
                          }
                          placeholder={slot.placeholder}
                          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#15803D] resize-y"
                        />

                        {isPicking && (
                          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-[#15803D]">
                              <span className="inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Chọn món ăn nhạt ít dầu từ bếp:
                              </span>
                              <button
                                type="button"
                                onClick={() => setQuickPickTarget(null)}
                                className="text-stone-500 hover:text-stone-900 cursor-pointer"
                              >
                                Đóng
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {recipes.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => {
                                    const currentText = meals[slot.key].trim();
                                    const nextText = currentText
                                      ? `${currentText} + ${r.name}`
                                      : r.name;
                                    updateMeal(day.key, slot.key, nextText);
                                    setQuickPickTarget(null);
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-white border border-stone-200 hover:border-[#15803D] text-[11px] font-medium text-stone-800 cursor-pointer"
                                >
                                  {r.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Weekly Progress History Table */}
      <section className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
        <h2 className="text-base font-bold text-stone-900">
          Tổng hợp chỉ số các tuần đã ghi nhận
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 pr-4 font-semibold">Tuần bắt đầu</th>
                <th className="py-2.5 px-3 font-semibold text-right">Cân nặng</th>
                <th className="py-2.5 px-3 font-semibold text-right">BMI</th>
                <th className="py-2.5 px-3 font-semibold text-right">Vòng eo</th>
                <th className="py-2.5 px-3 font-semibold text-right">Bụng trên</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Bụng dưới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedWeeksDesc.map((w) => {
                const rowBmi = calculateBmi(w.metrics.weightKg, profile.heightCm);
                const isSelected = w.weekStart === selectedWeekStart;
                return (
                  <tr
                    key={w.weekStart}
                    onClick={() => setSelectedWeekStart(w.weekStart)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="py-2.5 pr-4 font-mono-num text-stone-900 whitespace-nowrap">
                      {formatViShortDate(w.weekStart)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {w.metrics.weightKg ? `${w.metrics.weightKg} kg` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-[#15803D] font-semibold">
                      {rowBmi !== null ? rowBmi.toFixed(1) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {w.metrics.waistCm ? `${w.metrics.waistCm} cm` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {w.metrics.upperBellyCm ? `${w.metrics.upperBellyCm} cm` : '—'}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono-num">
                      {w.metrics.lowerBellyCm ? `${w.metrics.lowerBellyCm} cm` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
