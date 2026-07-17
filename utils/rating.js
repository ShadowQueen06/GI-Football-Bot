module.exports=p=>p.length?Math.round(p.reduce((s,x)=>s+x.rating,0)/p.length):0;
