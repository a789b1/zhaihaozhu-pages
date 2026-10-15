/* Shared detail layout for native services and every source catalogue record. */
(function () {
  'use strict';

  const photo = (kind, label) => `<div class="service-art service-photo photo-${e(kind)}" role="img" aria-label="${e(label)}"></div>`;
  const amount = value => Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  const current = () => {
    const catalog = App.query.has('catalog') ? findCatalogService(App.query.get('catalog')) : null;
    const service = catalog ? ZHZ_SERVICES.find(s => s.id === catalog.serviceId) : App.currentService();
    return { catalog, service };
  };
  const selection = (catalog, service) => {
    const key = catalog?.id || service?.id;
    if (App.temp.detailSelection?.key === key) return App.temp.detailSelection.index;
    return !catalog && App.state.serviceId === service?.id ? App.state.specification || 0 : 0;
  };
  const heading = text => `<h2 class="sd-heading"><span>${e(text)}</span></h2>`;
  const facts = entries => `<dl class="sd-facts">${entries.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([name, value]) => `<div><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>`;

  const process = fixed => [
    ['send', '预约下单', '选择服务项目、地址和上门时间，提交预约订单。'],
    ['wallet', '完成支付', '核对所选服务与费用，按订单明细完成支付。'],
    ['clipboard', '平台派单', '平台匹配相应品类的师傅，具体上门时间由师傅与您确认。'],
    ['wrench', '上门服务', fixed ? '师傅到场核对服务范围，按所选标准开展服务；超出范围需先确认。' : '师傅先检测并列明维修方案与报价，经您确认后再施工。'],
    ['check', '完工验收', '核对服务成果、施工前后照片和费用明细，验收签字并结清应付费用。'],
    ['shield', '售后保障', '完成后可在订单内查看服务记录、质保信息并申请售后。']
  ];
  const flow = fixed => `<div class="sd-flow-wrap">
    <svg class="sd-flow-lines" viewBox="0 0 300 190" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="sd-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 6 3 0 6Z"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="1" marker-end="url(#sd-arrow)"><path d="M78 25H122"/><path d="M178 25H222"/><path d="M278 25C300 25 300 135 278 135"/><path d="M222 135H178"/><path d="M122 135H78"/></g></svg>
    <ol class="sd-flow">${process(fixed).map(([ico, title], index) => `<li data-step="${index + 1}"><button type="button" data-action="detail-step" data-index="${index}" data-fixed="${fixed}" aria-label="第${index + 1}步：${title}，查看说明"><span class="sd-flow-icon">${icon(ico, 25)}<b>${index + 1}</b></span><span>${title}</span></button></li>`).join('')}</ol>
  </div>`;

  const preparations = [
    ['phone', '保持电话畅通', '师傅接单后会与您核对地址及上门时间。'],
    ['clipboard', '核对服务项目', '提前说明故障、设备型号及已有配件情况。'],
    ['layout', '留出作业空间', '整理服务区域，妥善收好周围物品。'],
    ['check', '现场确认验收', '服务前确认范围，完成后核对效果与费用。']
  ];
  // Fee types come from the quote engine; amounts depend on the actual order.
  const extraFees = [
    ['材料与配件', '涉及更换或新增材料时，先确认品牌、数量与费用。'],
    ['新增服务项目', '超出所选服务范围的项目，需单独报价并经您确认。'],
    ['特殊时段服务', '夜间、节假日等附加费，以预约时的订单明细为准。'],
    ['远距离上门', '超出标准服务距离时，按实际里程核算并提前告知。'],
    
    ['垃圾清运', '如需额外清运施工垃圾，按实际清运量确认费用。']
  ];
  const advantages = [
    ['user', '师傅实名认证'], ['file', '报价明细透明'],
    ['check', '增项单独确认'], ['camera', '施工过程留痕'],
    ['clipboard', '完工签字验收'], ['shield', '订单售后保障']
  ];
  const sceneGroups = {
    ac: ['ac', 'washer', 'hood', 'fridge', 'heater'], washer: ['washer', 'ac', 'hood', 'fridge', 'heater'],
    hood: ['hood', 'washer', 'ac', 'fridge', 'heater'], cleaning: ['cleaning', 'washer', 'hood', 'ac', 'organizing'],
    faucet: ['faucet', 'pipe', 'drain', 'waterproof', 'socket'], valve: ['faucet', 'pipe', 'drain', 'waterproof', 'socket'],
    pipe: ['pipe', 'faucet', 'drain', 'waterproof', 'socket'], drain: ['drain', 'pipe', 'faucet', 'waterproof', 'cleaning'],
    socket: ['socket', 'electric', 'lighting', 'faucet', 'cabinet'], electric: ['electric', 'socket', 'lighting', 'faucet', 'cabinet'],
    wall: ['wall', 'painting', 'tile', 'waterproof', 'cabinet'], painting: ['painting', 'tile', 'wall', 'waterproof', 'cabinet'],
    lock: ['lock', 'window', 'cabinet', 'furniture', 'socket'], cabinet: ['cabinet', 'furniture', 'lock', 'curtains', 'organizing']
  };
  const sceneLabels = { ac: '空调清洗', washer: '洗衣机清洗', hood: '油烟机清洗', fridge: '冰箱服务', heater: '热水器服务', faucet: '龙头维修', pipe: '水路检修', drain: '排水维护', waterproof: '防水施工', socket: '插座安装', electric: '电路检修', lighting: '灯具安装', network: '弱电安装', wall: '墙面修补', painting: '墙面焕新', tile: '地面修护', cabinet: '柜体维修', lock: '门锁服务', window: '门窗维护', furniture: '家具安装', curtains: '窗帘安装', organizing: '收纳整理', cleaning: '清洁保养', moving: '搬运服务', airtest: '空气检测', pest: '防虫服务', outdoor: '室外维护', accessibility: '适老改造' };

  window.renderServiceDetail = ({ catalog = null, service = null }) => {
    const name = catalog?.name || service.name;
    const kind = catalog?.photo || service.id;
    const index = Math.min(selection(catalog, service), Math.max(0, (service?.specs.length || 1) - 1));
    const basePrice = service?.price ?? catalog?.price;
    const price = service?.specs[index]?.[1] ?? basePrice;
    const fixed = !!(catalog?.fixed || service?.fixed);
    const bookable = !!service && !App.state.serviceDisabled?.includes(service.id);
    const unit = catalog?.unit || service?.unit || '';
    const warranty = catalog ? catalog.warranty : service.warranty;
    const duration = catalog?.duration ? catalog.duration + '分钟' : service?.duration || '';
    const description = service?.desc || catalog?.description || catalog?.project;
    const address = App.state.addresses.find(a => a.id === App.state.addressId);
    const area = address?.district || App.state.city + '市';
    const favorite = service && App.state.favorites.includes(service.id);
    const contextAttrs = `data-service="${e(service?.id || '')}" data-catalog="${e(catalog?.id || '')}" data-index="${index}"`;
    const consult = `#/chat?support=1${catalog ? '&catalog=' + catalog.id : ''}`;
    const priceMarkup = price === null ? '<strong class="sd-assessment">上门评估</strong>' : `<span class="sd-price"><i>¥</i><strong>${amount(price)}</strong><small>${unit ? '/' + e(unit) : ''}${fixed ? '' : '起'}</small></span>`;
    const quoteTitle = fixed ? '什么是一口价' : price === null ? '按需制定服务方案' : '服务报价说明';
    const quoteText = fixed ? '所选标准服务按明确价格计费。师傅上门核对范围后服务，超出范围的项目须另行确认。' : price === null ? '根据实际空间、设备与服务需求评估方案。服务范围、用料和费用均在施工前与您确认。' : '页面展示标准项目的参考起步价。师傅上门检测后列明方案与费用，您确认后再施工。';
    const details = [
      ['计价方式', catalog?.billing || (fixed ? '标准范围一口价' : price === null ? '按实际范围评估' : '检测后确认报价')],
      ['质保期限', warranty === null ? '' : warranty ? warranty + '天 · 以订单质保范围为准' : '此项不单设质保'],
      ['参考用时', duration], ['响应参考', catalog?.response ? catalog.response + ' · 以平台确认为准' : '']
    ];
    const scopes = [catalog?.scope && `服务范围：${catalog.scope}`, catalog?.rules, catalog?.note].filter(Boolean);
    // Retain the source description as well as the fuller native product description.
    if (catalog?.description && catalog.description !== description) scopes.unshift(`项目说明：${catalog.description}`);
    const scenes = sceneGroups[kind] || [kind, 'faucet', 'cabinet', 'socket', 'painting'];
    const worker = service && ZHZ_WORKERS.find(w => w.city === App.state.city && w.skills.includes(service.category));

    const body = `<div class="sd-page">
      <button class="sd-cover" type="button" data-action="detail-photo" data-photo="${e(kind)}" data-title="${e(name)}" aria-label="预览${e(name)}服务图片">${photo(kind, name)}<span class="sd-image-note">服务场景示意 ${icon('image', 12)}</span></button>
      <section class="sd-product" aria-label="服务价格">
        <div class="sd-product-title"><h1>${e(name)}</h1>${service ? `<button class="icon-btn sd-favorite ${favorite ? 'is-saved' : ''}" data-action="detail-favorite" data-id="${service.id}" aria-label="${favorite ? '取消收藏' : '收藏服务'}" aria-pressed="${favorite}">${icon('heart', 21)}</button>` : ''}</div>
        <div class="sd-price-row">${priceMarkup}<span class="sd-price-kind">${fixed ? '标准一口价' : '服务前确认费用'}</span></div>
        <p class="sd-price-caption">${fixed ? '按所选项目及标准范围计价' : '具体服务范围及费用，施工前确认'}</p>
      </section>
      <button class="sd-assurance" type="button" data-action="detail-assurance"><strong>服务保障</strong><span>流程规范 · 费用确认 · 售后保障</span>${icon('arrow', 14)}</button>
      <button class="sd-location" type="button" data-action="detail-area"><span>${icon('pin', 15)}${e(area)}</span><span>预约时间下单选择 ${icon('arrow', 13)}</span></button>
      ${service && service.specs.length > 1 ? `<section class="sd-specs"><h2>选择服务规格</h2><div class="chips">${service.specs.map(([label, value], i) => `<button class="chip ${i === index ? 'active' : ''}" data-action="detail-spec" data-key="${e(catalog?.id || service.id)}" data-index="${i}" aria-pressed="${i === index}">${e(label)} · ¥${amount(value)}</button>`).join('')}</div></section>` : ''}
      <section class="sd-details"><h2 class="sd-section-label">服务详情</h2>
        <article class="sd-overview">
          ${heading(quoteTitle)}<p class="sd-intro">${quoteText}</p>
          ${heading(fixed ? '一口价服务流程' : '上门服务流程')}${flow(fixed)}
          ${service ? `<div class="sd-work-steps"><strong>本项服务作业内容</strong><p>${service.steps.map(e).join('<span aria-hidden="true"> / </span>')}</p></div>` : ''}
        </article>
        <section class="sd-section">${heading('本项服务说明')}<div class="sd-scope"><p>${e(description)}</p>${scopes.map(text => `<p>${e(text)}</p>`).join('')}${facts(details)}</div></section>
        <section class="sd-section">${heading('服务前准备')}<div class="sd-preparations">${preparations.map(([ico, title, text]) => `<article><span class="sd-round-icon">${icon(ico, 25)}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
        <section class="sd-section">${heading('可能产生的附加费用')}<p class="sd-section-caption">仅适用于实际涉及的项目，费用须提前告知并经您确认。</p><div class="sd-extra-fees">${extraFees.map(([title, text]) => `<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
        <section class="sd-section">${heading('施工现场')}<p class="sd-section-caption">服务场景示意</p><div class="sd-scene-grid">${scenes.map((scene, i) => `<button type="button" class="sd-scene ${i === 0 ? 'sd-scene-main' : ''}" data-action="detail-photo" data-photo="${e(scene)}" data-title="${e(sceneLabels[scene] || name)}" aria-label="预览${e(sceneLabels[scene] || name)}场景">${photo(scene, sceneLabels[scene] || name)}<span>${e(sceneLabels[scene] || name)}</span></button>`).join('')}</div></section>
        <section class="sd-section">${heading('我们的优势')}<ul class="sd-advantages">${advantages.map(([ico, text]) => `<li><span>${icon(ico, 21)}</span>${text}</li>`).join('')}</ul></section>
      </section>
      ${worker && bookable ? `<section class="sd-related"><div class="between"><h2>服务师傅</h2><a class="text-link" href="#/workers?category=${encodeURIComponent(service.category)}">查看更多 ${icon('arrow', 13)}</a></div>${workerCard(worker)}<button class="btn soft full" data-action="detail-reserve" ${contextAttrs} data-worker="${worker.id}">优先预约${e(worker.name)}</button><p class="sd-related-note">指定师傅作为偏好，最终以档期及平台派单为准。</p></section>` : ''}
      ${service ? `<section class="sd-related sd-reviews"><div class="between"><h2>用户评价</h2><span class="sd-demo-note">演示评价</span></div><div class="sd-review-score"><strong>${service.rating}</strong><span class="score">${icon('star', 14)} 服务评分</span><span>${service.sold}次服务</span></div><div class="mini-review"><div class="review-meta"><strong>林**</strong><span class="score" aria-label="五星评价">★★★★★</span></div><p>提前沟通了时间，价格明细清楚，完成后也把现场收拾好了。</p></div></section>` : ''}
    </div>`;
    const footer = `<a class="sd-contact" href="${consult}" aria-label="咨询客服">${icon('headphones', 22)}<span>客服</span></a><div class="sd-footer-price">${priceMarkup}<small>${fixed ? '所选标准服务' : '参考价格'}</small></div>${bookable ? `<button class="btn sd-reserve" data-action="detail-reserve" ${contextAttrs}>立即预约</button>` : `<a class="btn sd-reserve" href="${consult}">咨询服务方案</a>`}`;
    return mobilePage(e(name), body, footer, '', { edge: true });
  };

  App.actions['detail-spec'] = el => {
    const scroll = window.scrollY;
    App.temp.detailSelection = { key: el.dataset.key, index: Number(el.dataset.index) };
    App.render();
    window.scrollTo(0, scroll);
  };
  App.actions['detail-favorite'] = el => {
    const scroll = window.scrollY;
    App.actions['favorite-service'](el);
    window.scrollTo(0, scroll);
  };
  App.actions['detail-reserve'] = el => {
    const service = ZHZ_SERVICES.find(s => s.id === el.dataset.service);
    if (!service || App.state.serviceDisabled?.includes(service.id)) return toast('请先咨询确认服务范围');
    App.state.serviceId = service.id;
    App.state.specification = Number(el.dataset.index) || 0;
    App.state.serviceAddon = false;
    App.state.couponId = null;
    App.state.couponSelectionTouched = false;
    if (el.dataset.worker) App.state.preferredWorker = el.dataset.worker;
    App.save();
    App.actions['reserve-service']();
  };
  App.actions['detail-step'] = el => {
    const [, title, text] = process(el.dataset.fixed === 'true')[Number(el.dataset.index)];
    dialog(title, `<p>${text}</p>`, btn('我知道了', 'close-dialog'));
  };
  App.actions['detail-assurance'] = () => {
    const { catalog, service } = current();
    const warranty = catalog ? catalog.warranty : service.warranty;
    dialog('服务保障', facts([
      ['规范服务', '师傅身份核验，服务过程按订单留痕'],
      ['费用确认', '服务前确认报价，增项另行确认'],
      ['完工验收', '核对施工前后凭证，验收后签字确认'],
      ['本项质保', warranty === null ? '以服务方案和订单约定为准' : warranty ? warranty + '天 · 以订单约定范围为准' : '此项不单设质保'],
      ['售后入口', '在服务订单中查看质保、申请售后']
    ]), btn('我知道了', 'close-dialog'));
  };
  App.actions['detail-area'] = () => {
    const address = App.state.addresses.find(a => a.id === App.state.addressId);
    dialog('服务区域与预约', `<p>${e(address ? address.district + ' · ' + address.community : App.state.city + '市')}</p><p class="mt12">上门时间在下单时选择。师傅接单后会与您沟通确认，具体以订单安排为准。</p>`, btn('管理服务地址', 'detail-addresses', 'secondary') + btn('我知道了', 'close-dialog'));
  };
  App.actions['detail-addresses'] = () => { closeDialog(); App.go('addresses'); };
  App.actions['detail-photo'] = el => dialog(el.dataset.title, `<div class="sd-image-preview">${photo(el.dataset.photo, el.dataset.title)}</div><p class="sd-preview-note">服务场景示意</p>`, btn('关闭预览', 'close-dialog'));
})();
