(function(){
'use strict';
if(App.app!=='user')return;
const V=App.views,A=App.actions;
const cents=x=>Math.round(Number(x||0)*100);
const current=()=>App.currentOrder();
const v12=o=>o?.ruleVersion==='1.2';
const required=o=>o.orderType==='project'?Math.round(cents(o.amount)*.3):cents(o.amount)<=200000?cents(o.amount):Math.round(cents(o.amount)*.5);
const due=(o,kind)=>Math.max(0,(kind==='balance'?cents(o.amount):required(o))-cents(o.paid))/100;
function syncAddonHistory(o){const rec=o.addonHistory?.find(x=>x.id===o.addon?.id);if(rec)Object.assign(rec,o.addon);}
const orderView=V.order;
V.order=()=>{
 const o=current();let html=orderView();if(!v12(o))return html;
 let content='';
 if(o.status==='ready')content=card(`<h3>报价已确认，待开工</h3><p class="mt12">本阶段付款条件满足后，由师傅确认开始服务。</p>${due(o,'stage')>0?linkBtn('支付本阶段款项 ¥'+money(due(o,'stage')),'payment','full mt16',{id:o.id,kind:'stage'}):''}`);
 if(o.addon&&o.addon.approved==null&&o.addon.status==='customer')content+=card(`<h3>新增服务待确认</h3><p class="mt12">${e(o.addon.name)} · ¥${money(o.addon.amount)}</p>${linkBtn('查看增项并确认','addon','full mt16',{id:o.id})}`);
 if(o.flags?.addonPayment)content+=card(`${notice('增项已同意，请按约定支付本阶段差额后再执行新增范围。')}${linkBtn('支付本阶段差额','payment','full mt12',{id:o.id,kind:'addon'})}`);
 return content?html.replace('</main>',content+'</main>'):html;
};
const quoteView=V.quote;
V.quote=()=>{
 const o=current();if(!v12(o))return quoteView();
 const q=o.quoteVersions?.at(-1),can=o.status==='quote'&&q?.status==='customer'&&Date.now()<Date.parse(q.expiresAt);
 return mobilePage('确认正式报价',`${notice('核对服务范围、人工和材料；已支付检测费计入总价一次。')}${card(`<div class="between"><h2>正式报价 V${q?.version||1}</h2>${badge(can?'待确认':'报价记录')}</div><div class="mt16">${orderSummary(o)}</div>${(q?.lines||[]).map(l=>row(e(l.name)+' × '+l.quantity+e(l.unit),'人工¥'+money(l.labor*l.quantity)+'／材料¥'+money(l.material*l.quantity))).join('')}${row('检测／勘测费','¥'+money(q?.visit||o.quote?.visit))}${row('报价总额','<strong>¥'+money(o.amount)+'</strong>')}${row('已支付','¥'+money(o.paid))}<p class="mt16">${e(q?.fault||o.fault||'按已确认服务范围执行')}</p>${q?.requiresSecondConfirmation?notice('人工报价超出同规格参考上限15%，请核对原因：'+e(q.reason),'orange')+`<label class="check-label mt16"><input type="checkbox" id="quote-second-confirm"><span>已了解偏离原因，再次确认此人工报价。</span></label>`:''}`)}${notice(cents(o.amount)<=200000?'普通服务开工前付清，前序费用抵扣已付。':'本阶段支付50%开工款，验收后支付剩余50%。')}`,`<button class="btn secondary" data-action="quote-reject" ${!can?'disabled':''}>退回修改</button><button class="btn" data-action="quote-accept" ${!can?'disabled':''}>确认报价</button>`);
};
const acceptQuote=A['quote-accept'],rejectQuote=A['quote-reject'];
A['quote-accept']=()=>{
 const o=current();if(!v12(o))return acceptQuote();
 const q=o.quoteVersions?.at(-1);if(o.status!=='quote'||q?.status!=='customer'||Date.now()>Date.parse(q.expiresAt)){toast('报价已失效或状态发生变化');return;}
 if(q.requiresSecondConfirmation&&!document.getElementById('quote-second-confirm')?.checked){toast('请再次确认超出参考上限的人工报价');return;}
 confirmAction('确认正式报价','确认服务明细及费用，支付本阶段款项后由师傅开工。',()=>{
  if(o.status!=='quote'||q!==o.quoteVersions?.at(-1)||q.status!=='customer')return;
  q.status='accepted';q.confirmedAt=new Date().toISOString();App.updateOrder(o.id,{status:'ready',quoteApproved:true,confirmedQuoteId:q.id},'客户确认正式报价V'+q.version);
  App.go(due(o,'stage')>0?'payment':'order',due(o,'stage')>0?{id:o.id,kind:'stage'}:{id:o.id});
 },'确认报价');
};
A['quote-reject']=()=>{const o=current();if(!v12(o))return rejectQuote();const q=o.quoteVersions?.at(-1);if(o.status!=='quote'||!q)return;q.status='rejected';q.rejectedAt=new Date().toISOString();App.updateOrder(o.id,{status:'arrived',quoteApproved:false},'客户退回正式报价，等待重新沟通');App.go('order',{id:o.id});};
const addonView=V.addon,acceptAddon=A['addon-accept'],rejectAddon=A['addon-reject'];
V.addon=()=>{
 const o=current();if(!v12(o))return addonView();
 const ad=o.addon,can=ad&&ad.approved==null&&ad.status==='customer';
 return mobilePage('确认新增服务',`${card(`<h2>${e(ad?.name||'暂无增项')}</h2><p class="mt16">${e(ad?.reason||'')}</p>${row('新增服务费','¥'+money(ad?.amount))}${row('工期影响',Number(ad?.minutes||0)+'分钟')}${row('同意后的订单总额','¥'+money(o.amount+Number(ad?.amount||0)))}${(ad?.photos||[]).map(p=>`<img src="${p}" alt="增项证据" style="width:100%;border-radius:10px;margin-top:12px">`).join('')}`)}${notice('可以拒绝增项，原确认范围保留。新增范围需确认并满足付款条件后执行。')}`,`<button class="btn secondary" data-action="addon-reject" ${!can?'disabled':''}>拒绝增项</button><button class="btn" data-action="addon-accept" ${!can?'disabled':''}>同意增项</button>`);
};
A['addon-accept']=()=>{
 const o=current();if(!v12(o))return acceptAddon();
 const ad=o.addon;if(!ad||ad.approved!=null||ad.status!=='customer')return;
 confirmAction('同意新增服务',e(ad.name)+'，新增¥'+money(ad.amount)+'，工期影响'+ad.minutes+'分钟。',()=>{
  if(ad.approved!=null)return;ad.approved=true;ad.status='accepted';syncAddonHistory(o);o.flags??={};delete o.flags.addonPending;
  o.amount=Math.round((o.amount+ad.amount)*100)/100;o.flags.addonPayment=due(o,'addon')>0;
  App.updateOrder(o.id,{},'客户同意增项，按本阶段付款约定执行');App.go(o.flags.addonPayment?'payment':'order',o.flags.addonPayment?{id:o.id,kind:'addon'}:{id:o.id});
 },'同意增项');
};
A['addon-reject']=()=>{const o=current();if(!v12(o))return rejectAddon();if(!o.addon||o.addon.approved!=null)return;o.addon.approved=false;o.addon.status='rejected';syncAddonHistory(o);if(o.flags)delete o.flags.addonPending;App.updateOrder(o.id,{},'客户拒绝增项，继续原确认范围');App.go('order',{id:o.id});};
const paymentView=V.payment,pay=A.pay;
V.payment=()=>{
 const o=current();if(!v12(o))return paymentView();const kind=App.query.get('kind')||(o.status==='acceptance'?'balance':o.flags?.addonPayment?'addon':o.status==='ready'?'stage':'');if(!['stage','addon','balance'].includes(kind))return mobilePage('服务付款',notice('当前尚无可支付的确认款项，请先查看订单及报价状态。'),linkBtn('查看订单','order','full',{id:o.id}));
 const amount=due(o,kind),valid=kind==='balance'?o.status==='acceptance'&&o.customerAcceptance?.confirmedBy==='user':kind==='addon'?o.flags?.addonPayment:o.status==='ready';
 return mobilePage('支付服务款',`${card(orderSummary(o))}<div class="payment-card"><p>${kind==='balance'?'验收尾款':kind==='addon'?'新增服务本阶段差额':'本阶段开工款'}</p><div class="amount">¥${money(amount)}</div></div>${card(`${row('合同／确认总额','¥'+money(o.amount))}${row('前序已付款','¥'+money(o.paid))}${row('本次支付','¥'+money(amount))}`)}${notice('本地演示，不发生真实扣款。支付完成只更新对应付款节点。')}`,`<button class="btn full" data-action="pay-v12" data-kind="${e(kind)}" ${!valid||amount<=0?'disabled':''}>模拟支付 ¥${money(amount)}</button>`);
};
A.pay=el=>{const o=App.state.orders.find(o=>o.id===el.dataset.id);if(!v12(o))return pay(el);App.go('payment',{id:o.id,...(o.status==='acceptance'?{kind:'balance'}:o.flags?.addonPayment?{kind:'addon'}:o.status==='ready'?{kind:'stage'}:{})});};
A['pay-v12']=el=>{
 const o=current(),kind=el.dataset.kind;if(!v12(o))return;
 const valid=kind==='balance'?o.status==='acceptance'&&o.customerAcceptance?.confirmedBy==='user':kind==='addon'?o.flags?.addonPayment:o.status==='ready';
 const amount=due(o,kind);if(!valid||amount<=0)return;
 confirmAction('确认模拟支付','本次支付¥'+money(amount)+'，仅更新本地演示记录。',()=>{
  if(due(o,kind)!==amount)return;
  o.paid=Math.round((o.paid+amount)*100)/100;
  if(kind==='balance'){o.status='completed';o.acceptedAt=new Date().toISOString();}
  if(kind==='addon'&&o.flags)delete o.flags.addonPayment;
  (o.payments??=[]).push({id:'PAY'+Date.now(),kind,amount,status:'success',date:new Date().toISOString()});
  App.updateOrder(o.id,{},kind==='balance'?'客户验收并结清尾款':'本阶段费用支付完成');App.go('order',{id:o.id});
 },'确认模拟支付');
};
const acceptance=V.acceptance,acceptService=A['accept-service'];
V.acceptance=()=>{
 const o=current();let html=acceptance();if(!v12(o))return html;
 if(cents(o.amount)>200000||o.orderType==='project')html=html.replace('</main>',`${card(`${photoField('客户签名／书面验收记录（必填）','customer-acceptance',3)}${notice('本单需客户实名账号确认，并保留电子签名或书面验收证据。')}`)}</main>`);
 return html;
};
A['accept-service']=()=>{
 const o=current();if(!v12(o))return acceptService();
 if(o.status!=='acceptance')return;
 if(!document.getElementById('acceptance-check')?.checked){toast('请先核对并勾选服务验收');return;}
 if((cents(o.amount)>200000||o.orderType==='project')&&!App.uploads['customer-acceptance']?.length){toast('请补充客户签名或书面验收凭证');return;}
 if(!o.beforePhotos?.length||!o.afterPhotos?.length||!o.report){toast('完工资料尚未齐全，请联系师傅补充');return;}
 confirmAction('确认服务验收','确认本次服务记录，质保从本次验收合格起算。',()=>{
  o.customerAcceptance={confirmedBy:'user',date:new Date().toISOString(),evidence:App.uploads['customer-acceptance']||[]};
  if(due(o,'balance')>0)App.go('payment',{id:o.id,kind:'balance'});
  else{App.updateOrder(o.id,{status:'completed',acceptedAt:new Date().toISOString()},'客户验收通过，劳务报酬按约T＋7可付款');App.go('order',{id:o.id});}
 },'确认验收');
};
App.render();
})();
