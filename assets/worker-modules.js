(function(){
'use strict';
const W=Worker,V=App.views,A=App.actions,U=WorkerUI;
const {page,box,grid,link,button,chips,note,emptyCard,denied,orderGate,orderTitle,check,demand,c,n,fmt,s}=U;
function teamAccess(){return W.role()!=='personal';}
function teamBlocked(){return page('团队协作',`${box('一个团队，清楚分工',`<p class="w-body-copy">负责人维护成员、排班与执行分工，平台按团队合同结算。成员处理自己被分配的任务。</p>${button('切换身份查看团队示例','switch-role','','secondary full')}`)}`);}
V.team=()=>{
 if(!teamAccess())return teamBlocked();
 const teamJobs=App.state.orders.filter(o=>o.teamId==='team1'),active=teamJobs.filter(W.active);
 return page('团队工作台',`${box('安心家修服务团队',`<div class="between"><h2>${W.isLeader()?'团队负责人':'团队执行成员'}</h2>${badge('合同合作方','green')}</div>${note('主责师傅与协作人员分别记录，团队报酬统一归经营主体。')}<div class="w-three-stats"><div><strong>${s().members.filter(m=>m.enabled).length}</strong><small>可用成员</small></div><div><strong>${active.length}</strong><small>未完工单</small></div><div><strong>${teamJobs.filter(o=>o.status==='completed').length}</strong><small>已完成</small></div></div>`)}
 ${card(grid(W.isLeader()?[['团队成员','team-members','users'],['团队排班','team-schedule','clock'],['工单分配','team-assign','clipboard'],['团队收入','wallet','wallet']]:[['我的任务','orders','clipboard'],['我的排班','team-schedule','clock'],['施工标准','knowledge','file'],['团队资料','team-members','users']]))}
 ${box('团队工单',(W.isLeader()?active:active.filter(o=>o.workerId===W.actor())).map(o=>`<div class="w-record"><div class="between"><h3>${e(o.title)}</h3>${U.stateBadge(o)}</div><p class="w-body-copy">执行：${e(s().members.find(m=>m.id===o.workerId)?.name||'待分配')} · ${e(o.time)}</p>${linkBtn('工单详情','order','plain full',{id:o.id})}${W.isLeader()?linkBtn('调整分工','team-assign','secondary full',{id:o.id}):''}</div>`).join('')||note('暂无团队任务'))}`);
};
V['team-members']=()=>{
 if(!teamAccess())return teamBlocked();
 return page('团队成员',s().members.map(m=>card(`<div class="between"><div class="flex gap12">${avatar(m.name)}<div><h3>${e(m.name)}</h3><p>${e(m.title)}</p></div></div>${badge(m.enabled?'可接任务':'暂停分配',m.enabled?'green':'gray')}</div><div class="chips mt12">${m.skills.map(x=>badge(x)).join(' ')}</div>${note(e(m.workdays)+' '+e(m.start)+'—'+e(m.end))}${W.isLeader()?button('编辑技能与排班','member-edit',`data-id="${e(m.id)}"`,'secondary full mt12'):''}`)).join('')+(W.isLeader()?button('邀请团队成员','member-invite','','secondary full mt16'):''));
};
A['member-edit']=el=>{
 if(!W.isLeader())return;
 const m=s().members.find(x=>x.id===el.dataset.id);if(!m)return;App.temp.memberEditId=m.id;
 dialog('成员技能与排班',`<form id="member-form" data-form="save-member"><h3>${e(m.name)}</h3>${field('工作日','workdays',m.workdays,'text','required maxlength="50"')}<div class="w-form-two">${field('开始时间','start',m.start,'time','required')}${field('结束时间','end',m.end,'time','required')}</div>${selectField('任务分配状态','enabled',[['yes','允许分配'],['no','暂停分配']],m.enabled?'yes':'no')}<div class="w-skill-options">${W.categories.flatMap(x=>x[1]).map(x=>`<label><input name="skills" type="checkbox" value="${x}" ${m.skills.includes(x)?'checked':''}>${x}</label>`).join('')}</div>${note('新增技能提交平台核验，通过前不扩大已认证的接单范围。')}</form>`,`<button class="btn" form="member-form">保存成员资料</button>`);
};
A['save-member']=(f,fd)=>{
 if(!W.isLeader())return;const m=s().members.find(x=>x.id===App.temp.memberEditId);if(!m)return;
 if(fd.get('start')>=fd.get('end')||!fd.getAll('skills').length){toast('请核对时段并选择至少1项技能');return;}
 const skills=fd.getAll('skills'),added=skills.filter(x=>!m.skills.includes(x));
 m.start=fd.get('start');m.end=fd.get('end');m.workdays=fd.get('workdays');m.enabled=fd.get('enabled')==='yes';m.skills=m.skills.filter(x=>skills.includes(x));
 if(added.length){m.pendingSkills=added;App.state.approvals.push({id:'AP'+Date.now(),type:'团队技能审核',name:m.name+'：'+added.join('、'),memberId:m.id,teamId:'team1',skills:added,status:'pending',by:'团队负责人',date:W.stamp()});}
 App.save();closeDialog();App.render();toast(added.length?'排班已保存，新增技能待审核':'成员资料已保存');
};
A['member-invite']=()=>{if(!W.isLeader())return;dialog('邀请团队成员',`<form id="member-invite-form" data-form="member-invite-submit">${field('成员姓名','name','','text','required maxlength="20"')}${field('联系号码尾号（演示）','phone','','text','required inputmode="numeric" pattern="[0-9]{4}" maxlength="4"')}${note('对方确认并完成资质核验后，才能分配工单。')}</form>`,`<button class="btn" form="member-invite-form">生成入队邀请</button>`);};
A['member-invite-submit']=(f,fd)=>{if(!W.isLeader())return;s().applications.push({id:'TI'+Date.now(),kind:'team-invite',name:fd.get('name'),phone:'***'+fd.get('phone'),status:'待对方确认',date:W.stamp(),owner:W.owner()});App.save();closeDialog();dialog('邀请已生成',`<p>${e(fd.get('name'))}的入队邀请已记录，等待对方确认。</p>${note('邀请记录保存在当前浏览器，不发送真实短信。')}`,button('查看邀请记录','open-team-invites','','secondary'));};
A['open-team-invites']=()=>{closeDialog();App.go('team-invites');};
V['team-invites']=()=>!W.isLeader()?denied():page('团队邀请记录',s().applications.filter(x=>x.kind==='team-invite'&&x.owner===W.owner()).map(x=>card(`<div class="between"><h3>${e(x.name)}</h3>${badge(x.status)}</div>${note(e(x.date))}`)).join('')||emptyCard('暂无团队邀请'));
V['team-schedule']=()=>{
 if(!teamAccess())return teamBlocked();
 const members=W.isLeader()?s().members:s().members.filter(m=>m.id===W.actor());
 return page('团队排班',members.map(m=>box(e(m.name),`${row('工作日',e(m.workdays))}${row('可用时段',e(m.start)+'—'+e(m.end))}${App.state.orders.filter(o=>o.teamId==='team1'&&o.workerId===m.id&&W.active(o)).map(o=>`<div class="w-record"><strong>${e(o.title)}</strong><p>${e(o.time)}</p></div>`).join('')||note('暂无已分配工单')}${W.isLeader()?button('调整排班','member-edit',`data-id="${e(m.id)}"`,'plain full'):''}`)).join(''));
};
V['team-assign']=()=>{
 if(!W.isLeader())return denied('仅团队负责人可以分配工单。');
 const id=App.query.get('id'),list=App.state.orders.filter(o=>o.teamId==='team1'&&W.active(o)&&(!id||o.id===id));
 return page('执行分工',list.map(o=>box(e(o.title),`<p class="w-body-copy">${e(o.time)} · ${e(W.category(o))}</p><form data-form="assign-team-job"><input type="hidden" name="orderId" value="${e(o.id)}">${selectField('主责执行人','member',s().members.map(m=>[m.id,m.name+(m.enabled?'':'（暂停）')]),o.workerId)}${field('协作说明','note','','text','maxlength="200" placeholder="协作人员不重复产生平台付款"')}<button class="btn secondary full">保存分工</button></form>`)).join('')||emptyCard('暂无待分配团队工单'));
};
A['assign-team-job']=(f,fd)=>{
 if(!W.isLeader())return;const o=W.findOrder(fd.get('orderId')),m=s().members.find(x=>x.id===fd.get('member'));if(!o||o.teamId!=='team1'||!W.active(o))return;
 if(['working','addon','acceptance'].includes(o.status)){toast('已施工或待验收工单需向平台申请转派');return;}
 if(!m?.enabled||!m.skills.includes(W.category(o))){toast('成员状态或已认证技能不匹配');return;}
 const t=W.slot(o),conflict=App.state.orders.some(x=>x.id!==o.id&&x.workerId===m.id&&W.active(x)&&(()=>{const a=W.slot(x);return a&&t&&t.start<a.end+1800000&&a.start<t.end+1800000;})());
 if(conflict){toast('成员预约冲突，需保留30分钟交通缓冲');return;}
 App.updateOrder(o.id,{workerId:m.id,assignmentNote:fd.get('note')},'团队分配主责执行人：'+m.name);W.notify('change','执行分工已更新',o.title,'order',o.id);App.save();toast('分工已保存，原执行人权限已更新');App.render();
};
function ownReferrals(){return s().referrals.filter(r=>(r.owner||'w1')===W.owner());}
function ownCommissions(){const ids=new Set(ownReferrals().map(r=>r.id));return s().commissions.filter(x=>ids.has(x.referralId));}
function commissionStatus(x){
 if(x.status==='pending'&&x.acceptedAt&&x.paidAt&&Date.now()>=Math.max(Date.parse(x.acceptedAt),Date.parse(x.paidAt))+7*86400000)return '可付款';
 return {pending:'待结算',paid:'已到账',recovery:'退款待追回',recovered:'已冲回'}[x.status]||x.status;
}
V.referrals=()=>{
 if(W.role()==='member')return page('推荐收益',notice('团队订单按团队经营主体的推荐关系计佣，不叠加成员个人关系。'));
 const rows=ownCommissions();
 return page('推荐收益',`${box('直接推荐，一层关系',`<p class="w-body-copy">推荐独立师傅或团队经营主体，对方确认关系后按规则记录收益。</p><div class="w-three-stats"><div><strong>${ownReferrals().length}</strong><small>推荐对象</small></div><div><strong>¥${fmt(rows.filter(x=>x.status==='paid').reduce((a,x)=>a+x.amount,0))}</strong><small>已到账</small></div><div><strong>¥${fmt(rows.filter(x=>x.status==='pending').reduce((a,x)=>a+x.amount,0))}</strong><small>待结算</small></div></div>${button('生成邀请','referral-invite','','full mt16')}`)}
 ${box('推荐关系',ownReferrals().map(r=>link(`<div><strong>${e(r.name)}</strong><p>${e(r.entity==='team'?'团队经营主体':'独立师傅')} · ${e(r.status)}</p></div>${icon('arrow',18)}`,'referral-detail',{id:r.id},'w-message-row')).join('')||note('暂无推荐关系'))}
 ${box('收益记录',rows.map(x=>`<div class="w-record"><div class="between"><h3>${e(x.orderRef)}</h3><b>¥${fmt(x.amount)}</b></div><p>${commissionStatus(x)} · ${e(x.date)}</p>${note('计佣服务基数¥'+fmt(x.base)+' × 2%')}${x.reason?notice(e(x.reason),'orange'):''}</div>`).join('')||note('暂无收益记录'))}
 ${note('有效期从首个付清且验收订单起12个月；期内接单锁定资格。材料、独立检测／勘测不参与推荐计佣，不因招募人数发奖励。')}`);
};
A['referral-invite']=()=>{if(W.role()==='member')return;dialog('生成直接推荐邀请',`<form id="referral-form" data-form="create-referral">${field('被邀请主体名称','name','','text','required maxlength="40"')}${selectField('主体类型','entity',[['personal','独立师傅'],['team','团队经营主体']])}${note('仅生成本地演示邀请；对方确认前不建立生效关系。')}</form>`,`<button class="btn" form="referral-form">生成邀请</button>`);};
A['create-referral']=(f,fd)=>{
 if(W.role()==='member')return;const name=String(fd.get('name')).trim();
 if(name===W.profile().name||name==='安心家修服务团队'||ownReferrals().some(r=>r.name===name)){toast('不能自荐或重复绑定同一主体');return;}
 const id='REF'+Date.now();s().referrals.push({id,owner:W.owner(),name,entity:fd.get('entity'),confirmed:false,status:'待对方确认',start:null,end:null,orders:0,createdAt:W.now()});App.save();closeDialog();App.go('referral-detail',{id});
};
V['referral-detail']=()=>{
 const r=ownReferrals().find(x=>x.id===App.query.get('id'));if(!r)return denied();
 return page('推荐关系详情',`${box(e(r.name),`${row('主体类型',r.entity==='team'?'团队经营主体':'独立师傅')}${row('关系状态',e(r.status))}${row('对方确认',r.confirmed?'已确认':'等待对方确认')}${row('生效日期',e(r.start||'首个付清且验收订单后起算'))}${row('到期日期',e(r.end||'生效后12个自然月'))}${row('关联有效订单',n(r.orders)+'笔')}${row('直接推荐比例','2%')}${note('推荐人仅查看必要订单编号及收益，客户地址、电话和完整团队数据不开放。')}`)}
 ${!r.confirmed?box('邀请信息',`${row('本地邀请码',e(r.id))}${note('对方须在首次接单前确认，主体只能有一个有效推荐人。邀请人不能代替对方确认。')}${button('下载邀请说明','download-referral',`data-id="${e(r.id)}"`,'secondary full')}`):''}`);
};
A['download-referral']=el=>{const r=ownReferrals().find(x=>x.id===el.dataset.id);if(!r)return;downloadFile('宅好住-推荐邀请.txt',['宅好住直接推荐邀请（本地演示）','对象：'+r.name,'邀请码：'+r.id,'待本人确认；不产生真实消息或资金。'].join('\n'));};
const knowledgeNames=[
 ['水电维修','接口渗漏排查'],['水电维修','下水排水不畅'],['水电维修','角阀异常检查'],['水电维修','插座异常检修'],['水电维修','照明回路检查'],
 ['防水补漏','卫生间渗漏勘查'],['防水补漏','管根接缝检查'],['防水补漏','密封胶老化处理'],['防水补漏','外墙渗水排查'],['防水补漏','闭水验收记录'],
 ['天地墙维修','墙面开裂检查'],['天地墙维修','瓷砖空鼓勘查'],['天地墙维修','地板起拱检查'],['天地墙维修','吊顶破损检查'],['天地墙维修','踢脚线修复'],
 ['门窗维修','门扇开合调校'],['门窗维修','门窗五金检查'],['门窗维修','纱窗破损处理'],['家具维修','柜门铰链调校'],['家具维修','抽屉滑轨维修'],
 ['家电维修','电器故障记录'],['家电清洁','油烟机清洗防护'],['家电清洁','空调清洗检查'],['卫浴安装','龙头安装验收'],['灯具及电气安装','灯具安装检查'],
 ['空间局改','局改成品保护'],['天地墙翻新','墙面翻新勘查'],['柜类定制','柜体现场复尺'],['收纳改造','加装隔板记录'],['适老化改造','扶手加装勘查']
];
const knowledge=knowledgeNames.map(([category,title],i)=>({id:'K'+(i+1),category,title,type:i%3===0?'案例':i%3===1?'施工标准':'问题模板',materials:['按现场尺寸和已确认方案选配','核对材料规格、归属和采购凭证'],scope:'记录问题位置、现场条件及现有损坏，检查是否需要专项资质或进一步检测。',questions:['具体问题出现多久？','是否影响相邻部位或设备？','是否有既往维修及质保记录？'],warning:'范围、人工及材料分别报价；缺少有效参考模板时提交人工核价。超出确认范围须先申请增项。'}));
V.knowledge=()=>{
 const q=App.query.get('q')||'',category=App.query.get('category')||'all',type=App.query.get('type')||'all';
 const rows=knowledge.filter(k=>(!q||(k.title+k.category).includes(q))&&(category==='all'||k.category===category)&&(type==='all'||k.type===type));
 return page('知识与案例',`${card(`<form class="w-search-form" data-form="knowledge-search"><label class="search-box">${icon('search',18)}<input name="q" value="${e(q)}" placeholder="搜索故障、工艺或用料" aria-label="搜索知识"></label><button class="btn small secondary">搜索</button></form>`)}
 ${chips([['all','全部'],['问题模板','问题模板'],['施工标准','施工标准'],['案例','维修案例']],type,'type','knowledge',{q,category})}
 <form class="w-inline-filter" data-form="knowledge-filter">${selectField('服务分类','category',[['all','全部分类'],...W.categories.flatMap(x=>x[1]).map(x=>[x,x])],category)}<input type="hidden" name="type" value="${e(type)}"><button class="btn small secondary">筛选</button></form>
 ${rows.map(k=>card(link(`<div class="between"><h3>${e(k.title)}</h3>${badge(k.type)}</div><p class="w-body-copy">${e(k.category)} · 范围、用料、报价与验收提示</p>`, 'knowledge-detail',{id:k.id}))).join('')||emptyCard('没有匹配内容','换个关键词或分类试试。')}${note('30条高频问题与施工记录示例，正式发布需经过专业审核。')}`);
};
A['knowledge-search']=(f,fd)=>App.go('knowledge',{q:String(fd.get('q')||'').trim()});
A['knowledge-filter']=(f,fd)=>App.go('knowledge',Object.fromEntries(fd));
V['knowledge-detail']=()=>{
 const k=knowledge.find(x=>x.id===App.query.get('id'));if(!k)return denied();
 return page(k.title,`${box(e(k.title),`${badge(k.type)} ${badge(k.category)}${note('版本V1.2 · 演示内容，正式施工按已审定规范及资质要求执行。')}`)}
 ${box('现场检查与问题记录',`<p class="w-body-copy">${k.scope}</p><ul class="w-copy-list">${k.questions.map(q=>'<li>'+e(q)+'</li>').join('')}</ul>`)}
 ${box('材料与工具建议',`<ul class="w-copy-list">${k.materials.map(x=>'<li>'+e(x)+'</li>').join('')}</ul>`)}
 ${box('报价与增项提醒',notice(k.warning,'orange'))}
 ${box('施工与验收记录',`<ol class="w-copy-list"><li>核对客户授权与已确认范围，现场防护。</li><li>由具备资质人员按审定方案施工，记录实际用料。</li><li>保留必要前后照片及测试结果，交客户验收。</li></ol>`)}
 ${k.type==='案例'?box('案例照片',`<div class="w-proof-grid"><figure><img src="${W.photo}" alt="演示案例施工前记录"><figcaption>施工前记录</figcaption></figure><figure><img src="${W.photo}" alt="演示案例完工记录"><figcaption>完工记录</figcaption></figure></div>${note('案例样例用于展示记录方式，不作为现场诊断结论。')}`):''}`);
};
V.house=()=>{
 const o=U.current();if(!check(o,false))return denied();
 const h=s().houses.find(x=>x.orderId===o.id&&x.authorized);
 if(!h)return page('房屋与设备记录',notice('本单尚无获授权的历史档案。可记录本次现场情况，房龄及设备型号允许未知。'));
 return page('房屋与设备记录',`${box(e(h.title),`${row('房屋年份',e(h.age||'未知'))}${note('仅展示本单获授权的历史记录，不自动向同地址的其他客户开放。')}`)}
 ${box('历史服务与质保',h.history.map(x=>`<div class="w-record"><strong>${e(x.name)}</strong><p>${e(x.date)}</p><small>${e(x.warranty)}</small></div>`).join(''))}
 ${box('设备台账',h.devices.map(x=>row(e(x.name),e(x.model||'型号未知'))).join(''))}`);
};
V.training=()=>page('培训学习',`${box('学习进度',`${row('已通过课程',s().training.filter(t=>t.workerId===W.actor()&&t.passed).length+'／'+s().courses.length)}${note('按服务标准学习，考核记录可追溯。')}`)}
 ${s().courses.map(course=>card(link(`<div class="between"><h3>${e(course.title)}</h3>${badge(s().training.some(t=>t.workerId===W.actor()&&t.id===course.id&&t.passed)?'已通过':course.category)}</div><p class="w-body-copy">约${course.minutes}分钟 · 含服务规范与考核</p>`, 'course',{id:course.id}))).join('')}${linkBtn('查看等级与奖励','level','secondary full mt16')}`);
V.course=()=>{
 const course=s().courses.find(x=>x.id===App.query.get('id'));if(!course)return denied();
 const record=s().training.find(t=>t.workerId===W.actor()&&t.id===course.id);
 return page('课程与考核',`${box(e(course.title),`<p class="w-body-copy">服务前确认范围与费用；履约时记录现场证据；完工后交由客户验收。新增范围须客户确认，必要时先经平台审核。</p>${note('本课程为演示学习内容。')}`)}
 ${box('课程考核',record?.passed?notice('已通过考核，记录时间：'+e(record.date),'green'):`<form data-form="course-submit"><input type="hidden" name="courseId" value="${course.id}"><h3>${e(course.question)}</h3>${course.options.map((x,i)=>`<label class="w-radio-option"><input type="radio" name="answer" value="${i}" required><span>${e(x)}</span></label>`).join('')}<button class="btn full mt16">提交答案</button></form>`)}`);
};
A['course-submit']=(f,fd)=>{
 const course=s().courses.find(x=>x.id===fd.get('courseId'));if(!course)return;
 if(n(fd.get('answer'))!==course.answer){toast('答案未通过，请核对服务规范后重试');return;}
 if(!s().training.some(t=>t.workerId===W.actor()&&t.id===course.id&&t.passed))s().training.push({id:course.id,workerId:W.actor(),passed:true,date:W.stamp()});
 App.save();App.render();toast('考核已通过，学习记录已保存');
};
function projects(){
 return s().projects.filter(p=>W.isLeader()?p.teamId==='team1':W.role()==='member'?p.teamId==='team1'&&(p.workerId===W.actor()||p.tasks.some(t=>t.workerId===W.actor())):!p.teamId&&p.workerId===W.actor());
}
function project(){return projects().find(p=>p.id===App.query.get('id'));}
function manageProject(p){return p&&(W.isLeader()||!p.teamId&&p.workerId===W.actor());}
function projectGate(title,fn){const p=project();return p?fn(p):denied('当前身份没有此项目的查看权限。');}
V.projects=()=>page('局改与定制项目',`${note('勘测、方案签审、采购生产、施工和阶段验收分别记录。')}${projects().map(p=>card(link(`<div class="between"><h3>${e(p.name)}</h3>${badge(p.stages.find(t=>t.status==='施工中')?'施工中':p.survey.status)}</div><p class="w-body-copy">${e(p.address)}</p><div class="w-project-phases">${p.stages.map(t=>`<span class="${t.status==='已验收'?'done':''}">${t.name}</span>`).join('')}</div>`, 'project',{id:p.id}))).join('')||emptyCard('暂无关联项目','团队或平台分配的项目将在此显示。')}`);
V.project=()=>projectGate('项目详情',p=>page('项目详情',`${box(e(p.name),`${row('项目地址',e(p.address))}${row('合同编号',e(p.contract))}${W.role()!=='member'?row('客户合同金额','¥'+money(p.amount)):''}${note('本项目劳务按已审批合作合同结算，工程售价不直接乘80%。')}`)}
 ${card(grid([['现场勘测','project-survey','pin',{id:p.id}],['方案版本','project-plan','file',{id:p.id}],['采购进度','project-procurement','tool',{id:p.id}],['变更延期','project-change','clock',{id:p.id}]]))}
 ${box('阶段与验收',p.stages.map((stage,i)=>`<div class="w-project-stage"><div class="between"><h3>${stage.name}</h3>${badge(stage.status,stage.status==='已验收'?'green':'orange')}</div>${row('合同收款节点',stage.ratio+'% · ¥'+money(stage.amount))}${row('对应客户付款',stage.paid?'本阶段已付':'本阶段未付')}${stage.acceptanceAt?row('验收日期',e(stage.acceptanceAt)):''}${linkBtn('阶段记录与验收','project-stage','secondary full',{id:p.id,stage:i})}</div>`).join(''))}
 ${box('施工计划',p.tasks.map(t=>`<div class="w-record"><div class="between"><strong>${e(t.name)}</strong>${badge(t.status,t.status==='已完成'?'green':'orange')}</div><p>${e(t.date)} · ${e(s().members.find(m=>m.id===t.workerId)?.name||'李师傅')}</p>${t.workerId===W.actor()&&t.status!=='已完成'?button('提交任务记录','project-task',`data-project="${p.id}" data-id="${t.id}"`,'plain full'):''}</div>`).join('')+(manageProject(p)?button('新增施工计划','project-task-add',`data-project="${p.id}"`,'secondary full'):'') )}
 ${linkBtn('领料、用料与退料','materials','secondary full mt16',{project:p.id})}${box('项目进度',timeLine(p.logs||[]))}`));
V['project-survey']=()=>projectGate('项目勘测',p=>page('项目勘测',`${box('勘测约定',`${row('勘测费用','¥150.00')}${row('已记录尺寸',e(p.survey.size))}${row('状态',e(p.survey.status))}${note('勘测费在正式合同中计入一次，后续报价抵扣已付费用。')}`)}
 <form id="survey-form" data-form="project-survey-save">${card(`${field('现场尺寸 *','size',p.survey.size==='待复尺'?'':p.survey.size,'text','required maxlength="200"')}${textarea('现场条件与需求 *','content',p.survey.content||'',800,'required minlength="5"')}${photoField('勘测照片 *','project-survey',6)}`)}</form>`,`<button class="btn full" form="survey-form">提交勘测记录</button>`));
A['project-survey-save']=(f,fd)=>{const p=project();if(!p)return;if(!App.uploads['project-survey']?.length){toast('请上传勘测照片');return;}p.survey={size:fd.get('size'),content:fd.get('content'),photos:W.copy(App.uploads['project-survey']),status:'已提交',workerId:W.actor(),date:W.stamp()};p.logs.push(['提交现场勘测记录',W.stamp()]);App.save();toast('勘测记录已保存');App.go('project',{id:p.id});};
V['project-plan']=()=>projectGate('方案版本与签审',p=>page('方案版本与签审',`${p.plans.map(v=>box(e(v.title),`${row('状态',e(v.status))}${row('尺寸',e(v.dimensions))}<p class="w-body-copy">${e(v.content)}</p>${note(e(v.date)+' · V'+v.version)}`)).join('')||emptyCard('尚未提交方案')}
 ${manageProject(p)?`<form id="project-plan-form" data-form="project-plan-save">${box('提交新版本',`${field('方案名称','title','','text','required maxlength="60"')}${field('尺寸与边界','dimensions','','text','required maxlength="200"')}${textarea('设计与施工方案','content','',1000,'required minlength="5"')}${photoField('方案图或现场示意','project-plan',6)}`)}</form>`:''}`,manageProject(p)?`<button class="btn full" form="project-plan-form">提交客户签审</button>`:''));
A['project-plan-save']=(f,fd)=>{const p=project();if(!manageProject(p))return;p.plans.push({id:'PLAN'+Date.now(),version:p.plans.length+1,title:fd.get('title'),dimensions:fd.get('dimensions'),content:fd.get('content'),photos:W.copy(App.uploads['project-plan']||[]),status:'待客户签审',date:W.stamp()});p.logs.push(['提交方案V'+p.plans.length+'，待客户签审',W.stamp()]);App.save();App.render();toast('新版本已提交，等待客户签审');};
V['project-procurement']=()=>projectGate('采购与生产进度',p=>page('采购与生产进度',`${box('供应进度',p.procurement.map(x=>row(e(x.name),e(x.status))).join('')||note('尚未有已确认的采购生产记录。'))}${note('采购、生产与到货状态来自供应协作记录，执行师傅可补充现场到货核对。')}
 <form id="procurement-note" data-form="procurement-note">${box('补充现场核对',`${textarea('到货情况与问题','content','',500,'required minlength="5"')}${photoField('到货照片','project-delivery',6)}`)}</form>`,`<button class="btn full" form="procurement-note">提交核对记录</button>`));
A['procurement-note']=(f,fd)=>{const p=project();if(!p)return;(p.deliveryRecords??=[]).push({id:'DL'+Date.now(),content:fd.get('content'),photos:W.copy(App.uploads['project-delivery']||[]),workerId:W.actor(),date:W.stamp()});p.logs.push(['补充到货核对：'+fd.get('content'),W.stamp()]);App.save();toast('到货核对已提交');App.go('project',{id:p.id});};
V['project-stage']=()=>projectGate('阶段记录与验收',p=>{
 const i=n(App.query.get('stage')),st=p.stages[i];if(!st)return denied();
 return page(st.name,`${box('阶段条件',`${row('阶段状态',e(st.status))}${row('约定收款',st.ratio+'% · ¥'+money(st.amount))}${row('本阶段付款',st.paid?'已付':'待付')}${row('方案签审',p.plans.some(x=>x.status==='客户已签审')?'已有签审版本':'等待客户签审')}${note('本阶段完工由客户确认，师傅提交资料不会直接变为已验收。')}`)}
 <form id="stage-form" data-form="project-stage-save"><input type="hidden" name="stage" value="${i}">${card(`${textarea('本阶段完成内容 *','content',st.content||'',800,'required minlength="5"')}${photoField('阶段验收证据 *','project-stage',6)}${photoField('客户书面确认（如有）','project-stage-sign',3)}`)}</form>`,
 st.status==='待开始'?button('确认阶段开工','project-stage-start',`data-stage="${i}"`,'full'):st.status==='施工中'?`<button class="btn full" form="stage-form">提交阶段验收</button>`:'');
});
A['project-stage-start']=el=>{
 const p=project(),i=n(el.dataset.stage),st=p?.stages[i];if(!p||!st||st.status!=='待开始')return;
 if(!st.paid||!p.plans.some(x=>x.status==='客户已签审')||i>0&&p.stages[i-1].status!=='已验收'){toast('请先满足方案签审、前阶段验收及本阶段付款条件');return;}
 if(W.hasActiveWork()){toast('当前已有施工中工单');return;}
 st.status='施工中';st.workerId=W.actor();st.startedAt=W.now();p.logs.push([st.name+'开工',W.stamp()]);App.save();App.render();
};
A['project-stage-save']=(f,fd)=>{
 const p=project(),i=n(fd.get('stage')),st=p?.stages[i];if(!p||!st||st.status!=='施工中')return;
 if(st.workerId&&st.workerId!==W.actor()){toast('请由本阶段执行人提交完工资料');return;}
 if(!App.uploads['project-stage']?.length){toast('请上传阶段验收证据');return;}
 st.content=fd.get('content');st.evidence=W.copy(App.uploads['project-stage']);st.writtenEvidence=W.copy(App.uploads['project-stage-sign']||[]);st.status='待客户验收';st.submittedAt=W.now();p.logs.push([st.name+'已提交客户验收',W.stamp()]);App.save();App.go('project',{id:p.id});
};
V['project-change']=()=>projectGate('项目变更与延期',p=>page('项目变更与延期',`${box('申请记录',p.changes.map(x=>`<div class="w-record"><div class="between"><strong>${e(x.title)}</strong>${badge(x.status)}</div><p>${e(x.reason)}</p>${note('费用影响¥'+money(x.amount)+' · 工期影响'+n(x.days)+'天')}</div>`).join('')||note('暂无变更申请'))}
 <form id="project-change-form" data-form="project-change-save">${box('新申请',`${field('变更名称','title','','text','required maxlength="60"')}${field('费用影响（元，可为负）','amount',0,'number','required min="-1000000" max="1000000" step="0.01"')}${field('工期影响（天）','days',0,'number','required min="0" max="365"')}${textarea('原因及影响范围','reason','',800,'required minlength="5"')}${photoField('相关证据','project-change',6)}`)}</form>`,`<button class="btn full" form="project-change-form">提交变更审核</button>`));
A['project-change-save']=(f,fd)=>{const p=project();if(!p)return;const rec={id:'PC'+Date.now(),title:fd.get('title'),amount:n(fd.get('amount')),days:n(fd.get('days')),reason:fd.get('reason'),photos:W.copy(App.uploads['project-change']||[]),status:'待平台及客户确认',date:W.stamp()};p.changes.push(rec);App.state.approvals.push({id:'AP'+Date.now(),type:'项目变更审核',name:p.name+'：'+rec.title,projectId:p.id,changeId:rec.id,status:'pending',by:'师傅',date:W.stamp()});p.logs.push(['申请变更：'+rec.title,W.stamp()]);App.save();App.render();};
A['project-task']=el=>{const p=projects().find(x=>x.id===el.dataset.project),t=p?.tasks.find(x=>x.id===el.dataset.id);if(!t||t.workerId!==W.actor())return;App.temp.projectTask={project:p.id,id:t.id};dialog('提交施工任务记录',`<form id="project-task-form" data-form="project-task-save">${textarea('任务完成情况','content','',500,'required minlength="5"')}${photoField('任务照片','project-task',6)}</form>`,`<button class="btn" form="project-task-form">保存任务记录</button>`);};
A['project-task-save']=(f,fd)=>{const ctx=App.temp.projectTask,p=projects().find(x=>x.id===ctx?.project),t=p?.tasks.find(x=>x.id===ctx.id);if(!t||t.workerId!==W.actor())return;t.report=fd.get('content');t.photos=W.copy(App.uploads['project-task']||[]);t.status='已完成';p.logs.push(['执行任务完成：'+t.name,W.stamp()]);App.save();closeDialog();App.render();};
A['project-task-add']=el=>{const p=projects().find(x=>x.id===el.dataset.project);if(!manageProject(p))return;App.temp.taskProjectId=p.id;dialog('新增施工计划',`<form id="plan-task-form" data-form="project-task-add-save">${field('任务名称','name','','text','required maxlength="60"')}${field('计划日期','date',W.date(1),'date','required')}${selectField('执行人员','worker',p.teamId?s().members.filter(m=>m.enabled).map(m=>[m.id,m.name]):[['w1','李师傅']])}</form>`,`<button class="btn" form="plan-task-form">保存计划</button>`);};
A['project-task-add-save']=(f,fd)=>{const p=projects().find(x=>x.id===App.temp.taskProjectId);if(!manageProject(p))return;p.tasks.push({id:'PT'+Date.now(),name:fd.get('name'),date:fd.get('date'),workerId:fd.get('worker'),status:'待执行'});p.logs.push(['新增施工计划：'+fd.get('name'),W.stamp()]);App.save();closeDialog();App.render();};
function materialContext(){
 const orderId=App.query.get('id'),projectId=App.query.get('project'),o=orderId?W.findOrder(orderId):null,p=projectId?projects().find(x=>x.id===projectId):null;
 return {o,p,valid:!orderId&&!projectId||!!o&&W.own(o)||!!p};
}
const inventory=[{id:'pipe',name:'给排水连接件',unit:'套',stock:30},{id:'hinge',name:'柜门铰链',unit:'个',stock:40},{id:'wall',name:'墙面修补材料',unit:'kg',stock:20}];
V.materials=()=>{
 const ctx=materialContext();if(!ctx.valid)return denied();
 const allowedOrderIds=new Set(W.jobs().map(o=>o.id)),allowedProjectIds=new Set(projects().map(p=>p.id));
 const rows=s().materialRequests.filter(r=>(r.orderId&&allowedOrderIds.has(r.orderId)||r.projectId&&allowedProjectIds.has(r.projectId))&&(!ctx.o||r.orderId===ctx.o.id)&&(!ctx.p||r.projectId===ctx.p.id));
 return page('材料领用记录',`${ctx.o?card(orderTitle(ctx.o)):ctx.p?box(e(ctx.p.name),note('本项目领用、实际用料及退料分别留记录。')):note('材料按关联工单或项目授权查看。')}
 ${box('领用记录',rows.map(r=>`<div class="w-record"><div class="between"><h3>${e(r.name)} × ${n(r.quantity)}${e(r.unit)}</h3>${badge(r.status)}</div><p>${e(r.kind)} · ${e(r.date)}</p>${note(e(r.orderId||r.projectId))}${r.kind==='领料'&&r.status==='已出库'?button('登记用料／退料','material-followup',`data-id="${e(r.id)}"`,'plain full'):''}</div>`).join('')||note('暂无相关领用记录'))}
 <form id="material-request" data-form="material-request">${box('申请领料',`${selectField('关联工单或项目','ref',[...W.jobs().filter(W.active).map(o=>['o:'+o.id,o.title]),...projects().map(p=>['p:'+p.id,p.name])],ctx.o?'o:'+ctx.o.id:ctx.p?'p:'+ctx.p.id:'')}${selectField('材料','material',inventory.map(i=>[i.id,i.name+'（'+i.unit+'）']))}${field('申请数量','quantity',1,'number','required min="0.01" max="10000" step="0.01"')}${textarea('用途说明','reason','',300,'required minlength="5"')}`)}</form>`,`<button class="btn full" form="material-request">提交领料申请</button>`);
};
A['material-request']=(f,fd)=>{
 const [kind,id]=String(fd.get('ref')).split(':'),o=kind==='o'?W.findOrder(id):null,p=kind==='p'?projects().find(x=>x.id===id):null,item=inventory.find(x=>x.id===fd.get('material'));
 if(!item||!o&&!p||o&&!check(o)||!n(fd.get('quantity'))){toast('请选择有权操作的工单或项目');return;}
 if(n(fd.get('quantity'))>item.stock){toast('申请数量超过当前演示可供数量');return;}
 const rec={id:'MR'+Date.now(),workerId:W.actor(),owner:W.owner(),orderId:o?.id,projectId:p?.id,materialId:item.id,name:item.name,unit:item.unit,quantity:n(fd.get('quantity')),kind:'领料',reason:fd.get('reason'),status:'待仓库审核',date:W.stamp()};
 s().materialRequests.push(rec);App.state.approvals.push({id:'AP'+Date.now(),type:'领料审核',name:item.name+' × '+rec.quantity,materialRequestId:rec.id,status:'pending',by:'师傅',date:W.stamp()});App.save();toast('领料申请已提交，实际出库以仓库处理为准');App.render();
};
A['material-followup']=el=>{
 const r=s().materialRequests.find(x=>x.id===el.dataset.id);
 if(!r||r.status!=='已出库'||!(r.orderId?check(W.findOrder(r.orderId)):projects().some(p=>p.id===r.projectId)))return;
 const used=s().materialRequests.filter(x=>x.sourceId===r.id&&!['已驳回'].includes(x.status)).reduce((a,x)=>a+x.quantity,0),left=Math.max(0,r.quantity-used);App.temp.materialSourceId=r.id;
 dialog('登记用料或退料',`<form id="material-followup" data-form="material-followup-save">${selectField('记录类型','kind',['实际用料','退料'])}${field('数量（剩余'+left+r.unit+'）','quantity','','number',`required min="0.01" max="${left}" step="0.01"`)}${textarea('说明','reason','',300,'required minlength="5"')}</form>`,`<button class="btn" form="material-followup">提交记录</button>`);
};
A['material-followup-save']=(f,fd)=>{
 const r=s().materialRequests.find(x=>x.id===App.temp.materialSourceId);if(!r)return;
 if(!(r.orderId?check(W.findOrder(r.orderId)):projects().some(p=>p.id===r.projectId)))return;
 const used=s().materialRequests.filter(x=>x.sourceId===r.id&&x.status!=='已驳回').reduce((a,x)=>a+x.quantity,0),qty=n(fd.get('quantity'));if(qty<=0||qty>r.quantity-used){toast('数量超过可登记余量');return;}
 const kind=fd.get('kind'),rec={...r,id:'MR'+Date.now(),sourceId:r.id,kind,quantity:qty,status:kind==='退料'?'待仓库确认':'已登记',reason:fd.get('reason'),date:W.stamp()};s().materialRequests.push(rec);if(kind==='退料')App.state.approvals.push({id:'AP'+Date.now(),type:'退料确认',name:r.name+' × '+qty,materialRequestId:rec.id,status:'pending',by:'师傅',date:W.stamp()});
 if(kind==='实际用料'&&r.orderId){const o=W.findOrder(r.orderId);(o.materials??=[]).push({name:r.name,quantity:qty,unit:r.unit,owner:'公司供料',cost:0});}
 App.save();closeDialog();App.render();toast('材料记录已保存');
};
V.level=()=>{
 const credit=W.credit(),completed=(W.role()==='member'?862:1268)+W.jobs().filter(o=>o.demoV12&&o.status==='completed').length;
 const tier=W.verified()&&completed>=100&&credit>=90?'优选':W.verified()&&completed>=20&&credit>=80?'熟练':'认证';
 const reward=s().reward,application=reward.applications.find(a=>a.workerId===W.actor()&&!['rejected'].includes(a.status));
 return page('等级与奖励',`${notice('以下为演示等级和活动规则，用于页面体验，正式政策由平台发布。','orange')}
 ${box('师傅等级',`<div class="w-level-hero">${icon('medal',42)}<div><strong>${W.verified()?tier+'师傅':'待认证'}</strong><p>合格完单 ${completed} · 信用 ${credit}分</p></div></div>${[['认证',0,0],['熟练',20,80],['优选',100,90]].map(([name,count,score])=>row(name+'师傅','有效认证'+(count?'＋'+count+'个合格完单':'')+(score?'＋信用≥'+score:''))).join('')}${note('等级展示不改变信用规则和实际派单资格。')}`)}
 ${box('演示活动 · 培训达标奖励',`<div class="between"><h3>通过上门安全培训</h3><b class="w-reward-amount">¥10</b></div><p class="w-body-copy">每名师傅限1次，提交后由平台审核。</p>${row('活动总预算','¥'+fmt(reward.budget))}${row('已审核占用','¥'+fmt(reward.used))}${application?notice('当前申请：'+{pending:'待审核',approved:'已审核，报酬见收入账单',paid:'已到账',rejected:'已驳回'}[application.status]):button('提交奖励申请','claim-training-reward','','full mt16')}${linkBtn('前往培训考核','training','plain full')}`)}
 ${box('奖励记录',reward.applications.filter(a=>a.workerId===W.actor()).map(a=>`<div class="w-record"><strong>培训达标奖励 ¥${fmt(a.amount)}</strong><p>${e(a.date)} · ${e(a.status==='pending'?'待审核':a.status)}</p></div>`).join('')||note('暂无奖励记录'))}`);
};
A['claim-training-reward']=()=>{
 const reward=s().reward;if(!W.verified()){toast('请先完成认证');return;}
 if(!s().training.some(t=>t.workerId===W.actor()&&t.id==='safe'&&t.passed)){toast('请先通过上门安全培训考核');return;}
 if(reward.applications.some(a=>a.workerId===W.actor()&&a.status!=='rejected')){toast('每名师傅限申请一次');return;}
 const reserved=reward.applications.filter(a=>a.status==='pending').reduce((a,x)=>a+x.amount,0);
 if(reward.used+reserved+reward.amount>reward.budget){toast('活动预算已用完，暂不接受新申请');return;}
 const a={id:'RA'+Date.now(),workerId:W.actor(),owner:W.actor(),amount:reward.amount,status:'pending',date:W.stamp(),demo:true};reward.applications.push(a);
 App.state.approvals.push({id:'AP'+Date.now(),type:'演示奖励审核',name:'培训达标奖励¥10',rewardApplicationId:a.id,workerId:W.actor(),status:'pending',by:'师傅',date:W.stamp()});App.save();App.render();toast('奖励申请已提交，待平台审核');
};
W.projects=projects;W.knowledge=knowledge;
})();
