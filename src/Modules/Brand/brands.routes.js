import {  Router } from "express";
// controllers
import * as controller from "./brands.controller.js";
// middlewares
import * as Middlewares from "../../Middlewares/index.js";
// utils
import { extensions } from "../../Utils/index.js";
import { productRouter } from "../Products/products.routes.js";

const brandRouter = Router();
const { errorHandler, multerHost } = Middlewares;

brandRouter.use("/:brandId/products",productRouter)

brandRouter.post(
  "/create",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  errorHandler(controller.createBrand)
);


brandRouter.get("/", errorHandler(controller.getAllBrands));

brandRouter.get("/getBrand", errorHandler(controller.getBrand));
brandRouter.get("/getBrandsWithProducts", errorHandler(controller.getBrandsWithProducts));

brandRouter.put(
  "/update/:_id",
  multerHost({ allowedExtensions: extensions.Images }).single("image"),
  errorHandler(controller.updatebrand)
);

brandRouter.delete("/delete/:_id", errorHandler(controller.deleteBrand));

brandRouter.get("/getspecificBrands", errorHandler(controller.getspecificBrands));
export { brandRouter };
