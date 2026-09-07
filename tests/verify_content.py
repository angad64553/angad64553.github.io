"""Guard the visual-only upgrade against changes to the original portfolio content."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import json


class Portfolio(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.structured_script = False
        self.values = {key: [] for key in ('text', 'links', 'sections', 'form', 'metadata', 'structured_data')}

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in ('script', 'style'):
            self.in_script = True
            self.structured_script = attributes.get('type') == 'application/ld+json'
        if tag == 'a':
            self.values['links'].append(attributes)
        if tag == 'section':
            self.values['sections'].append([attributes.get('id'), attributes.get('aria-labelledby')])
        if tag in ('input', 'textarea', 'form'):
            self.values['form'].append([tag, attributes])
        if tag == 'meta' and attributes.get('name') != 'theme-color':
            self.values['metadata'].append(attributes)
        if tag == 'link' and attributes.get('rel') == 'canonical':
            self.values['metadata'].append(attributes)

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script = self.structured_script = False

    def handle_data(self, text):
        if self.structured_script and text.strip():
            self.values['structured_data'].append(json.loads(text))
        elif not self.in_script and text.strip():
            self.values['text'].append(text.strip())


def fingerprints(path):
    page = Portfolio()
    page.feed(Path(path).read_text())
    return {key: sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
            for key, value in page.values.items()}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    expected = json.loads((root / 'tests/content-fingerprints.json').read_text())
    actual = fingerprints(root / 'index.html')
    changed = [key for key in expected if actual[key] != expected[key]]
    if changed:
        raise SystemExit('Original content changed: ' + ', '.join(changed))
    print('PASS: original text, links, sections, form, metadata, and structured data are unchanged.')
