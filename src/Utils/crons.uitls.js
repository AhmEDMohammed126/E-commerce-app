import { scheduleJob } from "node-schedule";
import { Coupon } from "../../DB/Models/index.js";
import { DateTime } from "luxon";
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