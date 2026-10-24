import { Router } from "express";
import mongoose from "mongoose";
import Address from "../models/Address.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const validAddress = (body: Record<string, unknown>) =>
  ["name", "phone", "line1", "city", "postalCode", "country"].every(
    (key) =>
      typeof body[key] === "string" &&
      body[key].trim().length > 0 &&
      body[key].trim().length <= 160,
  ) &&
  (body.line2 === undefined ||
    (typeof body.line2 === "string" && body.line2.trim().length <= 160)) &&
  (body.isDefault === undefined || typeof body.isDefault === "boolean");

router.get("/", async (_request, response, next) => {
  try {
    const addresses = await Address.find({ user: response.locals.user?.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    response.json({ addresses });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const body = request.body ?? {};
    if (!validAddress(body)) {
      response.status(400).json({ message: "Enter all required delivery address details." });
      return;
    }
    const address = await Address.create({
      name: body.name.trim(),
      phone: body.phone.trim(),
      line1: body.line1.trim(),
      line2: typeof body.line2 === "string" ? body.line2.trim() : "",
      city: body.city.trim(),
      postalCode: body.postalCode.trim(),
      country: body.country.trim(),
      isDefault: body.isDefault === true,
      user: response.locals.user?.id,
    });
    if (body.isDefault) {
      await Address.updateMany(
        { user: response.locals.user?.id, _id: { $ne: address._id } },
        { isDefault: false },
      );
    }
    response.status(201).json({ address });
  } catch (error) {
    next(error);
  }
});

router.patch("/:addressId", async (request, response, next) => {
  try {
    const { addressId } = request.params;
    const body = request.body ?? {};
    if (!mongoose.isValidObjectId(addressId) || !validAddress(body)) {
      response.status(400).json({ message: "Address details are invalid." });
      return;
    }
    const exists = await Address.exists({
      _id: addressId,
      user: response.locals.user?.id,
    });
    if (!exists) {
      response.status(404).json({ message: "Address not found." });
      return;
    }
    if (body.isDefault) {
      await Address.updateMany(
        { user: response.locals.user?.id, _id: { $ne: addressId } },
        { isDefault: false },
      );
    }
    const address = await Address.findOneAndUpdate(
      { _id: addressId, user: response.locals.user?.id },
      {
        name: body.name.trim(),
        phone: body.phone.trim(),
        line1: body.line1.trim(),
        line2: typeof body.line2 === "string" ? body.line2.trim() : "",
        city: body.city.trim(),
        postalCode: body.postalCode.trim(),
        country: body.country.trim(),
        isDefault: body.isDefault === true,
      },
      { new: true, runValidators: true },
    );
    if (!address) {
      response.status(404).json({ message: "Address not found." });
      return;
    }
    response.json({ address });
  } catch (error) {
    next(error);
  }
});

router.delete("/:addressId", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.addressId)) {
      response.status(400).json({ message: "Address id is invalid." });
      return;
    }
    const address = await Address.findOneAndDelete({
      _id: request.params.addressId,
      user: response.locals.user?.id,
    });
    if (!address) {
      response.status(404).json({ message: "Address not found." });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
