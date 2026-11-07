#!/usr/bin/env python3
"""把维基文库《水滸傳（120回本）》HTMLZ 导出整理成 data/book.json。

来源是明末袁无涯刊《忠义水浒全传》，公有领域：
https://zh.wikisource.org/wiki/水滸傳_(120回本)

zh.wikisource.org 不可直连时，用官方导出服务：
https://ws-export.wmcloud.org/?lang=zh&format=htmlz&page=水滸傳_(120回本)

序、小引、发凡是刊刻者的文字，不收入正文。引首收在第 0 回。

用法：
  python3 scripts/build-book.py /path/to/index.html data/book.json
"""

from __future__ import annotations

import html as html_lib
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

CN = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
TITLE_RE = re.compile(r'<td class="calibre30">([^<]+)</td>')
VARIANT_RE = re.compile(
    r'<span typeof="mw:LanguageVariant" data-mw-variant="([^"]*)"[^>]*>.*?</span>',
    re.S,
)
ROOT = Path(__file__).resolve().parents[1]


def cn_to_int(s: str) -> int:
    if s == "十":
        return 10
    if s.startswith("十"):
        return 10 + CN[s[1:]]
    if "百" in s:
        left, right = s.split("百", 1)
        base = (CN[left] if left else 1) * 100
        if right == "":
            return base
        if right.startswith("零"):
            return base + CN[right[1:]]
        if "十" in right:
            a, b = right.split("十", 1)
            return base + (CN[a] if a else 1) * 10 + (CN[b] if b else 0)
        return base + CN[right]
    if "十" in s:
        a, b = s.split("十", 1)
        return (CN[a] if a else 1) * 10 + (CN[b] if b else 0)
    return CN[s]


