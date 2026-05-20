const express = require("express");
const router  = express.Router();

const authRouter     = require("./Routers/authRouter");
const productRouter  = require("./Routers/productRouter");
const cartRouter     = require("./Routers/cartRouter");
const orderRouter    = require("./Routers/orderRouter");
const paymentRouter  = require("./Routers/paymentRouter");
const userRouter     = require("./Routers/userRouter");
const wishlistRouter = require("./Routers/wishlistRouter");
const couponRouter   = require("./Routers/couponRouter");
const adminRouter    = require("./Routers/adminRouter");
const miscRouter     = require("./Routers/miscRouter");

router.use("/auth",     authRouter);
router.use("/products", productRouter);
router.use("/cart",     cartRouter);
router.use("/orders",   orderRouter);
router.use("/payments", paymentRouter);
router.use("/users",    userRouter);
router.use("/wishlist", wishlistRouter);
router.use("/coupons",  couponRouter);
router.use("/admin",    adminRouter);
router.use("/",         miscRouter);

module.exports = router;
