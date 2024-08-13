import { Router } from "express";
// controllers
import * as controller from "./sub-categories.controller.js";
// middlewares
import * as Middlewares from "../../Middlewares/index.js";
// models
import { SubCategory } from "../../../DB/Models/index.js";
// utils
import { extensions } from "../../Utils/index.js";

const subCategoryRouter = Router();
const { errorHandler, getDocumentByName, multerHost } = Middlewares;

subCategoryRouter.post(
  "/create",
  errorHandler(multerHost({ allowedExtensions: extensions.Images }).single("image")),
  errorHandler(getDocumentByName(SubCategory)),
  errorHandler(controller.createSubCategory)
);

subCategoryRouter.get("/getSubCategory", errorHandler(controller.getSubCategory));

subCategoryRouter.get("/", errorHandler(controller.allSubCategories));

subCategoryRouter.put(
  "/update/:_id",
  errorHandler(multerHost({ allowedExtensions: extensions.Images }).single("image")),
  errorHandler(getDocumentByName(SubCategory)),
  errorHandler(controller.updateSubCategory)
);

subCategoryRouter.delete(
  "/delete/:_id",
  errorHandler(controller.deleteSubCategory)
);

subCategoryRouter.get("/allSubCategoriesWithBrands", errorHandler(controller.allSubCategoriesWithBrands));

export { subCategoryRouter };
