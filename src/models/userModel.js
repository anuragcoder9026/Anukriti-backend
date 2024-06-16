import { Schema, model } from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define a regex pattern for phone number validation
const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;

// User Schema
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  firstName:{type:String},
  lastName:{type:String},
  favourities:{type:String},
  summary:{type:String},
  about:{type:String},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String},
  followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  series:[{type: Schema.Types.ObjectId, ref: 'Series' ,default:null}],
  library: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  drafts: [{ type: Schema.Types.ObjectId, ref: 'Draft' }],
  profileImage: { type: String },
  coverImage: { type: String },
});




UserSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next;
this.password=await bcrypt.hash(this.password,10)// 10:number of round in hashing
next();
})

UserSchema.methods.isPasswordCorrect=async function(password){
return await bcrypt.compare(password,this.password) ; 
}

UserSchema.methods.generateAccessToken=function(){
  return jwt.sign(
  {
    _id:this._id,
    email:this.email,
    username:this.username,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: '1h'
  }
  )
}

const User = model('User', UserSchema);

export {User};
