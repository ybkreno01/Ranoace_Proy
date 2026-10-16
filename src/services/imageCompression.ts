/**
 * Utility to compress and downscale large base64 images to prevent Firestore 1MB limit errors.
 */
export async function compressBase64Image(
  dataUrl: string,
  maxDimension = 1280,
  quality = 0.75
): Promise<string> {
  // If not a data URL or small enough (< 200KB), return as is
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 200000) {
    return dataUrl;
  }

  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw image with smooth scaling
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG or WebP
        const compressed = canvas.toDataURL('image/jpeg', quality);

        // If compressed is smaller, use it
        if (compressed.length < dataUrl.length) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Sanitizes a guide record by compressing all embedded base64 images in its blocks.
 */
export async function sanitizeGuideImages(guide: any): Promise<any> {
  if (!guide || (guide.kind !== 'guide' && guide.kind !== 'pguide')) {
    return guide;
  }

  let modified = false;
  const cloned = JSON.parse(JSON.stringify(guide));

  if (Array.isArray(cloned.sections)) {
    for (const sec of cloned.sections) {
      if (Array.isArray(sec.steps)) {
        for (const st of sec.steps) {
          if (Array.isArray(st.blocks)) {
            for (const b of st.blocks) {
              if (b.type === 'image' && b.path && b.path.startsWith('data:image/')) {
                if (b.path.length > 200000) {
                  const compressed = await compressBase64Image(b.path, 1280, 0.72);
                  if (compressed.length < b.path.length) {
                    b.path = compressed;
                    modified = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return modified ? cloned : guide;
}
