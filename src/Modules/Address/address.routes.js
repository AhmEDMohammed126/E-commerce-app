import { Router } from "express";

import * as controller from "./address.controller.js";
import * as middlewares from "../../Middlewares/index.js";
const { errorHandler,auth} = middlewares;

const addressRouter = Router();
addressRouter.post('/addAddress',
    errorHandler(auth()),
    errorHandler(controller.addAddress)
);

addressRouter.get('/getAddresses',
    errorHandler(auth()),
    errorHandler(controller.geytAllAddresses)
);

addressRouter.get('/getAddress/:id',
    errorHandler(auth()),
    errorHandler(controller.getAddressById)
);

addressRouter.delete('/deleteAddress/:id',
    errorHandler(auth()),
    errorHandler(controller.deleteAddress)
);

addressRouter.patch('/softDeleteAddress/:id',
    errorHandler(auth()),
    errorHandler(controller.softDeleteAddress)
);
addressRouter.put('/edit/:id',
    errorHandler(auth()),
    errorHandler(controller.editAddress)
);
export{addressRouter};