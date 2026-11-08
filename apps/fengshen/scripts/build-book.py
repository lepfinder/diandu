#!/usr/bin/env python3
"""从维基文库拉取《封神演義》一百回，写成 data/book.json。

来源（公有领域）：
https://zh.wikisource.org/wiki/封神演義
分卷：封神演義/卷001 … 封神演義/卷100

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
SOURCE = "https://zh.wikisource.org/wiki/封神演義"
DEFAULT_PROXY = "http://127.0.0.1:7897"
ROOT = Path(__file__).resolve().parents[1]
UA = "fengshen-book-builder/0.1 (personal classical reading site; diandu)"

HEADER_RE = re.compile(r"\{\{[Hh]eader\b[\s\S]*?\n\}\}")
FOOTER_RE = re.compile(r"\{\{[Ff]ooter\b[\s\S]*?\}\}")
SECTION_RE = re.compile(r"\|\s*section\s*=\s*([^\n|]+)")
TOC_RE = re.compile(
    r"\*?\s*\[\[/卷(\d{3})\|第\s*(\d+)\s*回\s+([^\]]+)\]\]"
)
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
NOTICE_TMPL_RE = re.compile(r"\{\{注意\|[^}]*\}\}", re.I)
REDIRECT_RE = re.compile(r"#REDIRECT\s*\[\[([^\]]+)\]\]", re.I)
CN = "零一二三四五六七八九"


def ensure_proxy() -> None:
    keys = ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "all_proxy")
    if any(os.environ.get(k) for k in keys):
        return
    os.environ["http_proxy"] = DEFAULT_PROXY
    os.environ["https_proxy"] = DEFAULT_PROXY
    os.environ["HTTP_PROXY"] = DEFAULT_PROXY
    os.environ["HTTPS_PROXY"] = DEFAULT_PROXY
    os.environ["ALL_PROXY"] = DEFAULT_PROXY
    print(f"proxy default -> {DEFAULT_PROXY}", file=sys.stderr)


def to_cn(n: int) -> str:
    if n <= 10:
        return "十" if n == 10 else CN[n]
    if n < 20:
        return "十" + CN[n % 10]
    if n < 100:
        return CN[n // 10] + "十" + (CN[n % 10] if n % 10 else "")
    if n == 100:
        return "一百"
    raise SystemExit(f"回数超出一百：{n}")


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
    req = urllib.request.Request(
        f"{API}?{query}",
        headers={"User-Agent": UA},
    )
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


def cached_wikitext(title: str, cache_dir: Path, *, follow_redirect: bool = True) -> str:
    cache_dir.mkdir(parents=True, exist_ok=True)
    safe = title.replace("/", "__")
    path = cache_dir / f"{safe}.wikitext"
    if path.exists() and path.stat().st_size > 0:
        print(f"cache hit {title}", file=sys.stderr)
        raw = path.read_text(encoding="utf-8")
    else:
        raw = fetch_wikitext(title)
        path.write_text(raw, encoding="utf-8")

    if follow_redirect:
        m = REDIRECT_RE.search(raw.strip())
        if m:
            target = m.group(1).strip()
            if target.startswith(":"):
                target = target[1:]
            print(f"  redirect {title} -> {target}", file=sys.stderr)
            return cached_wikitext(target, cache_dir, follow_redirect=False)
    return raw


def clean_inline(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"\[\[Category:[^\]]+\]\]", "", text, flags=re.I)
    text = ONLYINCLUDE_RE.sub("", text)
    text = FORCE_TOC_RE.sub("", text)
    text = NOTICE_TMPL_RE.sub("", text)
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
            if re.fullmatch(r"[\w\-./:]+", body, flags=re.I):
                return ""
            return ""
        parts = body.split("|")
        name = parts[0].strip().lower()
        args = [p for p in parts[1:] if p != ""]
        if name in {"wikipedia", "w", "检索", "檢索", "注意", "pd-old", "textquality"}:
            return ""
        if name in {"lang", "zh", "zh-hans", "zh-hant"}:
            return args[-1] if args else ""
        if args:
            return args[0]
        return ""

    for _ in range(4):
        text = GENERIC_TMPL_RE.sub(generic_tmpl, text)
    return text


def paragraphs(text: str) -> list[str]:
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = ONLYINCLUDE_RE.sub("", text)
    text = FORCE_TOC_RE.sub("", text)
    text = NOTICE_TMPL_RE.sub("", text)
    text = re.sub(r"\{\{wikipedia\|[^}]*\}\}", "", text, flags=re.I)
    text = re.sub(r"\{\{[檢检]索\|[^}]*\}\}", "", text)
    text = re.sub(r"<div\b[^>]*>|</div>", "", text, flags=re.I)
    text = clean_inline(text)

    blocks = re.split(r"\n\s*\n", text)
    paras: list[str] = []
    for block in blocks:
        lines = []
        for line in block.splitlines():
            line = re.sub(r"^[\s　]+", "", line)
            line = re.sub(r"[\s　]+$", "", line)
            line = re.sub(r"[\s　]{2,}", "", line)
            if not line:
                continue
            if line.startswith("|") or line.startswith("!") or line.startswith("{{"):
                continue
            if line.startswith("Category:"):
                continue
            lines.append(line)
        if not lines:
            continue
        joined = "".join(lines)
        joined = re.sub(r"\s+", "", joined)
        if not joined or joined.startswith("="):
            continue
        if re.match(r"^(title|section|author|previous|next|notes|theme|type)\s*=", joined, re.I):
            continue
        paras.append(joined)

    out: list[str] = []
    for p in paras:
        if len(p) <= 480:
            out.append(p)
            continue
        buf = ""
        for ch in re.split(r"(?<=[。！？；])", p):
            if not ch:
                continue
            if len(buf) + len(ch) > 420 and buf:
                out.append(buf)
                buf = ch
            else:
                buf += ch
        if buf:
            out.append(buf)
    return out


def parse_toc(main_wt: str) -> list[dict]:
    entries: list[dict] = []
    for match in TOC_RE.finditer(main_wt):
        vol = int(match.group(1))
        n = int(match.group(2))
        title = clean_inline(match.group(3)).replace(" ", "").replace("　", "").strip()
        # 个别目录行被截断，用卷号页内 section 再补
        entries.append(
            {
                "n": n,
                "vol": vol,
                "page": f"封神演義/卷{vol:03d}",
                "title": title,
            }
        )
    # 去重保序
    seen: set[int] = set()
    unique: list[dict] = []
    for entry in entries:
        if entry["n"] in seen:
            continue
        seen.add(entry["n"])
        unique.append(entry)
    if len(unique) < 90:
        raise SystemExit(f"目录解析异常：仅得到 {len(unique)} 回")
    return unique


def title_from_section(raw: str, fallback: str) -> str:
    m = SECTION_RE.search(raw)
    if not m:
        return fallback
    section = clean_inline(m.group(1)).strip()
    section = re.sub(r"^第[一二三四五六七八九十百零〇0-9]+\s*回\s*", "", section)
    section = section.replace(" ", "").replace("　", "").strip()
    return section or fallback


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
    leftovers: list[str] = []
    for chapter in book["chapters"]:
        for para in chapter["paras"]:
            if "{{" in para or "}}" in para:
                leftovers.append(f"第{chapter['n']}回 {para[:80]}")
        chapter["paras"] = [
            TEMPLATE_LEFTOVER_RE.sub("", p).replace("{{", "").replace("}}", "")
            for p in chapter["paras"]
        ]
        chapter["paras"] = [p for p in chapter["paras"] if p.strip()]
    if leftovers:
        print(f"警告：清理模板残留 {len(leftovers)} 处", file=sys.stderr)
    return book


def build_chapters() -> list[dict]:
    cache_dir = ROOT / ".cache" / "wikisource"
    print("fetch 封神演義 TOC", file=sys.stderr)
    main_wt = cached_wikitext("封神演義", cache_dir)
    toc = parse_toc(main_wt)
    chapters: list[dict] = []
    for i, entry in enumerate(toc):
        page = entry["page"]
        print(f"fetch {page} · 第{entry['n']}回 {entry['title']}", file=sys.stderr)
        cache_file = cache_dir / f"{page.replace('/', '__')}.wikitext"
        if i > 0 and not cache_file.exists():
            time.sleep(1.6)
        raw = cached_wikitext(page, cache_dir)
        title = title_from_section(raw, entry["title"])
        paras = paragraphs(raw)
        if not paras:
            raise SystemExit(f"空正文：{page} {title}")
        n = entry["n"]
        chapters.append(
            {
                "n": n,
                "label": f"第{to_cn(n)}回",
                "title": title,
                "t1": title,
                "t2": "",
                "paras": paras,
            }
        )
        print(f"  -> {len(paras)} 段 / {sum(len(p) for p in paras)} 字", file=sys.stderr)

    chapters.sort(key=lambda c: c["n"])
    if [c["n"] for c in chapters] != list(range(1, len(chapters) + 1)):
        missing = sorted(set(range(1, 101)) - {c["n"] for c in chapters})
        raise SystemExit(f"回数不连续，缺：{missing[:20]}")
    return chapters


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "book.json"
    ensure_proxy()
    chapters = build_chapters()
    book = {
        "meta": {
            "title": "封神演义",
            "author": "许仲琳",
            "edition": "维基文库一百回本（公有领域）。作者一作陈仲琳，一说陆西星。",
            "source": SOURCE,
            "exported": date.today().isoformat(),
            "chapterCount": len(chapters),
        },
        "chapters": chapters,
    }
    book = polish_book(to_simplified(book))
    book["meta"]["title"] = "封神演义"
    book["meta"]["author"] = "许仲琳"
    book["meta"]["edition"] = "维基文库一百回本（公有领域）。作者一作陈仲琳，一说陆西星。"
    book["meta"]["source"] = SOURCE
    book["meta"]["exported"] = date.today().isoformat()
    book["meta"]["chapterCount"] = len(book["chapters"])

    chars = sum(len(p) for chapter in book["chapters"] for p in chapter["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first = book["chapters"][0]
    last = book["chapters"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"first {first['label']} {first['t1']} / {first['paras'][0][:36]}")
    print(f"last  {last['label']} {last['t1']} / {last['paras'][-1][-36:]}")


if __name__ == "__main__":
    main()
