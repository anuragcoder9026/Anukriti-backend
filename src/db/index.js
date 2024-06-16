import mongoose, { connections } from "mongoose";
const DB_NAME='anukriti'
const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`);
        console.log(`\n MongoDB connect !!! DB Host:${connectionInstance.Connection.host}`);
    }
    catch(error){
        console.log("MONGODB connection error:",error);
        connection.exit(1)
    }
}

export default connectDB;