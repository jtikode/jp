import sharp from "sharp";

// Every offer flyer is stored at the same 4:5 size so the offers list and the
// home carousel look uniform whatever shape the supplier's artwork came in.
// The whole flyer is kept (never cropped); leftover space is filled with a
// blurred copy of the flyer itself.
export const OFFER_IMAGE_WIDTH = 1080;
export const OFFER_IMAGE_HEIGHT = 1350;

export async function normalizeOfferImage(input: Buffer): Promise<Buffer> {
  const background = await sharp(input)
    .rotate()
    .resize(OFFER_IMAGE_WIDTH, OFFER_IMAGE_HEIGHT, { fit: "cover" })
    .blur(28)
    .toBuffer();
  const flyer = await sharp(input)
    .rotate()
    .resize(OFFER_IMAGE_WIDTH, OFFER_IMAGE_HEIGHT, { fit: "inside" })
    .toBuffer();
  return sharp(background)
    .composite([{ input: flyer, gravity: "centre" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
