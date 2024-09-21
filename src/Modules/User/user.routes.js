import {Router} from "express"

import * as controller from "./user.controller.js"

import * as middlewares from "../../Middlewares/index.js"
import { extensions } from "../../Utils/index.js";

const userRouter=Router();

const {errorHandler,auth,multerHost}=middlewares;

userRouter.post(
    "/register",
    errorHandler(multerHost({ allowedExtensions:extensions.Images }).single("image")),
    errorHandler(controller.registerUser)
);

userRouter.get(
    "/confirmation/:confirmationToken",
    errorHandler(controller.verifyEmail)
);

userRouter.post(
    "/login",
    errorHandler(controller.login)
);

userRouter.patch(
    "/logout",
    errorHandler(auth()),
    errorHandler(controller.logOut)
);

userRouter.put(
    "/updateAccount",
    errorHandler(multerHost({ allowedExtensions:extensions.Images }).single("image")),
    errorHandler(auth()),
    errorHandler(controller.updateAccount)
);

userRouter.get(
    "/get-info",
    errorHandler(auth()),
    errorHandler(controller.getInfo)
);

userRouter.get(
    "/get-by-id/:_id",
    errorHandler(auth()),
    errorHandler(controller.getById)
);

userRouter.patch(
    "/update-password",
    errorHandler(auth()),
    errorHandler(controller.updatePassword)
);

userRouter.post(
    "/forget-password",
    errorHandler(controller.forgetPassword)
);

userRouter.post(
    "/verify-forget-password",
    errorHandler(controller.verifyForgetPassword)
);

userRouter.patch(
    "/reset-password",
    errorHandler(controller.resetPassword)
);
userRouter.put(
    "/soft-delete-user",
    errorHandler(auth()),//question : about authentication error of invalid token
    errorHandler(controller.softDeleteUser)
)

//======================question : about authentication and about which can delete
userRouter.delete(
    "/delete-user",
    errorHandler(auth()),
    errorHandler(controller.deleteUser)
);

userRouter.post(
    "/loginWithGoogle",
    errorHandler(controller.loginWithGoogle)
);

userRouter.post(
    "/registerWithGoogle",
    errorHandler(controller.registerWithGoogle)
);

export {userRouter};