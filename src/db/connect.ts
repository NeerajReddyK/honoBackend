import mongoose  from 'mongoose';
import 'dotenv/config';

export default async function dbConnect() {
  try{
    await mongoose.connect(String(process.env.MONGO_URI));
    console.log("MongoDB Connected successfully");
    
  }
  catch(e) {
    console.error("Failed to connect to mongodb", e);
  }
}