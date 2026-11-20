import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Edit3,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingBasket,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  FreshnessPriority,
  PantryCategory,
  PantryItem,
  PRIORITY_LABELS,
} from '../types';
import { formatQty, getQuickStep, normalizeVi } from '../utils/units';
import {
  BroccoliIcon,
  CarrotIcon,
  GrainPodIcon,
  HerbChiliIcon,
  LiquidHerbIcon,
} from './VeggieIcons';

interface PantryViewProps {
  pantry: PantryItem[];
  onAddItem: (item: Omit<PantryItem, 'id' | 'updatedAt'>) => void;
  onUpdateItem: (id: string, patch: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddToShopping: (item: PantryItem) => void;
  onExportBackup: () => void;
  onImportBackup: (rawJson: string) => { ok: boolean; message: string };
  onResetSampleData: () => void;
}

const COMMON_UNITS = ['g', 'kg', 'ml', 'lít', 'quả', 'củ', 'bìa', 'nhánh', 'lá', 'gói'];

export const PantryView: React.FC<PantryViewProps> = ({
  pantry,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddToShopping,
  onExportBackup,
  onImportBackup,
  onResetSampleData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PantryCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'priority'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PantryCategory>('fresh_ingredient');
  const [formQty, setFormQty] = useState('200');
  const [formUnit, setFormUnit] = useState('g');
  const [formLowThreshold, setFormLowThreshold] = useState('50');
  const [formPriority, setFormPriority] = useState<FreshnessPriority>('fresh');
  const [formNote, setFormNote] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(selectedCategory === 'all' ? 'fresh_ingredient' : selectedCategory);
    setFormQty('200');
    setFormUnit('g');
    setFormLowThreshold('30');
    setFormPriority('fresh');
    setFormNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQty(String(item.quantity));
    setFormUnit(item.unit);
    setFormLowThreshold(String(item.lowThreshold));
    setFormPriority(item.priority ?? 'fresh');
    setFormNote(item.note ?? '');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) return;
    const qty = Math.max(0, Number(formQty) || 0);
    const low = Math.max(0, Number(formLowThreshold) || 0);

    const payload: Omit<PantryItem, 'id' | 'updatedAt'> = {
      name: trimmed,
      category: formCategory,
      quantity: qty,
      unit: formUnit.trim() || 'g',
      lowThreshold: low,
      priority: formCategory === 'fresh_ingredient' ? formPriority : undefined,
      note: formNote.trim() || undefined,
    };

    if (editingItem) {
      onUpdateItem(editingItem.id, payload);
    } else {
      onAddItem(payload);
    }
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = onImportBackup(String(reader.result || ''));
      setFeedbackMsg({
        type: result.ok ? 'ok' : 'err',
        text: result.message,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const summary = useMemo(() => {
    const total = pantry.length;
    const outOfStock = pantry.filter((i) => i.quantity <= 0).length;
    const lowStock = pantry.filter((i) => i.quantity > 0 && i.quantity <= i.lowThreshold).length;
    const priorityFresh = pantry.filter(
      (i) =>
        i.category === 'fresh_ingredient' &&
        i.quantity > 0 &&
        (i.priority === 'use_now' || i.priority === 'use_soon')
    ).length;
    return { total, outOfStock, lowStock, priorityFresh };
  }, [pantry]);

  const categoryCounts = useMemo(() => {
    const counts: Record<'all' | PantryCategory, number> = {
      all: pantry.length,
      dry_spice: 0,
      liquid_spice: 0,
      dry_ingredient: 0,
      fresh_ingredient: 0,
    };
    for (const item of pantry) {
      counts[item.category] += 1;
    }
    return counts;
  }, [pantry]);

  const filteredItems = useMemo(() => {
    const q = normalizeVi(searchQuery);
    return pantry
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (statusFilter === 'low' && item.quantity > item.lowThreshold) return false;
        if (
          statusFilter === 'priority' &&
          !(
            item.category === 'fresh_ingredient' &&
            (item.priority === 'use_now' || item.priority === 'use_soon')
          )
        ) {
          return false;
        }
        if (q) {
          const inName = normalizeVi(item.name).includes(q);
          const inNote = item.note ? normalizeVi(item.note).includes(q) : false;
          if (!inName && !inNote) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priRank = (item: PantryItem) => {
          if (item.quantity <= 0) return 0;
          if (item.priority === 'use_now') return 1;
          if (item.priority === 'use_soon') return 2;
          if (item.quantity <= item.lowThreshold) return 3;
          return 4;
        };
        const diff = priRank(a) - priRank(b);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [pantry, selectedCategory, statusFilter, searchQuery]);

  const adjustQty = (item: PantryItem, delta: number) => {
    const next = Math.max(0, Math.round((item.quantity + delta) * 100) / 100);
    onUpdateItem(item.id, { quantity: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Kho gia vị & nguyên liệu
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Quản lý 4 nhóm đồ bếp, tự động lưu trên trình duyệt và hỗ trợ sao lưu JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất sao lưu</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Nhập sao lưu</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục mẫu</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
              <span className="text-xs font-medium text-amber-900">Đặt lại kho mẫu?</span>
              <button
                type="button"
                onClick={() => {
                  onResetSampleData();
                  setConfirmReset(false);
                  setFeedbackMsg({ type: 'ok', text: 'Đã khôi phục dữ liệu mẫu ban đầu cho cả 4 nhóm kho.' });
                }}
                className="px-2 py-1 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded cursor-pointer"
              >
                Đồng ý
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm vào kho</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${
            feedbackMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="p-1 text-current opacity-70 hover:opacity-100 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-stone-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
        <div className="p-4">
          <div className="text-xs font-medium text-stone-500">Tổng mục trong kho</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-stone-900">{summary.total}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-medium text-stone-500">Đồ tươi ưu tiên dùng sớm</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-amber-700">{summary.priorityFresh}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-medium text-stone-500">Sắp hết dưới định mức</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-stone-900">{summary.lowStock}</div>
        </div>
        <div className="p-4">
          <div className="text-xs font-medium text-stone-500">Đã hết hàng (0)</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-red-700">{summary.outOfStock}</div>
        </div>
      </div>

      {/* Category & Search Toolbar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh tên nguyên liệu, gia vị, ghi chú..."
              className="w-full pl-9 pr-8 py-2 min-h-[42px] text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Xóa từ khóa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất cả trạng thái
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('priority')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'priority'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cần dùng sớm
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'low'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Sắp hết / Hết hàng
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
          {(['all', 'fresh_ingredient', 'dry_ingredient', 'liquid_spice', 'dry_spice'] as const).map(
            (cat) => {
              const active = selectedCategory === cat;
              const label = cat === 'all' ? 'Tất cả nhóm' : CATEGORY_LABELS[cat];
              const catIcon =
                cat === 'all' ? (
                  <BroccoliIcon className="w-4 h-4 shrink-0" />
                ) : cat === 'fresh_ingredient' ? (
                  <CarrotIcon className="w-4 h-4 shrink-0" />
                ) : cat === 'dry_ingredient' ? (
                  <GrainPodIcon className="w-4 h-4 shrink-0" />
                ) : cat === 'liquid_spice' ? (
                  <LiquidHerbIcon className="w-4 h-4 shrink-0" />
                ) : (
                  <HerbChiliIcon className="w-4 h-4 shrink-0" />
                );

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'tab-block-3d-active text-white'
                      : 'tab-block-3d text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {catIcon}
                  <span>{label}</span>
                  <span className={`font-mono-num ml-0.5 ${active ? 'text-emerald-100' : 'text-stone-400'}`}>
                    {categoryCounts[cat]}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Pantry Table / List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
          <p className="text-base font-semibold text-stone-800">
            Không tìm thấy mục nào phù hợp trong kho
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Thử đổi bộ lọc hoặc bấm nút bên dưới để thêm nguyên liệu mới.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nguyên liệu mới</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
          {filteredItems.map((item) => {
            const isOut = item.quantity <= 0;
            const isLow = !isOut && item.quantity <= item.lowThreshold;
            const step = getQuickStep(item.unit);

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                      {item.name}
                    </h3>
                    {isOut && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Hết hàng (0)
                      </span>
                    )}
                    {isLow && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Sắp hết
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                    <span>{CATEGORY_LABELS[item.category]}</span>
                    {item.category === 'fresh_ingredient' && item.priority && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            item.priority === 'use_now'
                              ? 'text-red-700 font-semibold'
                              : item.priority === 'use_soon'
                              ? 'text-amber-700 font-semibold'
                              : 'text-emerald-700 font-medium'
                          }
                        >
                          {PRIORITY_LABELS[item.priority]}
                        </span>
                      </>
                    )}
                    {item.note && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-stone-600">{item.note}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                  <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => adjustQty(item, -step)}
                      disabled={item.quantity <= 0}
                      aria-label={`Giảm ${item.name}`}
                      className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-35 rounded-l-lg transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="px-3 min-w-[84px] text-center font-mono-num text-sm font-semibold text-stone-900">
                      {formatQty(item.quantity)}{' '}
                      <span className="font-sans text-xs font-normal text-stone-500">
                        {item.unit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustQty(item, step)}
                      aria-label={`Tăng ${item.name}`}
                      className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-r-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {(isOut || isLow) && (
                    <button
                      type="button"
                      onClick={() => onAddToShopping(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[40px] sm:min-h-[36px] rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <ShoppingBasket className="w-3.5 h-3.5" />
                      <span>Mua thêm</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    aria-label={`Chỉnh sửa ${item.name}`}
                    className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Xóa ${item.name}`}
                    className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Pantry Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pantry-modal-title"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h2 id="pantry-modal-title" className="text-lg font-bold text-stone-900">
                {editingItem ? 'Chỉnh sửa mục trong kho' : 'Thêm nguyên liệu / gia vị mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Tên nguyên liệu / gia vị *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nước tương giảm muối, Súp lơ xanh..."
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Phân nhóm kho
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PantryCategory)}
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-[#15803D]"
                >
                  <option value="dry_spice">Nhóm 1: Gia vị khô</option>
                  <option value="liquid_spice">Nhóm 2: Gia vị lỏng / loại nước</option>
                  <option value="dry_ingredient">Nhóm 3: Nguyên liệu khô</option>
                  <option value="fresh_ingredient">Nhóm 4: Nguyên liệu tươi</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Số lượng hiện có
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono-num border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    list="common-units"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                  <datalist id="common-units">
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Mức báo sắp hết
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formLowThreshold}
                    onChange={(e) => setFormLowThreshold(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono-num border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              {formCategory === 'fresh_ingredient' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Mức độ ưu tiên dùng trước
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as FreshnessPriority)}
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="use_now">Dùng ngay (Sắp hết hạn)</option>
                    <option value="use_soon">Ưu tiên dùng sớm</option>
                    <option value="fresh">Tươi mới</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ghi chú nhanh (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Để ngăn mát trên, hoặc hạn dùng 25/11..."
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
                >
                  {editingItem ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
