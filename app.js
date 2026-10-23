const HASH="ea25c066a87ffa081ff0c11e09792615b0099cec19a145192d8a686c601ac761";
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,9);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
let S=load("pl_data",{nbs:[{id:uid(),name:"My Notebook",secs:[{id:uid(),name:"General",pages:[{id:uid(),title:"Welcome",html:"<p>Click anywhere to type. Use Pen to handwrite. Try Science mode for model images.</p>",ink:"",tpl:"lined"}]}]}],nb:0,sec:0,pg:0});
const save=()=>localStorage.setItem("pl_data",JSON.stringify(S));
const nb=()=>S.nbs[S.nb],sec=()=>nb().secs[S.sec],pg=()=>sec().pages[S.pg];
/* ---- lock ---- */
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)))].map(b=>b.toString(16).padStart(2,"0")).join("");
const acct=()=>load("pl_user",null);
function lockInit(){const a=acct();$("#lockmsg").textContent=a?"Welcome back. Sign in to unlock.":"Create your account to unlock your notebooks.";$("#go").textContent=a?"Unlock":"Create account";if(sessionStorage.pl_in){unlock()}}
$("#go").onclick=async()=>{const u=$("#u").value.trim(),p=$("#p").value;$("#err").textContent="";
 if(!u)return$("#err").textContent="Enter a username.";
 if(await sha(p)!==HASH)return$("#err").textContent="Wrong password.";
 const a=acct();if(a&&a.u.toLowerCase()!==u.toLowerCase())return$("#err").textContent="That username does not match this account.";
 if(!a)localStorage.setItem("pl_user",JSON.stringify({u}));sessionStorage.pl_in=1;unlock()};
$("#p").onkeydown=e=>e.key==="Enter"&&$("#go").click();
function unlock(){$("#lock").hidden=true;$("#app").hidden=false;$("#out").textContent="Sign out ("+acct().u+")";render()}
$("#out").onclick=()=>{delete sessionStorage.pl_in;location.reload()};
/* ---- render ---- */
function render(){const n=nb();$("#nb").innerHTML=S.nbs.map((x,i)=>`<option value=${i} ${i==S.nb?"selected":""}>${esc(x.name)}</option>`).join("");
 $("#secs").innerHTML=n.secs.map((s,i)=>`<button data-i=${i} class="${i==S.sec?"on":""}">${esc(s.name)}</button>`).join("");
 listPages();loadPage()}
