var db;try{db=JSON.parse(localStorage.getItem('oems')||'null')}catch(e){}
db=db||{users:[{id:1,role:'admin',name:'Administrator',user:'admin',pass:'admin123'}],exams:[],att:[],n:10};
var me=null,tick=null;
function save(){try{localStorage.setItem('oems',JSON.stringify(db))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function $(i){return document.getElementById(i)}
function nid(){return db.n++}
function login(){var u=db.users.find(function(x){return x.user===$('u').value.trim()&&x.pass===$('p').value});
 if(!u){$('err').textContent='Wrong username or password';return}if(u.active===false){$('err').textContent='Account is deactivated. Contact the administrator.';return}me=u;render()}
function logout(){me=null;clearInterval(tick);render()}
function render(){clearInterval(tick);
 $('who').innerHTML=me?esc(me.name)+' ('+me.role+') <button class="g" onclick="logout()">Logout</button>':'';
 if(!me){$('app').innerHTML='<div class="card" style="max-width:340px;margin:40px auto"><h2>Login</h2><div class="row"><input id="u" placeholder="Username"></div><div class="row"><input id="p" type="password" placeholder="Password"></div><button onclick="login()">Login</button> <p id="err" style="color:var(--bad)"></p></div>';return}
 if(me.role==='admin')admin();else if(me.role==='teacher')teacher();else student()}
/* ADMIN */
function admin(){
 var h='<div class="card"><h2>Change admin password</h2><div class="row"><input id="np" type="password" placeholder="New password (min 6 characters)"><button onclick="chPw()">Change</button></div></div>';h+='<div class="card"><h2>Create account</h2><div class="row"><input id="nm" placeholder="Full name"><select id="rl"><option value="student">Student</option><option value="teacher">Teacher</option></select><button onclick="addUser()">Create</button></div><p class="mu" id="newc"></p></div>';
 h+='<div class="card"><h2>Accounts</h2><div class="tw"><table><tr><th>Name</th><th>Role</th><th>Username</th><th>Password</th><th></th></tr>'+db.users.filter(function(u){return u.role!=='admin'}).map(function(u){return'<tr><td>'+esc(u.name)+(u.active===false?' (inactive)':'')+'</td><td>'+u.role+'</td><td>'+u.user+'</td><td>'+u.pass+'</td><td><button class="g" onclick="act('+u.id+')">'+(u.active===false?'Activate':'Deactivate')+'</button> <button class="g" onclick="resetPw('+u.id+')">Reset pw</button> <button class="d" onclick="two(this,function(){delUser('+u.id+')})">Delete</button></td></tr>'}).join('')+'</table></div></div>';
 h+=tHtml();
 h+='<div class="card"><h2>Exam attempts</h2>'+attTable(true)+'</div>';$('app').innerHTML=h}
function chPw(){var p=$('np').value;if(p.length<6){alert('Use at least 6 characters.');return}me.pass=p;save();$('np').value='';alert('Password changed.')}
function act(id){var u=db.users.find(function(x){return x.id===id});u.active=u.active===false;save();admin()}
function saveEx(id){var e=ex(id),t=$('xt'+id).value.trim();if(!t)return;e.title=t;e.subject=$('xs'+id).value.trim();e.mins=+$('xm'+id).value||e.mins;save();teacher();alert('Exam details saved.')}
function rnd(){return String(Math.floor(100000+Math.random()*900000))}
function addUser(){var n=$('nm').value.trim();if(!n)return;var r=$('rl').value,id=nid(),u={id:id,role:r,name:n,user:(r==='student'?'stu':'tch')+id,pass:rnd()};
 db.users.push(u);save();admin();$('newc').textContent='Created: '+u.user+' / '+u.pass}
function resetPw(id){var u=db.users.find(function(x){return x.id===id});u.pass=rnd();save();admin()}
function delUser(id){db.users=db.users.filter(function(x){return x.id!==id});save();admin()}
function attTable(reset,tid){var rows=db.att.filter(function(a){var e=db.exams.find(function(x){return x.id===a.eid});return e&&(!tid||e.by===tid)});
 if(!rows.length)return'<p class="mu">No attempts yet.</p>';
 return'<div class="tw"><table><tr><th>Student</th><th>Exam</th><th>Status</th><th>Score</th><th>%</th><th></th></tr>'+rows.map(function(a){var u=db.users.find(function(x){return x.id===a.uid})||{name:'?'},e=db.exams.find(function(x){return x.id===a.eid});
 var p=a.done?Math.round(a.score/a.total*100):'';
 return'<tr><td>'+esc(u.name)+'</td><td>'+esc(e.title)+'</td><td>'+(a.done?'Submitted':'In progress')+'</td><td>'+(a.done?a.score+'/'+a.total:'')+'</td><td>'+(a.done?p+(p>=50?' Pass':' Fail'):'')+'</td><td>'+(reset?'<button class="g" onclick="two(this,function(){resetAtt('+a.id+')})">Reset attempt</button>':'')+'</td></tr>'}).join('')+'</table></div>'}
function resetAtt(id){db.att=db.att.filter(function(a){return a.id!==id});save();admin()}
/* TEACHER */
function teacher(){if(me.role==='admin'){admin();return}$('app').innerHTML=tHtml()}
function tHtml(){
 var h='<div class="card"><h2>New exam</h2><div class="row"><input id="et" placeholder="Exam title"><input id="es" placeholder="Subject"><input id="em" type="number" min="1" value="30" title="Minutes"></div><button onclick="addExam()">Create exam</button><h3 style="margin-top:14px">Or create an exam from a PDF</h3><input type="file" accept="application/pdf" onchange="pdfNew(this)"><p class="mu">Uses the title, subject and minutes above. If the title is empty, the file name is used.</p></div>';
 db.exams.filter(function(e){return me.role==='admin'||e.by===me.id}).forEach(function(e){
  h+='<div class="card"><h2>'+esc(e.title)+' <span class="mu">'+esc(e.subject)+' · '+e.mins+' min · '+e.qs.length+' questions</span></h2>'+
  '<div class="row"><label style="flex:0 0 auto"><input type="checkbox" '+(e.open?'checked':'')+' onchange="toggle('+e.id+')"> Open for students</label></div>'+
  '<div class="row"><input id="xt'+e.id+'" value="'+esc(e.title)+'"><input id="xs'+e.id+'" value="'+esc(e.subject)+'"><input id="xm'+e.id+'" type="number" min="1" value="'+e.mins+'"><button class="g" onclick="saveEx('+e.id+')">Save details</button></div>'+
  '<h3>Add question</h3><div class="row"><input id="q'+e.id+'" placeholder="Question" style="flex:3"></div><div class="row"><input id="a'+e.id+'" placeholder="A"><input id="b'+e.id+'" placeholder="B"><input id="c'+e.id+'" placeholder="C (optional)"><input id="d'+e.id+'" placeholder="D (optional)"><select id="k'+e.id+'"><option>A</option><option>B</option><option>C</option><option>D</option></select></div><button onclick="addQ('+e.id+')">Add</button> <button class="g" onclick="addTF('+e.id+')">Add as True/False</button>'+
  '<h3 style="margin-top:14px">Import from PDF</h3><input type="file" accept="application/pdf" onchange="pdfImp('+e.id+',this)"><p class="mu" id="ps'+e.id+'"></p><div id="pv'+e.id+'"></div><h3 style="margin-top:14px">Import from text (paste)</h3><p class="mu">Blocks separated by a blank line: question, options A) B) C) D), then Answer: B</p><textarea id="t'+e.id+'"></textarea><button onclick="imp('+e.id+')">Import</button>'+
  '<h3 style="margin-top:14px">Questions</h3>'+e.qs.map(function(q,i){return'<div class="mu">'+(i+1)+'. '+esc(q.q)+' → '+'ABCD'[q.a]+' <a href="#" onclick="delQ('+e.id+','+i+');return false">remove</a></div>'}).join('')+
  '<p><button class="d" onclick="two(this,function(){delExam('+e.id+')})">Delete exam</button></p></div>'});
 if(me.role!=='admin')h+='<div class="card"><h2>Results</h2>'+attTable(false,me.id)+'</div>';return h}
function addExam(){var t=$('et').value.trim();if(!t)return;db.exams.push({id:nid(),title:t,subject:$('es').value.trim(),mins:+$('em').value||30,qs:[],open:false,by:me.id});save();teacher()}
function pdfNew(inp){var f=inp.files[0];if(!f)return;var t=$('et').value.trim()||f.name.replace(/\.pdf$/i,''),id=nid();
 db.exams.push({id:id,title:t,subject:$('es').value.trim(),mins:+$('em').value||30,qs:[],open:false,by:me.id});save();teacher();
 var s=$('ps'+id);if(s&&s.scrollIntoView)s.scrollIntoView({block:'center'});pdfImp(id,{files:inp.files})}
function ex(id){return db.exams.find(function(e){return e.id===id})}
function toggle(id){var e=ex(id);e.open=!e.open;save()}
function addQ(id){var q=$('q'+id).value.trim(),o=['a','b','c','d'].map(function(k){return $(k+id).value.trim()}).filter(Boolean),k='ABCD'.indexOf($('k'+id).value);
 if(!q||o.length<2||k>=o.length){alert('Enter a question, at least 2 options, and a valid correct answer.');return}ex(id).qs.push({q:q,o:o,a:k});save();teacher()}
function addTF(id){var q=$('q'+id).value.trim(),k=$('k'+id).value==='B'?1:0;if(!q){alert('Enter the question. Correct answer A = True, B = False.');return}ex(id).qs.push({q:q,o:['True','False'],a:k});save();teacher()}
function delQ(id,i){ex(id).qs.splice(i,1);save();teacher()}
function delExam(id){db.exams=db.exams.filter(function(e){return e.id!==id});db.att=db.att.filter(function(a){return a.eid!==id});save();teacher()}
function imp(id){var n=0;$('t'+id).value.split(/\n\s*\n/).forEach(function(b){var L=b.split('\n').map(function(s){return s.trim()}).filter(Boolean),q=[],o=[],a=-1;
 L.forEach(function(l){var m=l.match(/^([A-D])[\).:]\s*(.+)/i),k=l.match(/^answer\s*[:\-]?\s*([A-D])/i);if(k)a='ABCD'.indexOf(k[1].toUpperCase());else if(m)o.push(m[2]);else if(!o.length)q.push(l.replace(/^\d+[\).]\s*/,''))});
 if(q.length&&o.length>1&&a>=0&&a<o.length){ex(id).qs.push({q:q.join(' '),o:o,a:a});n++}});
 save();teacher();alert(n+' question(s) imported.')}
