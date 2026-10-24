import { createHash } from "node:crypto";

const uploadFolders = {
  product: "omnihub/products",
  store: "omnihub/stores",
} as const;

export type UploadScope = keyof typeof uploadFolders;

export function createUploadSignature(scope: UploadScope) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary upload is not configured on the server.");
  }

  const params = {
    allowed_formats: "avif,jpg,jpeg,png,webp",
    folder: uploadFolders[scope],
    timestamp: Math.floor(Date.now() / 1000),
  };
  const signatureBase = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
  return { cloudName, apiKey, ...params, signature };
}
