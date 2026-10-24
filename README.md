# OmniHub

OmniHub is a modular platform with separate Next.js and Express applications.
The e-commerce module is available at `/ecommerce` and uses MongoDB through
Mongoose; it is designed to coexist with the other OmniHub modules.

## Requirements

- Node.js 20 or newer and npm
- MongoDB configured as a replica set (order placement uses transactions)
- Cloudinary credentials for seller image uploads

## Configure

Install each application's dependencies:

```sh
npm install --prefix frontend
npm install --prefix backend
```

Copy the example environment files and configure the values:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Set a random `JWT_SECRET` of at least 32 characters, MongoDB's replica-set
connection string, and the frontend origin in `backend/.env`. Configure the
Cloudinary cloud name, API key, and API secret to enable signed image uploads.
Configure SMTP host, port, user, password, and sender to enable password reset
emails. The frontend uses `NEXT_PUBLIC_API_URL` to locate the API; its shipping
fee and free-shipping threshold should match the backend environment values.

For local MongoDB, start it with replica-set mode enabled and initialize it
once:

```sh
mongod --replSet rs0 --bind_ip localhost
mongosh --eval 'rs.initiate()'
```

The example URI uses `replicaSet=rs0`. Use strong, private values for
`SEED_ADMIN_PASSWORD` and `SEED_SELLER_PASSWORD`; do not deploy the example
credentials.

## Run locally

From the repository root, start the frontend and backend in separate terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

Seed the database with demo products, categories, brands, an approved seller,
and (if configured) an administrator:

```sh
npm run seed --prefix backend
```

The seed requires `SEED_SELLER_EMAIL` and `SEED_SELLER_PASSWORD` (at least 12
characters). The administrator is created only when both seed admin variables
are configured. Demo products use remote Unsplash image URLs; sellers can
upload their own product and store images to Cloudinary.

Production builds:

```sh
npm run build:backend
npm run build:frontend
npm run start:backend
npm run start:frontend
```

The API listens on port `4000` by default. `GET /api/health` is its health
endpoint.

## E-commerce surfaces

- Customer storefront: `/ecommerce`
- Product details: `/ecommerce/product/:id`
- Cart, checkout, and COD orders: `/ecommerce/cart`,
  `/ecommerce/checkout`, `/ecommerce/orders`
- Saved products: `/ecommerce/wishlist`
- Customer account/profile and saved addresses: `/ecommerce/account`
- Seller studio: `/ecommerce/seller`
- Marketplace admin: `/ecommerce/admin`
- Customer and seller sign-up, sign-in, and logout APIs use HTTP-only JWT
  cookies. Forgot-password/reset links are single-use, expire after 30 minutes,
  and are sent through configured SMTP. Seller accounts require admin approval
  before using seller APIs.

The backend includes product search/filter/sort/pagination, customer cart and
wishlist APIs, transaction-backed stock validation and order placement,
coupon validation, delivered-order review APIs, signed Cloudinary uploads,
seller-owned product/store/order operations, admin seller/category/order
controls, and database-derived
dashboard statistics. Mongoose models cover users, products, categories,
subcategories, brands, carts, wishlists, orders, payments, reviews, coupons,
seller stores, banners, addresses, notifications, newsletter subscribers, and
website settings.

## API overview

- `/api/auth` — register, login, current session, logout
- `/api/addresses` — customer-owned saved delivery addresses
- `/api/products` — browse/search/filter products and seller-owned product CRUD
- `/api/cart` and `/api/wishlist` — customer shopping state
- `/api/orders` — transactional COD checkout, customer/seller/admin orders
- `/api/categories`, `/api/brands`, `/api/banners` — catalog data and
  administrator category management
- `/api/reviews` and `/api/coupons` — reviews and coupon validation
- `/api/sellers` and `/api/dashboard` — seller store and role-scoped analytics
- `/api/uploads/signature` — signed Cloudinary image upload parameters
- `/api/newsletter` — newsletter subscription records

## Current integration boundaries

Cash on delivery is the active checkout method. A payment model is present, but
an external payment provider and its webhook lifecycle still need provider
credentials and integration before card payments can be enabled. Saved-address
management, full banner/brand moderation, and expanded admin reporting are not
enabled yet. Do not expose admin access by adding public admin registration;
create administrator accounts through the configured seed process or a trusted
operator workflow.