/* PDF IMPORT */
var pend={};
async function pdfImp(id,inp){var f=inp.files[0];if(!f)return;var st=$('ps'+id);
 if(!window.pdfjsLib){st.textContent='PDF reader not loaded. Check your internet connection.';return}
 st.textContent='Reading PDF...';
 try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,lines=[];
  for(var p=1;p<=pdf.numPages;p++){var tc=await(await pdf.getPage(p)).getTextContent(),rows={};
   tc.items.forEach(function(it){var y=Math.round(it.transform[5]/3);(rows[y]=rows[y]||[]).push(it)});
   Object.keys(rows).map(Number).sort(function(a,b){return b-a}).forEach(function(y){lines.push(rows[y].sort(function(a,b){return a.transform[4]-b.transform[4]}).map(function(i){return i.str}).join(' ').replace(/\s+/g,' ').trim())})}
  lines=lines.filter(Boolean);
  if(!lines.length){st.textContent='No text found. This looks like a scanned PDF, and OCR is not supported in this version.';return}
  var qs=parseQs(lines);pend[id]=qs;
  st.textContent=qs.length?qs.length+' question(s) found. Review them, then save.':'No questions recognised. Expected: "1. Question", options "A) ...", and "Answer: B" (or an Answer Key at the end).';
  showPv(id)}catch(e){st.textContent='Could not read this PDF.'}}
