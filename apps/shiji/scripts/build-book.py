#!/usr/bin/env python3
"""从维基文库拉取《史記》一百三十卷，写成 data/book.json。

来源（公有领域）：
https://zh.wikisource.org/wiki/史記
分卷：史記/卷001 … 史記/卷130

本机通常需代理。脚本会读环境变量 http(s)_proxy / ALL_PROXY；
若没有，默认尝试 http://127.0.0.1:7897。

用法：
  proxy on
  pnpm install   # 需要 opencc-js（简繁转换）
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
SOURCE = "https://zh.wikisource.org/wiki/史記"
DEFAULT_PROXY = "http://127.0.0.1:7897"
ROOT = Path(__file__).resolve().parents[1]

HEADER2_RE = re.compile(r"\{\{header2\b[\s\S]*?\}\}", re.I)
HEADER_RE = re.compile(r"\{\{header\b[\s\S]*?\}\}", re.I)
FOOTER_RE = re.compile(r"\{\{footer\b[\s\S]*?\}\}", re.I)
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
TAG_RE = re.compile(r"</?(?:u|b|i|em|strong|big|small|sup|sub|span|div|br|p|center)\b[^>]*>", re.I)
CONV_RE = re.compile(r"-{([^{}]*)}-")
HEADING_RE = re.compile(r"^(={2,3})\s*(.+?)\s*\1\s*$", re.M)
GENERIC_TMPL_RE = re.compile(r"\{\{([^{}]+)\}\}")
TEMPLATE_LEFTOVER_RE = re.compile(r"\{\{[^{}]+\}\}")
WIKITABLE_RE = re.compile(r"\{\|[\s\S]*?\n\|\}", re.M)
TOC_RE = re.compile(
    r"\*\[\[史記/(卷\d{3})\|([^\]]+)\]\]\s*(.+)",
)
DROP_HEADINGS = {
    "索隐述赞",
    "索隱述贊",
    "正义",
    "正義",
    "集解",
    "注释",
    "註釋",
    "参考",
    "參考",
    "附录",
    "附錄",
    "校勘记",
    "校勘記",
}
REDIRECT_RE = re.compile(r"#REDIRECT\s*\[\[([^\]]+)\]\]", re.I)
NOTICE_TMPL_RE = re.compile(r"\{\{注意\|[^}]*\}\}", re.I)
ZHHANS_RE = re.compile(r"-\{zh(?:-hans)?:([^;{}]+);[^}]*\}-")
ZHT_RE = re.compile(r"-\{([^;{}]+)\}-")
SPECIAL_TMPL_RE = re.compile(r"\{\{(?:專|专|书|書|标|標)\|([^{}|]+)(?:\|[^{}]*)?\}\}")
ONLYINCLUDE_RE = re.compile(r"</?onlyinclude>", re.I)
FORCE_TOC_RE = re.compile(r"__\w+__")
# 天官书等把三家注塞进 {{*|…}} / {{deepPink|…}}；整段丢掉
DROP_TMPL_NAMES = {
    "*",
    "deeppink",
    "green",
    "blue",
    "red",
    "alsosee",
    "pd-old",
    "原文沒有標點",
    "原文没有标点",
    "註",
    "注",
}

KIND_BY_VOL = [
    *((i, "benji") for i in range(1, 13)),
    *((i, "biao") for i in range(13, 23)),
    *((i, "shu") for i in range(23, 31)),
    *((i, "shijia") for i in range(31, 61)),
    *((i, "liezhuan") for i in range(61, 131)),
]
KIND_MAP = dict(KIND_BY_VOL)
KIND_LABEL = {
    "benji": "本纪",
    "biao": "表",
    "shu": "书",
    "shijia": "世家",
    "liezhuan": "列传",
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
        headers={"User-Agent": "shiji-book-builder/0.1 (personal classical reading site)"},
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
            if exc.code in {429, 503, 502} and attempt + 1 < retries:
                wait = 2**attempt + 1
                print(f"  retry {title} after {wait}s ({exc})", file=sys.stderr)
                time.sleep(wait)
                continue
            raise SystemExit(f"拉取失败 {title}: {exc}") from exc
        except urllib.error.URLError as exc:
            last_err = exc
            if attempt + 1 < retries:
                wait = 2**attempt + 1
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
            # relative redirects like 史記/魯周公世家
            print(f"  redirect {title} -> {target}", file=sys.stderr)
            return cached_wikitext(target, cache_dir, follow_redirect=False)
    return raw


def strip_named_templates(text: str, names: set[str]) -> str:
    """按名字删除 {{name|...}}，支持嵌套大括号。"""
    lower_names = {n.lower() for n in names}
    out: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        if text.startswith("{{", i):
            j = i + 2
            if j < n and text[j] == "*":
                name = "*"
            else:
                name_end = j
                while name_end < n and text[name_end] not in "|{}":
                    name_end += 1
                name = text[j:name_end].strip().lower()
            depth = 2
            k = j
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
            if name in lower_names:
                i = k
                continue
            out.append(text[i:k])
            i = k
            continue
        out.append(text[i])
        i += 1
    return "".join(out)


def clean_inline(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"\[\[Category:[^\]]+\]\]", "", text, flags=re.I)
    text = ONLYINCLUDE_RE.sub("", text)
    text = FORCE_TOC_RE.sub("", text)
    text = NOTICE_TMPL_RE.sub("", text)
    text = strip_named_templates(text, DROP_TMPL_NAMES)
    text = SPECIAL_TMPL_RE.sub(r"\1", text)
    text = FILE_RE.sub("", text)
    text = REF_RE.sub("", text)
    text = PING_RE.sub("", text)
    text = VARIANT_RE.sub(r"\1", text)
    text = RARE_RE.sub(r"\1", text)
    text = PIZI_RE.sub(r"\1", text)
    text = PROPER_RE.sub(r"\1", text)
    text = YEAR_RE.sub(r"\1", text)
    text = LINK_LABELED_RE.sub(r"\1", text)
    text = LINK_RE.sub(lambda m: m.group(1).split("/")[-1].split(":")[-1], text)
    text = text.replace("'''", "").replace("''", "")
    text = TAG_RE.sub("", text)
    text = ZHHANS_RE.sub(r"\1", text)
    text = CONV_RE.sub(r"\1", text)
    text = ZHT_RE.sub(r"\1", text)
    # 残留夹注【索隐】…【正义】… 到句读前；保守删除到下一个【或行末
    text = re.sub(r"【(?:索隐|索隱|正义|正義|集解)】[^【\n]{0,800}", "", text)
    text = re.sub(r"<references\s*/?>", "", text, flags=re.I)

    def generic_tmpl(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        if "|" not in body:
            if re.fullmatch(r"[\w\-./:]+", body, flags=re.I):
                return ""
            return body
        parts = body.split("|")
        name = parts[0].strip().lower()
        args = [p for p in parts[1:] if p != ""]
        if name in {"propernoun", "僻字", "另", "别", "別", "yl", "wikipedia", "w", "注意"}:
            return ""
        if name in {"專", "专", "书", "書", "标", "標"}:
            return args[0] if args else ""
        if name in {"lang", "zh", "zh-hans", "zh-hant"}:
            return args[-1] if args else ""
        # named params like text=...
        for arg in args:
            if "=" in arg:
                key, val = arg.split("=", 1)
                if key.strip().lower() in {"text", "1"}:
                    return "" if name in {"注意"} else val
        if args:
            return args[0]
        return ""

    # nested-ish: run a few passes for simple nesting
    for _ in range(4):
        text = SPECIAL_TMPL_RE.sub(r"\1", text)
        text = GENERIC_TMPL_RE.sub(generic_tmpl, text)
    return text


def wikitable_to_paras(table: str) -> list[str]:
    """把简易 wikitable 压成可读行；复杂表保底摘出文字。"""
    rows: list[list[str]] = []
    current: list[str] = []
    for raw_line in table.splitlines():
        line = raw_line.strip()
        if line.startswith("{|") or line.startswith("|+") or line.startswith("|}"):
            continue
        if line == "|-":
            if current:
                rows.append(current)
                current = []
            continue
        if line.startswith("!"):
            cells = re.split(r"\s*!!\s*|\s*\|\|\s*", line.lstrip("!").strip())
            current.extend(clean_inline(c).strip() for c in cells if clean_inline(c).strip())
            continue
        if line.startswith("|"):
            # | style=... | cell  or || cells
            body = line.lstrip("|")
            if "||" in body:
                cells = body.split("||")
            elif "|" in body and "=" in body.split("|", 1)[0]:
                cells = [body.split("|", 1)[-1]]
            else:
                cells = [body]
            current.extend(clean_inline(c).strip() for c in cells if clean_inline(c).strip())
    if current:
        rows.append(current)

    if not rows:
        plain = clean_inline(re.sub(r"[|!\-{}]", " ", table))
        plain = re.sub(r"\s+", " ", plain).strip()
        return [plain] if plain else []

    header = rows[0]
    paras: list[str] = []
    if len(rows) == 1:
        paras.append("　".join(header))
        return paras

    # 表前说明行若已单独处理；这里输出「年 / 列：值」压缩行
    for row in rows[1:]:
        if not row:
            continue
        if len(header) >= 2 and len(row) >= 2:
            year = row[0]
            parts = []
            for i, cell in enumerate(row[1:], start=1):
                if not cell:
                    continue
                label = header[i] if i < len(header) else ""
                parts.append(f"{label}：{cell}" if label else cell)
            if parts:
                paras.append(f"{year}　" + "　".join(parts))
            else:
                paras.append("　".join(row))
        else:
            paras.append("　".join(row))
    return paras


def strip_dropped_sections(body: str) -> str:
    matches = list(HEADING_RE.finditer(body))
    if not matches:
        return body
    keep_ranges: list[tuple[int, int]] = []
    # preface before first heading
    if matches[0].start() > 0:
        keep_ranges.append((0, matches[0].start()))
    for i, match in enumerate(matches):
        title = match.group(2).strip()
        plain = re.sub(r"[\s　]+", "", title)
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        if plain in DROP_HEADINGS or any(plain.startswith(d) for d in DROP_HEADINGS):
            continue
        # keep heading title as soft marker for 太史公曰 etc.
        keep_ranges.append((match.start(), end))
    if not keep_ranges:
        return body
    return "".join(body[a:b] for a, b in keep_ranges)


def paragraphs(text: str) -> list[str]:
    text = HEADER2_RE.sub("", text)
    text = re.sub(r"\{\{[Hh]eader2?\b[\s\S]*?\n\}\}", "", text)
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = ONLYINCLUDE_RE.sub("", text)
    text = FORCE_TOC_RE.sub("", text)
    text = NOTICE_TMPL_RE.sub("", text)
    text = strip_named_templates(text, DROP_TMPL_NAMES)
    text = re.sub(r"\{\{wikipedia\|[^}]*\}\}", "", text, flags=re.I)
    text = re.sub(r"\{\{Textquality\|[^}]*\}\}", "", text, flags=re.I)
    text = re.sub(r"<div\b[^>]*>|</div>", "", text, flags=re.I)

    table_paras: list[tuple[int, list[str]]] = []
    def remember_table(match: re.Match[str]) -> str:
        paras = wikitable_to_paras(match.group(0))
        token = f"\n\n@@TABLE{len(table_paras)}@@\n\n"
        table_paras.append((len(table_paras), paras))
        return token

    text = WIKITABLE_RE.sub(remember_table, text)
    text = strip_dropped_sections(text)
    text = clean_inline(text)
    # drop remaining heading markers but keep 太史公曰 as paragraph lead
    text = HEADING_RE.sub(lambda m: f"\n\n{m.group(2).strip()}\n\n", text)

    blocks = re.split(r"\n\s*\n", text)
    paras: list[str] = []
    for block in blocks:
        token = block.strip()
        m = re.fullmatch(r"@@TABLE(\d+)@@", token)
        if m:
            paras.extend(table_paras[int(m.group(1))][1])
            continue
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
        paras.append(joined)

    # 轻度拆超长段，便于阅读
    out: list[str] = []
    for p in paras:
        if re.match(r"^(title|section|author|previous|next|notes|theme|type)\s*=", p, re.I):
            continue
        if p.startswith("【索隐述赞】") or p.startswith("【索隱述贊】"):
            continue
        if p in {"索隐述赞", "索隱述贊", "正义", "正義", "集解"}:
            continue
        if len(p) <= 480:
            out.append(p)
            continue
        # 按句号粗切
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
    # 去掉「项籍」「黄帝」这类仅作小节的短标题段（正文下一段会重复起笔）
    cleaned: list[str] = []
    for i, p in enumerate(out):
        nxt = out[i + 1] if i + 1 < len(out) else ""
        if 1 <= len(p) <= 6 and nxt.startswith(p):
            continue
        cleaned.append(p)
    return cleaned


def parse_toc(main_wt: str) -> list[dict]:
    entries: list[dict] = []
    for match in TOC_RE.finditer(main_wt):
        vol_code, vol_label, title_raw = match.group(1), match.group(2), match.group(3)
        vol_num = int(vol_code.replace("卷", ""))
        title = clean_inline(title_raw)
        title = title.replace(" ", "").replace("　", "")
        # 五帝本紀第一 / 六國年表第三 -> 去掉末尾序数
        title = re.sub(r"第[一二三四五六七八九十百零〇0-9]+$", "", title).strip()
        kind = KIND_MAP[vol_num]
        entries.append(
            {
                "vol": vol_num,
                "page": f"史記/{vol_code}",
                "volLabel": vol_label,
                "title": title,
                "kind": kind,
            }
        )
    if len(entries) != 130:
        raise SystemExit(f"目录解析异常：期望 130 篇，得到 {len(entries)}")
    return entries


def to_simplified(book: dict) -> dict:
    # prefer app-local opencc, then monorepo root
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


def polish_text(text: str) -> str:
    return text.replace("着", "着")


def polish_book(book: dict) -> dict:
    leftovers: list[str] = []
    for chapter in book["chapters"]:
        for key in ("label", "title", "t1", "t2"):
            chapter[key] = polish_text(chapter[key])
        chapter["paras"] = [polish_text(p) for p in chapter["paras"]]
        for para in chapter["paras"]:
            if "{{" in para or "}}" in para or "<ref" in para.lower():
                leftovers.append(f"第{chapter['n']}篇 {para[:80]}")
            for token in TEMPLATE_LEFTOVER_RE.findall(para):
                leftovers.append(f"第{chapter['n']}篇 模板 {token[:80]}")
    if leftovers:
        print("警告：仍有模板残留 " + str(len(leftovers)), file=sys.stderr)
        for line in leftovers[:20]:
            print("  " + line, file=sys.stderr)
        # 年表等复杂页允许少量残留，硬清一次
        for chapter in book["chapters"]:
            chapter["paras"] = [
                TEMPLATE_LEFTOVER_RE.sub("", p).replace("{{", "").replace("}}", "")
                for p in chapter["paras"]
            ]
            chapter["paras"] = [p for p in chapter["paras"] if p.strip()]
    return book


def merge_prev_meta(chapters: list[dict]) -> None:
    prev_path = ROOT / "data" / "book.json"
    if not prev_path.exists():
        return
    try:
        prev = json.loads(prev_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return
    by_title = {
        c.get("t1") or c.get("title"): c
        for c in prev.get("chapters", [])
        if c.get("t1") or c.get("title")
    }
    for chapter in chapters:
        old = by_title.get(chapter["t1"])
        if not old:
            continue
        for key in ("map", "yearStart", "yearEnd"):
            if key in old and key not in chapter:
                chapter[key] = old[key]


def build_chapters() -> list[dict]:
    cache_dir = ROOT / ".cache" / "wikisource"
    print("fetch 史記 TOC", file=sys.stderr)
    main_wt = cached_wikitext("史記", cache_dir)
    toc = parse_toc(main_wt)
    chapters: list[dict] = []
    for i, entry in enumerate(toc, start=1):
        page = entry["page"]
        print(f"fetch {page} · {entry['title']}", file=sys.stderr)
        cache_file = cache_dir / f"{page.replace('/', '__')}.wikitext"
        if i > 1 and not cache_file.exists():
            time.sleep(0.8)
        raw = cached_wikitext(page, cache_dir)
        paras = paragraphs(raw)
        if not paras:
            raise SystemExit(f"空正文：{page} {entry['title']}")
        kind = entry["kind"]
        kind_label = KIND_LABEL[kind]
        title = entry["title"]
        chapters.append(
            {
                "n": i,
                "label": f"{kind_label} · {title}",
                "title": title,
                "t1": title,
                "t2": kind_label,
                "kind": kind,
                "seq": {
                    "benji": i,
                    "biao": i - 12,
                    "shu": i - 22,
                    "shijia": i - 30,
                    "liezhuan": i - 60,
                }[kind],
                "vol": entry["vol"],
                "paras": paras,
            }
        )
        print(f"  -> {len(paras)} 段 / {sum(len(p) for p in paras)} 字", file=sys.stderr)
    return chapters


def remap_side_data(book: dict) -> None:
    """按篇名回写 characters / topics 的 chapter 编号。"""
    by_title = {c["t1"]: c["n"] for c in book["chapters"]}

    def resolve(title: str) -> int | None:
        if title in by_title:
            return by_title[title]
        # 宽松：去掉「第X」残留
        for k, n in by_title.items():
            if k.startswith(title) or title.startswith(k):
                return n
        return None

    char_path = ROOT / "data" / "characters.json"
    if char_path.exists():
        chars = json.loads(char_path.read_text(encoding="utf-8"))
        # 人物 firstCh：用 bio / 既有映射表
        title_hint = {
            "qinshihuang": "秦始皇本纪",
            "xiangyu": "项羽本纪",
            "liubang": "高祖本纪",
            "kongzi": "孔子世家",
            "chensheng": "陈涉世家",
            "zhangliang": "留侯世家",
            "jingke": "刺客列传",
            "hanxin": "淮阴侯列传",
            "liguang": "李将军列传",
            "simaqian": "太史公自序",
        }
        for person in chars.get("list", []):
            hint = title_hint.get(person["id"])
            n = resolve(hint) if hint else None
            if n:
                person["firstCh"] = n
                person["lastCh"] = n
        char_path.write_text(json.dumps(chars, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"remapped {char_path.name}", file=sys.stderr)

    topics_path = ROOT / "data" / "topics.json"
    if topics_path.exists():
        topics = json.loads(topics_path.read_text(encoding="utf-8"))
        scene_title = {
            "julü": "项羽本纪",
            "hongmen": "项羽本纪",
            "gaixia": "项羽本纪",
            "daze": "陈涉世家",
            "yishui": "刺客列传",
            "jingxing": "淮阴侯列传",
        }
        for scene in topics.get("scenes", []):
            hint = scene_title.get(scene["id"], scene.get("title"))
            # 名篇 title 是事件名，用映射
            n = resolve(scene_title.get(scene["id"], ""))
            if n:
                scene["chapter"] = n
        # corpus stories 已是篇名，无需改 chapter
        topics_path.write_text(json.dumps(topics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"remapped {topics_path.name}", file=sys.stderr)


def main() -> None:
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "book.json"
    ensure_proxy()
    chapters = build_chapters()
    book = {
        "meta": {
            "title": "史记",
            "author": "司马迁",
            "edition": "维基文库百三十卷本（公有领域）",
            "source": SOURCE,
            "exported": date.today().isoformat(),
            "chapterCount": len(chapters),
        },
        "chapters": chapters,
    }
    book = polish_book(to_simplified(book))
    book["meta"]["source"] = SOURCE
    book["meta"]["title"] = "史记"
    book["meta"]["author"] = "司马迁"
    book["meta"]["edition"] = "维基文库百三十卷本（公有领域）"
    book["meta"]["exported"] = date.today().isoformat()
    book["meta"]["chapterCount"] = len(book["chapters"])
    merge_prev_meta(book["chapters"])

    chars = sum(len(p) for chapter in book["chapters"] for p in chapter["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    remap_side_data(book)
    first = book["chapters"][0]
    last = book["chapters"][-1]
    xiang = next((c for c in book["chapters"] if c["t1"] == "项羽本纪"), None)
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"first {first['label']} / {first['paras'][0][:36]}")
    print(f"last  {last['label']} / {last['paras'][-1][-36:]}")
    if xiang:
        print(f"check 项羽本纪 n={xiang['n']} paras={len(xiang['paras'])} head={xiang['paras'][0][:40]}")


if __name__ == "__main__":
    main()
