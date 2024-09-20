import { Order, Product, Review } from "../../../DB/Models/index.js";
import { ErrorClass, OrdeStatus, ReviewStatus } from "../../Utils/index.js";

/**
 * @api {post} /reviews/addReview Add review
 */
export const addReview=async(req, res, next) => {
    const userId = req.authUser._id;
    const { productId,rating, review } = req.body;

    //check if user has already reviewed the product
    const reviewExist = await Review.findOne({ userId, productId });
    if (reviewExist) {
        return next(new ErrorClass ("You already reviewed this product", 400,"You already reviewed this product"));
    }
    //check if product exist
    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorClass ("Product not found", 404,"Product not found"));
    }
    //check if user bought the product
    const userBoughtProduct = await Order.findOne({ userId, "products.productId": productId,orderStatus:OrdeStatus.DELIVERED });
    if(!userBoughtProduct){
        return next(new ErrorClass ("You must buy the product to leave a review", 400,"You must buy the product to leave a review"));
    }

    const reviewInstance = new Review({
        userId,
        productId,
        rating,
        review
    })
    await reviewInstance.save();
    res.status(201).json({review:reviewInstance});
}

/**
 * @api {get} /reviews/listReviews listReviews
 */

export const listReviews=async(req, res, next) => {

    const reviews = await Review.find().populate(
        [
        {
            path:"userId",
            select:"userName email -_id"
        },
        {
            path:"productId",
            select:"title rating -_id"
        }
    ]
    );
    res.status(200).json({ reviews });
}

/**
 * @api {get} /reviews/getReviews/:productId get product reviews
 */

export const getReviews=async(req, res, next) => {

    const productId = req.params.productId;
    const reviews = await Review.find({ productId, reviewStatus:ReviewStatus.APPROVED }).populate(
        [
            {
                path:"userId",
                select:"userName email -_id"
            }
        ]
    );
    if(reviews.length==0){
        return next(new ErrorClass ("No reviews found", 404,"No reviews found"));
    }
    res.status(200).json({ reviews });
}

/**
 * @api {patch} /reviews/approveOrRejectReview/:reviewId  approve or reject review
 */
export const approveOrRejectReview =async (req, res, next) => {
    const { reviewId } = req.params;
    const actionDoneBy=req.authUser._id;
    const { accept ,reject } = req.body;
    if(accept && reject){
        return next(new ErrorClass ("You can't accept and reject at the same time", 400,"You can't accept and reject at the same time"));
    }
    const review = await Review.findOne({_id:reviewId});
    if (!review) {
        return next(new ErrorClass ("Review not found", 404,"Review not found"));
    }
    if (accept) {
        review.reviewStatus = ReviewStatus.APPROVED;
    }
    if (reject) {
        review.reviewStatus = ReviewStatus.REJECTED;
    }
    review.actionDoneBy=actionDoneBy;
    await review.save();
    res.status(200).json({ review });
}
