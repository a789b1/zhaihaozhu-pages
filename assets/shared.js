(function(){
'use strict';
const KEY='zhz-html-prototype-v3';
const baseServices=JSON.parse(JSON.stringify(ZHZ_SERVICES));
function syncPrices(){ZHZ_SERVICES.forEach((s,i)=>{const base=JSON.parse(JSON.stringify(baseServices[i]));Object.assign(s,base,App.state.pricingOverrides?.[s.id]||{});if(App.state.pricingOverrides?.[s.id]?.price!==undefined)s.specs[0][1]=s.price;});}
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.e=esc;
window.money=v=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
window.yuan=v=>`<span class="currency">¥</span>${money(v)}`;
let state;
try {state=JSON.parse(localStorage.getItem(KEY));}catch{}
if(!state||state.version!==3)state=ZHZ_SEED();
window.App={state,views:{},actions:{},app:document.body.dataset.app,query:new URLSearchParams(),route:'home',temp:{},uploads:{},signature:null,
 save(){try{localStorage.setItem(KEY,JSON.stringify(App.state));}catch{toast('浏览器存储空间不足，本次修改仅在当前页面保留。');}},
 go(route,params={}){const q=new URLSearchParams(params).toString();location.hash='/'+route+(q?'?'+q:'');},
 currentOrder(){const id=App.query.get('id')||App.state.activeOrder;return App.state.orders.find(o=>o.id===id)||App.state.orders[0];},
 selectOrder(id){App.state.activeOrder=id;App.save();},
 currentService(){return ZHZ_SERVICES.find(s=>s.id===(App.query.get('service')||App.state.serviceId))||ZHZ_SERVICES[0];},
 updateOrder(id,patch,label){const o=App.state.orders.find(o=>o.id===id);if(!o)return;Object.assign(o,patch);o.logs??=[];if(label)o.logs.push([label,new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'})]);App.save();},
 log(module,action,target,reason,before='',after=''){App.state.logs.unshift({time:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}),by:({admin:'管理员',operator:'运营',support:'客服',finance:'财务'})[App.state.role]||'演示用户',module,action,target,reason,before,after});App.save();},
 render(){
  syncPrices();
  const hash=location.hash.replace(/^#\/?/,'')||((App.app==='admin')?'dashboard':'home');const [route,q='']=hash.split('?');App.route=route;App.query=new URLSearchParams(q);
  const page=ZHZ_CATALOG.apps[App.app]?.find(p=>p.id===route);
  document.title=(page?.title||'页面未找到')+' · 宅好住';
  try {document.getElementById('app').innerHTML=App.views[route]?App.views[route]():`<main class="not-found">${icon('search',48)}<h1>页面未找到</h1><a href="#/home">返回首页</a></main>`;}
  catch(err){console.error(err);document.getElementById('app').innerHTML='<main class="not-found"><h1>页面加载异常</h1><p>请返回首页重试。</p></main>';}
  document.querySelectorAll('[data-view-title]').forEach(x=>x.textContent=page?.title||'');
  if(typeof App.afterRender==='function')App.afterRender();
  setupSignature();
  window.scrollTo(0,0);
  if(window.parent!==window)window.parent.postMessage({type:'zhz-page',app:App.app,route,title:page?.title||route,hash:location.hash},'*');
 },
 reset(){state=ZHZ_SEED();App.state=state;App.save();App.render();}
};
window.toast=(message)=>{let node=document.getElementById('toast');if(!node){node=document.createElement('div');node.id='toast';node.className='toast';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);}node.textContent=message;node.classList.add('show');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>node.classList.remove('show'),3000);};
window.dialog=(title,body,footer='')=>{
 const old=document.getElementById('app-dialog');if(old)old.remove();
 const d=document.createElement('dialog');d.id='app-dialog';d.className='app-dialog';d.setAttribute('aria-label',title);d.innerHTML=`<div class="dialog-head"><h2>${e(title)}</h2><button class="icon-btn" data-action="close-dialog" aria-label="关闭">${icon('close')}</button></div><div class="dialog-body">${body}</div>${footer?`<div class="dialog-actions">${footer}</div>`:''}`;
 document.body.appendChild(d);App.temp.previousFocus=document.activeElement;d.showModal();d.addEventListener('click',ev=>{if(ev.target===d)closeDialog();});d.addEventListener('close',()=>{App.temp.previousFocus?.focus?.();d.remove();});
};
window.closeDialog=()=>document.getElementById('app-dialog')?.close();
window.confirmAction=(title,description,callback,label='确认',danger=false)=>{App.temp.confirm=callback;dialog(title,`<p>${description}</p>`,`<button class="btn secondary" data-action="close-dialog">再想想</button><button class="btn ${danger?'danger':''}" data-action="confirm-dialog">${e(label)}</button>`);};
window.downloadFile=(name,text,type='text/plain;charset=utf-8')=>{const b=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
window.exportCSV=(name,rows)=>downloadFile(name,'\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8');
window.badge=(label,type='blue')=>`<span class="badge ${e(type)}">${e(label)}</span>`;
window.statusBadge=o=>badge(ZHZ_STATUS[o.status]?.[0]||o.status,ZHZ_STATUS[o.status]?.[1]);
window.btn=(label,action='',cls='',data='')=>`<button class="btn ${cls}" ${action?`data-action="${e(action)}"`:''} ${data}>${label}</button>`;
window.linkBtn=(label,route,cls='',params={})=>`<a class="btn ${cls}" href="#/${route}${Object.keys(params).length?'?'+new URLSearchParams(params):''}">${label}</a>`;
window.section=(title,body,more='',route='')=>`<section class="section"><div class="section-heading"><h2>${title}</h2>${more?`<a class="text-link" href="#/${route}">${more}${icon('arrow',14)}</a>`:''}</div>${body}</section>`;
window.card=(content,cls='')=>`<div class="card ${cls}">${content}</div>`;
window.row=(name,value='',route='',ico='')=>`<${route?'a':'div'} ${route?`href="#/${route}"`:''} class="list-row"><span class="row-name">${ico?`<span class="row-icon">${icon(ico)}</span>`:''}${name}</span><span class="row-value">${value}${route?icon('arrow',16):''}</span></${route?'a':'div'}>`;
window.notice=(content,kind='blue')=>`<div class="notice ${kind}">${icon(kind==='orange'?'alert':'info',17)}<div>${content}</div></div>`;
window.field=(label,name,value='',type='text',extra='')=>`<label class="field"><span>${label}</span><input name="${e(name)}" type="${type}" value="${e(value)}" ${extra}/></label>`;
window.textarea=(label,name,value='',max=200,extra='')=>`<label class="field"><span>${label}</span><textarea name="${e(name)}" maxlength="${max}" rows="4" ${extra}>${e(value)}</textarea><small>最多${max}字</small></label>`;
window.selectField=(label,name,options,current='',extra='')=>`<label class="field"><span>${label}</span><select name="${e(name)}" ${extra}>${options.map(v=>{const a=Array.isArray(v)?v:[v,v];return `<option value="${e(a[0])}" ${String(a[0])===String(current)?'selected':''}>${e(a[1])}</option>`;}).join('')}</select></label>`;
window.toggle=(label,key,checked,description='',action='setting-toggle')=>`<label class="toggle-row"><span><strong>${label}</strong>${description?`<small>${description}</small>`:''}</span><input type="checkbox" role="switch" data-change="${action}" data-key="${key}" ${checked?'checked':''}><span class="toggle" aria-hidden="true"></span></label>`;
window.empty=(title='暂无相关记录',desc='换个筛选条件试试，或先去预约服务。',route='home',label='返回首页')=>`<div class="empty">${icon('clipboard',44)}<h3>${title}</h3><p>${desc}</p>${route?linkBtn(label,route,'secondary'):''}</div>`;
window.avatar=(name='李',size='',color='blue')=>`<span class="avatar ${size} ${color}" aria-label="${e(name)}">${icon('user',size==='lg'?32:24)}</span>`;
window.photoField=(label,key,max=6)=>`<div class="field" data-photo-field="${key}" data-photo-label="${e(label)}" data-photo-limit="${max}"><span>${label}</span><div class="upload-grid">${(App.uploads[key]||[]).map((url,i)=>`<div class="photo-item"><img src="${url}" alt="${e(label)}第${i+1}张"><button type="button" data-action="remove-photo" data-key="${key}" data-index="${i}" aria-label="删除照片">${icon('close',14)}</button></div>`).join('')}<label class="upload-box">${icon('camera',25)}<span>上传照片</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple data-photo="${key}" data-max="${max}" aria-label="${e(label)}"></label></div><small>PNG / JPG / WebP，每张不超过3MB，最多${max}张</small><button type="button" class="text-link sample-link" data-action="sample-photo" data-key="${key}">填入演示照片</button></div>`;
window.timeLine=logs=>`<ol class="timeline">${logs.slice().reverse().map(([label,time],i)=>`<li class="${i===0?'active':''}"><span class="timeline-dot"></span><div><strong>${e(label)}</strong><small>${e(time)}</small></div></li>`).join('')}</ol>`;
window.stepper=(steps,current)=>`<ol class="stepper">${steps.map((s,i)=>`<li class="${i<=current?'active':''}"><span>${i<current?icon('check',12):i+1}</span><small>${s}</small></li>`).join('')}</ol>`;
window.orderSummary=o=>`<div class="order-summary">${serviceArt((ZHZ_SERVICES.find(s=>s.id===o.serviceId)||{}).icon||'wrench')}<div><h3>${e(o.title)}</h3><p>${e(o.spec||'标准服务')}</p><small>${e(o.id)}</small></div></div>`;
window.amountRows=o=>`${row('服务费用',`¥${money(o.original??o.amount)}`)}${o.urgentFee?row('加急费用',`+ ¥${money(o.urgentFee)}`):''}${o.discount?row('优惠抵扣',`<span class="orange-text">− ¥${money(o.discount)}</span>`):''}${row('订单金额',`<strong>¥${money(o.amount)}</strong>`)}${row('已支付',`¥${money(o.paid)}`)}${Math.max(0,o.amount-o.paid)>0?row('待支付差额',`<strong class="orange-text">¥${money(o.amount-o.paid)}</strong>`):''}`;
window.chartSVG=(mode='line',height=180)=>{
 if(mode==='bars')return `<div class="bar-chart" style="height:${height}px">${[35,58,42,76,56,87,66,44,63,82,70,95,64,78].map((h,i)=>`<div class="bar-col"><span style="height:${h}%" title="${i+1}日：${h*8}元"></span><small>${i+1}</small></div>`).join('')}</div>`;
 return `<svg class="line-chart" viewBox="0 0 720 210" role="img" aria-label="最近7日收入趋势：周一至周日，昨日较前日上升"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1677ff" stop-opacity=".18"/><stop offset="1" stop-color="#1677ff" stop-opacity="0"/></linearGradient></defs>${[30,75,120,165].map(y=>`<path d="M42 ${y}h660" stroke="#EDF0F5" stroke-dasharray="4 4"/>`).join('')}<path d="M42 140C78 140 98 102 146 110S211 158 256 100 321 123 366 76 431 92 476 48 541 90 586 47 651 55 702 22V180H42Z" fill="url(#chart-fill)"/><path d="M42 140C78 140 98 102 146 110S211 158 256 100 321 123 366 76 431 92 476 48 541 90 586 47 651 55 702 22" stroke="#1677ff" stroke-width="3" fill="none"/>${['周一','周二','周三','周四','周五','周六','周日'].map((s,i)=>`<text x="${42+i*110}" y="205" fill="#6F7C8F" font-size="12">${s}</text>`).join('')}</svg>`;
};
window.mapView=(large=false)=>`<div class="map-view ${large?'large':''}"><svg viewBox="0 0 680 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="680" height="400" fill="#EDF2EF"/><path d="m-20 350 260-90 170-10 290-95" fill="none" stroke="#D4E9E8" stroke-width="55"/><g fill="#E0E9DF" stroke="#D4DFD3">${[[50,30,110,80],[230,16,140,84],[450,20,150,84],[30,140,130,65],[236,144,130,60],[480,125,140,63],[30,315,125,80],[240,310,120,75],[470,300,140,80]].map(v=>`<rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" rx="6"/>`).join('')}</g><g stroke="white" stroke-width="20" fill="none"><path d="M180-20v450M410-20v450M-20 120h740M-20 280h740"/></g><g stroke="#DFE6E3" stroke-width="1" fill="none"><path d="M170-20v450M190-20v450M400-20v450M420-20v450M-20 110h740M-20 130h740M-20 270h740M-20 290h740"/></g><path d="M180 230V120h230v140" stroke="#B7D6FF" stroke-width="12" fill="none"/><path d="M180 230V120h230v140" stroke="#347DE2" stroke-width="6" stroke-linejoin="round" fill="none"/><g font-size="13" fill="#7B8D80" font-family="sans-serif"><text x="70" y="73">阳光海景花园</text><text x="270" y="56">科技生态园</text><text x="470" y="75">深圳湾公园</text><text x="275" y="341">海岸城</text><text x="265" y="114" fill="#8F9997">科苑南路</text><text x="450" y="272" fill="#8F9997">海德三道</text></g><circle cx="180" cy="230" r="24" fill="#1677ff" opacity=".12"/><circle cx="180" cy="230" r="10" fill="#1677ff" stroke="white" stroke-width="4"/><circle cx="410" cy="260" r="16" fill="#FF8B52" stroke="white" stroke-width="5"/></svg><span class="map-caption">路线为演示示意 · 非实时地图</span><span class="map-label worker-map">${icon('wrench',15)} 李师傅</span><span class="map-label home-map">${icon('home',15)} 服务地址</span></div>`;

App.actions['close-dialog']=closeDialog;
App.actions['confirm-dialog']=()=>{const f=App.temp.confirm;closeDialog();App.temp.confirm=null;f?.();};
App.actions['back']=()=>{const ref=App.query.get('from');if(ref)App.go(ref);else if(history.length>1)history.back();else App.go(App.app==='admin'?'dashboard':'home');};
App.actions['sample-photo']=el=>{const key=el.dataset.key;const sample=`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="260"><rect width="360" height="260" fill="#E4EDF8"/><rect x="35" y="145" width="290" height="65" rx="9" fill="#BDCFE3"/><rect x="75" y="160" width="210" height="30" rx="15" fill="#F4F8FE"/><path d="M180 164V99q0-20 25-20h25v22h-24v60" fill="#8CA7C4"/><text x="180" y="235" text-anchor="middle" font-size="16" fill="#486581">演示现场照片 / ${key.includes('after')?'维修后':'维修前'}</text></svg>`;const field=document.querySelector('[data-photo-field="'+key+'"]');if((App.uploads[key]||[]).length>=Number(field?.dataset.photoLimit||6)){toast('已达到照片数量上限');return;}(App.uploads[key]??=[]).push('data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(sample))));refreshPhotos(key);};
App.actions['remove-photo']=el=>{App.uploads[el.dataset.key]?.splice(Number(el.dataset.index),1);refreshPhotos(el.dataset.key);};
App.actions['clear-signature']=()=>{App.signature=null;const c=document.getElementById('signature');c?.getContext('2d').clearRect(0,0,c.width,c.height);};
App.actions['setting-toggle']=el=>{App.state.settings[el.dataset.key]=el.checked;App.save();toast(el.checked?'已开启':'已关闭');};
App.actions['logout']=()=>confirmAction('退出当前账号','确认退出当前演示账号？',()=>{if(App.app==='user')App.state.user.loggedIn=false;App.save();App.go('login');},'退出登录');
App.actions['legal']=el=>dialog(el.dataset.title||'服务协议',`<p>此处为HTML原型的协议展示页。</p><p>服务前确认报价，新增项目须获得您的线上同意；平台保留订单、沟通和服务凭证记录。个人资料按必要范围使用，可在设置中管理通知及位置授权。</p><p>正式版本需接入业务审定后的完整${e(el.dataset.title||'协议')}。</p>`,btn('我已了解','close-dialog'));
App.actions['call']=()=>dialog('联系服务师傅',`<p>订单内通过平台虚拟号码转接，双方真实手机号保持隐藏。</p>${notice('HTML演示不拨打真实电话。您也可以使用站内聊天联系。')}`,linkBtn('发送站内消息','chat')+btn('关闭','close-dialog','secondary'));
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-action]');if(el&&!el.disabled){ev.preventDefault();App.actions[el.dataset.action]?.(el,ev);}});
document.addEventListener('change',async ev=>{
 const el=ev.target;
 if(el.dataset.change)App.actions[el.dataset.change]?.(el,ev);
 if(el.dataset.photo){const key=el.dataset.photo,files=[...el.files],max=Number(el.dataset.max||6);if((App.uploads[key]||[]).length+files.length>max){toast(`最多上传${max}张照片`);return;}for(const f of files){if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>3*1024*1024){toast('请选择不超过3MB的PNG、JPG或WebP图片');continue;}const url=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(f);});(App.uploads[key]??=[]).push(url);}refreshPhotos(key);}
});
document.addEventListener('submit',ev=>{const f=ev.target.closest('form[data-form]');if(!f)return;ev.preventDefault();if(!f.reportValidity())return;App.actions[f.dataset.form]?.(f,new FormData(f));});
document.addEventListener('input',ev=>{if(ev.target.dataset.input)App.actions[ev.target.dataset.input]?.(ev.target,ev);});
function refreshPhotos(key){const field=document.querySelector('[data-photo-field="'+key+'"]');if(field)field.outerHTML=photoField(field.dataset.photoLabel,key,Number(field.dataset.photoLimit||6));}
function rememberForm(){document.querySelectorAll('form[data-form]').forEach(f=>{App.temp[f.dataset.form]=Object.fromEntries(new FormData(f));});}
function setupSignature(){const canvas=document.getElementById('signature');if(!canvas)return;const ctx=canvas.getContext('2d');let down=false;ctx.lineWidth=3;ctx.strokeStyle='#233A5D';ctx.lineCap='round';if(App.signature){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0);img.src=App.signature;}const point=ev=>{const r=canvas.getBoundingClientRect();return [(ev.clientX-r.left)*canvas.width/r.width,(ev.clientY-r.top)*canvas.height/r.height];};canvas.onpointerdown=ev=>{down=true;canvas.setPointerCapture(ev.pointerId);ctx.beginPath();ctx.moveTo(...point(ev));};canvas.onpointermove=ev=>{if(down){ctx.lineTo(...point(ev));ctx.stroke();}};canvas.onpointerup=()=>{if(down){down=false;App.signature=canvas.toDataURL();}};}
window.addEventListener('hashchange',App.render);
window.addEventListener('storage',ev=>{if(ev.key===KEY){try{const s=JSON.parse(ev.newValue);if(s?.version===3)App.state=s;}catch{}if(!document.querySelector('dialog[open]')&&!document.querySelector('form:focus-within'))App.render();}});
window.addEventListener('message',ev=>{if(ev.data?.type==='zhz-reset'&&ev.source===window.parent)App.reset();});
})();
