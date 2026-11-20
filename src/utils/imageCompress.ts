/**
 * Compresses an uploaded image file into a compact JPEG data URL
 * so family check-in photos store safely inside localStorage and JSON backups.
 */
export function compressImageFile(
  file: File,
  maxDimension = 960,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không được hỗ trợ'));
      img.onload = () => {
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height)
        );
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể xử lý ảnh trên trình duyệt'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Renders a shareable memory card PNG combining the check-in photo,
 * dish name, date, and family note.
 */
export function renderMemoryCardBlob(params: {
  photoDataUrl: string;
  title: string;
  dateLabel: string;
  note?: string;
  brandName?: string;
}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Không thể tạo ảnh chia sẻ'));
    img.onload = () => {
      const cardW = 1080;
      const pad = 56;
      const photoW = cardW - pad * 2;
      const photoH = Math.min(
        900,
        Math.max(540, Math.round((img.height / img.width) * photoW))
      );
      const footerH = params.note ? 230 : 175;
      const cardH = pad + photoH + footerH;

      const canvas = document.createElement('canvas');
      canvas.width = cardW;
      canvas.height = cardH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Không thể khởi tạo canvas'));
        return;
      }

      // Crisp off-white card background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cardW, cardH);

      // Subtle outer border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, cardW - 4, cardH - 4);

      // Draw photo centered/cropped cleanly
      const targetRatio = photoW / photoH;
      const srcRatio = img.width / img.height;
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, pad, pad, photoW, photoH);

      // Footer text
      const textTop = pad + photoH + 54;
      ctx.fillStyle = '#15803D';
      ctx.font = '600 24px sans-serif';
      ctx.fillText(
        `${params.brandName || 'BẾP CỦA TÒN'}  ·  ${params.dateLabel}`,
        pad,
        textTop
      );

      ctx.fillStyle = '#181A18';
      ctx.font = '700 38px sans-serif';
      ctx.fillText(params.title.slice(0, 44), pad, textTop + 54);

      if (params.note) {
        ctx.fillStyle = '#57534E';
        ctx.font = '400 28px sans-serif';
        ctx.fillText(params.note.slice(0, 62), pad, textTop + 104);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error('Không thể xuất ảnh PNG'));
          else resolve(blob);
        },
        'image/png',
        0.95
      );
    };
    img.src = params.photoDataUrl;
  });
}
