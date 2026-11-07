# @classic/reader

古典小说站共用阅读壳。手机与桌面同一组件，交互按屏宽分流。

## 能力

- 目录 / 版式 / 进度条 / 滚动记忆 / 快捷键
- 划线、批注、书签、导出（按 `storagePrefix` 隔离）
- 社群层 `social`：热门划线正文标注 + 笔记抽屉「众人」书评
- `headerExtra` / `footer` / `tocLead` / `overlays` 插槽
- `ReadRelated`：章首语境 + 章末「读到这里」；各书只传 header / blocks 数据
- `decoratePlain` / `onBodyClick`：站内人名链等扩展

## 接入

```ts
import { ReaderChrome, ReadRelated } from '@classic/reader';
import '@classic/reader/styles.css';

<ReaderChrome
  storagePrefix="sh"
  chapter={chapter}
  toc={toc}
  prev={prev}
  next={next}
  linkComponent={Link}
  features={{ notes: true }}
  social={socialLayer}
  headerExtra={<ReadRelated mode="header" linkComponent={Link} header={...} />}
  footer={<ReadRelated mode="footer" linkComponent={Link} blocks={...} />}
/>

// 或从 weread-social.json 构建：
import { buildSocialLayer } from '@classic/reader';
const socialLayer = buildSocialLayer(socialJson);
```

宿主需提供主题 CSS 变量（`--paper`、`--accent`、`--serif` 等）。
拉取脚本：`scripts/fetch-weread-social.mjs`。
