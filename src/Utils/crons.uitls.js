import { scheduleJob } from "node-schedule";
import { Coupon, Product, Review } from "../../DB/Models/index.js";
import { DateTime } from "luxon";
import { ReviewStatus } from "./enums.utils.js";
//this function must be called in index.js 
export const cronJobOne=()=>{
    scheduleJob('0 59 23 * * *',async()=>{
        const enabledCoupons=await Coupon.find({isEnabled:true});
        if(enabledCoupons.length>0){
                for(const coupon of enabledCoupons){
                    //we used fromJSDate from luxon library to convert date of till to luxon format and fromJSDate is the only method that suitable to convert our date format to in luxon
                    if(DateTime.now() > DateTime.fromJSDate(coupon.till)){
                        coupon.isEnabled=false;
                        await coupon.save();
                    }
                }
        }
    })
}

export const productRatingCron=()=>{
    scheduleJob('* * * * * *',async()=>{
        const approvedReviews=await Review.find({reviewStatus:ReviewStatus.APPROVED});

        for(const approvedReview of approvedReviews){
            const product=await Product.findById(approvedReview.productId);
            const productReview=approvedReviews.filter(review=>review.productId.toString()===product._id.toString());
            if(productReview.length===0){
                continue;
            }else{
                let totalRating=0;
                for(const review of productReview){
                    totalRating+=review.rating;
                }
                const avgRting=Number(totalRating/productReview.length).toFixed(2);
                product.rating=avgRting;
                await product.save();
            }
        }
    });
}