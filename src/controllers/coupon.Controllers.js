const CouponModel = require("../models/coupon");
const authModel = require("../models/auth");

const createCoupon = async (req, res) => {
  try {
    console.log("Received request to create coupon:", req.body);

    const { userId, code, oneTimeUse } = req.body;

    if (!userId || !code) {
      // console.log("Missing userId or code in request body");
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

    const newCoupon = new CouponModel({
      userId,
      code,
      used: false,
      oneTimeUse: oneTimeUse || false,
    });

    await newCoupon.save();
    console.log("Coupon created successfully:", newCoupon);

    res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
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
    console.log("Received request to fetch coupons for user:", req.params);
    const { userId } = req.params; // Extract userId from URL params

    // ✅ 2️⃣ Check if the user exists
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ 3️⃣ Fetch all coupons for the given userId
    const coupons = await CouponModel.find({ userId });

    // ✅ 4️⃣ Return response
    if (coupons.length === 0) {
      return res
        .status(200)
        .json({ message: "No coupons found for this user" });
    }

    res
      .status(200)
      .json({ message: "Coupons retrieved successfully", coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
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
    const coupon = await CouponModel.findOne({ code: couponCode }).populate(
      "userId"
    );
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    // Find the user applying the coupon
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Find the coupon provider
    const provider = await authModel.findById(coupon.userId);
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




    // Check if coupon has been used
    if (coupon.used && coupon.oneTimeUse) {
      return res
        .status(400)
        .json({ message: "This coupon has already been used." });
    }

    // Update user schema
    user.isSubscribed = true;
    user.couponUsed = true;
    user.couponProvider = provider._id;
    user.couponClosed = true;
    await user.save();

    // Update coupon usage

    
    coupon.used = true;
    // if (!coupon.oneTimeUse) {
    //     coupon.oneTimeUse = false; // Ensuring it cannot be used again
    // }
    await coupon.save();

    // Update provider's couponClosed field
    if(user.plan === "allowToRegisterMultiStudents"){
      provider.couponClosed = false;
    }
    
    provider.couponUsed = true;
    provider.couponClosed = true;
    await provider.save();

    return res.status(200).json({ message: "Coupon applied successfully." });
  } catch (error) {
    console.error("Error applying coupon:", error);
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
