import sharp from "sharp";
import crypto from "crypto"

export async function cropAndResizeToWebp(file: File, size: { width: number; height: number }) {
  const input = Buffer.from(await file.arrayBuffer());
  const contentType = "image/webp";

  const meta = await sharp(input).metadata();
  const hasAlpha = meta.hasAlpha;

  const buffer = await sharp(input)
    .rotate()
    .resize(size.width, size.height, { fit: "cover", position: "attention" })
    .webp({
      quality: 80,
      alphaQuality: hasAlpha ? 90 : 100,
      effort: 6,            // encoding effort, reasonable default
      smartSubsample: true, // better chroma for downscaled photos
    })
    .toBuffer();

  const hash = crypto.createHash('SHA-256').update(buffer).digest('hex');
  const filename = `${hash}.webp`;

  return { buffer, contentType, filename };
}
