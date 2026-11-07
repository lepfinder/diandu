#!/usr/bin/env python3
"""把维基文库《三国演义》HTMLZ 导出整理成 data/book.json。

来源是毛纶、毛宗岗评本，公有领域：
https://zh.wikisource.org/wiki/三國演義

zh.wikisource.org 在当前网络不可直连时，用官方导出服务：
https://ws-export.wmcloud.org/?lang=zh&format=htmlz&page=三國演義

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
HEADER_RE = re.compile(r"第([一二三四五六七八九十百零]+)回\s*<b[^>]*>([^<]+)</b>")
TOC_RE = re.compile(
    r'title="三國演義/第(\d+)回">第[^<]+</a>(?:[\s\u3000])*([^<]+)</li>'
)


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


def split_couplet(title: str) -> tuple[str, str]:
    parts = [p for p in re.split(r"[\s\u3000]+", title.strip()) if p]
    if len(parts) != 2:
        raise SystemExit(f"回目无法拆成两句：{title}")
    return parts[0], parts[1]


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
    # 维基文库缺字模板在导出里变成「|」，第一百二十回太子之名是「䨎」。
    html = re.sub(r'<span[^>]*typeof="mw:Transclusion"[^>]*>\|</span>', "䨎", html)
    toc: dict[int, tuple[str, str]] = {}
    for num, title in TOC_RE.findall(html):
        toc[int(num)] = split_couplet(title)
    if set(toc) != set(range(1, 121)):
        missing = [n for n in range(1, 121) if n not in toc]
        raise SystemExit(f"目录不完整，缺回：{missing}")

    headers = list(HEADER_RE.finditer(html))
    if len(headers) != 120:
        raise SystemExit(f"正文回目标记数量是 {len(headers)}，不是 120")

    chapters = []
    for i, match in enumerate(headers):
        n = cn_to_int(match.group(1))
        end = headers[i + 1].start() if i + 1 < len(headers) else len(html)
        parser = ChapterText()
        parser.feed(html[match.start() : end])
        parser.close()
        if len(parser.paras) < 3:
            raise SystemExit(f"第 {n} 回正文过短：{len(parser.paras)} 段")
        t1, t2 = toc[n]
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
    if [c["n"] for c in chapters] != list(range(1, 121)):
        raise SystemExit("回目序号不连续")

    return {
        "meta": {
            "title": "三國演義",
            "author": "羅貫中",
            "edition": "毛綸、毛宗崗評本（維基文庫）",
            "source": "https://zh.wikisource.org/wiki/三國演義",
            "exported": "2026-11-06",
            "chapterCount": 120,
        },
        "chapters": chapters,
    }


def to_simplified(book: dict, opencc_js: Path) -> dict:
    raw = json.dumps(book, ensure_ascii=False)
    script = r"""
const OpenCC = require(process.argv[1]);
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
        ["node", "-e", script, str(opencc_js)],
        input=raw.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.decode("utf-8", "replace"))
    return json.loads(proc.stdout.decode("utf-8"))


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("用法：python3 scripts/build-book.py index.html t2cn.js data/book.json")
    html_path, opencc_js, out_path = map(Path, sys.argv[1:])
    book = parse_book(html_path.read_text(encoding="utf-8"))
    book = to_simplified(book, opencc_js)
    book["meta"]["source"] = "https://zh.wikisource.org/wiki/三國演義"
    chars = sum(len(p) for c in book["chapters"] for p in c["paras"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    first = book["chapters"][0]["paras"][0]
    last = book["chapters"][-1]["paras"][-1]
    print(f"chapters={len(book['chapters'])} chars={chars}")
    print(f"ch1 {book['chapters'][0]['title']}")
    print(f"open {first[:40]}")
    print(f"ch120 {book['chapters'][-1]['title']}")
    print(f"close {last[-40:]}")


if __name__ == "__main__":
    main()