function parseQs(L){var qs=[],c=null,last=null,key={};
 var ki=L.findIndex(function(l){return /^answer\s*key/i.test(l)});
 if(ki>=0){L.slice(ki+1).join(' ').replace(/(\d+)\s*[\.\):\-]?\s*([A-D])\b/gi,function(m,n,a){key[n]=a.toUpperCase();return m});L=L.slice(0,ki)}
 L.forEach(function(l){var m;
  if(m=l.match(/^(\d+)\s*[\.\)]\s+(.+)/)){c={n:m[1],q:m[2],o:[],a:-1};qs.push(c);last='q';return}
  if(!c)return;
  if(m=l.match(/^(?:correct answer|answer|ans)\s*[:\-]?\s*\(?([A-D])\b/i)){c.a='ABCD'.indexOf(m[1].toUpperCase());last=null;return}
  var parts=l.split(/\s+(?=\(?[A-D][\.\)]\s)/);
  if(/^\(?[A-D][\.\)]\s*/i.test(parts[0])){parts.forEach(function(s){var k=s.match(/^\(?[A-D][\.\)]\s*(.*)/i);if(k&&c.o.length<4)c.o.push(k[1])});last='o';return}
  if(last==='q')c.q+=' '+l;else if(last==='o'&&c.o.length)c.o[c.o.length-1]+=' '+l});
 qs.forEach(function(q){if(q.a<0&&key[q.n])q.a='ABCD'.indexOf(key[q.n])});
 return qs.filter(function(q){return q.o.length>=2})}
