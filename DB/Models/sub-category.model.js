import slugify from "slugify";
import mongoose from "../global-setup.js";
const { Schema, model } = mongoose;

const subcategorySchema = new Schema(
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
      default:function(){
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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

subcategorySchema.post("findOneAndDelete", async function () {
  const _id = this.getQuery()._id;
   // delete the related brands from db
  await mongoose.models.Brand.deleteMany({ subCategoryId:_id });
   // delete the related product from db
  await mongoose.models.Product.deleteMany({ subCategoryId:_id });
})
export const SubCategory =
  mongoose.models.SubCategory || model("SubCategory", subcategorySchema);