const esc=t=>t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function listPages(f=""){$("#pages").innerHTML=sec().pages.map((p,i)=>({p,i})).filter(({p})=>!f||(p.title+p.html).toLowerCase().includes(f)).map(({p,i})=>`<div class="pg ${i==S.pg?"on":""}" data-i=${i}>${esc(p.title||"Untitled")}</div>`).join("")}
function loadPage(){const p=pg();$("#title").textContent=p.title;$("#body").innerHTML=p.html;$("#tpl").value=p.tpl||"plain";$("#sheet").className=(p.tpl||"plain")+(pen?" pen":"");sizeInk(p.ink)}
function commit(){const p=pg();p.title=$("#title").textContent;p.html=$("#body").innerHTML;p.tpl=$("#tpl").value;save();listPages($("#q").value.toLowerCase())}
["#title","#body"].forEach(s=>$(s).addEventListener("input",commit));
$("#tpl").onchange=()=>{commit();loadPage()};
$("#pages").onclick=e=>{const d=e.target.closest(".pg");if(d){S.pg=+d.dataset.i;save();listPages();loadPage()}};
$("#secs").onclick=e=>{const b=e.target.closest("button");if(b){S.sec=+b.dataset.i;S.pg=0;save();render()}};
$("#secs").ondblclick=e=>{const b=e.target.closest("button");if(b){const v=prompt("Rename section",sec().name);if(v){sec().name=v;save();render()}}};
$("#nb").onchange=e=>{S.nb=+e.target.value;S.sec=0;S.pg=0;save();render()};
$("#addnb").onclick=()=>{const v=prompt("Notebook name");if(v){S.nbs.push({id:uid(),name:v,secs:[{id:uid(),name:"Section 1",pages:[newPg()]}]});S.nb=S.nbs.length-1;S.sec=0;S.pg=0;save();render()}};
$("#addsec").onclick=()=>{const v=prompt("Section name");if(v){nb().secs.push({id:uid(),name:v,pages:[newPg()]});S.sec=nb().secs.length-1;S.pg=0;save();render()}};
const newPg=()=>({id:uid(),title:"",html:"",ink:"",tpl:"lined"});
$("#addpg").onclick=()=>{sec().pages.push(newPg());S.pg=sec().pages.length-1;save();render();$("#title").focus()};
$("#del").onclick=()=>{if(confirm("Delete this page?")){sec().pages.splice(S.pg,1);if(!sec().pages.length)sec().pages.push(newPg());S.pg=0;save();render()}};
$("#q").oninput=e=>listPages(e.target.value.toLowerCase());
/* ---- formatting ---- */
document.querySelectorAll(".tools [data-c]").forEach(b=>b.onmousedown=e=>{e.preventDefault();document.execCommand(b.dataset.c,false,b.dataset.v);commit()});
const ins=h=>{$("#body").focus();document.execCommand("insertHTML",false,h);commit()};
$("#todo").onmousedown=e=>{e.preventDefault();ins('<div><input type="checkbox" onchange="this.toggleAttribute(\'checked\',this.checked)"> To-do&nbsp;</div>')};
$("#tbl").onmousedown=e=>{e.preventDefault();ins("<table>"+"<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>".repeat(3)+"</table><p></p>")};
$("#date").onmousedown=e=>{e.preventDefault();ins(new Date().toLocaleString()+" ")};
const addImg=src=>ins(`<img src="${src}">`);
$("#img").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>addImg(r.result);r.readAsDataURL(f);e.target.value=""};
/* ---- ink ---- */
let pen=false,era=false,draw=false;const cv=$("#ink"),cx=cv.getContext("2d");
function sizeInk(d){cv.width=$("#sheet").offsetWidth;cv.height=$("#sheet").offsetHeight;cx.clearRect(0,0,cv.width,cv.height);if(d){const i=new Image();i.onload=()=>cx.drawImage(i,0,0);i.src=d}}
const setTool=(p,e)=>{pen=p;era=e;$("#pen").classList.toggle("on",p&&!e);$("#era").classList.toggle("on",p&&e);$("#sheet").classList.toggle("pen",p)};
$("#pen").onclick=()=>setTool(!(pen&&!era),false);$("#era").onclick=()=>setTool(!(pen&&era),true);
$("#clr").onclick=()=>{cx.clearRect(0,0,cv.width,cv.height);pg().ink="";save()};
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
cv.onpointerdown=e=>{draw=true;cv.setPointerCapture(e.pointerId);cx.beginPath();cx.moveTo(...pt(e));cx.lineCap=cx.lineJoin="round"};
cv.onpointermove=e=>{if(!draw)return;cx.globalCompositeOperation=era?"destination-out":"source-over";cx.lineWidth=era?22:1.2+e.pressure*2;cx.strokeStyle="#1c1c1c";cx.lineTo(...pt(e));cx.stroke();cx.beginPath();cx.moveTo(...pt(e))};
cv.onpointerup=()=>{draw=false;pg().ink=cv.toDataURL();save()};
/* ---- export/import ---- */
$("#exp").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:"application/json"}));a.download="paperlab-backup.json";a.click()};
$("#imp").onchange=e=>{const r=new FileReader();r.onload=()=>{try{S=JSON.parse(r.result);save();render()}catch{alert("Not a valid backup file.")}};r.readAsText(e.target.files[0])};
/* ---- modes ---- */
document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{document.querySelectorAll(".mode").forEach(x=>x.classList.toggle("on",x===b));["notes","science","prep"].forEach(m=>$("#"+m).hidden=m!==b.dataset.m);if(b.dataset.m==="notes")loadPage()});
/* ---- science: Wikimedia Commons image search ---- */
const topics=["DNA double helix","Bohr atom model","Animal cell diagram","Plant cell diagram","Mitochondria","Solar system model","Periodic table","Water molecule model","Tectonic plates","Rock cycle","Circuit diagram","Photosynthesis diagram","Human heart anatomy","Moon phases","Electromagnetic spectrum","Carbon cycle"];
$("#chips").innerHTML=topics.map(t=>`<button>${t}</button>`).join("");
$("#chips").onclick=e=>{if(e.target.tagName==="BUTTON"){$("#sq").value=e.target.textContent;$("#sf").requestSubmit()}};
$("#sf").onsubmit=async e=>{e.preventDefault();const q=$("#sq").value.trim();if(!q)return;$("#res").textContent="Searching...";
 try{const u="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|mime&iiurlwidth=400&format=json&origin=*&gsrsearch="+encodeURIComponent(q+" filetype:bitmap|drawing");
 const d=await(await fetch(u)).json();const ps=Object.values(d.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.thumburl);
 $("#res").innerHTML=ps.length?ps.map(p=>`<figure><img loading="lazy" src="${p.imageinfo[0].thumburl}" alt=""><figcaption>${esc(p.title.replace(/^File:|\.\w+$/g,""))}</figcaption></figure>`).join(""):"No images found. Try different words.";}
 catch{$("#res").textContent="Could not reach Wikimedia Commons. Check your connection."}};
