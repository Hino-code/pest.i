/**
 * Crop an image file to a square (center crop) and return a new File.
 * Falls back to undefined on failure so caller can send the original file.
 */
export interface CropOptions {
  size?: number;
  scale?: number; // zoom factor, 1 = fit shortest side
  offsetX?: number; // source-space offset from center (pixels)
  offsetY?: number; // source-space offset from center (pixels)
}

export async function cropImageToSquare(
  file: File,
  options: CropOptions = {},
): Promise<File | undefined> {
  const { size = 512, scale = 1, offsetX = 0, offsetY = 0 } = options;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const minSide = Math.min(img.width, img.height);
    const safeScale = Math.max(scale, 0.1);
    const cropSide = minSide / safeScale;
    // Center, then apply offset
    let sx = (img.width - cropSide) / 2 + offsetX;
    let sy = (img.height - cropSide) / 2 + offsetY;
    // Clamp to image bounds
    sx = Math.max(0, Math.min(sx, img.width - cropSide));
    sy = Math.max(0, Math.min(sy, img.height - cropSide));

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, size, size);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), file.type || "image/png", 0.92),
    );
    if (!blob) return undefined;
    return new File([blob], file.name, { type: blob.type });
  } catch {
    return undefined;
  }
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
