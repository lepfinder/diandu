# 典读 · diandu

中国古典交互精读 monorepo：聚合站 + 六部书 + 共享组件。

线上：https://diandu-6ro.pages.dev · 源码许可见 `LICENSE`，正文底本见 `NOTICE.md`。

## 结构

```text
apps/
  portal/       聚合站（对外入口）
  honglou/      红楼梦
  sanguo/       三国演义
  shuihu/       水浒传
  xiyouji/      西游记
  jinpingmei/   金瓶梅
  liaozhai/     聊斋志异
packages/
  reader/       @classic/reader 阅读壳
  ui/           @classic/ui（Link / SiteNav / asset）
  catalog/      书目元数据
```

## 开发

```bash
pnpm install
pnpm sync:books       # 生成 public/data/book.js 与 toc.json

pnpm dev:portal      # :3400
pnpm dev:honglou     # :3434
pnpm dev:sanguo      # :3460
pnpm dev:shuihu      # :3470
pnpm dev:xiyouji     # :3480
pnpm dev:jinpingmei  # :3490
pnpm dev:liaozhai    # :3510
```

本地聚合站会链到各书独立端口；组装部署后改为同域路径（`/honglou/` 等）。

## Cloudflare 单站部署

```bash
pnpm deploy:build
# 产物在 deploy/ —— Pages 直接发布该目录
npx wrangler pages deploy deploy --project-name=diandu --branch=main
```

各书构建时带 `NEXT_PUBLIC_BASE_PATH=/书名`，portal 带 `NEXT_PUBLIC_SITE_MODE=assemble`。
