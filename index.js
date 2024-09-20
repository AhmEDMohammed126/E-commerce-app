import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { globaleResponse } from "./src/Middlewares/index.js";
import db_connection from "./DB/connection.js";
import * as router from "./src/Modules/index.js";
import { cronJobOne, productRatingCron } from "./src/Utils/crons.uitls.js";
import { gracefulShutdown } from "node-schedule";
import { socketConnection } from "./src/Utils/socket.io.utils.js";
config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());//to give access to frontend routes and routes that require authorization to access routes in back-end
app.use(express.json());

app.use("/categories", router.categoryRouter);
app.use("/sub-categories", router.subCategoryRouter);
app.use("/brands", router.brandRouter);
app.use("/products", router.productRouter);
app.use("/users", router.userRouter);
app.use("/addresses", router.addressRouter);
app.use("/carts", router.cartRouter);
app.use("/coupons", router.couponRouter);
app.use("/orders", router.orderRouter);
app.use("/reviews", router.reviewRouter);
app.use("*",
    (req,res,next)=>res.status(404).json({message:"Route Not Found"})
);

app.use(globaleResponse);

db_connection();

cronJobOne();
productRatingCron();
// gracefulShutdown();
app.get("/", (req, res) => res.send("Hello World!"));

const serverApp=app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const io=socketConnection(serverApp);
//must do this every time deal with socket.io
io.on('connection', (socket) => {
    console.log('a user connected');
    // console.log(socket.id);
})