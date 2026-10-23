module.exports=async(q,s)=>{
try{
 const u=new URL(String(q.query.u||''));
 if(u.protocol!=='https:'||!/\.glb$/i.test(u.pathname)||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname))throw 0;
 const r=await fetch(u.href);
 if(!r.ok)throw 0;
 const buf=Buffer.from(await r.arrayBuffer());
 if(buf.length>4400000)throw 0;
 s.setHeader('Content-Type','model/gltf-binary');
 s.setHeader('Cache-Control','public,max-age=86400,s-maxage=86400');
 s.setHeader('Access-Control-Allow-Origin','*');
 s.status(200).send(buf);
}catch(e){s.status(400).send('avatar tidak bisa dimuat')}
};
