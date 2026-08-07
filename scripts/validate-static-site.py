#!/usr/bin/env python3
"""Validate the committed Terrnix static site without external dependencies."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {".git", "backend", "components", "node_modules"}
EXCLUDED_ROOT = {
    "download-pdf.html",
    "test-encryption-migration.html",
    "test-pdf-report.html",
    "test-security-headers.html",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.ids: set[str] = set()
        self.nav_count = 0
        self.footer_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if attributes.get("id"):
            self.ids.add(attributes["id"] or "")
        classes = (attributes.get("class") or "").split()
        if tag == "a" and attributes.get("href"):
            self.links.append(attributes["href"] or "")
        if tag == "nav" and "nav-main" in classes:
            self.nav_count += 1
        if tag == "footer" and "footer-main" in classes:
            self.footer_count += 1


def public_pages() -> list[Path]:
    pages = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        if len(rel.parts) == 1 and rel.name in EXCLUDED_ROOT:
            continue
        pages.append(path)
    return sorted(pages)


def resolve_link(page: Path, link_path: str) -> Path | None:
    if not link_path:
        return page
    target = ROOT / link_path.lstrip("/") if link_path.startswith("/") else page.parent / link_path
    candidates = [target]
    if link_path.endswith("/"):
        candidates = [target / "index.html"]
    elif not target.suffix:
        candidates = [target, target / "index.html", target.with_suffix(".html")]
    return next((candidate.resolve() for candidate in candidates if candidate.exists()), None)


def main() -> int:
    pages = public_pages()
    parsed: dict[Path, PageParser] = {}
    errors: list[str] = []
    link_count = 0

    for page in pages:
        content = page.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(content)
        parsed[page.resolve()] = parser
        label = page.relative_to(ROOT).as_posix()

        if parser.nav_count != 1:
            errors.append(f"{label}: expected one shared navigation, found {parser.nav_count}")
        if parser.footer_count != 1:
            errors.append(f"{label}: expected one shared footer, found {parser.footer_count}")
        if re.search(r"<!--\s*#include\b", content, flags=re.I):
            errors.append(f"{label}: unresolved SSI directive")
        if "cdn.tailwindcss.com" in content:
            errors.append(f"{label}: Tailwind runtime CDN is not allowed")
        if "fonts.googleapis.com" in content or "fonts.gstatic.com" in content:
            errors.append(f"{label}: remote Google Fonts are not allowed")
        head = re.search(r"<head\b[^>]*>(.*?)</head>", content, flags=re.I | re.S)
        head_content = head.group(1) if head else ""
        if len(re.findall(r"<title\b", head_content, flags=re.I)) != 1:
            errors.append(f"{label}: expected one document title")
        if not re.search(r"<link\b[^>]*\brel=[\"'][^\"']*icon", head_content, flags=re.I):
            errors.append(f"{label}: favicon missing")
        compiled_tailwind = re.findall(
            r'href=["\']/assets/css/tailwind(?:-home|-platform)?\.css["\']',
            head_content,
            flags=re.I,
        )
        if len(compiled_tailwind) != 1:
            errors.append(f"{label}: expected one compiled Tailwind stylesheet")
        if len(re.findall(r'href=["\']/components/design-system\.min\.css["\']', head_content, flags=re.I)) != 1:
            errors.append(f"{label}: expected one minified design-system stylesheet")
        if 'class="nav-brand" href="/"' not in content:
            errors.append(f"{label}: home-linked Terrnix logo missing")
        if "main-content" not in parser.ids:
            errors.append(f"{label}: skip-link target missing")

    for page in pages:
        parser = parsed[page.resolve()]
        for href in parser.links:
            link_count += 1
            url = urlsplit(href)
            if url.scheme or url.netloc or href.startswith(("mailto:", "tel:", "javascript:")):
                continue
            target = resolve_link(page, unquote(url.path))
            if target is None:
                errors.append(f"{page.relative_to(ROOT)}: broken link {href}")
                continue
            if url.fragment and target in parsed and unquote(url.fragment) not in parsed[target].ids:
                errors.append(f"{page.relative_to(ROOT)}: missing fragment target {href}")

    unique_errors = sorted(set(errors))
    print(f"Public pages checked: {len(pages)}")
    print(f"Internal links checked: {link_count}")
    print(f"Validation errors: {len(unique_errors)}")
    for error in unique_errors:
        print(f"  ERROR {error}")
    return 1 if unique_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
