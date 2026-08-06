#!/usr/bin/env python3
"""
Terrnix Page Standardization Script

This script standardizes all public HTML pages by:
1. Replacing navigation with shared nav component
2. Replacing footer with shared footer component
3. Adding missing SEO (OG, Twitter, schema)
4. Fixing technical issues (headings, IDs, alt text)
5. Adding internal links

Usage: python standardize-pages.py
"""

import re
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# SEO data for each page
PAGE_SEO = {
    'index.html': {
        'title': 'Terrnix — AI Sustainability Intelligence Platform',
        'description': 'Professional sustainability platform combining AI-driven analytics with deep expertise in carbon accounting, ESG frameworks, climate regulations, and energy economics.',
        'canonical': 'https://terrnix.com/',
        'og_title': 'Terrnix — AI Sustainability Intelligence Platform',
        'og_desc': 'Professional sustainability platform for carbon accounting, ESG, and climate intelligence.',
        'schema_type': 'WebPage',
    },
    'carbon-accounting/index.html': {
        'title': 'Carbon Accounting Hub — Measure & Reduce Emissions',
        'description': 'GHG Protocol-aligned carbon accounting guides, calculators, and regulatory intelligence. Measure Scope 1, 2 & 3 emissions with 2024 IPCC/EPA factors.',
        'canonical': 'https://terrnix.com/carbon-accounting/',
        'og_title': 'Carbon Accounting Hub — Measure & Reduce Emissions',
        'og_desc': 'GHG Protocol-aligned carbon accounting guides, calculators, and regulatory intelligence.',
        'schema_type': 'Article',
    },
    'esg-reporting/index.html': {
        'title': 'ESG Reporting Hub — CSRD, ISSB & Compliance',
        'description': 'Practical ESG reporting guidance for CSRD, ISSB, GRI, and SEC Climate Rule. Step-by-step workflows, templates, and regulatory intelligence.',
        'canonical': 'https://terrnix.com/esg-reporting/',
        'og_title': 'ESG Reporting Hub — CSRD, ISSB & Compliance',
        'og_desc': 'Practical ESG reporting guidance for CSRD, ISSB, GRI, and SEC Climate Rule.',
        'schema_type': 'FAQPage',
    },
    'tools/index.html': {
        'title': 'Sustainability Tools — Calculators & Assessments',
        'description': 'Free professional-grade calculators for carbon accounting, energy economics, and ESG reporting. No signup required.',
        'canonical': 'https://terrnix.com/tools/',
        'og_title': 'Sustainability Tools — Calculators & Assessments',
        'og_desc': 'Free professional-grade calculators for carbon accounting, energy economics, and ESG reporting.',
        'schema_type': 'CollectionPage',
    },
    'tools/energy-suite/index.html': {
        'title': 'Energy Economics Suite — LCOE & NPV Calculator',
        'description': 'Professional-grade financial calculators for sustainable energy projects. Evaluate NPV, IRR, and LCOE to compare technologies and justify renewable investments.',
        'canonical': 'https://terrnix.com/tools/energy-suite/',
        'og_title': 'Energy Economics Suite — LCOE & NPV Calculator',
        'og_desc': 'Professional-grade financial calculators for sustainable energy projects.',
        'schema_type': 'WebApplication',
    },
    'sustainability-intelligence/index.html': {
        'title': 'Sustainability Intelligence — News & Analysis',
        'description': 'Daily news, policy updates, and market intelligence for sustainability professionals. CBAM, CSRD, GHG Protocol, and carbon markets.',
        'canonical': 'https://terrnix.com/sustainability-intelligence/',
        'og_title': 'Sustainability Intelligence — News & Analysis',
        'og_desc': 'Daily news, policy updates, and market intelligence for sustainability professionals.',
        'schema_type': 'CollectionPage',
    },
    'resources/index.html': {
        'title': 'Sustainability Resources — Glossary, Guides & FAQ',
        'description': 'Glossary, FAQs, guides, and reference materials for sustainability professionals. Carbon accounting, ESG, CSRD, and GHG Protocol.',
        'canonical': 'https://terrnix.com/resources/',
        'og_title': 'Sustainability Resources — Glossary, Guides & FAQ',
        'og_desc': 'Glossary, FAQs, guides, and reference materials for sustainability professionals.',
        'schema_type': 'CollectionPage',
    },
    'about/index.html': {
        'title': 'About Terrnix — AI Sustainability Intelligence',
        'description': 'AI-powered sustainability intelligence for carbon accounting, ESG reporting, and climate compliance. Built by experts, for experts.',
        'canonical': 'https://terrnix.com/about/',
        'og_title': 'About Terrnix — AI Sustainability Intelligence',
        'og_desc': 'AI-powered sustainability intelligence for carbon accounting, ESG reporting, and climate compliance.',
        'schema_type': 'AboutPage',
    },
    'contact/index.html': {
        'title': 'Contact Terrnix — Sustainability Experts',
        'description': 'Get in touch with Terrnix sustainability specialists. Carbon accounting, ESG reporting, and climate compliance expertise.',
        'canonical': 'https://terrnix.com/contact/',
        'og_title': 'Contact Terrnix — Sustainability Experts',
        'og_desc': 'Get in touch with Terrnix sustainability specialists.',
        'schema_type': 'ContactPage',
    },
    'quiz/index.html': {
        'title': 'Sustainability Quiz — Test Your Knowledge',
        'description': '30-question knowledge challenge covering carbon accounting, ESG, energy, and climate regulations. Test your expertise and earn a certificate.',
        'canonical': 'https://terrnix.com/quiz/',
        'og_title': 'Sustainability Quiz — Test Your Knowledge',
        'og_desc': '30-question knowledge challenge covering carbon accounting, ESG, energy, and climate regulations.',
        'schema_type': 'Quiz',
    },
    'carbon-accounting/carbon-footprint-calculator/index.html': {
        'title': 'Free Carbon Footprint Calculator — Scope 1, 2 & 3',
        'description': 'Calculate your organisation\'s carbon footprint with GHG Protocol-aligned methodology. 15,000+ emission factors, 80+ countries. Export to CSV/PDF.',
        'canonical': 'https://terrnix.com/carbon-accounting/carbon-footprint-calculator/',
        'og_title': 'Free Carbon Footprint Calculator — Scope 1, 2 & 3',
        'og_desc': 'Calculate your organisation\'s carbon footprint with GHG Protocol-aligned methodology.',
        'schema_type': 'SoftwareApplication',
    },
    'carbon-accounting-readiness-assessment/index.html': {
        'title': 'Carbon Accounting Readiness Assessment',
        'description': '25-question assessment to identify your biggest carbon accounting gaps. Receive prioritised recommendations.',
        'canonical': 'https://terrnix.com/carbon-accounting-readiness-assessment/',
        'og_title': 'Carbon Accounting Readiness Assessment',
        'og_desc': '25-question assessment to identify your biggest carbon accounting gaps.',
        'schema_type': 'Quiz',
    },
    'esg-reporting/esg-report-analyzer/index.html': {
        'title': 'ESG Report Analyzer',
        'description': 'Analyze and benchmark your ESG reports against CSRD, ISSB, and GRI standards.',
        'canonical': 'https://terrnix.com/esg-reporting/esg-report-analyzer/',
        'og_title': 'ESG Report Analyzer',
        'og_desc': 'Analyze and benchmark your ESG reports against CSRD, ISSB, and GRI standards.',
        'schema_type': 'WebApplication',
    },
    'analytics-dashboard/index.html': {
        'title': 'Terrnix Growth Dashboard',
        'description': 'Internal analytics dashboard for Terrnix sustainability platform metrics and KPIs.',
        'canonical': 'https://terrnix.com/analytics-dashboard/',
        'og_title': 'Terrnix Growth Dashboard',
        'og_desc': 'Internal analytics dashboard for Terrnix sustainability platform.',
        'schema_type': 'WebPage',
        'robots': 'noindex, nofollow',
    },
}


