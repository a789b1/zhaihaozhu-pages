# 宅好住页面预览

- [业主端](./index.html)：与小程序/H5 共享页面，首页四列、维修分组及更多服务直接卡片，首页分类直达全部服务的对应项。
- [师傅端](./worker.html)：共享小程序的师傅页面；首次打开按提示选择身份。
- [运营后台](./admin.html)：当前 Web 后台 Demo，可查看目录发布与首页精选控件。

这是使用合成测试数据的交互演示，不连接生产接口，不产生实际订单或支付。不同入口的 Mock 状态独立，不作为跨端真实联调环境。默认场景仅包含少量示例；业主端「演示调试」中的 PRD2-SC03 场景包含多分类卡片，可检查三列布局。

`index.html`、`user.html`、`worker.html` 和 `admin-preview/` 由开发项目的 `pnpm build:prototype` 生成。生成清单与 SHA-256 见 `.generated-preview.json`。更新先修改共享源码，再构建并同步本目录；不要手改生成的 JS/CSS。使用相对资源地址与 hash 路由，支持 GitHub Pages 子目录部署；`.nojekyll` 必须保留。

`legacy-user.html`、`legacy-worker.html`、`legacy-admin.html` 和原 `assets` 手工文件仅保留为旧版设计档案；现行入口以上方三个链接为准。
