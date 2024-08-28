import {Router} from "express"
//controllers
import * as controller from "./cart.controller.js"
//middlewares
import * as middlewares from "../../Middlewares/index.js"

const cartRouter = Router();
const{errorHandler,auth}=middlewares;
cartRouter.post("/add/:productId",
    errorHandler(auth()),
    errorHandler(controller.add)
);

cartRouter.put("/removeFromCart/:productId",
    errorHandler(auth()),
    errorHandler(controller.removeFromCart)
);

cartRouter.put("/updateCart/:productId",
    errorHandler(auth()),
    errorHandler(controller.updateCart)
);

cartRouter.get("/getCart",
    errorHandler(auth()),
    errorHandler(controller.getCart)
);

export {cartRouter}