$("#res").onclick=e=>{const f=e.target.closest("figure");if(!f)return;document.querySelector('[data-m="notes"]').click();addImg(f.querySelector("img").src)};
/* ---- prep: high school Science Bowl style ---- */
const Q=[["Biology","Which organelle is the main site of ATP production in eukaryotic cells?",["Mitochondrion","Golgi apparatus","Lysosome","Ribosome"],0],
["Biology","What molecule carries amino acids to the ribosome during translation?",["mRNA","tRNA","rRNA","DNA"],1],
["Biology","Which blood cells are mainly responsible for carrying oxygen?",["Platelets","White blood cells","Red blood cells","Plasma cells"],2],
["Chemistry","What is the pH of a neutral solution at 25 °C?",["0","7","10","14"],1],
["Chemistry","Which type of bond involves the sharing of electron pairs?",["Ionic","Covalent","Hydrogen","Metallic"],1],
["Chemistry","How many protons does a carbon atom have?",["4","6","8","12"],1],
["Physics","What is the SI unit of force?",["Joule","Watt","Newton","Pascal"],2],
["Physics","A 2 kg object accelerates at 3 m/s². What net force acts on it?",["1.5 N","5 N","6 N","9 N"],2],
["Physics","Which quantity is the rate of change of velocity?",["Speed","Acceleration","Momentum","Power"],1],
["Earth and Space","What layer of Earth lies between the crust and the core?",["Mantle","Troposphere","Lithosphere only","Asthenosphere only"],0],
["Earth and Space","Which planet has the shortest orbital period around the Sun?",["Venus","Earth","Mercury","Mars"],2],
["Energy","Which energy source is renewable?",["Natural gas","Coal","Uranium","Wind"],3],
["Math","What is the derivative of x³?",["x²","3x²","3x","x⁴/4"],1],
["Math","What is the sum of the interior angles of a hexagon?",["540°","720°","900°","360°"],1]];
let cat="All",qi=0,score=0,order=[];
function startQuiz(c){cat=c;order=Q.map((q,i)=>i).filter(i=>c==="All"||Q[i][0]===c).sort(()=>Math.random()-.5);qi=0;score=0;showQ()}
$("#pbar").innerHTML=["All",...new Set(Q.map(q=>q[0]))].map(c=>`<button>${c}</button>`).join("");
$("#pbar").onclick=e=>{if(e.target.tagName==="BUTTON")startQuiz(e.target.textContent)};
function showQ(){const z=$("#quiz");if(qi>=order.length){z.innerHTML=`<div class="q"><h3>Done: ${score} of ${order.length} correct</h3><button onclick="startQuiz(cat)">Play again</button></div>`;return}
 const q=Q[order[qi]];z.innerHTML=`<div class="q"><small>${q[0]} · ${qi+1} of ${order.length} · Score ${score}</small><h3>${q[1]}</h3>${q[2].map((o,i)=>`<button data-i=${i}>${"WXYZ"[i]}) ${o}</button>`).join("")}</div>`;
 z.querySelectorAll("button[data-i]").forEach(b=>b.onclick=()=>{const ok=+b.dataset.i===q[3];if(ok)score++;z.querySelectorAll("button[data-i]").forEach(x=>{x.disabled=true;if(+x.dataset.i===q[3])x.classList.add("ok")});if(!ok)b.classList.add("bad");z.querySelector(".q").insertAdjacentHTML("beforeend",`<button onclick="qi++;showQ()">Next question</button>`)})}
startQuiz("All");lockInit();
