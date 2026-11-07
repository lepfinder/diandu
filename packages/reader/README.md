# @classic/reader

古典小说站共用阅读壳。手机与桌面同一组件，交互按屏宽分流。

## 能力

- 目录 / 版式 / 进度条 / 滚动记忆 / 快捷键
- 划线、批注、书签、导出（按 `storagePrefix` 隔离）
- `headerExtra` / `footer` 插槽留给各站特有内容

## 接入

```ts
import { ReaderChrome } from '@classic/reader';
import '@classic/reader/styles.css';

<ReaderChrome
  storagePrefix="sh"
  chapter={chapter}
  toc={toc}
  prev={prev}
  next={next}
  linkComponent={Link}
  features={{ notes: true }}
  footer={<SiteRelated />}
/>
```

宿主需提供主题 CSS 变量（`--paper`、`--accent`、`--serif` 等）。
