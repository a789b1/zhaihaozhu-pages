(function(){
'use strict';
const DAY=86400000;
const copy=x=>JSON.parse(JSON.stringify(x));
const cents=x=>Math.round(Number(x||0)*100);
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const date=(offset=0)=>new Date(Date.now()+offset*DAY).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const now=()=>new Date().toISOString();
const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});
const photo='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="600" height="360" fill="#fff0e5"/><path d="M220 240v-95h160v95M200 145l100-65 100 65" stroke="#bd480d" fill="none" stroke-width="10"/><text x="300" y="310" text-anchor="middle" font-size="24" fill="#8d3b11">宅好住 · 服务记录样本</text></svg>');
const categories=[
 ['局改焕新',['空间局改','天地墙翻新','适老化改造']],
 ['维修服务',['水电维修','防水补漏','天地墙维修','门窗维修','家具维修','家电维修','家电清洁']],
 ['定制服务',['柜类定制','收纳改造']],
 ['安装服务',['家具安装','家电安装','卫浴安装','灯具及电气安装','门窗安装','五金与软装安装']]
];
const legacy={'水电系统':'水电维修','防水系统':'防水补漏','天地墙':'天地墙维修','门窗':'门窗维修','柜体收纳':'家具维修','五金与安装':'灯具及电气安装','清洗保养':'家电清洁','局部焕新':'天地墙翻新'};
const status={
 accepted:['待上门',1],enroute:['前往现场',1],arrived:['检测中',2],quote:['待报价确认',2],
 ready:['待开工',3],working:['服务中',3],addon:['服务中',3],acceptance:['待验收',4],
 completed:['已完成',5],cancelled:['已取消',-1],terminated:['已终止',-1],aftersale:['售后处理中',5],
 dispatching:['待匹配',0],offered:['待接单',0],pending:['待支付',0],refund:['退款处理中',-1],refunded:['已退款',-1]
};
function seedOrders(){
 const base={workerId:'w1',owner:'user',name:'林女士',address:'深圳市南山区阳光海景花园 3栋2单元1201室',district:'南山区',serviceId:'faucet',category:'水电维修',discount:0,created:stamp(),ruleVersion:'1.2',demoV12:true,logs:[],distance:1.2};
 const mk=(id,title,st,amount,extra={})=>({...copy(base),id:'W12-'+id,title,status:st,amount,original:amount,paid:amount,time:date()+' 15:00–16:00',spec:'标准服务',...extra});
 return [
 mk('DIAG','给排水检测','arrived',50,{orderType:'inspection',time:date()+' 09:00–10:00',quote:null,referenceLabor:100,remark:'水槽接口渗水，已支付50元检测费；现场确认维修范围。',logs:[['检测费已支付',date()+' 08:10'],['师傅已到场',date()+' 09:00']]}),
 mk('STANDARD','插座安装','accepted',160,{serviceId:'socket',category:'灯具及电气安装',orderType:'standard',time:date(1)+' 10:00–11:00',quote:{visit:0,labor:120,material:40},materialCost:32,quoteApproved:true,remark:'安装2个已确认型号的插座，基础上门已包含。'}),
 mk('WORK','墙面修补','working',600,{serviceId:'wall',category:'天地墙维修',orderType:'inspection',time:date()+' 12:00–14:00',quote:{visit:50,labor:450,material:100},materialCost:80,quoteApproved:true,referenceLabor:500,startedAt:now(),materials:[],stepsDone:[0],logs:[['客户确认报价并付清',date()+' 11:50'],['开始施工',date()+' 12:00']]}),
 mk('WAIT','柜门维修','acceptance',150,{serviceId:'cabinet',category:'家具维修',orderType:'inspection',time:date(-1)+' 14:00–15:00',quote:{visit:50,labor:60,material:40},materialCost:30,quoteApproved:true,report:'已调校铰链并更换损坏配件，开合测试正常。',beforePhotos:[photo],afterPhotos:[photo],materials:[{name:'铰链',quantity:1,unit:'个',cost:30}],completedAt:new Date(Date.now()-DAY).toISOString(),logs:[['提交完工资料，待客户验收',date(-1)+' 15:00']]}),
 mk('QUOTED','龙头漏水维修','quote',260,{orderType:'inspection',time:date(1)+' 14:00–15:00',paid:50,quote:{visit:50,labor:150,material:60},referenceLabor:150,quoteApproved:false,quoteVersions:[{id:'QV-DEMO',expiresAt:new Date(Date.now()+72*3600000).toISOString(),version:1,visit:50,labor:150,material:60,total:260,status:'customer',reason:'更换密封组件并测试。',createdAt:now()}]}),
 mk('COMPLETE','厨房水路维修','completed',500,{orderType:'inspection',time:date(-8)+' 10:00–11:00',quote:{visit:50,labor:350,material:100},materialCost:80,quoteApproved:true,acceptedAt:new Date(Date.now()-8*DAY).toISOString(),report:'更换接口并完成试压，现场已清洁。',beforePhotos:[photo],afterPhotos:[photo],logs:[['客户验收通过',date(-8)+' 11:00']]}),
 mk('POOL-1','灯具安装','dispatching',180,{workerId:null,category:'灯具及电气安装',serviceId:'socket',orderType:'standard',quote:{visit:0,labor:180,material:0},quoteApproved:true,address:'深圳市南山区科技园 科苑花园5栋602',district:'南山区',time:date(2)+' 09:00–10:00',distance:1.6,match:96}),
 mk('POOL-2','油烟机清洗','dispatching',138,{workerId:null,category:'家电清洁',serviceId:'hood',orderType:'standard',quote:{visit:0,labor:138,material:0},quoteApproved:true,address:'深圳市南山区海岸城花园2栋1503',district:'南山区',time:date(2)+' 14:00–15:00',distance:2.1,match:92}),
 mk('INVITE','角阀更换','offered',65,{workerId:null,invitedWorkerId:'w1',offerExpiresAt:Date.now()+30000,category:'卫浴安装',serviceId:'valve',orderType:'standard',quote:{visit:0,labor:30,material:35},materialCost:28,quoteApproved:true,time:date(3)+' 10:00–11:00',distance:1.3}),
 mk('TEAM-1','柜体安装','accepted',2400,{workerId:'w1',teamId:'team1',category:'家具安装',serviceId:'cabinet',orderType:'standard',paid:2400,quote:{visit:0,labor:2000,material:400},quoteApproved:true,time:date(2)+' 10:00–12:00',contractPay:1600}),
 mk('TEAM-2','卫浴安装','accepted',800,{workerId:'w2',teamId:'team1',category:'卫浴安装',serviceId:'valve',orderType:'standard',quote:{visit:0,labor:650,material:150},quoteApproved:true,time:date(1)+' 14:00–16:00',contractPay:520})
 ];
}
function seedProjects(){
 return [
 {id:'PRJ-KITCHEN',name:'厨房局部焕新',teamId:'team1',workerId:'w1',address:'深圳市南山区阳光海景花园',customer:'林女士',amount:30000,contractPay:12000,stage:2,contract:'HT-2026-001',surveyFee:150,survey:{size:'约8㎡',content:'保留现有布局，更换台面及局部柜体，做好成品保护。',photos:[photo],status:'已提交'},
 plans:[{id:'PLAN-1',version:1,title:'厨房局改方案 V1',dimensions:'台面长3.2m，深0.6m',content:'台面更新、柜门调校、水槽接口及防水收口。',status:'客户已签审',date:date(-10)}],
 procurement:[{name:'台面与收口件',status:'已到货'},{name:'定制柜门',status:'生产中'}],
 stages:[{name:'方案与开工',ratio:30,amount:9000,contractPay:3600,paid:true,status:'已验收',acceptanceAt:date(-8),evidence:[photo]},{name:'中期施工',ratio:40,amount:12000,contractPay:4800,workerId:'w2',paid:true,status:'施工中',evidence:[]},{name:'竣工验收',ratio:30,amount:9000,contractPay:3600,paid:false,status:'待开始',evidence:[]}],
 tasks:[{id:'PT-1',name:'现场保护与拆除',date:date(-2),workerId:'w1',status:'已完成'},{id:'PT-2',name:'台面及柜门安装',date:date(1),workerId:'w2',status:'待执行'},{id:'PT-3',name:'试水与收口检查',date:date(3),workerId:'w1',status:'待执行'}],changes:[],logs:[['方案签审完成',date(-10)],['首阶段验收通过',date(-8)]]},
 {id:'PRJ-WARDROBE',name:'卧室衣柜定制',workerId:'w1',address:'深圳市南山区科技园',customer:'陈先生',amount:18000,contractPay:6500,stage:0,contract:'HT-2026-002',surveyFee:150,survey:{size:'待复尺',content:'现场核对墙面、踢脚线和开门空间。',photos:[],status:'待勘测'},plans:[],procurement:[],stages:[{name:'设计签审与开工',ratio:30,amount:5400,paid:false,status:'待开始',evidence:[]},{name:'生产与进场',ratio:40,amount:7200,paid:false,status:'待开始',evidence:[]},{name:'安装与验收',ratio:30,amount:5400,paid:false,status:'待开始',evidence:[]}],tasks:[{id:'PT-4',name:'现场复尺',date:date(2),workerId:'w1',status:'待执行'}],changes:[],logs:[]}
 ];
}
function ensure(){
 const s=App.state;let changed=false;
 if(!s.workerV12){
  const pending=s.withdrawals.filter(w=>['pending','second','approved','processing','remitted'].includes(w.status));
  pending.forEach(w=>{w.workerId??='w1';w.w12Tracked=true;});
  s.workerV12={
   version:2,ruleVersion:'1.2',role:'personal',memberId:'w2',teamId:'team1',initializedAt:now(),
   profile:{name:'李明',nickname:'李师傅',phone:'13800006688',years:8,skills:['水电维修','灯具及电气安装','卫浴安装','家具维修','家电清洁'],qualification:'长期有效',scheduleStart:'08:00',scheduleEnd:'20:00'},
   members:[{id:'w1',name:'李明',title:'负责人',skills:['水电维修','家具安装','灯具及电气安装'],enabled:true,workdays:'周一至周六',start:'08:00',end:'20:00'},{id:'w2',name:'陈伟',title:'执行成员',skills:['卫浴安装','家具安装'],enabled:true,workdays:'周一至周六',start:'09:00',end:'18:00'},{id:'w3',name:'王建国',title:'执行成员',skills:['门窗维修','门窗安装'],enabled:false,workdays:'周一至周五',start:'09:00',end:'18:00'}],
   ledger:[{id:'L-OPEN',owner:'w1',name:'期初可付款报酬',kind:'carry',amount:cents(s.balance)+pending.reduce((a,w)=>a+cents(w.amount),0),status:'available',date:date(-10),ruleVersion:'历史快照'},
    {id:'L-FROZEN',owner:'w1',name:'争议款项待复核',kind:'labor',amount:Math.max(0,cents(s.frozen)-pending.reduce((a,w)=>a+cents(w.amount),0)),status:'frozen',date:date(-6),reason:'仅冻结本笔有争议的费用'},
    {id:'L-PAID',owner:'w1',name:'已到账劳务报酬',kind:'labor',amount:128000,status:'paid',date:date(-12),ref:'HISTORY-001'},
    {id:'L-PENDING',owner:'w1',name:'安装服务待结算',kind:'labor',amount:15200,status:'pending',date:date(-2),acceptedAt:new Date(Date.now()-2*DAY).toISOString(),ref:'HISTORY-002'},
    {id:'TL-OPEN',owner:'team1',name:'团队合同可付款',kind:'contract',amount:1260000,status:'available',date:date(-8),ref:'HT-TEAM-001'},
    {id:'TL-PAID',owner:'team1',name:'团队合同已到账',kind:'contract',amount:820000,status:'paid',date:date(-15),ref:'HT-TEAM-002'}],
   messages:[{id:'WM-1',type:'order',title:'当前工单待处理',text:'到场检测后，请逐项报价并等待客户确认。',route:'order',ref:'W12-DIAG',date:stamp(),unread:true},
    {id:'WM-2',type:'change',title:'项目施工计划已更新',text:'厨房局改进入中期施工，查看计划与材料状态。',route:'project',ref:'PRJ-KITCHEN',date:stamp(),unread:true},
    {id:'WM-3',type:'funds',title:'劳务报酬待结算',text:'结算时间按阶段验收 T＋7 自然日计算。',route:'transactions',date:date(-1),unread:false},
    {id:'WM-4',type:'system',title:'服务前先确认报价',text:'增项须经客户确认，审核不能代替客户同意。',route:'rules',date:date(-2),unread:false}],
   drafts:{},exceptions:[],quoteHistory:[],applications:[],materialRequests:[],creditAppeals:[],
   creditRecords:[{id:'CR-1',name:'合格完单恢复',points:1,date:date(-1),status:'已核验'},{id:'CR-2',name:'已核实迟到',points:-3,date:date(-5),status:'已核验',reason:'超过预约时段末端15分钟'}],
   projects:seedProjects(),reviews:[],training:[],courses:[{id:'safe',title:'上门安全与服务规范',minutes:12,category:'必修',question:'客户尚未确认增项时应如何处理？',options:['直接施工后补确认','等待确认，继续原范围可独立完成的工作','让客户线下补现金'],answer:1},{id:'quote',title:'现场检测与透明报价',minutes:16,category:'报价',question:'报价中已经包含的检测费应如何处理？',options:['计入总价一次，抵扣已付部分','再次收费','从材料款重复扣除'],answer:0},{id:'finish',title:'完工记录与质量验收',minutes:10,category:'质量',question:'师傅提交完工记录后，订单应进入什么状态？',options:['已到账','已完成','待验收'],answer:2}],
   referrals:[{id:'REF-1',name:'赵师傅',entity:'personal',confirmed:true,status:'有效',start:date(-35),end:date(330),orders:12},{id:'REF-2',name:'安心安装团队',entity:'team',confirmed:false,status:'待对方确认',start:null,end:null,orders:0}],
   commissions:[{id:'COM-1',referralId:'REF-1',orderRef:'TJ-2026-001',base:100000,amount:2000,status:'pending',acceptedAt:new Date(Date.now()-2*DAY).toISOString(),paidAt:new Date(Date.now()-DAY).toISOString(),date:date(-1)},{id:'COM-2',referralId:'REF-1',orderRef:'TJ-2026-002',base:200000,amount:4000,status:'paid',date:date(-20)},{id:'COM-3',referralId:'REF-1',orderRef:'TJ-2026-002',base:-50000,amount:-1000,status:'recovery',date:date(-3),reason:'部分服务退款，已付佣金待追回'}],
   reward:{budget:100000,used:20000,amount:1000,applications:[],title:'完成上门安全培训',demo:true},
   houses:[{id:'H-1',orderId:'W12-DIAG',authorized:true,title:'阳光海景花园 · 基础档案',age:'2016年',history:[{name:'给排水接口维修',date:date(-120),warranty:'同维修点人工90日'},{name:'厨房防水工程',date:date(-360),warranty:'合同约定防渗漏5年'}],devices:[{name:'厨房水槽',model:'型号未知'},{name:'电热水器',model:'客户尚未补充'}]}]
  };
  changed=true;
 }
 const w=s.workerV12;
 if(w.version<2){
  for(const p of w.projects||[]){if(p.id==='PRJ-KITCHEN')p.stages.forEach((stage,i)=>{stage.contractPay??=[3600,4800,3600][i];if(i===1)stage.workerId??='w2';});}
  for(const o of s.orders.filter(o=>o.demoV12))for(const q of o.quoteVersions||[])if(!q.expiresAt&&q.createdAt)q.expiresAt=new Date(Date.parse(q.createdAt)+72*3600000).toISOString();
  w.version=2;changed=true;
 }
 if(!w.ordersSeeded){
  const ids=new Set(s.orders.map(o=>o.id));
  seedOrders().forEach(o=>{if(!ids.has(o.id))s.orders.push(o);});
  w.ordersSeeded=true;changed=true;
 }
 s.settings??={};s.preferences??={radius:5,maxOrders:5,minPrice:0};
 s.workerCredit??=96;
 if(changed)App.save();
 return w;
}
const state=()=>ensure();
const role=()=>state().role;
const actor=()=>role()==='member'?state().memberId:'w1';
const owner=()=>role()==='leader'?'team1':actor();
const isLeader=()=>role()==='leader';
const profile=()=>{if(actor()==='w1')return state().profile;const m=state().members.find(x=>x.id===actor());return state().memberProfile??(state().memberProfile={name:m?.name||'陈伟',nickname:'陈师傅',phone:'13800008888',years:10,skills:m?.skills||[],qualification:'长期有效',scheduleStart:m?.start||'09:00',scheduleEnd:m?.end||'18:00'});};
const verified=()=>actor()==='w1'?App.state.workerVerified:state().memberVerified!==false;
const online=()=>actor()==='w1'?App.state.workerOnline:state().memberOnline!==false;
const setOnline=value=>{if(actor()==='w1')App.state.workerOnline=value;else state().memberOnline=value;};
const setVerified=value=>{if(actor()==='w1')App.state.workerVerified=value;else state().memberVerified=value;};
const preferences=()=>actor()==='w1'?App.state.preferences:(state().memberPreferences??(state().memberPreferences={radius:5,maxOrders:5,minPrice:0,skillsV12:profile().skills}));
const setPreferences=value=>{if(actor()==='w1')App.state.preferences=value;else state().memberPreferences=value;};

