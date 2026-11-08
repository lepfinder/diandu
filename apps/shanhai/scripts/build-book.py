#!/usr/bin/env python3
"""从维基文库拉取《山海經》十八篇，写成 data/book.json。

来源（公有领域，郭璞注本）：
https://zh.wikisource.org/wiki/山海經

本机通常需代理。脚本会读环境变量 http(s)_proxy / ALL_PROXY；
若没有，默认尝试 http://127.0.0.1:7897。

用法：
  python3 scripts/build-book.py
  python3 scripts/build-book.py data/book.json
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from html import unescape
from pathlib import Path

API = "https://zh.wikisource.org/w/api.php"
SOURCE = "https://zh.wikisource.org/wiki/山海經"
DEFAULT_PROXY = "http://127.0.0.1:7897"
ROOT = Path(__file__).resolve().parents[1]
UA = "shanhaijing-book-builder/0.1 (personal classical reading site; diandu)"

CHAPTERS = [
    ("南山經", "shan", "山经"),
    ("西山經", "shan", "山经"),
    ("北山經", "shan", "山经"),
    ("東山經", "shan", "山经"),
    ("中山經", "shan", "山经"),
    ("海外南經", "hai", "海经"),
    ("海外西經", "hai", "海经"),
    ("海外北經", "hai", "海经"),
    ("海外東經", "hai", "海经"),
    ("海內南經", "hai", "海经"),
    ("海內西經", "hai", "海经"),
    ("海內北經", "hai", "海经"),
    ("海內東經", "hai", "海经"),
    ("大荒東經", "hai", "海经"),
    ("大荒南經", "hai", "海经"),
    ("大荒西經", "hai", "海经"),
    ("大荒北經", "hai", "海经"),
    ("海內經", "hai", "海经"),
]

HEADER_RE = re.compile(r"\{\{[Hh]eader2?\b[\s\S]*?\n\}\}")
FOOTER_RE = re.compile(r"\{\{[Ff]ooter\b[\s\S]*?\}\}")
NOTE_STAR_RE = re.compile(r"\{\{\*\s*\|[^{}]*\}\}")
FILE_RE = re.compile(r"\[\[(?:File|文件|圖像|图像):[^\]]+\]\]")
LINK_LABELED_RE = re.compile(r"\[\[(?:[^|\]]+)\|([^\]]+)\]\]")
LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
REF_RE = re.compile(r"<ref\b[^>]*/\s*>|<ref\b[^>]*>[\s\S]*?</ref>", re.I)
TAG_RE = re.compile(r"</?(?:u|b|i|em|strong|big|small|sup|sub|span|div|br|p|center)\b[^>]*>", re.I)
CONV_RE = re.compile(r"-{([^{}]*)}-")
ZHHANS_RE = re.compile(r"-\{zh(?:-hans)?:([^;{}]+);[^}]*\}-")
ZHT_RE = re.compile(r"-\{([^;{}]+)\}-")
GENERIC_TMPL_RE = re.compile(r"\{\{([^{}]+)\}\}")
TEMPLATE_LEFTOVER_RE = re.compile(r"\{\{[^{}]+\}\}")
ONLYINCLUDE_RE = re.compile(r"</?onlyinclude>", re.I)
FORCE_TOC_RE = re.compile(r"__\w+__")
HEADING_RE = re.compile(r"^(={2,3})\s*(.+?)\s*\1\s*$", re.M)
REDIRECT_RE = re.compile(r"#REDIRECT\s*\[\[([^\]]+)\]\]", re.I)
VARIANT_RE = re.compile(r"\{\{(?:另|别|別)\|([^|}]*)(?:\|[^}]*)?\}\}")


def ensure_proxy() -> None:
    keys = ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy")
    if any(os.environ.get(k) for k in keys):
        return
    for k in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"):
        os.environ[k] = DEFAULT_PROXY
    print(f"proxy default -> {DEFAULT_PROXY}", file=sys.stderr)


def fetch_wikitext(title: str, retries: int = 10) -> str:
    query = urllib.parse.urlencode(
        {
            "action": "parse",
            "page": title,
            "prop": "wikitext",
            "format": "json",
            "disablelimitreport": "1",
        }
    )
    req = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": UA})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            if "error" in payload:
                raise SystemExit(f"API 错误 {title}: {payload['error']}")
            return unescape(payload["parse"]["wikitext"]["*"])
        except urllib.error.HTTPError as exc:
            last_err = exc
            if exc.code in {429, 503, 502, 403} and attempt + 1 < retries:
                wait = min(90, 4 * (2**attempt) + 3)
                print(f"  retry {title} after {wait}s ({exc})", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"拉取失败 {title}: {exc}") from exc
        except urllib.error.URLError as exc:
            last_err = exc
            if attempt + 1 < retries:
                wait = min(60, 3 * (2**attempt) + 2)
                print(f"  retry {title} after {wait}s ({exc})", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"拉取失败 {title}: {exc}") from exc
    raise SystemExit(f"拉取失败 {title}: {last_err}")


def cached_wikitext(title: str, cache_dir: Path) -> str:
    cache_dir.mkdir(parents=True, exist_ok=True)
    path = cache_dir / f"{title.replace('/', '__')}.wikitext"
    if path.exists() and path.stat().st_size > 0:
        print(f"cache hit {title}", file=sys.stderr)
        raw = path.read_text(encoding="utf-8")
    else:
        raw = fetch_wikitext(title)
        path.write_text(raw, encoding="utf-8")
    m = REDIRECT_RE.search(raw.strip())
    if m:
        target = m.group(1).strip().lstrip(":")
        print(f"  redirect {title} -> {target}", file=sys.stderr)
        return cached_wikitext(target, cache_dir)
    return raw


def strip_nested_star_notes(text: str) -> str:
    """去掉郭璞夹注 {{*|...}}，支持简单嵌套。"""
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        if text.startswith("{{*", i) or text.startswith("{{ *", i):
            depth = 2
            k = i + 3
            while k < n and depth > 0:
                if text.startswith("{{", k):
                    depth += 2
                    k += 2
                    continue
                if text.startswith("}}", k):
                    depth -= 2
                    k += 2
                    continue
                k += 1
            i = k
            continue
        out.append(text[i])
        i += 1
    return "".join(out)


def clean_inline(text: str) -> str:
    text = unescape(text)
    text = ONLYINCLUDE_RE.sub("", text)
    text = FORCE_TOC_RE.sub("", text)
    # 必须先剥分类，否则 [[Category:印度]] 会被当成普通链留下「印度」
    text = re.sub(r"\[\[Category:[^\]]+\]\]", "", text, flags=re.I)
    text = re.sub(r"\{\{PD-[^}]*\}\}", "", text, flags=re.I)
    text = strip_nested_star_notes(text)
    text = NOTE_STAR_RE.sub("", text)
    text = VARIANT_RE.sub(r"\1", text)
    text = FILE_RE.sub("", text)
    text = REF_RE.sub("", text)
    text = LINK_LABELED_RE.sub(r"\1", text)
    text = LINK_RE.sub(lambda m: m.group(1).split("/")[-1].split(":")[-1], text)
    text = text.replace("'''", "").replace("''", "")
    text = TAG_RE.sub("", text)
    text = ZHHANS_RE.sub(r"\1", text)
    text = CONV_RE.sub(r"\1", text)
    text = ZHT_RE.sub(r"\1", text)

    def generic_tmpl(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        if "|" not in body:
            return ""
        parts = body.split("|")
        name = parts[0].strip().lower()
        args = [p for p in parts[1:] if p != ""]
        if name in {"wikipedia", "w", "检索", "檢索", "textquality", "pd-old", "yl"}:
            return ""
        if name in {"另", "别", "別"}:
            return args[0] if args else ""
        if name in {"lang", "zh", "zh-hans", "zh-hant"}:
            return args[-1] if args else ""
        return args[0] if args else ""

    for _ in range(5):
        text = GENERIC_TMPL_RE.sub(generic_tmpl, text)
    return text


def paragraphs(text: str) -> list[str]:
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = re.sub(r"\{\{Textquality\|[^}]*\}\}", "", text, flags=re.I)
    text = re.sub(r"\{\{[檢检]索\|[^}]*\}\}", "", text)
    text = re.sub(r"<div\b[^>]*>|</div>", "", text, flags=re.I)
    # 文末「註釋 / references」整段丢掉
    text = re.split(r"\n==\s*註釋\s*==|\n==\s*注释\s*==|<references\s*/?>", text, maxsplit=1, flags=re.I)[0]
    text = clean_inline(text)
    text = HEADING_RE.sub(lambda m: f"\n\n{m.group(2).strip()}\n\n", text)

    blocks = re.split(r"\n\s*\n", text)
    paras: list[str] = []
    for block in blocks:
        lines = []
        for line in block.splitlines():
            line = re.sub(r"^[\s　]+", "", line)
            line = re.sub(r"[\s　]+$", "", line)
            line = re.sub(r"[\s　]{2,}", "", line)
            if not line or line.startswith(("|", "!", "{{", "Category:")):
                continue
            lines.append(line)
        if not lines:
            continue
        joined = re.sub(r"\s+", "", "".join(lines))
        if not joined or joined.startswith("="):
            continue
        if re.match(r"^(title|section|author|previous|next|notes|noauthor)\s*=", joined, re.I):
            continue
        paras.append(joined)

    out: list[str] = []
    for p in paras:
        if len(p) <= 420:
            out.append(p)
            continue
        buf = ""
        for ch in re.split(r"(?<=[。！？；])", p):
            if not ch:
                continue
            if len(buf) + len(ch) > 380 and buf:
                out.append(buf)
                buf = ch
            else:
                buf += ch
        if buf:
            out.append(buf)
    return out


def to_simplified(book: dict) -> dict:
    candidates = [
        ROOT / "node_modules" / "opencc-js",
        ROOT.parents[1] / "node_modules" / "opencc-js",
    ]
    opencc = next((p for p in candidates if p.exists()), None)
    if opencc is None:
        raise SystemExit("缺少 opencc-js，先在 monorepo 根目录 pnpm install")
    script = r"""