def to_cn(n: int) -> str:
    d = "零一二三四五六七八九"
    if n <= 10:
        return "十" if n == 10 else d[n]
    if n < 20:
        return "十" + d[n % 10]
    if n < 100:
        return d[n // 10] + "十" + (d[n % 10] if n % 10 else "")
    if n == 100:
        return "一百"
    if n < 110:
        return "一百零" + d[n % 10]
    if n == 110:
        return "一百一十"
    if n < 120:
        return "一百一十" + d[n % 10]
    return "一百二十"


def expand_variants(raw: str) -> str:
    def repl(match: re.Match[str]) -> str:
        payload = html_lib.unescape(match.group(1))
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            return ""
        if isinstance(data.get("disabled"), dict) and data["disabled"].get("t"):
            return data["disabled"]["t"]
        for item in data.get("twoway") or []:
            if item.get("l") == "zh-hant" and item.get("t"):
                return item["t"]
        return ""

    return VARIANT_RE.sub(repl, raw)


class ChapterText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.block = 0
        self.bufs: list[list[str]] = []
        self.paras: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        tag = tag.lower()
        classes = " ".join(v or "" for k, v in attrs if k == "class")
        if self.block:
            self.block += 1
            return
        if tag == "table" or "license" in classes:
            self.block = 1
            return
        if tag in ("p", "dd"):
            self.bufs.append([])
        elif tag == "br" and self.bufs:
            self.bufs[-1].append("\n")

    def handle_endtag(self, tag: str) -> None:
        if self.block:
            self.block -= 1
            return
        if tag.lower() in ("p", "dd") and self.bufs:
            raw = "".join(self.bufs.pop())
            text = re.sub(r"[\s\u3000]+", "", raw)
            if text:
                self.paras.append(text)

    def handle_data(self, data: str) -> None:
        if self.block or not self.bufs:
            return
        self.bufs[-1].append(data)


def paragraphs(fragment: str) -> list[str]:
    parser = ChapterText()
    parser.feed(fragment)
    parser.close()
    cleaned = []
    for para in parser.paras:
        if any(token in para for token in ("姊妹计划", "Wikisource", "Creative Commons", "公有领域", "此明朝作品")):
            continue
        cleaned.append(para)
    return cleaned


def parse_book(raw: str) -> dict:
    raw = raw.split("About this digital edition", 1)[0]
    raw = expand_variants(raw)
    intro_start = raw.find('id="calibre_link-3"')
    intro_end = raw.find('id="calibre_link-4"')
    if intro_start < 0 or intro_end < intro_start:
        raise SystemExit("没有找到引首")
    intro = paragraphs(raw[intro_start:intro_end])
    if not intro or "話說這八句詩" not in "".join(intro) and "话说这八句诗" not in "".join(intro):
        if not any("八句詩" in p or "八句诗" in p for p in intro):
            raise SystemExit("引首正文不像这一篇")

    titles = list(TITLE_RE.finditer(raw))
    if len(titles) != 120:
        raise SystemExit(f"回目标记数量是 {len(titles)}，不是 120")

    chapters = [
        {
            "n": 0,
            "label": "引首",
            "title": "试看书林隐处　再听取新声曲度",
            "t1": "试看书林隐处",
            "t2": "再听取新声曲度",
            "paras": intro,
        }
    ]
    for i, match in enumerate(titles):
        parts = [p for p in re.split(r"[\s\u3000]+", match.group(1).strip()) if p]
        if len(parts) != 3 or not parts[0].startswith("第") or not parts[0].endswith("回"):
            raise SystemExit(f"回目无法拆开：{match.group(1)}")
        n = cn_to_int(parts[0][1:-1])
        end = titles[i + 1].start() if i + 1 < len(titles) else len(raw)
        paras = paragraphs(raw[match.end() : end])
        if len(paras) < 5:
            raise SystemExit(f"第 {n} 回正文过短：{len(paras)} 段")
        t1, t2 = parts[1], parts[2]
        chapters.append(
            {
                "n": n,
                "label": f"第{to_cn(n)}回",
                "title": f"{t1}　{t2}",
                "t1": t1,
                "t2": t2,
                "paras": paras,
            }
        )

    numbered = [c for c in chapters if c["n"] > 0]
    numbered.sort(key=lambda c: c["n"])
    if [c["n"] for c in numbered] != list(range(1, 121)):
        raise SystemExit("回目不是一百二十回连续")
    chapters = [chapters[0], *numbered]

    return {
        "meta": {
            "title": "水浒传",
            "author": "施耐庵、罗贯中",
            "edition": "明末袁无涯刊一百二十回《忠义水浒全传》（维基文库）。引首收入，序、小引、发凡未收入。",
            "source": "https://zh.wikisource.org/wiki/水滸傳_(120回本)",
            "exported": "2026-11-06",
            "chapterCount": 120,
        },
        "chapters": chapters,
    }


def to_simplified(book: dict) -> dict:
    raw = json.dumps(book, ensure_ascii=False)
    script = r"""
const OpenCC = require('opencc-js');
const conv = OpenCC.Converter({ from: 't', to: 'cn' });
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { data += c; });
process.stdin.on('end', () => {
  const walk = (v) => {
    if (typeof v === 'string') return conv(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = walk(v[k]);
      return o;
    }
    return v;
  };
  process.stdout.write(JSON.stringify(walk(JSON.parse(data))));
});
"""
    proc = subprocess.run(
        ["node", "-e", script],
        input=raw.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
        cwd=ROOT,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.decode("utf-8", "replace"))
    return json.loads(proc.stdout.decode("utf-8"))


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("用法：python3 scripts/build-book.py index.html data/book.json")
    html_path, out_path = map(Path, sys.argv[1:])
    book = parse_book(html_path.read_text(encoding="utf-8"))
    book = to_simplified(book)
    book["meta"]["source"] = "https://zh.wikisource.org/wiki/水滸傳_(120回本)"
    chars = sum(len(p) for c in book["chapters"] for p in c["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    intro = book["chapters"][0]
    first = book["chapters"][1]
    last = book["chapters"][-1]
    print(f"chapters={len(book['chapters']) - 1} plus intro chars={chars}")
    print(f"intro {intro['paras'][0][:36]}")
    print(f"ch1 {first['title']}")
    print(f"open {first['paras'][0][:36]}")
    print(f"ch120 {last['title']}")
    print(f"close {last['paras'][-1][-36:]}")
    blob = json.dumps(book, ensure_ascii=False)
    if "鲁智深" not in blob or "宋江" not in blob:
        raise SystemExit("简体转换后找不到鲁智深或宋江")
    if "魯智深" in blob or "宋江" in blob and "說" in first["paras"][0]:
        raise SystemExit("简体转换后正文仍是繁体")
    if "种经略" not in blob:
        raise SystemExit("缺字模板没有补回「种经略」")


if __name__ == "__main__":
    main()