const own=o=>!!o&&(isLeader()?o.teamId==='team1':role()==='member'?o.teamId==='team1'&&o.workerId===actor():o.workerId===actor()&&!o.teamId);
const actionable=o=>own(o)&&o.workerId===actor();
const jobs=()=>App.state.orders.filter(own);
const type=o=>o.orderType||(ZHZ_SERVICES.find(s=>s.id===o.serviceId)?.fixed?'standard':'inspection');
const label=o=>status[o?.status]?.[0]||'待处理';
const category=o=>legacy[o.category]||o.category;
const credit=()=>Math.min(100,Math.max(0,num(role()==='member'?(state().memberCredit??98):App.state.workerCredit??96)));
const active=o=>!['completed','cancelled','terminated','refunded'].includes(o.status);
const moneyFromCents=x=>num(x)/100;
function available(){
 return App.state.orders.filter(o=>['dispatching','offered'].includes(o.status)&&(!slot(o)||slot(o).end>Date.now())&&!o.workerId&&(!o.invitedWorkerId||o.invitedWorkerId===actor())&&!(o.declinedBy||[]).includes(actor()));
}
function canGrab(o){
 if(role()==='member')return '团队成员由负责人分配工单';
 if(!verified())return '请先完成入驻认证';
 if(!online())return '当前处于休息状态';
 if(credit()<40)return '信用低于40分，等待人工复审';
 if(credit()<60)return '信用低于60分，暂停新接单';
 if(credit()<80&&!o.manualApproved)return '信用低于80分，仅可接运营确认的预约单';
 if(credit()<80&&jobs().filter(x=>x.takenAt?.startsWith(date())).length>=2)return '当前信用每天最多接2笔预约单';
 if(!available().some(x=>x.id===o?.id))return '订单已被接走或邀请已变化';
 if(o.status==='offered'&&o.offerExpiresAt&&Date.now()>o.offerExpiresAt)return '指派邀请已超时';
 const skills=preferences().skillsV12||profile().skills;
 if(!skills.includes(category(o))||!profile().skills.includes(category(o)))return '当前技能资质不匹配';
 if(num(o.distance)>num(preferences().radius||5))return '超出接单范围';
 if(num(o.amount)<num(preferences().minPrice))return '低于接单最低金额';
 if(jobs().filter(x=>active(x)&&slot(x)?.end>Date.now()).length>=num(preferences().maxOrders||5))return '已达到未来预约接单数量上限';
 const t=slot(o);
 if(t){const start=new Date(t.start).toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}),end=new Date(t.end).toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'});if(start<profile().scheduleStart||end>profile().scheduleEnd)return '预约超出可接单时段';}
 if(t&&jobs().filter(active).some(x=>{const a=slot(x);return a&&t.start<a.end+1800000&&a.start<t.end+1800000;}))return '与已接预约冲突，需保留30分钟交通缓冲';
 return '';
}
function slot(o){
 const text=o.time||'',m=text.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})[–—~-](\d{2}:\d{2})/);
 return m?{start:Date.parse(m[1]+'T'+m[2]+':00+08:00'),end:Date.parse(m[1]+'T'+m[3]+':00+08:00')}:null;
}
function estimate(o){
 if(o.contractPay!=null)return cents(o.contractPay);
 if(type(o)==='project')return null;
 const q=o.quote||{};
 const approvedAddons=[...new Map([...(o.addonHistory||[]),...(o.addon?[o.addon]:[])].map(a=>[a.id||a.name,a])).values()].filter(a=>a.approved===true).reduce((a,x)=>a+cents(x.amount),0);
 const service=o.quote?cents(q.visit)+cents(q.labor)+approvedAddons:type(o)==='inspection'?5000:null;
 return service==null?null:service-Math.floor(service*.2);
}
function settlementStatus(entry){
 if(entry.status==='pending'&&entry.acceptedAt){
  const t=Date.parse(entry.acceptedAt);
  if(Number.isFinite(t)&&Date.now()>=t+7*DAY)return 'available';
 }
 return entry.status;
}
function entries(){
 const w=state();
 // A settlement entry is created once, only after actual customer acceptance.
 jobs().filter(o=>o.status==='completed'&&o.acceptedAt).forEach(o=>{
  if(w.ledger.some(l=>l.ref===o.id))return;
  const labor=estimate(o);if(labor==null)return;
  const basis=o.teamId?'team1':o.workerId;
  w.ledger.push({id:'L-'+o.id,owner:basis,ref:o.id,name:o.title,kind:o.teamId?'contract':'labor',amount:labor,status:'pending',date:o.acceptedAt.slice(0,10),acceptedAt:o.acceptedAt,ruleVersion:o.ruleVersion||'历史合同'});
  if(o.materialCost)w.ledger.push({id:'LM-'+o.id,owner:basis,ref:o.id,name:o.title+' · 材料采购款',kind:'material',amount:cents(o.materialCost),status:'pending',date:o.acceptedAt.slice(0,10),acceptedAt:o.acceptedAt,ruleVersion:o.ruleVersion||'历史合同'});
  App.save();
 });
 for(const project of w.projects){
  const paymentOwner=project.teamId||project.workerId;
  if(paymentOwner!==owner())continue;
  project.stages.forEach((stage,index)=>{
   const id='LP-'+project.id+'-'+index;
   if(stage.status==='已验收'&&stage.acceptanceAt&&stage.contractPay&&!w.ledger.some(l=>l.id===id)){
    w.ledger.push({id,owner:paymentOwner,ref:project.contract,name:project.name+' · '+stage.name,kind:'contract',amount:cents(stage.contractPay),status:'pending',date:stage.acceptanceAt.slice(0,10),acceptedAt:new Date(stage.acceptanceAt+'T12:00:00+08:00').toISOString(),ruleVersion:'审批合作合同'});App.save();
   }
  });
 }
 const referralIds=new Set(w.referrals.filter(r=>(r.owner||'w1')===owner()).map(r=>r.id));
 for(const commission of w.commissions.filter(x=>referralIds.has(x.referralId))){
  const id='LC-'+commission.id;if(w.ledger.some(l=>l.id===id))continue;
  const times=[commission.acceptedAt,commission.paidAt].filter(Boolean).map(x=>Date.parse(x));
  w.ledger.push({id,owner:owner(),name:commission.amount<0?'推荐佣金退款调整':'直接推荐佣金',kind:'commission',amount:commission.amount,status:commission.status==='recovery'?'recovery':commission.status==='paid'?'paid':'pending',acceptedAt:times.length===2?new Date(Math.max(...times)).toISOString():undefined,date:commission.date,ref:commission.orderRef,reason:commission.reason,ruleVersion:'1.2'});App.save();
 }
 return w.ledger.filter(l=>l.owner===owner()).map(l=>({...l,status:settlementStatus(l)}));
}
function withdrawals(){
 return App.state.withdrawals.filter(w=>(w.owner||w.workerId||'w1')===owner());
}
function balances(){
 const rows=entries(),ws=withdrawals();
 const taken=ws.filter(w=>w.w12Tracked&&!['rejected','cancelled','failed'].includes(w.status)).reduce((a,w)=>a+cents(w.amount),0);
 const reserved=ws.filter(w=>['pending','second','approved','processing','remitted'].includes(w.status)).reduce((a,w)=>a+cents(w.amount),0);
 const sum=status=>rows.filter(l=>l.status===status).reduce((a,l)=>a+l.amount,0);
 const result={available:Math.max(0,sum('available')-taken),pending:sum('pending'),frozen:sum('frozen')+reserved,paid:sum('paid')+ws.filter(w=>w.status==='paid').reduce((a,w)=>a+cents(w.actual),0),estimated:jobs().filter(active).reduce((a,o)=>a+(estimate(o)||0),0)};
 if(owner()==='w1'&&(cents(App.state.balance)!==result.available||cents(App.state.frozen)!==result.frozen)){App.state.balance=result.available/100;App.state.frozen=result.frozen/100;App.save();}
 return result;
}
function quoteCheck(o,q){
 const labor=cents(q.labor),baseReference=cents(o.referenceLabor||o.quote?.labor||0);let reference=baseReference,missing=false;
 if(q.lines?.length){reference=q.lines.reduce((sum,line,i)=>{if(!cents(line.labor))return sum;if(i!==0||line.unit!=='项'||!baseReference){missing=true;return sum;}return sum+Math.round(baseReference*num(line.quantity));},0);}
 if(missing)return {review:true,confirm:false,ratio:0,excess:0,reason:'新增人工项或计量单位缺少同规格模板，需人工核价'};
 if(!labor&&q.lines?.length)return {review:false,confirm:false,ratio:0,excess:0,reason:'本次未增加人工费用'};
 if(!reference)return {review:true,confirm:false,ratio:0,excess:0,reason:'缺少有效人工参考模板，需人工核价'};
 const excess=Math.max(0,labor-reference),ratio=excess/reference;
 return {review:ratio>.5||excess>=50000,confirm:ratio>.15,ratio,excess,reason:ratio>.5||excess>=50000?'超过人工报价审核门槛':ratio>.15?'人工报价超过参考上限15%，客户需二次确认':'人工报价处于参考范围'};
}
function addonsReview(o,amount){
 const base=cents(o.baseServiceAmount||num(o.quote?.labor)+num(o.quote?.visit));
 const sum=(o.addonHistory||[]).filter(a=>a.approved!==false).reduce((a,x)=>a+cents(x.amount),0)+cents(amount);
 return sum>=50000||base>0&&sum/base>.3;
}
function notify(type,title,text,route='orders',ref='',recipient=owner()){
 state().messages.unshift({id:'WM'+Date.now()+Math.random().toString(36).slice(2,6),type,title,text,route,ref,date:stamp(),unread:true,recipient});
}
function hasActiveWork(exceptId=''){return App.state.orders.some(o=>o.id!==exceptId&&o.workerId===actor()&&['working','addon'].includes(o.status))||state().projects.some(p=>p.stages.some(stage=>stage.status==='施工中'&&stage.workerId===actor()));}
function findOrder(id=App.query.get('id')){return App.state.orders.find(o=>o.id===id);}
function getDraft(key){return copy(state().drafts[key]||{});}
function saveDraft(key,form){state().drafts[key]=Object.fromEntries(new FormData(form));App.save();}
function validAmount(value){return /^\d+(\.\d{1,2})?$/.test(String(value))&&num(value)>0;}
window.Worker={
 state,role,actor,owner,isLeader,profile,verified,online,setOnline,setVerified,preferences,setPreferences,hasActiveWork,own,actionable,jobs,available,canGrab,type,label,category,credit,active,estimate,entries,withdrawals,balances,quoteCheck,addonsReview,notify,findOrder,slot,date,now,stamp,cents,num,moneyFromCents,categories,photo,getDraft,saveDraft,validAmount,status,copy
};
ensure();
})();
