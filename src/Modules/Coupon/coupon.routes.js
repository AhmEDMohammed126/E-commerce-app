import { Router } from "express";

import * as controller from "./coupon.controller.js";

import * as middlewares from "../../Middlewares/index.js"
import { couponSchema, deleteCouponSchema, disableEnableCouponSchema, getAllCouponsSchema, getCouponSchema, updateCouponSchema } from "./coupon.schema.js";
import { systemRoles } from "../../Utils/index.js";

const couponRouter = Router();

const {errorHandler,auth,validationMiddleware,authorizationMiddleware}=middlewares;

couponRouter.post("/create",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(couponSchema)),
    errorHandler(controller.createCoupon)
);

couponRouter.get("/",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(getAllCouponsSchema)),
    errorHandler(controller.getAllCoupons)
)

couponRouter.get("/couponById/:couponId",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(getCouponSchema)),
    errorHandler(controller.getCouponById)
)

couponRouter.put("/updateCoupon/:couponId",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(updateCouponSchema)),
    errorHandler(controller.updateCoupon)
)

couponRouter.patch("/disableEnableCoupon/:couponId",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(disableEnableCouponSchema)),
    errorHandler(controller.disableEnableCoupon)
)
couponRouter.delete("/deleteCoupon/:couponId",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(validationMiddleware(deleteCouponSchema)),
    errorHandler(controller.deleteCoupon)
)
export { couponRouter };