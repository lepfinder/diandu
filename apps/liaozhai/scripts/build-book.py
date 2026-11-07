#!/usr/bin/env python3
"""从维基文库拉取《聊齋志異》十二卷，切成篇目，写成 data/book.json。

来源（公有领域）：
https://zh.wikisource.org/wiki/聊齋志異

本机通常需代理。脚本会读环境变量 http(s)_proxy / ALL_PROXY；
若没有，默认尝试 http://127.0.0.1:7897。

用法：
  proxy on   # 或自行 export https_proxy=...
  npm install
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
SOURCE = "https://zh.wikisource.org/wiki/聊齋志異"
VOLUMES = list(range(1, 13))
DEFAULT_PROXY = "http://127.0.0.1:7897"
ROOT = Path(__file__).resolve().parents[1]

HEADER_RE = re.compile(r"\{\{[Hh]eader\b[\s\S]*?\n\}\}")
FOOTER_RE = re.compile(r"\{\{[Ff]ooter\b[\s\S]*?\}\}")
VARIANT_RE = re.compile(r"\{\{(?:别|別|另)\|([^|}]*)(?:\|[^}]*)?\}\}")
RARE_RE = re.compile(r"\{\{!\s*\|([^|}]+)(?:\|[^}]*)?\}\}")
PIZI_RE = re.compile(r"\{\{僻字\|([^|}]*)(?:\|[^}]*)?\}\}")
PROPER_RE = re.compile(r"\{\{ProperNoun\|([^}]+)\}\}")
PING_RE = re.compile(r"\{\{\*\s*\|[^}]*\}\}")
YEAR_RE = re.compile(r"\{\{YL\|([^}]+)\}\}")
FILE_RE = re.compile(r"\[\[(?:File|文件|圖像|图像):[^\]]+\]\]")
LINK_LABELED_RE = re.compile(r"\[\[(?:[^|\]]+)\|([^\]]+)\]\]")
LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
REF_RE = re.compile(r"<ref\b[^>]*/\s*>|<ref\b[^>]*>[\s\S]*?</ref>", re.I)
TAG_RE = re.compile(r"</?(?:u|b|i|em|strong|big|small|sup|sub|span|div|br|p)\b[^>]*>", re.I)
CONV_RE = re.compile(r"-{([^{}]*)}-")
# 卷二至十一多为 ==篇名==；卷十二附录下有 ===篇名===
HEADING_RE = re.compile(r"^(={2,3})\s*(.+?)\s*\1\s*$", re.M)
GENERIC_TMPL_RE = re.compile(r"\{\{([^{}]+)\}\}")
TEMPLATE_LEFTOVER_RE = re.compile(r"\{\{[^{}]+\}\}")

VOL_CN = {
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
    7: "七",
    8: "八",
    9: "九",
    10: "十",
    11: "十一",
    12: "十二",
}


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
        headers={"User-Agent": "liaozhai-book-builder/0.1 (personal classical reading site)"},
    )
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            if "error" in payload:
                raise SystemExit(f"API 错误 {title}: {payload['error']}")
            return unescape(payload["parse"]["wikitext"]["*"])
        except urllib.error.HTTPError as exc:
            last_err = exc
            if exc.code in {429, 503, 502} and attempt + 1 < retries:
                wait = 2 ** attempt + 1
                print(f"  retry {title} after {wait}s ({exc})", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"拉取失败 {title}: {exc}") from exc
        except urllib.error.URLError as exc:
            last_err = exc
            if attempt + 1 < retries:
                wait = 2 ** attempt + 1
                print(f"  retry {title} after {wait}s ({exc})", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"拉取失败 {title}: {exc}") from exc
    raise SystemExit(f"拉取失败 {title}: {last_err}")


def clean_wikitext(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"\[\[Category:[^\]]+\]\]", "", text, flags=re.I)
    text = FILE_RE.sub("", text)
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = REF_RE.sub("", text)
    text = PING_RE.sub("", text)
    text = VARIANT_RE.sub(r"\1", text)
    text = RARE_RE.sub(r"\1", text)
    text = PIZI_RE.sub(r"\1", text)
    text = PROPER_RE.sub(r"\1", text)
    text = YEAR_RE.sub(r"\1", text)
    text = LINK_LABELED_RE.sub(r"\1", text)
    text = LINK_RE.sub(lambda m: m.group(1).split("/")[-1], text)
    text = text.replace("'''", "").replace("''", "")
    text = TAG_RE.sub("", text)
    text = CONV_RE.sub(r"\1", text)
    text = re.sub(r"\{\{(?:明朝作品|清朝作品|reflist|PD-[^}|]+)(?:\|[^}]*)?\}\}", "", text, flags=re.I)

    def generic_tmpl(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        if "|" not in body:
            # bare template names / flags — drop
            if re.fullmatch(r"[\w\-./:]+", body, flags=re.I):
                return ""
            return body
        parts = body.split("|")
        name = parts[0].strip().lower()
        args = [p for p in parts[1:] if p != ""]
        if name in {"propernoun", "僻字", "另", "别", "別", "yl"}:
            return args[0] if args else ""
        if args:
            return args[0]
        return ""

    text = GENERIC_TMPL_RE.sub(generic_tmpl, text)
    return text


def paragraphs(text: str) -> list[str]:
    blocks = re.split(r"\n\s*\n", text)
    paras: list[str] = []
    for block in blocks:
        lines = []
        for line in block.splitlines():
            line = re.sub(r"^[\s　]+", "", line)
            line = re.sub(r"[\s　]+$", "", line)
            line = re.sub(r"[\s　]+", "", line)
            if not line:
                continue
            if line.startswith("|") or line.startswith("{{") or line.startswith("Category:"):
                continue
            lines.append(line)
        if not lines:
            continue
        if len(lines) > 1 and all(len(line) <= 40 for line in lines):
            paras.extend(lines)
        else:
            paras.append("".join(lines))
    return [p for p in paras if p and not p.startswith("=")]


def split_stories(wikitext: str) -> list[tuple[str, str]]:
    body = clean_wikitext(wikitext)
    matches = list(HEADING_RE.finditer(body))
    if not matches:
        raise SystemExit("本卷没有 == 篇名 == 标题")
    stories: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        title = match.group(2).strip().strip("=").strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        stories.append((title, body[start:end]))
    return stories


def to_simplified(book: dict) -> dict:
    opencc = ROOT / "node_modules" / "opencc-js"
    if not opencc.exists():
        raise SystemExit("缺少 opencc-js，先在项目根目录 npm install")
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


def polish_text(text: str) -> str:
    text = text.replace("著", "着").replace("显着", "显著")
    text = text.replace("臙脂", "胭脂")
    return text


def polish_book(book: dict) -> dict:
    leftovers: list[str] = []
    for chapter in book["chapters"]:
        for key in ("label", "title", "t1", "t2"):
            chapter[key] = polish_text(chapter[key])
        chapter["paras"] = [polish_text(p) for p in chapter["paras"]]
        for para in chapter["paras"]:
            if "{{" in para or "}}" in para or "<ref" in para.lower():
                leftovers.append(f"第{chapter['n']}篇 {para[:60]}")
            for token in TEMPLATE_LEFTOVER_RE.findall(para):
                leftovers.append(f"第{chapter['n']}篇 模板 {token[:60]}")
    if leftovers:
        raise SystemExit("正文未整理干净：\n" + "\n".join(leftovers[:40]))
    return book


def cached_wikitext(title: str, cache_dir: Path) -> str:
    cache_dir.mkdir(parents=True, exist_ok=True)
    safe = title.replace("/", "__")
    path = cache_dir / f"{safe}.wikitext"
    if path.exists() and path.stat().st_size > 0:
        print(f"cache hit {title}", file=sys.stderr)
        return path.read_text(encoding="utf-8")
    raw = fetch_wikitext(title)
    path.write_text(raw, encoding="utf-8")
    return raw


def build_chapters() -> list[dict]:
    cache_dir = ROOT / ".cache" / "wikisource"
    chapters: list[dict] = []
    n = 0
    for vol in VOLUMES:
        title = f"聊齋志異/第{vol:02d}卷"
        print(f"fetch {title}", file=sys.stderr)
        if vol > 1 and not (cache_dir / f"{title.replace('/', '__')}.wikitext").exists():
            time.sleep(1.2)
        raw = cached_wikitext(title, cache_dir)
        stories = split_stories(raw)
        vol_label = f"第{VOL_CN[vol]}卷"
        kept = 0
        for story_title, story_body in stories:
            if story_title.strip() in {"註釋", "注释", "參考", "参考", "附錄", "附录"}:
                continue
            paras = paragraphs(story_body)
            if not paras:
                print(f"  skip empty 《{story_title}》", file=sys.stderr)
                continue
            n += 1
            kept += 1
            chapters.append(
                {
                    "n": n,
                    "label": f"{vol_label} · {story_title}",
                    "title": story_title,
                    "t1": story_title,
                    "t2": vol_label,
                    "volume": vol,
                    "paras": paras,
                }
            )
        print(f"  -> {kept}/{len(stories)} 篇", file=sys.stderr)
    return chapters


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "book.json"
    ensure_proxy()
    chapters = build_chapters()
    book = {
        "meta": {
            "title": "聊斋志异",
            "author": "蒲松龄",
            "edition": "维基文库十二卷本（公有领域）",
            "source": SOURCE,
            "exported": date.today().isoformat(),
            "chapterCount": len(chapters),
        },
        "chapters": chapters,
    }
    book = polish_book(to_simplified(book))
    book["meta"]["source"] = SOURCE
    book["meta"]["title"] = "聊斋志异"
    book["meta"]["author"] = "蒲松龄"
    book["meta"]["edition"] = "维基文库十二卷本（公有领域）"
    chars = sum(len(p) for chapter in book["chapters"] for p in chapter["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first = book["chapters"][0]
    last = book["chapters"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"first {first['label']} / {first['paras'][0][:36]}")
    print(f"last  {last['label']} / {last['paras'][-1][-36:]}")


if __name__ == "__main__":
    main()
