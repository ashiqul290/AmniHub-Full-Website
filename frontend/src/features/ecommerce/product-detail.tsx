"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { apiRequest, formatPrice, imageUrl, type Product, type Review } from "./api";
import { Shell } from "./marketplace";
import styles from "./marketplace.module.css";

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<{ product: Product }>(`/products/${params.id}`)
      .then(({ product: result }) => {
        if (active) {
          setProduct(result);
          setSelectedImage(imageUrl(result));
          void apiRequest<{ reviews: Review[] }>(`/reviews/${result._id}`)
            .then((reviewResult) => {
              if (active) setReviews(reviewResult.reviews);
            })
            .catch((reason: unknown) => {
              if (active) setReviewError(reason instanceof Error ? reason.message : "We could not load reviews.");
            });
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "We could not find that product.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [params.id]);

  async function addToBag(buyNow = false) {
    if (!product) return;
    setError("");
    setNotice("");
    try {
      await apiRequest(`/cart/${product._id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      if (buyNow) window.location.assign("/ecommerce/checkout");
      else setNotice("Added to your bag.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not add this item.");
    }
  }

  async function toggleWishlist() {
    if (!product) return;
    setError("");
    try {
      await apiRequest(`/wishlist/${product._id}`, { method: saved ? "DELETE" : "PUT" });
      setSaved((value) => !value);
      setNotice(saved ? "Removed from your wishlist." : "Saved to your wishlist.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your wishlist.");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");
    try {
      await apiRequest(`/reviews/${product._id}`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(reviewRating),
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const result = await apiRequest<{ reviews: Review[] }>(`/reviews/${product._id}`);
      setReviews(result.reviews);
      setProduct((current) => current ? {
        ...current,
        reviewCount: result.reviews.length,
        rating: result.reviews.length
          ? result.reviews.reduce((sum, review) => sum + review.rating, 0) / result.reviews.length
          : 0,
      } : current);
      setReviewTitle("");
      setReviewComment("");
      setReviewNotice("Your review has been published.");
    } catch (reason) {
      setReviewError(reason instanceof Error ? reason.message : "We could not post your review.");
    } finally {
      setReviewBusy(false);
    }
  }

  return <Shell><main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/ecommerce">Shop</Link><span>/</span>{product?.category || "Product"}</div>
    {error && <div className={styles.error}>{error}{/sign in|session has expired/i.test(error) && <> <Link href="/login">Sign in</Link></>}</div>}
    {loading ? <div className={styles.loading}>Loading product…</div> : product ? <section className={styles.detailLayout}>
      <div className={styles.gallery}>
        <div className={styles.detailImage} style={{ backgroundImage: selectedImage ? `url("${selectedImage}")` : undefined }} />
        {product.images.length > 1 && <div className={styles.thumbnails}>{product.images.map((image, index) => <button key={image} onClick={() => setSelectedImage(image)} aria-label={`View image ${index + 1}`} style={{ backgroundImage: `url("${image}")` }} />)}</div>}
      </div>
      <div className={styles.detailCopy}>
        <span className={styles.eyebrow}>{product.brand || product.category}</span>
        <h1>{product.name}</h1>
        <div className={styles.rating}>{product.reviewCount ? <><Star size={15} fill="currentColor" /> {product.rating.toFixed(1)} <span>({product.reviewCount} reviews)</span></> : <span>No reviews yet</span>}</div>
        <div className={styles.detailPrice}>{formatPrice(product.price)}{product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}</div>
        <p className={styles.detailDescription}>{product.description}</p>
        <span className={product.stock > 0 ? styles.stock : styles.outStock}>{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</span>
        <button className={styles.saveButton} onClick={() => void toggleWishlist()} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}><Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save for later"}</button>
        <div className={styles.detailActions}>
          <div className={styles.quantity}><button disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button disabled={quantity >= product.stock} onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div>
          <button disabled={!product.stock} className={styles.primaryButton} onClick={() => void addToBag()}>Add to bag <ArrowRight size={16} /></button>
          <button disabled={!product.stock} className={styles.secondaryButton} onClick={() => void addToBag(true)}>Buy now</button>
        </div>
        {notice && <p className={styles.success}><Check size={15} /> {notice}</p>}
        <div className={styles.perks}><div><Truck size={17} /><span><b>Complimentary shipping</b><small>On orders over $75</small></span></div><div><ShieldCheck size={17} /><span><b>Thoughtful quality</b><small>Made to be loved for longer</small></span></div></div>
        <div className={styles.descriptionBlock}><h2>About this piece</h2><p>{product.description}</p><p>Carefully selected for quality, function, and timeless everyday use.</p></div>
      </div>
    </section> : error ? <div className={styles.empty}><h2>We couldn't load this product.</h2><button className={styles.secondaryButton} onClick={() => window.location.reload()}>Try again</button></div> : <div className={styles.empty}><h2>We couldn't find this product.</h2><Link href="/ecommerce" className={styles.primaryButton}><ArrowLeft size={15} /> Back to the shop</Link></div>}
    {product && <section className={styles.reviews}>
      <div className={styles.reviewHeading}><span className={styles.eyebrow}>CUSTOMER NOTES</span><h2>Reviews {reviews.length > 0 && <span>({reviews.length})</span>}</h2><p>Only customers with a delivered order can leave a review.</p></div>
      <form className={styles.reviewForm} onSubmit={submitReview}>
        <label>Rating<select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>)}</select></label>
        <label>Headline<input maxLength={120} value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Sum it up in a few words" /></label>
        <label>Your review<textarea required minLength={3} maxLength={2000} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="What did you think?" /></label>
        {reviewError && <p role="alert" className={styles.formError}>{reviewError}{/sign in|session has expired/i.test(reviewError) && <> <Link href="/login">Sign in</Link></>}</p>}
        {reviewNotice && <p role="status" className={styles.success}><Check size={15} /> {reviewNotice}</p>}
        <button className={styles.primaryButton} disabled={reviewBusy}>{reviewBusy ? "Publishing…" : "Post review"} <ArrowRight size={15} /></button>
      </form>
      <div className={styles.reviewList}>{reviews.length ? reviews.map((review) => <article key={review._id} className={styles.reviewCard}><div className={styles.reviewMeta}><strong>{review.user?.name || "Customer"}</strong><span><Star size={13} fill="currentColor" /> {review.rating}</span><time>{new Date(review.createdAt).toLocaleDateString()}</time></div>{review.title && <h3>{review.title}</h3>}<p>{review.comment}</p></article>) : <p className={styles.muted}>There are no reviews yet. Be the first to share your experience after delivery.</p>}</div>
    </section>}
  </main></Shell>;
}
