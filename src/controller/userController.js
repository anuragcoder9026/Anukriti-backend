// import express from express;
// import session from 'express-session';
import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
 import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Post } from "../models/postModel.js";
  


//SignUp the user
const SignUp=async(req,res)=>{
    const {email,username,password}=req.body;
    if([email,username,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required"});
        }
    else{
        const existedUser=await User.findOne({$or:[{username},{email}]})
        if(existedUser){
            res.status(400).json({"message":"Username or Email already exist."});
        }
        else{
        let user=await User.create({username, email, password});    
        let createdUser=await User.findById(user._id).select("-password");
        if(!createdUser){
        res.status(400).send({"message":"Something went wrong while regestering the user"});
        }
        else{
         const accessToken=createdUser.generateAccessToken();
         const options = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in milliseconds
            httpOnly: true,
            secure: true
          };
          
         return res.status(200)
        .cookie("accessToken",accessToken,options)
        .send({"content":createdUser,"message":"User signup sucessfully"})}
        }
    }

}

//Finding user data by cookie
const cookieAuth=async (req,res)=>{
    const token = req.cookies.accessToken;
   if (!token) {
       return res.status(400).json({
           success: false,
           message: "Token does not exist"
       });
   } else {
       try {
           const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
           const user=await User.findById(decodedToken._id);
           return res.status(200).send(user)
       } catch (error) {
           res.status(400).json({
               success: false,
               message: 'Not authorized'
           });
       }
   }
}


//Login the User
const LogIn=async (req,res)=>{
    const {email,password}=req.body;
    if([email,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required "});
    }
    else{
        let existedUser=await User.findOne({email});
    if(!existedUser){
        res.status(400).send({message:"Email does not match"})
    }
    else{
        let check=await existedUser.isPasswordCorrect(password);
        if(!check){
            res.status(400).send({message:"Password does not match"})
        }
        else{
            const accessToken=existedUser.generateAccessToken();
            const options = {
               maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
               httpOnly: true,
               path: '/',
               secure: true,
               sameSite: 'None'
             };      
           
           res.cookie("accessToken",accessToken,options)  ;
           res.status(200).send({"content":existedUser,"message":"User Login sucessfully"});
        }
    }
}

}
//update password
const updatePassword=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token does not exist");
    }
    else{
        try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken._id);
        if(!user) return res.status(400).send("user not found");
        const {password,newPassword}=req.body;
        let check=await user.isPasswordCorrect(password);
        if(!check){
            console.log("wrong");
            return res.status(400).send("Current Password does not match");
        }
         user.password=newPassword;
         await user.save();
        return res.status(200).send("password updated successfully.");
        } catch (error) {
            return res.status(400).send("password not  updated successfully.");  
        }
    } 
   

}


//logout the user
const LogOut=async(req,res)=>{
    res.clearCookie('accessToken',{
        path: '/',
        secure: true,
        sameSite: 'None'
    });
  res.status(200).send('User LogOut SuccessFully');
}

//set profile
const setProfile=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token does not exist");
    }
    else{
        try {
            const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            const user=await User.findById(decodedToken._id);
            if(!user) return res.status(400).send("user not found");
            const{firstName,lastName,username,favourities,summary,email,phone}=req.body;
            let existedEmail=await User.findOne({ email});
            if(existedEmail && existedEmail._id.toString()!==decodedToken._id) return res.status(400).send("user with this Email already exist")
            let existedName=await User.findOne({ username});
            if(existedName && existedName._id.toString()!==decodedToken._id) return res.status(400).send("user with this Username already exist")
            const updatedUser=await User.findByIdAndUpdate(decodedToken._id, {firstName,lastName,username,favourities,summary,email,phone}, { new: true });
            const accessToken=updatedUser.generateAccessToken();
            const options = {
               maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
               httpOnly: true,
               path: '/',
               secure: true,
               sameSite: 'None'
             };      
           
            res.cookie("accessToken",accessToken,options)  ;
            return res.status(200).send("user profile updated successfully");
        } catch (error) {
            return res.status(400).send("user profile not updated successfully")
        }
    }
}

//set About
const setAbout=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token does not exist");
    }
    else{
        try {
            const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
            const user=await User.findById(decodedToken._id);
            if(!user) return res.statud(400).send("user not found");
            const {about}=req.body;
            await User.findByIdAndUpdate(decodedToken._id,{about},{new:true});
            return res.status(200).send("user about updated successfully");
        } catch (error) {
            return res.status(400).send("user about not updated successfully")
        }
    }
}

