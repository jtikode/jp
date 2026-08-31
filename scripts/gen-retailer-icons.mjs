import sharp from "sharp";
import { mkdirSync } from "fs";

// The source logo is an opaque JPEG (no alpha, light-grey background) — for
// PWA/maskable icons Android requires a solid edge-to-edge background anyway
// (it applies its own mask shape, so content must sit inside the ~80% safe
// zone), so we composite the logo onto a plain white square rather than try
// to matte out its background.
const LOGO = "public/brand/jp-logo.jpg";

mkdirSync("public/icons", { recursive: true });

const sizes = [192, 512];
for (const size of sizes) {
  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(LOGO).resize(logoSize, logoSize, { fit: "contain" }).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 3, background: "#ffffff" },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`public/icons/retailer-${size}.png`);
  console.log(`wrote public/icons/retailer-${size}.png`);
}