function showPv(id){var qs=pend[id]||[];
 $('pv'+id).innerHTML=qs.length?qs.map(function(q,i){return'<div class="card"><label><input type="checkbox" id="pk'+id+'_'+i+'" checked> Keep</label><input id="pq'+id+'_'+i+'" value="'+esc(q.q)+'" style="width:100%;margin:6px 0">'+q.o.map(function(o,j){return'<div class="mu">'+'ABCD'[j]+') '+esc(o)+'</div>'}).join('')+'<div class="row" style="margin-top:6px"><select id="pa'+id+'_'+i+'"><option value="-1">Correct answer?</option>'+q.o.map(function(o,j){return'<option value="'+j+'"'+(q.a===j?' selected':'')+'>'+'ABCD'[j]+'</option>'}).join('')+'</select></div></div>'}).join('')+'<button onclick="savePv('+id+')">Save selected questions</button>':''}
function savePv(id){var qs=pend[id]||[],n=0,skip=0;
 qs.forEach(function(q,i){if(!$('pk'+id+'_'+i).checked)return;var a=+$('pa'+id+'_'+i).value,t=$('pq'+id+'_'+i).value.trim();if(a<0||!t){skip++;return}ex(id).qs.push({q:t,o:q.o,a:a});n++});
 delete pend[id];save();teacher();alert(n+' question(s) saved.'+(skip?' '+skip+' skipped because no correct answer was set.':''))}
/* STUDENT */
function student(){
 var h='<h2>Available exams</h2>';
 var list=db.exams.filter(function(e){return e.open&&e.qs.length});
 if(!list.length)h+='<p class="mu">No exams available now.</p>';
 list.forEach(function(e){var a=db.att.find(function(x){return x.uid===me.id&&x.eid===e.id});
  h+='<div class="card"><h2>'+esc(e.title)+'</h2><p class="mu">'+esc(e.subject)+' · '+e.mins+' minutes · '+e.qs.length+' questions · one attempt only</p>'+
  (a&&a.done?'<p><b>Submitted.</b> Score: '+a.score+'/'+a.total+' ('+Math.round(a.score/a.total*100)+'%)</p>':'<button onclick="start('+e.id+')">'+(a?'Continue exam':'Start exam')+'</button>')+'</div>'});
 $('app').innerHTML=h}
