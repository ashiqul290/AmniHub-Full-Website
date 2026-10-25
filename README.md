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

## Jobs & Careers module

The Jobs module is separate from the existing storefront and is available at:

- Public listings and filters: `/jobs`
- Job details: `/jobs/:id`
- Job seeker profile, saved jobs, applications, interviews, and proposals:
  `/jobs/dashboard`
- Employer company, job, project, and applicant workspace: `/jobs/employer`
- Job and company moderation: `/jobs/admin`

The 20 sample roles in `frontend/src/data/defaultJobs.js` are frontend-only
records with `demo-job-` IDs. They support local search and filters, are never
sent to MongoDB, and cannot be edited through the job APIs. Live jobs and
freelance projects use Mongoose and are loaded through the API.

Jobs reuse OmniHub's HTTP-only JWT session and role model: customer accounts
can maintain a job-seeker profile and apply; approved seller accounts can
manage their company and listings; and admin accounts moderate companies,
jobs, and freelance projects. Seller approval remains controlled by the
existing OmniHub admin workflow. Employer-created listings and projects start
as pending and are only shown publicly after an administrator approves them.
The Jobs API does not add a new authentication mechanism or seed demo records.

Jobs API endpoints (all under `/api`):

- `GET /jobs` — published jobs with keyword, category, work mode, type,
  experience, location, salary, company, date, sort, and pagination filters
- `GET /jobs/categories` and `GET /jobs/:id` — categories and published job
  details
- `POST /jobs/company`, `GET /jobs/company/mine` — employer company profile
- `POST /jobs`, `GET /jobs/mine`, `PATCH /jobs/:id`, `PATCH /jobs/:id/close`,
  `DELETE /jobs/:id` — employer-owned job listings
- `POST /jobs/:id/apply`, `GET /jobs/applications/mine`,
  `DELETE /jobs/applications/:applicationId` — applications and withdrawal
- `PUT /jobs/:id/save`, `DELETE /jobs/:id/save`, `GET /jobs/saved` — saved jobs
- `GET /jobs/profile`, `PUT /jobs/profile` — job-seeker profile
- `GET /jobs/:id/applications`, `PATCH /jobs/applications/:applicationId/status`,
  `POST /jobs/interviews`, `GET /jobs/interviews/mine` — employer applicant
  review and interview scheduling
- `GET /jobs/freelance`, `GET /jobs/freelance/:id`,
  `POST /jobs/freelance`, `POST /jobs/freelance/:id/proposals`,
  `GET /jobs/proposals/mine` — distinct freelance-project listings and
  proposals
- `/jobs/admin/*` — listing moderation, company verification, and overview

## Jobs module integration boundaries

The current Jobs module provides the public search/detail experience, frontend
sample records, Mongo-backed job and freelance-project listing, employer
ownership checks, application status tracking, saved jobs, profile links,
interview records, proposals, and basic administration. It currently reuses
the existing customer/seller/admin roles rather than defining separate
employer and recruiter account roles.

Resume management currently stores a validated HTTPS URL on the seeker profile
and application; a private resume-file upload and authorized download service
has not been added. Job alerts and notification delivery, employer/recruiter
seat assignments, subscription plans, advanced analytics, dispute/report
moderation, and freelancer/client messaging are not implemented. Do not treat
this initial module as providing those services.

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
