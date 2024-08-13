import slugify from "slugify";
import { nanoid } from "nanoid";
// models
import { SubCategory, Brand, Product } from "../../../DB/Models/index.js";
// uitls
import { cloudinaryConfig, ErrorClass, uploadFile } from "../../Utils/index.js";

/**
 * @api {post} /brands/create  Create a brand
 */
export const createBrand = async (req, res, next) => {
  // check if the category and subcategory are exist
  const { category, subCategory } = req.query;

  const isSubcategoryExist = await SubCategory.findOne({
    _id: subCategory,
    categoryId: category,
  }).populate("categoryId");

  if (!isSubcategoryExist) {
    return next(
      new ErrorClass("Subcategory not found", 404, "Subcategory not found")
    );
  }

  // Generating brand slug
  const { name } = req.body;
  // Image
  if (!req.file) {
    return next(
      new ErrorClass("Please upload an image", 400, "Please upload an image")
    );
  }
  // upload the image to cloudinary
  const customId = nanoid(4);
  const { secure_url, public_id } = await uploadFile({
    file: req.file.path,
    folder: `${process.env.UPLOADS_FOLDER}/Categories/${isSubcategoryExist.categoryId.customId}/SubCategories/${isSubcategoryExist.customId}/Brands/${customId}`,
  });

  // prepare brand object
  const brand = {
    name,
    logo: {
      secure_url,
      public_id,
    },
    customId,
    categoryId: isSubcategoryExist.categoryId._id,
    subCategoryId: isSubcategoryExist._id,
  };
  // create the brand in db
  const newBrand = await Brand.create(brand);
  // send the response
  res.status(201).json({
    status: "success",
    message: "Brand created successfully",
    data: newBrand,
  });
};

/**
 * @api {GET} /brands/getrBrand Get brand by name or id or slug
 */
export const getBrand = async (req, res, next) => {
  const { id, name, slug } = req.query;
  const queryFilter = {};

  // check if the query params are present
  if (id) queryFilter._id = id;
  if (name) queryFilter.name = name;
  if (slug) queryFilter.slug = slug;

  // find the brand
  const brand = await Brand.findOne(queryFilter)

  if (!brand) {
    return next(new ErrorClass("brand not found", 404, "brand not found"));
  }

  res.status(200).json({
    status: "success",
    message: "brand found",
    data: brand,
  });
};

/**
 * @api {PUT} /brands/update/:_id  Update a category
 */
export const updatebrand = async (req, res, next) => {
  // get the brand id
  const { _id } = req.params;

  // destructuring the request body
  const { name } = req.body;

  // find the brand by id
  const brand = await Brand.findById(_id)
    .populate("categoryId")
    .populate("subCategoryId");
  if (!brand) {
    return next(
      new ErrorClass("subCategory not found", 404, "subCategory not found")
    );
  }

  // Update name and slug
  if (name) {
    const slug = slugify(name, {
      lower: true,
    });
    brand.name = name;
    brand.slug = slug;
  }

  //Update Image
  if (req.file) {
    const splitedPublicId = brand.logo.public_id.split(`${brand.customId}/`)[1];
    const { secure_url } = await uploadFile({
      file: req.file.path,
      folder: `${process.env.UPLOADS_FOLDER}/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`,
      publicId: splitedPublicId,
    });
    brand.logo.secure_url = secure_url;
  }

  // save the brand with the new changes
  await brand.save();

  res.status(200).json({
    status: "success",
    message: "SubCategory updated successfully",
    data: brand,
  });
};
/**
 * @api {DELETE} /brands/deleteBrand/:_id  Delete a category
 */
export const deleteBrand = async (req, res, next) => {
  // get the brand id
  const { _id } = req.params;

  // find the brand by id
  const brand = await Brand.findByIdAndDelete(_id)
    .populate("categoryId")
    .populate("subCategoryId");
  if (!brand) {
    return next(new ErrorClass("brand not found", 404, "brand not found"));
  }
  // delete the related image from cloudinary
  const brandPath = `${process.env.UPLOADS_FOLDER}/Categories/${brand.categoryId.customId}/SubCategories/${brand.subCategoryId.customId}/Brands/${brand.customId}`;
  await cloudinaryConfig().api.delete_resources_by_prefix(brandPath);
  await cloudinaryConfig().api.delete_folder(brandPath);

  // delete the related product from db
  await Product.deleteMany({brandId:brand._id})
  res.status(200).json({
    status: "success",
    message: "brand deleted successfully",
  });
};

/**
 * @api {GET} /brands/getAllBrands Get brands
 */
export const getAllBrands = async (req, res, next) => {
  const {page=1,limit=3}=req.query
  const skip=(page-1)*limit
  const data=await Brand.find().limit(+limit).skip(skip)
  return res.status(200).json({data})
}
/**
 * @api {GET} /brands/getspecificBrands  get a brands for a specific category or sub-category
 */
export const getspecificBrands = async (req, res, next) => {
  const { subCategoryId , name, categoryId,page=1,limit=3 } = req.query;
  const skip=(page-1)*limit
  const queryFilter = {};

  // check if the query params are present
  if (subCategoryId) queryFilter.subCategoryId = subCategoryId;
  if (name) queryFilter.name = name;
  if (categoryId) queryFilter.categoryId = categoryId;

  // find the brands
  const brands = await Brand.find(queryFilter).limit(+limit).skip(skip);

  if (!brands) {
    return next(new ErrorClass("brand not found", 404, "brand not found"));
}

  res.status(200).json({data:brands});
};

/**
 * Get brands with their associated products
 * @api {Get} /brands/getBrandsWithProducts  get a brands and their associated products
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function
 * 
 * @returns {Object} - The response object with the brands data
 * 
 */

export const  getBrandsWithProducts=async(req,res,next)=>{
  const {page=1,limit=3}=req.query
  const skip=(page-1)*limit
  const data = await Brand.aggregate([
    {
      $lookup: {
        from: "products",            
        localField: "_id",           
        foreignField: "brandId",     
        as: "products"               
      }
    },
    {
      $skip: skip                   
    },
    {
      $limit: parseInt(limit)
    }
  ])
  if(!data.length) {
    return next(
      new ErrorClass("brands not found", 404, "brands not found")
    ) 
  }

  // Perform aggregation to get brands with their associated products
  res.status(200).json(data)
}