function start(id){var a=db.att.find(function(x){return x.uid===me.id&&x.eid===id});
 if(!a){a={id:nid(),uid:me.id,eid:id,start:Date.now(),ans:{},done:false};db.att.push(a);save()}
 if(a.done){student();return}take(a)}
window.alert=function(t){var d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:var(--tx);color:var(--bg);padding:10px 16px;border-radius:8px;z-index:99;max-width:90%';document.body.appendChild(d);setTimeout(function(){d.remove()},4000)};
function two(el,fn){if(el.dataset.s){fn();return}el.dataset.t=el.textContent;el.dataset.s='1';el.textContent='Click again to confirm';setTimeout(function(){el.dataset.s='';el.textContent=el.dataset.t},3000)}
var qi=0,confirming=false;
function take(a){qi=0;confirming=false;var end=a.start+ex(a.eid).mins*60000;
 $('app').innerHTML='<div id="tm"></div><div id="qb"></div>';draw(a.id);
 function t(){var s=Math.max(0,Math.round((end-Date.now())/1000));$('tm').textContent='Time left: '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(s<=0){clearInterval(tick);submit(a.id,true)}}
 t();tick=setInterval(t,1000)}
function draw(id){var a=db.att.find(function(x){return x.id===id}),e=ex(a.eid),q=e.qs[qi],n=e.qs.length,na=Object.keys(a.ans).length;
 var h='<h2>'+esc(e.title)+'</h2><p class="mu">Question '+(qi+1)+' of '+n+' · answered '+na+'</p><div class="card q"><b>'+(qi+1)+'. '+esc(q.q)+'</b>'+q.o.map(function(o,j){return'<label><input type="radio" name="q" '+(a.ans[qi]===j?'checked':'')+' onchange="ans('+id+','+qi+','+j+')"> '+'ABCD'[j]+') '+esc(o)+'</label>'}).join('')+'</div>';
 h+='<div class="row"><button class="g" '+(qi?'':'disabled')+' onclick="nav('+id+',-1)">Previous</button><button class="g" '+(qi<n-1?'':'disabled')+' onclick="nav('+id+',1)">Next</button></div>';
 h+='<div class="row">'+e.qs.map(function(x,i){return'<button class="'+(i===qi?'':'g')+'" style="flex:0 0 40px;min-width:40px;padding:6px 0'+(a.ans[i]!==undefined&&i!==qi?';border-color:var(--ac)':'')+'" onclick="goq('+id+','+i+')">'+(i+1)+'</button>'}).join('')+'</div>';
 h+=confirming?'<div class="card"><p>Submit the exam? You cannot retake it.'+(na<n?' You have '+(n-na)+' unanswered question(s).':'')+'</p><button onclick="submit('+id+')">Yes, submit</button> <button class="g" onclick="cf('+id+',false)">Cancel</button></div>':'<button onclick="cf('+id+',true)">Submit exam</button>';
 $('qb').innerHTML=h}
function nav(id,d){qi+=d;draw(id)}
function goq(id,i){qi=i;draw(id)}
function cf(id,v){confirming=v;draw(id)}
function ans(id,i,j){var a=db.att.find(function(x){return x.id===id});a.ans[i]=j;save()}
function submit(id,auto){var a=db.att.find(function(x){return x.id===id});if(!a||a.done)return;var e=ex(a.eid);
 a.score=e.qs.filter(function(q,i){return a.ans[i]===q.a}).length;a.total=e.qs.length;a.done=true;save();clearInterval(tick);
 if(auto)alert('Time is up. Your exam was submitted automatically.');student()}
render();
