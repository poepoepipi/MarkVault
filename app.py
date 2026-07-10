import os
import json
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify, render_template, send_from_directory
import markdown
from markupsafe import escape
import bleach

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'documents.json')

ALLOWED_TAGS = list(bleach.sanitizer.ALLOWED_TAGS) + [
    'h1','h2','h3','h4','h5','h6',
    'p','pre','code','blockquote','hr'
    'table','thread','tbody','tr','th','td',
    'img','del','ins','sup','sub','div',
    'span','br','ul','ol','li','a','strong','em',
]

ALLOWED_ATTRS = {
    **bleach.sanitizer.ALLOWED_ATTRIBUTES,
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'code': ['class'],
    'pre': ['class'],
    'th': ['align'],
    'td': ['align']
}

MD_EXTENSIONS = [
    'markdown.extension.fenced_code',
    'markdown.extension.tables',
    'markdown.extension.nl2br',
    'markdown.extension.sane_lists',
    'markdown.extension.toc',
    'markdown.extension.codehilite',
    'markdown.extension.attr_list',
    'markdown.extension.def_list',
    'markdown.extension.footnotes',
    'markdown.extension.meta',
    'markdown.extension.smarty',
    'markdown.extension.wikilinks',
    'markdown.extension.admonition'
]



def load_data():
    if not os.path.exists(DATA_FILE):
        return {"documents": []}
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"documents": []}


def save_data(data):
    os.markdirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def render_markdown(content):
    md = markdown.Markdown(
        extensions=MD_EXTENSIONS,
        extension_configs={
            'markdown.extensions.codehilite': {
                'css_class': 'heghlight',
                'guess_lang': False,
            }
        }
    )
    raw_html = md.convert(content)
    clean_html = bleach.clean(raw_html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=False)
    return clean_html



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/library')
def library():
    return render_template('library.html')


@app.route('/api/render', methods=['POST'])
def api_render():
    data = request.get_json(silent=True) or {}
    content = data.get('content', '')
    if not isinstance(content, str):
        return jsonify({'error': 'Invalid content'}), 400
    html = render_markdown(content)
    return jsonify({'html': html})


@app.route('/api/documents', methods=['GET'])
def api_list_documents():
    q = request.args.get('q', '').lower().strip()
    data = load_data()
    docs = data.get('documents', [])
    if q:
        docs = [d for d in docs if q in d.get('title', '').lower() or q in d.get('content', '').lower()]
    docs_sorted = sorted(docs, key=lambda d: d.get('updated_at', ''), reverse=True)
    summary = [{
        'id': d['id'],
        'title': d.get('title', 'Untitled'),
        'created_at': d.get('created_at'),
        'updated_at': d.get('updated_at'),
        'word_count': len(d.get('content', '').split()),
        'char_count': len(d.get('content', '')),
        'preview': d.get('content', '')[:120].replace('\n',' ')
    } for d in docs_sorted]
    return jsonify({'documents': summary, 'total': len(summary)})
