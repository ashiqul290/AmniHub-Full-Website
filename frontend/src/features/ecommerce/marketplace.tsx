"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Blocks,
  Check,
  ChevronDown,
  CupSoda,
  Droplets,
  Heart,
  HeartHandshake,
  Milk,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  SlidersHorizontal,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import { apiRequest, formatPrice, imageUrl, isDatabaseProduct, normalizeDatabaseProduct, uploadImage, type Order, type Product } from "./api";
import { demoCatalog } from "./catalog";
import { useShopState, type LocalCartLine } from "./shop-state";
import styles from "./marketplace.module.css";

type ListingResponse = { products: Product[]; pagination: { total: number; pages: number } };
type Dashboard = {
  stats: Record<string, number>;
  products?: Product[];
  orders?: Order[];
  pendingSellers?: { _id: string; name: string; email: string }[];
  store?: Store | null;
  categories?: AdminCategory[];
  brands?: AdminBrand[];
  banners?: AdminBanner[];
  settings?: StoreSettings;
};
type Store = { name: string; description: string; logo: string; banner: string; email: string; phone: string };
type AdminCategory = { _id: string; name: string; description: string };
type AdminBrand = { _id: string; name: string; logo: string };
type AdminBanner = { _id: string; title: string; image: string; href: string };
type StoreSettings = { siteName: string; shippingFee: number; freeShippingThreshold: number; contactEmail: string; contactPhone: string };
type Mode = "shop" | "cart" | "checkout" | "orders" | "wishlist" | "seller" | "admin";

const categories = [
  { name: "Diapers", Icon: Baby },
  { name: "Baby Food", Icon: Milk },
  { name: "Baby Shampoo", Icon: Sparkles },
  { name: "Baby Lotion", Icon: Droplets },
  { name: "Feeding Bottles", Icon: CupSoda },
  { name: "Toys", Icon: Blocks },
];
const defaultShippingFee = Number(process.env.NEXT_PUBLIC_SHIPPING_FEE) || 80;
const defaultFreeShippingThreshold = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 1500;

function Header({ count = 0, wishlistCount = 0 }: { count?: number; wishlistCount?: number }) {
  const [query, setQuery] = useState("");
  return (
    <>
      <header className={styles.header}>
        <Link href="/ecommerce" className={styles.logo}><span className={styles.logoMark}>o</span><span className={styles.logoWords}>omni<span>baby</span></span></Link>
        <form className={styles.search} action="/ecommerce">
          <Search size={18} />
          <input name="q" aria-label="Search products" placeholder="Search baby essentials, brands and more" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button aria-label="Search"><ArrowRight size={17} /></button>
        </form>
        <nav className={styles.nav}>
          <Link className={styles.dealLink} href="#diaper-deals"><Sparkles size={15} /> Special Deals</Link>
          <Link className={styles.iconLink} href="/ecommerce/wishlist" aria-label={`Wishlist, ${wishlistCount} items`}><Heart size={20} /><span>{wishlistCount}</span></Link>
          <Link className={styles.iconLink} href="/ecommerce/cart" aria-label={`Cart, ${count} items`}><ShoppingBag size={20} /><span>{count}</span></Link>
          <Link className={styles.authLink} href="/login">Login</Link>
          <Link className={styles.registerLink} href="/register">Register</Link>
        </nav>
        <details className={styles.mobileMenu}><summary aria-label="Open navigation menu"><span /><span /><span /></summary><nav><Link href="/ecommerce">Shop all</Link><Link href="#diaper-deals">Special Deals</Link><Link href="/ecommerce/wishlist">Wishlist ({wishlistCount})</Link><Link href="/ecommerce/cart">Cart ({count})</Link><Link href="/login">Login</Link><Link href="/register">Register</Link><Link href="/ecommerce/orders">Orders</Link><Link href="/ecommerce/account">My account</Link></nav></details>
      </header>
      <nav className={styles.subNav}><Link href="/ecommerce">All Categories</Link>{categories.map(({ name }) => <Link key={name} href={`/ecommerce?category=${encodeURIComponent(name)}`}>{name}</Link>)}<Link href="/ecommerce/orders">Track Order</Link></nav>
    </>
  );
}

function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.footerTop}>
      <div className={styles.footerBrand}><Link href="/ecommerce" className={styles.logo}><span className={styles.logoMark}>o</span><span className={styles.logoWords}>omni<span>baby</span></span></Link><p>Little essentials, big care. Thoughtfully selected for every little milestone.</p><strong>Need help? <a href="tel:+8801700000000">+880 1700-000000</a></strong></div>
      <div className={styles.footerColumn}><h3>Information</h3><Link href="/ecommerce/account">About Us</Link><Link href="/ecommerce/account">Help Center</Link><Link href="/ecommerce/account">FAQs</Link><Link href="/ecommerce/orders">Shipping &amp; Delivery</Link></div>
      <div className={styles.footerColumn}><h3>Customer care</h3><Link href="/ecommerce/orders">Track Order</Link><Link href="/ecommerce/orders">Return Policy</Link><Link href="/ecommerce/account">Privacy Policy</Link><Link href="/ecommerce/account">Terms &amp; Conditions</Link></div>
      <div className={styles.footerColumn}><h3>Get in touch</h3><a href="mailto:hello@omnibaby.bd">hello@omnibaby.bd</a><span>Dhaka, Bangladesh</span><div className={styles.socialLinks}><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://instagram.com" aria-label="Instagram">ig</a><a href="https://youtube.com" aria-label="YouTube">▶</a></div></div>
    </div>
    <div className={styles.paymentFooter}><span>Secure payments</span><b>bKash</b><b>Nagad</b><b>VISA</b><b>COD</b><span>© 2026 Omni Baby · A little care goes a long way.</span></div>
  </footer>;
}

