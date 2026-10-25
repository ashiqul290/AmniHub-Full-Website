import defaultProducts from "@/data/defaultProducts";
import type { Product } from "./api";

export const demoCatalog: Product[] = defaultProducts.map((product) => ({
  _id: product.id,
  source: "demo",
  name: product.name,
  description: product.description,
  category: product.category,
  brand: product.brand,
  size: product.size,
  price: product.price,
  compareAtPrice: product.previousPrice,
  discountPercentage: product.discountPercentage,
  stock: product.stockDisplay === "Low stock" ? 3 : 20,
  stockDisplay: product.stockDisplay,
  images: [product.imageUrl],
  imageUrl: product.imageUrl,
  rating: 0,
  reviewCount: 0,
  featured: product.featured,
}));
