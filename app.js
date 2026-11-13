const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const DEF='https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const ls={g:k=>{try{return localStorage.getItem(k)}catch{return null}},s:(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}},d:k=>{try{localStorage.removeItem(k)}catch{}}};
let tok=ls.g('tok'),me,room,seen=0,tm,wid=null,last=0,reg=false,sig='',lm='',mypos,busy=false,again=false,sending=false,cur='auth',prev='home',wl=null,th={},bgt=-1,unread=0,fresh=true;
try{th=JSON.parse(ls.g('th')||'{}')}catch{}
const ic=(n,c='')=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(a,d={})=>{const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json',Authorization:tok||''},body:JSON.stringify({a,...d})});let j={};try{j=await r.json()}catch{}if(!r.ok)throw j.e||'Gagal terhubung ke server';return j};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),4200)};
const show=id=>{if(id!==cur){prev=cur;cur=id}$$('.scr').forEach(s=>s.hidden=s.id!==id);$('#bar').hidden=id==='land'||id==='auth'};
const av=(u,h=260)=>`<model-viewer style="width:100%;height:${h}px" src="${esc(u.avatar?'/api/glb?u='+encodeURIComponent(u.avatar):DEF)}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${DEF}';toast('Avatar gagal dimuat. Coba link .glb lain (maks 4 MB)')}" auto-rotate camera-controls disable-zoom interaction-prompt="none" camera-orbit="0deg 80deg 2.5m" shadow-intensity="1"></model-viewer>`;
const rs=(f,m=800,q=.7)=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,m/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',q))};i.src=URL.createObjectURL(f)});
const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
/* ---------- akun ---------- */
async function boot(){if(!tok)return show('land');try{me=(await api('me')).u;home()}catch{ls.d('tok');tok=null;show('land')}}
function home(){show('home');$('#hi').textContent='Halo, '+me.name+'';$('#cont').hidden=!me.room;$('#cont').textContent='Lanjut ke room '+me.room;if(ls.g('share')==='1')startLoc(true);pushInit();renderBadges()}
const setReg=b=>{reg=b;$('#tL').classList.toggle('on',!b);$('#tR').classList.toggle('on',b);$('#name').hidden=$('#gen').hidden=!b;$('#go').textContent=b?'Daftar':'Masuk'};
$('#tL').onclick=()=>setReg(false);$('#tR').onclick=()=>setReg(true);
$('#go').onclick=async()=>{try{const d={email:$('#email').value,pw:$('#pw').value};if(reg){d.name=$('#name').value;d.gender=document.querySelector('[name=g]:checked').value}
const j=await api(reg?'register':'login',d);tok=j.token;ls.s('tok',tok);me=j.u;home()}catch(e){toast(e)}};
$('#out').onclick=()=>{if(ftok)api('fcmoff',{token:ftok}).catch(()=>{});ubp=null;ub={r:0,d:{},nm:{}};stopLoc();clearInterval(tm);ls.d('tok');tok=null;show('land')};
$$('.back').forEach(b=>b.onclick=()=>show(prev));
/* ---------- avatar (halaman sendiri) ---------- */
async function openAvatar(){show('avatar');loadTpl();$('#avme').innerHTML=av(me,280);$('#avn').textContent=me.name+' (kamu)';$('#avpt').innerHTML='';
if(me.room){try{const j=await api('state',{code:me.room,since:1e9}),p=j.m.find(x=>x.email!==me.email);if(p)$('#avpt').innerHTML=av(p,280)+`<p class="sub">${esc(p.name)}</p>`}catch{}}}
$('#goav').onclick=openAvatar;
$('#avs').onclick=async()=>{try{me=(await api('avatar',{url:$('#avurl').value.trim()})).u;openAvatar();toast('Avatar tersimpan')}catch(e){toast(e)}};
/* ---------- room ---------- */
$('#mk').onclick=async()=>{try{const j=await api('create');me.room=j.code;enter(j.code)}catch(e){toast(e)}};
$('#jn').onclick=async()=>{try{const c=$('#code').value.trim().toUpperCase();await api('join',{code:c});me.room=c;enter(c)}catch(e){toast(e)}};
$('#cont').onclick=()=>enter(me.room);
function enter(c){room=c;seen=0;sig='';lm='';bgt=-1;unread=0;fresh=true;applyChatBg(null);badge();nowId='';$('#mp').innerHTML='';api('settz',{code:c,v:Intl.DateTimeFormat().resolvedOptions().timeZone}).catch(()=>{});$('#chat').innerHTML='';$('#rc').textContent=c;show('room');clearInterval(tm);poll();tm=setInterval(poll,3000)}
$('#lv').onclick=()=>{clearInterval(tm);home()};
$('#cp').onclick=()=>{navigator.clipboard.writeText(room).then(()=>toast('Kode disalin'))};
async function poll(){if(busy){again=true;return}busy=true;try{const j=await api('state',{code:room,since:seen,d:ld(new Date())});
const s=JSON.stringify(j.m.map(x=>[x.email,x.name]));
if(s!==sig){sig=s;$('#mem').innerHTML=j.m.map(x=>`<div class="mm"><b>${esc(x.name)}</b> ${(x.gender==='wanita'?'· Wanita':'· Pria')}${x.email===me.email?' (kamu)':''}</div>`).join('')+(j.m.length<2?'<div class="mm wait">Menunggu pasangan…<br>Bagikan kodenya</div>':'')}
widgets(j);streakW(j);rinduW(j);music(j.mus);st=j;if(cur==='quiz'){const k=JSON.stringify([j.qz,j.qs]);if(k!==qsig){qsig=k;drawQuiz()}}if(cur==='ttt')drawT();const box=$('#chat'),b=box.scrollTop+box.clientHeight>=box.scrollHeight-80;
j.msgs.forEach(m=>{const d=document.createElement('div');d.className='msg'+(m.from===me.email?' me':'');
d.innerHTML=(m.type==='text'?(m.data[0]==='§'?`<span class="bigE">${ic('heart','f')} ${esc(m.data.slice(1))}</span>`:esc(m.data)):m.type==='img'?`<img src="${esc(m.data)}" alt="pap">`:m.type==='audio'?`<audio src="${esc(m.data)}" controls></audio>`:`<video src="${esc(m.data)}" controls playsinline></video>`)+`<small>${new Date(m.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small>`;if(m.data[0]==='§'&&m.type==='text')d.classList.add('rxm');box.appendChild(d);if(!fresh&&m.type==='text'&&m.data[0]==='§'&&m.from!==me.email)burst();if(!fresh&&m.from!==me.email&&cur!=='chatp')unread++;if(!fresh&&m.from!==me.email)ping(m)});fresh=false;badge();
seen=j.total;if(j.msgs.length&&b)box.scrollTop=box.scrollHeight;
const p=j.m.find(x=>x.email!==me.email);$('#cname').innerHTML=p?esc(p.name)+`<small class="pst">${p.ty?'mengetik…':Date.now()-p.ps<20000?'online':''}</small>`:'Menunggu pasangan';if(j.bgt!==bgt){bgt=j.bgt;if(bgt){const r=await api('getbg',{code:room});applyChatBg(r.bg)}else applyChatBg(null)}map(p&&p.loc,p&&p.name)}catch(e){toast(e)}finally{busy=false;if(again){again=false;poll()}}}
const send=async(type,data)=>{if(sending)return;sending=true;try{await api('send',{code:room,type,data,hr:new Date().getHours(),d:ld(new Date())});await poll()}catch(e){toast(e)}finally{sending=false}};
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
const badge=()=>{$('#oc').innerHTML='Buka chat'+bdg(ub.r)};
function openChat(){ub.r=0;api('clr',{k:'r'}).catch(()=>{});badge();show('chatp');const b=$('#chat');b.scrollTop=b.scrollHeight}
$('#oc').onclick=openChat;$('#cb').onclick=()=>show('room');
function applyChatBg(b){const c=$('#chat');if(!b){c.style.background='';c.classList.remove('hasbg');return}c.classList.add('hasbg');c.style.background=b.k==='img'?`linear-gradient(#0003,#0003),url("${b.v}") center/cover`:b.v}
async function setChatBg(k,v){try{await api('setbg',{code:room,k,v});bgt=-1;await poll();toast(k==='none'?'Background chat dikembalikan':'Background chat diubah untuk kalian berdua')}catch(e){toast(e)}}
$('#cbt').onclick=()=>{$('#cbp').hidden=!$('#cbp').hidden};
$('#cbf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;const d=await rs(f,900,.6);if(d.length>580000)return toast('Foto terlalu besar, pilih foto lain');setChatBg('img',d)};
$('#cbx').onclick=()=>setChatBg('none','');
/* ---------- sidebar ---------- */
const sb=o=>document.body.classList.toggle('so',o);
$$('.mn').forEach(b=>b.onclick=()=>sb(true));$('#ov').onclick=$('#sbx').onclick=()=>sb(false);
$$('.nv').forEach(b=>b.onclick=()=>{sb(false);const g=b.dataset.go;if(g==='home'){clearInterval(tm);home()}else if(g==='avatar')openAvatar();else if(g==='friends')openFriends();else{show('games');tod()}});$('#bm').onclick=()=>sb(true);
$('#goth').onclick=()=>sb(true);
addEventListener('keydown',e=>{if(e.key==='Escape')sb(false)});
/* ---------- ritual pasangan ---------- */
const MOODS=['Bahagia','Rindu','Santai','Capek','Sedih','Kesal','Sakit','Manja'],RX=['Cium jauh','Peluk','Kangen','Bunga','Manja'];
const QS=['Momen kecil apa yang membuatmu jatuh hati padaku?','Kapan terakhir kali kamu merasa paling dicintai?','Satu hal yang ingin kamu lakukan bersamaku sebelum tahun ini habis?','Lagu apa yang mengingatkanmu padaku, dan kenapa?','Apa ketakutan terbesarmu dalam hubungan kita?','Bagaimana kamu membayangkan hari Minggu kita lima tahun lagi?','Hal sederhana apa yang bikin harimu langsung membaik?','Apa yang paling kamu rindukan dariku hari ini?','Kenangan pertama kita yang paling kamu ingat?','Kebiasaanku yang diam-diam kamu suka?','Ke mana kita pergi kalau besok bebas ke mana saja?','Apa yang ingin kamu ucapkan tapi belum sempat?','Satu mimpi yang ingin kita capai bersama?','Apa arti rumah bagimu, dan apa aku bagian dari itu?'];
const IDEAS=['Nonton film yang sama lewat video call','Masak menu yang sama lalu makan bersama lewat video','Kirim surat tulisan tangan, foto lalu pap','Main game berdua sampai salah satu menyerah','Jalan sore sambil telepon','Buat playlist bersama','Piknik di ruang tamu','Ceritakan masa kecil, gantian satu jam','Belajar satu kata bahasa baru lalu saling tes','Tulis 3 hal yang kamu syukuri dari dia','Stargazing sambil video call','Foto bareng dengan pose yang sama dari dua kota'];
const hs=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
function burst(){for(let i=0;i<22;i++){const s=document.createElement('span');s.className='fh';s.innerHTML=ic(['heart','heart','star','heart'][i%4],'f');s.style.cssText=`left:${Math.random()*100}vw;animation-delay:${Math.random()*.6}s;font-size:${16+Math.random()*22}px`;document.body.appendChild(s);setTimeout(()=>s.remove(),2800)}}
function widgets(j){
if(j.ann){const n=Math.max(0,Math.floor((Date.now()-new Date(j.ann+'T00:00:00'))/864e5)),nx=[100,200,365,500,730,1000,1095,1460,1825,3650].find(x=>x>n);$('#ann').textContent=n.toLocaleString('id-ID')+' hari';$('#annsub').textContent=nx?`${nx-n} hari lagi menuju hari ke-${nx}`:'Setiap hari adalah perayaan';$('#annd').value=j.ann}else{$('#ann').textContent='—';$('#annsub').textContent='Atur tanggal jadian kalian'}
$('#moods').innerHTML=j.m.map(x=>`<div class="mo"><span>${x.mood&&new Date(x.mood.t).toDateString()===new Date().toDateString()?esc(x.mood.e):'·'}</span><small>${esc(x.name)}</small></div>`).join('');
tzs=j.m.map(x=>({n:x.name,z:x.tz}));meetAt=j.meet||'';if(j.meet)$('#meetd').value=j.meet;tickMeet();
$('#dq').textContent=QS[hs(room+new Date().toDateString())%QS.length]}
$('#mpick').innerHTML=MOODS.map(e=>`<button type="button" class="e">${e}</button>`).join('');
$('#mpick').onclick=async e=>{const b=e.target.closest('.e');if(!b)return;try{await api('setmood',{code:room,v:b.textContent});poll()}catch(x){toast(x)}};
$('#rx').innerHTML=RX.map(e=>`<button type="button" class="e">${e}</button>`).join('');
$('#rx').onclick=e=>{const b=e.target.closest('.e');if(b){send('text','§'+b.textContent);burst()}};
$('#annd').onchange=async e=>{try{await api('setann',{code:room,v:e.target.value});await poll();toast('Tanggal disimpan')}catch(x){toast(x)}};
$('#dbt').onclick=()=>{let i=0;const t=setInterval(()=>{$('#di').textContent=IDEAS[Math.random()*IDEAS.length|0];if(++i>12){clearInterval(t);burst()}},70)};
$('#ln').onclick=$('#ls').onclick=()=>show('auth');
/* ---------- template avatar ---------- */
let tplD;async function loadTpl(){if(!tplD){try{const t=await(await fetch('avatars.txt',{cache:'no-store'})).text();tplD=t.split('\n').map(l=>l.trim()).filter(l=>l&&l[0]!=='#').map((l,i)=>{const p=l.split('|').map(x=>x.trim());return p.length>1?{n:p[0],u:p[1]}:{n:'Avatar '+(i+1),u:p[0]}}).filter(x=>/^https:\/\/\S+\.glb(\?\S*)?$/.test(x.u))}catch{tplD=[]}}
$('#tpl').innerHTML=tplD.map(x=>`<button type="button" class="tp" data-u="${esc(x.u)}"><model-viewer src="/api/glb?u=${encodeURIComponent(x.u)}" camera-orbit="0deg 80deg 2.6m" loading="lazy" disable-zoom></model-viewer><span>${esc(x.n)}</span></button>`).join('')||'<p class="sub">Belum ada template. Isi file avatars.txt.</p>'}
$('#tpl').onclick=async e=>{const b=e.target.closest('.tp');if(!b)return;try{me=(await api('avatar',{url:b.dataset.u})).u;openAvatar();toast('Avatar dipilih')}catch(x){toast(x)}};
/* ---------- teman ---------- */
async function openFriends(){show('friends');try{const j=await api('fls');$('#fl').innerHTML=(j.i.length?'<p class="sub l">Permintaan masuk</p>'+j.i.map(x=>`<div class="fr"><b>${esc(x.name)}</b><span><button class="btn s" data-a="1" data-e="${esc(x.email)}">Terima</button> <button class="ghost" data-a="0" data-e="${esc(x.email)}">Tolak</button></span></div>`).join(''):'')+'<p class="sub l">Teman</p>'+(j.l.map(x=>`<div class="fr"><b>${esc(x.name)}</b><span><button class="btn s" data-dm="${esc(x.email)}" data-n="${esc(x.name)}">Chat${bdg(ub.d[x.email]||0)}</button></span></div>`).join('')||'<p class="sub">Belum ada teman. Tambahkan lewat email akunnya.</p>')}catch(e){toast(e)}}
$('#fl').onclick=async e=>{const d=e.target.closest('[data-dm]');if(d)return openDM(d.dataset.dm,d.dataset.n);const b=e.target.closest('[data-a]');if(!b)return;try{await api('fres',{email:b.dataset.e,ok:b.dataset.a==='1'});openFriends()}catch(x){toast(x)}};
$('#fad').onclick=async()=>{try{await api('fadd',{email:$('#fem').value});$('#fem').value='';toast('Permintaan terkirim');openFriends()}catch(e){toast(e)}};
/* ---------- musik bersama ---------- */
let nowId='';const ytid=s=>{const m=String(s).match(/(?:youtu\.be\/|v=|shorts\/|live\/|embed\/)([\w-]{11})/);return m&&m[1]};
function music(m){if(!m)return;const n=m.now;if(n&&n.id!==nowId){nowId=n.id;$('#mp').innerHTML=`<iframe src="https://www.youtube.com/embed/${n.id}?playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><p class="sub">Diputar oleh ${esc(n.by)} · <a href="https://www.youtube.com/watch?v=${n.id}" target="_blank" rel="noopener">Buka di YouTube</a> jika video tidak mau diputar</p>`}
$('#mpl').innerHTML=m.pl.map(x=>`<button class="li" data-id="${x.id}">${ic('play')} ${esc(x.t)} <small>· ${esc(x.by)}</small></button>`).join('')||'<p class="sub">Belum ada lagu. Tempel link YouTube di atas.</p>'}
$('#mya').onclick=async()=>{const id=ytid($('#myt').value);if(!id)return toast('Link YouTube tidak valid');let title='Lagu';try{const r=await fetch('https://noembed.com/embed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+id));title=(await r.json()).title||title}catch{}try{await api('musicadd',{code:room,id,title});$('#myt').value='';poll()}catch(e){toast(e)}};
$('#mpl').onclick=async e=>{const b=e.target.closest('.li');if(b){try{await api('musicplay',{code:room,id:b.dataset.id});poll()}catch(x){toast(x)}}};
/* ---------- game ---------- */
const TRUTH=['Hal paling memalukan yang pernah kamu lakukan di depanku?','Kapan kamu pertama sadar mulai suka padaku?','Rahasia kecil yang belum pernah kamu ceritakan?','Apa yang paling bikin kamu cemburu?','Momen kita yang paling ingin kamu ulang?','Hal apa dariku yang diam-diam bikin kamu kesal?'],DARE=['Kirim voice note menyanyikan lagu favoritmu','Kirim pap wajah paling lucu sekarang','Tulis puisi 4 baris untukku','Ceritakan hal manis tentangku selama 1 menit','Kirim foto benda yang mengingatkanmu padaku','Tiru suaraku lewat voice note'];
function tod(){$('#gv').innerHTML='<div class="row two" style="margin-top:12px"><button class="btn" data-k="0">Jujur</button><button class="btn alt" data-k="1">Tantangan</button></div><p id="tc" class="dq" style="margin-top:14px">Pilih salah satu, lalu jawab bergantian.</p>';$('#gv').firstChild.onclick=e=>{const b=e.target.closest('[data-k]');if(b){const L=b.dataset.k==='0'?TRUTH:DARE;$('#tc').textContent=L[Math.random()*L.length|0]}}}
function memory(){const E=['heart','star','moon','music','gift','sun','bolt','key'],d=[...E,...E].sort(()=>Math.random()-.5);let a=null,lock=false,mv=0,ok=0;const gv=$('#gv');
gv.innerHTML=`<p class="sub" style="margin-top:10px">Langkah: <b id="mvc">0</b> · Terbaik: ${ls.g('memb')||'-'}</p><div class="mg">${d.map(e=>`<button class="mc" data-v="${e}"><span>${ic(e)}</span></button>`).join('')}</div>`;
gv.querySelector('.mg').onclick=ev=>{const b=ev.target.closest('.mc');if(!b||lock||b.classList.contains('on'))return;b.classList.add('on');if(!a){a=b;return}mv++;$('#mvc').textContent=mv;
if(a.dataset.v===b.dataset.v){a=null;if(++ok===8){if(mv<(+ls.g('memb')||99))ls.s('memb',mv);burst();toast('Selesai dalam '+mv+' langkah!')}}else{lock=true;const x=a;a=null;setTimeout(()=>{x.classList.remove('on');b.classList.remove('on');lock=false},700)}}}
$('#g1').onclick=tod;$('#g2').onclick=memory;
/* ---------- ketemu, surat, bucket list, game baru ---------- */
let meetAt='';const tickMeet=()=>{const el=$('#meet');if(!el)return;if(!meetAt){el.textContent='—';return}const d=new Date(meetAt)-Date.now();if(d<=0){el.textContent='Hari ini!';return}el.textContent=`${Math.floor(d/864e5)} hari ${Math.floor(d%864e5/36e5)}j ${Math.floor(d%36e5/6e4)}m ${Math.floor(d%6e4/1e3)}d`};setInterval(tickMeet,1000);
$('#meetd').onchange=async e=>{try{await api('setmeet',{code:room,v:e.target.value});poll();toast('Hitung mundur disimpan')}catch(x){toast(x)}};
async function openLetters(){show('letters');try{const j=await api('letters',{code:room});$('#lli').innerHTML=j.l.slice().reverse().map(x=>`<div class="env" data-p="${x.from!==me.email?1:0}">${ic('mail')} <b>${x.from===me.email?'Untuk dia':'Dari '+esc(x.by)}</b> <small>· ${new Date(x.d).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</small><div class="lb" hidden>${x.t?esc(x.t).replace(/\n/g,'<br>'):ic('lock')+' Terkunci sampai '+new Date(x.k).toLocaleString('id-ID')}</div></div>`).join('')||'<p class="sub">Belum ada surat. Tulis yang pertama.</p>'}catch(e){toast(e)}}
$('#lli').onclick=e=>{const b=e.target.closest('.env');if(!b)return;const l=b.querySelector('.lb');l.hidden=!l.hidden;b.classList.toggle('open',!l.hidden);if(!l.hidden&&b.dataset.p==='1')burst()};
$('#lsd').onclick=async()=>{try{await api('letter',{code:room,t:$('#ltx').value,k:$('#lku').value?+new Date($('#lku').value):0});$('#ltx').value='';toast('Surat terkirim');openLetters()}catch(e){toast(e)}};
let bl=[];const drawB=()=>{$('#bli').innerHTML=bl.map((x,i)=>`<div class="fr"><label><input type="checkbox" data-i="${i}" ${x.d?'checked':''}> <span class="${x.d?'dn':''}">${esc(x.t)}</span></label><button class="ghost" data-x="${i}" aria-label="Hapus"></button></div>`).join('')||'<p class="sub">Tulis impian pertama kalian.</p>'};
async function openBucket(){show('bucket');try{bl=(await api('bucket',{code:room})).l;drawB()}catch(e){toast(e)}}
const saveB=async()=>{try{await api('bucketset',{code:room,l:bl});drawB()}catch(e){toast(e)}};
$('#ba').onclick=()=>{const t=$('#bi').value.trim();if(!t)return;bl.push({t,d:false});$('#bi').value='';saveB()};
$('#bli').onclick=e=>{const c=e.target.closest('[data-i]'),x=e.target.closest('[data-x]');if(c){bl[+c.dataset.i].d=c.checked;if(c.checked)burst();saveB()}else if(x){bl.splice(+x.dataset.x,1);saveB()}};
$('#gl').onclick=openLetters;$('#gb').onclick=openBucket;
async function meter(){let n=me.name,p='Dia';try{const j=await api('state',{code:room||me.room,since:1e9}),o=j.m.find(x=>x.email!==me.email);if(o)p=o.name}catch{}
const pc=70+hs([n,p].map(s=>s.toLowerCase()).sort().join('&'))%31;$('#gv').innerHTML=`<p class="sub" style="margin-top:12px">${esc(n)} ${ic('heart','f')} ${esc(p)}</p><div class="bign" id="mt">0%</div><div class="bar"><i id="mb"></i></div><p id="mq" class="dq"></p>`;let v=0;
const t=setInterval(()=>{v+=2;const x=Math.min(v,pc);$('#mt').textContent=x+'%';$('#mb').style.width=x+'%';if(v>=pc){clearInterval(t);$('#mq').textContent=pc>92?'Takdir sudah menulis nama kalian berdua.':pc>82?'Cocok sekali. Jaga kebiasaan kecil yang manis.':'Masih banyak hal indah untuk ditemukan bersama.';burst()}},30)}
function catchH(){const gv=$('#gv');let sc=0,t=20;gv.innerHTML=`<p class="sub" style="margin-top:10px">Skor <b id="cs">0</b> · Sisa <b id="ct">20</b>d · Terbaik ${ls.g('chb')||0}</p><div id="ca" class="ca"></div>`;const ca=$('#ca');
const sp=setInterval(()=>{if(!document.body.contains(ca))return clearInterval(sp);const h=document.createElement('button');h.className='ch';h.innerHTML=ic('heart','f');h.style.left=Math.random()*85+'%';h.style.animationDuration=(1.6+Math.random()*1.2)+'s';h.onclick=()=>{sc++;$('#cs').textContent=sc;h.remove()};h.onanimationend=()=>h.remove();ca.appendChild(h)},420);
const cd=setInterval(()=>{if(!document.body.contains(ca))return clearInterval(cd);$('#ct').textContent=--t;if(t<=0){clearInterval(sp);clearInterval(cd);ca.innerHTML='<p class="dq" style="padding:20px">Selesai! Skor '+sc+'</p>';if(sc>(+ls.g('chb')||0))ls.s('chb',sc);burst()}},1000)}
$('#g3').onclick=meter;$('#g4').onclick=catchH;
/* ---------- jam, kuis, tic-tac-toe, corat-coret ---------- */
let st=null,qsig='',tzs=[];
const tickClk=()=>{const el=$('#clk');if(!el||!tzs.length)return;el.innerHTML=tzs.map(x=>{let t='—',e='';try{const o={hour:'2-digit',minute:'2-digit',hour12:false};if(x.z)o.timeZone=x.z;t=new Date().toLocaleTimeString('id-ID',o).replace('.',':');const h=+t.slice(0,2);e=ic(h>=6&&h<18?'sun':'moon')}catch{}return`<div class="mo"><span>${e}</span><b>${t}</b><small>${esc(x.n)}</small></div>`}).join('')};setInterval(tickClk,1000);
const QP=['Makanan favoritku?','Tempat liburan impianku?','Warna favoritku?','Hal yang paling kutakuti?','Lagu yang sedang kusuka?','Hobi yang paling kunikmati?'];
function drawQuiz(){const z=st&&st.qz,sc=(st&&st.qs)||{},p=st?st.m.find(x=>x.email!==me.email):null,pn=p?esc(p.name):'pasangan';
let h=`<p class="sub">Skor · kamu ${sc[me.email]||0} — ${pn} ${p?sc[p.email]||0:0}</p>`;
if(!z||z.g!==null){if(z)h+=`<div class="w"><div class="k">${esc(z.q)}</div><p class="dq">${z.by===me.email?'Kamu':esc(z.name)} menjawab <b>${esc(z.o[z.a])}</b>. Tebakan: ${esc(z.o[z.g])} ${z.g===z.a?' Benar!':' Belum tepat'}</p></div>`;
h+=`<div class="w"><div class="k">Buat pertanyaan tentang dirimu</div><select id="qq">${QP.map(q=>`<option>${q}</option>`).join('')}</select><input id="qo" placeholder="Pilihan dipisah koma (2-4), mis. Nasi goreng, Sate, Bakso"><input id="qa" placeholder="Jawaban benarmu (sama dengan salah satu pilihan)"><button id="qs" class="btn">Kirim kuis</button></div>`}
else if(z.by===me.email)h+=`<div class="w"><div class="k">${esc(z.q)}</div><p class="dq">Menunggu ${pn} menebak…</p></div>`;
else h+=`<div class="w"><div class="k">${esc(z.name)} bertanya: ${esc(z.q)}</div><div class="list">${z.o.map((o,i)=>`<button class="li" data-g="${i}">${esc(o)}</button>`).join('')}</div></div>`;
$('#qb').innerHTML=h}
$('#qb').onclick=async e=>{try{const g=e.target.closest('[data-g]');if(g){await api('guess',{code:room,g:+g.dataset.g});await poll()}else if(e.target.id==='qs'){const o=$('#qo').value.split(',').map(x=>x.trim()).filter(Boolean),a=o.findIndex(x=>x.toLowerCase()===$('#qa').value.trim().toLowerCase());if(a<0)return toast('Jawaban benar harus sama dengan salah satu pilihan');await api('quiz',{code:room,q:$('#qq').value,o,a});await poll();toast('Kuis terkirim')}}catch(x){toast(x)}};
$('#gq').onclick=()=>{show('quiz');qsig='';drawQuiz()};
function drawT(){const g=st&&st.ttt,p=st?st.m.find(x=>x.email!==me.email):null;let h='';
if(!g)h='<p class="sub">Main berdua secara bergantian, hasilnya terlihat langsung oleh pasangan.</p><button id="tn" class="btn">Mulai game</button>';
else{const mine=g.x===me.email?'x':'o',turn=g.t===mine,sc=g.s||{};h=`<p class="sub">Kamu ${mine==='x'?'(X)':'(O)'} · Skor ${sc[me.email]||0} – ${p?sc[p.email]||0:0}</p><div class="mg tt">${g.b.map((c,i)=>`<button class="mc on" data-i="${i}"><span>${c==='x'?ic('close','tx'):c==='o'?ic('ring','to'):''}</span></button>`).join('')}</div><p class="dq">${g.w?(g.w==='d'?'Seri':g.w===mine?'Kamu menang!':'Dia menang'):turn?'Giliranmu':'Giliran dia…'}</p>${g.w?'<button id="tn" class="btn">Main lagi</button>':''}`}
$('#tb').innerHTML=h}
$('#tb').onclick=async e=>{try{const c=e.target.closest('[data-i]');if(e.target.id==='tn'){await api('tttnew',{code:room});await poll()}else if(c){await api('tttmove',{code:room,i:+c.dataset.i});await poll()}}catch(x){toast(x)}};
$('#gt').onclick=()=>{show('ttt');drawT()};
function doodle(){if(!room)return toast('Masuk ke room dulu');$('#gv').innerHTML='<canvas id="dc" width="600" height="600" class="dcv"></canvas><div class="row two" style="margin-top:8px"><input id="dcol" type="color" value="#e0b46c"><button id="dcl" class="ghost">Bersihkan</button><button id="dsd" class="btn s">Kirim ke chat</button></div>';
const c=$('#dc'),x=c.getContext('2d');const wipe=()=>{x.fillStyle='#fff8f0';x.fillRect(0,0,600,600)};wipe();x.lineWidth=6;x.lineCap='round';let dn=false;
const pt=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*600/r.width,(e.clientY-r.top)*600/r.height]};
c.onpointerdown=e=>{dn=true;const[a,b]=pt(e);x.strokeStyle=$('#dcol').value;x.beginPath();x.moveTo(a,b);c.setPointerCapture(e.pointerId)};c.onpointermove=e=>{if(!dn)return;const[a,b]=pt(e);x.lineTo(a,b);x.stroke()};c.onpointerup=()=>{dn=false};
$('#dcl').onclick=wipe;$('#dsd').onclick=()=>{send('img',c.toDataURL('image/jpeg',.6));toast('Terkirim ke chat')}}
$('#g5').onclick=doodle;
/* ---------- chat teman, suara, streak ---------- */
const mhtml=m=>(m.type==='text'?esc(m.data):m.type==='img'?`<img src="${esc(m.data)}" alt="">`:m.type==='audio'?`<audio src="${esc(m.data)}" controls></audio>`:`<video src="${esc(m.data)}" controls playsinline></video>`)+`<small>${new Date(m.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small>`;
let dmTo='',dmSeen=0,dmTm,dmBusy=false;
function openDM(t,n){dmTo=t;dmSeen=0;delete ub.d[t];api('clr',{k:'d',email:t}).catch(()=>{});$('#dmn').textContent=n;$('#dmc').innerHTML='';show('dm');clearInterval(dmTm);dmPoll();dmTm=setInterval(dmPoll,3000)}
async function dmPoll(){if(cur!=='dm'){clearInterval(dmTm);return}if(dmBusy)return;dmBusy=true;try{const j=await api('dmget',{email:dmTo,since:dmSeen}),box=$('#dmc');j.msgs.forEach(m=>{const d=document.createElement('div');d.className='msg'+(m.from===me.email?' me':'');d.innerHTML=mhtml(m);box.appendChild(d)});dmSeen=j.total;if(j.msgs.length)box.scrollTop=box.scrollHeight}catch(e){toast(e)}finally{dmBusy=false}}
const dmSend=async(type,data)=>{try{await api('dmsend',{email:dmTo,type,data});dmPoll()}catch(e){toast(e)}};
$('#dmf').onsubmit=e=>{e.preventDefault();const v=$('#dmt').value.trim();if(v){$('#dmt').value='';dmSend('text',v)}};
$('#dmp').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)dmSend('img',await rs(f))};
let rec=null;
async function voice(btn,done){if(rec){rec.stop();return}try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),r=new MediaRecorder(st,{audioBitsPerSecond:24000}),ch=[],t0=Date.now();rec=r;btn.classList.add('rec');toast('Merekam… ketuk lagi untuk kirim');
r.ondataavailable=e=>ch.push(e.data);r.onstop=async()=>{st.getTracks().forEach(x=>x.stop());rec=null;btn.classList.remove('rec');if(Date.now()-t0<700)return toast('Terlalu pendek');const bl=new Blob(ch,{type:r.mimeType||'audio/webm'});if(bl.size>650000)return toast('Voice terlalu panjang');done(await rd(bl))};r.start();setTimeout(()=>r.state==='recording'&&r.stop(),60000)}catch{toast('Izin mikrofon ditolak')}}
$('#mic').onclick=()=>voice($('#mic'),d=>send('audio',d));$('#dmr').onclick=()=>voice($('#dmr'),d=>dmSend('audio',d));
const ld=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function streakW(j){const c=j.ci||{d:{},n:0,l:''},td=ld(new Date()),yd=ld(new Date(Date.now()-864e5)),alive=c.l===td||c.l===yd,mine=c.d[me.email]===td,p=j.m.find(x=>x.email!==me.email),theirs=p&&c.d[p.email]===td;
$('#stk').textContent=(alive?c.n:0)+' hari';$('#stks').textContent=mine&&theirs?'Kalian berdua sudah check-in hari ini':mine?'Menunggu pasanganmu check-in':theirs?'Pasanganmu sudah check-in, giliranmu':'Check-in bersama setiap hari agar streak terus naik';$('#cki').disabled=mine}
$('#cki').onclick=async()=>{try{await api('checkin',{code:room,d:ld(new Date())});await poll();burst()}catch(e){toast(e)}};
/* ---------- album, notifikasi, pasang aplikasi, ketahanan ---------- */
async function openAlbum(){show('album');try{const j=await api('albget',{code:room});$('#alg').innerHTML=j.l.slice().reverse().map(x=>`<figure class="pic"><img src="${esc(x.img)}" alt=""><figcaption>${esc(x.cap)||'&nbsp;'}<small>${esc(x.by)} · ${new Date(x.d).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</small>${x.from===me.email?`<button class="ghost" data-del="${esc(x.id)}" aria-label="Hapus">${ic('close')}</button>`:''}</figcaption></figure>`).join('')||'<p class="sub" style="grid-column:1/-1">Belum ada foto. Mulai kumpulkan kenangan berdua.</p>'}catch(e){toast(e)}}
$('#alg').onclick=async e=>{const d=e.target.closest('[data-del]'),f=e.target.closest('figure');try{if(d){await api('albdel',{code:room,id:d.dataset.del});openAlbum()}else if(f){$('#lbi').src=f.querySelector('img').src;$('#lbx').hidden=false}}catch(x){toast(x)}};
$('#lbx').onclick=()=>{$('#lbx').hidden=true};
$('#alf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{await api('albadd',{code:room,cap:$('#alc').value,img:await rs(f,420,.5)});$('#alc').value='';openAlbum();toast('Foto ditambahkan')}catch(x){toast(x)}};
$('#gal').onclick=openAlbum;
function ping(m){if(ls.g('ntf')!=='1'||!document.hidden||!('Notification' in window)||Notification.permission!=='granted')return;try{new Notification('Lovera',{body:m.type==='text'?(m.data[0]==='§'?'Mengirim '+m.data.slice(1):m.data.slice(0,80)):m.type==='audio'?'Mengirim voice note':'Mengirim '+(m.type==='img'?'foto':'video'),icon:'icon-192.png',tag:'lovera'})}catch{}}
const uiN=()=>{$('#ntf').lastChild.textContent=' Notifikasi: '+(ls.g('ntf')==='1'?'aktif':'mati')};uiN();
$('#ntf').onclick=async()=>{if(CP()){pushed=false;await pushInit();const r=await CP().checkPermissions().catch(()=>({}));if(r.receive==='granted')ls.s('ntf','1');else ls.d('ntf');uiN();return toast(r.receive==='granted'?'Notifikasi aplikasi aktif':'Izin ditolak. Aktifkan lewat Pengaturan Android, Aplikasi, Lovera, Notifikasi')}if(!('Notification' in window))return toast('Browser tidak mendukung notifikasi');if(ls.g('ntf')==='1'){ls.d('ntf');uiN();return toast('Notifikasi dimatikan')}const p=await Notification.requestPermission();if(p==='granted'){ls.s('ntf','1');toast('Notifikasi aktif saat aplikasi di latar belakang')}else toast('Izin notifikasi ditolak');uiN()};
let ipr;addEventListener('beforeinstallprompt',e=>{e.preventDefault();ipr=e;$('#inst').hidden=false});$('#inst').onclick=()=>{if(ipr)ipr.prompt()};
['#email','#pw','#name'].forEach(s=>$(s).addEventListener('keydown',e=>{if(e.key==='Enter')$('#go').click()}));
addEventListener('offline',()=>toast('Koneksi terputus'));addEventListener('online',()=>toast('Kembali online'));
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
(async()=>{if(window.Capacitor||matchMedia('(display-mode: standalone)').matches)return;try{const r=await fetch('lovera.apk',{method:'HEAD',cache:'no-store'});if(r.ok&&!/text\/html/.test(r.headers.get('content-type')||''))['#apkl','#apks'].forEach(s=>$(s).hidden=false)}catch{}})();
/* ---------- push notification (aplikasi Android) ---------- */
let ftok='',pushed=false;
const CP=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.PushNotifications;
async function pushInit(){const P=CP();if(!P||pushed||!tok)return;pushed=true;try{const r=await P.requestPermissions();if(r.receive!=='granted')return;await P.createChannel({id:'lovera_msg_v1',name:'Pesan Lovera',description:'Chat dan kiriman dari pasangan',importance:5,visibility:1,sound:'notif',vibration:true}).catch(()=>{});await P.addListener('pushNotificationActionPerformed',a=>{const d=(a.notification&&a.notification.data)||{};if(d.t==='dm')openDM(d.f,d.n);else if(d.t==='friend')openFriends();else if(me&&me.room){enter(me.room);setTimeout(openChat,500)}});await P.addListener('registration',t=>{ftok=t.value;api('fcmreg',{token:ftok}).catch(()=>{})});await P.register()}catch{pushed=false}}
if(CP())CP().checkPermissions().then(r=>{if(r.receive==='granted')ls.s('ntf','1');else ls.d('ntf');uiN()}).catch(()=>{});
/* ---------- lencana pesan belum dibaca + bunyi ---------- */
let ub={r:0,d:{},nm:{}},ubp=null,sn=0;
const bdg=n=>n>0?`<b class="dot">${n>99?'99+':n}</b>`:'';
function beep(){try{navigator.vibrate&&navigator.vibrate(150)}catch{}
if(sn>2){try{const x=new(window.AudioContext||window.webkitAudioContext)(),o=x.createOscillator(),g=x.createGain();o.connect(g);g.connect(x.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,x.currentTime);g.gain.exponentialRampToValueAtTime(.001,x.currentTime+.4);o.start();o.stop(x.currentTime+.4)}catch{}return}
const a=new Audio(['notif.mp3','notif.ogg','notif.wav'][sn]);a.onerror=()=>{sn++;beep()};a.play().catch(()=>{})}
function renderBadges(){const sd=Object.values(ub.d||{}).reduce((x,y)=>x+y,0),tot=(ub.r||0)+sd,set=(id,n)=>{const el=$(id);if(!el)return;el.hidden=!n;el.textContent=n>99?'99+':n};
set('#bdt',tot);set('#bdf',sd);badge();if(me&&me.room)$('#cont').innerHTML='Lanjut ke room '+me.room+bdg(ub.r);document.title=(tot?`(${tot}) `:'')+'Lovera'}
async function badgePoll(){if(!tok||!me||cur==='land'||cur==='auth')return;try{const n=await api('unread');n.d=n.d||{};n.nm=n.nm||{};
if(ubp){if((n.r||0)>(ubp.r||0)){beep();if(cur!=='chatp')toast('Room: pesan baru dari pasangan')}
for(const k in n.d)if(n.d[k]>(ubp.d[k]||0)){beep();if(!(cur==='dm'&&dmTo===k))toast('Pesan pribadi dari '+(n.nm[k]||'teman'))}}
ubp=JSON.parse(JSON.stringify(n));ub=n;
if(cur==='chatp'&&n.r>0){ub.r=0;api('clr',{k:'r'}).catch(()=>{})}
if(cur==='dm'&&n.d[dmTo]>0){delete ub.d[dmTo];api('clr',{k:'d',email:dmTo}).catch(()=>{})}
renderBadges()}catch{}}
setInterval(badgePoll,4000);
/* ---------- fitur pembeda: sentuhan, kompas, rindu, rekap ---------- */
let holding=false,holdTm=null,lastTy=0,hdg=0,oriOn=false,cwid=null;
function rinduW(j){lvlW(j);$('#msv').innerHTML=j.m.map(x=>`<div class="mo"><span>${x.ms||0}</span><small>${esc(x.name)}</small></div>`).join('')}
$('#msb').onclick=async()=>{try{await api('miss',{code:room,d:ld(new Date())});burst();navigator.vibrate&&navigator.vibrate(60);poll()}catch(e){toast(e)}};
$('#txt').addEventListener('input',()=>{if(room&&Date.now()-lastTy>2500){lastTy=Date.now();api('typing',{code:room}).catch(()=>{})}});
function openHold(){show('hold');clearInterval(holdTm);holdTm=setInterval(holdTick,1000);holdTick()}
async function holdTick(){if(cur!=='hold'){clearInterval(holdTm);holding=false;return}try{const j=await api('hold',{code:room,on:holding?1:0}),on=j.age<4500,pn=st&&st.m.find(x=>x.email!==me.email),nm=pn?pn.name:'Dia',both=holding&&on;
$('#hb').classList.toggle('both',both);$('#hst').textContent=both?'Terhubung dengan '+nm:on?nm+' sedang menahan. Ikut tahan sekarang':holding?'Menunggu '+nm+'…':'Tahan tombol untuk memanggil';
if(navigator.vibrate){if(both)navigator.vibrate([90,110,90,500]);else if(on&&!holding)navigator.vibrate(40)}}catch{}}
const setHold=v=>{holding=v;$('#hb').classList.toggle('on',v);if(v)holdTick()};
$('#hb').onpointerdown=e=>{e.preventDefault();setHold(true)};['pointerup','pointercancel','pointerleave'].forEach(t=>$('#hb').addEventListener(t,()=>setHold(false)));
$('#gh').onclick=openHold;
const brg=(a,b,c,d)=>{const r=x=>x*Math.PI/180,y=Math.sin(r(d-b))*Math.cos(r(c)),x=Math.cos(r(a))*Math.sin(r(c))-Math.sin(r(a))*Math.cos(r(c))*Math.cos(r(d-b));return(Math.atan2(y,x)*180/Math.PI+360)%360};
function drawCmp(){if(cur!=='compass')return;const p=st&&st.m.find(x=>x.email!==me.email),l=p&&p.loc;if(!l){$('#cms').textContent='Pasangan belum membagikan lokasi';return}if(!mypos){$('#cms').textContent='Mencari lokasimu…';return}
const d=dist(mypos[0],mypos[1],l.lat,l.lng);$('#cmd').textContent=d<1?Math.round(d*1000)+' m':d.toFixed(1)+' km';$('#cma').style.transform=`rotate(${brg(mypos[0],mypos[1],l.lat,l.lng)-hdg}deg)`;$('#cms').textContent='Arahkan HP mendatar. Panah menunjuk ke '+p.name}
const onOri=e=>{if(e.webkitCompassHeading!=null)hdg=e.webkitCompassHeading;else if(e.alpha!=null&&(e.absolute||e.type==='deviceorientationabsolute'))hdg=(360-e.alpha)%360;drawCmp()};
async function openCompass(){show('compass');try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)await DeviceOrientationEvent.requestPermission()}catch{}
if(!oriOn){oriOn=true;addEventListener('deviceorientationabsolute',onOri,true);addEventListener('deviceorientation',onOri,true)}
if(cwid==null&&navigator.geolocation)cwid=navigator.geolocation.watchPosition(p=>{mypos=[p.coords.latitude,p.coords.longitude];drawCmp()},()=>toast('Izin lokasi dibutuhkan untuk kompas'),{enableHighAccuracy:true});drawCmp()}
$('#gc').onclick=openCompass;
async function openRecap(){show('recap');try{const j=await api('recap',{code:room}),s=j.st||{n:{},t:{v:0,i:0,vd:0},h:Array(24).fill(0),d:{}},tot=Object.values(s.n).reduce((a,b)=>a+b,0),mx=Math.max(1,...s.h),pk=s.h.indexOf(Math.max(...s.h)),days=[...Array(14)].map((_,i)=>ld(new Date(Date.now()-(13-i)*864e5))),dm=Math.max(1,...days.map(d=>s.d[d]||0)),ci=j.ci&&(j.ci.l===ld(new Date())||j.ci.l===ld(new Date(Date.now()-864e5)))?j.ci.n:0;
$('#rcp').innerHTML=`<div class="w"><div class="k">Total pesan di room</div><div class="bign">${tot}</div>${j.m.map(x=>`<div class="sub" style="text-align:left">${esc(x.name)} · ${s.n[x.email]||0}</div><div class="bar"><i style="width:${tot?(s.n[x.email]||0)*100/tot:0}%"></i></div>`).join('')}</div>
<div class="w"><div class="k">Suara · foto · video</div><div class="bign">${s.t.v} · ${s.t.i} · ${s.t.vd}</div></div>
<div class="w"><div class="k">Jam paling ramai</div><div class="hist">${s.h.map((v,i)=>`<i class="${i===pk&&v?'pk':''}" style="height:${v*100/mx}%"></i>`).join('')}</div><p class="sub" style="text-align:left">${tot?'Paling sering ngobrol sekitar jam '+String(pk).padStart(2,'0')+'.00':'Belum ada data. Rekap dihitung sejak versi ini dipasang'}</p></div>
<div class="w"><div class="k">14 hari terakhir</div><div class="hist">${days.map(d=>`<i style="height:${(s.d[d]||0)*100/dm}%"></i>`).join('')}</div></div>
<div class="w"><div class="k">Streak</div><div class="bign">${ci} hari</div></div>
<div class="w"><div class="k">Lencana</div><div class="bdgs">${[['Pesan pertama',tot>=1],['100 pesan',tot>=100],['500 pesan',tot>=500],['Voice pertama',s.t.v>=1],['10 foto',s.t.i>=10],['Streak 7 hari',ci>=7],['Streak 30 hari',ci>=30],['Level 5',(j.xp||0)>=192]].map(([n,o])=>`<span class="bd ${o?'on':''}">${ic(o?'check':'lock')} ${n}</span>`).join('')}</div></div>`}catch(e){toast(e)}}
$('#gr').onclick=openRecap;
/* ---------- level, agenda, peta kenangan, cari pesan ---------- */
const TTL=['Baru kenal','Mulai dekat','Saling jaga','Rumah kedua','Pasangan kompak','Belahan jiwa','Tak terpisahkan','Legenda cinta'];
function lvlW(j){const x=j.xp||0,L=Math.floor(Math.sqrt(x/12))+1,a=12*(L-1)**2,b=12*L*L;$('#lvl').textContent='Level '+L;$('#lvt').textContent=TTL[Math.min(L-1,TTL.length-1)]+' · '+x+' XP · '+(b-x)+' XP lagi ke level '+(L+1);$('#lvb').style.width=Math.min(100,(x-a)*100/(b-a))+'%'}
async function openAgenda(){show('agenda');try{const j=await api('agget',{code:room}),n=Date.now();$('#agl').innerHTML=j.l.sort((p,q)=>p.ts-q.ts).map(x=>{const d=x.ts-n,t=d<0?'sudah lewat':d<36e5?Math.ceil(d/6e4)+' menit lagi':d<864e5?Math.floor(d/36e5)+' jam lagi':Math.floor(d/864e5)+' hari lagi';return`<div class="fr"><div><b>${esc(x.t)}</b><div class="sub" style="text-align:left">${new Date(x.ts).toLocaleString('id-ID',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} · ${t}</div></div>${x.from===me.email?`<button class="ghost" data-del="${esc(x.id)}" aria-label="Hapus">${ic('close')}</button>`:''}</div>`}).join('')||'<p class="sub">Belum ada agenda. Tambahkan video call atau kencan berikutnya.</p>'}catch(e){toast(e)}}
$('#agl').onclick=async e=>{const d=e.target.closest('[data-del]');if(!d)return;try{await api('agdel',{code:room,id:d.dataset.del});openAgenda()}catch(er){toast(er)}};
$('#aga').onclick=async()=>{try{const ts=+new Date($('#agd').value);if(!$('#agt').value.trim()||!ts)return toast('Isi judul dan waktunya');await api('agadd',{code:room,t:$('#agt').value,ts});$('#agt').value='';openAgenda()}catch(e){toast(e)}};
$('#gag').onclick=openAgenda;
let pinsL=[];
function drawPins(){$('#pnl').innerHTML=pinsL.slice().reverse().map(x=>`<div class="fr" data-p="${esc(x.id)}"><div><b>${esc(x.note)||'Tanpa catatan'}</b><div class="sub" style="text-align:left">${esc(x.by)} · ${new Date(x.d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div></div>${x.from===me.email?`<button class="ghost" data-x="${esc(x.id)}" aria-label="Hapus">${ic('close')}</button>`:''}</div>`).join('')||'<p class="sub">Belum ada tempat. Tandai tempat yang bermakna untuk kalian.</p>'}
async function openPins(){show('pins');$('#pnm').innerHTML='';try{pinsL=(await api('pnget',{code:room})).l;drawPins()}catch(e){toast(e)}}
$('#pnl').onclick=async e=>{const x=e.target.closest('[data-x]'),p=e.target.closest('[data-p]');try{if(x){await api('pndel',{code:room,id:x.dataset.x});openPins()}else if(p){const m=pinsL.find(q=>q.id===p.dataset.p);if(m){const k=.006;$('#pnm').innerHTML=`<iframe loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${m.lng-k},${m.lat-k},${m.lng+k},${m.lat+k}&layer=mapnik&marker=${m.lat},${m.lng}"></iframe>`}}}catch(er){toast(er)}};
$('#pna').onclick=()=>{if(!navigator.geolocation)return toast('Lokasi tidak didukung');navigator.geolocation.getCurrentPosition(async p=>{try{await api('pnadd',{code:room,note:$('#pnn').value,lat:p.coords.latitude,lng:p.coords.longitude});$('#pnn').value='';openPins();toast('Tempat ditandai')}catch(e){toast(e)}},()=>toast('Izin lokasi dibutuhkan'),{enableHighAccuracy:true})};
$('#gpn').onclick=openPins;
$('#csr').oninput=e=>{const q=e.target.value.toLowerCase();$$('#chat .msg').forEach(m=>{m.style.display=!q||m.textContent.toLowerCase().includes(q)?'':'none'})};
$('#cst').onclick=()=>{const i=$('#csr');i.hidden=!i.hidden;if(i.hidden){i.value='';i.oninput({target:i})}else i.focus()};
applyTheme();boot();
