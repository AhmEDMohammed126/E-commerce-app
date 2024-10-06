import joi from "joi";
import { DiscountType, generalRules, PaymentMethod } from "../../Utils/index.js";

export const orderSchema ={
    body:joi.object({
        address:joi.string().optional(),
        addressId:joi.string().optional(),
        contactNumber:joi.string().required(),
        shippingFee:joi.number().required(),
        VAT:joi.number().required(),
        paymentMethod:joi.string().valid(...Object.values(PaymentMethod)).required(),
        couponCode:joi.string().optional(),
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })   
}
export const getAllCouponsSchema={
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })   
}

export const cancelOrderSchema={
    params:joi.object({
        orderId:generalRules._id.required()
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })
}

export const deliverOrderSchema={
    params:joi.object({
        orderId:generalRules._id.required()
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })
}

export const getOrderSchema={
    params:joi.object({
        orderId:generalRules._id.required()
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })   
}
