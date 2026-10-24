import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import User from "../models/User.js";

export type SessionUser = {
  id: string;
  role: "customer" | "seller" | "admin";
  sellerStatus: "pending" | "approved" | "rejected";
  sessionVersion: number;
};

const isRole = (value: unknown): value is SessionUser["role"] =>
  value === "customer" || value === "seller" || value === "admin";
const isSellerStatus = (value: unknown): value is SessionUser["sellerStatus"] =>
  value === "pending" || value === "approved" || value === "rejected";

declare global {
  namespace Express {
    interface Locals {
      user?: SessionUser;
    }
  }
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});

export function setSessionCookie(response: Response, user: SessionUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  const token = jwt.sign(user, secret, { expiresIn: "7d" });
  response.cookie("omnihub_session", token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie("omnihub_session", cookieOptions());
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = request.cookies?.omnihub_session as string | undefined;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    response.status(401).json({ message: "Please sign in to continue." });
    return;
  }

  let claims: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, secret);
    if (typeof verified === "string") throw new Error("Invalid session.");
    claims = verified;
  } catch {
    clearSessionCookie(response);
    response.status(401).json({ message: "Your session has expired. Sign in again." });
    return;
  }

  if (
    typeof claims.id !== "string" ||
    !isRole(claims.role) ||
    !isSellerStatus(claims.sellerStatus) ||
    typeof claims.sessionVersion !== "number" ||
    !Number.isInteger(claims.sessionVersion)
  ) {
    clearSessionCookie(response);
    response.status(401).json({ message: "Your session is invalid. Sign in again." });
    return;
  }
  const account = await User.findById(claims.id).select("sessionVersion");
  if (!account || account.sessionVersion !== claims.sessionVersion) {
    clearSessionCookie(response);
    response.status(401).json({ message: "Your session has expired. Sign in again." });
    return;
  }
  response.locals.user = {
    id: claims.id,
    role: claims.role,
    sellerStatus: claims.sellerStatus,
    sessionVersion: claims.sessionVersion,
  };
  next();
}

export function requireRole(...roles: SessionUser["role"][]) {
  return async (_request: Request, response: Response, next: NextFunction) => {
    const sessionUser = response.locals.user;
    if (!sessionUser) {
      response.status(403).json({ message: "You do not have permission to do that." });
      return;
    }
    const account = await User.findById(sessionUser.id).select("role sellerStatus");
    if (!account || !roles.includes(account.role)) {
      response.status(403).json({ message: "You do not have permission to do that." });
      return;
    }
    if (account.role === "seller" && account.sellerStatus !== "approved") {
      response.status(403).json({ message: "Your seller account is awaiting approval or is no longer approved." });
      return;
    }
    response.locals.user = {
      ...sessionUser,
      role: account.role,
      sellerStatus: account.sellerStatus,
    };
    next();
  };
}