function ApiError({ message }: { message: string }) {
  const needsSignIn = /sign in|session has expired/i.test(message);
  return <div className={styles.error}>{message}{needsSignIn && <> <Link href="/login">Sign in</Link></>}</div>;
}

export function Shell({ children, count, wishlistCount }: { children: React.ReactNode; count?: number; wishlistCount?: number }) {
  return <div className={styles.shell}><Header count={count} wishlistCount={wishlistCount} />{children}<Footer /></div>;
}

function ProductCard({ product, onAdd, onWishlist }: { product: Product; onAdd: (product: Product) => void; onWishlist: (product: Product) => void }) {
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;
  return (
    <article className={styles.productCard}>
      <div className={styles.productImage} style={{ backgroundImage: imageUrl(product) ? `url("${imageUrl(product)}")` : undefined }}>
        <Link href={`/ecommerce/product/${product._id}`} className={styles.productImageLink} aria-label={`View ${product.name}`}>
          <img src={imageUrl(product)} alt={product.name} loading="lazy" onError={(event) => { event.currentTarget.src = "/images/product-placeholder.svg"; }} />
        </Link>
        {discount && <span className={styles.discount}>-{discount}%</span>}
        {product.source === "demo" && <span className={styles.sampleBadge}>DEMO</span>}
        <button className={styles.heart} onClick={() => onWishlist(product)} aria-label={`Save ${product.name}`}><Heart size={17} /></button>
      </div>
      <div className={styles.productCopy}>
        <span className={styles.brand}>{product.brand || product.category}{product.size ? ` · ${product.size}` : ""}</span>
        <Link href={`/ecommerce/product/${product._id}`} className={styles.productName}>{product.name}</Link>
        <div className={styles.stockLabel}>{product.stockDisplay || (product.stock > 0 ? "In stock" : "Out of stock")}</div>
        <div className={styles.productBottom}><div><strong>{formatPrice(product.price)}</strong>{product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}</div>
          <button onClick={() => onAdd(product)} className={styles.addButton} aria-label={`Add ${product.name} to cart`}><ShoppingCart size={17} /></button>
        </div>
      </div>
    </article>
  );
}

