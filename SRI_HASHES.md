# SRI Hashes for Terrnix CDN Resources

**Generated:** 2026-06-09
**Method:** openssl dgst -sha384 -binary | openssl base64 -A

| Resource | URL | SRI Hash (sha384) |
|----------|-----|-------------------|
| Tailwind CSS | https://cdn.tailwindcss.com | `igm5BeiBt36UU4gqwWS7imYmelpTsZlQ45FZf+XBn9MuJbn4nQr7yx1yFydocC/K` |
| Alpine.js | https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js | `pb6hrQvo4s23cEUFtj0CZkzGE3jyK3pj26RIupXXxhSrrcUA/Cn0lZgcCrGH0t6L` |
| Chart.js v3 | https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js | `9MhbyIRcBVQiiC7FSd7T38oJNj2Zh+EfxS7/vjhBi4OOT78NlHSnzM31EZRWR1LZ` |
| Chart.js v4 | https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js | `vsrfeLOOY6KuIYKDlmVH5UiBmgIdB1oEf7p01YgWHuqmOHfZr374+odEv96n9tNC` |
| Font Awesome | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css | `iw3OoTErCYJJB9mCa8LNS2hbsQ7M3C0EpIsO/H5+EGAkPGc6rk+V8i04oW/K5xq0` |
| Google Fonts | https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap | `TcQo9FFlTDndf4TwW6nguuxOdlIryU+GgHD+jVVeejjcEpZ21a4VciVVni2NCyjp` |

## Files to Update

- [ ] index.html (all 6 resources)
- [ ] carbon-accounting/carbon-footprint-calculator/index.html (tailwind + fonts)
- [ ] carbon-accounting/index.html (tailwind + fonts)
- [ ] carbon-accounting/scope-1-emissions/index.html (tailwind + fonts)
- [ ] carbon-accounting/scope-2-emissions/index.html (tailwind + fonts)
- [ ] carbon-accounting/scope-3-emissions/index.html (tailwind + fonts)
- [ ] esg-reporting/index.html (tailwind + fonts)
- [ ] esg-reporting/csrd-omnibus-guide/index.html (tailwind + fonts)
- [ ] resources/index.html (tailwind + fonts)
- [ ] sustainability-intelligence/index.html (tailwind + fonts)
- [ ] tools/index.html (tailwind + fonts)
- [ ] about-us.html (font-awesome)
- [ ] privacy-policy.html (font-awesome)
- [ ] terms-of-use.html (font-awesome)

## CSP Update Required

Add `require-sri-for script style` to the Content-Security-Policy.
