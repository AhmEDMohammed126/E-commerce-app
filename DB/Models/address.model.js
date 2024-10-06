import mongoose from "../global-setup.js";
import { Schema,model } from "mongoose";

const addressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    country:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    postalCode:{
        type:String,
        required:true
    },
    buildingNumber:{
        type:Number,
        required:true
    },
    floorNumber:{
        type:Number,
        required:true
    },
    addressLable:String,
    isDefault:{
        type:Boolean,
        default:false
    },
    isMarkedAsDeleted:{
        type:Boolean,
        default:false
    },   
},{timestamps:true});

addressSchema.pre("save",async function(){
    const {userId}=this
    if(this.isDefault){
        await Address.updateOne({userId,isDefault:true},{isDefault:false})
    }
})
export const Address=mongoose.models.Address || model("Address",addressSchema)