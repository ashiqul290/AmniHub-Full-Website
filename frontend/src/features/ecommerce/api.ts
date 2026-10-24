export type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
};

export type CartLine = {
  product: Product | string;
  quantity: number;
};

export type Order = {
  _id: string;
  items: {
    product: string;
    seller?: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    status: string;
  }[];
  total: number;
  discount?: number;
  couponCode?: string;
  status: string;
  createdAt: string;
};

export type Review = {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user: { name: string };
};

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function uploadImage(file: File, scope: "product" | "store") {
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
    throw new Error("Choose an image smaller than 8 MB.");
  }
  const signature = await apiRequest<{
    cloudName: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    allowed_formats: string;
    signature: string;
  }>("/uploads/signature", {
    method: "POST",
    body: JSON.stringify({ scope }),
  });
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", signature.apiKey);
  form.set("timestamp", String(signature.timestamp));
  form.set("folder", signature.folder);
  form.set("allowed_formats", signature.allowed_formats);
  form.set("signature", signature.signature);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: "POST", body: form },
  );
  const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || "Image upload failed.");
  }
  return result.secure_url;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(result?.message || `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function imageUrl(product: Product) {
  return product.images?.[0] || "";
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
