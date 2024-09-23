import express from "express";
import { config } from "dotenv";
import db_connection from "./DB/connection.js";
import { socketConnection } from "./src/Utils/socket.io.utils.js";
import { routerHandler } from "./router-handler.js";
import { cronHandler } from "./cronjobs-handler.js";


export  const main= ()=>{

    config();
    const app = express();
    const port = process.env.PORT || 5000;

    //router handling
    routerHandler(app);

    //database connection
    db_connection();

    //cron jobs
    cronHandler();

    app.get("/", (req, res) => res.send("Hello World!"));

    const serverApp=app.listen(port, () => console.log(`Example app listening on port ${port}!`));

    const io=socketConnection(serverApp);
    //must do this every time deal with socket.io
    io.on('connection', (socket) => {
        console.log('a user connected');
        // console.log(socket.id);
    })
}