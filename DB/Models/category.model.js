import slugify from "slugify";
import mongoose from "../global-setup.js";
import { Brand, Product, SubCategory } from "./index.js";
const { Schema, model } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        return slugify(this.name,{lower:true});
    }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // TODO: Change to true after adding authentication
    },
    Images: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
        unique: true,
      },
    },
    customId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);
//hook
categorySchema.post("findOneAndDelete",async function(){
  const _id = this.getQuery()._id;
// delete relivant subcategories from db
const deletedSubCategories = await SubCategory.deleteMany({categoryId:_id});

// check if subcategories are deleted already
if (deletedSubCategories.deletedCount) {
  // delete the relivant brands from db
  const deleteBrand=await Brand.deleteMany({ categoryId: _id });
  // delete the related products from db
  if(deleteBrand.deletedCount) {
    await Product.deleteMany({ categoryId: _id });
  };
};

})
export const Category =
  mongoose.models.Category || model("Category", categorySchema);
