(function(){
'use strict';
const W=Worker,V=App.views,A=App.actions;
const n=W.num,c=W.cents,fmt=x=>money(n(x)/100),s=W.state;
const url=(route,p={})=>'#/'+route+(Object.keys(p).length?'?'+new URLSearchParams(p):'');
const link=(label,route,p={},cls='')=>`<a class="${cls}" href="${url(route,p)}">${label}</a>`;
const button=(label,action,extra='',cls='')=>`<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const group=(title,body,more='',route='')=>section(title,body,more,route);
const box=(title,body)=>card(`<h2 class="w-card-title">${title}</h2>${body}`);
const grid=(items,cls='')=>`<div class="w-grid ${cls}">${items.map(([label,route,ico,p])=>link(`<span class="w-tool-icon">${icon(ico||'grid',24)}</span><span>${label}</span>`,route,p||{})).join('')}</div>`;
const chips=(items,current,param='filter',route=App.route,extra={})=>`<div class="w-chips" aria-label="筛选">${items.map(([id,label])=>link(label,route,{...extra,[param]:id},'w-chip '+(id===current?'active':''))).join('')}</div>`;
const emptyCard=(title='暂无记录',desc='相关记录会显示在这里。')=>card(empty(title,desc,''));
const page=(title,body,foot='',nav='',options={})=>mobilePage(title,body,foot,nav,options);
const denied=(message='当前身份无法查看或操作这笔记录')=>page('记录不可用',emptyCard('记录不可用',message)+linkBtn('返回我的工单','orders','secondary full mt16'));
const current=()=>W.findOrder();
const check=(o,act=true)=>o&&(act?W.actionable(o):W.own(o));
function demand(o,states=[]){
 if(!check(o)){toast('当前身份没有这笔工单的执行权限');return false;}
 if(states.length&&!states.includes(o.status)){toast('工单状态已变化，请重新核对');return false;}
 return true;
}
const orderGate=(title,render,act=true)=>{const o=current();return check(o,act)?render(o):denied(!o?'请从工单列表选择具体订单。':'仅本单执行人可进行此操作。');};
const stateBadge=o=>badge(W.label(o),o.status==='completed'?'green':o.status==='cancelled'?'gray':'orange');
const orderTitle=o=>`<div class="w-order-summary">${serviceArt(o.serviceId||'faucet')}<div><h3>${e(o.title)}</h3><p>${e(o.spec||W.category(o))}</p><small>${e(o.id)}</small></div></div>`;
const note=text=>`<p class="w-note">${text}</p>`;
const shortAddress=o=>e(o.district||o.address?.match(/[^市]*区/)?.[0]?.replace('深圳','')||'南山区')+' · 接单后查看详细地址';
const flagBadges=o=>`${(o.addon&&o.addon.approved==null)?badge('增项待确认'):''}${o.flags?.paused?badge('已暂停','gray'):''}${o.flags?.dispute?badge('争议处理中','red'):''}${o.flags?.addonPayment?badge('增项待付款'):''}${o.flags?.quoteReview?badge('报价审核中'):''}${(o.aftersaleIds?.length||o.status==='aftersale')?badge('售后跟进'):''}`;
function next(o){
 const map={accepted:['导航出发','navigation'],enroute:['到场签到','checkin'],arrived:W.type(o)==='standard'?['核对服务范围','order']:['检测报价','quote'],quote:['查看报价','quote-history'],ready:['核对开工条件','order'],working:['施工记录','service'],addon:['查看增项','service'],acceptance:['查看完工记录','certificate'],completed:['服务凭证','certificate']};
 return map[o.status]||['查看详情','order'];
}
function jobCard(o,market=false,featured=false){
 const own=W.own(o),est=W.estimate(o),act=next(o),reason=market?W.canGrab(o):'';
 const invitation=market&&o.invitedWorkerId===W.actor();
 return `<article class="job-card ${featured?'is-current':''}"><div class="job-meta"><span class="w-category">${e(W.category(o))}</span><span>${market?badge(invitation?'定向邀请':'附近新单'):stateBadge(o)}</span></div>${link(`<h3>${e(o.title)}</h3>`,'order',{id:o.id},'job-body')}<p>${icon('pin',15)}<span>${own?e(o.address):shortAddress(o)}</span></p><p class="job-time">${icon('clock',15)}<span>${e(o.time)}</span><span class="job-distance">${n(o.distance||1.2)}km</span></p><div class="w-order-flags">${flagBadges(o)}</div><div class="job-bottom"><div class="job-amount"><small>${o.teamId?'合同劳务报酬':'预计劳务报酬'}</small><strong class="job-price">${est===null?'待核算':'¥'+fmt(est)}</strong></div>${market?`<div class="w-actions">${invitation?button('拒绝','decline-order',`data-id="${e(o.id)}"`,'plain small'):''}${button(invitation?'接受邀请':'立即接单','grab',`data-id="${e(o.id)}" ${reason?'disabled title="'+e(reason)+'"':''}`,'small')}</div>`:linkBtn(act[0],W.actionable(o)?act[1]:'order','small',{id:o.id})}</div>${reason?note(e(reason)):''}</article>`;
}
function dateRail(selected,route='orders'){
 return `<div class="w-date-rail">${[[-1,'昨天'],[0,'今天'],[1,'明天'],[2,'后天'],[3,'三天后']].map(([delta,l])=>link(`<small>${l}</small><strong>${W.date(delta).slice(8)}</strong>`,route,{date:W.date(delta)},'w-date '+(selected===W.date(delta)?'active':''))).join('')}${link(`${icon('clipboard',20)}<small>全部</small>`,route,{date:'all'},'w-date '+(selected==='all'?'active':''))}</div>`;
}
function quoteTotal(q){return c(q.visit)+c(q.labor)+c(q.material);}
function quoteLines(o){
 return (o.quoteVersions||[]).at(-1)?.lines||[{name:'人工服务',quantity:1,unit:'项',labor:n(o.quote?.labor),material:0,owner:'师傅采购'},{name:'配件材料',quantity:1,unit:'批',labor:0,material:n(o.quote?.material),owner:'师傅采购'}];
}
function requiredPayment(o){return W.type(o)==='project'?c(o.amount)*.3:c(o.amount)<=200000?c(o.amount):Math.round(c(o.amount)*.5);}
function paymentCopy(o){return W.type(o)==='project'?'按合同30%／40%／30%节点付款':c(o.amount)<=200000?'普通服务开工前付清':'大额维修开工前支付50%，验收后支付50%';}
function clearEvidence(){App.uploads={};App.signature=null;}
V.home=()=>{
 const list=W.jobs(),currentJob=list.find(o=>o.status==='working')||list.find(o=>['accepted','enroute','arrived','ready','quote'].includes(o.status)),b=W.balances(),unread=s().messages.filter(m=>m.unread&&(!m.recipient||m.recipient===W.owner())).length;
 return page('工作台',`<section class="w-home-head"><div class="w-home-person"><div class="flex gap12">${avatar(W.role()==='member'?'陈':'李')}<div><h2>${W.role()==='leader'?'安心家修团队':W.role()==='member'?'陈师傅':'李师傅'}</h2><p>${W.verified()?'已认证':'待认证'} · ${W.role()==='leader'?'团队负责人':W.role()==='member'?'团队执行成员':'独立师傅'}</p></div></div>${link(`${icon('bell',23)}${unread?'<i class="unread-dot"></i>':''}`,'messages',{},'icon-btn w-message-link')+''}</div><div class="w-home-status"><span>${W.online()?'在线接单':'休息中'} · ${n(W.preferences().radius||5)}km 服务范围</span>${toggle('接单状态','online',W.online(),'','worker-online')}</div></section>
 <div class="w-home-metrics">${[['今日预计报酬','¥'+fmt(list.filter(o=>(o.time||'').startsWith(W.date())).reduce((a,o)=>a+(W.estimate(o)||0),0)),'income'],['今日待办',String(list.filter(o=>W.active(o)&&(o.time||'').startsWith(W.date())).length),'schedule'],['待验收',String(list.filter(o=>o.status==='acceptance').length),'orders']].map(([l,v,r])=>link(`<strong>${v}</strong><span>${l}</span>`,r)).join('')}</div>
 ${!W.verified()?notice('认证通过后可接单，先完善入驻资料。','orange'):W.credit()<80?notice('当前信用影响新单承接，可在信用记录查看处理办法。','orange'):''}
 ${card(grid([['接单大厅','hall','grid'],['我的日程','schedule','clock'],['项目管理','projects','building'],['知识案例','knowledge','school']]),'w-shortcuts')}
 ${currentJob?group('当前待办',jobCard(currentJob,false,true),'全部工单','orders'):group('当前待办',emptyCard('暂无待办','保持在线，新的需求会及时通知您。'))}
 ${group('附近新单',W.available().slice(0,2).map(o=>jobCard(o,true)).join('')||emptyCard('附近暂无新单','调整品类或服务时段后再看看。'),'接单大厅','hall')}
 ${card(`<div class="w-training-strip"><span class="w-tool-icon">${icon('shield',23)}</span><div><strong>服务有标准，接单更安心</strong><p>学习现场报价与完工验收规范</p></div>${link(icon('arrow',19),'training',{},'icon-btn')}</div>`)}${note('页面使用本地演示数据 · PRD V1.2')}`,'','home',{edge:true});
};
A['worker-online']=el=>{if(el.checked&&(!W.verified()||W.credit()<60)){el.checked=false;toast('认证或信用状态暂不允许新接单');return;}W.setOnline(el.checked);App.save();App.render();};
V.hall=()=>{
 const sort=App.query.get('sort')||'match',cat=App.query.get('category')||'all';
 let list=W.available().filter(o=>cat==='all'||W.category(o)===cat);
 list.sort(sort==='distance'?(a,b)=>n(a.distance)-n(b.distance):sort==='price'?(a,b)=>(W.estimate(b)||0)-(W.estimate(a)||0):(a,b)=>n(b.match||90)-n(a.match||90));
 return page('接单大厅',`${card(`<div class="between"><strong>${W.online()?'在线接单中':'当前休息中'}</strong>${link('接单设置'+icon('arrow',14),'preferences',{},'text-link')}</div>${note('仅展示接单范围内的可见需求，接单仍校验资质、排班和当前状态。')}`)}
 ${chips([['match','综合推荐'],['distance','距离最近'],['price','报酬优先']],sort,'sort','hall',{category:cat})}
 <form class="w-inline-filter" data-form="hall-filter">${selectField('服务品类','category',[['all','全部品类'],...W.categories.flatMap(x=>x[1]).map(x=>[x,x])],cat)}<input type="hidden" name="sort" value="${e(sort)}"><button class="btn small secondary">筛选</button></form>
 ${list.map(o=>jobCard(o,true)).join('')||emptyCard('没有匹配的新单','试试其他筛选条件。')}${note('综合推荐：距离35% · 技能25% · 履约20% · 负载10% · 响应10%。定向邀请有效30秒。')}`);
};
A['hall-filter']=(f,fd)=>App.go('hall',Object.fromEntries(fd));
A.grab=el=>{
 const o=W.findOrder(el.dataset.id),reason=W.canGrab(o);
 if(reason){toast(reason);return;}
 confirmAction('确认接下这笔服务？',`${e(o.title)}<br>${shortAddress(o)}<br>预约：${e(o.time)}<br>劳务报酬以本单有效结算约定为准。`,()=>{
  const error=W.canGrab(o);if(error){toast(error);return;}
  App.updateOrder(o.id,{workerId:W.actor(),teamId:W.isLeader()?'team1':undefined,status:'accepted',takenAt:W.now()},'师傅已接受服务邀请');
  clearEvidence();W.notify('order','接单成功',o.title,'order',o.id);App.go('order',{id:o.id});
 },'确认接单');
};
A['decline-order']=el=>{const o=W.findOrder(el.dataset.id);if(!o||o.invitedWorkerId!==W.actor()||o.workerId)return;confirmAction('拒绝本次邀请','拒绝后交由平台继续匹配，不影响已接工单。',()=>{(o.declinedBy??=[]).push(W.actor());o.invitedWorkerId=null;o.status='dispatching';App.save();App.render();},'确认拒绝');};
V.orders=()=>{
 const filter=App.query.get('filter')||'all',day=App.query.get('date')||'all',q=App.query.get('q')||'';
 const matches=(o,f)=>f==='all'||f==='accepted'&&['accepted','enroute'].includes(o.status)||f==='diagnosis'&&['arrived','quote'].includes(o.status)||f==='working'&&['working','addon'].includes(o.status)||f==='cancelled'&&['cancelled','terminated','refunded'].includes(o.status)||o.status===f;
 const base=W.jobs().filter(o=>(day==='all'||o.time?.startsWith(day))&&(!q||[o.title,o.id].join(' ').includes(q)));
 const items=[['all','全部'],['accepted','待上门'],['diagnosis','检测报价'],['ready','待开工'],['working','服务中'],['acceptance','待验收'],['completed','已完成'],['cancelled','已取消']];
 const list=base.filter(o=>matches(o,filter));
 return page('我的工单',`${card(`<form class="w-search-form" data-form="order-search"><label class="search-box">${icon('search',18)}<input name="q" value="${e(q)}" placeholder="搜索服务名称或工单号" aria-label="搜索工单"></label><button class="btn small secondary">搜索</button></form>`)}
 ${card(dateRail(day),'w-calendar-card')}<div class="w-state-grid">${items.map(([id,l])=>link(`<strong>${base.filter(o=>matches(o,id)).length}</strong><span>${l}</span>`,'orders',{filter:id,date:day,q},'w-state-item '+(filter===id?'active':''))).join('')}</div>
 ${card(grid([['异常记录','exceptions','alert'],['售后返修','aftersales','shield'],['报价记录','quote-history','file'],['接单大厅','hall','grid']]),'w-compact-tools')}
 <div class="w-list-caption">共 ${list.length} 笔工单</div>${list.map(o=>jobCard(o)).join('')||emptyCard('暂无相关工单','更换日期或状态筛选。')}`,'','orders',{edge:true});
};
A['order-search']=(f,fd)=>App.go('orders',{q:String(fd.get('q')||'').trim()});
V.schedule=()=>{
 const day=App.query.get('date')||W.date(),list=W.jobs().filter(o=>o.time?.startsWith(day)&&W.active(o)).sort((a,b)=>a.time.localeCompare(b.time));
 return page('我的日程',`${card(dateRail(day,'schedule'))}${note('相邻预约保留至少30分钟交通缓冲，同一时刻最多1个施工中工单。')}${list.map(o=>jobCard(o,false)).join('')||emptyCard('当天暂无预约','可以前往接单大厅查看合适的新单。')}${linkBtn('设置可接单时段','preferences','secondary full mt16')}`);
};
V.order=()=>{
 const o=current(),market=W.available().some(x=>x.id===o?.id);
 if(!o||!W.own(o)&&!market)return denied();
 if(market)return page('需求详情',`${card(orderTitle(o))}${card(`${row('区域',shortAddress(o))}${row('预约',e(o.time))}${row('预计劳务报酬',W.estimate(o)==null?'待核算':'¥'+fmt(W.estimate(o)))}${row('服务范围',e(o.spec||'按已确认服务范围'))}`)}${notice('接受订单后开放完整地址、客户联系方式和履约资料。')}`,button('确认接单','grab',`data-id="${e(o.id)}" ${W.canGrab(o)?'disabled':''}`,'full'));
 const can=W.actionable(o),q=o.quote||{},step=W.status[o.status]?.[1]??0,amount=quoteTotal(q),est=W.estimate(o);
 let footer='';
 if(can){
  if(o.status==='accepted')footer=linkBtn('联系客户','chat','secondary',{id:o.id})+button('导航出发','depart','data-id="'+e(o.id)+'"');
  else if(o.status==='enroute')footer=linkBtn('到场签到','checkin','full',{id:o.id});
  else if(o.status==='arrived')footer=W.type(o)==='standard'?button('确认原范围，进入待开工','standard-ready','data-id="'+e(o.id)+'"','full'):o.flags?.quoteReview?linkBtn('查看报价审核','quote-history','full',{id:o.id}):linkBtn('检测并提交报价','quote','full',{id:o.id});
  else if(o.status==='quote')footer=linkBtn('查看已提交报价','quote-history','full secondary',{id:o.id});
  else if(o.status==='ready')footer=button(c(o.paid)>=requiredPayment(o)?'确认开始服务':'等待约定款项支付','start-work',`data-id="${e(o.id)}" ${c(o.paid)<requiredPayment(o)?'disabled':''}`,'full');
  else if(['working','addon'].includes(o.status))footer=linkBtn('施工记录','service','secondary',{id:o.id})+linkBtn('上报完工','complete','',{id:o.id});
  else if(o.status==='acceptance')footer=button('提醒客户验收','remind-acceptance','data-id="'+e(o.id)+'"','secondary')+linkBtn('查看凭证','certificate','',{id:o.id});
  else if(o.status==='completed')footer=linkBtn('服务凭证','certificate','full',{id:o.id});
 }
 return page('工单详情',`<div class="status-hero"><div class="between"><h1>${W.label(o)}</h1>${badge(W.type(o)==='standard'?'明码服务':W.type(o)==='project'?'项目勘测':'检测后报价')}</div><p>${o.status==='acceptance'?'已上报完工，等待客户验收。':o.status==='quote'?'等待客户确认报价，确认前不能开工。':o.status==='ready'?paymentCopy(o):'按确认范围履约，过程与费用有记录。'}</p><div class="w-order-flags">${flagBadges(o)}</div></div>
 ${step>=0?stepper(['接单','上门','报价','施工','验收','完成'],step):''}
 ${box('客户与预约',`<div class="order-contact">${avatar(o.name||'客户')}<div><h3>${e(o.name||'客户')}</h3><p>订单内联系 · 实名信息保护</p></div>${can?button(icon('phone',20),'worker-call',`data-id="${e(o.id)}" aria-label="联系客户"`,'icon-btn secondary'):''}</div>${row('服务地址',e(o.address))}${row('预约时间',e(o.time))}${can?linkBtn('订单沟通','chat','secondary full mt12',{id:o.id}):note('团队负责人可查看本团队工单，执行操作由本单师傅完成。')}`)}
 ${box('服务范围',orderTitle(o)+`<p class="w-body-copy">${e(o.remark||'按客户确认的服务规格和范围履约。')}</p>`+link('查看获授权的房屋记录'+icon('arrow',15),'house',{id:o.id},'text-link'))}
 ${box('报价与付款条件',`${row('客户订单金额','¥'+money(o.amount))}${row('已支付','¥'+money(o.paid))}${row('本阶段开工应付','¥'+fmt(requiredPayment(o)))}${row('预计劳务报酬',est===null?'按审批合同核算':'¥'+fmt(est))}${note(paymentCopy(o)+'。劳务报酬与材料采购款分开结算。')}${(o.quoteVersions||[]).length?linkBtn('报价版本与确认记录','quote-history','plain full',{id:o.id}):''}`)}
 ${o.beforePhotos?.length||o.report?box('施工凭证',`<p class="w-body-copy">${e(o.report||'已保存现场记录')}</p>${linkBtn('查看完工资料','certificate','secondary full',{id:o.id})}`):''}
 ${group('工单进度',card(timeLine(o.logs?.length?o.logs:[['工单已分配',o.created||W.date()]])))}
 ${can&&W.active(o)?linkBtn('异常／改约／转派申请','exception','plain full mt16',{id:o.id}):''}${W.isLeader()?linkBtn('调整执行分工','team-assign','secondary full mt12',{id:o.id}):''}`,footer);
};
A.depart=el=>{const o=W.findOrder(el.dataset.id);if(!demand(o,['accepted']))return;App.updateOrder(o.id,{status:'enroute'},'师傅已出发');App.go('navigation',{id:o.id});};
A['worker-call']=el=>{const o=W.findOrder(el.dataset.id);if(!check(o,false))return;dialog('联系客户',`<p>${e(o.name||'客户')} · 本单联系通道</p>${note('演示不拨打真实电话，可使用站内图文沟通。')}`,linkBtn('发送消息','chat','',{id:o.id})+button('关闭','close-dialog','','secondary'));};
V.navigation=()=>orderGate('上门导航',o=>page('上门导航',`${card(`<h2>${e(o.address)}</h2><p class="w-body-copy">预约 ${e(o.time)}</p>${mapView(true)}${note('路线为演示示意，定位与导航需在小程序中接入。')}`)}${linkBtn('联系客户','chat','secondary full mt16',{id:o.id})}`,linkBtn('到场拍照签到','checkin','full',{id:o.id})));
V.checkin=()=>orderGate('到场签到',o=>page('到场签到',`${card(`<h2>确认到达服务现场</h2><p class="w-body-copy">${e(o.address)}</p>${mapView()}`)}<form id="checkin-form" data-form="checkin">${card(`${field('距服务地址（演示米数）','distance',120,'number','required min="0" max="99999" step="1"')}${photoField('现场签到照片 *','checkin',3)}${textarea('定位异常说明','reason','',300,'placeholder="定位失败或超出500米时填写原因，交客户或平台复核"')}`)}</form>${notice('正常签到范围500米；超出范围或定位失败，需提交照片和说明后等待复核。')}`,`<button class="btn full" type="submit" form="checkin-form" ${!['accepted','enroute'].includes(o.status)?'disabled':''}>提交到场记录</button>`));
A.checkin=(f,fd)=>{
 const o=current();if(!demand(o,['accepted','enroute']))return;
 if(!App.uploads.checkin?.length){toast('请上传现场签到照片');return;}
 const distance=n(fd.get('distance'));
 if(distance>500){
  if(String(fd.get('reason')||'').trim().length<5){toast('请填写至少5字的定位异常说明');return;}
  const record={id:'EX'+Date.now(),order:o.id,type:'签到异常',reason:fd.get('reason'),photos:W.copy(App.uploads.checkin),distance,action:'checkin',workerId:W.actor(),status:'pending',date:W.stamp()};
  App.state.exceptions.push(record);App.state.approvals.push({id:'AP'+Date.now(),type:'签到复核',name:o.title,orderId:o.id,exceptionId:record.id,workerId:W.actor(),status:'pending',by:'师傅',date:W.stamp()});App.save();toast('已提交到场复核，尚未完成签到');App.go('exceptions',{id:o.id});return;
 }
 App.updateOrder(o.id,{status:'arrived',checkinPhotos:W.copy(App.uploads.checkin),checkinDistance:distance,arrivedAt:W.now()},'到场签到成功');
 App.go(W.type(o)==='standard'?'order':'quote',{id:o.id});
};
A['standard-ready']=el=>{const o=W.findOrder(el.dataset.id);if(!demand(o,['arrived'])||W.type(o)!=='standard')return;App.updateOrder(o.id,{status:'ready',quoteApproved:true,ruleVersion:'1.2'},'核对明码服务范围，等待满足开工条件');App.render();};
A['start-work']=el=>{
 const o=W.findOrder(el.dataset.id);if(!demand(o,['ready']))return;
 if(!o.quoteApproved||c(o.paid)<requiredPayment(o)){toast('客户确认和约定付款条件尚未满足');return;}
 if(W.hasActiveWork(o.id)){toast('当前已有施工中工单，请先完成或经平台处理');return;}
 if(o.flags?.paused||o.flags?.dispute){toast('工单暂停或争议尚未处理');return;}
 App.updateOrder(o.id,{status:'working',startedAt:W.now()},'师傅确认开工');App.go('service',{id:o.id});
};
function readQuote(form){
 const fd=new FormData(form),names=fd.getAll('lineName'),qty=fd.getAll('quantity'),lab=fd.getAll('laborPrice'),mat=fd.getAll('materialPrice'),units=fd.getAll('unit'),owners=fd.getAll('materialOwner');
 const lines=names.map((name,i)=>({name:String(name).trim(),quantity:n(qty[i]),unit:units[i],labor:n(lab[i]),material:n(mat[i]),owner:owners[i]}));
 return {lines,visit:n(fd.get('visit')),labor:lines.reduce((a,l)=>a+Math.round(c(l.labor)*l.quantity),0)/100,material:lines.reduce((a,l)=>a+Math.round(c(l.material)*l.quantity),0)/100,reason:String(fd.get('reason')||'').trim(),fault:String(fd.get('fault')||'').trim()};
}
function quoteDraft(o){
 return s().drafts['quote:'+o.id]||{lines:quoteLines(o),visit:W.type(o)==='inspection'?50:W.type(o)==='project'?150:0,reason:'',fault:o.remark||''};
}
V.quote=()=>orderGate('检测报价',o=>{
 const draft=quoteDraft(o),editable=o.status==='arrived'&&!o.flags?.quoteReview;
 return page('检测报价',`${card(orderTitle(o))}${notice('比较同规格、同数量的人工参考上限，材料费与已收检测费不参与偏离比例。')}<form id="quote-form" data-form="submit-quote">
 ${card(`${textarea('现场故障与处理范围 *','fault',draft.fault,500,'required minlength="5"')}${field('本项人工参考单价上限（元）','reference',o.referenceLabor||o.quote?.labor||0,'number','readonly')}${field('检测／勘测费用（元）','visit',draft.visit,'number','readonly')}${note('已支付的检测／勘测费用计入总价一次，付款时抵扣已付金额。')}`)}
 <div class="w-quote-lines">${draft.lines.map((l,i)=>card(`<div class="between"><h3>明细 ${i+1}</h3>${draft.lines.length>1?button('删除','quote-remove-line',`data-index="${i}" type="button"`,'plain small'):''}</div>${field('服务或材料名称','lineName',l.name,'text','required maxlength="60"') }<div class="w-form-two">${field('数量','quantity',l.quantity,'number','required min="0.01" max="10000" step="0.01" data-input="quote-calculate"')}${selectField('单位','unit',['项','个','米','㎡','套','批'],l.unit)}</div><div class="w-form-two">${field('人工单价','laborPrice',l.labor,'number','required min="0" max="100000" step="0.01" data-input="quote-calculate"')}${field('材料单价','materialPrice',l.material,'number','required min="0" max="100000" step="0.01" data-input="quote-calculate"')}</div>${selectField('材料提供方','materialOwner',['师傅采购','公司供料','客户自备'],l.owner)}`)).join('')}</div>
 ${button('添加一项明细','quote-add-line','type="button"','secondary full mb16')}
 ${card(`${textarea('报价依据及偏离原因','reason',draft.reason,500,'placeholder="超人工参考上限15%需说明，达到审核门槛先提交平台审核"')}${photoField('现场检测照片','quote',6)}${row('报价合计','<strong id="quote-total">—</strong>')}${row('已付费用','¥'+money(o.paid))}<div id="quote-deviation"></div>`)}
 </form>${note('正式报价有效72小时，每次提交保留版本和客户确认记录。')}`,button('保存草稿','save-quote-draft','','secondary')+`<button class="btn" type="submit" form="quote-form" ${!editable?'disabled':''}>提交报价</button>`);
});
function storeQuoteDraft(){const o=current(),f=document.getElementById('quote-form');if(o&&f){s().drafts['quote:'+o.id]=readQuote(f);App.save();}}
A['save-quote-draft']=()=>{storeQuoteDraft();toast('报价草稿已保存');};
A['quote-add-line']=()=>{storeQuoteDraft();const d=s().drafts['quote:'+current().id];if(d.lines.length>=10){toast('每次报价最多10项明细');return;}d.lines.push({name:'',quantity:1,unit:'项',labor:0,material:0,owner:'师傅采购'});App.save();App.render();};
A['quote-remove-line']=el=>{storeQuoteDraft();s().drafts['quote:'+current().id].lines.splice(n(el.dataset.index),1);App.save();App.render();};
A['quote-calculate']=()=>{
 const f=document.getElementById('quote-form');if(!f)return;
 const q=readQuote(f),o=current(),r=W.quoteCheck(o,q);
 document.getElementById('quote-total').textContent='¥'+fmt(quoteTotal(q));
 document.getElementById('quote-deviation').innerHTML=notice(e(r.reason)+(r.confirm?'；偏离 '+(r.ratio*100).toFixed(1)+'%':''),r.review||r.confirm?'orange':'green');
};
A['submit-quote']=(f,fd)=>{
 const o=current();if(!demand(o,['arrived'])||o.flags?.quoteReview)return;
 const q=readQuote(f),r=W.quoteCheck(o,q);
 if(q.fault.length<5||!q.lines.length||q.lines.some(l=>!l.name||!l.quantity||l.quantity<0||l.labor<0||l.material<0)||quoteTotal(q)<=0){toast('请完整填写故障、明细数量及有效金额');return;}
 if(q.lines.some(l=>l.owner==='客户自备'&&l.material>0)){toast('客户自备材料不能重复收材料费');return;}
 if((r.confirm||r.review)&&q.reason.length<5){toast('请填写至少5字的报价依据或偏离原因');return;}
 const version={...q,id:'QV'+Date.now(),version:(o.quoteVersions?.length||0)+1,total:quoteTotal(q)/100,status:r.review?'platform':'customer',createdAt:W.now(),expiresAt:new Date(Date.now()+72*3600000).toISOString(),requiresSecondConfirmation:r.confirm,workerId:W.actor(),ruleVersion:'1.2'};
 o.ruleVersion='1.2';o.quoteVersions??=[];o.quoteVersions.push(version);
 if(r.review){
  o.flags={...o.flags,quoteReview:version.id};
  App.state.approvals.push({id:'AP'+Date.now(),type:'报价审核',name:o.title,orderId:o.id,quoteVersionId:version.id,status:'pending',by:'师傅',reason:q.reason,date:W.stamp()});
  App.updateOrder(o.id,{},'正式报价V'+version.version+'已提交平台审核');toast('报价已提交审核，审核通过后再由客户确认');
 }else{
  App.updateOrder(o.id,{status:'quote',quote:{visit:q.visit,labor:q.labor,material:q.material},amount:version.total,quoteApproved:false,ruleVersion:'1.2',fault:q.fault},'提交正式报价V'+version.version+'，等待客户确认');
  toast('已发送客户确认');
 }
 delete s().drafts['quote:'+o.id];W.notify('change','报价已提交',o.title,'quote-history',o.id);App.save();App.go('quote-history',{id:o.id});
};
V['quote-history']=()=>{
 const o=current(),list=o?(W.own(o)?[o]:[]):W.jobs().filter(x=>x.quoteVersions?.length);
 if(o&&!W.own(o))return denied();
 return page('报价记录',list.map(x=>box(e(x.title),(x.quoteVersions||[]).slice().reverse().map(v=>`<div class="w-record"><div class="between"><h3>报价 V${v.version}</h3>${badge({platform:'平台审核中',customer:'待客户确认',accepted:'客户已确认',rejected:'客户已退回',expired:'已过期'}[v.status]||v.status)}</div>${row('检测／勘测费','¥'+money(v.visit))}${row('人工','¥'+money(v.labor))}${row('材料','¥'+money(v.material))}${row('合计','<strong>¥'+money(v.total)+'</strong>')}${note(e(v.reason||v.fault||'按标准服务范围报价'))}${note('提交：'+e(v.createdAt?.slice(0,16).replace('T',' '))+' · 有效72小时')}${v.requiresSecondConfirmation?notice('人工费超过参考上限15%，客户需二次确认。','orange'):''}</div>`).join('')||note('本单采用已确认的明码服务规格。'))).join('')||emptyCard('暂无报价记录','现场检测后提交的报价会保留在这里。'));
};
V.service=()=>orderGate('施工记录',o=>page('施工记录',`${card(orderTitle(o))}${(o.addon&&o.addon.approved==null)||o.flags?.paused?notice('存在待确认增项或暂停标记，请按原确认范围执行。','orange'):''}
 ${box('服务步骤',['现场防护','按确认方案施工','功能测试','清洁与恢复'].map((x,i)=>`<label class="w-step-check"><input type="checkbox" data-change="service-step" data-index="${i}" ${(o.stepsDone||[]).includes(i)?'checked':''}><span>${x}</span></label>`).join(''))}
 ${box('用料记录',(o.materials||[]).map(m=>`<div class="w-record"><strong>${e(m.name)}</strong><p>${n(m.quantity)}${e(m.unit)} · ${e(m.owner||'师傅采购')} · 成本¥${money(m.cost)}</p></div>`).join('')||note('暂无用料记录，完工时须明确有用料或无用料。'))}
 ${card(`<form id="material-form" data-form="material-add">${field('材料名称','name','','text','required maxlength="50"')}<div class="w-form-two">${field('数量','quantity',1,'number','required min="0.01" max="10000" step="0.01"')}${selectField('单位','unit',['个','米','套','批'])}</div><div class="w-form-two">${field('实际成本（元）','cost',0,'number','required min="0" max="50000" step="0.01"')}${selectField('材料归属','owner',['师傅采购','公司供料','客户自备'])}</div><button class="btn secondary full">保存用料</button></form>`)}
 <form id="progress-form" data-form="save-progress">${card(`${textarea('施工记录','progressNote',o.progressNote||'',500)}${photoField('施工过程照片','progress',6)}`)}</form>
 ${linkBtn('申请新增服务','addon','secondary full mt16',{id:o.id})}${linkBtn('查看领料与退料','materials','plain full mt12',{id:o.id})}`,button('保存过程记录','save-progress','','secondary')+linkBtn('上报完工','complete','',{id:o.id})));
A['service-step']=el=>{const o=current();if(!demand(o,['working','addon']))return;const set=new Set(o.stepsDone||[]);el.checked?set.add(n(el.dataset.index)):set.delete(n(el.dataset.index));o.stepsDone=[...set];App.save();};
A['material-add']=(f,fd)=>{const o=current();if(!demand(o,['working','addon']))return;const rec={id:'MAT'+Date.now(),name:String(fd.get('name')).trim(),quantity:n(fd.get('quantity')),unit:fd.get('unit'),cost:n(fd.get('cost')),owner:fd.get('owner')};(o.materials??=[]).push(rec);App.save();App.render();toast('用料已保存');};
A['save-progress']=()=>{const o=current();if(!demand(o,['working','addon']))return;const f=document.getElementById('progress-form'),fd=new FormData(f);o.progressNote=fd.get('progressNote');o.progressPhotos=W.copy(App.uploads.progress||[]);App.save();toast('施工记录已保存');};
V.addon=()=>orderGate('申请增项',o=>page('申请增项',`${card(orderTitle(o))}${notice('增项未确认前不得新增施工或收费，客户拒绝后保持原确认范围。','orange')}<form id="addon-form" data-form="submit-addon">${card(`${field('新增服务名称 *','name','','text','required maxlength="50"')}${field('新增服务费（元） *','amount','','number','required min="0.01" max="100000" step="0.01"')}${field('工期影响（分钟） *','minutes',30,'number','required min="0" max="43200"')}${textarea('原因及新增范围 *','reason','',500,'required minlength="5"')}${photoField('现场证据照片 *','addon-evidence',6)}`)}</form>${note('累计增项服务费超过原服务费30%或达到500元，先交平台审核。')}`,`<button class="btn full" type="submit" form="addon-form" ${o.status!=='working'||(o.addon&&o.addon.approved==null)?'disabled':''}>提交增项</button>`));
A['submit-addon']=(f,fd)=>{
 const o=current();if(!demand(o,['working'])||(o.addon&&o.addon.approved==null))return;
 if(!App.uploads['addon-evidence']?.length){toast('请上传增项证据照片');return;}
 const amount=n(fd.get('amount')),review=W.addonsReview(o,amount),ad={id:'AD'+Date.now(),name:fd.get('name'),amount,minutes:n(fd.get('minutes')),reason:fd.get('reason'),photos:W.copy(App.uploads['addon-evidence']),approved:null,status:review?'platform':'customer',createdAt:W.now(),baseAmount:o.amount};
 o.baseServiceAmount??=n(o.quote?.labor)+n(o.quote?.visit);o.addon=ad;(o.addonHistory??=[]).push(ad);
 if(review)App.state.approvals.push({id:'AP'+Date.now(),type:'增项审核',name:ad.name,orderId:o.id,addonId:ad.id,status:'pending',by:'师傅',date:W.stamp()});
 o.flags={...o.flags,addonPending:ad.id};App.updateOrder(o.id,{},review?'增项已提交平台审核':'增项等待客户确认');App.go('order',{id:o.id});
};
V.complete=()=>orderGate('完工上报',o=>{
 const d=s().drafts['complete:'+o.id]||{},signature=c(o.amount)>200000||W.type(o)==='project';
 return page('完工上报',`${card(orderTitle(o))}<form id="complete-form" data-form="submit-complete">${card(`${textarea('实际完成内容与测试结果 *','report',d.report||o.report||'',800,'required minlength="5"')}${field('实际用时（分钟） *','duration',d.duration||60,'number','required min="1" max="43200"')}${selectField('用料情况 *','materialStatus',[['','请选择'],['recorded','已登记用料'],['none','本次无用料']],d.materialStatus||'', 'required')}${photoField('维修前照片 *','before',6)}${photoField('维修后照片 *','after',6)}`)}
 ${signature?box('客户现场确认凭证',`${note('本单需客户电子签名或经核验的书面验收记录，现场签名不代替客户账号最终验收。')}<canvas id="signature" width="600" height="240" class="signature" aria-label="客户现场签名"></canvas>${button('清除重签','clear-signature','type="button"','plain small')}${photoField('书面确认凭证（可替代签名）','written-acceptance',3)}`):''}</form>
 ${notice(c(o.amount)<=200000&&!['project'].includes(W.type(o))&&!['防水补漏','柜类定制','空间局改','天地墙翻新'].includes(W.category(o))?'普通小额服务凭证齐全且无异议时，按约定72小时自动验收，24/48小时提醒。':'本单需客户明确验收，超过72小时转人工跟进。')}`,
 button('保存草稿','save-complete-draft','','secondary')+`<button class="btn" type="submit" form="complete-form" ${!['working','addon'].includes(o.status)||(o.addon&&o.addon.approved==null)||o.flags?.paused||o.flags?.addonPayment?'disabled':''}>提交完工</button>`);
});
A['save-complete-draft']=()=>{const o=current(),f=document.getElementById('complete-form');if(!check(o)||!f)return;W.saveDraft('complete:'+o.id,f);toast('完工草稿已保存');};
A['submit-complete']=(f,fd)=>{
 const o=current();if(!demand(o,['working','addon'])||(o.addon&&o.addon.approved==null)||o.flags?.paused||o.flags?.dispute||o.flags?.addonPayment){toast('请先处理未确认增项、暂停或争议');return;}
 if(!App.uploads.before?.length||!App.uploads.after?.length){toast('请分别上传维修前、维修后照片');return;}
 if(fd.get('materialStatus')==='recorded'&&!o.materials?.length){toast('请先在施工记录中登记用料');return;}
 if((c(o.amount)>200000||W.type(o)==='project')&&!App.signature&&!App.uploads['written-acceptance']?.length){toast('本单需现场签名或书面确认凭证');return;}
 const submit=()=>{if(!demand(o,['working','addon']))return;App.updateOrder(o.id,{status:'acceptance',report:fd.get('report'),duration:n(fd.get('duration'))+'分钟',materialStatus:fd.get('materialStatus'),beforePhotos:W.copy(App.uploads.before),afterPhotos:W.copy(App.uploads.after),signature:App.signature,writtenAcceptance:W.copy(App.uploads['written-acceptance']||[]),completedAt:W.now()},'师傅上报完工，待客户验收');delete s().drafts['complete:'+o.id];W.notify('change','完工资料已提交',o.title,'certificate',o.id);App.go('order',{id:o.id});};
 confirmAction('提交完工资料','提交后进入待验收，客户验收与款项到账分别记录。',submit,'提交完工');
};
A['remind-acceptance']=el=>{const o=W.findOrder(el.dataset.id);if(!demand(o,['acceptance']))return;if(o.lastReminderAt&&Date.now()-Date.parse(o.lastReminderAt)<3600000){toast('本小时已提醒，请稍后再试');return;}o.lastReminderAt=W.now();App.state.notices.unshift({title:'请确认服务验收',content:o.title+'的完工资料已提交。',type:'order',time:'刚刚',unread:true});App.save();toast('验收提醒已发送');};
V.certificate=()=>orderGate('服务凭证',o=>page('服务凭证',`${card(orderTitle(o))}${box('服务记录',`${row('履约状态',W.label(o))}${row('客户验收',o.acceptedAt?e(o.acceptedAt.slice(0,10)):'等待客户确认')}${row('服务费用','¥'+money(o.amount))}<p class="w-body-copy">${e(o.report||'尚未提交完工内容')}</p>${note('质保从对应服务验收合格起算，结算与到账单独查询。')}`)}
 ${box('维修前后照片',`<div class="w-proof-grid">${(o.beforePhotos||[]).map(p=>`<figure><img src="${p}" alt="维修前现场照片"><figcaption>维修前</figcaption></figure>`).join('')}${(o.afterPhotos||[]).map(p=>`<figure><img src="${p}" alt="维修后现场照片"><figcaption>维修后</figcaption></figure>`).join('')}</div>`)}
 ${box('材料与工时',`${row('实际用时',e(o.duration||'尚未记录'))}${(o.materials||[]).map(m=>row(e(m.name),n(m.quantity)+e(m.unit))).join('')||note(o.materialStatus==='none'?'本次无用料':'材料记录待补充')}`)}`,button('下载服务记录','worker-certificate-download',`data-id="${e(o.id)}"`,'full')),false);
A['worker-certificate-download']=el=>{const o=W.findOrder(el.dataset.id);if(!check(o,false))return;downloadFile(o.id+'-服务记录.txt',[o.title,o.id,'状态：'+W.label(o),'实际内容：'+(o.report||'未提交'),'订单金额：'+money(o.amount),'验收：'+(o.acceptedAt||'待客户确认')].join('\n'));};
V.exception=()=>orderGate('异常与改派申请',o=>page('异常与改派申请',`${card(orderTitle(o))}<form id="exception-form" data-form="submit-exception">${card(`${selectField('申请类型','action',[['exception','现场异常'],['reschedule','申请改约'],['transfer','申请转派'],['reject','取消申请'],['pause','申请暂停']])}${selectField('原因','type',['客户不在家','现场与描述不符','材料不足','预约冲突','安全问题','其他'])}${textarea('情况说明 *','reason','',500,'required minlength="5"')}${field('建议预约时间（改约时必填）','newTime','','datetime-local')}${photoField('相关证据','exception',6)}`)}</form>${notice('申请由平台处理，改约须双方确认。责任核实后才可能影响信用。')}`,`<button class="btn full" type="submit" form="exception-form">提交申请</button>`));
A['submit-exception']=(f,fd)=>{
 const o=current();if(!demand(o)||!W.active(o))return;
 const action=fd.get('action');if(action==='reschedule'&&(!fd.get('newTime')||Date.parse(fd.get('newTime')+'+08:00')<=Date.now())){toast('请选择未来的预约时间');return;}
 const rec={id:'EX'+Date.now(),order:o.id,workerId:W.actor(),action,type:fd.get('type'),reason:fd.get('reason'),newTime:fd.get('newTime'),photos:W.copy(App.uploads.exception||[]),status:'pending',date:W.stamp()};
 App.state.exceptions.unshift(rec);App.state.approvals.unshift({id:'AP'+Date.now(),type:{exception:'现场异常',reschedule:'改约申请',transfer:'转派申请',reject:'取消申请',pause:'暂停申请'}[action],name:o.title,orderId:o.id,exceptionId:rec.id,newTime:rec.newTime,status:'pending',by:'师傅',reason:rec.reason,date:W.stamp()});
 App.updateOrder(o.id,{},'师傅提交'+rec.type+'，等待平台处理');App.go('exceptions',{id:o.id});
};
V.exceptions=()=>{
 const id=App.query.get('id'),list=App.state.exceptions.filter(x=>W.own(W.findOrder(x.order))&&(!id||x.order===id));
 return page('异常处理记录',list.map(x=>card(`<div class="between"><h3>${e(x.type)}</h3>${badge({pending:'待处理',approved:'已处理',resolved:'已解决',rejected:'已驳回'}[x.status]||x.status)}</div><p class="w-body-copy">${e(x.reason)}</p>${note(e(x.date)+' · '+e(x.order))}${x.result?notice(e(x.result)):''}${linkBtn('查看关联工单','order','plain full',{id:x.order})}`)).join('')||emptyCard('暂无异常记录','提交的改约、转派和现场异常可在此跟进。'));
};
V.aftersales=()=>{
 const list=App.state.aftersales.filter(x=>W.own(W.findOrder(x.orderId||x.order)))||[];
 return page('售后与返修',`${note('售后关联原订单，费用承担与责任由平台核定。')}${list.map(x=>card(`<div class="between"><h3>${e(x.type||'售后返修')}</h3>${badge(x.status||'待受理')}</div><p class="w-body-copy">${e(x.reason||x.content||'客户提交售后申请')}</p>${linkBtn('查看原工单','order','secondary full',{id:x.orderId||x.order})}${button('补充返修记录','aftersale-record',`data-id="${e(x.id)}"`,'plain full')}`)).join('')||emptyCard('暂无售后工单','平台安排的返修与售后处理会显示在这里。')}`);
};
A['aftersale-record']=el=>{const record=App.state.aftersales.find(x=>x.id===el.dataset.id);if(!record||!check(W.findOrder(record.orderId||record.order)))return;App.temp.aftersaleId=record.id;dialog('补充返修记录',`<form id="aftersale-form" data-form="save-aftersale">${textarea('处理情况 *','content','',500,'required minlength="5"')}${photoField('现场照片','aftersale-evidence',6)}</form>`,`<button class="btn" form="aftersale-form">提交记录</button>`);};
A['save-aftersale']=(f,fd)=>{const r=App.state.aftersales.find(x=>x.id===App.temp.aftersaleId);if(!r||!check(W.findOrder(r.orderId||r.order)))return;(r.workerRecords??=[]).push({content:fd.get('content'),photos:W.copy(App.uploads['aftersale-evidence']||[]),date:W.stamp()});App.save();closeDialog();toast('返修记录已提交，等待平台和客户确认');};
window.WorkerUI={readQuote,n,c,fmt,s,url,link,button,group,box,grid,chips,emptyCard,page,denied,current,check,demand,orderGate,orderTitle,note,stateBadge,jobCard,dateRail,requiredPayment,paymentCopy,clearEvidence};
})();
(function(){
'use strict';
const W=Worker,V=App.views,A=App.actions,U=WorkerUI;
const {page,box,grid,link,button,chips,note,emptyCard,denied,orderGate,orderTitle,check,demand,c,n,fmt,s}=U;
const financeLabels={available:'可付款',pending:'待结算',frozen:'争议冻结',paid:'已到账',recovery:'退款待追回'};
const withdrawalLabels={pending:'待审核',second:'待复核',approved:'待付款',processing:'渠道处理中',remitted:'已汇出',paid:'已到账',rejected:'已驳回',cancelled:'已撤回',failed:'失败待处理'};
function entryRow(l){
 return `<a class="w-finance-row" href="${U.url('income-detail',{id:l.id})}"><span class="w-tool-icon">${icon(l.kind==='material'?'tool':'wallet',20)}</span><div><strong>${e(l.name)}</strong><small>${e(l.date)} · ${financeLabels[l.status]||l.status}</small></div><b>${l.amount<0?'−':'+'}¥${fmt(Math.abs(l.amount))}</b></a>`;
}
function accounts(){
 const owner=W.owner();
 if(owner==='w1')return App.state.accounts;
 if(owner==='w2')return s().memberAccounts??(s().memberAccounts=[]);
 if(owner==='team1')return s().teamAccounts??(s().teamAccounts=[{id:'team-bank',name:'安心家修服务团队对公账户',number:'建设银行 · 尾号 2308',icon:'building',default:true,verified:true}]);
 return [];
}
function defaultAccount(){return accounts().find(a=>a.default)||accounts()[0];}
V.wallet=()=>{
 const b=W.balances(),disabled=W.role()==='member'&&b.available===0;
 return page('收入',`<section class="wallet-account-card"><div class="page-toolbar"><span>${W.isLeader()?'团队收入账户':'我的收入账户'}</span>${link('账单'+icon('arrow',14),'transactions',{},'text-link')}</div><div class="wallet-hero"><h2>可提现金额（元）</h2><div class="amount">${fmt(b.available)}</div><div class="wallet-bottom"><div><small>待结算</small><strong>${fmt(b.pending)}</strong></div><div><small>冻结中</small><strong>${fmt(b.frozen)}</strong></div>${disabled?'<span class="badge gray">团队统一收款</span>':linkBtn(W.isLeader()?'申请付款':'提现','withdraw')}</div></div></section>
 <div class="w-money-summary">${[['预计报酬',b.estimated],['已到账',b.paid]].map(([l,a])=>card(`<small>${l}</small><strong>¥${fmt(a)}</strong>`)).join('')}</div>
 ${W.role()==='member'?notice('团队订单报酬支付给团队经营主体，成员分工与内部工资不重复产生平台付款。'):note('劳务报酬按阶段验收T＋7自然日进入可付款，材料按采购约定分别结算。')}
 ${box('近期收入明细',W.entries().slice().reverse().slice(0,4).map(entryRow).join('')||note('暂无平台直接付款记录。'))}
 ${card(grid([['收入统计','income','chart'],['付款记录','withdrawals','clipboard'],['收款账户','accounts','credit'],['推荐收益','referrals','users']]))}${note('平台提现手续费为0；渠道受理、汇出与实际到账分别记录。')}`,'','wallet');
};
V.income=()=>{
 const period=App.query.get('period')||'month',days=period==='week'?7:period==='month'?30:36500,rows=W.entries().filter(l=>Date.parse(l.date)>Date.now()-days*86400000&&l.kind!=='carry');
 const sum=rows.reduce((a,l)=>a+l.amount,0),byKind=kind=>rows.filter(l=>l.kind===kind).reduce((a,l)=>a+l.amount,0);
 const bars=Array.from({length:7},(_,i)=>{const day=W.date(i-6),a=rows.filter(l=>l.date===day).reduce((v,l)=>v+l.amount,0);return {day,a};});
 const max=Math.max(1,...bars.map(x=>x.a));
 return page('收入统计',`${chips([['week','近7天'],['month','近30天'],['all','全部']],period,'period')}${box('已记录报酬',`<div class="w-big-number">¥${fmt(sum)}</div>${note('按结算记录日期统计，待结算与到账状态可在账单逐笔查看。')}${row('劳务／合同报酬','¥'+fmt(byKind('labor')+byKind('contract')))}${row('材料采购款','¥'+fmt(byKind('material')))}`)}
 ${box('近7日结算记录',`<div class="w-income-bars" role="img" aria-label="近7日结算金额柱状图">${bars.map(x=>`<div><span style="height:${Math.max(2,x.a/max*110)}px" title="${x.day}：¥${fmt(x.a)}"></span><small>${x.day.slice(5)}</small></div>`).join('')}</div>`)}
 ${linkBtn('查看每单收入与扣费','transactions','secondary full mt16')}`);
};
V.transactions=()=>{
 const filter=App.query.get('filter')||'all',rows=W.entries().filter(l=>filter==='all'||l.status===filter).sort((a,b)=>b.date.localeCompare(a.date));
 return page('账单明细',`${chips([['all','全部'],['available','可付款'],['pending','待结算'],['frozen','冻结'],['paid','已到账']],filter)}
 ${rows.length?card(rows.map(entryRow).join('')):emptyCard('暂无相关账单')}${button('导出账单CSV','export-worker-transactions','','secondary full mt16')}`);
};
V['income-detail']=()=>{
 const l=W.entries().find(x=>x.id===App.query.get('id'));if(!l)return denied();
 return page('收入明细',`${box(e(l.name),`${row('金额','<strong>¥'+fmt(l.amount)+'</strong>')}${row('类型',{labor:'劳务报酬',material:'材料采购款',contract:'合同劳务款',carry:'历史期初可付款',commission:'直接推荐佣金',subsidy:'活动奖励'}[l.kind]||'其他收益')}${row('当前状态',financeLabels[l.status]||l.status)}${row('业务单号',e(l.ref||l.id))}${row('规则版本',e(l.ruleVersion||'合同约定'))}${row('记录日期',e(l.date))}${l.acceptedAt?row('对应验收日期',e(l.acceptedAt.slice(0,10))):''}${l.acceptedAt?row('可付款时间',new Date(Date.parse(l.acceptedAt)+7*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'})):''}${l.reason?notice(e(l.reason),'orange'):''}`)}
 ${W.findOrder(l.ref)&&W.own(W.findOrder(l.ref))?linkBtn('查看关联工单','order','secondary full mt16',{id:l.ref}):''}${note('订单售价、履约报酬、材料采购款分别记录，已付款项不能再次提现。')}`);
};
A['export-worker-transactions']=()=>exportCSV('师傅收入账单.csv',[['记录号','名称','类型','金额','状态','日期','关联单号'],...W.entries().map(l=>[l.id,l.name,l.kind,l.amount/100,financeLabels[l.status],l.date,l.ref||''])]);
V.withdraw=()=>{
 if(W.role()==='member'&&!W.entries().some(l=>l.kind==='subsidy'))return denied('团队订单由团队统一收款，当前没有独立的个人可付款记录。');
 const b=W.balances(),account=defaultAccount(),max=W.isLeader()?b.available/100:Math.min(10000,b.available/100);
 return page(W.isLeader()?'申请合同付款':'申请提现',`${box('收款账户',account?`${row(e(account.name),e(account.number))}${linkBtn('管理收款账户','accounts','plain full')}`:linkBtn('先绑定收款账户','accounts','secondary full'))}
 <form id="withdraw-form" data-form="withdraw-submit">${card(`<p>申请金额（元）</p><div class="withdraw-input"><span>¥</span><input name="amount" aria-label="申请金额" type="number" inputmode="decimal" min="10" max="${max}" step="0.01" value="${e(App.temp.withdrawAmount||'')}" required data-input="withdraw-calculate" placeholder="0.00"></div><div class="between mt12"><small>可提现 ¥${fmt(b.available)}</small>${button('全部可提','withdraw-all','type="button"','plain small')}</div>${row('平台提现手续费','¥0.00')}${row('本次应付','<strong id="withdraw-actual">¥0.00</strong>')}`)}
 ${notice(W.isLeader()?'团队合同款付至同名对公账户，按合同及审核流程处理。':'个人每笔10～10,000元，每日最多3次。财务1个工作日内审核，超过5,000元或首次／变更账户需复核。')}
 <label class="check-label mt16"><input type="checkbox" name="terms" required><span>已核对收款账户及金额，了解到账以渠道结果为准。</span></label></form>`,`<button class="btn full" type="submit" form="withdraw-form" ${!account||b.available<1000?'disabled':''}>提交申请</button>`);
};
A['withdraw-calculate']=el=>{App.temp.withdrawAmount=el.value;const target=document.getElementById('withdraw-actual');if(target)target.textContent='¥'+money(n(el.value));};
A['withdraw-all']=()=>{const b=W.balances(),el=document.querySelector('input[name="amount"]');if(!el)return;el.value=Math.min(b.available/100,W.isLeader()?b.available/100:10000);A['withdraw-calculate'](el);};
A['withdraw-submit']=(f,fd)=>{
 if(W.role()==='member'&&!W.entries().some(l=>l.kind==='subsidy'))return;
 const amount=n(fd.get('amount')),account=defaultAccount(),b=W.balances(),day=W.date();
 if(!W.validAmount(fd.get('amount'))||amount<10||!W.isLeader()&&amount>10000||c(amount)>b.available||!account){toast('请核对金额、可用余额和收款账户');return;}
 if(!W.isLeader()&&W.withdrawals().filter(w=>w.date?.startsWith(day)).length>=3){toast('今日已达到3次提现上限');return;}
 const currentOwner=W.owner();let submitted=false;
 confirmAction('核对付款信息',`申请 ¥${money(amount)}<br>平台手续费 ¥0.00<br>收款：${e(account.name)} ${e(account.number)}<br>审核后付款，到账以渠道结果为准。`,()=>{
  if(submitted)return;
  if(currentOwner!==W.owner()||c(amount)>W.balances().available){toast('身份或余额已变化，请重新核对');return;}
  if(App.temp.withdrawSubmitting)return;App.temp.withdrawSubmitting=true;submitted=true;
  const id='TX'+Date.now(),rec={id,amount,fee:0,actual:amount,status:'pending',date:W.stamp(),account:account.name+' '+account.number,accountId:account.id,owner:W.owner(),workerId:W.actor(),teamId:W.isLeader()?'team1':undefined,w12Tracked:true,ruleVersion:'1.2',requiresSecond:amount>5000||!account.usedAt||!!account.changedAt};
  App.state.withdrawals.unshift(rec);
  if(W.owner()==='w1'){App.state.balance=(b.available-c(amount))/100;App.state.frozen=(b.frozen+c(amount))/100;}
  W.notify('funds','付款申请已提交','¥'+money(amount)+'，等待财务审核。','withdrawals');
  App.save();App.temp.withdrawAmount='';App.temp.withdrawSubmitting=false;App.go('withdrawals');
 },'提交申请');
};
V.withdrawals=()=>{
 const list=W.withdrawals().slice().reverse();
 return page('付款记录',list.map(w=>card(`<div class="between"><h3>¥${money(w.amount)}</h3>${badge(withdrawalLabels[w.status]||w.status,w.status==='paid'?'green':'orange')}</div>${row('实际应付','¥'+money(w.actual))}${row('平台手续费','¥'+money(w.fee))}${row('收款账户',e(w.account))}${note(e(w.id)+' · '+e(w.date))}${w.ruleVersion!=='1.2'?note('历史演示记录，保留原记录口径。'):''}${w.reason?notice(e(w.reason)):''}${w.status==='pending'?button('撤回申请','withdraw-cancel',`data-id="${e(w.id)}"`,'plain full'):''}`)).join('')||emptyCard('暂无付款记录'));
};
A['withdraw-cancel']=el=>{const w=W.withdrawals().find(x=>x.id===el.dataset.id);if(!w||w.status!=='pending')return;confirmAction('撤回付款申请','待审核申请可撤回，撤回后释放本次申请金额。',()=>{if(w.status!=='pending')return;w.status='cancelled';if(W.owner()==='w1'){const b=W.balances();App.state.balance=b.available/100;App.state.frozen=b.frozen/100;}App.save();App.render();},'确认撤回');};
V.accounts=()=>page('收款账户',`${W.role()==='member'?notice('团队订单由团队内部结算，个人独立奖励账户另行记录。'):''}${accounts().map(a=>card(`<div class="between"><h3>${e(a.name)}</h3>${a.default?badge('默认账户','green'):''}</div><p class="w-body-copy">${e(a.number)}</p><div class="w-actions">${a.default?'':button('设为默认','account-default',`data-id="${e(a.id)}"`,'secondary small')}${button('移除','account-delete',`data-id="${e(a.id)}"`,'plain small')}</div>`)).join('')}
 ${W.role()!=='member'||W.entries().some(l=>l.kind==='subsidy')?button('添加收款账户','account-add','','secondary full mt16'):''}${note('收款主体须与实名／团队合同主体一致。账户变更后的首次付款需要复核。')}`);
A['account-default']=el=>{accounts().forEach(a=>a.default=a.id===el.dataset.id);App.save();App.render();};
A['account-delete']=el=>{
 const a=accounts().find(x=>x.id===el.dataset.id);if(!a)return;
 if(W.withdrawals().some(w=>w.accountId===a.id&&['pending','second','approved','processing','remitted'].includes(w.status))){toast('此账户存在处理中付款，暂不能移除');return;}
 confirmAction('移除收款账户',e(a.name),()=>{const list=accounts(),i=list.findIndex(x=>x.id===a.id);list.splice(i,1);if(list.length&&!list.some(x=>x.default))list[0].default=true;App.save();App.render();},'移除');
};
A['account-add']=()=>{
 if(W.role()==='member'&&!W.entries().some(l=>l.kind==='subsidy'))return;
 dialog('添加收款账户',`<form id="account-form" data-form="account-save">${field('收款主体姓名','name',W.isLeader()?'安心家修服务团队':W.role()==='member'?'陈伟':W.profile().name,'text','required maxlength="40"')}${selectField('银行','bank',['中国建设银行','中国工商银行','招商银行'])}${field('账户号码（仅演示）','number','','text','required inputmode="numeric" pattern="[0-9]{10,30}" maxlength="30"')}${note('演示仅保存银行名称与尾号，不保存完整账户号码。')}</form>`,`<button class="btn" type="submit" form="account-form">保存账户</button>`);
};
A['account-save']=(f,fd)=>{if(W.role()==='member'&&!W.entries().some(l=>l.kind==='subsidy'))return;const name=String(fd.get('name')).trim(),expected=W.isLeader()?'安心家修服务团队':W.role()==='member'?'陈伟':W.profile().name;if(name!==expected){toast('收款主体必须与已认证主体一致');return;}const list=accounts();list.push({id:'ACC'+Date.now(),name:fd.get('bank')+' · '+name,number:'**** '+String(fd.get('number')).slice(-4),icon:'credit',default:!list.length,changedAt:W.now()});App.save();closeDialog();App.render();toast('账户已保存，首次付款需复核');};
V.profile=()=>{
 const member=W.role()==='member',name=W.isLeader()?'安心家修团队':member?'陈伟 · 陈师傅':'李明 · 李师傅',total=member?862:1268,credit=member?98:W.credit();
 return page('我的',`<section class="w-profile-head"><div class="w-profile-top"><div class="flex gap12">${avatar(name,'lg')}<div><h2>${name}</h2><p>${W.verified()?'已认证':'待认证'} · ${member?'团队执行成员':W.isLeader()?'团队负责人':'独立师傅'}</p></div></div>${link(icon('settings',23),'settings',{},'icon-btn')}</div>${button('切换演示身份'+icon('down',13),'switch-role','','w-role-button')}</section>
 <section class="w-profile-metrics">${[['信用分',credit,'credit'],['综合评分',member?'4.9':'4.9','reviews'],['累计服务',total,'orders']].map(([l,v,r])=>link(`<strong>${v}</strong><small>${l}</small>`,r)).join('')}</section>
 ${box('常用功能',grid([['收入钱包','wallet','wallet'],['接单设置','preferences','filter'],['认证资质','certification','shield'],['消息中心','messages','bell']]))}
 <div class="w-feature-grid">${[['团队协作','成员与工单分配','team','users'],['推荐收益','直接推荐 · 一层关系','referrals','trend'],['培训考核','标准服务 · 持续学习','training','school'],['知识案例','按问题查方法','knowledge','file']].map(([title,sub,r,i])=>link(`<span><strong>${title}</strong><small>${sub}</small></span>${icon(i,30)}`,r,{},'w-feature-card')).join('')}</div>
 ${box('业务管理',grid([['项目管理','projects','building'],['材料记录','materials','tool'],['我的评价','reviews','star'],['等级奖励','level','medal'],['信用记录','credit','shield'],['我的日程','schedule','clock'],['售后返修','aftersales','wrench'],['报价记录','quote-history','file']]))}
 ${box('更多服务',grid([['帮助中心','help','info'],['联系客服','chat','headphones',{support:1}],['平台规则','rules','file'],['设置隐私','settings','settings']]))}${note('本地演示原型 · 等级及激励示例规则已单独标注')}`,'','profile',{edge:true});
};
A['switch-role']=()=>dialog('切换演示身份',`<div class="w-role-options">${[['personal','个人师傅','接单、履约、个人报酬'],['leader','团队负责人','管理成员、分配工单、团队收款'],['member','团队执行成员','处理分配给自己的任务']].map(([id,title,desc])=>`<button class="w-role-choice ${W.role()===id?'active':''}" data-action="choose-worker-role" data-role="${id}"><strong>${title}</strong><small>${desc}</small>${W.role()===id?icon('check',20):''}</button>`).join('')}</div>`);
A['choose-worker-role']=el=>{if(!['personal','leader','member'].includes(el.dataset.role))return;s().role=el.dataset.role;App.temp={};U.clearEvidence();App.save();closeDialog();App.go('home');if(App.route==='home')App.render();};
V.login=()=>loginView();
A.login=(f,fd)=>{if(fd.get('code')!=='123456'){toast('演示验证码为123456');return;}s().loggedIn=true;App.save();App.go('home');};
A.logout=()=>confirmAction('退出师傅账号','退出当前演示身份？',()=>{s().loggedIn=false;App.save();App.go('login');},'退出登录');
V.join=()=>{
 const d=s().drafts.join||{},profile=W.profile();
 return page('师傅入驻',`${notice('提交实名、联系方式、技能与服务区域，通过审核后才能新接单。')}<form id="join-form" data-form="join-submit">
 ${box('基本资料',`${field('姓名 *','name',d.name||profile.name,'text','required maxlength="20"')}${field('手机号 *','phone',d.phone||profile.phone,'tel','required pattern="1[3-9][0-9]{9}" maxlength="11"')}${field('服务城市','city','深圳','text','required maxlength="20"')}${field('工作年限','years',d.years||8,'number','required min="0" max="60"')}${field('服务区域 *','area',d.area||'南山区','text','required maxlength="100"')}`)}
 ${box('可服务技能',W.categories.map(([label,items])=>`<fieldset class="w-skill-group"><legend>${label}</legend><div class="w-skill-options">${items.map(x=>`<label><input type="checkbox" name="skills" value="${x}" ${profile.skills.includes(x)?'checked':''}>${x}</label>`).join('')}</div></fieldset>`).join(''))}
 ${box('认证材料',`${photoField('实名材料 *','identity',2)}${photoField('技能资质材料 *','qualification',6)}${textarea('补充说明','remark',d.remark||'',500)}`)}</form>`,button('保存草稿','join-draft','','secondary')+`<button class="btn" form="join-form">提交审核</button>`);
};
A['join-draft']=()=>{const f=document.getElementById('join-form');if(f){W.saveDraft('join',f);toast('入驻草稿已保存');}};
A['join-submit']=(f,fd)=>{
 if(!fd.getAll('skills').length||!App.uploads.identity?.length||!App.uploads.qualification?.length){toast('请选择技能并上传实名与资质材料');return;}
 const application={id:'J'+Date.now(),workerId:W.actor(),name:fd.get('name'),phone:'***'+String(fd.get('phone')).slice(-4),city:fd.get('city'),area:fd.get('area'),years:n(fd.get('years')),skill:fd.getAll('skills').join('／'),skills:fd.getAll('skills'),identityPhotos:W.copy(App.uploads.identity),qualificationPhotos:W.copy(App.uploads.qualification),remark:fd.get('remark'),status:'pending',date:W.stamp()};
 App.state.applications.unshift(application);(s().applicationIds??={})[W.actor()]=application.id;W.setVerified(false);App.save();App.go('join-status');
};
V['join-status']=()=>{
 const a=App.state.applications.find(x=>x.id===(s().applicationIds?.[W.actor()]||s().applicationId));
 return page('认证审核进度',`${box('入驻状态',`<div class="w-state-heading">${badge(a?{pending:'审核中',supplement:'待补材料',approved:'审核通过',rejected:'审核未通过'}[a.status]||a.status:W.verified()?'已认证':'待提交',a?.status==='approved'||!a&&W.verified()?'green':'orange')}</div><p class="w-body-copy">${e(a?.reason||'请确保实名资料、技能证明与服务范围真实有效。')}</p>${a?`${row('申请编号',e(a.id))}${row('提交时间',e(a.date))}`:''}`)}${a&&['supplement','rejected'].includes(a.status)?linkBtn('补充材料重新提交','join','full mt16'):linkBtn('查看认证资料','certification','secondary full mt16')}`);
};
V.certification=()=>page('认证与资质',`${box('实名与服务能力',`${row('姓名',W.role()==='member'?'陈伟':e(W.profile().name))}${row('认证状态',W.verified()?'已认证':'审核中')}${row('服务区域','深圳市 · 南山区')}${row('工作经验',n(W.profile().years)+'年')}${row('技能资质有效期',e(W.profile().qualification))}`)}
 ${box('已认证技能',`<div class="chips">${W.profile().skills.map(x=>badge(x)).join(' ')}</div>${note('接单时同时校验已认证技能、服务范围和排班。')}`)}${linkBtn('查看审核进度','join-status','secondary full mt16')}${linkBtn('提交资料变更','join','plain full mt12')}`);
V.preferences=()=>{
 const p=W.preferences(),skills=p.skillsV12||W.profile().skills;
 return page('接单设置',`<form id="preferences-form" data-form="save-preferences">${box('范围与预约能力',`${selectField('接单半径','radius',[[3,'3公里'],[5,'5公里'],[8,'8公里'],[10,'10公里']],p.radius||5)}${field('最多未来预约数','maxOrders',p.maxOrders||5,'number','required min="1" max="10"')}${field('最低订单金额','minPrice',p.minPrice||0,'number','required min="0" max="100000" step="0.01"')}<div class="w-form-two">${field('可接单开始时间','start',W.profile().scheduleStart,'time','required')}${field('可接单结束时间','end',W.profile().scheduleEnd,'time','required')}</div>${note('同一时刻最多1个施工中工单，预约间保留30分钟交通缓冲。')}`)}
 ${box('接单品类',W.categories.map(([name,items])=>`<fieldset class="w-skill-group"><legend>${name}</legend><div class="w-skill-options">${items.map(x=>`<label><input type="checkbox" name="skills" value="${x}" ${skills.includes(x)?'checked':''} ${!W.profile().skills.includes(x)?'disabled':''}>${x}${!W.profile().skills.includes(x)?'<small>待认证</small>':''}</label>`).join('')}</div></fieldset>`).join(''))}</form>`,`<button class="btn full" form="preferences-form">保存接单设置</button>`);
};
A['save-preferences']=(f,fd)=>{if(!fd.getAll('skills').length){toast('至少选择1项已认证技能');return;}if(fd.get('start')>=fd.get('end')){toast('结束时间须晚于开始时间');return;}W.setPreferences({...W.preferences(),radius:n(fd.get('radius')),maxOrders:n(fd.get('maxOrders')),minPrice:n(fd.get('minPrice')),skillsV12:fd.getAll('skills').filter(x=>W.profile().skills.includes(x))});W.profile().scheduleStart=fd.get('start');W.profile().scheduleEnd=fd.get('end');App.save();toast('接单设置已保存');App.go('home');};
V.credit=()=>{
 const val=W.credit(),records=s().creditRecords.filter(r=>(r.workerId||'w1')===W.actor());
 const message=val<40?'人工复审中':val<60?'暂停新接单，已接工单与正常结算可继续':val<80?'仅可承接运营确认的预约单，每日最多2单':'信用良好';
 return page('信用记录',`${box('信用分',`<div class="w-credit-value">${val}<small>／100</small></div><p>${message}</p>`)}${box('近期变动',records.map(r=>`<div class="w-credit-record"><div><strong>${e(r.name)}</strong><small>${e(r.date)} · ${e(r.status)}</small></div><b>${r.points>0?'+':''}${r.points}</b>${r.points<0?button('申诉','credit-appeal',`data-id="${e(r.id)}"`,'plain small'):''}</div>`).join(''))}
 ${box('申诉记录',s().creditAppeals.map(a=>`<div class="w-record"><strong>${e(a.reason)}</strong><p>${e(a.date)} · 待复核，2个工作日内首次反馈</p></div>`).join('')||note('暂无申诉记录'))}
 ${box('规则摘要',`<p class="w-body-copy">初始100分；合格完单恢复1分，每7日最多恢复5分。核实迟到扣3分、责任取消扣10分、成立客诉扣5分、虚假完工或擅自增收费扣20分；同一事件取最高一项。</p>${note('差评不直接扣分，核实责任后按事件处理。')}${linkBtn('查看全部规则','rules','plain full')}`)}`);
};
A['credit-appeal']=el=>{if(!s().creditRecords.some(r=>r.id===el.dataset.id&&(r.workerId||'w1')===W.actor()))return;App.temp.creditRecordId=el.dataset.id;dialog('信用记录申诉',`<form id="credit-appeal-form" data-form="credit-appeal-submit">${textarea('申诉理由 *','reason','',500,'required minlength="5"')}${photoField('相关证据','credit-appeal',6)}</form>`,`<button class="btn" form="credit-appeal-form">提交复核</button>`);};
A['credit-appeal-submit']=(f,fd)=>{const id=App.temp.creditRecordId;if(s().creditAppeals.some(x=>x.recordId===id&&x.status==='pending')){toast('该记录已有待处理申诉');return;}const rec={id:'CA'+Date.now(),recordId:id,workerId:W.actor(),reason:fd.get('reason'),photos:W.copy(App.uploads['credit-appeal']||[]),status:'pending',date:W.stamp()};s().creditAppeals.unshift(rec);App.state.approvals.push({id:'AP'+Date.now(),type:'信用申诉',name:rec.reason,workerId:W.actor(),target:id,status:'pending',by:'师傅',date:W.stamp()});App.save();closeDialog();App.render();};
function reviews(){
 const actual=W.jobs().filter(o=>o.review).map(o=>({id:o.id,name:o.name,score:o.review.overall||5,text:o.review.content||o.review.tags?.join('、')||'',reply:o.review.reply}));
 return actual.length?actual:[{id:'WR-1',name:'林**',score:5,text:'报价清楚，现场保护和收尾做得很细。',reply:s().reviews.find(r=>r.id==='WR-1')?.reply||''},{id:'WR-2',name:'陈**',score:4,text:'维修效果不错，沟通也很及时。',reply:s().reviews.find(r=>r.id==='WR-2')?.reply||''}];
}
V.reviews=()=>page('评价中心',`${box('服务评价',reviews().map(r=>`<div class="w-record"><div class="between"><h3>${e(r.name)}</h3><strong class="orange-text">${r.score}.0 分</strong></div><p class="w-body-copy">${e(r.text)}</p>${r.reply?notice('师傅回复：'+e(r.reply)):''}<div class="w-actions">${button('回复','review-reply',`data-id="${e(r.id)}"`,'plain small')}${button('申诉','review-appeal',`data-id="${e(r.id)}"`,'plain small')}</div></div>`).join(''))}${note('评价申诉由平台复核，不会仅因差评自动扣信用分。')}`);
A['review-reply']=el=>{App.temp.reviewId=el.dataset.id;dialog('回复评价',`<form id="reply-form" data-form="save-reply">${textarea('回复内容','content','',300,'required minlength="2"')}</form>`,`<button class="btn" form="reply-form">保存回复</button>`);};
A['save-reply']=(f,fd)=>{const o=W.findOrder(App.temp.reviewId);if(o&&W.own(o)&&o.review)o.review.reply=fd.get('content');else{s().reviews=s().reviews.filter(r=>r.id!==App.temp.reviewId);s().reviews.push({id:App.temp.reviewId,reply:fd.get('content')});}App.save();closeDialog();App.render();};
A['review-appeal']=el=>{App.temp.reviewAppealId=el.dataset.id;dialog('评价申诉',`<form id="review-appeal" data-form="save-review-appeal">${textarea('申诉说明','reason','',500,'required minlength="5"')}</form>`,`<button class="btn" form="review-appeal">提交平台</button>`);};
A['save-review-appeal']=(f,fd)=>{App.state.approvals.push({id:'AP'+Date.now(),type:'评价申诉',name:fd.get('reason'),target:App.temp.reviewAppealId,workerId:W.actor(),status:'pending',by:'师傅',date:W.stamp()});App.save();closeDialog();toast('申诉已提交，可在消息中心跟进处理');};
const messageTypes=[['chat','订单沟通','chat'],['order','接单通知','clipboard'],['change','工单变更','clock'],['funds','资金通知','wallet'],['system','系统消息','bell']];
const ownMessages=()=>s().messages.filter(m=>!m.recipient||m.recipient===W.owner());
V.messages=()=>page('消息中心',`${!App.state.settings.notifications?`<div class="w-notice-strip"><span>开启消息提醒，及时跟进订单</span>${button('去设置','open-settings','','plain small')}</div>`:''}
 ${card(grid([['今日待办','schedule','clipboard'],['新单提醒','hall','bell'],['异常处理','exceptions','alert'],['在线客服','chat','headphones',{support:1}]]))}
 ${card(messageTypes.map(([type,label,ico])=>{const list=ownMessages().filter(m=>m.type===type),last=list[0],unread=list.filter(m=>m.unread).length;return link(`<span class="w-tool-icon">${icon(ico,24)}</span><div><h3>${label}${unread?'<b class="w-count">'+unread+'</b>':''}</h3><p>${type==='chat'?'查看本单图文沟通':e(last?.text||'暂无新消息')}</p></div>${icon('arrow',16)}`,type==='chat'?'conversations':'message-list',{type},'w-message-row');}).join(''))}${button('全部标记已读','worker-read','','secondary full mt16')}`);
V.conversations=()=>page('订单沟通',W.jobs().filter(W.active).map(o=>card(link(`<h3>${e(o.title)}</h3><p class="w-body-copy">${e(o.name||'客户')} · ${e(o.time)}</p>`, 'chat',{id:o.id}))).join('')||emptyCard('暂无订单会话'));
V['message-list']=()=>{
 const type=App.query.get('type')||'order',label=messageTypes.find(x=>x[0]===type)?.[1]||'消息';
 return page(label,ownMessages().filter(m=>m.type===type).map(m=>`<article class="card w-notification ${m.unread?'is-unread':''}"><div class="between"><h3>${e(m.title)}</h3>${m.unread?badge('未读'):''}</div><p class="w-body-copy">${e(m.text)}</p>${note(e(m.date))}${button('查看详情','message-open',`data-id="${e(m.id)}"`,'plain full')}</article>`).join('')||emptyCard('暂无'+label));
};
A['worker-read']=()=>{ownMessages().forEach(m=>m.unread=false);App.save();App.render();toast('消息已标记为已读');};
A['message-open']=el=>{const m=ownMessages().find(x=>x.id===el.dataset.id);if(!m)return;m.unread=false;App.save();App.go(m.route||'orders',m.ref?{id:m.ref}:{});};
A['open-settings']=()=>App.go('settings');
V.chat=()=>{
 const support=App.query.get('support')==='1',o=U.current();if(!support&&!check(o,false))return denied();
 const id=support?'support-'+W.actor():o.id,msgs=App.state.messages.filter(m=>m.order===id);
 const body=`${support?notice('在线客服时间09:00—21:00，演示消息保存在本地。'):card(link(`<h3>${e(o.title)}</h3><p>${e(o.name||'客户')} · ${W.label(o)}</p>`,'order',{id:o.id}))}<div class="w-chat-log">${msgs.map(m=>`<div class="chat-bubble-row ${m.from==='worker'?'mine':''}">${avatar(m.from==='worker'?'我':'客户')}<div class="chat-bubble">${m.image?`<img src="${m.image}" alt="会话图片">`:e(m.text)}<small>${e(m.time)}</small></div></div>`).join('')||note('可通过本单会话确认预约与服务情况。')}</div>`;
 const foot=`<div class="chat-quick">${['您好，我已在路上','请确认现场报价','已提交完工资料'].map(t=>button(t,'quick-message',`data-message="${e(t)}"`,'plain small')).join('')}</div><form class="chat-composer" data-form="send-message"><label class="icon-btn" aria-label="发送图片">${icon('plus',22)}<input type="file" data-worker-chat-photo hidden accept="image/png,image/jpeg,image/webp"></label><input name="message" aria-label="消息内容" placeholder="输入消息" maxlength="500" required><button class="btn">发送</button></form>`;
 return page(support?'在线客服':e(o.name||'客户')+' · 订单沟通',body,foot,'',{chat:true});
};
function sendMessage(text,image){
 const support=App.query.get('support')==='1',o=U.current();if(!support&&!check(o))return;
 if(!text&&!image)return;
 App.state.messages.push({id:'M'+Date.now(),order:support?'support-'+W.actor():o.id,from:'worker',workerId:W.actor(),text,image,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'})});App.save();App.render();window.scrollTo(0,document.body.scrollHeight);
}
A['send-message']=(f,fd)=>sendMessage(String(fd.get('message')||'').trim());
A['quick-message']=el=>sendMessage(el.dataset.message);
document.addEventListener('change',async ev=>{if(!ev.target.matches('[data-worker-chat-photo]'))return;const file=ev.target.files[0];if(!file)return;if(file.size>3*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('请选择不超过3MB的PNG、JPG或WebP图片');return;}const image=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(file);});sendMessage('',image);});
V.settings=()=>page('设置与隐私',`${box('接单与提醒',`${row('接单偏好',n(W.preferences().radius||5)+'km','preferences','filter')}${toggle('在线接单','online',W.online(),'休息后仍可处理已接工单','worker-online')}${toggle('消息通知','notifications',App.state.settings.notifications,'新单、变更、资金及系统提醒')}${toggle('新单语音播报','voice',App.state.settings.voice)}${toggle('振动提醒','vibration',App.state.settings.vibration)}${toggle('夜间免打扰','night',App.state.settings.night,'22:00—次日06:00')}`)}
 ${box('位置与隐私',`${toggle('位置授权','location',App.state.settings.location,'用于服务匹配、导航与到场核验')}${toggle('订单内位置共享','share',App.state.settings.share,'仅向获授权的相关客户展示，位置过期须提示')}${row('隐私政策',button('查看','legal','data-title="隐私政策"','plain small'))}${row('师傅合作协议',button('查看','legal','data-title="师傅合作协议"','plain small'))}`)}
 ${box('账户与帮助',`${row('认证资料','','certification','shield')}${row('帮助中心','','help','info')}${row('联系客服','','chat?support=1','headphones')}${row('原型版本','PRD V1.2 · 本地演示')}${row('注销账户',button('申请注销','worker-delete-account','','plain small'))}`)}${button('退出登录','logout','','secondary full mt16')}`);
A['worker-delete-account']=()=>{if(W.jobs().some(W.active)||W.balances().available||W.balances().frozen){dialog('账户尚有待处理事项','<p>请先处理未结工单及资金事项，再向客服申请注销。</p>',linkBtn('联系在线客服','chat','',{support:1}));return;}dialog('申请注销',`<form id="delete-account" data-form="delete-account">${textarea('申请说明','reason','',300,'required minlength="5"')}</form>`,`<button class="btn" form="delete-account">提交客服处理</button>`);};
A['delete-account']=(f,fd)=>{s().applications.push({id:'DEL'+Date.now(),type:'注销申请',reason:fd.get('reason'),status:'pending',date:W.stamp()});App.save();closeDialog();toast('注销申请已提交，等待客服核验');};
V.rules=()=>page('平台规则',`${note('当前采用PRD V1.2业务规则。历史订单以锁定的合同和规则版本为准。')}
 ${box('接单与签到',`<p class="w-body-copy">认证、技能、区域、排班和在线状态先校验；匹配排序为距离35%、技能25%、履约20%、负载10%、响应10%。定向邀请30秒，5分钟转人工处理。签到范围500米，异常需照片及客户确认或平台复核。</p>`)}
 ${box('报价、增项与开工',`<p class="w-body-copy">同规格人工费超过参考上限15%说明原因并由客户二次确认；超过50%或超出金额达到500元先审核。累计增项服务费超过原服务费30%或达到500元先审核。审核不能代替客户同意。</p><p class="w-body-copy">普通服务总价不超过2,000元开工前付清；大额维修50%开工款＋50%验收尾款；项目按合同30%／40%／30%。</p>`)}
 ${box('完工、验收与质保',`<p class="w-body-copy">完工提交内容、前后照片和用料说明。普通小额无争议服务可按约定72小时自动验收；工程、大额维修、防水及定制需明确验收。小修人工90日、普通安装人工180日；适用装修工程至少2年，防渗漏至少5年；清洁效果异议7日。</p>`)}
 ${box('报酬与提现',`<p class="w-body-copy">常规服务按有效服务结算额80%计履约报酬，材料单独按采购合同结算，大工程按审批合同。劳务报酬按阶段验收T＋7自然日可付款；推荐收益另需回款。个人单笔10～10,000元、每日最多3次、0平台提现费。已到账不能重复提现。</p>`)}
 ${box('信用与申诉',`<p class="w-body-copy">100分制；低于80分仅可承接运营确认的预约单，每日最多2单；低于60分暂停新接，低于40分人工复审。已接工单、售后和正常结算保留。核实责任后扣分，差评不直接扣分，申诉2个工作日内首次反馈。</p>`)}`);
V.help=()=>page('客服与帮助',`${box('需要帮助',`<p class="w-body-copy">客服时间09:00—21:00。售后首次响应目标为2个营业小时，处理过程可查询。</p>${linkBtn('联系在线客服','chat','full',{support:1})}`)}
 ${box('常见问题',[['报价提交后能施工吗？','需客户确认有效报价并满足本阶段付款条件，进入待开工后才能开始。'],['签到距离异常怎么办？','提交现场照片和说明，交客户确认到场或由平台复核。'],['订单完成后何时能收款？','履约报酬按阶段验收T＋7自然日可付款；争议只冻结相关金额。'],['客户差评会直接扣分吗？','不会。平台根据证据复核具体事件责任，师傅可以申诉。'],['团队成员的钱如何结算？','平台支付给团队主体，内部成员报酬由团队约定，不重复从全单计付。']].map(([q,a])=>`<details class="details"><summary>${q}</summary><p>${a}</p></details>`).join(''))}`);
W.accounts=accounts;
})();
