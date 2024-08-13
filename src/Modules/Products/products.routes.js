import { Router } from "express";
//controllers
import * as controller from "./products.controller.js";
//middlewares
import * as Middlewares from "../../Middlewares/index.js";
//utils
import { extensions } from "../../Utils/index.js";
import { Brand } from "../../../DB/Models/index.js";

const productRouter = Router({mergeParams: true});

const { errorHandler, multerHost,checkIfIdsExist } = Middlewares;

productRouter.post(
    "/add",
    multerHost({ allowedExtensions: extensions.Images }).array("image",5),
    checkIfIdsExist(Brand),
    errorHandler(controller.addProduct)
);
productRouter.put("/update/:productId",
    multerHost({ allowedExtensions: extensions.Images }).array("image",5),
    errorHandler(controller.updateProduct));
productRouter.delete("/delete/:productId", errorHandler(controller.deleteProduct));
productRouter.get("/getProductById/:productId", errorHandler(controller.getProductById));
productRouter.get("/", errorHandler(controller.listProducts));

export { productRouter };
