import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import User from "../models/User.js";
import { clearSessionCookie, requireAuth, setSessionCookie } from "../middleware/auth.js";
import { isSmtpConfigured, sendPasswordResetEmail } from "../services/email.js";

const router = Router();
const publicUser = (user: { _id: unknown; name: string; email: string; phone?: string; role: string; sellerStatus: string }) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone ?? "",
  role: user.role,
  sellerStatus: user.sellerStatus,
});

router.post("/register", async (request, response, next) => {
  try {
    const { name, email, password, role, phone } = request.body ?? {};
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password) ||
      !["customer", "seller"].includes(role) ||
      (phone !== undefined &&
        (typeof phone !== "string" || phone.trim().length > 32))
    ) {
      response.status(400).json({
        message: "Provide a name, valid email, and a password with at least 10 characters including a letter and number.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      response.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      passwordHash: await bcrypt.hash(password, 12),
      role,
    });
    const data = publicUser(user);
    setSessionCookie(response, {
      id: data.id,
      role: data.role as "customer" | "seller",
      sellerStatus: data.sellerStatus as "pending" | "approved",
      sessionVersion: user.sessionVersion,
    });
    response.status(201).json({ user: data });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      response.status(400).json({ message: "Email and password are required." });
      return;
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    const data = publicUser(user);
    setSessionCookie(response, {
      id: data.id,
      role: data.role as "customer" | "seller" | "admin",
      sellerStatus: data.sellerStatus as "pending" | "approved" | "rejected",
      sessionVersion: user.sessionVersion,
    });
    response.json({ user: data });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (request, response, next) => {
  try {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      response.status(400).json({ message: "Enter a valid email address." });
      return;
    }
    if (!isSmtpConfigured()) {
      response.status(503).json({ message: "Password reset email delivery is not configured." });
      return;
    }
    const user = await User.findOne({ email });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      user.resetTokenHash = tokenHash;
      user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const resetUrl = new URL("/reset-password", process.env.FRONTEND_URL || "http://localhost:3000");
      resetUrl.searchParams.set("token", token);
      resetUrl.searchParams.set("email", user.email);
      try {
        await sendPasswordResetEmail(user.email, resetUrl.toString());
      } catch (error) {
        console.error("Password reset email delivery failed.", error);
      }
    }
    response.json({
      message: "If an account exists for that address, password reset instructions are on their way.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (request, response, next) => {
  try {
    const { email, token, password } = request.body ?? {};
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof password !== "string" ||
      password.length < 10 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      response.status(400).json({
        message: "Enter a valid reset link and a password with at least 10 characters, including a letter and a number.",
      });
      return;
    }
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOneAndUpdate(
      {
        email: email.trim().toLowerCase(),
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: { passwordHash: await bcrypt.hash(password, 12) },
        $inc: { sessionVersion: 1 },
        $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
      },
      { new: true, runValidators: true },
    ).select("_id");
    if (!user) {
      response.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
      return;
    }
    response.json({ message: "Your password has been reset. Sign in with your new password." });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (_request, response, next) => {
  try {
    const user = await User.findById(response.locals.user?.id);
    if (!user) {
      clearSessionCookie(response);
      response.status(401).json({ message: "Account not found." });
      return;
    }
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", requireAuth, async (request, response, next) => {
  try {
    const { name, phone } = request.body ?? {};
    if (
      (name !== undefined &&
        (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100)) ||
      (phone !== undefined && (typeof phone !== "string" || phone.trim().length > 32)) ||
      (name === undefined && phone === undefined)
    ) {
      response.status(400).json({ message: "Enter a valid name or phone number to update." });
      return;
    }
    const update: { name?: string; phone?: string } = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof phone === "string") update.phone = phone.trim();
    const user = await User.findByIdAndUpdate(
      response.locals.user?.id,
      update,
      { new: true, runValidators: true },
    );
    if (!user) {
      response.status(404).json({ message: "Account not found." });
      return;
    }
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

export default router;
