import { DateTime } from "luxon";
import { Address, Cart, Order } from "../../../DB/Models/index.js";
import { OrdeStatus,PaymentMethod } from "../../Utils/enums.utils.js";
import { ErrorClass } from "../../Utils/index.js";
import { calculateSubTotal } from "../Cart/Utils/cart.utils.js";
import { applyCoupon, validateCoupon } from "./order.utils.js";
/**
 * @api {post} /orders/create Create order
 */
export const createOrder=async (req, res, next) => {
    // we take the order from user cart
    const userId=req.authUser._id;
    const {address,addressId,contactNumber,couponCode,shippingFee,VAT,paymentMethod}=req.body;    
    //find logged in user's cart with products
    const cart=await Cart.findOne({userId}).populate("products.productId");
    if(!cart || cart.products.length==0) return next(new ErrorClass("Cart not found",404,"Empty cart"));

    const isSoldOut=cart.products.find((p)=>p.productId.stock< p.quantity);
    if(isSoldOut) return next(new ErrorClass(`Product ${isSoldOut.productId.title} is sold out`,404,"Product is sold out"));
    const subTotal=calculateSubTotal(cart.products);
    let total=subTotal + shippingFee + VAT;
    let coupon=null;
    if(couponCode){
        const isCouponValid=await validateCoupon(couponCode,userId,total);
        if(isCouponValid.error){
            return next(new ErrorClass(isCouponValid.message,400,isCouponValid.message));
        }
        coupon=isCouponValid.coupon;
        total=await applyCoupon(total,coupon);
    }

    if(!address && !addressId){
        return next(new ErrorClass("Address not provided",400,"Address not provided"));
    }
    if(addressId){
        const userAddress=await Address.findById(addressId);
        if(!userAddress) return next(new ErrorClass("Address not found",404,"Address not found"));
    }

    let orderStatus=OrdeStatus.PENDING;
    if(paymentMethod === PaymentMethod.CASH) {
        orderStatus=OrdeStatus.PLACED;
    }
    const orderInstance=new Order({
        userId,
        products: cart.products,
        address,
        addressId,
        contactNumber,
        subTotal,
        shippingFee,
        VAT,
        total,
        couponId:coupon?._id,
        orderStatus,
        paymentMethod,
        estimatedDeliveryDate:DateTime.now().plus({days:7}).toFormat("yyyy-MM-dd"),
    });
    await orderInstance.save();
    
    //clear cart
    cart.products=[];
    await cart.save();

    res.status(201).json({message:"Order created",order:orderInstance});
};