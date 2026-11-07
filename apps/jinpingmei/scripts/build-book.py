#!/usr/bin/env python3
"""把维基文库崇祯本《金瓶梅》整理成 data/book.json。

正文页在 2026-10-02 的 zhwikisource multistream 转储里，标题是「金瓶梅/第01回」到「第100回」。
当前维基文库已把这些页面改名为「金瓶梅 (崇禎本)/第NN回」，页号未变。

zh.wikisource.org 在本机不可直连。脚本读取已经按偏移截下的 XML 流：

  python3 scripts/build-book.py /tmp/jpm-src/streams data/book.json

来源：https://zh.wikisource.org/wiki/金瓶梅_(崇祯本)
转储：https://dumps.wikimedia.org/zhwikisource/latest/zhwikisource-latest-pages-articles-multistream.xml.bz2
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from html import unescape
from pathlib import Path

TITLE_RE = re.compile(r"^金瓶梅/第(\d+)回$")
PAGE_RE = re.compile(r"<page>(.*?)</page>", re.S)
TEXT_RE = re.compile(r"<text[^>]*>(.*?)</text>", re.S)
SECTION_RE = re.compile(r"\|section=([^\n|]+)")
HEADER_RE = re.compile(r"\{\{[Hh]eader\b[\s\S]*?\n\}\}")
FOOTER_RE = re.compile(r"\{\{[Ff]ooter\b[\s\S]*?\}\}")
VARIANT_RE = re.compile(r"\{\{(?:别|別|另)\|([^|}]+)\|[^}]+\}\}")
RARE_RE = re.compile(r"\{\{!\s*\|([^|}]+)(?:\|[^}]*)?\}\}")
YEAR_RE = re.compile(r"\{\{YL\|([^}]+)\}\}")
FILE_RE = re.compile(r"\[\[File:[^\]]+\]\]")
LINK_LABELED_RE = re.compile(r"\[\[(?:[^|\]]+)\|([^\]]+)\]\]")
LINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
TAG_RE = re.compile(r"<[^>]+>")
REF_RE = re.compile(r"<ref\b[\s\S]*?</ref>")
CONV_RE = re.compile(r"-{([^{}]*)}-")
CHAPTER_PREFIX_RE = re.compile(r"^第[一二三四五六七八九十百零0-9]+回[\s　]*")


def replace_file(match: re.Match[str]) -> str:
    body = match.group(0)
    if "堂" in body:
        return "堂"
    return ""


def clean_wikitext(text: str) -> str:
    text = unescape(text)
    text = re.sub(r"\[\[Category:[^\]]+\]\]", "", text)
    text = FILE_RE.sub(replace_file, text)
    text = HEADER_RE.sub("", text)
    text = FOOTER_RE.sub("", text)
    text = text.replace("{{明朝作品}}", "")
    text = REF_RE.sub("", text)
    text = VARIANT_RE.sub(r"\1", text)
    text = RARE_RE.sub(r"\1", text)
    text = YEAR_RE.sub(r"\1", text)
    text = LINK_LABELED_RE.sub(r"\1", text)
    text = LINK_RE.sub(lambda m: m.group(1).split("/")[-1], text)
    text = text.replace("'''", "").replace("''", "")
    text = TAG_RE.sub("", text)
    text = CONV_RE.sub(r"\1", text)
    text = text.replace("[[Category:金瓶梅]]", "")
    return text


def paragraphs(text: str) -> list[str]:
    blocks = re.split(r"\n\s*\n", text)
    paras: list[str] = []
    for block in blocks:
        lines = [re.sub(r"[\s　]+", "", line) for line in block.splitlines()]
        lines = [line for line in lines if line and not line.startswith("|") and not line.startswith("{{") and not line.startswith("Category:")]
        if len(lines) > 1 and all(len(line) <= 40 for line in lines):
            paras.extend(lines)
        elif lines:
            paras.append("".join(lines))
    return paras


def couplet(section: str) -> tuple[str, str]:
    body = CHAPTER_PREFIX_RE.sub("", section.strip())
    parts = [p for p in re.split(r"[\s　]+", body) if p]
    if len(parts) != 2:
        raise SystemExit(f"回目无法拆成两句：{section}")
    return parts[0], parts[1]


def to_cn(n: int) -> str:
    digits = "零一二三四五六七八九"
    if n <= 10:
        return "十" if n == 10 else digits[n]
    if n < 20:
        return "十" + digits[n % 10]
    if n < 100:
        tens, ones = divmod(n, 10)
        return digits[tens] + "十" + (digits[ones] if ones else "")
    return "一百"


def parse_streams(directory: Path) -> dict[int, dict]:
    found: dict[int, dict] = {}
    leftovers: set[str] = set()
    for path in sorted(directory.glob("*.xml")):
        xml = path.read_text(encoding="utf-8")
        for page in PAGE_RE.findall(xml):
            title_m = re.search(r"<title>(.*?)</title>", page)
            text_m = TEXT_RE.search(page)
            if not title_m or not text_m:
                continue
            title = unescape(title_m.group(1)).strip()
            number_m = TITLE_RE.match(title)
            if not number_m:
                continue
            n = int(number_m.group(1))
            raw = unescape(text_m.group(1))
            if raw.startswith("#REDIRECT") or raw.startswith("#重定向"):
                continue
            section_m = SECTION_RE.search(raw)
            if not section_m:
                raise SystemExit(f"第 {n} 回没有 section 回目")
            t1, t2 = couplet(section_m.group(1))
            body = clean_wikitext(raw)
            for token in re.findall(r"\{\{[^}]+\}\}", body):
                leftovers.add(token[:80])
            paras = paragraphs(body)
            if len(paras) < 3:
                raise SystemExit(f"第 {n} 回正文过短：{len(paras)} 段")
            found[n] = {
                "n": n,
                "label": f"第{to_cn(n)}回",
                "title": f"{t1}　{t2}",
                "t1": t1,
                "t2": t2,
                "paras": paras,
            }
    if leftovers:
        raise SystemExit("仍有未处理的模板：\n" + "\n".join(sorted(leftovers)))
    if set(found) != set(range(1, 101)):
        missing = [n for n in range(1, 101) if n not in found]
        raise SystemExit(f"回目不完整，缺：{missing}")
    return found


# 维基文库用 ［部件］ 占位的缺字。换成崇祯本里这个词的通行字，方便简体阅读。
RARE_READINGS = {
    "［禾囗也］": "稀",
    "［足罗］": "䟾",
    "［兀王］": "尪",
    "［纟路］": "潞",
    "［疒罗］": "㾏",
    "［扌历］": "捩",
    "［钅刘］": "镏",
    "［角京］": "犄",
    "［彳胤］": "胤",
    "［虫麻］": "蟍",
    "［毛戊］": "屌",
    "［足鹿］": "蹗",
    "［火夸］": "胯",
    "［土幻］": "趖",
    "［毛皮］": "屁",
    "［纟堂］": "堂",
}


def polish_text(text: str) -> str:
    text = text.replace("16px|［纟堂］|class=skin-invert", "堂")
    for src, dst in RARE_READINGS.items():
        text = text.replace(src, dst)
    text = text.replace("］", "")
    if text.startswith("["):
        text = text[1:]
    if text.endswith("]"):
        text = text[:-1]
    text = text.replace("著", "着").replace("显着", "显著")
    return text


def polish_book(book: dict) -> dict:
    leftovers: list[str] = []
    for chapter in book["chapters"]:
        for key in ("label", "title", "t1", "t2"):
            chapter[key] = polish_text(chapter[key])
        chapter["paras"] = [polish_text(p) for p in chapter["paras"]]
        for para in chapter["paras"]:
            if "［" in para or "］" in para or "16px" in para or "class=" in para:
                leftovers.append(f"第{chapter['n']}回 {para[:48]}")
            if "著" in para.replace("显著", ""):
                leftovers.append(f"第{chapter['n']}回仍有著 {para[:48]}")
    if leftovers:
        raise SystemExit("正文未整理干净：\n" + "\n".join(leftovers[:30]))
    return book


def to_simplified(book: dict) -> dict:
    root = Path(__file__).resolve().parents[1]
    opencc = root / "node_modules" / "opencc-js"
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


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("用法：python3 scripts/build-book.py streams目录 data/book.json")
    streams, out_path = Path(sys.argv[1]), Path(sys.argv[2])
    chapters = [parse_streams(streams)[n] for n in range(1, 101)]
    book = {
        "meta": {
            "title": "金瓶梅",
            "author": "兰陵笑笑生",
            "edition": "新刻绣像批评金瓶梅（崇祯本，维基文库）",
            "source": "https://zh.wikisource.org/wiki/金瓶梅_(崇祯本)",
            "exported": "2026-11-06",
            "chapterCount": 100,
        },
        "chapters": chapters,
    }
    book = polish_book(to_simplified(book))
    book["meta"]["source"] = "https://zh.wikisource.org/wiki/金瓶梅_(崇祯本)"
    chars = sum(len(p) for chapter in book["chapters"] for p in chapter["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first = book["chapters"][0]
    last = book["chapters"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"ch1 {first['title']}")
    print(f"open {first['paras'][0][:40]}")
    print(f"ch100 {last['title']}")
    print(f"close {last['paras'][-1][-40:]}")


if __name__ == "__main__":
    main()
