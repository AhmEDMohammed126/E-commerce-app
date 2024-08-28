import { Address } from "../../../DB/Models/index.js";
import { ErrorClass } from "../../Utils/index.js";

/**
 * @api {post} /addresses/addAddress Add address
 */
export const addAddress =async (req, res) =>{
    const {country,city,postalCode,buildingNumber,floorNumber,addressLable,isDefault}=req.body
    const userId=req.authUser._id;
    const newAddress=new Address({
        userId,
        country,
        city,
        postalCode,
        buildingNumber,
        floorNumber,
        addressLable,
        isDefault:[true,false].includes(isDefault)? isDefault : false
    })
    // if(newAddress.isDefault){
    //     await Address.updateOne({userId,isDefault:true},{isDefault:false})
    // }
    const address=await newAddress.save();
    return res.status(201).json({address});
}
/**
 * @api {get} /addresses/getAddresses Get all addresses
 */
export const geytAllAddresses =async (req, res,next) =>{
    const {authUser}=req;
    const addresses=await Address.find({userId:authUser._id,isMarkedAsDeleted:false});
    if(!addresses){
        return next(
            new ErrorClass("ther is no addresses with this email", 400, "addresses not found")
        )
    }
    res.status(200).json({addresses});
}

/**
 * @api {get} /addresses/getAddress/:id Get address by id
 */
export const getAddressById =async (req, res,next) =>{
    const {id}=req.params
    const address=await Address.findOne({_id:id,isMarkedAsDeleted:false});
    if(!address){
        return next(
            new ErrorClass("ther is no address", 400, "address not found")
        )
    }
    res.status(200).json({address});
}
/**
 * @api {patch} /addresses/softDeleteAddress/:id soft delete address by id
 */
export const softDeleteAddress =async(req,res,next)=>{
    const userId =req.authUser._id;
    const {id}=req.params;
    const address=await Address.findOneAndUpdate(
        {_id:id,userId,isMarkedAsDeleted:false},
        {isMarkedAsDeleted:true},
        {new:true}
    );
    if(!address){
        return next(
            new ErrorClass("ther is no address", 400, "address not found")
        )
    }
    res.status(200).json({message:"address soft deleted"});
}
/**
 * @api {delete} /addresses/deleteAddress/:id Delete address by id
 */
export const deleteAddress = async(req, res,next) => {
    const{id}=req.params;
    const {authUser}=req;
    const address=await Address.findOneAndDelete({userId:authUser._id,_id:id});
    if(!address){
        return next(
            new ErrorClass("ther is no address", 400, "address not found")
        )
    }
    res.status(200).json({message:"address deleted"});
}
/**
 * @api {put} /addresses/edit/:id edit address by id
 */
export const editAddress=async(req,res,next)=>{
    const{country,city,postalCode,buildingNumber,floorNumber,addressLable,isDefault}=req.body;
    const{id}=req.params;
    const userId=req.authUser._id;
    const address=await Address.findOne({_id:id,userId,isMarkedAsDeleted:false});
    if(!address){
        return next(
            new ErrorClass("ther is no address", 400, "address not found")
        )
    }
    if(country) address.country=country;
    if(city) address.city=city;
    if(postalCode) address.postalCode=postalCode;
    if(buildingNumber) address.buildingNumber=buildingNumber;
    if(floorNumber) address.floorNumber=floorNumber;
    if(addressLable) address.addressLable=addressLable;
    if(isDefault) address.isDefault=[true,false].includes(isDefault)? isDefault : false;
    await address.save();
    res.status(200).json({message:"address updated"});

}