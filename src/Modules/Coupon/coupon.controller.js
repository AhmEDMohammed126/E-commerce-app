import { Coupon, CouponChangeLog, User } from "../../../DB/Models/index.js"
import { DiscountType, ErrorClass } from "../../Utils/index.js";
/**
* @api {post} /coupons/create create a coupon
*/
export const createCoupon=async(req,res,next)=>{
    const {couponCode,from,till,couponAmount,couponType,Users}=req.body

    //check if coupon code already exist
    const couponExist=await Coupon.findOne({couponCode})
    if(couponExist){
        return next(new ErrorClass("Coupon code already exist",400,"Coupon code already exist"))
    }
    //check if users exist
    const userIds=Users.map(user=>user.userId);
    const validUsers=await User.find({_id:{$in:userIds}});
    if(validUsers.length!==Users.length){
        return next(new ErrorClass("Users not found",400,"Users not found"))
}
    const couponInstance=new Coupon({
        couponCode,
        from,
        till,
        couponAmount,
        couponType,
        Users,
        createdBy:req.authUser._id
    })
    const newCouponChangeLog=new CouponChangeLog({
        couponId:couponInstance._id,
        updatedBy:req.authUser._id,
        action:"CREATE",
        changes:couponInstance
    })
    await couponInstance.save();
    await newCouponChangeLog.save();

    res.status(200).json({message:"coupon created"})
} 

/**
* @api {get} / get all coupons
*/
export const getAllCoupons =async (req, res, next) => {
    const {isEnabled}=req.query;
    const filter={}
    if(isEnabled){
        filter.isEnabled=isEnabled ==="true"?true:false;
    }

    const coupons=await Coupon.find(filter);
    res.status(200).json({coupons})
}
/**
* @api {get} /couponById/:couponId get coupon by id
*/
export const getCouponById =async (req, res, next) => {
    const {couponId}=req.params
    const coupon=await Coupon.findById(couponId);
    if(!coupon){
        return next(new ErrorClass("Coupon not found",404,"Coupon not found"))
    }
    res.status(200).json({coupon})
}
/**
* @api {put} /updateCoupon/:couponId update coupon
*/
export const updateCoupon =async (req, res,next) =>{
    const {couponId}=req.params;
    const userId = req.authUser._id;
    const {couponCode,from,till,couponAmount,couponType,Users}=req.body;

    //check if coupon code already exist
    const couponExist=await Coupon.findById(couponId);
    if(!couponExist){
        return next(new ErrorClass("Coupon not found",404,"Coupon not found"))
}
const logUpdateObject={couponId:couponId,updatedBy:userId,action:"UPDATE",changes:{}}

if(couponCode){
    const couponCodeExist=await Coupon.findOne({couponCode});
    if(couponCodeExist){
        return next(new ErrorClass("Coupon code already exist",400,"Coupon code already exist"))
    }
    logUpdateObject.changes.couponCode=couponCode;
    couponExist.couponCode=couponCode;
}
if(from){
    logUpdateObject.changes.from=from;
    couponExist.from=from;
}
if(till){
    logUpdateObject.changes.till=till;
    couponExist.till=till;
}
let type=couponExist.couponType;
if(couponType){
    logUpdateObject.changes.couponType=couponType;
    couponExist.couponType=couponType;
}
if(couponAmount){
    if(type===DiscountType.PERCENTAGE && couponAmount>100){
        return next(new ErrorClass("Invalid coupon amount",400,"coupon amount should be less than 100"))
    }
    logUpdateObject.changes.couponAmount=couponAmount;
    couponExist.couponAmount=couponAmount;
}

if(Users){
    logUpdateObject.changes.Users=Users;
    couponExist.Users=Users;
}
    await couponExist.save();
    const newCouponChangeLog=await new CouponChangeLog(logUpdateObject).save();
    res.status(200).json({message:"coupon updated",coupon:couponExist});
}

/**
* @api {patch} /disableEnableCoupon/:couponId Disable or Enable Coupon it work like delete too 
*/
export const disableEnableCoupon=async (req,res,next)=>{
    const {couponId}=req.params;
    const userId = req.authUser._id;
    const {enable}=req.body;
    const coupon=await Coupon.findById(couponId);
    if(!coupon){
        return next(new ErrorClass("Coupon not found",404,"Coupon not found"))
    }
    const logUpdateObject={couponId:couponId,updatedBy:userId,action:"UPDATE",changes:{}}
    if(enable === true){
        logUpdateObject.changes.isEnabled=true;
        coupon.isEnabled=true;
    }
    if(enable === false){
        logUpdateObject.action="DELETE";
        logUpdateObject.changes.isEnabled=false;
        coupon.isEnabled=false;
    }
    await coupon.save();
    const newCouponChangeLog=await new CouponChangeLog(logUpdateObject).save();
    res.status(200).json({message:"coupon updated",coupon:coupon});
}