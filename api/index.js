const c=require('crypto');
const U=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL,T=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN,S=process.env.SECRET||'ganti-secret-ini';
const R=async(...a)=>{if(!U||!T)throw 'Database belum tersambung: isi env UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN di Vercel, lalu Redeploy';return R2(...a)};
const R2=async(...a)=>(await(await fetch(U,{method:'POST',headers:{Authorization:'Bearer '+T},body:JSON.stringify(a)})).json()).result;
const J=async k=>{const v=await R('GET',k);return v?JSON.parse(v):null};
const W=(k,v)=>R('SET',k,JSON.stringify(v));
const mac=p=>c.createHmac('sha256',S).update(p).digest('base64url');
const sign=e=>{const p=Buffer.from(e).toString('base64url');return p+'.'+mac(p)};
const ver=t=>{const[p,s]=(t||'').split('.');if(s&&mac(p)===s)return Buffer.from(p,'base64url').toString()};
const hash=(p,s)=>c.scryptSync(p,s,32).toString('hex');
const pub=u=>({name:u.name,email:u.email,gender:u.gender,avatar:u.avatar,room:u.room});
const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const E=m=>{throw m};
module.exports=async(q,s)=>{
try{
const b=q.body||{},a=b.a,em=String(b.email||'').trim().toLowerCase();
if(a==='register'){
 if(!/^\S+@\S+\.\S+$/.test(em))E('Email tidak valid');
 if(!b.name||String(b.name).length>30)E('Nama wajib diisi (maks 30)');
 if(String(b.pw||'').length<6)E('Password minimal 6 karakter');
 if(!['pria','wanita'].includes(b.gender))E('Pilih gender');
 if(await J('user:'+em))E('Email sudah terdaftar');
 const salt=c.randomBytes(8).toString('hex'),u={name:String(b.name),email:em,gender:b.gender,salt,pw:hash(b.pw,salt)};
 await W('user:'+em,u);return s.json({token:sign(em),u:pub(u)});
}
if(a==='login'){
 const u=await J('user:'+em);
 if(!u||hash(String(b.pw||''),u.salt)!==u.pw)E('Email atau password salah');
 return s.json({token:sign(em),u:pub(u)});
}
const e=ver(q.headers.authorization);if(!e)return s.status(401).json({e:'Sesi habis, login lagi'});
const u=await J('user:'+e);if(!u)return s.status(401).json({e:'Akun tidak ditemukan'});
if(a==='me')return s.json({u:pub(u)});
if(a==='avatar'){
 if(!/^https:\/\/\S+\.glb(\?\S*)?$/.test(b.url||''))E('Link harus https dan berakhiran .glb');
 u.avatar=b.url;await W('user:'+e,u);return s.json({u:pub(u)});
}
if(a==='create'){
 let code='';for(let i=0;i<6;i++)code+=AL[c.randomInt(AL.length)];
 await W('room:'+code,{m:[e]});u.room=code;await W('user:'+e,u);return s.json({code});
}
if(a==='join'){
 const code=String(b.code||'').trim().toUpperCase(),r=await J('room:'+code);
 if(!r)E('Kode room tidak ditemukan');
 if(!r.m.includes(e)){if(r.m.length>=2)E('Room sudah penuh');r.m.push(e);await W('room:'+code,r)}
 u.room=code;await W('user:'+e,u);return s.json({code});
}
if(a==='loc'){
 if(b.off)await R('DEL','loc:'+e);else await W('loc:'+e,{lat:+b.lat,lng:+b.lng,t:Date.now()});
 return s.json({ok:1});
}
const code=b.code,r=await J('room:'+code);
if(!r||!r.m.includes(e))E('Bukan anggota room ini');
if(a==='send'){
 const d=String(b.data||'');
 if(b.type==='text'){if(!d.trim()||d.length>500)E('Pesan kosong/terlalu panjang')}
 else if(b.type==='img'){if(!d.startsWith('data:image/'))E('File tidak valid')}
 else if(b.type==='video'){if(!d.startsWith('data:video/'))E('File tidak valid')}
 else E('Tipe tidak dikenal');
 if(d.length>950000)E('File terlalu besar');
 await R('RPUSH','msgs:'+code,JSON.stringify({from:e,type:b.type,data:d,t:Date.now()}));
 return s.json({ok:1});
}
if(a==='state'){
 const since=Math.max(0,+b.since||0),total=await R('LLEN','msgs:'+code);
 const raw=total>since?await R('LRANGE','msgs:'+code,since,-1):[];
 const m=[];for(const x of r.m){const p=await J('user:'+x);m.push({...pub(p),loc:await J('loc:'+x)})}
 return s.json({m,msgs:raw.map(x=>JSON.parse(x)),total});
}
E('Aksi tidak dikenal');
}catch(x){s.status(400).json({e:typeof x==='string'?x:'Server error: '+(x&&x.message)})}
};
