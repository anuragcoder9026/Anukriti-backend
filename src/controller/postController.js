import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { Series } from "../models/seriesModel.js";
import { Draft } from "../models/draftModel.js";
import { Review } from "../models/reviewModel.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
const getPostRating=async(req,res)=>{
    const {postId}=req.query;
    const post=await Post.findById(postId);
    if(!post){
      return res.status(400).send("post not found");
    }
    try {
      const ratingCount=post.reviews.length;
      const result = await Review.aggregate([
        { $match: { _id: { $in: post.reviews } } },
        { $group: { _id: null, totalRating: { $avg: "$rating" } } }
      ]);
      console.log(result);
      const rating= result.length > 0 ? result[0].totalRating : 0;
      return res.status(200).send({rating,ratingCount});
    } catch (error) {
      return res.status(400).send("something went wromng");
    }
}

const saveDeaft=async(req,res)=>{
  const {draftId,atitle,title,content}=req.body;
  const token = req.cookies.accessToken;
  const decodedPostUser = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
  const draftUser=decodedPostUser._id;
  const user = await User.findById(draftUser);
  if (!user) return res.status(404).json({ message: 'User not found' });
   try {
    if(draftId && !atitle){
      const updatedDraft=await Draft.findByIdAndUpdate(draftId, {title,content}, { new: true });
         return res.status(200).send(updatedDraft);
    }
    else if(draftId && atitle){
      const updatedDraft=await Draft.findByIdAndUpdate(draftId, {title:atitle,content}, { new: true });
         return res.status(200).send(updatedDraft);
    }
    else{
        let draft=await Draft.create({title,content,draftUser});    
        let createdDraft=await Draft.findById(draft._id); 
        if(createdDraft){
        user.drafts.push(createdDraft._id);
        await user.save();
         return res.status(200).send('Draft Saved SuccessFully'); 
        }
        else{
          return res.status(400).send('Draft not Saved SuccessFully'); 
        }
      }
        
   } catch (error) {
    res.status(400).send("something went wrong while saving draft.");   
   }
}

const getDraft=async(req,res)=>{
  const token = req.cookies.accessToken;
  const { draftId } = req.query;
  try {
    const draft= await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'draft not found' });
    }
    else{
      if(token){
      const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      if(draft.draftUser.toString()===decodedToken._id){
        res.status(200).send(draft);
      }
      else{
        res.status(400).send("not allowed to see this draft");
      }
      }
      else{
        res.status(400).send("token not exist");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the draft' });
  }
}


const deleteDraft=async(req,res)=>{
  const {draftId}=req.params;
  const token = req.cookies.accessToken;
  if(!draftId) return res.status(404).send('draftId Not present');
  if(!token) return res.status(404).send('token Not present' );
  try {
    const draft= await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ error: 'User not found' });
    }
    else{
      const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      if(draft.draftUser.toString()===decodedToken._id){
        await User.updateOne(
          { _id: decodedToken._id },
          { $pull: { drafts: draftId } }
        );
        await Draft.findByIdAndDelete(draftId);
        return res.status(200).send("post deleted succesfully")
      }
      else{
        return res.status(400).send("you are not allowed to delete this draft")
      }
      
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the draft' });
  }
  
}

