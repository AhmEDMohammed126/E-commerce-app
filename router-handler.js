import { json } from "express";
import cors from "cors";
import * as router from "./src/Modules/index.js";
import { globaleResponse } from "./src/Middlewares/index.js";


export const routerHandler = (app) => {
    //Route handling
    app.use(cors());//to give access to frontend routes and routes that require authorization to access routes in back-end
    app.use(json());

    //REST-API
    app.use("/categories", router.categoryRouter);
    app.use("/sub-categories", router.subCategoryRouter);
    app.use("/brands", router.brandRouter);
    app.use("/products", router.productRouter);
    app.use("/users", router.userRouter);
    app.use("/addresses", router.addressRouter);
    app.use("/carts", router.cartRouter);
    app.use("/coupons", router.couponRouter);
    app.use("/orders", router.orderRouter);
    app.use("/reviews", router.reviewRouter);
    app.use("*",(req,res,next)=>
        res.status(404).json({message:"Route Not Found"})
    );

    app.use(globaleResponse);

}