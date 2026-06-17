#!/usr/bin/env python3
"""Generate PDF from test HTML file using Playwright"""

import asyncio
from playwright.async_api import async_playwright

async def generate_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Load the HTML file
        await page.goto('file:///data/terrnix/repos/ecosphere-sustainability/test-pdf-report.html')
        
        # Wait for content to load
        await page.wait_for_load_state('networkidle')
        
        # Generate PDF with A4 format
        await page.pdf(
            path='/data/terrnix/repos/ecosphere-sustainability/test-output.pdf',
            format='A4',
            print_background=True,
            margin={
                'top': '0mm',
                'right': '0mm',
                'bottom': '0mm',
                'left': '0mm'
            }
        )
        
        await browser.close()
        print("PDF generated successfully: test-output.pdf")

if __name__ == '__main__':
    asyncio.run(generate_pdf())
