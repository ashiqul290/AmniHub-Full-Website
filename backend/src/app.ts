import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRouter from "./modules/ecommerce/routes/auth.js";
import productRouter from "./modules/ecommerce/routes/products.js";
import cartRouter from "./modules/ecommerce/routes/cart.js";
import orderRouter from "./modules/ecommerce/routes/orders.js";
import dashboardRouter from "./modules/ecommerce/routes/dashboard.js";
import catalogRouter from "./modules/ecommerce/routes/catalog.js";
import wishlistRouter from "./modules/ecommerce/routes/wishlist.js";
import reviewRouter from "./modules/ecommerce/routes/reviews.js";
import couponRouter from "./modules/ecommerce/routes/coupons.js";
import sellerRouter from "./modules/ecommerce/routes/sellers.js";
import uploadRouter from "./modules/ecommerce/routes/uploads.js";
import newsletterRouter from "./modules/ecommerce/routes/newsletter.js";
import addressRouter from "./modules/ecommerce/routes/addresses.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "omnihub-api" });
});
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api", catalogRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/sellers", sellerRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/addresses", addressRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found." });
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
          ? 409
          : typeof error === "object" &&
              error !== null &&
              "name" in error &&
              (error.name === "ValidationError" || error.name === "CastError")
            ? 400
        : 500;
    response.status(statusCode).json({ message });
  },
);

export default app;
