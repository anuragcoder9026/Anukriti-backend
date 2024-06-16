import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import app from "./app.js";
import { User } from './models/userModel.js';
dotenv.config({
    path:'/env'
})
connectDB()
.then(()=>{
    app.on("error",(e)=>{
       console.log("ERROR:",e);
       throw e;
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listening at http://localhost:${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!",err);
})