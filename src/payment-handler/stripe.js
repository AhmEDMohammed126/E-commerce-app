import Stripe from 'stripe';
import { Coupon } from '../../DB/Models/index.js';
import { DiscountType, ErrorClass } from '../Utils/index.js';


//create checkout session
export const createCheckoutSession = async ({
    customer_email,
    metadata,
    discounts=[],
    line_items
}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const paymentData = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        customer_email,
        metadata,
        success_url:process.env.SUCCESS_URL,
        cancel_url: process.env.CANCEL_URL,
        discounts,
        line_items,
        mode: 'payment',
    });
    return paymentData;
} 

//create stripe coupon

export const createStripeCoupon = async (couponId) =>{
    const coupon = await Coupon.findById(couponId);
    if(!coupon) return next(new ErrorClass("Coupon not found",404,"Coupon not found"));   
    let couponObject={};
    if(coupon.couponType === DiscountType.FIXED){
        couponObject = {
            name:coupon.couponCode,
            amount_off:coupon.couponAmount *100,
            currency:'EGP'
        };
    }

    if(coupon.couponType === DiscountType.PERCENTAGE){
        couponObject = {
            name:coupon.couponCode,
            percent_off:coupon.couponAmount
        };
    }

    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const stripeCoupon = await stripe.coupons.create(couponObject);
    return stripeCoupon;
}
// this help in refund

//create payment Method
export const createPaymentMethod =async ({token}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
            token,
        },
    });

    return paymentMethod;
}
//create payment intent 

export const createPaymentIntent = async ({amount,currency}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    
    const paymentMethod=await createPaymentMethod({token:'tok_visa'});

    const paymentIntent = await stripe.paymentIntents.create({
        amount:amount*100,
        currency,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",    
        },
        payment_method:paymentMethod.id
    });
    return paymentIntent;
}

//retrive payment intent
export const retrievePaymentIntent = async ({paymentIntentId}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
}

//confirm payment intent

export const confirmPaymentIntent = async ({paymentIntentId}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const paymentDetails = await retrievePaymentIntent({paymentIntentId});
    const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        {
            payment_method: paymentDetails.payment_method
        });
    return paymentIntent;
}

//create refund

export const createRefund = async ({paymentIntentId}) =>{
    const stripe = new Stripe(process.env.SECRIT_STRIPE_KEY);
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
    });
    return refund;
}