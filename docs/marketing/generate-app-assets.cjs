const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "../..");
const src = path.join(__dirname, "source-app-cover.png");
const bg = "#030403";

async function makeIcon(size, out, inset = 0) {
  const inputSize = size - inset * 2;
  const img = await sharp(src)
    .resize(inputSize, inputSize, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 3, background: bg } })
    .composite([{ input: img, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, out));
}

async function main() {
  await fs.promises.mkdir(path.join(root, "public/icons"), { recursive: true });
  await fs.promises.mkdir(path.join(root, "public/images"), { recursive: true });

  await makeIcon(192, "public/icons/icon-192-v2.png");
  await makeIcon(512, "public/icons/icon-512-v2.png");
  await makeIcon(512, "public/icons/icon-maskable-512-v2.png", 44);
  await makeIcon(180, "public/icons/apple-touch-icon-v2.png");

  await makeIcon(192, "public/icons/icon-192.png");
  await makeIcon(512, "public/icons/icon-512.png");
  await makeIcon(180, "public/icons/apple-touch-icon.png");

  const base = await sharp(src)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.92, saturation: 0.88 })
    .jpeg({ quality: 92 })
    .toBuffer();

  const titleSvg = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#020303" stop-opacity="0.96"/>
        <stop offset="0.45" stop-color="#020303" stop-opacity="0.62"/>
        <stop offset="1" stop-color="#020303" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#fade)"/>
    <rect x="100" y="128" width="1.5" height="330" fill="#d9b06f" opacity="0.7"/>
    <text x="136" y="252" font-family="serif" font-size="68" letter-spacing="10" fill="#f3eee4">镜隙之间</text>
    <text x="140" y="315" font-family="serif" font-size="26" letter-spacing="5" fill="#cdbb9c" opacity="0.82">让时间慢慢显影</text>
    <text x="142" y="412" font-family="sans-serif" font-size="20" letter-spacing="4" fill="#8e8a82" opacity="0.72">PRIVATE MEMORY DARKROOM</text>
  </svg>`);

  await sharp(base)
    .composite([{ input: titleSvg, left: 0, top: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(root, "public/images/cover-v2.jpg"));

  await sharp(path.join(root, "public/images/cover-v2.jpg"))
    .toFile(path.join(root, "public/images/cover.jpg"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
