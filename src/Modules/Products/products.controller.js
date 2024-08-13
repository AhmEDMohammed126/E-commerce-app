import { Brand, Product } from "../../../DB/Models/index.js";
import { calculateProductPrice, cloudinaryConfig, ErrorClass, uploadFile } from "../../Utils/index.js";
import slugify from "slugify";
import { nanoid } from "nanoid";
import { ApiFeatures } from "../../Utils/index.js";

/**
 * @api {post} /products/create
 */
export const addProduct=async(req,res,next)=>{
    //destructing the request body
    const{title,overview,specs,price,discountAmount,discountType,stock}=req.body
    //req.files
    if(!req.files.length)
        return next(new ErrorClass('Please upload an image',400,'Please upload an image'))

    //ids check
    const brand=req.document

    //upload the image to cloudinary 
    const brandCustomId = brand.customId;
    const catgeoryCustomId = brand.categoryId.customId;
    const subCategoryCustomId = brand.subCategoryId.customId;
    const customId = nanoid(4);
    const folder = `${process.env.UPLOADS_FOLDER}/Categories/${catgeoryCustomId}/SubCategories/${subCategoryCustomId}/Brands/${brandCustomId}/Products/${customId}`;
    const URLs=[]
    for (const file of req.files) {
        const{secure_url,public_id}=await uploadFile({
            file: file.path,
            folder
        })
        URLs.push({secure_url,public_id})
    }
    const product=new Product({
        title,
        overview,
        specs:JSON.parse(specs),
        price,
        appliedDiscount:{
            amount:discountAmount,
            type:discountType
        },
        stock,
        Images: {
            URLs,
            customId,
        },
        categoryId:brand.categoryId._id,
        subCategoryId:brand.subCategoryId._id,  
        brandId:brand._id
    })
    await product.save()
    return res.status(201).json({message:"Product added successfully"})
}

/**
 * @api {put} /products/update/:productId Update a product
 * @apiParam {String} productId The ID of the product to update
 * @apiParam {String} [title] The title of the product
 * @apiParam {String} [overview] The overview of the product
 * @apiParam {Object} [specs] The specifications of the product
 * @apiParam {Number} [price] The price of the product
 * @apiParam {Number} [discountAmount] The amount of the discount
 * @apiParam {String} [discountType] The type of the discount
 * @apiParam {Number} [stock] The stock of the product
 * @apiParam {String} [badge] The badge of the product
 * 
 * @apiSuccess {String} message The success message
 * @apiError {Object} ErrorClass The error object
 */
export const updateProduct=async(req,res,next)=>{
    //productId from params
    const {productId}=req.params
    //find the product by id
    const product=await Product.findById(productId).
    populate([{path:'categoryId',select:'customId'},{path:'subCategoryId',select:'customId'},{path:'brandId',select:'customId'}]);
    if(!product) return next(new ErrorClass('Product not found',404,'Product not found'))
    //destructing the request body
    const{title,overview,specs,price,discountAmount,discountType,stock,badge}=req.body
    if(title){
        product.title=title;
        product.slug=slugify(title,{lower:true});
    }
    if(stock) product.stock=stock;
    if(overview) product.overview=overview;  
    if(badge)  product.badge=badge;   
    if(specs){
        product.specs=JSON.parse(specs)
    }
    if(price || discountAmount || discountType){
        const newPrice=price || product.price
        const discount={}
        discount.amount=discountAmount || product.appliedDiscount.amount
        discount.type=discountType || product.appliedDiscount.type
        product.appliedPrice=calculateProductPrice(newPrice,discount)
        product.appliedDiscount=discount
        product.price=newPrice
    }

    if(req.files.length){
        const folder =`${process.env.UPLOADS_FOLDER}/Categories/${product.categoryId.customId}/SubCategories/${product.subCategoryId.customId}/Brands/${product.brandId.customId}/Products/${product.Images.customId}`;
        const URLs=[]
        for (const file of req.files) {
            const{secure_url,public_id}=await uploadFile({
                file: file.path,
                folder
            })
            URLs.push({secure_url,public_id})
        }
        product.Images.URLs.push(...URLs)
        
    }
    await product.save()    
    return res.status(200).json({message:"Product updated successfully"});
}
/**
 * @api {get} /products/ 
 */
export const listProducts=async(req,res,next)=>{
    const {page=1,limit=2,...filters}=req.query;
    const{brandId}=req.params;
    if(brandId) req.query.brandId=brandId;
    const model = Product
    const ApiFeaturesInstance = new ApiFeatures(model,req.query).
    pagination()
    .filter()
    .sort();
    const products=await ApiFeaturesInstance.mongooseQuery;
    return res.status(200).json({products})
}

/**
 * @api {get} /products/:productId
*/
export const getProductById=async(req,res,next)=>{
    const {productId}=req.params
    const product=await Product.findById(productId)
    if(!product) return next(new ErrorClass('Product not found',404,'Product not found'))
    return res.status(200).json({product})
}

/**
 * @api {delete} /products/delete/:productId Delete a product
 * @apiName DeleteProduct
 * @apiGroup Products
 *
 * @apiParam {ObjectId} productId The ID of the product to delete.
 *
 * @apiSuccess {String} message A success message.
 * @apiSuccessExample {json} Success-Response:
 */
export const deleteProduct = async (req, res, next) => {
    // Get the product ID from the request parameters
    const { productId } = req.params

    // Find and delete the product by ID
    const product = await Product.findByIdAndDelete(productId).populate([{path:'categoryId',select:'customId'},{path:'subCategoryId',select:'customId'},{path:'brandId',select:'customId'}]);

    // If the product is not found, return an error
    if (!product) {
        return next(new ErrorClass('Product not found', 404, 'Product not found'))
    }

    // Get the folder name
    const folder =`${process.env.UPLOADS_FOLDER}/Categories/${product.categoryId.customId}/SubCategories/${product.subCategoryId.customId}/Brands/${product.brandId.customId}/Products/${product.Images.customId}`;

    // Delete the product's images from Cloudinary
    await cloudinaryConfig().api.delete_resources_by_prefix(folder);
    await cloudinaryConfig().api.delete_folder(folder);

    // Return a success message
    return res.status(200).json({ message: "Product deleted successfully" })
}