//get profile
const getProfile=async (req,res)=>{
    const token = req.cookies.accessToken;
    console.log("signup token:",token);
    const username=req.params.username;
   if (token) {
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    console.log("signup dtoken:",decodedToken);
    if(decodedToken.username===username){
        try {
            let existedUser=await User.findOne({username});
           return res.status(200).send(existedUser);
        } catch (error) {
            return res.status(400).send({"message":"something went wrong"})
        }
    }
    else{
       try {
        let existedUser=await User.findOne({username}).select("-password -email -phone -library -drafts");
        return res.status(200).send(existedUser);
       } catch (error) {
        return res.status(400).send({"message":"something went wrong"})
       }
    } 
   } 
   else{
    try {
        let existedUser=await User.findOne({username}).select("-password -email -phone -library -drafts");
        return res.status(200).send(existedUser);
       } catch (error) {
       return  res.status(400).send({"message":"something went wrong"})
       }
   }
  
}
//check Follow
const checkFollow=async (req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(200).send('Follow')
    }
    else{
        try {
           const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
           const {followUserId}=req.query;
           if(decodedToken._id===followUserId){
            return res.status(200).send(null);
           }
           const followedUser = await User.findById(followUserId);
           if (!followedUser) return res.status(404).json({ message: 'Followed User not found' });
           const userId=decodedToken._id;
           const user = await User.findById(userId);
           if(followedUser.followers.includes(user._id)){
            res.status(200).send('Following')
           }
           else{
            res.status(200).send('Follow')
           }
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Not authorized'
            });
        }
    }
}

//follow the user
const followUser = async (req, res) => {
    const token = req.cookies.accessToken;
    const { follow } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Token does not exist"
        });
    } else {
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const { followUserId } = req.query;
            const followedUser = await User.findById(followUserId);
            if (!followedUser) return res.status(404).json({ message: 'Followed User not found' });

            const userId = decodedToken._id;
            const user = await User.findById(userId);

            if (follow === 'Follow') {
                // Add user to followers array of followedUser
                if (!followedUser.followers.includes(userId)) {
                    followedUser.followers.push(userId);
                }
                // Add followedUser to following array of user
                if (!user.following.includes(followUserId)) {
                    user.following.push(followUserId);
                }
                await followedUser.save();
                await user.save();
                const name=followedUser?.firstName ?`${followedUser?.firstName} ${followedUser?.lastName}` : `${followedUser?.username}`
                res.status(200).send({ "message": `You are Following ${name}` });
            } else if (follow === 'Following') {
                // Remove user from followers array of followedUser
                followedUser.followers = followedUser.followers.filter(follower => follower.toString() !== userId);
                // Remove followedUser from following array of user
                user.following = user.following.filter(following => following.toString() !== followUserId);
                await followedUser.save();
                await user.save();
                 const name=followedUser?.firstName ?`${followedUser?.firstName} ${followedUser?.lastName}` : `${followedUser?.username}`
                res.status(200).send({ "message": `You have Unfollowed ${name}` });
            } else {
                res.status(400).json({ "message": "Invalid follow action" });
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Not authorized'
            });
        }
    }
};

//get follower following
const getFollow=async (req,res)=>{
    const token = req.cookies.accessToken;
    const userId=req.params.id;
   if (token) {
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(decodedToken._id===userId){
        try {
            let existedUser=await User.findById(userId);
            res.status(200).send(existedUser);
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
    }
    else{
       try {
        let existedUser=await User.findById(userId).select("-password -email -phone -library -drafts");
        res.status(200).send(existedUser);
       } catch (error) {
        res.status(400).send({"message":"something went wrong"})
       }
    } 
   } 
   else{
    try {
        let existedUser=await User.findById(userId).select("-password -email -phone -library -drafts");
        res.status(200).send(existedUser);
       } catch (error) {
        res.status(400).send({"message":"something went wrong"})
       }
   }
  
}
const UserProfileImage=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token not exists");
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        try {
            if(req.file){
                console.log(req.file);
                let profileLocalPath=req.file.path;
                const profile=await uploadOnCloudinary(profileLocalPath);
                console.log(profile);
                let profileImage=profile.secure_url;
               const user=await User.findByIdAndUpdate(decodedToken._id,{profileImage},{new:true});
               return res.status(200).send("profile image uploade succssfully");
            }
            else{
                return res.status(400).send({"message":"something went wrong"})
            }
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
    }
}

const UserCoverImage=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token not exists");
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        try {
            if(req.file){
                let coverLocalPath=req.file.path;
                const cover=await uploadOnCloudinary(coverLocalPath);
                console.log(cover);
                let coverImage=cover.secure_url;
               const user=await User.findByIdAndUpdate(decodedToken._id,{coverImage},{new:true});
               return res.status(200).send("cover image uploade succssfully");
            }
            else{
                return res.status(400).send({"message":"something went wrong"})
            }
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
    }
}

export{SignUp,cookieAuth,LogIn,LogOut,getProfile,followUser,checkFollow,getFollow,setProfile,setAbout,updatePassword,UserProfileImage,UserCoverImage};
