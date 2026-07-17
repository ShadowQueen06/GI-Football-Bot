const mongoose=require('mongoose');
const ownedCardSchema=new mongoose.Schema({playerId:{type:String,required:true},obtainedAt:{type:Date,default:Date.now}},{_id:true});
const userSchema=new mongoose.Schema({discordId:{type:String,required:true},guildId:{type:String,required:true},coins:{type:Number,default:1000,min:0},cards:{type:[ownedCardSchema],default:[]},lastPackAt:{type:Date,default:null},lastDailyAt:{type:Date,default:null},wins:{type:Number,default:0},losses:{type:Number,default:0}},{timestamps:true});
userSchema.index({discordId:1,guildId:1},{unique:true});
module.exports=mongoose.model('User',userSchema);
