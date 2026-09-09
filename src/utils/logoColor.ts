import type { CSSProperties } from 'react';

/**
 * Utility to extract dominant color from an image (base64 or URL)
 * and generate dynamic adaptive background styling.
 */

export function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve('#1e3a8a');

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('#1e3a8a');

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-black / near-white pixels
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);

          // Avoid pure white, pure black, or dull gray
          if (max - min < 12 && (max > 230 || min < 20)) continue;

          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }

        if (count === 0) {
          // Fallback: take average of non-transparent pixels
          for (let i = 0; i < imgData.length; i += 16) {
            if (imgData[i + 3] >= 128) {
              rSum += imgData[i];
              gSum += imgData[i + 1];
              bSum += imgData[i + 2];
              count++;
            }
          }
        }

        if (count === 0) return resolve('#1e3a8a');

        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        console.warn('Could not extract color from logo image:', e);
        resolve('#1e3a8a');
      }
    };

    img.onerror = () => resolve('#1e3a8a');
  });
}

/**
 * Convert a color string (rgb(...) or hex) to a rich dark gradient background style
 */
export function getLogoAdaptiveBackgroundStyle(colorStr?: string, isSelected: boolean = false): CSSProperties {
  if (!colorStr) {
    return {};
  }

  // Parse RGB or Hex
  let r = 30, g = 58, b = 138;
  const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    r = parseInt(rgbMatch[1], 10);
    g = parseInt(rgbMatch[2], 10);
    b = parseInt(rgbMatch[3], 10);
  } else if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
  }

  const opacity1 = isSelected ? 0.65 : 0.35;
  const opacity2 = isSelected ? 0.95 : 0.85;

  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, ${opacity1}) 0%, rgba(15, 23, 42, ${opacity2}) 100%)`,
    borderColor: `rgba(${r}, ${g}, ${b}, ${isSelected ? 0.9 : 0.5})`,
    boxShadow: isSelected 
      ? `0 10px 25px -5px rgba(${r}, ${g}, ${b}, 0.4), 0 8px 10px -6px rgba(${r}, ${g}, ${b}, 0.2)`
      : `0 4px 12px -2px rgba(${r}, ${g}, ${b}, 0.15)`
  };
}

/**
 * Resize and compress uploaded image file to max 256x256 Base64 URL
 */
export function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(event.target?.result as string);

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.85);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
