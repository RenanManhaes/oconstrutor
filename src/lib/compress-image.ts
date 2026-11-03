/**
 * Compress an image file using canvas.
 * Returns a compressed File (JPEG) with max dimensions and quality target.
 */
export async function compressImage(
  file: File,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}
): Promise<File> {
  // Skip non-raster images (SVG, etc.)
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than max
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compressed is larger, use original
            resolve(file);
          } else {
            const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressed);
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Erro ao processar imagem"));
    img.src = URL.createObjectURL(file);
  });
}
