const express = require("express");
const { verifytoken } = require('../middlewares/auth');
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  getCouponsByUserId,
  deleteCoupon,
  useCoupon
} = require("../controllers/coupon.Controllers");

// Create a new coupon
router.post("/create", verifytoken,createCoupon);

// Use a coupon
router.post("/usecoupon", verifytoken,useCoupon);
// Get all coupons

router.get("/", verifytoken,getAllCoupons);

// Get a single coupon by ID
router.get("/:userId", verifytoken,getCouponsByUserId);

// Delete a coupon by ID
router.delete("/delete/:id", verifytoken,deleteCoupon);


module.exports = router;
