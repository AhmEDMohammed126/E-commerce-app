import { DateTime } from "luxon";
import { Coupon } from "../../../DB/Models/index.js";
import { DiscountType } from "../../Utils/enums.utils.js";

/**
 * @param {String} couponCode 
 * @param {String} userId
 * @param {Number} orderAmount
 * @returns {message: string, error:Boolean,coupon:Object} message 
 */
export const validateCoupon=async(couponCode,userId,orderAmount)=>{
    //get coupone by code
    const coupon=await Coupon.findOne({couponCode});
    if(!coupon){
        return {message:"Coupon not found",error:true,coupon:null}
    }
    //check if coupon is enabled
    if(!coupon.isEnabled || DateTime.now() > DateTime.fromJSDate(coupon.till)){
        return {message:"Coupon is not enabled",error:true,coupon:null}
    }
    //check if coupon not started yet
    if(DateTime.now() < DateTime.fromJSDate(coupon.from)){
        return {message:`Coupon is not started yet, will be available on ${coupon.from}`,error:true,coupon:null}
    }
    //check if user not eligible to use coupon
    const isUserNotEligible =coupon.Users.find(u=>u.userId.toString()!==userId.toString()||(u.userId.toString()===userId.toString()&&u.maxCount <= u.usageCount));
    
    if(!isUserNotEligible){
        return {message:"User not eligible to use this coupon or coupon limit reached",error:true,coupon:null}
    }
    if(coupon.couponType === DiscountType.FIXED && coupon.couponAmount > orderAmount){
        return {message:"Coupon amount is greater than order amount",error:true,coupon:null}
    }
    return {message:"Coupon is valid",error:false,coupon};
}

export const applyCoupon=async(orderAmount,coupon)=>{
    let total= orderAmount;
    const {couponAmount: discountAmount, couponType: discountType} = coupon;
    if(discountAmount || discountType){
        if (discountType === DiscountType.PERCENTAGE) {
            total = orderAmount - (orderAmount * discountAmount/ 100);
        } else if (discountType === DiscountType.FIXED && discountAmount <= orderAmount) {
            total = orderAmount - discountAmount;
        }
    }
    return total;
}