module.exports={addCoins:async(u,n)=>{u.coins+=n;await u.save();return u.coins;},removeCoins:async(u,n)=>{if(u.coins<n)return false;u.coins-=n;await u.save();return true;}};
