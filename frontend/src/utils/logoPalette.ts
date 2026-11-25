export interface HarmonicLogoPalette {
  /** Rich primary color guaranteed to have >= 4.6:1 contrast with #ffffff */
  primary: string;
  primaryHover: string;
  /** Deep accent for light-mode headings and links */
  primaryDeep: string;
  /** Soft tinted background for page & subtle surfaces in light mode */
  pageBg: string;
  tintBg: string;
  border: string;
  coverGradient: string;
  /** Dark-mode counterparts */
  darkPageBg: string;
  darkSurface: string;
  darkBorder: string;
  darkHeading: string;
  darkTintBg: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l * 100];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }

  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = ((h % 360) + 360) % 360;
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hn < 60) {
    r = c;
    g = x;
  } else if (hn < 120) {
    r = x;
    g = c;
  } else if (hn < 180) {
    g = c;
    b = x;
  } else if (hn < 240) {
    g = x;
    b = c;
  } else if (hn < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastWithWhite(h: number, s: number, l: number): number {
  const [r, g, b] = hslToRgb(h, s, l);
  const lum = relativeLuminance(r, g, b);
  return 1.05 / (lum + 0.05);
}

/**
 * Builds a harmonic, WCAG-AA-safe light & dark palette from an HSL base color.
 */
export function buildHarmonicPalette(
  hue: number,
  rawSat: number,
  rawLight: number
): HarmonicLogoPalette {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const s = clamp(Math.round(rawSat), 45, 78);

  let primaryL = clamp(Math.round(rawLight), 28, 46);
  while (primaryL > 18 && contrastWithWhite(h, s, primaryL) < 4.6) {
    primaryL -= 2;
  }

  const hoverL = clamp(primaryL - 7, 14, 40);
  const deepL = clamp(primaryL - 12, 16, 30);
  const hueShift = (h + 22) % 360;

  return {
    primary: `hsl(${h}, ${s}%, ${primaryL}%)`,
    primaryHover: `hsl(${h}, ${s}%, ${hoverL}%)`,
    primaryDeep: `hsl(${h}, ${clamp(s, 42, 68)}%, ${deepL}%)`,
    pageBg: `hsl(${h}, ${clamp(Math.round(s * 0.32), 12, 24)}%, 97%)`,
    tintBg: `hsl(${h}, ${clamp(Math.round(s * 0.65), 28, 60)}%, 93%)`,
    border: `hsl(${h}, ${clamp(Math.round(s * 0.38), 16, 32)}%, 87%)`,
    coverGradient: `linear-gradient(135deg, hsl(${h}, ${s}%, ${clamp(primaryL + 6, 32, 48)}%), hsl(${hueShift}, ${clamp(s, 45, 72)}%, 18%))`,
    darkPageBg: `hsl(${h}, 30%, 8%)`,
    darkSurface: `hsl(${h}, 26%, 13%)`,
    darkBorder: `hsl(${h}, 22%, 28%)`,
    darkHeading: `hsl(${h}, ${clamp(s, 58, 84)}%, 76%)`,
    darkTintBg: `hsl(${h}, 34%, 19%)`,
  };
}

/**
 * Extracts the dominant brand color from an image URL using an offscreen canvas
 * and returns a harmonic palette, or null if extraction fails (e.g. CORS).
 */
export function extractPaletteFromImage(
  imageUrl: string
): Promise<HarmonicLogoPalette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        interface Bucket {
          count: number;
          score: number;
          rSum: number;
          gSum: number;
          bSum: number;
        }

        const vibrantBuckets = new Map<string, Bucket>();
        const fallbackBuckets = new Map<string, Bucket>();

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Ignore near-white and near-black pixels
          if (r > 238 && g > 238 && b > 238) continue;
          if (r < 22 && g < 22 && b < 22) continue;

          const [, s, l] = rgbToHsl(r, g, b);
          if (l < 8 || l > 92) continue;

          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          const targetMap = s >= 20 ? vibrantBuckets : fallbackBuckets;
          const weight = 0.4 + s / 100;

          const existing = targetMap.get(key) ?? {
            count: 0,
            score: 0,
            rSum: 0,
            gSum: 0,
            bSum: 0,
          };
          existing.count += 1;
          existing.score += weight;
          existing.rSum += r;
          existing.gSum += g;
          existing.bSum += b;
          targetMap.set(key, existing);
        }

        const chosenMap =
          vibrantBuckets.size > 0 ? vibrantBuckets : fallbackBuckets;
        if (chosenMap.size === 0) {
          resolve(null);
          return;
        }

        let best: Bucket | null = null;
        for (const bucket of chosenMap.values()) {
          if (!best || bucket.score > best.score) {
            best = bucket;
          }
        }

        if (!best) {
          resolve(null);
          return;
        }

        const avgR = Math.round(best.rSum / best.count);
        const avgG = Math.round(best.gSum / best.count);
        const avgB = Math.round(best.bSum / best.count);
        const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

        resolve(buildHarmonicPalette(h, s, l));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
