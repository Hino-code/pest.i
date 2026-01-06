/**
 * Crop an image file to a square (center crop) and return a new File.
 * Falls back to undefined on failure so caller can send the original file.
 */
export interface CropOptions {
  size?: number;
  scale?: number; // zoom factor, 1 = fit shortest side
  offsetX?: number; // source-space offset from center (pixels)
  offsetY?: number; // source-space offset from center (pixels)
  rotation?: number; // rotation in degrees (0, 90, 180, 270)
  straighten?: number; // straighten angle in degrees (-45 to 45)
}

export async function cropImageToSquare(
  file: File,
  options: CropOptions = {},
): Promise<File | undefined> {
  const { 
    size = 512, 
    scale = 1, 
    offsetX = 0, 
    offsetY = 0,
    rotation = 0,
    straighten = 0
  } = options;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    
    // Calculate total rotation (rotation + straighten)
    const totalRotation = (rotation + straighten) * (Math.PI / 180);
    
    // For rotation, we need a larger canvas to accommodate rotated image
    const rotateCanvas = document.createElement("canvas");
    const rotateCtx = rotateCanvas.getContext("2d");
    if (!rotateCtx) return undefined;

    // Calculate dimensions needed for rotation
    const cos = Math.abs(Math.cos(totalRotation));
    const sin = Math.abs(Math.sin(totalRotation));
    const rotatedWidth = img.width * cos + img.height * sin;
    const rotatedHeight = img.width * sin + img.height * cos;
    
    // Use the larger dimension for the working canvas with some padding
    const workingSize = Math.ceil(Math.max(rotatedWidth, rotatedHeight)) * 1.5;
    rotateCanvas.width = workingSize;
    rotateCanvas.height = workingSize;
    
    // Translate to center, rotate, then translate back
    rotateCtx.translate(workingSize / 2, workingSize / 2);
    rotateCtx.rotate(totalRotation);
    rotateCtx.translate(-img.width / 2, -img.height / 2);
    rotateCtx.drawImage(img, 0, 0);
    
    // Get the rotated image dimensions
    const rotatedMinSide = Math.min(rotatedWidth, rotatedHeight);
    const safeScale = Math.max(scale, 0.1);
    
    // The crop side in the rotated image space
    const cropSide = rotatedMinSide / safeScale;
    
    // Calculate source coordinates (center of rotated image, then apply offset)
    const centerX = workingSize / 2;
    const centerY = workingSize / 2;
    
    // Apply rotation to the offset to account for image rotation
    // Offset is in original image space, need to rotate it
    const offsetAngle = totalRotation;
    const offsetDistance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    const offsetAngleOriginal = Math.atan2(offsetY, offsetX);
    const rotatedOffsetAngle = offsetAngleOriginal + offsetAngle;
    const rotatedOffsetX = offsetDistance * Math.cos(rotatedOffsetAngle);
    const rotatedOffsetY = offsetDistance * Math.sin(rotatedOffsetAngle);
    
    let sx = centerX - cropSide / 2 + rotatedOffsetX;
    let sy = centerY - cropSide / 2 + rotatedOffsetY;
    
    // Clamp to canvas bounds to ensure we don't go outside the rotated image
    const minX = Math.max(0, centerX - rotatedMinSide / 2);
    const maxX = Math.min(workingSize, centerX + rotatedMinSide / 2);
    const minY = Math.max(0, centerY - rotatedMinSide / 2);
    const maxY = Math.min(workingSize, centerY + rotatedMinSide / 2);
    
    sx = Math.max(minX, Math.min(sx, maxX - cropSide));
    sy = Math.max(minY, Math.min(sy, maxY - cropSide));

    // Create final output canvas
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = size;
    outputCanvas.height = size;
    const outputCtx = outputCanvas.getContext("2d");
    if (!outputCtx) return undefined;

    // Draw the cropped region from the rotated canvas
    outputCtx.drawImage(
      rotateCanvas,
      sx, sy, cropSide, cropSide,
      0, 0, size, size
    );
    
    const blob = await new Promise<Blob | null>((resolve) =>
      outputCanvas.toBlob((b) => resolve(b), file.type || "image/png", 0.92),
    );
    if (!blob) return undefined;
    return new File([blob], file.name, { type: blob.type });
  } catch (error) {
    console.error("Error cropping image:", error);
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
