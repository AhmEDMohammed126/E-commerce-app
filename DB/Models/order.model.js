import {OrdeStatus, PaymentMethod } from "../../src/Utils/index.js";
import mongoose from "../global-setup.js";
import { Schema ,model } from "mongoose";
import { Product } from "./product.model.js";

export const orderSchema = new Schema({

    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    products:[
        {
            productId:{
                type:Schema.Types.ObjectId,
                ref:"Product",
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                min:1
            },
            price:{
                type:Number,
                required:true
            }
        }
],
    fromCart:{
        type:Boolean,
        default:true
    },
    address:String,
    addressId:{
        type:Schema.Types.ObjectId,
        ref:"Address",
    },
    contactNumber:{
        type:String,
        required:true
    },
    subTotal:{
        type:Number,
        required:true
    },
    shippingFee:{
        type:Number,
        required:true
    },
    VAT:{//added tax
        type:Number,
        required:true
    },
    couponId:{
        type:Schema.Types.ObjectId,
        ref:"Coupon"
    },
    total:{
        type:Number,
        required:true
    },
    estimatedDeliveryDate:{
        type:Date,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true,
        enum:Object.values(PaymentMethod)
    }, 
    orderStatus:{
        type:String,
        required:true,
        enum:Object.values(OrdeStatus)
    },
    deliverdBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    cancelleddBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    deliveredAt:Date,
    cancelledAt:Date,
    refundedAt:Date,
},{timestamps:true});

orderSchema.post("save",async function(){
    if(this.orderStatus===OrdeStatus.CANCELLED){
        //increment the stock of products
        for(const product of this.products){
            await Product.updateOne({_id: product._id},{$inc:{stock:product.quantity} });
        }
        //decrement the usageCount of coupon
        if(this.couponId){
            const coupon =await mongoose.models.Coupon.findById(this.couponId);
            coupon.Users.find(u=>u.userId.toString()===this.userId.toString()).usageCount--;
            await coupon.save();
        }       
    }else{
    //decrement the stock of products
    for(const product of this.products){
        await Product.updateOne({_id: product._id},{$inc:{stock:-product.quantity} });
    }
    //increment the usageCount of coupon
    if(this.couponId){
        const coupon =await mongoose.models.Coupon.findById(this.couponId);
        coupon.Users.find(u=>u.userId.toString()===this.userId.toString()).usageCount++;
        await coupon.save();
    }
    }
})

export const Order =mongoose.models.Order || model("Order",orderSchema);