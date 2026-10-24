import { Router } from "express";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

const router = Router();

router.post("/", async (request, response, next) => {
  try {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      response.status(400).json({ message: "Enter a valid email address." });
      return;
    }
    if (await NewsletterSubscriber.exists({ email })) {
      response.status(409).json({ message: "This email is already subscribed." });
      return;
    }
    await NewsletterSubscriber.create({ email });
    response.status(201).json({ message: "Thanks for joining our newsletter." });
  } catch (error) {
    next(error);
  }
});

export default router;
