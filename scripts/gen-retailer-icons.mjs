import sharp from "sharp";
import { mkdirSync } from "fs";

// Solid edge-to-edge background (required for Android adaptive/maskable icons —
// the OS applies its own mask shape, so content must sit inside the ~80% safe zone).
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1d4ed8"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="180" font-weight="700"
        fill="white" text-anchor="middle">MP</text>
</svg>
`;

mkdirSync("public/icons", { recursive: true });

const sizes = [192, 512];
for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/retailer-${size}.png`);
  console.log(`wrote public/icons/retailer-${size}.png`);
}
