"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import type { Product } from "./api";

export type LocalCartLine = { product: Product; quantity: number };

const cartStorageKey = "omnimart-cart-v1";
const wishlistStorageKey = "omnimart-wishlist-v1";
const shopStateEvent = "omnimart:state";

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readCart(): LocalCartLine[] {
  const value = readJson<unknown>(cartStorageKey, []);
  if (!Array.isArray(value)) return [];
  return value.filter(
    (line): line is LocalCartLine =>
      typeof line === "object" &&
      line !== null &&
      "product" in line &&
      typeof line.product === "object" &&
      line.product !== null &&
      "_id" in line.product &&
      typeof line.product._id === "string" &&
      "source" in line.product &&
      (line.product.source === "demo" || line.product.source === "database") &&
      "quantity" in line &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0,
  );
}

export function readWishlist(): string[] {
  const value = readJson<unknown>(wishlistStorageKey, []);
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

function announceShopState() {
  window.dispatchEvent(new Event(shopStateEvent));
}

export function writeCart(cart: LocalCartLine[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  announceShopState();
}

export function writeWishlist(wishlist: string[]) {
  window.localStorage.setItem(wishlistStorageKey, JSON.stringify([...new Set(wishlist)]));
  announceShopState();
}

export function useShopState() {
  const [cart, setCart] = useState<LocalCartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setCart(readCart());
      setWishlist(readWishlist());
    };
    sync();
    window.addEventListener(shopStateEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(shopStateEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const updateCart = useCallback((next: SetStateAction<LocalCartLine[]>) => {
    const value = typeof next === "function" ? next(readCart()) : next;
    window.localStorage.setItem(cartStorageKey, JSON.stringify(value));
    setCart(value);
    announceShopState();
  }, []);
  const updateWishlist = useCallback((next: SetStateAction<string[]>) => {
    const value = typeof next === "function" ? next(readWishlist()) : next;
    const unique = [...new Set(value)];
    window.localStorage.setItem(wishlistStorageKey, JSON.stringify(unique));
    setWishlist(unique);
    announceShopState();
  }, []);

  return { cart, wishlist, setCart: updateCart, setWishlist: updateWishlist };
}
