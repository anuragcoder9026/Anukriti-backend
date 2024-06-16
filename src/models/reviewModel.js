import { Schema, model } from 'mongoose';

const ReviewSchema=new Schema({
  commentor:{ type: Schema.Types.ObjectId, ref: 'User' },
  post:{ type: Schema.Types.ObjectId, ref: 'Post' },
  rating: { type: Number, min: 1, max: 5 },
  comment:{ type: String,default:null},
  like:[{ type: Schema.Types.ObjectId, ref: 'User' }],
  date: { type: Date, default: Date.now }
});

const Review=model('Review',ReviewSchema);

export {Review}