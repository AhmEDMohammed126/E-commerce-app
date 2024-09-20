import { DateTime } from "luxon";
import { Address, Cart, Order } from "../../../DB/Models/index.js";
import { OrdeStatus,PaymentMethod } from "../../Utils/enums.utils.js";
import { ApiFeatures, ErrorClass, genrateQrCode } from "../../Utils/index.js";
import { calculateSubTotal } from "../Cart/Utils/cart.utils.js";
import { applyCoupon, validateCoupon } from "./order.utils.js";
import { confirmPaymentIntent, createCheckoutSession, createPaymentIntent, createRefund, createStripeCoupon } from "../../payment-handler/stripe.js";
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
    const order=await orderInstance.save();
    
    //clear cart
    cart.products=[];
    await cart.save();
    const QrCode=await genrateQrCode([order._id, order.products,order.total]);
    res.status(201).json({message:"Order created",order:orderInstance,QR:QrCode});
};

/**
 * @api {post} /orders/cancel/:orderId cancel order
 */
export const cancelOrder=async (req, res, next) => {
    const userId=req.authUser._id;
    const {orderId}=req.params; 
    //find order
    const order=await Order.findOne({_id:orderId,userId,orderStatus:{$in:[OrdeStatus.PENDING,OrdeStatus.PLACED,OrdeStatus.CONFIRMED]}});

    if(!order) return next(new ErrorClass("Order not found",404,"Order not found"));
    //check if order can be cancelled
    const orderDate=DateTime.fromJSDate(order.createdAt);
    const currentDate=DateTime.now();
    const diffInDays=currentDate.diff(orderDate,"days").toObject().days;
    
    if(diffInDays>4) return next(new ErrorClass("Order cannot be cancelled",400,"Order cannot be cancelled"));
    //cancel order
    order.orderStatus=OrdeStatus.CANCELLED;
    order.cancelledAt=currentDate.toFormat("yyyy-MM-dd");
    order.cancelleddBy=userId;

    await order.save();
    res.status(200).json({message:"Order cancelled"});
}

/**
 * @api {patch} /orders/deliverd/:orderId update order status to deliver
 */
export const deliverOrder=async(req,res,next)=>{
    const userId=req.authUser._id;
    const {orderId}=req.params;
    //check if order exists
    const order=await Order.findOne({_id:orderId,userId,orderStatus:{$in:[OrdeStatus.PENDING,OrdeStatus.PLACED,OrdeStatus.CONFIRMED]}});
    if(!order) return next(new ErrorClass("Order not found",404,"Order not found"));

    //update order status to delivered
    order.orderStatus=OrdeStatus.DELIVERED;
    order.deliveredAt=DateTime.now().toFormat("yyyy-MM-dd");

    await order.save();
    res.status(200).json({message:"Order delivered"});

}

/**
 * @api {get} /orders/listOrders list orders
 */
export const listOrders=async (req,res,next)=>{
    const userId=req.authUser._id;
    const {page=1,limit=10,sort,...filters}=req.query;
    const skip=(page-1)*limit;
    const orders=await Order.find({userId,...filters})
    .skip(skip)
    .limit(+limit)
    .sort(sort)
    .populate("products.productId");

    if(!orders) return next(new ErrorClass("Orders not found",404,"Orders not found"));

    res.status(200).json({message:"Orders fetched successfully",orders});
}

/**
 * @api {get} /orders/getOrder/:orderId get order by id
 */

export const getOrder=async(req,res,next)=>{
    const userId=req.authUser._id;
    const {orderId}=req.params;
    const order=await Order.findOne({_id:orderId,userId});
    if(!order) return next(new ErrorClass("Order not found",404,"Order not found"));
    res.status(200).json({message:"Order fetched successfully",order});
}

export const paymentWithStripe=async(req,res,next)=>{
    const {orderId} = req.params;
    const {_id} = req.authUser;
    
    const order = await Order.findOne({
        _id:orderId,
        userId:_id,
        orderStatus:OrdeStatus.PENDING}).populate("products.productId");
    if(!order) return next(new ErrorClass("Order not found",404,"Order not found"));
    //create checkout session
    const paymentObject={
        customer_email:req.authUser.email,
        metadata:{orderId:order._id.toString()},
        line_items:order.products.map((product)=>{
            return {
                price_data:{
                    currency:'EGP',
                    product_data:{
                        name:product.productId.title,
                    },
                    unit_amount:product.price*100,//in cents 
                },
                quantity:product.quantity
            }
        })
    }
    if(order.couponId){
        const stripeCoupon = await createStripeCoupon(order.couponId);
        if(stripeCoupon.status){
            return next(new ErrorClass(stripeCoupon.message,400,stripeCoupon.message));
        } 
        paymentObject.discounts=[{coupon:stripeCoupon.id}];
    }
    const checkoutSession=await createCheckoutSession(paymentObject);
    const paymentIntent = await createPaymentIntent({
        amount:order.total,
        currency:'EGP'
    });
    order.payment_intent=paymentIntent.id;
    await order.save();
    res.status(200).json({message:"Payment initiated successfully", checkoutSession,paymentIntent});
}

//we make it to update payment status after pay
export const stripeWebHookLocal=async(req,res,next)=>{
    const orderId=req.body.data.object.metadata.orderId;
    const confirmOrder= await Order.findByIdAndUpdate(orderId,{orderStatus:OrdeStatus.CONFIRMED});
    const confirmPayment_Intent=await confirmPaymentIntent({paymentIntentId:confirmOrder.payment_intent})
    res.sendStatus(200).json({message:"payment success"});
}

export const refundPayment=async(req,res,next)=>{
    const {orderId}=req.params;
    const order=await Order.findOne({_id:orderId,orderStatus:OrdeStatus.CONFIRMED});
    if(!order) return next(new ErrorClass("Order not found",404,"Order not found"));

    const refund=await createRefund({paymentIntentId:order.payment_intent});
    console.log(refund.status);
    if(!refund.status){
        return next(new ErrorClass(refund.message,400,refund.message));
    }
    order.orderStatus=OrdeStatus.REFUNDED;
    await order.save();
    res.status(200).json({message:"Order refunded"});
}

