window.ZHZ_SERVICES = [
 {id:'faucet',name:'水龙头漏水维修',category:'水电系统',sub:'给水维修',icon:'water',price:50,unit:'项',warranty:365,duration:'30–60分钟',fixed:false,sold:1268,rating:4.9,desc:'检测漏水点、修复滴水与关不严，配件费用现场确认。',specs:[['常规龙头维修',50],['角阀漏水维修',50],['进水软管更换人工',40]],steps:['定位漏水点','确认维修报价','更换与密封','试水与清洁']},
 {id:'waterproof',name:'卫生间渗漏检测维修',category:'防水系统',sub:'卫生间防水',icon:'shield',price:300,unit:'处',warranty:730,duration:'以现场评估为准',fixed:false,sold:586,rating:4.9,desc:'管根、门槛石渗漏处理，具体工艺与范围上门确认。',specs:[['管根渗漏处理',300],['门槛石渗漏',300],['地漏周边渗漏',200]],steps:['勘查渗漏','方案交底','防水施工','闭水验收']},
 {id:'wall',name:'墙地面局部修补',category:'天地墙',sub:'地面瓷砖',icon:'wall',price:80,unit:'处',warranty:180,duration:'按修补范围确认',fixed:false,sold:843,rating:4.8,desc:'瓷砖空鼓修补，开裂、破损和翘起按实际面积报价。',specs:[['瓷砖空鼓修补',80],['瓷砖破损修补/㎡',150],['松动翘起处理',100]],steps:['检查基层','确定修复范围','局部修复','清理验收']},
 {id:'lock',name:'C级锁芯更换',category:'门窗',sub:'入户防盗门',icon:'door',price:199,unit:'套',warranty:365,duration:'约30分钟',fixed:true,sold:962,rating:4.9,desc:'一口价含C级锁芯与标准安装，特殊锁体需单独确认。',specs:[['标准C级锁芯',199]],steps:['核对门锁','拆除旧锁芯','更换新锁芯','开闭测试']},
 {id:'cabinet',name:'柜门铰链维修',category:'柜体收纳',sub:'橱柜柜门',icon:'cabinet',price:50,unit:'扇',warranty:365,duration:'约30分钟',fixed:false,sold:438,rating:4.9,desc:'柜门下沉、铰链松动与断裂修复，更换配件另计。',specs:[['柜门调校人工',50],['抽屉滑轨调校',60]],steps:['检查五金','确认用料','调校安装','开合验收']},
 {id:'socket',name:'五孔插座更换',category:'五金与安装',sub:'电气安装',icon:'plug',price:70,unit:'个',warranty:365,duration:'约20分钟',fixed:true,sold:1582,rating:4.9,desc:'含公牛五孔面板及标准更换安装，线路故障另行确认。',specs:[['五孔插座（含面板）',70],['单联开关（含面板）',77]],steps:['断电验电','拆除面板','安装接线','通电测试']},
 {id:'ac',name:'空调挂机深度清洗',category:'清洗保养',sub:'空调清洗',icon:'air',price:99,unit:'台',warranty:30,duration:'约45分钟',fixed:true,sold:2396,rating:4.9,desc:'挂机标准清洗，含防护、过滤网与蒸发器清洗、试机。',specs:[['家用挂机',99]],steps:['上门防护','清洁滤网','深层清洗','试机验收']},
 {id:'hood',name:'油烟机半拆洗',category:'清洗保养',sub:'厨房清洗',icon:'spark',price:138,unit:'台',warranty:30,duration:'约60分钟',fixed:true,sold:1694,rating:4.8,desc:'半拆清洗油网、集油盒及标准可拆卸部件。',specs:[['标准半拆洗',138]],steps:['现场防护','拆洗部件','去油清洁','复装试机']},
 {id:'washer',name:'洗衣机清洗',category:'清洗保养',sub:'家电清洗',icon:'water',price:89,unit:'台',warranty:30,duration:'约40分钟',fixed:true,sold:1386,rating:4.9,desc:'标准清洗与运行检测，拆机范围以服务标准为准。',specs:[['标准洗衣机清洗',89]],steps:['检查机器','清洁内筒','除垢消毒','空机试运行']},
 {id:'valve',name:'角阀更换',category:'五金与安装',sub:'卫浴五金',icon:'wrench',price:65,unit:'个',warranty:365,duration:'约15分钟',fixed:true,sold:773,rating:4.9,desc:'含伟星角阀及标准更换安装。',specs:[['标准角阀（含材料）',65]],steps:['关闭水阀','拆除旧阀','密封安装','试压验收']}
];
window.ZHZ_CATEGORIES = [
 ['水电系统','water','蓝','给水、排水、电路、燃气'],['防水系统','shield','青','厨卫、屋面、外墙防水'],['天地墙','wall','橙','天花、地面、墙面'],['门窗','door','紫','门、窗、锁与五金'],['柜体收纳','cabinet','棕','柜门、滑轨、台面'],['五金与安装','wrench','蓝','面板、灯具、卫浴五金'],['清洗保养','air','青','家电、地毯、石材清洗'],['家电维修','plug','紫','家电故障与检修'],['局部焕新','spark','橙','墙面、美缝、局改'],['全部服务','grid','蓝','基础品类与空间场景']
];
window.ZHZ_WORKERS = [
 {id:'w1',name:'李师傅',full:'李明',title:'金牌水电师傅',skills:['水电系统','五金与安装','清洗保养'],rating:4.9,orders:1268,years:8,distance:1.2,credit:96,online:true,city:'深圳',area:'南山区',match:96,response:'3分钟',color:'blue'},
 {id:'w2',name:'陈师傅',full:'陈伟',title:'认证防水师傅',skills:['防水系统','天地墙'],rating:4.9,orders:862,years:10,distance:2.1,credit:98,online:true,city:'深圳',area:'南山区',match:89,response:'5分钟',color:'teal'},
 {id:'w3',name:'王师傅',full:'王建国',title:'金牌门窗师傅',skills:['门窗','柜体收纳','五金与安装'],rating:4.8,orders:1046,years:12,distance:2.8,credit:94,online:true,city:'深圳',area:'福田区',match:83,response:'4分钟',color:'orange'},
 {id:'w4',name:'周师傅',full:'周海',title:'认证清洗师傅',skills:['清洗保养','家电维修'],rating:4.9,orders:756,years:6,distance:3.4,credit:91,online:false,city:'深圳',area:'南山区',match:78,response:'8分钟',color:'violet'},
 {id:'w5',name:'张师傅',full:'张强',title:'综合维修师傅',skills:['水电系统','柜体收纳'],rating:4.7,orders:456,years:5,distance:4.2,credit:86,online:true,city:'广州',area:'天河区',match:72,response:'6分钟',color:'blue'}
];
window.ZHZ_STATUS = {
 ready:['待开工','orange',3],terminated:['已终止','gray',-1],pending:['待支付','orange',0],dispatching:['待派单','blue',1],offered:['待接单','blue',1],accepted:['待上门','blue',2],enroute:['师傅前往中','blue',2],arrived:['已到场','blue',2],quote:['待报价确认','orange',3],working:['服务中','blue',3],addon:['待增项确认','orange',3],acceptance:['待验收','orange',4],completed:['已完成','green',5],cancelled:['已取消','gray',-1],refund:['退款处理中','orange',-1],refunded:['已退款','gray',-1],aftersale:['售后处理中','orange',5]
};
window.ZHZ_SEED = () => ({
 version:3, user:{name:'林女士',phone:'138****5678',loggedIn:true},workerOnline:true,workerVerified:true,
 role:'admin',city:'深圳', activeOrder:'ZHZ202610140028', serviceId:'ac', specification:0,serviceAddon:false,
 addressId:'addr1', urgency:'normal',couponId:null, scheduled:'尽快上门', acceptedTerms:false,
 addresses:[{id:'addr1',label:'家',name:'林女士',phone:'13800005678',district:'深圳市 南山区',community:'阳光海景花园',detail:'3栋2单元1201室',area:'98',year:'2016',default:true},{id:'addr2',label:'公司',name:'林女士',phone:'13800005678',district:'深圳市 福田区',community:'卓越世纪中心',detail:'1号楼1208室',default:false}],
 coupons:[{id:'cp1',name:'新客专享券',amount:20,min:100,expiry:'2026-11-14',status:'available'},{id:'cp2',name:'家修关怀券',amount:50,min:300,expiry:'2026-11-30',status:'available'},{id:'cp3',name:'清洗服务券',amount:10,min:89,expiry:'2026-10-31',status:'available'},{id:'cp4',name:'秋日焕新券',amount:20,min:100,expiry:'2026-10-01',status:'expired'}],
 favorites:['ac','faucet'],favoriteWorkers:['w1'],
 orders:[
  {id:'ZHZ202610140028',serviceId:'faucet',title:'水龙头漏水维修',category:'水电系统',spec:'厨房龙头滴水',status:'enroute',amount:120,paid:120,original:120,discount:0,urgency:'normal',workerId:'w1',name:'林女士',address:'南山区阳光海景花园 3栋2单元1201室',time:'2026-10-14 17:00–18:00',created:'2026-10-14 15:30',remark:'厨房龙头关不严，台面有少量积水。请提前联系。',distance:1.2,match:96,quote:{visit:30,labor:50,material:40},logs:[['已支付，正在匹配师傅','15:30'],['李师傅已接单','15:32'],['师傅已出发，预计15分钟到达','16:40']]},
  {id:'ZHZ202610140031',serviceId:'ac',title:'空调挂机深度清洗',category:'清洗保养',spec:'家用挂机 × 1台',status:'dispatching',amount:99,paid:99,original:99,discount:0,urgency:'normal',workerId:null,name:'陈先生',address:'南山区海岸城花园 2栋1503',time:'2026-10-15 10:00–11:00',created:'2026-10-14 15:42',remark:'请带清洁防护罩。',distance:0.8,match:95,quote:{visit:0,labor:99,material:0},logs:[['支付成功，等待派单','15:42']]},
  {id:'ZHZ202610140029',serviceId:'valve',title:'角阀更换',category:'五金与安装',spec:'标准角阀（含材料）',status:'dispatching',amount:65,paid:65,original:65,discount:0,urgency:'urgent',workerId:null,name:'张女士',address:'南山区科技园科苑花园 5栋602',time:'2026-10-14 18:00–19:00',created:'2026-10-14 15:38',remark:'角阀锈死，需要更换。',distance:1.6,match:91,quote:{visit:0,labor:30,material:35},logs:[['支付成功，加急派单中','15:38']]},
  {id:'ZHZ202610130016',serviceId:'ac',title:'空调挂机深度清洗',category:'清洗保养',spec:'家用挂机 × 1台',status:'completed',amount:99,paid:99,original:99,discount:0,urgency:'normal',workerId:'w1',name:'林女士',address:'南山区阳光海景花园 3栋2单元1201室',time:'2026-10-13 10:00–11:00',created:'2026-10-13 09:20',remark:'空调有异味',quote:{visit:0,labor:99,material:0},reviewed:false,report:'已清洁过滤网、蒸发器和出风口；试机正常，现场已恢复。',logs:[['支付成功','09:20'],['师傅接单','09:23'],['开始清洗','10:05'],['业主验收完成','10:52']]},
  {id:'ZHZ202610120009',serviceId:'lock',title:'C级锁芯更换',category:'门窗',spec:'标准C级锁芯',status:'completed',amount:199,paid:199,original:199,discount:0,urgency:'normal',workerId:'w3',name:'林女士',address:'南山区阳光海景花园 3栋2单元1201室',time:'2026-10-12 14:00–15:00',created:'2026-10-12 12:20',reviewed:true,quote:{visit:0,labor:99,material:100},logs:[['服务完成','14:48']]},
  {id:'ZHZ202610110007',serviceId:'hood',title:'油烟机半拆洗',category:'清洗保养',spec:'标准半拆洗',status:'cancelled',amount:138,paid:0,original:138,discount:0,workerId:null,name:'林女士',address:'南山区阳光海景花园 3栋2单元1201室',time:'2026-10-11 16:00–17:00',created:'2026-10-11 12:00',logs:[['用户取消：预约时间调整','12:10']]}
 ],
 balance:3280.00,frozen:320.00,totalIncome:28650.00,withdrawals:[{id:'TX20261013001',amount:500,fee:3,actual:497,status:'paid',date:'2026-10-13 10:20',account:'微信零钱'},{id:'TX20261014002',amount:200,fee:1.2,actual:198.8,status:'pending',date:'2026-10-14 14:00',account:'建设银行（尾号6688）'}],
 accounts:[{id:'wx',name:'微信零钱',number:'已绑定实名认证微信',icon:'wallet',default:true},{id:'bank1',name:'中国建设银行',number:'**** **** **** 6688',icon:'credit',default:false}],
 invoices:[{id:'INV20261012001',title:'深圳市安心科技有限公司',tax:'91440300MA0000000A',email:'demo@example.com',amount:199,status:'issued',orderIds:['ZHZ202610120009'],date:'2026-10-12'}],
 feedbacks:[{id:'FB20261013001',type:'功能建议',content:'希望能保存常用的维修师傅，方便再次预约。',status:'replied',reply:'您好，可在师傅主页点击收藏，随后在「我的收藏」查看。感谢您的建议。',date:'2026-10-13'}],
 applications:[{id:'J20261014001',name:'刘建华',phone:'139****1128',city:'深圳',skill:'水电系统',years:6,status:'pending',date:'2026-10-14 14:32'},{id:'J20261014002',name:'赵志强',phone:'137****2356',city:'深圳',skill:'防水系统',years:8,status:'supplement',date:'2026-10-14 13:18'},{id:'J20261013003',name:'何伟',phone:'136****7812',city:'广州',skill:'门窗',years:5,status:'approved',date:'2026-10-13 16:20'}],
 messages:[{id:'m1',from:'worker',text:'您好，已接到您的维修订单。我正在赶来，预计15分钟到达。',time:'16:40',order:'ZHZ202610140028'},{id:'m2',from:'user',text:'好的，麻烦到楼下联系我。',time:'16:41',order:'ZHZ202610140028'},{id:'m3',from:'worker',text:'收到，我会提前联系您，请放心。',time:'16:41',order:'ZHZ202610140028'}],
 notices:[{title:'师傅已出发',content:'李师傅正在前往您的服务地址，预计15分钟到达。',type:'order',time:'16:40',unread:true},{title:'支付成功',content:'空调清洗订单支付成功，已为您安排匹配。',type:'money',time:'15:42',unread:true},{title:'服务完成，记得领取质保卡',content:'您10月13日的空调清洗已完成验收。',type:'order',time:'昨天',unread:false},{title:'关于秋季家居维保的温馨提示',content:'换季使用电器前，建议检查插座与线路。',type:'system',time:'10-12',unread:false}],
 approvals:[{id:'AP001',type:'系数变更',name:'深圳城市系数 1.0 → 1.1',by:'运营 · 林小雨',status:'pending',date:'2026-10-14 14:36'},{id:'AP002',type:'改约申请',name:'预约调整为明日10:00',by:'李师傅',status:'pending',date:'2026-10-14 13:12'}],
 logs:[{time:'2026-10-14 16:20',by:'运营 · 林小雨',module:'师傅审核',action:'通过入驻审核',target:'J20261013003',reason:'资质材料齐全',before:'待审核',after:'审核通过'}],
 exceptions:[{id:'EX001',order:'ZHZ202610140028',type:'预约信息核对',severity:'普通',status:'pending',reason:'需要再次确认业主可上门时段',date:'2026-10-14 16:00'}],
 banners:[{id:'B001',name:'AI拍照报修',target:'repair',audience:'业主端',status:'published'},{id:'B002',name:'秋季家居维保提醒',target:'categories',audience:'业主端 / 师傅端',status:'published'}],
 config:{quoteConfirm:15,quoteReason:50,checkin:500,fee:0.6,minWithdraw:10,maxWithdraw:50000,radius:5,timeout:30,urgentFee:15,emergencyFee:30},
 preferences:{radius:5,maxOrders:5,automatic:false,minPrice:0,night:true},settings:{notifications:true,voice:true,vibration:true,location:true,share:true},learning:[],searchHistory:['漏水维修','空调清洗','更换锁芯'],unread:2,refunds:[],aftersales:[],pricingDrafts:[],settlements:[]
});