const PostCoverImage=async(req,res)=>{
  const token = req.cookies.accessToken;
  const {postId}=req.query;
  if(!token){
      return res.status(400).send("token not exists");
  }
  else{
      try {
          if(req.file){
              let coverLocalPath=req.file.path;
              const cover=await uploadOnCloudinary(coverLocalPath);
              console.log(cover);
              let coverImage=cover.url;
             const post=await Post.findByIdAndUpdate(postId,{coverImage},{new:true});
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

const publishPost=async(req,res)=>{
  const {postId,title,content,seriesTitle,summary,categories}=req.body;
  const token = req.cookies.accessToken;
  const decodedPostUser = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
  const postUser=decodedPostUser._id;
  const user = await User.findById(postUser);
  if (!user) return res.status(404).json({ message: 'User not found' });
  let coverLocalPath=req.file.path;
  const cover=await uploadOnCloudinary(coverLocalPath);
  let coverImage=cover.url;
  if(seriesTitle==='Not a Series'){
        if(postId){
         const updatedPost=await Post.findByIdAndUpdate(postId, {title,content,postUser,summary,coverImage}, { new: true });
         return res.status(200).send(updatedPost);
        }
        let post=await Post.create({title,content,postUser,summary,categories,coverImage});    
        let createdPost=await Post.findById(post._id); 
        if(createdPost){
        user.posts.push(createdPost._id);
        await user.save();
        res.status(200).send('Post published SuccessFully'); 
        }
        else res.status(400).send("something went wrong while publishing post.");   
    }
  else{
    let series = await Series.findOne({ title:seriesTitle,seriesUser:postUser});
    if(series){
      let post=await Post.create({title,content,postUser,summary,categories:series.categories,series,coverImage});    
      let createdPost=await Post.findById(post._id); 
        if(createdPost){
        series.seriesCollection.push(createdPost._id);
        await series.save();  
        user.posts.push(createdPost._id);
        await user.save();
        res.status(200).send('Post published SuccessFully'); 
        }
        else res.status(400).send("something went wrong while publishing post.");   
    }
    else{
      let series=await Series.create({title:seriesTitle,seriesUser:postUser,summary,categories});
      let post=await Post.create({title,content,postUser,summary,categories,series,coverImage})    
      let createdPost=await Post.findById(post._id);
      if(createdPost){
        series.seriesCollection.push(createdPost._id);
        await series.save();  
        user.posts.push(createdPost._id);
        user.series.push(series._id);
        await user.save();

        res.status(200).send('Post published SuccessFully'); 
        }
        else res.status(400).send("something went wrong while publishing post."); 
    }
    }
   } 
        
const fetchPostInfo=async(req,res)=>{
    const { id,inCount} = req.query;
    try {
      const post = await Post.findById(id)
      if (!post) {
        return res.status(404).json({ error: ' post is not found' });
      }
      if(post.series && inCount){
         const series=await Series.findById(post.series);
         series.viewCount+=1;
         await series.save();
      }
      if(inCount){
        console.log(Date.now());
        post.viewCount+=1;
        await post.save();  
      }
      res.status(200).send(post);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the post' });
    }
}

const postAuth=async(req,res)=>{
  const token = req.cookies.accessToken;
  const { postId } = req.query;
  try {
    const userId = await Post.findById(postId).select('postUser ');
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    else{
      if(token){
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      if(userId.postUser.toString()===decodedToken._id){
        const user=await User.findById(userId.postUser.toString());
        res.status(200).send(user);
      }
      else{
        const user=await User.findById(userId.postUser.toString()).select('-email -password -library -drafts -phone')
        res.status(200).send(user);
      }
      }
      else{
        const user=await User.findById(userId.postUser.toString()).select('-email -password -library -drafts -phone')
        res.status(200).send(user);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the user' });
  }
  
}

const getAllPost=async (req,res)=>{
  try {
    const posts = await Post.find({}, '_id').lean();
    if (!posts) {
      return res.status(404).json({ error: ' posts are not found' });
    }
    const postIds = posts.map(post => post._id.toString());
    res.status(200).json({ postIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the posts' });
  }
}

const addLibrary=async(req,res)=>{
  const {postId}=req.params;
  const {library}=req.body;
  const token = req.cookies.accessToken;
    if(!token){
        return res.status(400).send("token does not exist")
    }
  else{
    try {
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const user=await User.findById(decodedToken._id) ; 
    const post=await Post.findById(postId);
    if(!post) return res.status(400).send("post not found");
    if(!user) return res.status(400).send("user not found");
    if(library===false){
      if (!user.library.includes(postId)) {
        user.library.push(postId);
        await user.save();
        return res.status(200).send("post added to library")
      }
      else{
        return res.status(200).send("post already added to library")
      }
    }
    else if(library===true){
      if(user.library.includes(postId)){
         user.library=user.library.filter(posts=>posts.toString() !== postId);
         await user.save();
         return res.status(200).send("post removed from library")
      }
      else{
        return res.status(200).send("post already not exist in library");
      }
    }
    else {
      res.status(400).json({ "message": "Invalid library action" });
  }
  } catch (error) {
    res.status(400).json({ "message": "something went wrong" });
  }
}
}

//check library 
const checkLibrary=async (req,res)=>{
  const token = req.cookies.accessToken;
  if(!token){
      return res.status(200).send(false)
  }
  else{
      try {
         const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
         const {postId}=req.query;
         const user = await User.findById(decodedToken._id);
         if(user.library.includes(postId)){
          res.status(200).send(true)
         }
         else{
          res.status(200).send(false)
         }
      } catch (error) {
          res.status(400).json({
              success: false,
              message: 'Not authorized'
          });
      }
  }
}

//delete post
const deletePost=async(req,res)=>{
  const {postId}=req.params;
  const token = req.cookies.accessToken;
  if(!postId) return res.status(404).send('postId Not present');
  if(!token) return res.status(404).send('token Not present' );
  try {
    const userId = await Post.findById(postId).select('postUser');
    if (!userId) {
      return res.status(404).json({ error: 'User not found' });
    }
    else{
      const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      if(userId.postUser.toString()===decodedToken._id){
        await User.updateMany(
          { library: postId },
          { $pull: { library: postId } }
        ); 

        await User.updateOne(
          { _id: decodedToken._id },
          { $pull: { posts: postId } }
        );

        await Series.updateMany(
          { seriesCollection: postId },
          { $pull: { seriesCollection: postId } }
        );

        await Post.findByIdAndDelete(postId);
         return res.status(200).send("post deleted succesfully")
      }
      else{
        return res.status(400).send("you are not allowed to delete this post")
      }
      
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the post' });
  }
  
}

const allSeriesTitle=async(req,res)=>{
  const token = req.cookies.accessToken;
  if(!token) return res.status(404).send('token Not present' );
  try {
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const seriesTitles=await Series.find({seriesUser:decodedToken._id}).select('title');
    res.status(200).send(seriesTitles);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while getting series title' });
  }
}

//series chapters
const seriesChapter=async(req,res)=>{
    const {postId}=req.params;
    const post=await Post.findById(postId);
    if(!post) {
      return res.status(400).send("post not found")
    }
    else{
      try {
        if(!post.series){
          return res.status(400).send("not a series")
        }
        else{
          const chapters=await Series.findById(post.series).select('seriesCollection -_id');
          res.status(200).send(chapters.seriesCollection);
        }
      } catch (error) {
        res.status(400).send("something went wrong while getting series chapters");
      }
    }
}

//get all series
const getAllSeries=async(req,res)=>{
  try {
    const series = await Series.find({}, '_id').lean();
    if (!series) {
      return res.status(404).json({ error: ' series are not found' });
    }
    const seriesIds = series.map(post => post._id.toString());
    res.status(200).json({ seriesIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the series' });
  }
}

//series in content section 
const seriesContent = async (req, res) => {
  const { seriesId } = req.params;

  try {
    // Find the series by ID
    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(400).send("Series not found");
    }

    // Get related data
    const postIds = series.seriesCollection;
    const parts = postIds.length;
    const posts = await Post.find({ _id: { $in: postIds } });
    const user = await User.findById(series.seriesUser);
    const username = user.username;
    const firstName = user.firstName;
    const lastName = user.lastName;

    // Calculate total words and reading time
    let totalWords = 0;
    posts.forEach(post => {
      if (post.content) {
        totalWords += post.content.split(' ').filter(word => word.length > 0).length;
      }
    });

    let readTime;
    let readingTimeMinutes = Math.ceil(totalWords / 200);
    if (readingTimeMinutes < 60) {
      readTime = `${readingTimeMinutes} minute${readingTimeMinutes !== 1 ? 's' : ''}`;
    } else {
      let readingTimeHours = Math.floor(readingTimeMinutes / 60);
      readTime = `${readingTimeHours} hour${readingTimeHours !== 1 ? 's' : ''}`;
    }

    const title = series.title;
    const date = series.date;
    const viewCount = series.viewCount;
    const summary = series.summary;
    const firstPost = await Post.findById(postIds[0]);
    const firstPostLink = `${firstPost.title}-${firstPost._id}`;
    const coverImage = firstPost.coverImage;

    // Aggregation pipeline for rating
    const result = await Series.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(seriesId) } },
      { $unwind: '$seriesCollection' },
      {
        $lookup: {
          from: 'posts',
          localField: 'seriesCollection',
          foreignField: '_id',
          as: 'post'
        }
      },
      { $unwind: '$post' },
      { $unwind: '$post.reviews' },
      {
        $lookup: {
          from: 'reviews',
          localField: 'post.reviews',
          foreignField: '_id',
          as: 'review'
        }
      },
      { $unwind: '$review' },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          totalRatingSum: { $sum: '$review.rating' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRatings: 1,
          averageRating: { $divide: ['$totalRatingSum', '$totalRatings'] }
        }
      }
    ]);

    console.log("Series result:", result);

    res.status(200).send({
      coverImage,
      parts,
      readTime,
      title,
      date,
      viewCount,
      firstPostLink,
      username,
      summary,
      firstName,
      lastName,
      averageRating: result.length > 0 ? result[0].averageRating : 0,
      totalRatings: result.length > 0 ? result[0].totalRatings : 0
    });

  } catch (error) {
    console.error('Error while getting series content:', error);
    res.status(500).send("Something went wrong while getting series content");
  }
};


const nextPost=async(req,res)=>{
   const {postId}=req.params;
   const post=await Post.findById(postId);
   if(!post){
    return res.status(400).send("post not found");
   }
   else{
    try {
      if(!post.series){
       return  res.status(400).send("no next post for this post");
      }
      else{
         const series=await Series.findById(post.series);
         const seriesArray=series.seriesCollection;
         const postIndex=seriesArray.indexOf(post._id);
         if(postIndex===seriesArray.length-1){
          return  res.status(400).send("this is the last post");
         }
         else{
           const nextPostId=seriesArray[postIndex+1]
           const nextPost=await Post.findById(nextPostId);
           return res.status(200).send(nextPost);
         }
      }
    } catch (error) {
      return res.status(400).send("something went wrong while getting next post");
    }
   }
}

const getCategory=async (req,res)=>{
    const {category}=req.params;
    try {
      const posts = await Post.find({ categories: { $in: [category] } });
      if(!posts) return res.status(400).send("posts with category not found");
      return res.status(200).send(posts);
    } catch (error) {
      res.status(400).send("error while fetching post with this category");
    }
}

const getSeriesCategory=async (req,res)=>{
  const {category}=req.params;
  try {
    const series = await Series.find({ categories: { $in: [category] } });
    if(!series) return res.status(400).send("series with category not found");
    return res.status(200).send(series);
  } catch (error) {
    res.status(400).send("error while fetching post with this category");
  }
}

export {publishPost,fetchPostInfo,postAuth,getAllPost,getAllSeries,addLibrary,checkLibrary,deletePost,allSeriesTitle,seriesChapter,seriesContent,nextPost,saveDeaft,getDraft,deleteDraft,getCategory,getSeriesCategory,PostCoverImage,getPostRating}