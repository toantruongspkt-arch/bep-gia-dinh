import React, { useRef, useState } from 'react';
import {
  Camera,
  Download,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  CookHistoryEntry,
  CookingMethod,
  CuisineStyle,
  DietaryType,
} from '../types';
import {
  compressImageFile,
  renderMemoryCardBlob,
} from '../utils/imageCompress';
import { formatDateTimeVi, formatQty } from '../utils/units';
import { PumpkinIcon } from './VeggieIcons';

interface HistoryViewProps {
  entries: CookHistoryEntry[];
  onClearHistory: () => void;
  onUpdateEntry: (id: string, patch: Partial<CookHistoryEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onAddCheckinEntry: (entry: CookHistoryEntry) => void;
  onNotify: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  onClearHistory,
  onUpdateEntry,
  onDeleteEntry,
  onAddCheckinEntry,
  onNotify,
}) => {
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    src: string;
    title: string;
    date: string;
    note?: string;
  } | null>(null);

  // Standalone check-in modal state
  const [isNewCheckinOpen, setIsNewCheckinOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newDietary, setNewDietary] = useState<DietaryType>('non_vegan');
  const [newCuisine, setNewCuisine] = useState<CuisineStyle>('vietnamese');
  const [newMethod, setNewMethod] = useState<CookingMethod>('Hấp');
  const [newServings, setNewServings] = useState('2');
  const [newNote, setNewNote] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const entryFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const triggerUploadForEntry = (entryId: string) => {
    setActiveUploadId(entryId);
    entryFileInputRef.current?.click();
  };

  const handleEntryFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    const targetId = activeUploadId;
    e.target.value = '';
    if (!targetId || files.length === 0) return;

    const targetEntry = entries.find((item) => item.id === targetId);
    if (!targetEntry) return;

    try {
      setIsProcessingPhoto(true);
      const compressed = await Promise.all(
        files.slice(0, 4).map((file) => compressImageFile(file))
      );
      const existing = targetEntry.checkinPhotos ?? [];
      onUpdateEntry(targetId, {
        checkinPhotos: [...existing, ...compressed],
      });
      onNotify(`Đã tải lên ${compressed.length} ảnh check-in cho "${targetEntry.recipeName}".`);
    } catch {
      onNotify('Không thể xử lý ảnh đã chọn. Vui lòng thử lại với ảnh JPEG hoặc PNG.');
    } finally {
      setIsProcessingPhoto(false);
      setActiveUploadId(null);
    }
  };

  const handleModalFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    try {
      setIsProcessingPhoto(true);
      const compressed = await Promise.all(
        files.slice(0, 4).map((file) => compressImageFile(file))
      );
      setNewPhotos((prev) => [...prev, ...compressed]);
    } catch {
      onNotify('Không thể đọc ảnh đã chọn.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = (entry: CookHistoryEntry, photoIndex: number) => {
    const nextPhotos = (entry.checkinPhotos ?? []).filter(
      (_, idx) => idx !== photoIndex
    );
    onUpdateEntry(entry.id, { checkinPhotos: nextPhotos });
  };

  const handleShareMemory = async (
    entry: CookHistoryEntry,
    photoIndex = 0
  ) => {
    const photos = entry.checkinPhotos ?? [];
    const chosenPhoto = photos[photoIndex];
    const dateLabel = formatDateTimeVi(entry.cookedAt);
    const shareText = `BẾP CỦA TÒN · ${entry.recipeName} (${dateLabel})${
      entry.memoryNote ? `\n"${entry.memoryNote}"` : ''
    }`;

    if (!chosenPhoto) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `BẾP CỦA TÒN — ${entry.recipeName}`,
            text: shareText,
          });
          return;
        }
        await navigator.clipboard.writeText(shareText);
        onNotify('Đã sao chép nội dung kỷ niệm bữa ăn để chia sẻ.');
      } catch {
        onNotify('Đã chuẩn bị nội dung chia sẻ.');
      }
      return;
    }

    try {
      const cardBlob = await renderMemoryCardBlob({
        photoDataUrl: chosenPhoto,
        title: entry.recipeName,
        dateLabel,
        note: entry.memoryNote,
        brandName: 'BẾP CỦA TÒN',
      });

      const fileName = `bep-cua-ton-${entry.cookedAt.slice(0, 10)}.png`;
      const shareFile = new File([cardBlob], fileName, { type: 'image/png' });

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [shareFile] })
      ) {
        await navigator.share({
          title: `BẾP CỦA TÒN — ${entry.recipeName}`,
          text: shareText,
          files: [shareFile],
        });
        return;
      }

      // Fallback: download ready-to-share memory card PNG
      const url = URL.createObjectURL(cardBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onNotify('Đã tạo & tải xuống thẻ ảnh kỷ niệm để bạn chia sẻ cho gia đình.');
    } catch {
      onNotify('Không thể xuất thẻ ảnh chia sẻ lúc này.');
    }
  };

  const handleSaveNewCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;
    const entry: CookHistoryEntry = {
      id: `checkin-${Date.now()}`,
      recipeId: `manual-${Date.now()}`,
      recipeName: newMealName.trim(),
      dietary: newDietary,
      cuisine: newCuisine,
      method: newMethod,
      servings: Math.max(1, Number(newServings) || 2),
      cookedAt: new Date().toISOString(),
      lowSodiumApplied: true,
      lowOilApplied: true,
      usedIngredients: [],
      checkinPhotos: newPhotos,
      memoryNote: newNote.trim() || undefined,
    };
    onAddCheckinEntry(entry);
    setNewMealName('');
    setNewNote('');
    setNewPhotos([]);
    setIsNewCheckinOpen(false);
  };

  return (
    <div className="space-y-6">
      <input
        ref={entryFileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleEntryFilesSelected}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Lịch sử nấu ăn & Kỷ niệm gia đình
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Ghi nhận các bữa đã nấu, định lượng đã trừ kho và tải ảnh check-in để lưu giữ, chia sẻ khoảnh khắc gia đình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsNewCheckinOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Check-in bữa ăn mới</span>
          </button>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-red-50 hover:border-red-200 text-stone-600 hover:text-red-700 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa toàn bộ</span>
            </button>
          )}
        </div>
      </div>

      {isProcessingPhoto && (
        <div className="px-4 py-2.5 rounded-lg bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700">
          Đang tối ưu kích thước ảnh check-in...
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
          <PumpkinIcon className="w-10 h-10 mx-auto" />
          <h2 className="text-base font-semibold text-stone-800">
            Chưa có lần nấu hoặc ảnh check-in nào
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Khi bạn xác nhận đã nấu một món ăn hoặc bấm "Check-in bữa ăn mới", lịch sử nấu và album ảnh gia đình sẽ lưu tại đây.
          </p>
          <button
            type="button"
            onClick={() => setIsNewCheckinOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Tạo check-in kỷ niệm đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const photos = entry.checkinPhotos ?? [];
            return (
              <article
                key={entry.id}
                className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900">
                      {entry.recipeName}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                      <span>{entry.dietary === 'vegan' ? 'Thực vật (Chay)' : 'Món mặn'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.cuisine === 'vietnamese' ? 'Việt Nam' : 'Nước ngoài'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.method}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{entry.servings} người</span>
                      {entry.lowSodiumApplied && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#15803D] font-medium">Nêm nhạt</span>
                        </>
                      )}
                      {entry.lowOilApplied && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#15803D] font-medium">Ít dầu</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono-num text-stone-500">
                      {formatDateTimeVi(entry.cookedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      aria-label={`Xóa lịch sử ${entry.recipeName}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:text-red-700 hover:border-red-200 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Check-in Photos & Memory Section */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">
                      Ảnh check-in & kỷ niệm gia đình ({photos.length})
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerUploadForEntry(entry.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#15803D]" />
                        <span>{photos.length > 0 ? 'Thêm ảnh' : 'Tải ảnh check-in'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareMemory(entry, 0)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-semibold cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{photos.length > 0 ? 'Chia sẻ / Tải thẻ ảnh' : 'Chia sẻ'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Memory Caption Input */}
                  <input
                    type="text"
                    value={entry.memoryNote ?? ''}
                    onChange={(e) =>
                      onUpdateEntry(entry.id, { memoryNote: e.target.value })
                    }
                    placeholder="Viết vài dòng kỷ niệm cho bữa ăn này (ví dụ: Cả nhà khen ngon, cuối tuần sum vầy)..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#15803D]"
                  />

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((photoSrc, idx) => (
                        <div
                          key={`${entry.id}-photo-${idx}`}
                          className="group relative aspect-4/3 rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxPhoto({
                                src: photoSrc,
                                title: entry.recipeName,
                                date: formatDateTimeVi(entry.cookedAt),
                                note: entry.memoryNote,
                              })
                            }
                            className="w-full h-full block cursor-pointer"
                          >
                            <img
                              src={photoSrc}
                              alt={`Ảnh check-in ${entry.recipeName}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                            />
                          </button>

                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleShareMemory(entry, idx)}
                              title="Tải thẻ ảnh kỷ niệm"
                              aria-label="Tải thẻ ảnh kỷ niệm"
                              className="w-7 h-7 rounded-md bg-white/90 hover:bg-white text-stone-700 flex items-center justify-center shadow-xs cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(entry, idx)}
                              title="Xóa ảnh"
                              aria-label="Xóa ảnh check-in"
                              className="w-7 h-7 rounded-md bg-white/90 hover:bg-red-50 text-stone-700 hover:text-red-700 flex items-center justify-center shadow-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {entry.usedIngredients.length > 0 && (
                  <div className="pt-3 border-t border-stone-100">
                    <div className="text-xs font-semibold text-stone-600 mb-2">
                      Nguyên liệu đã trừ kho:
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-700">
                      {entry.usedIngredients.map((u, i) => (
                        <div key={`${u.name}-${i}`}>
                          <span>{u.name}: </span>
                          <span className="font-mono-num font-semibold text-stone-900">
                            -{formatQty(u.amount)} {u.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Standalone New Check-in Modal */}
      {isNewCheckinOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-checkin-title"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <h2 id="new-checkin-title" className="text-lg font-bold text-stone-900">
                Check-in bữa ăn & lưu kỷ niệm
              </h2>
              <button
                type="button"
                onClick={() => setIsNewCheckinOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCheckin} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tên bữa ăn / Món gia đình đã nấu *
                </label>
                <input
                  type="text"
                  required
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="Ví dụ: Bữa cơm cuối tuần cùng cả nhà..."
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Chế độ món
                  </label>
                  <select
                    value={newDietary}
                    onChange={(e) => setNewDietary(e.target.value as DietaryType)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="non_vegan">Món mặn</option>
                    <option value="vegan">Thực vật (Chay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ẩm thực
                  </label>
                  <select
                    value={newCuisine}
                    onChange={(e) => setNewCuisine(e.target.value as CuisineStyle)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="vietnamese">Việt Nam</option>
                    <option value="international">Nước ngoài</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Cách chế biến
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as CookingMethod)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Hấp">Hấp</option>
                    <option value="Luộc">Luộc</option>
                    <option value="Áp chảo ít dầu">Áp chảo ít dầu</option>
                    <option value="Nấu canh">Nấu canh</option>
                    <option value="Trộn / Gỏi">Trộn / Gỏi</option>
                    <option value="Kho / Rim nhạt">Kho / Rim nhạt</option>
                    <option value="Xào nhanh ít dầu">Xào nhanh ít dầu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số người ăn
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newServings}
                    onChange={(e) => setNewServings(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lời nhắn kỷ niệm
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ghi lại cảm xúc, hương vị hoặc dịp đặc biệt của gia đình..."
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="space-y-2">
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleModalFilesSelected}
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-lg border border-dashed border-stone-300 hover:border-[#15803D] bg-stone-50 text-sm font-medium text-stone-700 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#15803D]" />
                  <span>Chọn ảnh check-in từ điện thoại / máy tính</span>
                </button>

                {newPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {newPhotos.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-4/3 rounded-lg overflow-hidden border border-stone-200"
                      >
                        <img
                          src={src}
                          alt="Ảnh xem trước"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewPhotos((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 w-6 h-6 rounded bg-white/90 text-stone-700 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewCheckinOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold cursor-pointer"
                >
                  Lưu vào lịch sử
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-stone-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                aria-label="Đóng xem ảnh"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-stone-900 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs font-mono-num text-[#15803D] font-semibold">
                BẾP CỦA TÒN · {lightboxPhoto.date}
              </div>
              <div className="mt-1 text-lg font-bold text-stone-900">
                {lightboxPhoto.title}
              </div>
              {lightboxPhoto.note && (
                <p className="mt-1 text-sm text-stone-600">{lightboxPhoto.note}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
