const { Events, ActivityType } = require('discord.js');
module.exports={name:Events.ClientReady,once:true,execute(client){console.log(`✅ GI Football متصل باسم ${client.user.tag}`);client.user.setActivity('اكتب مساعدة | GI Football',{type:ActivityType.Playing});}};
