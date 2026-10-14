/* One presentation model for every original service row. Source rows are kept intact. */
(function(){
'use strict';
const exactServices={
 '1:0':'faucet','2:0':'waterproof','3:0':'wall','5:0':'cabinet',
 '24:0':'ac','24:3':'hood','24:6':'washer',
 '30:0':'ac','30:1':'hood','30:2':'washer','30:3':'socket','30:5':'valve','30:8':'lock'
};
const objectName=value=>String(value).replace(/^(地面|墙面|天花|门|窗|五金|综合|软装|布线|空气|水质|隔热|遮阳|照明|节水|保温|能源)·/,'').replace(/·/g,'').replace(/（[^）]*）|\([^)]*\)/g,'');
const objectAliases={'瓷砖地砖':'瓷砖','木地板':'木地板','橱柜柜门':'橱柜柜门','柜体板':'柜体','推拉移门':'推拉门'};
function nameFor(category,row){
 const [group,project='']=row;
 if([17,18,19,20,21,22,23,26,29].includes(category.id))return group;
 if(category.id===30)return project.replace(/（[^）]*）|\([^)]*\)/g,'');
 if(category.id===24){
  const names={'空调·挂机':'挂机空调清洗','空调·柜机':'柜机空调清洗','空调·中央空调':'中央空调清洗','油烟机·半拆':'油烟机半拆洗','油烟机·全拆':'油烟机全拆洗','油烟机·商用':'商用油烟机清洗'};
  return names[group]||(project.includes(group)?project:objectName(group)+project.replace(/（[^）]*）/g,''));
 }
 if(category.id===1&&project.includes('：'))return objectName(project.split('：')[0])+(group==='燃气'?'检测':'维修');
 if(category.id===1)return project;
 if(category.id===2)return group+project.split('：').at(-1);
 if(category.id===7&&group.includes('·'))return group.split('·').slice(1).join('')+group.split('·')[0];
 if(['综合','通用安装','局部焕新'].includes(group))return project.split(/[\/／]/)[0];
 let object=objectName(group);object=objectAliases[object]||object;
 if(category.id===27)return object;
 if(category.id===28){const [operation,target]=group.split('·');return operation==='规划'?target+'收纳规划':operation==='整理'?target+'收纳整理':target||object;}
 if(/安装|检测|评估|治理|预防|封堵|换芯|检修|润滑|保养|保温|除霉|灭蟑|灭鼠|灭白蚁|灭蚂蚁/.test(object))return object;
 if(category.rows.filter(other=>other[0]===group).length===1&&/[\/／]/.test(project)&&! /安装|更换|清洗|检测|评估|打胶|改造|疏通|施工|养护/.test(project))return object+'维修';
 let action=project.split(/[\/／]/)[0].replace(/（[^）]*）|\([^)]*\)/g,'');
 if(!action||object.includes(action))return object;
 if(action.includes(object))return action;
 return object+action;
}
function photoFor(category,row){
 const text=row[0]+' '+row[1];
 if(category.id===1){
  const topic=row[1].split('：')[0];
  if(row[0]==='给水')return /龙头|角阀/.test(topic)?'faucet':/马桶/.test(topic)?'drain':/热水器/.test(topic)?'heater':'pipe';
  if(row[0]==='排水')return 'drain';
  if(row[0]==='电路')return /插座|开关/.test(topic)?'socket':/灯/.test(topic)?'lighting':/弱电/.test(topic)?'network':'electric';
  if(row[0]==='燃气')return /热水器|灶/.test(topic)?'heater':'pipe';
  return /电路|配电|换线/.test(topic)?'electric':'pipe';
 }
 if(category.id===13)return 'pest';
 if(category.id===27)return 'accessibility';
 if(category.id===28)return 'organizing';
 if(category.id===7)return 'moving';
 if(category.id===2)return 'waterproof';
 if(/空调/.test(text))return 'ac';
 if(/油烟|排烟/.test(text))return 'hood';
 if(/洗衣|烘干/.test(text))return 'washer';
 if(/冰箱/.test(text))return 'fridge';
 if(/热水器|燃气灶/.test(text))return 'heater';
 if(/窗帘|晾衣/.test(text))return 'curtains';
 if(/甲醛|空气|净化|除异味|新风/.test(text))return 'airtest';
 if(/沙发|床|桌椅|办公椅|书桌|椅|家具/.test(text))return 'furniture';
 if(/窗|玻璃|限位/.test(text))return 'window';
 if(/锁|门扇|门框|闭门|门吸/.test(text))return 'lock';
 if(/柜|橱柜|抽屉|收纳|隔板|封边/.test(text))return 'cabinet';
 if(/扶手|无障碍|适老|防撞/.test(text))return 'accessibility';
 if(/美缝|石材|地板|瓷砖|地面|地坪|地毯|踢脚|踏步/.test(text))return 'tile';
 if(/墙|涂料|乳胶|刷新|墙纸|墙布|吊顶|天花/.test(text))return 'painting';
 if(/配电|电路|回路|电线|漏保|空开|漏电|跳闸|电气|带电/.test(text))return 'electric';
 if(/网络|网口|弱电|电视|监控|音箱|摄像|对讲|智能主机|网关|中控|组网|智能联动/.test(text))return 'network';
 if(/灯|照明/.test(text))return 'lighting';
 if(/插座|开关|报警|传感|按钮|电/.test(text))return 'socket';
 if(/下水|地漏|马桶|排水|堵塞|反涌|疏通/.test(text))return 'drain';
 if(/龙头|角阀|花洒/.test(text))return 'faucet';
 if(/防水|渗水|渗漏|打胶|补胶|密封/.test(text))return 'waterproof';
 if(/水管|水阀|软管|进水|泵|管路|净水|燃气/.test(text))return 'pipe';
 if(category.id===16||category.id===19||category.id===17)return 'outdoor';
 return ({1:'pipe',3:'tile',4:'window',5:'cabinet',6:'socket',8:'furniture',9:'network',10:'fridge',11:'network',12:'airtest',14:'accessibility',15:'window',18:'faucet',20:'electric',21:'network',22:'hood',23:'painting',24:'cleaning',25:'painting',26:'electric',29:'painting',30:'faucet'})[category.id]||'painting';
}
const items=[];
const waterNames=['龙头漏水维修','角阀维修','进水软管维修','马桶进水阀维修','热水器进水阀维修','暗管渗漏维修','增压泵维修','地漏疏通维修','马桶疏通','马桶漏水维修','洗手盆下水维修','浴缸下水维修','厨房下水管维修','主管道疏通','插座开关维修','灯具维修','配电箱维修','电线故障维修','弱电接口维修','电器回路检修','燃气灶接口检测','热水器燃气接口检测','燃气管路接口检测','全屋电路检测','全屋水路检测','配电箱整体更换','全屋换线（明装）','水管整体更换（明装）','智能水阀安装'];
for(const category of ZHZ_CATEGORY_TREE){
 const headers=category.headers;
 const index=match=>headers.findIndex(label=>match.test(label));
 const priceIndex=index(/价|费用/),unitIndex=index(/^单位$|^周期$/),warrantyIndex=index(/质保/),noteIndex=index(/^备注$/),timeIndex=index(/耗时/);
 const scopeIndex=index(/引用基础品类/),responseIndex=index(/响应时间/),billingIndex=index(/计费方式/);
 category.rows.forEach((row,rowIndex)=>{
  const price=priceIndex<0?null:Number(row[priceIndex]);
  const matched=ZHZ_SERVICES.find(s=>s.id===exactServices[category.id+':'+rowIndex]);
  const serviceId=matched&&matched.price===price?matched.id:null;
  items.push({
   id:'catalog-'+category.id+'-'+rowIndex,categoryId:category.id,category:category.name,kind:category.kind,
   group:row[0],name:category.id===1?waterNames[rowIndex]:nameFor(category,row),project:row[1]||row[0],
   description:category.id===20?row[2]:row[1],price,unit:unitIndex<0?'':row[unitIndex],
   warranty:warrantyIndex<0?null:Number(row[warrantyIndex]),note:noteIndex<0?'':row[noteIndex],duration:timeIndex<0?'':row[timeIndex],
   scope:scopeIndex<0?'':row[scopeIndex],rules:category.kind==='场景引用'?row[2]:'',
   response:responseIndex<0?'':row[responseIndex],billing:billingIndex<0?'':row[billingIndex],
   fixed:category.id===30,photo:photoFor(category,row),serviceId,source:category.source,headers,row
  });
 });
}
window.ZHZ_SERVICE_CATALOG=items;
window.findCatalogService=id=>items.find(item=>item.id===id);
})();
