import {Product,Cart, Category} from "../../../DB/Models/index.js";
import {ErrorClass} from "../../Utils/index.js";
import { checkProdectStock } from "./Utils/cart.utils.js";
/**
 * @api {POST} /carts/add Add to cart
 */
export const add =async (req, res,next) =>{
    const userId=req.authUser._id;
    const {productId}=req.params;
    const{quantity}=req.body;
    const product=await checkProdectStock(productId,quantity);
    if(!product) 
        return next(new ErrorClass('Product not available',404,'Product not available'));
    const cart=await Cart.findOne({userId});
    if(!cart){
        const cartInstance=new Cart({
            userId,
            products:[
                {
                    productId:product._id,
                    quantity,
                    price:product.appliedPrice
                }
            ],
            
        });
        await cartInstance.save();
        return res.status(201).json({cart:cartInstance});
    }
    const isProdectExist=cart.products.find(p=> p.productId == productId);
    if(isProdectExist){
        //let newquantity,oldquantity;
        // cart.products=cart.products.map(p=>{
        //     if(p.productId==productId){
        //         oldquantity=p.quantity;
        //         p.quantity+=quantity;
        //         newquantity=p.quantity;
        //     }
        //     return p;
        // })
        //check the stock
        //cart.subTotal-=oldquantity*product.appliedPrice;
        // cart.subTotal+=product.appliedPrice*newquantity;
        // await cart.save();
        // return res.status(201).json({"message":"product added to cart",cart});
        return next(new ErrorClass('Product already exist',400,'Product already exist'));
    }
    cart.products.push({productId:product._id,quantity,price:product.appliedPrice});
    await cart.save();
    return res.status(201).json({message:"product added to cart",cart});
}

/**
 * @api {put} /carts/removeFromCart remove from cart
 */
export const removeFromCart =async (req, res,next) =>{
    const userId=req.authUser._id;
    const {productId}=req.params;
    
    //check if product exist in prodects array in cart
    const cart=await Cart.findOne({userId,'products.productId':productId});
    
    if(!cart){
        return next(new ErrorClass('product not found in cart',404,'product not found in cart'));
    }

    cart.products=cart.products.filter(p=>p.productId!=productId);//use filterto remove the product
    await cart.save();
    return res.status(200).json({message:"product removed from cart"});
}
/**
 * @api {put} /carts/updateCart update cart
 */
export const updateCart=async(req,res,next)=>{
    const userId=req.authUser._id;
    const {productId}=req.params;
    const{quantity}=req.body;
    const product=await checkProdectStock(productId,quantity);
    if(!product){
        return next(new ErrorClass('Product not available',404,'Product not available'));
    }
    const cart=await Cart.findOne({userId,'products.productId':productId});
    if(!cart){
        return next(new ErrorClass('product not found in cart',404,'product not found in cart'));
    }
    const productIndex=cart.products.findIndex(p=>p.productId==productId);
    cart.products[productIndex].quantity=quantity;

    await cart.save();
    return res.status(200).json({message:"product updated in cart",cart});
}
/**
 * @api {get} /carts/getCart get cart
 */

export const getCart=async(req,res,next)=>{
    const userId = req.authUser._id;
    const cart=await Cart.findOne({userId});
    if(!cart) 
        return next(new ErrorClass('Cart not found',404,'Cart not found'));
    return res.status(200).json({cart});    
}