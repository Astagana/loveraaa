const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const DEF='https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const ls={g:k=>{try{return localStorage.getItem(k)}catch{return null}},s:(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}},d:k=>{try{localStorage.removeItem(k)}catch{}}};
let tok=ls.g('tok'),me,room,seen=0,tm,wid=null,last=0,reg=false,sig='',lm='',mypos,busy=false,again=false,sending=false,cur='auth',prev='home',wl=null,th={},bgt=-1,unread=0,fresh=true;
try{th=JSON.parse(ls.g('th')||'{}')}catch{}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(a,d={})=>{const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json',Authorization:tok||''},body:JSON.stringify({a,...d})});let j={};try{j=await r.json()}catch{}if(!r.ok)throw j.e||'Gagal terhubung ke server';return j};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2800)};
const show=id=>{if(id!==cur){prev=cur;cur=id}$$('.scr').forEach(s=>s.hidden=s.id!==id)};
const av=(u,h=260)=>`<model-viewer style="width:100%;height:${h}px" src="${esc(u.avatar||DEF)}" auto-rotate camera-controls disable-zoom interaction-prompt="none" camera-orbit="0deg 80deg 2.5m" shadow-intensity="1"></model-viewer>`;
const rs=(f,m=800,q=.7)=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,m/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',q))};i.src=URL.createObjectURL(f)});
const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
/* ---------- akun ---------- */
async function boot(){if(!tok)return show('auth');try{me=(await api('me')).u;home()}catch{ls.d('tok');tok=null;show('auth')}}
function home(){show('home');$('#hi').textContent='Halo, '+me.name+(me.gender==='wanita'?' 💗':' 💙');$('#cont').hidden=!me.room;$('#cont').textContent='Lanjut ke room '+me.room;if(ls.g('share')==='1')startLoc(true)}
const setReg=b=>{reg=b;$('#tL').classList.toggle('on',!b);$('#tR').classList.toggle('on',b);$('#name').hidden=$('#gen').hidden=!b;$('#go').textContent=b?'Daftar':'Masuk'};
$('#tL').onclick=()=>setReg(false);$('#tR').onclick=()=>setReg(true);
$('#go').onclick=async()=>{try{const d={email:$('#email').value,pw:$('#pw').value};if(reg){d.name=$('#name').value;d.gender=document.querySelector('[name=g]:checked').value}
const j=await api(reg?'register':'login',d);tok=j.token;ls.s('tok',tok);me=j.u;home()}catch(e){toast(e)}};
$('#out').onclick=()=>{stopLoc();clearInterval(tm);ls.d('tok');tok=null;show('auth')};
$$('.back').forEach(b=>b.onclick=()=>show(prev));
/* ---------- avatar (halaman sendiri) ---------- */
async function openAvatar(){show('avatar');$('#avme').innerHTML=av(me,280);$('#avn').textContent=me.name+' (kamu)';$('#avpt').innerHTML='';
if(me.room){try{const j=await api('state',{code:me.room,since:1e9}),p=j.m.find(x=>x.email!==me.email);if(p)$('#avpt').innerHTML=av(p,280)+`<p class="sub">${esc(p.name)}</p>`}catch{}}}
$('#goav').onclick=openAvatar;
$('#avs').onclick=async()=>{try{me=(await api('avatar',{url:$('#avurl').value.trim()})).u;openAvatar();toast('Avatar tersimpan')}catch(e){toast(e)}};
/* ---------- room ---------- */
$('#mk').onclick=async()=>{try{const j=await api('create');me.room=j.code;enter(j.code)}catch(e){toast(e)}};
$('#jn').onclick=async()=>{try{const c=$('#code').value.trim().toUpperCase();await api('join',{code:c});me.room=c;enter(c)}catch(e){toast(e)}};
$('#cont').onclick=()=>enter(me.room);
function enter(c){room=c;seen=0;sig='';lm='';bgt=-1;unread=0;fresh=true;applyChatBg(null);badge();$('#chat').innerHTML='';$('#rc').textContent=c;show('room');clearInterval(tm);poll();tm=setInterval(poll,3000)}
$('#lv').onclick=()=>{clearInterval(tm);home()};
$('#cp').onclick=()=>{navigator.clipboard.writeText(room).then(()=>toast('Kode disalin'))};
async function poll(){if(busy){again=true;return}busy=true;try{const j=await api('state',{code:room,since:seen});
const s=JSON.stringify(j.m.map(x=>[x.email,x.name]));
if(s!==sig){sig=s;$('#mem').innerHTML=j.m.map(x=>`<div class="mm"><b>${esc(x.name)}</b> ${x.gender==='wanita'?'💗':'💙'}${x.email===me.email?' (kamu)':''}</div>`).join('')+(j.m.length<2?'<div class="mm wait">Menunggu pasangan…<br>Bagikan kodenya</div>':'')}
const box=$('#chat'),b=box.scrollTop+box.clientHeight>=box.scrollHeight-80;
j.msgs.forEach(m=>{const d=document.createElement('div');d.className='msg'+(m.from===me.email?' me':'');
d.innerHTML=(m.type==='text'?esc(m.data):m.type==='img'?`<img src="${m.data}" alt="pap">`:`<video src="${m.data}" controls playsinline></video>`)+`<small>${new Date(m.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small>`;box.appendChild(d);if(!fresh&&m.from!==me.email&&cur!=='chatp')unread++});fresh=false;badge();
seen=j.total;if(j.msgs.length&&b)box.scrollTop=box.scrollHeight;
const p=j.m.find(x=>x.email!==me.email);$('#cname').textContent=p?p.name:'Menunggu pasangan';if(j.bgt!==bgt){bgt=j.bgt;if(bgt){const r=await api('getbg',{code:room});applyChatBg(r.bg)}else applyChatBg(null)}map(p&&p.loc,p&&p.name)}catch(e){toast(e)}finally{busy=false;if(again){again=false;poll()}}}
const send=async(type,data)=>{if(sending)return;sending=true;try{await api('send',{code:room,type,data});await poll()}catch(e){toast(e)}finally{sending=false}};
$('#cf').onsubmit=e=>{e.preventDefault();const v=$('#txt').value.trim();if(v&&!sending){$('#txt').value='';send('text',v)}};
$('#pap').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)send('img',await rs(f))};
$('#vid').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>700000)return toast('Video maks ~700KB (±5 detik, kualitas rendah)');send('video',await rd(f))};
/* ---------- lokasi ---------- */
function dist(a,b,c,d){const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))}
function map(l,n){const mb=$('#mapbox');if(!l){mb.innerHTML='<p class="sub">Pasangan belum membagikan lokasi.</p>';lm='';$('#dist').textContent='';return}
const k=l.lat+','+l.lng;if(k!==lm){lm=k;const e=.008;mb.innerHTML=`<iframe loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${l.lng-e},${l.lat-e},${l.lng+e},${l.lat+e}&layer=mapnik&marker=${l.lat},${l.lng}"></iframe>`}
const ago=Math.round((Date.now()-l.t)/60000);let t=esc(n)+' · diperbarui '+(ago<1?'baru saja':ago+' menit lalu');
if(mypos){const d=dist(mypos[0],mypos[1],l.lat,l.lng);t+=' · jarak '+(d<1?Math.round(d*1000)+' m':d.toFixed(1)+' km')}$('#dist').textContent=t}
const ui=()=>{$('#lt').textContent=wid!=null?'Berhenti bagikan lokasi':'Bagikan lokasi saya'};
const push=()=>mypos&&api('loc',{lat:mypos[0],lng:mypos[1]}).catch(()=>{});
const wake=async()=>{try{if('wakeLock' in navigator&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}}catch{}};
function startLoc(silent){if(wid!=null)return;if(!navigator.geolocation)return silent||toast('Browser tidak mendukung lokasi');
wid=navigator.geolocation.watchPosition(p=>{mypos=[p.coords.latitude,p.coords.longitude];if(Date.now()-last>8000){last=Date.now();push()}},()=>{wid=null;ls.d('share');ui();if(!silent)toast('Izin lokasi ditolak')},{enableHighAccuracy:true,maximumAge:5000});
ls.s('share','1');wake();ui()}
function stopLoc(){if(wid!=null){navigator.geolocation.clearWatch(wid);wid=null}ls.d('share');if(wl){wl.release();wl=null}if(tok)api('loc',{off:1}).catch(()=>{});ui()}
$('#lt').onclick=()=>wid!=null?stopLoc():startLoc();
function beacon(){if(mypos&&tok&&wid!=null)navigator.sendBeacon('/api',new Blob([JSON.stringify({a:'loc',lat:mypos[0],lng:mypos[1],tk:tok})],{type:'application/json'}))}
addEventListener('pagehide',beacon);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(wid!=null)wake();else if(tok&&ls.g('share')==='1')startLoc(true)}else beacon()});
/* ---------- tema ---------- */
const AC=['#ff5d8f','#ff7a45','#f5b301','#2ecc71','#1abc9c','#3498db','#7a4dff','#c04dff'],BG=['#1a0b1f','#0d1b2a','#10201a','#1f1410','#111111','#fff3f6','#eef6ff'];
const lum=h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*((n>>8&255))+.114*(n&255))/255};
function applyTheme(){const r=document.documentElement.style,im=ls.g('thimg'),d=(th.dim==null?40:th.dim)/100;
const set=(o)=>['--rose','--bg','--tx','--mut','--ln','--bub','--card'].forEach(k=>o[k]?r.setProperty(k,o[k]):r.removeProperty(k));
const o={'--rose':th.acc};
const DK={'--tx':'#fff3f6','--mut':'#d6b9cd','--ln':'#ffffff26','--bub':'#ffffff1f'},LT={'--tx':'#3a1530','--mut':'#8a5a78','--ln':'#00000022','--bub':'#0000000f'};
if(im)Object.assign(o,DK,{'--card':'#14081acc'});
else if(th.bg){o['--bg']=th.bg;const L=lum(th.bg)>.6;Object.assign(o,L?LT:DK,{'--card':'color-mix(in srgb,color-mix(in srgb,'+(L?'#fff':'#fff')+' '+(L?'55':'7')+'%,'+th.bg+') 88%,transparent)'})}
set(o);const bg=$('#bg');bg.style.backgroundImage=im?`linear-gradient(rgba(0,0,0,${d}),rgba(0,0,0,${d})),url(${im})`:'';bg.classList.toggle('ph',!!im);$('#dim').value=th.dim==null?40:th.dim}
const setTh=(k,v)=>{th[k]=v;ls.s('th',JSON.stringify(th));applyTheme()};
function sw(id,list,fn){const el=$(id);el.innerHTML=list.map(c=>`<button type="button" class="c" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')+'<label class="c pick">+<input type="color"></label>';
el.onclick=e=>{const b=e.target.closest('.c[data-c]');if(b)fn(b.dataset.c)};el.querySelector('input').oninput=e=>fn(e.target.value)}
const CB=['#1a0b1f','#2b1b4a','#0d2b3a','#123524','#4a1b2b','#3a2a12','#111111','#ffe3ec'];
sw('#sw1',AC,v=>setTh('acc',v));sw('#sw2',BG,v=>setTh('bg',v));sw('#csw',CB,v=>setChatBg('color',v));
$('#bgf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const d=await rs(f,1280,.7);if(!ls.s('thimg',d))toast('Foto terlalu besar, pilih foto lain');applyTheme()};
$('#bgx').onclick=()=>{ls.d('thimg');applyTheme()};
$('#dim').oninput=e=>setTh('dim',+e.target.value);
$('#rst').onclick=()=>{th={};ls.d('th');ls.d('thimg');applyTheme()};
/* ---------- halaman chat & background chat bersama ---------- */
const badge=()=>{$('#oc').textContent='💬 Buka chat'+(unread?` (${unread})`:'')};
function openChat(){unread=0;badge();show('chatp');const b=$('#chat');b.scrollTop=b.scrollHeight}
$('#oc').onclick=openChat;$('#cb').onclick=()=>show('room');
function applyChatBg(b){const c=$('#chat');if(!b){c.style.background='';c.classList.remove('hasbg');return}c.classList.add('hasbg');c.style.background=b.k==='img'?`linear-gradient(#0003,#0003),url("${b.v}") center/cover`:b.v}
async function setChatBg(k,v){try{await api('setbg',{code:room,k,v});bgt=-1;await poll();toast(k==='none'?'Background chat dikembalikan':'Background chat diubah untuk kalian berdua')}catch(e){toast(e)}}
$('#cbt').onclick=()=>{$('#cbp').hidden=!$('#cbp').hidden};
$('#cbf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const d=await rs(f,900,.6);if(d.length>580000)return toast('Foto terlalu besar, pilih foto lain');setChatBg('img',d)};
$('#cbx').onclick=()=>setChatBg('none','');
/* ---------- sidebar ---------- */
const sb=o=>document.body.classList.toggle('so',o);
$$('.mn').forEach(b=>b.onclick=()=>sb(true));$('#ov').onclick=$('#sbx').onclick=()=>sb(false);
$$('.nv').forEach(b=>b.onclick=()=>{sb(false);if(b.dataset.go==='home'){clearInterval(tm);home()}else openAvatar()});
$('#goth').onclick=()=>sb(true);
addEventListener('keydown',e=>{if(e.key==='Escape')sb(false)});
applyTheme();boot();
