const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const DEF='https://modelviewer.dev/shared-assets/models/Astronaut.glb';
let tok=localStorage.tok,me,room,seen=0,tm,wid,last=0,reg=false,sig='',lm='',mypos,pl=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=async(a,d={})=>{const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json',Authorization:tok||''},body:JSON.stringify({a,...d})});let j={};try{j=await r.json()}catch{}if(!r.ok)throw j.e||'Gagal terhubung ke server';return j};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2800)};
const show=id=>$$('.scr').forEach(s=>s.hidden=s.id!==id);
const av=u=>`<model-viewer class="av" src="${esc(u.avatar||DEF)}" auto-rotate camera-controls disable-zoom interaction-prompt="none" camera-orbit="0deg 80deg 2.5m" shadow-intensity="1"></model-viewer>`;
const rs=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,800/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.7))};i.src=URL.createObjectURL(f)});
const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
async function boot(){if(!tok)return show('auth');try{me=(await api('me')).u;home()}catch{localStorage.removeItem('tok');tok=null;show('auth')}}
function home(){show('home');$('#hi').textContent='Halo, '+me.name+(me.gender==='wanita'?' 💗':' 💙');$('#myav').innerHTML=av(me).replace('class="av"','style="width:100%;height:260px"');$('#cont').hidden=!me.room;$('#cont').textContent='Lanjut ke room '+me.room}
const setReg=b=>{reg=b;$('#tL').classList.toggle('on',!b);$('#tR').classList.toggle('on',b);$('#name').hidden=$('#gen').hidden=!b;$('#go').textContent=b?'Daftar':'Masuk'};
$('#tL').onclick=()=>setReg(false);$('#tR').onclick=()=>setReg(true);
$('#go').onclick=async()=>{try{const d={email:$('#email').value,pw:$('#pw').value};if(reg){d.name=$('#name').value;d.gender=document.querySelector('[name=g]:checked').value}
const j=await api(reg?'register':'login',d);tok=j.token;localStorage.tok=tok;me=j.u;home()}catch(e){toast(e)}};
$('#out').onclick=()=>{localStorage.removeItem('tok');tok=null;show('auth')};
$('#avs').onclick=async()=>{try{me=(await api('avatar',{url:$('#avurl').value.trim()})).u;home();toast('Avatar tersimpan')}catch(e){toast(e)}};
$('#mk').onclick=async()=>{try{const j=await api('create');me.room=j.code;enter(j.code)}catch(e){toast(e)}};
$('#jn').onclick=async()=>{try{const c=$('#code').value.trim().toUpperCase();await api('join',{code:c});me.room=c;enter(c)}catch(e){toast(e)}};
$('#cont').onclick=()=>enter(me.room);
function enter(c){room=c;seen=0;sig='';lm='';$('#chat').innerHTML='';$('#rc').textContent=c;show('room');poll();clearInterval(tm);tm=setInterval(poll,3000)}
$('#lv').onclick=()=>{clearInterval(tm);home()};
$('#cp').onclick=()=>{navigator.clipboard.writeText(room).then(()=>toast('Kode disalin'))};
async function poll(){try{const j=await api('state',{code:room,since:seen});
const s=JSON.stringify(j.m.map(x=>[x.email,x.avatar,x.name]));
if(s!==sig){sig=s;$('#mem').innerHTML=j.m.map(x=>`<div class="mm">${av(x)}<b>${esc(x.name)}</b></div>`).join('')+(j.m.length<2?'<div class="mm wait">Menunggu pasangan…<br>Bagikan kodenya</div>':'')}
const box=$('#chat'),b=box.scrollTop+box.clientHeight>=box.scrollHeight-80;
j.msgs.forEach(m=>{const d=document.createElement('div');d.className='msg'+(m.from===me.email?' me':'');
d.innerHTML=(m.type==='text'?esc(m.data):m.type==='img'?`<img src="${m.data}" alt="pap">`:`<video src="${m.data}" controls playsinline></video>`)+`<small>${new Date(m.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small>`;box.appendChild(d)});
seen=j.total;if(j.msgs.length&&b)box.scrollTop=box.scrollHeight;
const p=j.m.find(x=>x.email!==me.email);map(p&&p.loc,p&&p.name)}catch(e){toast(e)}}
function dist(a,b,c,d){const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))}
function map(l,n){const mb=$('#mapbox');if(!l){mb.innerHTML='<p class="sub">Pasangan belum membagikan lokasi.</p>';lm='';$('#dist').textContent='';return}
const k=l.lat+','+l.lng;if(k!==lm){lm=k;const e=.008;mb.innerHTML=`<iframe loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${l.lng-e},${l.lat-e},${l.lng+e},${l.lat+e}&layer=mapnik&marker=${l.lat},${l.lng}"></iframe>`}
const ago=Math.round((Date.now()-l.t)/60000);let t=esc(n)+' · diperbarui '+(ago<1?'baru saja':ago+' menit lalu');
if(mypos){const d=dist(mypos[0],mypos[1],l.lat,l.lng);t+=' · jarak '+(d<1?Math.round(d*1000)+' m':d.toFixed(1)+' km')}$('#dist').textContent=t}
$('#lt').onclick=()=>{if(wid!=null){navigator.geolocation.clearWatch(wid);wid=null;api('loc',{off:1});$('#lt').textContent='Bagikan lokasi saya';return}
if(!navigator.geolocation)return toast('Browser tidak mendukung lokasi');
wid=navigator.geolocation.watchPosition(p=>{mypos=[p.coords.latitude,p.coords.longitude];if(Date.now()-last>10000){last=Date.now();api('loc',{lat:mypos[0],lng:mypos[1]}).catch(()=>{})}},()=>{wid=null;toast('Izin lokasi ditolak')},{enableHighAccuracy:true});
$('#lt').textContent='Berhenti bagikan lokasi'};
const send=async(type,data)=>{try{await api('send',{code:room,type,data});poll()}catch(e){toast(e)}};
$('#cf').onsubmit=e=>{e.preventDefault();const v=$('#txt').value.trim();if(v){$('#txt').value='';send('text',v)}};
$('#pap').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)send('img',await rs(f))};
$('#vid').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>700000)return toast('Video maks ~700KB (±5 detik, kualitas rendah)');send('video',await rd(f))};
boot();
