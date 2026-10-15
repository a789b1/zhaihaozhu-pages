(function(){
'use strict';
const W=Worker,V=App.views,A=App.actions,U=WorkerUI;
const save=()=>App.save();
function reconcile(){
 const s=W.state();
 // External decisions are reflected only after a separate customer/platform action.
 for(const a of App.state.approvals){
  if(!['approved','rejected'].includes(a.status)||a.workerAppliedV12)continue;
  const o=W.findOrder(a.orderId),approved=a.status==='approved';let handled=false;
  if(a.type==='报价审核'&&o?.ruleVersion==='1.2'){
   const q=o.quoteVersions?.find(x=>x.id===a.quoteVersionId);
   if(q){q.status=approved?'customer':'rejected';q.reviewReason=a.reason||'';o.flags??={};if(o.flags.quoteReview===q.id){delete o.flags.quoteReview;if(approved)App.updateOrder(o.id,{status:'quote',quote:{visit:q.visit,labor:q.labor,material:q.material},amount:q.total,quoteApproved:false},'平台通过报价审核，等待客户确认');}handled=true;}
  }
  if(a.type==='增项审核'&&o?.addon?.id===a.addonId){o.addon.status=approved?'customer':'rejected';if(!approved){o.addon.approved=false;if(o.flags)delete o.flags.addonPending;}handled=true;}
  if(a.type==='签到复核'&&o){const r=App.state.exceptions.find(x=>x.id===a.exceptionId);if(r){r.status=approved?'approved':'rejected';r.result=a.reason||'平台已处理';if(approved&&['accepted','enroute'].includes(o.status))App.updateOrder(o.id,{status:'arrived',arrivedAt:W.now(),checkinPhotos:r.photos,checkinDistance:r.distance},'平台复核确认到场');handled=true;}}
  if(a.type==='团队技能审核'){const m=s.members.find(x=>x.id===a.memberId);if(m){if(approved)m.skills=[...new Set([...m.skills,...a.skills])];m.pendingSkills=[];handled=true;}}
  if(a.type==='项目变更审核'){const p=s.projects.find(x=>x.id===a.projectId),change=p?.changes.find(x=>x.id===a.changeId);if(change){change.status=approved?'待客户确认':'已驳回';handled=true;}}
  if(a.type==='领料审核'){const r=s.materialRequests.find(x=>x.id===a.materialRequestId);if(r){r.status=approved?'待仓库出库':'已驳回';if(approved&&!App.state.approvals.some(x=>x.type==='材料出库确认'&&x.materialRequestId===r.id))App.state.approvals.push({id:'OUT'+Date.now(),type:'材料出库确认',name:r.name+' × '+r.quantity,materialRequestId:r.id,status:'pending',by:'配料申请',date:W.stamp()});handled=true;}}
  if(a.type==='材料出库确认'){const r=s.materialRequests.find(x=>x.id===a.materialRequestId);if(r){r.status=approved?'已出库':'出库待处理';handled=true;}}
  if(a.type==='退料确认'){const r=s.materialRequests.find(x=>x.id===a.materialRequestId);if(r){r.status=approved?'已退库':'已驳回';handled=true;}}
  if(a.type==='演示奖励审核'){const r=s.reward.applications.find(x=>x.id===a.rewardApplicationId);if(r&&r.status==='pending'){
   if(approved&&s.reward.used+r.amount<=s.reward.budget){r.status='approved';s.reward.used+=r.amount;if(!s.ledger.some(l=>l.id==='BONUS-'+r.id))s.ledger.push({id:'BONUS-'+r.id,owner:r.owner,name:'演示培训奖励',kind:'subsidy',amount:r.amount,status:'available',date:W.date(),ruleVersion:'演示活动'});}
   else{r.status='rejected';r.reason=approved?'预算已用完':a.reason;}handled=true;
  }}
  if(['暂停申请','取消申请','现场异常'].includes(a.type)&&o){const r=App.state.exceptions.find(x=>x.id===a.exceptionId);if(r){r.status=approved?'approved':'rejected';r.result=a.reason||'平台已处理';if(approved&&a.type==='暂停申请')o.flags={...o.flags,paused:true};if(approved&&a.type==='取消申请')o.status='terminated';handled=true;}}
  if(handled){a.workerAppliedV12=true;W.notify('system','申请处理结果',a.name+'：'+(approved?'审核通过':'已驳回'),'messages','',a.teamId||o?.teamId||a.workerId||'w1');save();}
 }
 const application=App.state.applications.find(a=>a.id===(s.applicationIds?.[W.actor()]||s.applicationId));
 if(application?.status==='approved'&&!application.workerAppliedV12){W.setVerified(true);W.profile().name=application.name;W.profile().skills=application.skills||W.profile().skills;application.workerAppliedV12=true;save();}
 for(const o of App.state.orders){
  if(o.demoV12&&o.status==='offered'&&o.offerExpiresAt&&Date.now()>o.offerExpiresAt){o.status='dispatching';o.invitedWorkerId=null;(o.logs??=[]).push(['指派邀请超时，转入合格师傅接单池',W.stamp()]);save();}
 }
 for(const o of W.jobs()){
  const q=o.quoteVersions?.at(-1);
  if(o.status==='quote'&&q?.expiresAt&&Date.now()>Date.parse(q.expiresAt)&&q.status==='customer'){q.status='expired';o.status='arrived';o.quoteApproved=false;save();}
 }
}
if(!W.state().materialRequests.length){
 W.state().materialRequests.push({id:'MR-SAMPLE',owner:'w1',workerId:'w1',orderId:'W12-WORK',materialId:'wall',name:'墙面修补材料',unit:'kg',quantity:2,kind:'领料',status:'已出库',date:W.date(-1)});
 W.state().creditRecords.push({id:'CR-LEGACY',name:'历史已核验调整',points:-2,date:W.date(-8),status:'历史快照'});
 const p=W.state().projects.find(x=>x.id==='PRJ-KITCHEN');if(p)p.stages[1].workerId='w2';
 W.state().messages.forEach(m=>{if(m.ref==='PRJ-KITCHEN')m.recipient='team1';});
 save();
}
const originalRender=App.render;
let context='',loadedEvidence=false,autosaveTimer;
function currentContext(){
 const hash=location.hash.split('?'),p=new URLSearchParams(hash[1]||'');
 return W.role()+':'+(p.get('id')||p.get('project')||'common');
}
function persistEvidence(){
 if(!context)return;
 W.state().evidence??={};W.state().evidence[context]={uploads:W.copy(App.uploads),signature:App.signature};
}
function saveDraftFields(){
 // Draft/unload writes must not roll back a customer's or finance's newer decision.
 let latest;try{latest=JSON.parse(localStorage.getItem('zhz-html-prototype-v3'));}catch{}
 if(latest?.version===3&&latest.workerV12){
  const local=W.state(),remote=latest.workerV12;
  remote.evidence??={};if(local.evidence?.[context])remote.evidence[context]=W.copy(local.evidence[context]);
  remote.rawDrafts??={};for(const [key,value] of Object.entries(local.rawDrafts||{}))if(key.startsWith(context+':'))remote.rawDrafts[key]=W.copy(value);
  const id=context.split(':').slice(1).join(':');
  for(const key of ['quote:'+id,'complete:'+id])if(local.drafts?.[key]){remote.drafts??={};remote.drafts[key]=W.copy(local.drafts[key]);}
  App.state=latest;
 }
 save();
}
function persistForms(){
 const st=W.state();st.rawDrafts??={};
 for(const f of document.querySelectorAll('form[data-form]')){
  if(['login','account-save','withdraw-submit','send-message'].includes(f.dataset.form))continue;
  const key=context+':'+f.dataset.form,fd=new FormData(f);
  st.rawDrafts[key]={};for(const k of new Set(fd.keys())){const vals=fd.getAll(k).filter(v=>typeof v==='string');st.rawDrafts[key][k]=vals;}
  if(f.dataset.form==='submit-quote'&&U.readQuote){st.drafts['quote:'+U.current().id]=U.readQuote(f);}
 }
 persistEvidence();saveDraftFields();
}
function restoreForms(){
 for(const f of document.querySelectorAll('form[data-form]')){
  const values=W.state().rawDrafts?.[context+':'+f.dataset.form];if(!values)continue;
  const index={};
  for(const el of f.elements){
   if(!el.name||el.type==='file'||el.readOnly||el.type==='hidden'||!values[el.name])continue;
   const vals=values[el.name];if(['checkbox','radio'].includes(el.type))el.checked=vals.includes(el.value);
   else{const i=index[el.name]||0;if(vals[i]!==undefined)el.value=vals[i];index[el.name]=i+1;}
  }
 }
}
App.render=function(){
 W.state();reconcile();
 const next=currentContext();
 if(context&&next!==context){clearTimeout(autosaveTimer);persistEvidence();saveDraftFields();}
 if(!loadedEvidence||next!==context){context=next;const evidence=W.state().evidence?.[context];App.uploads=W.copy(evidence?.uploads||{});App.signature=evidence?.signature||null;loadedEvidence=true;}
 originalRender();
};
App.afterRender=()=>{
 restoreForms();
 if(App.route==='quote')A['quote-calculate']();
 if(App.route==='withdraw'){const el=document.querySelector('input[name="amount"]');if(el)A['withdraw-calculate'](el);}
};
document.addEventListener('input',ev=>{if(!ev.target.closest('form[data-form]'))return;clearTimeout(autosaveTimer);autosaveTimer=setTimeout(persistForms,250);});
document.addEventListener('change',ev=>{if(ev.target.closest('form[data-form]')){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(persistForms,250);}});
window.addEventListener('beforeunload',()=>{persistEvidence();saveDraftFields();});
const publicRoutes=new Set(['login','join','join-status']);
for(const [route,render] of Object.entries(V)){
 V[route]=function(){if(W.state().loggedIn===false&&!publicRoutes.has(route))return U.page('师傅登录',U.emptyCard('请先登录','登录后查看工单、收入与团队资料。')+linkBtn('去登录','login','full mt16'));return render();};
}
App.render();
})();
