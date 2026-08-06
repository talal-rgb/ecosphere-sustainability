#!/usr/bin/env python3
"""Render Terrnix shared navigation and footer into standalone static HTML.

The generated pages are committed because GitHub Pages serves files directly and
does not process SSI. Run without arguments to render, or with ``--check`` to
fail when committed pages are stale or structurally invalid.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NAV_SOURCE = ROOT / "components" / "nav.html"
FOOTER_SOURCE = ROOT / "components" / "footer.html"
DESIGN_SYSTEM_LINK = '<link rel="stylesheet" href="/components/design-system.css">'
NAV_START = "<!-- TERRNIX_SHARED_NAV_START -->"
NAV_END = "<!-- TERRNIX_SHARED_NAV_END -->"
FOOTER_START = "<!-- TERRNIX_SHARED_FOOTER_START -->"
FOOTER_END = "<!-- TERRNIX_SHARED_FOOTER_END -->"

EXCLUDED_PARTS = {".git", "backend", "components", "node_modules"}
EXCLUDED_ROOT_FILES = {
    "download-pdf.html",
    "test-encryption-migration.html",
    "test-pdf-report.html",
    "test-security-headers.html",
}

ACTIVE_SECTIONS = (
    ("/carbon-accounting/", "/carbon-accounting/"),
    ("/esg-reporting/", "/esg-reporting/"),
    ("/tools/energy-suite/", "/tools/energy-suite/"),
    ("/sustainability-intelligence/", "/sustainability-intelligence/"),
    ("/quiz/", "/quiz/"),
    ("/training/", "/training/"),
    ("/about/", "/about/"),
    ("/contact/", "/contact/"),
    ("/tools/", "/tools/"),
)


def route_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def discover_public_pages() -> list[Path]:
    pages = []
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        if len(rel.parts) == 1 and rel.name in EXCLUDED_ROOT_FILES:
            continue
        pages.append(path)
    return sorted(pages)


def with_canonical(content: str, canonical: str) -> str:
    content = re.sub(r"\s*<link\b[^>]*\brel=[\"']canonical[\"'][^>]*>", "", content, flags=re.I)
    return content.replace("</head>", f'<link rel="canonical" href="{canonical}">\n</head>', 1)


def alias_content(source: Path, canonical: str) -> str:
    content = source.read_text(encoding="utf-8")
    return with_canonical(content, canonical)


def ensure_legal_aliases(write: bool) -> dict[Path, str]:
    aliases = {
        ROOT / "privacy" / "index.html": alias_content(ROOT / "privacy-policy.html", "https://terrnix.com/privacy/"),
        ROOT / "terms" / "index.html": alias_content(ROOT / "terms-of-use.html", "https://terrnix.com/terms/"),
    }
    if write:
        for path, content in aliases.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    return aliases


def mark_active_navigation(nav: str, route: str) -> str:
    active_href = None
    if route == "/":
        active_href = "/"
    else:
        for prefix, href in ACTIVE_SECTIONS:
            if route.startswith(prefix):
                active_href = href
                break
    if not active_href:
        return nav

    pattern = rf'(<a\b(?=[^>]*\bclass="[^"]*(?:nav-link|mobile-nav-link))(?=[^>]*\bhref="{re.escape(active_href)}")[^>]*)(>)'

    def add_current(match: re.Match[str]) -> str:
        opening = match.group(1)
        if "aria-current=" not in opening:
            opening += ' aria-current="page"'
        return opening + match.group(2)

    return re.sub(pattern, add_current, nav)


def strip_generated_regions(content: str) -> str:
    content = re.sub(
        rf"\s*{re.escape(NAV_START)}.*?{re.escape(NAV_END)}\s*",
        "\n",
        content,
        flags=re.S,
    )
    content = re.sub(
        rf"\s*{re.escape(FOOTER_START)}.*?{re.escape(FOOTER_END)}\s*",
        "\n",
        content,
        flags=re.S,
    )
    return content


def strip_runtime_includes(content: str) -> str:
    return re.sub(r"\s*<!--\s*#include\b.*?-->\s*", "\n", content, flags=re.I | re.S)


def strip_existing_shell(content: str, strip_primary_nav: bool) -> str:
    content = re.sub(r"\s*<a\b[^>]*class=[\"'][^\"']*\bskip-link\b[^\"']*[\"'][^>]*>.*?</a>\s*", "\n", content, flags=re.I | re.S)
    if strip_primary_nav:
        content = re.sub(r"\s*<nav\b[^>]*>.*?</nav>\s*", "\n", content, count=1, flags=re.I | re.S)
    content = re.sub(r"\s*<footer\b[^>]*>.*?</footer>\s*", "\n", content, flags=re.I | re.S)
    return content


def ensure_head_assets(content: str) -> str:
    if "/components/design-system.css" not in content:
        content = content.replace("</head>", DESIGN_SYSTEM_LINK + "\n</head>", 1)
    if not re.search(r"<link\b[^>]*\brel=[\"'][^\"']*icon", content, flags=re.I):
        content = content.replace("</head>", '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">\n</head>', 1)
    return content


def ensure_main_target(content: str) -> str:
    if re.search(r"\bid=[\"']main-content[\"']", content, flags=re.I):
        return content
    for tag in ("main", "section", "div"):
        pattern = rf"<{tag}\b([^>]*)>"
        match = re.search(pattern, content, flags=re.I)
        if not match:
            continue
        attributes = match.group(1)
        if re.search(r"\bid=[\"'][^\"']*[\"']", attributes, flags=re.I):
            attributes = re.sub(r"\bid=[\"'][^\"']*[\"']", 'id="main-content"', attributes, count=1, flags=re.I)
            replacement = f"<{tag}{attributes}>"
        else:
            replacement = f'<{tag} id="main-content"{attributes}>'
        return content[: match.start()] + replacement + content[match.end() :]
    raise ValueError("no <main>, <section>, or <div> available for skip-link target")


def render_page(path: Path, source_content: str | None = None) -> str:
    content = source_content if source_content is not None else path.read_text(encoding="utf-8")
    if "<body" not in content.lower() or "</body>" not in content.lower():
        raise ValueError("missing body element")

    had_generated_nav = NAV_START in content
    content = strip_generated_regions(content)
    content = strip_runtime_includes(content)
    content = strip_existing_shell(content, strip_primary_nav=not had_generated_nav)
    content = ensure_head_assets(content)
    content = ensure_main_target(content)

    route = route_for(path)
    nav = mark_active_navigation(NAV_SOURCE.read_text(encoding="utf-8").strip(), route)
    footer = FOOTER_SOURCE.read_text(encoding="utf-8").strip()
    nav_region = f"\n{NAV_START}\n{nav}\n{NAV_END}\n"
    footer_region = f"\n{FOOTER_START}\n{footer}\n{FOOTER_END}\n"

    content = re.sub(r"(<body\b[^>]*>)", lambda m: m.group(1) + nav_region, content, count=1, flags=re.I)
    body_close = content.lower().rfind("</body>")
    if body_close < 0:
        raise ValueError("missing closing body element")
    content = content[:body_close] + footer_region + content[body_close:]
    return content


def validate_rendered(path: Path, content: str) -> list[str]:
    errors = []
    label = path.relative_to(ROOT).as_posix()
    head_match = re.search(r"<head\b[^>]*>(.*?)</head>", content, flags=re.I | re.S)
    head = head_match.group(1) if head_match else ""
    checks = {
        "unresolved SSI directive": len(re.findall(r"<!--\s*#include\b", content, flags=re.I)) == 0,
        "shared navigation instance": content.count(NAV_START) == 1 and content.count('class="nav-main"') == 1,
        "shared footer instance": content.count(FOOTER_START) == 1 and content.count('class="footer-main"') == 1,
        "home-linked logo": 'class="nav-brand" href="/"' in content,
        "skip-link target": 'id="main-content"' in content,
        "favicon": bool(re.search(r"<link\b[^>]*\brel=[\"'][^\"']*icon", content, flags=re.I)),
        "page title": len(re.findall(r"<title\b", head, flags=re.I)) == 1,
    }
    for check, passed in checks.items():
        if not passed:
            errors.append(f"{label}: failed {check}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify committed output without writing")
    args = parser.parse_args()

    alias_sources = ensure_legal_aliases(write=not args.check)
    pages = discover_public_pages()
    if args.check:
        for alias in alias_sources:
            if alias not in pages:
                pages.append(alias)
        pages.sort()

    changed = []
    errors = []
    for path in pages:
        try:
            source = alias_sources.get(path) if args.check else None
            rendered = render_page(path, source)
            errors.extend(validate_rendered(path, rendered))
            current = path.read_text(encoding="utf-8") if path.exists() else ""
            if current != rendered:
                changed.append(path.relative_to(ROOT).as_posix())
                if not args.check:
                    path.write_text(rendered, encoding="utf-8")
        except (OSError, ValueError) as error:
            errors.append(f"{path.relative_to(ROOT).as_posix()}: {error}")

    if args.check and changed:
        errors.extend(f"{path}: generated shared components are stale" for path in changed)

    mode = "checked" if args.check else "rendered"
    print(f"Static shared components {mode}: {len(pages)} public pages")
    print(f"Files updated: {0 if args.check else len(changed)}")
    if changed and not args.check:
        for path in changed:
            print(f"  updated {path}")
    if errors:
        print(f"Validation errors: {len(errors)}", file=sys.stderr)
        for error in errors:
            print(f"  ERROR {error}", file=sys.stderr)
        return 1
    print("Validation errors: 0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
