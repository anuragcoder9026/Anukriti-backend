import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { Series } from "../models/seriesModel.js";
import { Draft } from "../models/draftModel.js";
import { Review } from "../models/reviewModel.js";
import jwt from "jsonwebtoken";

const getAllReview=async (req,res)=>{
    try {
      const {postId}=req.query;
      const reviews = await Review.find({post:postId, comment: { $ne: null }}).lean();
      if (!reviews) {
        return res.status(400).json({ error: 'no reviews are not found' });
      }
      const reviewIds =reviews.map(review => review._id.toString());
      res.status(200).json({ reviewIds });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the reviews' });
    }
  }
const getComment=async(req,res)=>{
    try {
        const {reviewId}=req.query;
        const review = await Review.findById(reviewId);
        if (!review) {
          return res.status(400).json({ error: ' review not found' });
        }
        const user=await User.findById(review.commentor);
        const username=user.username;
        const firstName=user.firstName;
        const lastName=user.lastName;
        const profile=user.profileImage;
        const rating=review.rating;
        const comment=review.comment;
        const date=review.date;
        const like=review.like ? review.like.length :0;
        res.status(200).send({username,firstName,lastName,profile,rating,comment,date,like});
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the comment' });
      }
} 

const deleteLike=async(req,res)=>{
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(400).send("Token does not exist");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const { reviewId } = req.body;
        const userId = decodedToken._id;
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { $pull: { like: userId } },
            { new: true}
        );

        if (!updatedReview) {
            return res.status(404).send("Review not found");
        }

        return res.status(200).send("UnLiked successfully.");
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).send("Invalid token");
        }
        return res.status(500).send("Something went wrong");
    }
}


const setLike = async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(400).send("Token does not exist");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const { reviewId } = req.body;
        const userId = decodedToken._id;
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { $push: { like: userId } },
            { new: true}
        );

        if (!updatedReview) {
            return res.status(404).send("Review not found");
        }

        return res.status(200).send("Liked successfully.");
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).send("Invalid token");
        }
        return res.status(500).send("Something went wrong");
    }
}

const checkLike=async(req,res)=>{
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(400).send("Token does not exist");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const { reviewId } = req.query;
        const userId = decodedToken._id;
         const review = await Review.findOne({
            _id: reviewId,
            like: { $elemMatch: { $eq: userId } }
        });
        if(review){
            return res.status(200).send('blue');
        }
        else{
            return res.status(200).send('#999');
        }
    } catch (error) {
        return res.status(500).send("Something went wrong");
    }
}

const deleteReview=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token not exists");
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const {postId}=req.query;
        const userId=decodedToken._id;
        try {
              const review=await Review.findOne({ commentor: userId, post: postId });
              const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $pull: { reviews: review._id } },
                { new: true}
            );
            if (!updatedPost) {
                return res.status(404).send("Post not found");
            }
            await Review.findByIdAndDelete(review._id);
              return res.status(200).send("review deleted successfully")
        } catch (error) {
            return res.status(400).send("something went wrong");
        }
    }
}


const setComments=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token not exists");
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const {postId}=req.query;
        const userId=decodedToken._id;
        const {comment}=req.body;
        try {
            const existedReview = await Review.findOne({ commentor: userId, post: postId });
            if(existedReview){
              existedReview.comment=comment;
              existedReview.date=Date.now();
              await existedReview.save();
              return res.status(200).send("commented successfully.")
            }
            else{
              const review=await Review.create({commentor:userId,post:postId,comment:comment});
              const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $push: { reviews: review._id } },
                { new: true}
            );
    
            if (!updatedPost) {
                return res.status(404).send("Post not found");
            }
              return res.status(200).send("commented successfully.")
            }
        } catch (error) {
            return res.status(400).send("something went wrong");
        }
    }
}

const setRating=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token not exists");
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const {postId}=req.query;
        const userId=decodedToken._id;
        const {rating}=req.body;
        try {
            const existedReview = await Review.findOne({ commentor: userId, post: postId });
            if(existedReview){
              existedReview.rating=rating;
              existedReview.date=Date.now();
              await existedReview.save();
              return res.status(200).send("rating updated successfully.")
            }
            else{
              const review=await Review.create({commentor:userId,post:postId,rating:rating});
              const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $push: { reviews: review._id } },
                { new: true}
            );
    
            if (!updatedPost) {
                return res.status(404).send("Post not found");
            }
              return res.status(200).send("rating created successfully.")
            }
        } catch (error) {
            return res.status(400).send("something went wrong");
        }
    }
}


const checkRating=async(req,res)=>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(200).send({"rating":0});
    }
    else{
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const {postId}=req.query;
        const userId=decodedToken._id;
        try {
            const existedReview = await Review.findOne({ commentor: userId, post: postId });
            if(existedReview){
              return res.status(200).send({"rating":existedReview.rating});
              
            }
            else{
                return res.status(200).send({"rating":0});
            }
        } catch (error) {
            return res.status(400).send("something went wrong");
        }
    }
}

export {setRating,checkRating,setComments,deleteReview,getAllReview,getComment,setLike,checkLike,deleteLike}