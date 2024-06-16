import { Schema, model } from 'mongoose';

const PostSchema=new Schema({
 title:{type:String,required:true},
 content:{type:String},
 postUser:{ type: Schema.Types.ObjectId, ref: 'User' },
 series:{ type: Schema.Types.ObjectId, ref: 'Series' ,default:null},
 reviews:[{ type: Schema.Types.ObjectId, ref: 'Review' }],
 summary:{type:String},
 categories:[{type:String}],
 coverImage:{type:String,default:'https://media.istockphoto.com/id/505995404/photo/book.webp?b=1&s=170667a&w=0&k=20&c=xLPXz7gY8mk-2v6PlxyXJtBf0gFU60pLy3KDsOxejCk='}, 
 date: { type: Date, default: Date.now },
 viewCount: { type: Number, default: 0 }
});

const Post=model('Post',PostSchema);

export {Post}