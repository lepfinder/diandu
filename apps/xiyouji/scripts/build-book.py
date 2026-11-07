#!/usr/bin/env python3
"""把维基文库《西遊記》HTMLZ 导出整理成 data/book.json。

来源是通行一百回本，公有领域：
https://zh.wikisource.org/wiki/西遊記

zh.wikisource.org 不可直连时，用官方导出服务：
https://ws-export.wmcloud.org/?lang=zh&format=htmlz&page=西遊記

书末「附录」是第九回陈光蕊故事的重复，不收入正文。
第九回正文里已经包含清康熙汪象旭、黄周星补入的这一篇。

用法：
  python3 scripts/build-book.py /path/to/index.html data/book.json
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

CN = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}
HEADER_RE = re.compile(
    r'<td class="calibre12"><b class="calibre13">西遊記</b><br class="calibre3" />(.*?)</td>',
    re.S,
)
CHAPTER_LINE = re.compile(r"^第([一二三四五六七八九十百零]+)回$")
TOOLTIP_RE = re.compile(r'<span class="[^"]*variant-tooltip[^"]*">.*?</span>', re.S)
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
    raise SystemExit(f"回数超出一百：{n}")


def split_couplet(title: str) -> tuple[str, str]:
    parts = [p for p in re.split(r"[\s\u3000]+", title.strip()) if p]
    if len(parts) != 2:
        raise SystemExit(f"回目无法拆成两句：{title}")
    return parts[0], parts[1]


def header_lines(fragment: str) -> list[str]:
    text = re.sub(r"<br[^>]*>", "\n", fragment)
    text = re.sub(r"<[^>]+>", "", text)
    lines = []
    for line in text.split("\n"):
        line = re.sub(r"[\s\u3000]+", " ", line).strip()
        if line and not line.startswith("作者"):
            lines.append(line)
    return lines


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


def parse_book(html: str) -> dict:
    html = html.split("About this digital edition", 1)[0]
    html = TOOLTIP_RE.sub("", html)
    headers = []
    for match in HEADER_RE.finditer(html):
        lines = header_lines(match.group(1))
        headers.append((match, lines))
    if not headers:
        raise SystemExit("没有找到回目标记")

    chapters = []
    for i, (match, lines) in enumerate(headers):
        if not lines or not CHAPTER_LINE.match(lines[0]):
            continue
        n = cn_to_int(CHAPTER_LINE.match(lines[0]).group(1))
        if len(lines) == 2:
            t1, t2 = split_couplet(lines[1])
        elif len(lines) == 3:
            t1, t2 = lines[1], lines[2]
        else:
            raise SystemExit(f"第 {n} 回标题行数异常：{lines}")
        end = headers[i + 1][0].start() if i + 1 < len(headers) else len(html)
        parser = ChapterText()
        parser.feed(html[match.end() : end])
        parser.close()
        if len(parser.paras) < 3:
            raise SystemExit(f"第 {n} 回正文过短：{len(parser.paras)} 段")
        for para in parser.paras:
            if "姊妹计划" in para or "Wikisource" in para or "Creative Commons" in para:
                raise SystemExit(f"第 {n} 回混入了导出页说明")
        chapters.append(
            {
                "n": n,
                "label": f"第{to_cn(n)}回",
                "title": f"{t1}　{t2}",
                "t1": t1,
                "t2": t2,
                "paras": parser.paras,
            }
        )

    chapters.sort(key=lambda c: c["n"])
    if [c["n"] for c in chapters] != list(range(1, 101)):
        found = [c["n"] for c in chapters]
        raise SystemExit(f"回目不是一百回连续：{found}")

    return {
        "meta": {
            "title": "西遊記",
            "author": "吳承恩",
            "edition": "維基文庫通行一百回本。第九回含汪象旭、黃周星補入的陳光蕊故事，書末重複附錄未收入。",
            "source": "https://zh.wikisource.org/wiki/西遊記",
            "exported": "2026-11-06",
            "chapterCount": 100,
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
    book["meta"]["source"] = "https://zh.wikisource.org/wiki/西遊記"
    chars = sum(len(p) for c in book["chapters"] for p in c["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first = book["chapters"][0]
    last = book["chapters"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"ch1 {first['title']}")
    print(f"open {first['paras'][0][:40]}")
    print(f"ch100 {last['title']}")
    print(f"close {last['paras'][-1][-40:]}")
    if "孙悟空" not in json.dumps(book, ensure_ascii=False):
        raise SystemExit("简体转换后找不到「孙悟空」")
    if "孫悟空" in json.dumps(book, ensure_ascii=False):
        raise SystemExit("简体转换后仍有「孫悟空」")


if __name__ == "__main__":
    main()
