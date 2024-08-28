import { calculateSubTotal } from "../../src/Modules/Cart/Utils/cart.utils.js";
import mongoose from "../global-setup.js";
import { Schema, model } from "mongoose";

const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    products:[{
        productId:{
            type:Schema.Types.ObjectId,
            required:true,
            ref:"Product"
        },
        quantity:{
            type:Number,
            required:true,
            min:1,
            default:1
        },
        price:{
            type:Number,
            required:true
            }
        }
    ],
    subTotal:Number,
});
cartSchema.pre("save",function(){
    this.subTotal = calculateSubTotal(this.products);
});
cartSchema.post("save",async function(){
    const userId=this.userId
    if(this.products.length==0){
        await Cart.deleteOne({userId})
    }
})
export const Cart =mongoose.models.Cart || model("Cart", cartSchema);