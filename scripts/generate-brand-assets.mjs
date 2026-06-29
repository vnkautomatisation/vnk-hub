import sharp from "sharp";
import pngToIco from "png-to-ico";
import { mkdir, writeFile, readdir, copyFile } from "fs/promises";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "design", "logo-source");
const svgDir = path.join(root, "public", "logo", "svg");
const pngDir = path.join(root, "public", "logo", "png");
const publicDir = path.join(root, "public");

async function syncSvgSources() {
  await mkdir(svgDir, { recursive: true });
  const files = await readdir(sourceDir);
  for (const file of files.filter((f) => f.endsWith(".svg"))) {
    await copyFile(path.join(sourceDir, file), path.join(svgDir, file));
  }
}

async function renderPng(svgPath, outPath, size) {
  await sharp(svgPath, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function main() {
  await syncSvgSources();
  await mkdir(pngDir, { recursive: true });

  const iconSizes = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];
  for (const size of iconSizes) {
    await renderPng(path.join(svgDir, "icon.svg"), path.join(pngDir, `icon-${size}.png`), size);
  }

  // Standard web app icons at the public root
  await renderPng(path.join(svgDir, "icon.svg"), path.join(publicDir, "favicon-16x16.png"), 16);
  await renderPng(path.join(svgDir, "icon.svg"), path.join(publicDir, "favicon-32x32.png"), 32);
  await renderPng(path.join(svgDir, "icon.svg"), path.join(publicDir, "apple-touch-icon.png"), 180);
  await renderPng(path.join(svgDir, "icon.svg"), path.join(publicDir, "android-chrome-192x192.png"), 192);
  await renderPng(path.join(svgDir, "icon.svg"), path.join(publicDir, "android-chrome-512x512.png"), 512);

  // Multi-resolution favicon.ico
  const icoBuffers = await Promise.all(
    [16, 32, 48].map((size) => sharp(path.join(svgDir, "icon.svg"), { density: 384 }).resize(size, size).png().toBuffer())
  );
  const icoBuffer = await pngToIco(icoBuffers);
  await writeFile(path.join(publicDir, "favicon.ico"), icoBuffer);

  // Wordmark / lockup PNGs (for documents, slides, email signatures)
  const lockups = [
    ["logo-horizontal-dark", 1440],
    ["logo-horizontal-light", 1440],
    ["logo-stacked-dark", 720],
    ["logo-stacked-light", 720],
    ["wordmark-dark", 840],
    ["wordmark-light", 840],
    ["icon-mono-white", 512],
    ["icon-mono-dark", 512],
    ["icon-mono-black", 512],
  ];
  for (const [name, width] of lockups) {
    const svgPath = path.join(svgDir, `${name}.svg`);
    const meta = await sharp(svgPath).metadata();
    const height = Math.round((width / (meta.width ?? width)) * (meta.height ?? width));
    await sharp(svgPath, { density: 384 })
      .resize(width, height)
      .png()
      .toFile(path.join(pngDir, `${name}.png`));
  }

  // Open Graph social preview image (1200x630)
  const gridSquares = (cx, cy, scale) => `
    <rect x="${cx - 1.24 * scale}" y="${cy - 1.24 * scale}" width="${scale}" height="${scale}" rx="${scale * 0.24}" fill="#FFFFFF" fill-opacity="0.95"/>
    <rect x="${cx + 0.24 * scale}" y="${cy - 1.24 * scale}" width="${scale}" height="${scale}" rx="${scale * 0.24}" fill="#FFFFFF" fill-opacity="0.5"/>
    <rect x="${cx - 1.24 * scale}" y="${cy + 0.24 * scale}" width="${scale}" height="${scale}" rx="${scale * 0.24}" fill="#FFFFFF" fill-opacity="0.5"/>
    <rect x="${cx + 0.24 * scale}" y="${cy + 0.24 * scale}" width="${scale}" height="${scale}" rx="${scale * 0.24}" fill="#FFFFFF" fill-opacity="0.95"/>
  `;
  const ogSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="og-grad" x1="80" y1="195" x2="320" y2="435" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="#0B0D12"/>
      <rect x="80" y="195" width="240" height="240" rx="54" fill="url(#og-grad)"/>
      ${gridSquares(200, 315, 70)}
      <text x="380" y="335" font-family="Arial, 'Segoe UI', sans-serif" font-size="80" font-weight="500" fill="#F1F2F6">VNK<tspan fill="#6366F1">Hub</tspan></text>
      <text x="382" y="400" font-family="Arial, 'Segoe UI', sans-serif" font-size="30" font-weight="400" fill="#6B7080">Plateforme de gestion dropshipping</text>
    </svg>
  `;
  await sharp(Buffer.from(ogSvg)).png().toFile(path.join(publicDir, "logo", "og-image.png"));

  // Twitter Card preview image (same ratio works for summary_large_image)
  await sharp(Buffer.from(ogSvg)).png().toFile(path.join(publicDir, "logo", "twitter-card.png"));

  // Windows tile icons (msapplication / browserconfig.xml)
  const tileSvg = (size) => `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tile-grad" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#tile-grad)"/>
      ${gridSquares(size / 2, size / 2, size * 0.22)}
    </svg>
  `;
  await sharp(Buffer.from(tileSvg(150))).png().toFile(path.join(publicDir, "mstile-150x150.png"));
  await sharp(Buffer.from(tileSvg(310))).png().toFile(path.join(publicDir, "mstile-310x310.png"));
  await sharp(Buffer.from(`
    <svg width="310" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tile-wide-grad" x1="0" y1="0" x2="310" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3B82F6"/>
          <stop offset="1" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <rect width="310" height="150" fill="url(#tile-wide-grad)"/>
      ${gridSquares(155, 75, 33)}
    </svg>
  `)).png().toFile(path.join(publicDir, "mstile-310x150.png"));

  console.log("Brand assets generated successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
