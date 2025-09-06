const CouponModel = require("../models/coupon");
const authModel = require("../models/auth");

const createCoupon = async (req, res) => {
  try {
    const { userId, code, oneTimeUse } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "User ID and code are required" });
    }

    // ✅ 3️⃣ Check if the user exists
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ 4️⃣ Check if the user is blocked
    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "User is blocked and cannot create coupons" });
    }

    // Check if coupon code already exists
    const existingCoupon = await CouponModel.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const newCoupon = new CouponModel({
      code: code.toUpperCase(),
      description: `Coupon created by ${user.userName}`,
      type: "FREE_ACCESS",
      discountPercentage: 100,
      isActive: true,
      maxUses: oneTimeUse ? 1 : 10,
      usedCount: 0,
      createdBy: userId,
      usedBy: [],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    });

    await newCoupon.save();

    res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    console.error('Coupon creation error:', error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await CouponModel.find().populate(
      "userId",
      "userName email"
    );
    res.status(200).json(coupons);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get a single coupon by ID
// const getCouponById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const coupon = await CouponModel.findById(id).populate(
//       "userId",
//       "userName email"
//     );

//     if (!coupon) {
//       return res.status(404).json({ message: "Coupon not found" });
//     }

//     res.status(200).json(coupon);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

const getCouponsByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL params

    // ✅ 2️⃣ Check if the user exists
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ 3️⃣ Fetch all coupons created by the given userId
    const coupons = await CouponModel.find({ createdBy: userId }).populate(
      "createdBy",
      "userName email"
    );

    // ✅ 4️⃣ Return response
    if (coupons.length === 0) {
      return res
        .status(200)
        .json({ message: "No coupons found for this user", coupons: [] });
    }

    res
      .status(200)
      .json({ message: "Coupons retrieved successfully", coupons });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete a coupon by ID
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await CouponModel.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// const express = require("express");
// const mongoose = require("mongoose");
// const CouponModel = require("../models/coupon");
// const authModel = require("../models/auth");

const useCoupon = async (req, res) => {
  try {
    const { userId, couponCode } = req.body;

    // Find the coupon
    const coupon = await CouponModel.findOne({ code: couponCode.toUpperCase() }).populate(
      "createdBy"
    );
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({ message: "Coupon is not valid or has expired." });
    }

    // Find the user applying the coupon
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the coupon provider
    const provider = await authModel.findById(coupon.createdBy);
    if (!provider) {
      return res.status(404).json({ message: "Coupon provider not found." });
    }

    // Check if provider's subscription is active
    if (!provider.isSubscribed) {
      return res
        .status(400)
        .json({
          message:
            "You can't use this coupon. The provider's subscription is deactivated.",
        });
    }

    // Check if user has already used this coupon
    const alreadyUsed = coupon.usedBy.some(usage => usage.user.toString() === userId);
    if (alreadyUsed) {
      return res.status(400).json({ message: "You have already used this coupon." });
    }

    // Role-based validation
    if (provider.userType === "Parent" && user.userType !== "Student") {
      return res
        .status(400)
        .json({
          message: "Invalid coupon code",
        });
    }

    if (provider.userType === "Student" && user.userType !== "Parent") {
      return res
        .status(400)
        .json({
          message: "Invalid coupon code",
        });
    }
    if (provider.userType === "Teacher" && user.userType !== "Student") {
      return res
        .status(400)
        .json({
          message: "Invalid coupon code",
        });
    }

    // Update user schema
    user.isSubscribed = true;
    user.couponUsed = true;
    user.couponProvider = provider._id;
    user.couponClosed = true;
    await user.save();

    // Use the coupon
    await coupon.useCoupon(userId);

    // Update provider's couponClosed field
    if (user.plan === "allowToRegisterMultiStudents") {
      provider.couponClosed = false;
    }

    provider.couponUsed = true;
    provider.couponClosed = true;
    await provider.save();

    return res.status(200).json({ message: "Coupon applied successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// module.exports = { useCoupon };

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponsByUserId,
  deleteCoupon,
  useCoupon,
};
