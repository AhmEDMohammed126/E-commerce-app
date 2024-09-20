import { Router } from "express";

import * as controller from "./order.controller.js";

import * as middlewares from "../../Middlewares/index.js"

import { cancelOrderSchema, deliverOrderSchema, getOrderSchema, orderSchema } from "./order.schema.js";

const orderRouter = Router();

const {errorHandler,auth,validationMiddleware}=middlewares;

orderRouter.post("/create",
    errorHandler(auth()),
    errorHandler(validationMiddleware(orderSchema)),
    errorHandler(controller.createOrder)
);
orderRouter.post("/cancel/:orderId",
    errorHandler(auth()),
    errorHandler(validationMiddleware(cancelOrderSchema)),
    errorHandler(controller.cancelOrder)
);

orderRouter.patch("/deliverd/:orderId",
    errorHandler(auth()),
    errorHandler(validationMiddleware(deliverOrderSchema)),
    errorHandler(controller.deliverOrder)
);

orderRouter.get("/listOrders",
    errorHandler(auth()),
    errorHandler(controller.listOrders)
);

orderRouter.get("/getOrder/:orderId",
    errorHandler(auth()),
    errorHandler(validationMiddleware(getOrderSchema)),
    errorHandler(controller.getOrder)
);

orderRouter.post("/stripePay/:orderId",
    auth(),
    errorHandler(controller.paymentWithStripe)
)
orderRouter.post("/webhook",
    errorHandler(controller.stripeWebHookLocal)
);
orderRouter.post("/refund/:orderId",
    errorHandler(auth()),
    errorHandler(controller.refundPayment)
)
export { orderRouter };