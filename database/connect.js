const mongoose=require('mongoose');
module.exports=async function(uri){mongoose.connection.on('connected',()=>console.log('✅ MongoDB متصل'));mongoose.connection.on('error',e=>console.error('MongoDB:',e.message));await mongoose.connect(uri,{serverSelectionTimeoutMS:15000});};
