import { Router } from "express";

import * as controller from "./review.controller.js";

import * as middlewares from "../../Middlewares/index.js";
import { systemRoles } from "../../Utils/index.js";

const{errorHandler,auth,authorizationMiddleware}=middlewares;

const reviewRouter = Router();
reviewRouter.post("/addReview",
    errorHandler(auth()),
    errorHandler(authorizationMiddleware(systemRoles.BUYER)),
    errorHandler(controller.addReview)
);
reviewRouter.get("/listReviews",
    auth(),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(controller.listReviews)
);
reviewRouter.get("/getReviews/:productId",
    errorHandler(auth()),
    errorHandler(controller.getReviews)
);
reviewRouter.patch("/approveOrRejectReview/:reviewId",
    auth(),
    errorHandler(authorizationMiddleware(systemRoles.ADMIN)),
    errorHandler(controller.approveOrRejectReview)
);
export { reviewRouter };