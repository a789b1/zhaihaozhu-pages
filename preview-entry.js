/* Compatibility for existing static prototype bookmarks. The UI is built from uni-app. */
(() => {
  const [route, search = ''] = location.hash.slice(1).split('?');
  const role = location.pathname.endsWith('/worker.html') ? 'worker' : 'customer';
  if (route && !['/home', '/categories', '/services', '/more-services'].includes(route)) {
    if (/^\/(customer|worker|pages)\//.test(route)) return;
    // Historical prototype IDs are not production offering IDs. Preserve their original details.
    location.replace(`./legacy-${role === 'worker' ? 'worker' : 'user'}.html${location.hash}`);
    return;
  }
  const query = new URLSearchParams(search);
  const roots = {
    水电维修: 'A', 水电系统: 'A', 防水补漏: 'B', 卫浴洁具: 'E',
    墙地顶面: 'D', 定制柜体: 'C', 家电维修: 'F', 清洗养护: 'G', 清洗保养: 'G',
    门窗五金: 'H', 单品换新: 'R-A', 空间局改: 'R-B', 全屋翻新: 'R-C', 专项升级: 'R-D',
    防水系统: 'B', 天地墙: 'D', 柜体收纳: 'C', 门窗: 'H',
  };
  const name = query.get('category');
  const branch = roots[name];
  const target = new URLSearchParams();
  const id = query.get('category_id') || (branch === 'E' ? 'demo-v3-node' : branch ? `demo-node-${branch}` : '');
  if (id) target.set('category_id', id);
  if (query.get('city_id')) target.set('city_id', query.get('city_id'));
  const screen = !route || route === '/home' ? 'home' : 'categories';
  history.replaceState(null, '', `#/${role}/${screen}/index${target.size ? '?' + target : ''}`);
})();