export function Marketplace({ mode = "shop" }: { mode?: Mode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [databaseProducts, setDatabaseProducts] = useState<Product[]>([]);
  const { cart: cartItems, wishlist, setCart: setCartItems, setWishlist } = useShopState();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState({ name: "", phone: "", line1: "", area: "", district: "", city: "", postalCode: "", country: "Bangladesh" });
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [productDraft, setProductDraft] = useState({ name: "", description: "", category: "Home", price: "", stock: "", brand: "", image: "" });
  const [storeDraft, setStoreDraft] = useState<Store>({ name: "", description: "", logo: "", banner: "", email: "", phone: "" });
  const [categoryDraft, setCategoryDraft] = useState({ name: "", description: "" });
  const [brandDraft, setBrandDraft] = useState({ name: "", logo: "" });
  const [bannerDraft, setBannerDraft] = useState({ title: "", image: "", href: "" });
  const [settingsDraft, setSettingsDraft] = useState<StoreSettings>({ siteName: "Omni Baby", shippingFee: defaultShippingFee, freeShippingThreshold: defaultFreeShippingThreshold, contactEmail: "", contactPhone: "" });
  const [demoOrderComplete, setDemoOrderComplete] = useState(false);

  useEffect(() => {
    if (mode === "shop") {
      const search = new URLSearchParams(window.location.search);
      setCategory(search.get("category") || "All");
      setQuery(search.get("q") || "");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (mode === "shop") {
          const [result, settingResult] = await Promise.all([
            apiRequest<ListingResponse>("/products?limit=48&page=1&sort=newest"),
            apiRequest<{ settings: StoreSettings }>("/settings"),
          ]);
          if (active) {
            setDatabaseProducts(result.products.map(normalizeDatabaseProduct));
            setSettingsDraft(settingResult.settings);
          }
        } else if (mode === "cart" || mode === "checkout") {
          if (active) setLoading(false);
        } else if (mode === "orders") {
          const result = await apiRequest<{ orders: Order[] }>("/orders/mine");
          if (active) setOrders(result.orders);
        } else if (mode === "wishlist") {
          const result = await apiRequest<ListingResponse>("/products?limit=48&page=1&sort=newest");
          if (active) {
            const savedProducts = [...demoCatalog, ...result.products.map(normalizeDatabaseProduct)]
              .filter((product) => wishlist.includes(product._id));
            setDatabaseProducts(result.products.map(normalizeDatabaseProduct));
            setProducts(savedProducts);
          }
        } else if (mode === "seller" || mode === "admin") {
          if (mode === "seller") {
            const [result, storeResult] = await Promise.all([
              apiRequest<Dashboard>("/dashboard/seller"),
              apiRequest<{ store: Store | null }>("/sellers/store"),
            ]);
            if (active) {
              setDashboard({ ...result, store: storeResult.store });
              if (storeResult.store) setStoreDraft(storeResult.store);
            }
          } else {
            const [result, orderResult, categoryResult, productResult, brandResult, bannerResult, settingsResult] = await Promise.all([
              apiRequest<Dashboard>("/dashboard/admin"),
              apiRequest<{ orders: Order[] }>("/orders/admin"),
              apiRequest<{ categories: AdminCategory[] }>("/categories/admin"),
              apiRequest<ListingResponse>("/products/admin?limit=100"),
              apiRequest<{ brands: AdminBrand[] }>("/brands/admin"),
              apiRequest<{ banners: AdminBanner[] }>("/banners/admin"),
              apiRequest<{ settings: StoreSettings }>("/settings"),
            ]);
            if (active) {
              const dbProducts = productResult.products.map(normalizeDatabaseProduct);
              setDatabaseProducts(dbProducts);
              setDashboard({
                ...result,
                orders: orderResult.orders,
                categories: categoryResult.categories,
                products: dbProducts,
                brands: brandResult.brands,
                banners: bannerResult.banners,
                settings: settingsResult.settings,
              });
              setSettingsDraft(settingsResult.settings);
            }
          }
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "We could not load this page.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [mode, refreshKey, wishlist]);

  const hydratedCart = cartItems;
  const catalogProducts = useMemo(() => [...demoCatalog, ...databaseProducts], [databaseProducts]);
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const min = minPrice === "" ? 0 : Number(minPrice);
    const max = maxPrice === "" ? Number.POSITIVE_INFINITY : Number(maxPrice);
    return catalogProducts
      .filter((product) => category === "All" || product.category.toLowerCase() === category.toLowerCase())
      .filter((product) => brand === "All" || product.brand.toLowerCase().includes(brand.toLowerCase()))
      .filter((product) => product.price >= min && product.price <= max)
      .filter((product) => !term || [product.name, product.brand, product.category, product.description].some((value) => value.toLowerCase().includes(term)))
      .sort((first, second) => sort === "price-asc" ? first.price - second.price : sort === "price-desc" ? second.price - first.price : sort === "rating" ? second.rating - first.rating : Number(second.featured) - Number(first.featured));
  }, [catalogProducts, category, brand, minPrice, maxPrice, query, sort]);
  const visibleProducts = filteredProducts.slice((page - 1) * 12, page * 12);
  const subtotal = hydratedCart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= settingsDraft.freeShippingThreshold ? 0 : settingsDraft.shippingFee;
  const total = subtotal + shipping;

  useEffect(() => {
    setPages(Math.max(1, Math.ceil(filteredProducts.length / 12)));
    if (page > Math.ceil(filteredProducts.length / 12)) setPage(1);
  }, [filteredProducts, page]);

  async function addToCart(product: Product) {
    setNotice("");
    setError("");
    setCartItems((items) => {
      const existing = items.find((line) => line.product._id === product._id);
      return existing
        ? items.map((line) => line.product._id === product._id
            ? { ...line, quantity: Math.min(product.stock, line.quantity + 1) }
            : line)
        : [...items, { product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your cart.`);
  }

  async function saveProduct(product: Product) {
    setError("");
    setWishlist((items) => items.includes(product._id)
      ? items.filter((id) => id !== product._id)
      : [...items, product._id]);
    setNotice(wishlist.includes(product._id) ? `${product.name} removed from your wishlist.` : `${product.name} saved to your wishlist.`);
  }

  async function setQuantity(product: Product, quantity: number) {
    if (quantity < 1) return;
    if (quantity > product.stock) {
      setError(`Only ${product.stock} left in stock.`);
      return;
    }
    setCartItems((items) => items.map((line) => line.product._id === product._id ? { ...line, quantity } : line));
  }

  async function removeItem(product: Product) {
    setCartItems((items) => items.filter((line) => line.product._id !== product._id));
  }

  async function syncDatabaseCart(lines: LocalCartLine[]) {
    const databaseLines = lines.filter((line) => isDatabaseProduct(line.product));
    if (databaseLines.length === 0) return;
    const current = await apiRequest<{ cart: { items: { product: string | Product }[] } }>("/cart");
    const keep = new Set(databaseLines.map((line) => line.product._id));
    for (const line of current.cart.items) {
      const id = typeof line.product === "string" ? line.product : line.product._id;
      if (!keep.has(id)) await apiRequest(`/cart/${id}`, { method: "DELETE" });
    }
    for (const line of databaseLines) {
      await apiRequest(`/cart/${line.product._id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: line.quantity }),
      });
    }
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const realLines = cartItems.filter((line) => isDatabaseProduct(line.product));
      if (realLines.length === 0) {
        setDemoOrderComplete(true);
        setPlacedOrder({
          _id: `DEMO-${Date.now()}`,
          items: [],
          total,
          status: "demo",
          createdAt: new Date().toISOString(),
        });
      } else {
        await syncDatabaseCart(cartItems);
        const result = await apiRequest<{ order: Order }>("/orders", {
          method: "POST",
          body: JSON.stringify({
            shippingAddress: {
              ...address,
              city: address.district,
              line1: `${address.line1}${address.area ? `, ${address.area}` : ""}`,
            },
            paymentMethod: "cod",
            couponCode: appliedCoupon?.code,
          }),
        });
        setDemoOrderComplete(false);
        setPlacedOrder(result.order);
      }
      setCartItems([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not place your order.");
    } finally { setBusy(false); }
  }

  async function applyCoupon() {
    setError("");
    try {
      await syncDatabaseCart(cartItems);
      const result = await apiRequest<{ code: string; discount: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponInput }),
      });
      setAppliedCoupon({ code: result.code, discount: result.discount });
    } catch (reason) {
      setAppliedCoupon(null);
      setError(reason instanceof Error ? reason.message : "We could not apply this coupon.");
    }
  }

  async function subscribeNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiRequest<{ message: string }>("/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      setNotice(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Newsletter signup failed.");
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          ...productDraft,
          price: Number(productDraft.price),
          stock: Number(productDraft.stock),
          images: productDraft.image ? [productDraft.image] : [],
        }),
      });
      if (mode === "admin") {
        const result = await apiRequest<ListingResponse>("/products/admin?limit=100");
        setDatabaseProducts(result.products.map(normalizeDatabaseProduct));
        setDashboard((current) => current ? {
          ...current,
          products: result.products.map(normalizeDatabaseProduct),
          stats: { ...current.stats, products: result.pagination.total },
        } : current);
      } else {
        const result = await apiRequest<Dashboard>("/dashboard/seller");
        setDashboard(result);
      }
      setProductDraft({ name: "", description: "", category: "Home", price: "", stock: "", brand: "", image: "" });
      setNotice(mode === "admin" ? "Database product created." : "Your product is live.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not save this product.");
    } finally { setBusy(false); }
  }

  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ store: Store }>("/sellers/store", {
        method: "PUT",
        body: JSON.stringify(storeDraft),
      });
      setStoreDraft(result.store);
      setNotice("Your store profile has been saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not save your store.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadProductImage(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const image = await uploadImage(file, "product");
      setProductDraft((draft) => ({ ...draft, image }));
      setNotice("Product image uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadStoreImage(file: File | undefined, field: "logo" | "banner") {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const image = await uploadImage(file, "store");
      setStoreDraft((draft) => ({ ...draft, [field]: image }));
      setNotice(`Store ${field} uploaded.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function editProduct(product: Product) {
    if (!isDatabaseProduct(product)) {
      setError("Demo products are not editable in the database.");
      return;
    }
    const price = window.prompt("Set the product price:", String(product.price));
    if (price === null) return;
    const stock = window.prompt("Set available stock:", String(product.stock));
    if (stock === null) return;
    setError("");
    try {
      await apiRequest(`/products/${product._id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...product, price: Number(price), stock: Number(stock) }),
      });
      if (mode === "admin") {
        const result = await apiRequest<ListingResponse>("/products/admin?limit=100");
        const dbProducts = result.products.map(normalizeDatabaseProduct);
        setDatabaseProducts(dbProducts);
        setDashboard((current) => current ? { ...current, products: dbProducts } : current);
      } else {
        const result = await apiRequest<Dashboard>("/dashboard/seller");
        setDashboard((current) => ({ ...result, store: current?.store }));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not update this product.");
    }
  }

  async function deleteProduct(product: Product) {
    if (!isDatabaseProduct(product)) {
      setError("Demo products are not deletable from the database.");
      return;
    }
    if (!window.confirm(`Remove "${product.name}" from your store?`)) return;
    setError("");
    try {
      await apiRequest(`/products/${product._id}`, { method: "DELETE" });
      setDatabaseProducts((items) => items.filter((item) => item._id !== product._id));
      setDashboard((current) => current ? {
        ...current,
        products: current.products?.filter((item) => item._id !== product._id),
        stats: { ...current.stats, products: Math.max(0, (current.stats.products ?? 1) - 1) },
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not remove this product.");
    }
  }

  async function updateSellerOrder(orderId: string, productId: string, status: "shipped" | "delivered") {
    setError("");
    try {
      await apiRequest(`/orders/${orderId}/items/${productId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const result = await apiRequest<Dashboard>("/dashboard/seller");
      setDashboard((current) => ({ ...result, store: current?.store }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not update this order.");
    }
  }

  async function updateSeller(id: string, status: "approved" | "rejected") {
    try {
      await apiRequest(`/dashboard/admin/sellers/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setDashboard((current) => current ? { ...current, pendingSellers: current.pendingSellers?.filter((seller) => seller._id !== id) } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Seller review failed.");
    }
  }

  async function updateAdminOrder(orderId: string, status: "shipped" | "delivered" | "cancelled") {
    setError("");
    try {
      await apiRequest(`/orders/admin/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const result = await apiRequest<{ orders: Order[] }>("/orders/admin");
      setDashboard((current) => current ? { ...current, orders: result.orders } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order update failed.");
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify(categoryDraft),
      });
      const result = await apiRequest<{ categories: AdminCategory[] }>("/categories/admin");
      setDashboard((current) => current ? { ...current, categories: result.categories } : current);
      setCategoryDraft({ name: "", description: "" });
      setNotice("Category added.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Category creation failed.");
    }
  }

  async function deleteCategory(category: AdminCategory) {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    setError("");
    try {
      await apiRequest(`/categories/${category._id}`, { method: "DELETE" });
      setDashboard((current) => current ? {
        ...current,
        categories: current.categories?.filter((item) => item._id !== category._id),
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Category deletion failed.");
    }
  }

  async function createBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/brands", { method: "POST", body: JSON.stringify(brandDraft) });
      const result = await apiRequest<{ brands: AdminBrand[] }>("/brands/admin");
      setDashboard((current) => current ? { ...current, brands: result.brands } : current);
      setBrandDraft({ name: "", logo: "" });
      setNotice("Brand added.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Brand creation failed.");
    }
  }

  async function deleteBrand(brand: AdminBrand) {
    if (!window.confirm(`Delete the ${brand.name} brand?`)) return;
    try {
      await apiRequest(`/brands/${brand._id}`, { method: "DELETE" });
      setDashboard((current) => current ? {
        ...current,
        brands: current.brands?.filter((item) => item._id !== brand._id),
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Brand deletion failed.");
    }
  }

  async function createBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiRequest("/banners", { method: "POST", body: JSON.stringify(bannerDraft) });
      const result = await apiRequest<{ banners: AdminBanner[] }>("/banners/admin");
      setDashboard((current) => current ? { ...current, banners: result.banners } : current);
      setBannerDraft({ title: "", image: "", href: "" });
      setNotice("Promotional banner added.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Banner creation failed.");
    }
  }

  async function deleteBanner(banner: AdminBanner) {
    if (!window.confirm(`Delete the "${banner.title}" promotional banner?`)) return;
    try {
      await apiRequest(`/banners/${banner._id}`, { method: "DELETE" });
      setDashboard((current) => current ? {
        ...current,
        banners: current.banners?.filter((item) => item._id !== banner._id),
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Banner deletion failed.");
    }
  }

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await apiRequest<{ settings: StoreSettings }>("/settings", {
        method: "PUT",
        body: JSON.stringify(settingsDraft),
      });
      setSettingsDraft(result.settings);
      setDashboard((current) => current ? { ...current, settings: result.settings } : current);
      setNotice("Store settings saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Store settings could not be saved.");
    }
  }

  let content: React.ReactNode;
  if (mode === "shop") {
    const demoFeatured = demoCatalog.filter((product) => product.featured).slice(0, 8);
    const featured = [...demoFeatured, ...databaseProducts.filter((product) => product.featured)].slice(0, 8);
    const diaperProducts = catalogProducts.filter((product) => product.category === "Diapers");
    const babyFoodProducts = catalogProducts.filter((product) => product.category === "Baby Food");
    const brandNames = [...new Set(catalogProducts.map((product) => product.brand).filter(Boolean))].slice(0, 12);
    const categoryImage = (name: string) => catalogProducts.find((product) => product.category === name)?.imageUrl || imageUrl(catalogProducts[0]);
    const selectCategory = (name: string) => {
      setCategory(name);
      setBrand("All");
      setPage(1);
      document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" });
    };
    const showAllDeals = () => {
      setCategory("All");
      setBrand("All");
      setPage(1);
      document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" });
    };
    content = <main className={styles.main}>
      <section className={styles.promoGrid} aria-label="Promotions">
        <article className={styles.promoMain}>
          <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1400&q=85" alt="" onError={(event) => { event.currentTarget.src = "/images/product-placeholder.svg"; }} />
          <div className={styles.promoCopy}><span className={styles.eyebrow}>A LITTLE LOVE, EVERY DAY</span><h1>Everything for<br />your little one.</h1><p>Trusted baby essentials, delivered with care across Bangladesh.</p><Link href="#featured-products" className={styles.primaryButton}>Shop Now <ArrowRight size={16} /></Link></div>
        </article>
        <article className={styles.promoCampaign}>
          <img src="https://images.unsplash.com/photo-1604917877934-07d8d248d396?auto=format&fit=crop&w=1000&q=85" alt="" onError={(event) => { event.currentTarget.src = "/images/product-placeholder.svg"; }} />
          <div className={styles.campaignCopy}><span className={styles.eyebrow}>GENTLE ON BABY, KIND TO YOU</span><h2>Diaper days,<br />made easier.</h2><p>Everyday comfort from brands you know.</p><button className={styles.secondaryButton} onClick={() => selectCategory("Diapers")}>Shop diaper deals <ArrowRight size={15} /></button></div>
        </article>
      </section>

      <section className={styles.categorySection} aria-labelledby="categories-title">
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>THE LITTLE THINGS THAT MATTER</span><h2 id="categories-title">Shop by category</h2></div><span>Thoughtful picks for every day</span></div>
        <div className={styles.roundCategories}>{categories.map(({ name, Icon }) => <button key={name} className={styles.categoryCircle} onClick={() => selectCategory(name)}><span className={styles.categoryCircleImage}><img src={categoryImage(name)} alt="" onError={(event) => { event.currentTarget.src = "/images/product-placeholder.svg"; }} /><span className={styles.categoryCircleIcon}><Icon size={21} /></span></span><strong>{name}</strong><small>{catalogProducts.filter((product) => product.category === name).length} products</small></button>)}</div>
      </section>

      <section className={styles.productSection} id="featured-products">
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>HAND-PICKED FOR YOUR LITTLE ONE</span><h2>Featured products</h2></div><button className={styles.textLink} onClick={showAllDeals}>Shop all <ArrowRight size={15} /></button></div>
        <div className={styles.productGrid}>{featured.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onWishlist={saveProduct} />)}</div>
      </section>

      <section className={styles.productSection} id="diaper-deals">
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>COMFORT FOR EVERY LITTLE BOTTOM</span><h2>Diapering essentials</h2><p>Little-day and all-night favorites from trusted brands.</p></div><button className={styles.textLink} onClick={() => selectCategory("Diapers")}>See all diapers <ArrowRight size={15} /></button></div>
        <div className={styles.productGrid}>{diaperProducts.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onWishlist={saveProduct} />)}</div>
        <button className={styles.showDeals} onClick={() => selectCategory("Diapers")}>Show All Deals <ArrowRight size={16} /></button>
      </section>

      <section className={styles.productSection}>
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>GOODNESS FOR GROWING DAYS</span><h2>Baby foods</h2><p>Carefully selected feeding and weaning essentials.</p></div><button className={styles.textLink} onClick={() => selectCategory("Baby Food")}>See all baby food <ArrowRight size={15} /></button></div>
        <div className={styles.productGrid}>{babyFoodProducts.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onWishlist={saveProduct} />)}</div>
        <button className={styles.showDeals} onClick={() => selectCategory("Baby Food")}>Show All Deals <ArrowRight size={16} /></button>
      </section>

      <section className={styles.brandSection}>
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>THE NAMES PARENTS TRUST</span><h2>Shop top brands</h2></div></div>
        <div className={styles.brandGrid}>{brandNames.map((name, index) => <button key={name} onClick={() => { setBrand(name); setCategory("All"); setPage(1); document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" }); }}><span>{name.slice(0, 1)}</span><strong>{name}</strong><small>{index % 2 ? "Little moments, made lovely" : "Care you can count on"}</small></button>)}</div>
      </section>

      <section className={styles.catalogSection} id="all-products">
        <div className={styles.homeSectionHeading}><div><span className={styles.eyebrow}>FIND JUST THE RIGHT THING</span><h2>Shop all baby essentials</h2><p>Everyday favorites, selected with care.</p></div><label className={styles.sort}><SlidersHorizontal size={16} /><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Sort products"><option value="newest">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={14} /></label></div>
        <div className={styles.catalogFilters}>
          <div className={styles.filterChips}><button className={category === "All" ? styles.activeChip : ""} onClick={() => selectCategory("All")}>All items</button>{categories.map(({ name }) => <button key={name} className={category === name ? styles.activeChip : ""} onClick={() => selectCategory(name)}>{name}</button>)}</div>
          <label className={styles.filterLabel}>Brand<input value={brand === "All" ? "" : brand} placeholder="Any brand" onChange={(event) => { setBrand(event.target.value || "All"); setPage(1); }} /></label>
          <label className={styles.filterLabel}>Min price<input aria-label="Minimum price" type="number" min="0" placeholder="৳ Min" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} /></label>
          <label className={styles.filterLabel}>Max price<input aria-label="Maximum price" type="number" min="0" placeholder="৳ Max" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} /></label>
        </div>
        {error && databaseProducts.length === 0 && <p className={styles.apiNotice}>Showing the local demo collection. Live products are temporarily unavailable.</p>}
        {notice && <div className={styles.success}>{notice}</div>}
        {loading && databaseProducts.length === 0 && <p className={styles.catalogStatus}>Loading live products… Demo products are already available below.</p>}
        {visibleProducts.length ? <div className={styles.productGrid}>{visibleProducts.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onWishlist={saveProduct} />)}</div> : <div className={styles.empty}><ShoppingBag size={30} /><h3>No products match those filters.</h3><button className={styles.secondaryButton} onClick={showAllDeals}>Clear filters</button></div>}
        <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>
      </section>

      <section className={styles.aboutSection}><span className={styles.aboutIcon}><HeartHandshake size={24} /></span><div><span className={styles.eyebrow}>MADE FOR FAMILIES IN BANGLADESH</span><h2>A little more care, in every delivery.</h2><p>Omni Baby brings together baby essentials, trusted food and formula, diapers, feeding products, toys, and personal care in one friendly place. Shop with confidence and find the little things that make every day easier, delivered across Bangladesh.</p></div><Link href="#all-products" className={styles.secondaryButton}>Discover our store <ArrowRight size={15} /></Link></section>
      <section className={styles.newsletter}><span className={styles.eyebrow}>A LITTLE SOMETHING GOOD</span><h2>Little updates, lovely offers.</h2><p>New arrivals and thoughtful deals, straight to your inbox.</p>{error && <ApiError message={error} />}{notice && <p className={styles.success}>{notice}</p>}<form onSubmit={subscribeNewsletter}><input name="email" type="email" required placeholder="Your email address" aria-label="Your email address" /><button className={styles.primaryButton}>Sign me up <ArrowRight size={16} /></button></form></section>
    </main>;
  } else if (mode === "cart") {
    content = <main className={styles.page}>
      <div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> Your cart</div>
      <h1 className={styles.pageTitle}>Your cart <span>({hydratedCart.reduce((sum, line) => sum + line.quantity, 0)} items)</span></h1>
      {hydratedCart.length ? <div className={styles.cartLayout}>
        <section className={styles.cartLines}>{hydratedCart.map(({ product, quantity }) => <article className={styles.cartLine} key={product._id}>
          <div className={styles.cartImage}><img src={imageUrl(product)} alt={product.name} onError={(event) => { event.currentTarget.src = "/images/product-placeholder.svg"; }} /></div>
          <div className={styles.cartDetails}><span className={styles.brand}>{product.brand} · {product.size || product.category}{product.source === "demo" ? " · Demo item" : ""}</span><h2>{product.name}</h2><p>{product.description}</p><div className={styles.quantity}><button onClick={() => quantity > 1 && setQuantity(product, quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(product, quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div></div>
          <strong>{formatPrice(product.price * quantity)}</strong><button className={styles.remove} onClick={() => removeItem(product)} aria-label={`Remove ${product.name}`}><Trash2 size={17} /></button>
        </article>)}</section>
        <aside className={styles.summary}><h2>Order summary</h2><div><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div><p className={styles.shippingHint}>{subtotal >= settingsDraft.freeShippingThreshold ? "You unlocked free delivery." : `Add ${formatPrice(settingsDraft.freeShippingThreshold - subtotal)} for free delivery.`}</p><div className={styles.total}><strong>Total</strong><strong>{formatPrice(total)}</strong></div><Link href="/ecommerce/checkout" className={styles.primaryButton}>Continue to checkout <ArrowRight size={17} /></Link><Link href="/ecommerce" className={styles.continue}><ArrowLeft size={15} /> Continue shopping</Link><small>Cash on delivery across Bangladesh</small></aside>
      </div> : <div className={styles.empty}><ShoppingBag size={32} /><h2>Your cart is ready for something lovely.</h2><p>Find baby essentials and everyday favorites from the collection.</p><Link href="/ecommerce" className={styles.primaryButton}>Start exploring</Link></div>}
    </main>;
  } else if (mode === "checkout") {
    content = <main className={styles.page}>
      <div className={styles.breadcrumb}><Link href="/ecommerce/cart">Your cart</Link><span>/</span> Checkout</div>
      {placedOrder ? <div className={styles.confirmation}><span className={styles.confirmIcon}><Check size={30} /></span><span className={styles.eyebrow}>{demoOrderComplete ? "DEMO CHECKOUT" : "ORDER RECEIVED"}</span><h1>{demoOrderComplete ? "Your demo checkout is complete." : "Thank you for your order."}</h1><p>{demoOrderComplete ? "This was a frontend-only demo checkout. No payment was taken and no real order or MongoDB record was created." : <>Your real database order number is <strong>{placedOrder._id}</strong>. Cash on delivery is selected.</>}</p>{demoOrderComplete ? <Link href="/ecommerce" className={styles.primaryButton}>Continue shopping <ArrowRight size={17} /></Link> : <Link href="/ecommerce/orders" className={styles.primaryButton}>View your orders <ArrowRight size={17} /></Link>}</div> : <><h1 className={styles.pageTitle}>Delivery &amp; payment</h1>{error && <ApiError message={error} />}{hydratedCart.some((line) => isDatabaseProduct(line.product)) && <p className={styles.demoNotice}>Database items will be submitted as a real order. Demo items stay frontend-only and are never sent to MongoDB.</p>}{hydratedCart.some((line) => line.product.source === "demo") && !hydratedCart.some((line) => isDatabaseProduct(line.product)) && <p className={styles.demoNotice}>Demo-only checkout: no real order will be created and no product data will be sent to the backend.</p>}<div className={styles.checkoutLayout}><form className={styles.checkoutForm} onSubmit={placeOrder}><h2>Delivery details</h2><div className={styles.formGrid}>{([["name", "Customer name"], ["phone", "Phone number"], ["line1", "Street address"], ["area", "Area"], ["district", "District"], ["postalCode", "Postal code"]] as const).map(([key, label]) => <label key={key}>{label}<input required value={address[key]} onChange={(event) => setAddress((value) => ({ ...value, [key]: event.target.value }))} /></label>)}</div><h2>Payment method</h2><label className={styles.payment}><input type="radio" checked readOnly /> Cash on Delivery <span>Pay when your order arrives</span></label><button disabled={busy || !hydratedCart.length} className={styles.primaryButton}>{busy ? "Placing order…" : demoOrderComplete ? "Complete demo checkout" : "Place order"} <ArrowRight size={17} /></button></form><aside className={styles.summary}><h2>Order summary</h2>{hydratedCart.map(({ product, quantity }) => <div key={product._id}><span>{product.name} × {quantity}{product.source === "demo" ? " (demo)" : ""}</span><span>{formatPrice(product.price * quantity)}</span></div>)}<div><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>{appliedCoupon && <div><span>Discount</span><span>−{formatPrice(appliedCoupon.discount)}</span></div>}<div className={styles.total}><strong>Total</strong><strong>{formatPrice(total - (appliedCoupon?.discount ?? 0))}</strong></div></aside></div></>}</main>;
  } else if (mode === "orders") {
    content = <main className={styles.page}><div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> Orders</div><h1 className={styles.pageTitle}>Your orders</h1>{error && <ApiError message={error} />}{loading ? <div className={styles.loading}>Loading your orders…</div> : error ? <button className={styles.secondaryButton} onClick={() => setRefreshKey((value) => value + 1)}>Try again</button> : orders.length ? <div className={styles.orderList}>{orders.map((order) => <article className={styles.orderCard} key={order._id}><div className={styles.orderHeading}><span>Order <strong>#{order._id.slice(-8).toUpperCase()}</strong></span><span className={styles.orderStatus}>{order.status}</span><span>{new Date(order.createdAt).toLocaleDateString()}</span><strong>{formatPrice(order.total)}</strong></div>{order.items.map((item, index) => <div className={styles.orderItem} key={`${item.product}-${index}`}><div className={styles.orderThumb} style={{ backgroundImage: item.image ? `url("${item.image}")` : undefined }} /><span>{item.name} × {item.quantity}</span><span>{item.status}</span></div>)}</article>)}</div> : <div className={styles.empty}><ShoppingBag size={32} /><h2>Nothing ordered yet.</h2><p>Your next favorite thing is out there.</p><Link href="/ecommerce" className={styles.primaryButton}>Browse the collection</Link></div>}</main>;
  } else if (mode === "wishlist") {
    content = <main className={styles.page}><div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> Saved items</div><h1 className={styles.pageTitle}>Your wishlist</h1>{error && <ApiError message={error} />}{loading ? <div className={styles.loading}>Loading your saved items…</div> : error ? <button className={styles.secondaryButton} onClick={() => setRefreshKey((value) => value + 1)}>Try again</button> : products.length ? <div className={styles.productGrid}>{products.map((product) => <ProductCard key={product._id} product={product} onAdd={addToCart} onWishlist={saveProduct} />)}</div> : <div className={styles.empty}><Heart size={32} /><h2>Your wishlist is waiting.</h2><p>Save the finds you want to come back to.</p><Link href="/ecommerce" className={styles.primaryButton}>Browse the collection</Link></div>}</main>;
  } else if (mode === "seller") {
    content = <main className={styles.page}>
      <div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> Seller studio</div>
      <div className={styles.dashboardTitle}><div><span className={styles.eyebrow}>YOUR BUSINESS, AT A GLANCE</span><h1>Seller studio</h1></div><span className={styles.pill}>Seller workspace</span></div>
      {error && <div className={styles.error}>{error} <Link href="/login">Sign in with an approved seller account</Link></div>}
      {notice && <div className={styles.success}>{notice}</div>}
      {dashboard && <>
        <div className={styles.stats}>{[["Products", "products"], ["Orders", "orders"], ["Revenue", "revenue"], ["Low stock", "lowStock"]].map(([label, key]) => <article key={key}><span>{label}</span><strong>{key === "revenue" ? formatPrice(dashboard.stats[key] || 0) : dashboard.stats[key] ?? 0}</strong></article>)}</div>
        <div className={styles.dashboardGrid}>
          <section className={styles.dashboardPanel}>
            <h2>Your products</h2>
            {dashboard.products?.map((product) => <div className={styles.dashboardRow} key={product._id}><span>{product.name}<small>{product.stock} in stock</small></span><strong>{formatPrice(product.price)}</strong><div className={styles.actions}><button onClick={() => void editProduct(product)}>Edit</button><button onClick={() => void deleteProduct(product)}>Remove</button></div></div>)}
            {!dashboard.products?.length && <p className={styles.muted}>Your first product will show up here.</p>}
          </section>
          <form className={styles.dashboardPanel} onSubmit={createProduct}>
            <h2>Add a product</h2>
            {(["name", "description", "category", "brand", "price", "stock", "image"] as const).map((key) => <label className={styles.compactField} key={key}>{key === "image" ? "Image URL" : key.charAt(0).toUpperCase() + key.slice(1)}<input required value={productDraft[key]} type={key === "price" || key === "stock" ? "number" : "text"} min={key === "price" || key === "stock" ? "0" : undefined} step={key === "price" ? "0.01" : undefined} onChange={(event) => setProductDraft((draft) => ({ ...draft, [key]: event.target.value }))} /></label>)}
            <label className={styles.compactField}>Upload product image<input type="file" accept="image/avif,image/jpeg,image/png,image/webp" onChange={(event) => void uploadProductImage(event.currentTarget.files?.[0])} /></label>
            <button disabled={busy} className={styles.primaryButton}>{busy ? "Saving…" : "Publish product"} <ArrowRight size={16} /></button>
          </form>
          <form className={styles.dashboardPanel} onSubmit={saveStore}>
            <h2>Store profile</h2>
            {(["name", "description", "logo", "banner", "email", "phone"] as const).map((key) => <label className={styles.compactField} key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}<input required={key === "name"} type={key === "email" ? "email" : "text"} value={storeDraft[key]} onChange={(event) => setStoreDraft((store) => ({ ...store, [key]: event.target.value }))} />{(key === "logo" || key === "banner") && <input type="file" accept="image/avif,image/jpeg,image/png,image/webp" onChange={(event) => void uploadStoreImage(event.currentTarget.files?.[0], key)} />}</label>)}
            <button disabled={busy} className={styles.primaryButton}>Save store profile <Check size={16} /></button>
          </form>
        </div>
        <section className={`${styles.dashboardPanel} ${styles.orderPanel}`}>
          <h2>Orders for your store</h2>
          {dashboard.orders?.flatMap((order) => order.items.map((item) => ({ order, item }))).length ? dashboard.orders.flatMap((order) => order.items.map((item) => <div className={styles.dashboardRow} key={`${order._id}-${item.product}`}><span>{item.name}<small>Order #{order._id.slice(-8).toUpperCase()} · {item.quantity} items · {item.status}</small></span><strong>{formatPrice(item.unitPrice * item.quantity)}</strong>{item.status === "processing" ? <button onClick={() => void updateSellerOrder(order._id, item.product, "shipped")}>Mark shipped</button> : item.status === "shipped" ? <button onClick={() => void updateSellerOrder(order._id, item.product, "delivered")}>Mark delivered</button> : null}</div>)) : <p className={styles.muted}>No orders for your products yet.</p>}
        </section>
      </>}
    </main>;
  } else {
    content = <main className={styles.page}>
      <div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span> Marketplace admin</div>
      <div className={styles.dashboardTitle}><div><span className={styles.eyebrow}>MARKETPLACE OVERVIEW</span><h1>Admin console</h1></div><span className={styles.pill}>Administrator workspace</span></div>
      {error && <div className={styles.error}>{error} <Link href="/login">Sign in as an administrator</Link></div>}
      {notice && <div className={styles.success}>{notice}</div>}
      {dashboard && <>
        <div className={styles.stats}>{[["Revenue", "revenue"], ["Orders", "orders"], ["Customers", "customers"], ["Sellers", "sellers"], ["Products", "products"]].map(([label, key]) => <article key={key}><span>{label}</span><strong>{key === "revenue" ? formatPrice(dashboard.stats[key] || 0) : dashboard.stats[key] ?? 0}</strong></article>)}</div>
        <div className={styles.dashboardGrid}>
          <section className={styles.dashboardPanel}>
            <h2>Seller applications</h2>
            {dashboard.pendingSellers?.length ? dashboard.pendingSellers.map((seller) => <div className={styles.dashboardRow} key={seller._id}><span>{seller.name}<small>{seller.email}</small></span><div className={styles.actions}><button onClick={() => updateSeller(seller._id, "approved")}>Approve</button><button onClick={() => updateSeller(seller._id, "rejected")}>Reject</button></div></div>) : <p className={styles.muted}>No applications waiting for review.</p>}
          </section>
          <form className={styles.dashboardPanel} onSubmit={createCategory}>
            <h2>Add a category</h2>
            <label className={styles.compactField}>Name<input required value={categoryDraft.name} onChange={(event) => setCategoryDraft((draft) => ({ ...draft, name: event.target.value }))} /></label>
            <label className={styles.compactField}>Description<input value={categoryDraft.description} onChange={(event) => setCategoryDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
            <button className={styles.primaryButton}>Create category <ArrowRight size={16} /></button>
            <h2 className={styles.categoryListTitle}>Categories</h2>
            {dashboard.categories?.map((category) => <div className={styles.dashboardRow} key={category._id}><span>{category.name}<small>{category.description}</small></span><button onClick={() => void deleteCategory(category)} type="button">Delete</button></div>)}
          </form>
        </div>
        <section className={`${styles.dashboardPanel} ${styles.orderPanel}`}>
          <h2>Marketplace orders</h2>
          {dashboard.orders?.length ? dashboard.orders.map((order) => <div className={styles.dashboardRow} key={order._id}><span>Order #{order._id.slice(-8).toUpperCase()}<small>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</small></span><strong>{formatPrice(order.total)}</strong><span className={styles.orderStatus}>{order.status}</span><div className={styles.actions}>{order.status === "processing" && <><button onClick={() => void updateAdminOrder(order._id, "shipped")}>Ship</button><button onClick={() => void updateAdminOrder(order._id, "cancelled")}>Cancel</button></>}{order.status === "shipped" && <button onClick={() => void updateAdminOrder(order._id, "delivered")}>Deliver</button>}</div></div>) : <p className={styles.muted}>There are no marketplace orders yet.</p>}
        </section>
      </>}
    </main>;
  }

  return <Shell count={cartItems.reduce((count, line) => count + line.quantity, 0)}>{content}</Shell>;
}
