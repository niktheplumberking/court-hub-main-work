"""Read-only checks of initial crawler HTML, share artwork and bilingual discovery."""
import concurrent.futures
import html.parser
import json
import struct
import sys
import urllib.request
import xml.etree.ElementTree as ET

BASE = sys.argv[1].rstrip('/')
SITE = 'https://courthub.ae'
HEADERS = {'User-Agent': 'WhatsApp/2.24.1 A'}


def fetch(path):
    request = urllib.request.Request(BASE + path, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read(), response.headers


class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_head = False
        self.skip = 0
        self.json_script = False
        self.json_buffer = ''
        self.meta = {}
        self.links = []
        self.text = []
        self.schema = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'head':
            self.in_head = True
        if tag in ('script', 'style'):
            self.skip += 1
            self.json_script = attrs.get('type') == 'application/ld+json'
            self.json_buffer = ''
        if tag == 'meta' and self.in_head:
            self.meta[attrs.get('property', attrs.get('name', ''))] = attrs.get('content', '')
        if tag == 'link' and self.in_head:
            self.links.append(attrs)

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            if self.json_script:
                data = json.loads(self.json_buffer)
                self.schema.extend(data if isinstance(data, list) else [data])
            self.skip = max(0, self.skip - 1)
            self.json_script = False
        if tag == 'head':
            self.in_head = False

    def handle_data(self, data):
        if self.json_script:
            self.json_buffer += data
        elif not self.skip:
            self.text.append(data)


sitemap, _ = fetch('/sitemap.xml')
tree = ET.fromstring(sitemap)
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [node.text for node in tree.findall('s:url/s:loc', ns)]
assert all(url.startswith(SITE + '/') for url in urls), 'Noncanonical sitemap host'
assert not any('/admin' in url or '/api/' in url or '/order' in url for url in urls)
paths = [url.removeprefix(SITE) for url in urls]
for path in paths:
    if path.startswith('/shop/'):
        assert '/ar' + path in paths, 'Missing Arabic product sitemap entry'
robots, _ = fetch('/robots.txt')
assert (SITE + '/sitemap.xml').encode() in robots


def check(path):
    raw, _ = fetch(path)
    page = Page()
    page.feed(raw.decode())
    canonical = next((x.get('href') for x in page.links if x.get('rel') == 'canonical'), '')
    assert canonical.rstrip('/') == (SITE + path).rstrip('/'), (path, 'canonical', canonical)
    assert page.meta.get('description'), (path, 'missing description')
    assert page.meta.get('og:title') and page.meta.get('og:description'), (path, 'missing OG in crawler head')
    assert page.meta.get('og:url', '').rstrip('/') == canonical.rstrip('/'), (path, 'OG URL')
    assert page.meta.get('og:image') == SITE + '/brand/court-hub-share-v1.4.png', (path, 'share image')
    assert page.meta.get('og:image:width') == '1200' and page.meta.get('og:image:height') == '630'
    assert page.meta.get('twitter:card') == 'summary_large_image'
    assert not any('\u2014' in text for text in page.text + list(page.meta.values())), (path, 'displayed em dash')
    if path in paths:
        alternates = {x.get('hreflang'): x.get('href') for x in page.links if x.get('rel') == 'alternate'}
        assert {'en', 'ar', 'x-default'} <= alternates.keys(), (path, 'language alternates')
        assert 'noindex' not in page.meta.get('robots', ''), (path, 'indexable route has noindex')
    if '/shop/' in path:
        product = next(x for x in page.schema if x.get('@type') == 'Product')
        assert product['offers']['url'] == canonical
        assert product['offers']['priceCurrency'] == 'AED'
        assert product['image'] and product['offers']['price'] >= 0
        assert 'aggregateRating' not in product
    if path in ('/', '/ar'):
        faq = next(x for x in page.schema if x.get('@type') == 'FAQPage')
        body = ' '.join(page.text)
        for question in faq['mainEntity']:
            assert question['name'] in body and question['acceptedAnswer']['text'] in body, 'FAQ markup must match visible copy'
    return {'path': path, 'canonical': canonical, 'schema': [x.get('@type') for x in page.schema], 'em_dashes': 0}


with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    report = list(pool.map(check, paths + ['/terms', '/privacy']))
image, headers = fetch('/brand/court-hub-share-v1.4.png')
assert headers.get_content_type() == 'image/png' and image[:8] == b'\x89PNG\r\n\x1a\n'
assert struct.unpack('>II', image[16:24]) == (1200, 630)
print(json.dumps({'base': BASE, 'checked_pages': len(report), 'share_image': '1200x630 PNG', 'pages': report}, indent=2))
