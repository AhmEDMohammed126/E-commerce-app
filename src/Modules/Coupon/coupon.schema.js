import joi from "joi";
import { DiscountType, generalRules } from "../../Utils/index.js";

export const couponSchema ={
    body:joi.object({
        couponCode:joi.string().required(),
        from:joi.date().greater(Date.now()).required(),
        till:joi.date().greater(joi.ref('from')).required(),
        Users:joi.array().items({
            userId:generalRules._id,
            maxCount:joi.number().integer().min(1)
        }).required(),
        couponType:joi.string().valid(...Object.values(DiscountType)).required(),
        couponAmount:joi.number().when("couponType",{
            is:joi.string().valid(DiscountType.PERCENTAGE),
            then:joi.number().max(100).required()
        }).min(1).required().messages({
            "any.required":"Coupon amount is required",
            "number.max":"Coupon amount should be less than 100",
            "number.min":"Coupon amount should be greater than 0"
        })
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

export const getCouponSchema={
    params:joi.object({
        couponId:generalRules._id.required()
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })
}

export const updateCouponSchema={
    params:joi.object({
        couponId:generalRules._id.required()
    }),
    body:joi.object({
        couponCode:joi.string().optional(),
        from:joi.date().greater(Date.now()).optional(),
        till:joi.date().greater(joi.ref('from')).optional(),
        Users:joi.array().items({
            userId:generalRules._id,
            maxCount:joi.number().integer().min(1)
        }).optional(),
        couponType:joi.string().valid(...Object.values(DiscountType)).optional(),
        couponAmount:joi.number()
        // .when("couponType",{//this validation not work when you not send the couponType
        //     is:joi.string().valid(DiscountType.PERCENTAGE),
        //     then:joi.number().max(100).optional()
        // })
        .min(1).optional().messages({
            // "number.max":"Coupon amount should be less than 100",
            "number.min":"Coupon amount should be greater than 0"
        })
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })
}

export const disableEnableCouponSchema={
    params:joi.object({
        couponId:generalRules._id.required()
    }),
    body:joi.object({
        enable:joi.boolean().required(),
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })   
}

export const deleteCouponSchema={
    params:joi.object({
        couponId:generalRules._id.required()
    }),
    headers:joi.object({
        token:joi.string().required(),
        ...generalRules.headers,
    })  
}
