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
const e=ver(q.headers.authorization||b.tk);if(!e)return s.status(401).json({e:'Sesi habis, login lagi'});
const u=await J('user:'+e);if(!u)return s.status(401).json({e:'Akun tidak ditemukan'});
if(a==='me')return s.json({u:pub(u)});
if(a==='avatar'){
 if(!/^https:\/\/\S+\.glb(\?\S*)?$/.test(b.url||''))E('Link harus https dan berakhiran .glb');
 u.avatar=b.url;await W('user:'+e,u);return s.json({u:pub(u)});
}
if(a==='fls'){const f=(await J('fr:'+e))||{l:[],i:[]},L=async xs=>(await Promise.all(xs.map(x=>J('user:'+x)))).filter(Boolean).map(p=>({name:p.name,email:p.email,gender:p.gender}));return s.json({l:await L(f.l),i:await L(f.i)})}
if(a==='fadd'){const p=await J('user:'+em);if(!p||em===e)E('Akun tidak ditemukan');const my=(await J('fr:'+e))||{l:[],i:[]};if(my.l.includes(em))E('Sudah berteman');const f=(await J('fr:'+em))||{l:[],i:[]};
 if(my.i.includes(em)){my.i=my.i.filter(x=>x!==em);my.l.push(em);f.l.push(e);await W('fr:'+e,my)}else if(!f.i.includes(e))f.i.push(e);
 await W('fr:'+em,f);return s.json({ok:1})}
if(a==='fres'){const f=(await J('fr:'+e))||{l:[],i:[]};f.i=f.i.filter(x=>x!==em);if(b.ok&&!f.l.includes(em)){f.l.push(em);const g=(await J('fr:'+em))||{l:[],i:[]};if(!g.l.includes(e))g.l.push(e);await W('fr:'+em,g)}await W('fr:'+e,f);return s.json({ok:1})}
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
if(a==='settz'){await R('SET','tz:'+e,String(b.v||'').slice(0,40));return s.json({ok:1})}
if(a==='quiz'){const o=(Array.isArray(b.o)?b.o:[]).slice(0,4).map(x=>String(x).slice(0,60)),q=String(b.q||'').slice(0,120);if(q.length<3||o.length<2||!(b.a>=0&&b.a<o.length))E('Kuis tidak valid');await W('qz:'+code,{by:e,name:u.name,q,o,a:+b.a,g:null});return s.json({ok:1})}
if(a==='guess'){const z=await J('qz:'+code);if(!z||z.g!==null||z.by===e)E('Tidak ada kuis untuk ditebak');z.g=+b.g;await W('qz:'+code,z);if(z.g===z.a){const sc=(await J('qs:'+code))||{};sc[e]=(sc[e]||0)+1;await W('qs:'+code,sc)}return s.json({ok:1})}
if(a==='tttnew'){const old=await J('tt:'+code),o=r.m.find(x=>x!==e);if(!o)E('Menunggu pasangan masuk room');await W('tt:'+code,{b:Array(9).fill(''),x:e,o,t:'x',w:'',s:(old&&old.s)||{}});return s.json({ok:1})}
if(a==='tttmove'){const g=await J('tt:'+code),i=+b.i;if(!g||g.w||!(i>=0&&i<9)||g.b[i])E('Langkah tidak valid');if((g.t==='x'?g.x:g.o)!==e)E('Bukan giliranmu');g.b[i]=g.t;
 const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 if(L.some(l=>l.every(k=>g.b[k]===g.t))){g.w=g.t;g.s[e]=(g.s[e]||0)+1}else if(g.b.every(Boolean))g.w='d';else g.t=g.t==='x'?'o':'x';
 await W('tt:'+code,g);return s.json({ok:1})}
if(a==='letters')return s.json({l:((await J('ll:'+code))||[]).map(x=>x.k>Date.now()&&x.from!==e?{...x,t:''}:x)});
if(a==='letter'){const t=String(b.t||'').trim().slice(0,1200);if(!t)E('Surat masih kosong');const l=(await J('ll:'+code))||[];l.push({by:u.name,from:e,t,d:Date.now(),k:+b.k>Date.now()?+b.k:0});await W('ll:'+code,l.slice(-30));return s.json({ok:1})}
if(a==='bucket')return s.json({l:(await J('bl:'+code))||[]});
if(a==='bucketset'){const l=(Array.isArray(b.l)?b.l:[]).slice(0,40).map(x=>({t:String(x.t||'').slice(0,80),d:!!x.d})).filter(x=>x.t);await W('bl:'+code,l);return s.json({ok:1})}
if(a==='setmeet'){const d=String(b.v||'');if(d&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(d))E('Waktu tidak valid');if(d)await R('SET','meet:'+code,d);else await R('DEL','meet:'+code);return s.json({ok:1})}
if(a==='musicadd'||a==='musicplay'){const id=String(b.id||'');if(!/^[\w-]{11}$/.test(id))E('Link YouTube tidak valid');let pl=(await J('pl:'+code))||[];
 if(a==='musicadd'&&!pl.find(x=>x.id===id)){pl.push({id,t:String(b.title||'Lagu').slice(0,80),by:u.name});await W('pl:'+code,pl.slice(-30))}
 else if(!pl.find(x=>x.id===id))E('Lagu tidak ada di playlist');
 await W('now:'+code,{id,by:u.name,t:Date.now()});return s.json({ok:1})}
if(a==='setann'){const d=String(b.v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))E('Tanggal tidak valid');await R('SET','ann:'+code,d);return s.json({ok:1})}
if(a==='setmood'){await W('mood:'+e,{e:String(b.v||'').slice(0,8),t:Date.now()});return s.json({ok:1})}
if(a==='setbg'){
 const v=String(b.v||'');
 if(b.k==='none')await R('DEL','bg:'+code);
 else if(b.k==='color'&&/^#[0-9a-fA-F]{6}$/.test(v))await W('bg:'+code,{k:'color',v});
 else if(b.k==='img'&&v.startsWith('data:image/')&&v.length<=600000)await W('bg:'+code,{k:'img',v});
 else E('Background tidak valid atau terlalu besar');
 await R('SET','bgt:'+code,String(Date.now()));return s.json({ok:1});
}
if(a==='getbg')return s.json({bg:await J('bg:'+code)});
if(a==='state'){
 const since=Math.max(0,+b.since||0),total=await R('LLEN','msgs:'+code);
 const raw=total>since?await R('LRANGE','msgs:'+code,since,-1):[];
 const m=[];for(const x of r.m){const p=await J('user:'+x);m.push({...pub(p),loc:await J('loc:'+x),mood:await J('mood:'+x),tz:await R('GET','tz:'+x)})}
 let z=await J('qz:'+code);if(z&&z.g===null&&z.by!==e)z={...z,a:-1};
 return s.json({m,msgs:raw.map(x=>JSON.parse(x)),total,qz:z,qs:(await J('qs:'+code))||{},ttt:await J('tt:'+code),meet:await R('GET','meet:'+code),mus:{now:await J('now:'+code),pl:(await J('pl:'+code))||[]},ann:await R('GET','ann:'+code),bgt:+(await R('GET','bgt:'+code))||0});
}
E('Aksi tidak dikenal');
}catch(x){s.status(400).json({e:typeof x==='string'?x:'Server error: '+(x&&x.message)})}
};
