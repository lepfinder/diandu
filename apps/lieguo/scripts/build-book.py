#!/usr/bin/env python3
"""从维基文库拉取《東周列國志》一百零八回，写成 data/book.json。

来源（公有领域）：
https://zh.wikisource.org/wiki/東周列國志
分回：東周列國志/第001回 … 第108回

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
SOURCE = "https://zh.wikisource.org/wiki/東周列國志"
DEFAULT_PROXY = "http://127.0.0.1:7897"
ROOT = Path(__file__).resolve().parents[1]
CHAPTERS = 108

HEADER_RE = re.compile(r"\{\{(?:header|novel|wwc|Textquality|Col-[^}|]+|div)[^}]*\}\}", re.I)
FOOTER_RE = re.compile(r"\{\{footer\b[\s\S]*?\}\}", re.I)
VARIANT_RE = re.compile(r"\{\{(?:别|別|另)\|([^|}]*)(?:\|[^}]*)?\}\}")
NOTE_RE = re.compile(r"\{\{~\|([^}]*)\}\}")
REF_RE = re.compile(r"<ref\b[^>]*/\s*>|<ref\b[^>]*>[\s\S]*?</ref>", re.I)
TAG_RE = re.compile(r"</?(?:u|b|i|em|strong|big|small|sup|sub|span|div|br|p|center)\b[^>]*>", re.I)
LINK_LABELED_RE = re.compile(r"\[\[(?:[^|\]]+)\|([^\]]+)\]\]")
LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
HEADING_RE = re.compile(r"^=+\s*.*?\s*=+\s*$", re.M)
GENERIC_TMPL_RE = re.compile(r"\{\{([^{}]+)\}\}")
CONV_RE = re.compile(r"-{([^{}]*)}-")
TOC_RE = re.compile(r"\*\[\[/第(\d+)回\|第[^]]+\]\]\s*(.+)")
VERSE_RE = re.compile(r"^::;?\s*", re.M)


def ensure_proxy() -> None:
    keys = ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy")
    if any(os.environ.get(k) for k in keys):
        return
    for k in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY"):
        os.environ[k] = DEFAULT_PROXY
    print(f"proxy default -> {DEFAULT_PROXY}", file=sys.stderr)


def fetch_wikitext(title: str, retries: int = 6) -> str:
    query = urllib.parse.urlencode(
        {
            "action": "parse",
            "page": title,
            "prop": "wikitext",
            "format": "json",
            "disablelimitreport": "1",
        }
    )
    req = urllib.request.Request(
        f"{API}?{query}",
        headers={"User-Agent": "lieguo-book-builder/0.1 (personal classical reading site)"},
    )
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            if "error" in payload:
                raise SystemExit(f"API 错误 {title}: {payload['error']}")
            return unescape(payload["parse"]["wikitext"]["*"])
        except (urllib.error.HTTPError, urllib.error.URLError) as exc:
            last_err = exc
            code = getattr(exc, "code", None)
            if attempt + 1 < retries and (code in {429, 502, 503} or code is None):
                wait = 4**attempt + 3 if code == 429 else 2**attempt + 1
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
        return path.read_text(encoding="utf-8")
    raw = fetch_wikitext(title)
    path.write_text(raw, encoding="utf-8")
    return raw


def clean_text(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"<div\b[^>]*>|</div>", "", text, flags=re.I)
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = NOTE_RE.sub(r"（\1）", text)
    text = REF_RE.sub("", text)
    text = VARIANT_RE.sub(r"\1", text)
    text = LINK_LABELED_RE.sub(r"\1", text)
    text = LINK_RE.sub(lambda m: m.group(1).split("/")[-1], text)
    text = TAG_RE.sub("", text)
    text = CONV_RE.sub(r"\1", text)
    text = HEADING_RE.sub("", text)
    text = VERSE_RE.sub("", text)
    text = text.replace("'''", "").replace("''", "")

    def generic(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        parts = body.split("|")
        name = parts[0].strip().lower()
        args = [p for p in parts[1:] if p]
        if name in {"novel", "wwc", "textquality", "wikipedia", "col-begin", "col-break", "col-end"}:
            return ""
        if args:
            return args[0]
        return ""

    for _ in range(3):
        text = GENERIC_TMPL_RE.sub(generic, text)
    return text


def paragraphs(raw: str) -> list[str]:
    text = clean_text(raw)
    paras: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        lines = []
        for line in block.splitlines():
            line = re.sub(r"^[\s　]+", "", line)
            line = re.sub(r"[\s　]+$", "", line)
            if not line or line.startswith("|") or line.startswith("{{"):
                continue
            lines.append(line)
        if not lines:
            continue
        # 词牌/诗行保留分行；叙事段合并
        if all(len(x) <= 40 for x in lines) and len(lines) >= 2:
            paras.extend(lines)
        else:
            joined = "".join(re.sub(r"[\s　]+", "", x) for x in lines)
            if joined:
                paras.append(joined)
    # 再清残留模板
    out = []
    for p in paras:
        p = GENERIC_TMPL_RE.sub("", p).replace("{{", "").replace("}}", "").strip()
        if p:
            out.append(p)
    return out


def parse_toc(main_wt: str) -> list[tuple[int, str, str]]:
    entries = []
    for m in TOC_RE.finditer(main_wt):
        n = int(m.group(1))
        title_raw = m.group(2).strip()
        # 周宣王聞謠輕殺　　杜大夫化厲鳴寃
        parts = re.split(r"[\s　]{2,}", title_raw)
        t1 = parts[0].strip() if parts else title_raw
        t2 = parts[1].strip() if len(parts) > 1 else ""
        entries.append((n, t1, t2))
    if len(entries) != CHAPTERS:
        raise SystemExit(f"目录异常：期望 {CHAPTERS}，得到 {len(entries)}")
    return entries


def to_simplified(book: dict) -> dict:
    candidates = [
        ROOT / "node_modules" / "opencc-js",
        ROOT.parents[1] / "node_modules" / "opencc-js",
    ]
    opencc = next((p for p in candidates if p.exists()), None)
    if opencc is None:
        raise SystemExit("缺少 opencc-js，先 pnpm install")
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


def remap_side_data(book: dict) -> None:
    """按回目关键词回写 characters / topics 的 chapter。"""
    chapters = book["chapters"]

    def find_ch(*keywords: str) -> int | None:
        for c in chapters:
            blob = c["title"] + c["t1"] + c.get("t2", "")
            if all(k in blob for k in keywords):
                return c["n"]
        for c in chapters:
            blob = c["title"] + c["t1"] + c.get("t2", "")
            if any(k in blob for k in keywords):
                return c["n"]
        return None

    char_hints = {
        "youwang": ("烽火",),
        "pingwang": ("东迁",),
        "huanhong": ("桓公",),
        "guanzhong": ("管夷吾", "鲍叔"),
        "chonger": ("城濮",),
        "goujian": ("勾践",),
        "fuchai": ("夫差",),
        "shangyang": ("商鞅",),
        "suzqin": ("苏秦",),
        "zhangyi": ("张仪",),
        "lianpo": ("廉颇",),
        "jingke": ("荆轲",),
        "qinshihuang": ("始皇", "郡县"),
    }
    char_path = ROOT / "data" / "characters.json"
    if char_path.exists():
        chars = json.loads(char_path.read_text(encoding="utf-8"))
        for person in chars.get("list", []):
            keys = char_hints.get(person["id"])
            if not keys:
                continue
            n = find_ch(*keys) if len(keys) > 1 else find_ch(keys[0])
            # try each keyword
            if n is None:
                for k in keys:
                    n = find_ch(k)
                    if n:
                        break
            if n:
                person["firstCh"] = n
                person["lastCh"] = n
        char_path.write_text(json.dumps(chars, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    scene_hints = {
        "fenghuo": ("烽火",),
        "dongqian": ("东迁",),
        "guanzhong": ("鲍叔", "管"),
        "chengpu": ("城濮",),
        "goujian": ("勾践",),
        "changping": ("长平",),
        "yishui": ("荆轲",),
        "unify": ("郡县",),
    }
    topics_path = ROOT / "data" / "topics.json"
    if topics_path.exists():
        topics = json.loads(topics_path.read_text(encoding="utf-8"))
        for scene in topics.get("scenes", []):
            keys = scene_hints.get(scene["id"], ())
            n = None
            for k in keys:
                n = find_ch(k)
                if n:
                    break
            if n:
                scene["chapter"] = n
        topics_path.write_text(json.dumps(topics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "book.json"
    ensure_proxy()
    cache_dir = ROOT / ".cache" / "wikisource"
    print("fetch 東周列國志 TOC", file=sys.stderr)
    toc = parse_toc(cached_wikitext("東周列國志", cache_dir))
    chapters = []
    for i, (n, t1, t2) in enumerate(toc, start=1):
        page = f"東周列國志/第{n:03d}回"
        print(f"fetch {page}", file=sys.stderr)
        cache_file = cache_dir / f"{page.replace('/', '__')}.wikitext"
        if i > 1 and not cache_file.exists():
            time.sleep(1.6)
        raw = cached_wikitext(page, cache_dir)
        paras = paragraphs(raw)
        if not paras:
            raise SystemExit(f"空正文 {page}")
        title = f"{t1}　{t2}" if t2 else t1
        chapters.append(
            {
                "n": i,
                "label": f"第{i}回",
                "title": title,
                "t1": t1,
                "t2": t2,
                "paras": paras,
            }
        )
        print(f"  -> {len(paras)} 段", file=sys.stderr)

    book = {
        "meta": {
            "title": "东周列国志",
            "author": "冯梦龙 / 蔡元放",
            "edition": "维基文库一百零八回本（公有领域）",
            "source": SOURCE,
            "exported": date.today().isoformat(),
            "chapterCount": len(chapters),
        },
        "chapters": chapters,
    }
    book = to_simplified(book)
    book["meta"]["title"] = "东周列国志"
    book["meta"]["author"] = "冯梦龙 / 蔡元放"
    book["meta"]["edition"] = "维基文库一百零八回本（公有领域）"
    book["meta"]["source"] = SOURCE
    book["meta"]["exported"] = date.today().isoformat()
    book["meta"]["chapterCount"] = len(book["chapters"])

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    remap_side_data(book)
    chars = sum(len(p) for c in book["chapters"] for p in c["paras"])
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"first {book['chapters'][0]['label']} {book['chapters'][0]['t1']}")
    print(f"last  {book['chapters'][-1]['label']} {book['chapters'][-1]['t1']}")


if __name__ == "__main__":
    main()
