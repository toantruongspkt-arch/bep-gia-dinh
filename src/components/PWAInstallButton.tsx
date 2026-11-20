import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SproutPotIcon } from './VeggieIcons';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hide when already launched as an installed standalone Home Screen app
  if (isInstalled) {
    return null;
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors in restricted frames
    }
  };

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        title={
          isInstallable
            ? 'Cài BẾP CỦA TÒN về màn hình chính'
            : 'Hướng dẫn cài app trên iPhone qua Safari'
        }
      >
        {isInstallable ? (
          <Download className="w-3.5 h-3.5 text-[#15803D]" />
        ) : (
          <Smartphone className="w-3.5 h-3.5 text-[#15803D]" />
        )}
        <span className="hidden sm:inline">
          {isInstallable ? 'Cài ứng dụng' : isIOS ? 'Cài lên iPhone' : 'Dùng trên iPhone'}
        </span>
        <span className="sm:hidden">Cài app</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-pwa-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SproutPotIcon className="w-7 h-7" />
                <div>
                  <h2 id="ios-pwa-title" className="text-base font-bold text-stone-900">
                    Cài BẾP CỦA TÒN lên iPhone
                  </h2>
                  <p className="text-xs text-stone-500">
                    Dùng toàn màn hình như app thật, không cần App Store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Đóng hướng dẫn"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-stone-700">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 text-[#15803D] font-mono-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="font-semibold text-stone-900">
                      Mở địa chỉ web này bằng trình duyệt Safari trên iPhone
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Lưu ý: Nên mở trực tiếp trên Safari (không dùng trình duyệt trong Zalo/Facebook) để hiện nút cài đặt.
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 text-[#15803D] font-mono-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <div className="font-semibold text-stone-900 inline-flex flex-wrap items-center gap-1.5">
                      <span>Chạm vào nút</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold">
                        <Share className="w-3.5 h-3.5 text-[#15803D]" />
                        Chia sẻ
                      </span>
                      <span>ở thanh dưới Safari</span>
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 text-[#15803D] font-mono-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <div className="font-semibold text-stone-900 inline-flex flex-wrap items-center gap-1.5">
                      <span>Cuộn xuống và chọn</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold">
                        <PlusSquare className="w-3.5 h-3.5 text-[#15803D]" />
                        Thêm vào MH chính
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Sau đó chạm <strong>Thêm (Add)</strong> ở góc trên bên phải — biểu tượng <strong>BẾP CỦA TÒN</strong> sẽ xuất hiện ngay trên màn hình chính iPhone.
                    </div>
                  </div>
                </li>
              </ol>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#15803D]" />
                      <span className="text-[#15803D]">Đã sao chép link web</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Sao chép địa chỉ web</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="px-4 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