def generate_head(seo_data):
    """Generate standardized <head> content."""
    robots = seo_data.get('robots', 'index, follow, max-image-preview:large')
    
    head = f"""<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script>
tailwind.config = {{
  theme: {{
    extend: {{
      fontFamily: {{
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }},
      colors: {{
        terrnix: {{
          bg: '#0a0f0d',
          'bg-secondary': '#111a16',
          'bg-tertiary': '#1a2520',
          border: '#2d3d35',
          emerald: '#10b981',
          'emerald-light': '#34d399',
          cyan: '#06b6d4',
          'cyan-light': '#22d3ee',
        }}
      }}
    }}
  }}
}}
</script>
<link rel="stylesheet" href="/components/design-system.css">
<title>{seo_data['title']} | Terrnix</title>
<meta name="description" content="{seo_data['description']}">
<link rel="canonical" href="{seo_data['canonical']}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Terrnix">
<meta property="og:title" content="{seo_data['og_title']}">
<meta property="og:description" content="{seo_data['og_desc']}">
<meta property="og:url" content="{seo_data['canonical']}">
<meta property="og:image" content="https://terrnix.com/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@TerrnixHQ">
<meta name="twitter:title" content="{seo_data['og_title']}">
<meta name="twitter:description" content="{seo_data['og_desc']}">
<meta name="twitter:image" content="https://terrnix.com/assets/og-image.png">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#0a0f0d">
<meta name="msapplication-TileColor" content="#0a0f0d">
<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
"""
    return head


