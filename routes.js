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

// Console.log checks for router mounting
console.log("Mounting /auth with authRouter");
router.use("/auth",     authRouter);

console.log("Mounting /products with productRouter");
router.use("/products", productRouter);

console.log("Mounting /cart with cartRouter");
router.use("/cart",     cartRouter);

console.log("Mounting /orders with orderRouter");
router.use("/orders",   orderRouter);

console.log("Mounting /payments with paymentRouter");
router.use("/payments", paymentRouter);

console.log("Mounting /users with userRouter");
router.use("/users",    userRouter);

console.log("Mounting /wishlist with wishlistRouter");
router.use("/wishlist", wishlistRouter);

console.log("Mounting /coupons with couponRouter");
router.use("/coupons",  couponRouter);

console.log("Mounting /admin with adminRouter");
router.use("/admin",    adminRouter);

console.log("Mounting / (miscRouter)");
router.use("/",         miscRouter);

module.exports = router;
