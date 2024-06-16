import { Schema, model } from 'mongoose';

const DraftSchema=new Schema({
 title:{type:String}, 
 content:{type:String},   
 date: { type: Date, default: Date.now },
 draftUser:[{ type: Schema.Types.ObjectId, ref: 'User' }],
});

const Draft=model('Draft',DraftSchema);

export {Draft}