def generate_org_schema():
    """Generate Organization schema."""
    return """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Terrnix",
  "url": "https://terrnix.com",
  "logo": "https://terrnix.com/assets/logo.png",
  "sameAs": [
    "https://linkedin.com/company/terrnix",
    "https://x.com/TerrnixHQ",
    "https://github.com/talal-rgb/ecosphere-sustainability"
  ],
  "description": "AI-powered sustainability intelligence for carbon accounting, ESG reporting, and climate compliance.",
  "foundingDate": "2024",
  "areaServed": "Global",
  "knowsAbout": [
    "Carbon Accounting",
    "ESG Reporting",
    "GHG Protocol",
    "CSRD",
    "ISSB",
    "Climate Compliance",
    "Sustainability Intelligence"
  ]
}
</script>"""


def standardize_page(filepath, seo_data):
    """Standardize a single page."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if file doesn't exist or is not HTML
    if not content.strip().startswith('<!DOCTYPE html>'):
        return False, 'Not an HTML file'
    
    changes = []
    
    # 1. Replace <head> section (keep existing inline styles/scripts after)
    head_match = re.search(r'<head>(.*?)</head>', content, re.DOTALL)
    if head_match:
        old_head = head_match.group(1)
        new_head = generate_head(seo_data) + '\n' + generate_org_schema()
        
        # Preserve any page-specific styles or scripts that come after standard tags
        # Extract inline styles and scripts that are page-specific
        page_specific = ''
        
        # Check for existing inline styles we should preserve
        style_match = re.search(r'<style>(.*?)</style>', old_head, re.DOTALL)
        if style_match:
            page_specific += f'<style>{style_match.group(1)}</style>\n'
        
        # Check for existing page-specific scripts in head
        script_matches = re.findall(r'<script[^>]*>(.*?)</script>', old_head, re.DOTALL)
        for script in script_matches:
            if 'analytics' in script or 'gtag' in script or 'clarity' in script:
                page_specific += f'<script>{script}</script>\n'
        
        # Check for Chart.js or other libraries
        lib_matches = re.findall(r'<script[^>]+src="[^"]+"[^>]*></script>', old_head)
        for lib in lib_matches:
            if 'chart' in lib or 'html2pdf' in lib:
                page_specific += lib + '\n'
        
        # Check for font-awesome
        fa_match = re.search(r'<link[^>]+font-awesome[^>]*>', old_head)
        if fa_match:
            page_specific += fa_match.group(0) + '\n'
        
        new_head_content = new_head + '\n' + page_specific
        content = content.replace(head_match.group(0), f'<head>\n{new_head_content}</head>')
        changes.append('Replaced <head> with standardized SEO')
    
    # 2. Replace navigation
    # Find and remove existing nav
    nav_pattern = r'<nav[^>]*>.*?</nav>\s*(<script>.*?</script>)?'
    nav_matches = list(re.finditer(nav_pattern, content, re.DOTALL))
    if nav_matches:
        # Remove all nav blocks
        for match in reversed(nav_matches):
            content = content[:match.start()] + content[match.end():]
        changes.append('Removed existing navigation')
    
    # Also remove standalone mobile menu scripts
    mobile_script_pattern = r'<script>\s*document\.getElementById\([\'"]mobileMenuBtn[\'"]\).*?</script>'
    content = re.sub(mobile_script_pattern, '', content, flags=re.DOTALL)
    
    # Insert shared nav after <body> tag
    body_match = re.search(r'<body[^>]*>', content)
    if body_match:
        # The static renderer invoked below injects the shared navigation.
        # Runtime includes are intentionally forbidden on GitHub Pages.
        changes.append('Queued shared navigation for static rendering')
    
    # 3. Replace footer
    # Find and remove existing footer
    footer_pattern = r'<footer[^>]*>.*?</footer>'
    footer_matches = list(re.finditer(footer_pattern, content, re.DOTALL))
    if footer_matches:
        for match in reversed(footer_matches):
            content = content[:match.start()] + content[match.end():]
        changes.append('Removed existing footer')
    
    # The static renderer invoked below injects the shared footer.
    changes.append('Queued shared footer for static rendering')
    
    # 4. Add main-content id to main or first section
    if 'id="main-content"' not in content and 'id="main"' not in content:
        # Try to find <main> tag
        main_match = re.search(r'<main[^>]*>', content)
        if main_match and 'id=' not in main_match.group(0):
            content = content.replace(main_match.group(0), '<main id="main-content">')
            changes.append('Added main-content id')
    
    # 5. Add role="main" if missing
    if 'role="main"' not in content:
        main_match = re.search(r'<main[^>]*>', content)
        if main_match and 'role=' not in main_match.group(0):
            new_main = main_match.group(0).replace('>', ' role="main">')
            content = content.replace(main_match.group(0), new_main)
            changes.append('Added role=main')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True, changes


def main():
    """Main function to standardize all pages."""
    results = {}
    
    for rel_path, seo_data in PAGE_SEO.items():
        filepath = REPO_ROOT / rel_path
        if not filepath.exists():
            results[rel_path] = {'status': 'ERROR', 'reason': 'File not found'}
            continue
        
        success, info = standardize_page(filepath, seo_data)
        results[rel_path] = {
            'status': 'SUCCESS' if success else 'ERROR',
            'changes': info if success else info
        }
    
    # Print results
    print(json.dumps(results, indent=2))
    
    # Summary
    total = len(results)
    success = sum(1 for r in results.values() if r['status'] == 'SUCCESS')
    print(f"\n{'='*60}")
    print(f"Standardization complete: {success}/{total} pages processed")
    print(f"{'='*60}")

    # GitHub Pages does not process SSI. Always materialize the component
    # directives this legacy standardizer emits before its output is committed.
    renderer = REPO_ROOT / 'scripts' / 'render-shared-components.py'
    subprocess.run([sys.executable, str(renderer)], cwd=REPO_ROOT, check=True)


if __name__ == '__main__':
    main()
