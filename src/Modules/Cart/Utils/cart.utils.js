import { Product } from "../../../../DB/Models/index.js";

export const checkProdectStock=async(productId,quantity)=>{
    return await Product.findOne({_id:productId,stock:{$gte:quantity}});
}

export const calculateSubTotal=(products)=>{
    let subTotal=0;
    products.forEach(p=>{
        subTotal+=p.price*p.quantity;
    })
    return subTotal;
}