const OpenCC = require(process.argv[1]);
const conv = OpenCC.Converter({ from: 't', to: 'cn' });
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { data += chunk; });
process.stdin.on('end', () => {
  const walk = (value) => {
    if (typeof value === 'string') return conv(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const out = {};
      for (const key of Object.keys(value)) out[key] = walk(value[key]);
      return out;
    }
    return value;
  };
  process.stdout.write(JSON.stringify(walk(JSON.parse(data))));
});
"""
    proc = subprocess.run(
        ["node", "-e", script, str(opencc)],
        input=json.dumps(book, ensure_ascii=False).encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.decode("utf-8", "replace"))
    return json.loads(proc.stdout.decode("utf-8"))


def polish_book(book: dict) -> dict:
    for chapter in book["chapters"]:
        chapter["paras"] = [
            TEMPLATE_LEFTOVER_RE.sub("", p).replace("{{", "").replace("}}", "")
            for p in chapter["paras"]
        ]
        chapter["paras"] = [p for p in chapter["paras"] if p.strip()]
    return book


def build_chapters() -> list[dict]:
    cache_dir = ROOT / ".cache" / "wikisource"
    chapters: list[dict] = []
    for i, (title_tw, kind, kind_label) in enumerate(CHAPTERS, start=1):
        page = f"山海經/{title_tw}"
        print(f"fetch {page}", file=sys.stderr)
        cache_file = cache_dir / f"{page.replace('/', '__')}.wikitext"
        if i > 1 and not cache_file.exists():
            time.sleep(1.2)
        raw = cached_wikitext(page, cache_dir)
        paras = paragraphs(raw)
        if not paras:
            raise SystemExit(f"空正文：{page}")
        # 标题先用繁体，后交 opencc
        chapters.append(
            {
                "n": i,
                "label": f"第{i}篇",
                "title": title_tw,
                "t1": title_tw,
                "t2": kind_label,
                "kind": kind,
                "paras": paras,
            }
        )
        print(f"  -> {len(paras)} 段 / {sum(len(p) for p in paras)} 字", file=sys.stderr)
    return chapters


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "book.json"
    ensure_proxy()
    chapters = build_chapters()
    book = {
        "meta": {
            "title": "山海经",
            "author": "郭璞 注",
            "edition": "维基文库《山海经》十八篇（郭璞注本，公有领域）。夹注已剥离，便于通读。",
            "source": SOURCE,
            "exported": date.today().isoformat(),
            "chapterCount": len(chapters),
        },
        "chapters": chapters,
    }
    book = polish_book(to_simplified(book))
    book["meta"]["title"] = "山海经"
    book["meta"]["author"] = "郭璞 注"
    book["meta"]["edition"] = "维基文库《山海经》十八篇（郭璞注本，公有领域）。夹注已剥离，便于通读。"
    book["meta"]["source"] = SOURCE
    book["meta"]["exported"] = date.today().isoformat()
    book["meta"]["chapterCount"] = len(book["chapters"])

    # 简体后回写 label 为篇名
    for chapter in book["chapters"]:
        chapter["label"] = chapter["t1"]
        chapter["title"] = chapter["t1"]

    chars = sum(len(p) for chapter in book["chapters"] for p in chapter["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first, last = book["chapters"][0], book["chapters"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"first {first['label']} / {first['paras'][0][:40]}")
    print(f"last  {last['label']} / {last['paras'][-1][-40:]}")


if __name__ == "__main__":
    main()
