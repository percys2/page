#!/usr/bin/env python3
"""Read-only conservative image audit for the AgroCentro static publication.

python scripts/audit-unused-assets.py --root .

Prints JSON; never deletes or edits website files. An optional --output writes the
report. `remove` includes only local image files with no literal, selector, data,
SVG or evaluated catalogue reference. `remote_only_review` requires manual review
because this script cannot infer whether unrelated remote pages still need them.
The unpublished ficha-muestra.* prototype is excluded.
"""
import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

IMAGES = {'.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.avif', '.ico', '.bmp', '.tif', '.tiff'}
SOURCES = {'.html', '.css', '.js', '.mjs', '.json', '.webmanifest', '.xml'}
PROTOTYPE = 'ficha-muestra.'


def git_blob_sha(path):
    data = path.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def catalogue_runtime(root):
    """Evaluate data-only scripts and real catalogue getters in an isolated VM."""
    script = r'''
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const root=process.argv[1], context={window:{}}; vm.createContext(context);
for(const file of ['data/catalog-data.js','data/image-overrides.js','data/feed-guides.js','js/catalog-model.js']){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file,timeout:3000});
}
const model=context.window.AGROCENTRO_CATALOG;
if(!model?.products?.length) throw new Error('No catalogue products loaded');
const refs=[];
for(const p of model.products){
 for(const [kind,value] of [['primary',model.getImage(p)],['fallback',model.getFallbackImage(p)],['original',p.image]]){
   if(value) refs.push({id:p.id,kind,path:value});
 }
}
for(const [id,views] of Object.entries(context.window.AGROCENTRO_PRODUCT_VIEWS||{})){
 for(const view of views||[]) if(view?.src) refs.push({id,kind:'alternate-view',path:view.src});
}
process.stdout.write(JSON.stringify({product_count:model.products.length,refs}));
'''
    result = subprocess.run(['node', '-e', script, str(root)], capture_output=True, text=True, timeout=15)
    if result.returncode:
        raise RuntimeError('Catalogue evaluation failed; no removal is safe: ' + result.stderr.strip())
    return json.loads(result.stdout)


def normalize(path):
    value = unquote(path).split('?', 1)[0].split('#', 1)[0]
    if value.startswith(('http://', 'https://')):
        match = re.match(r'https?://(?:www\.)?agrocentronica\.com/(.*)', value)
        if not match:
            return None
        value = match.group(1)
    if value.startswith('data:'):
        return None
    return value.removeprefix('./').lstrip('/')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--remote-state', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    remote_state = json.loads(args.remote_state.read_text()) if args.remote_state else {}
    remote_rows = remote_state.get('remote', remote_state.get('tree', []))
    if isinstance(remote_rows, dict):
        remote_rows = remote_rows.get('tree', [])
    remote = {row['path']: row for row in remote_rows if row.get('type', 'blob') == 'blob'}
    files = {p.relative_to(root).as_posix(): p for p in root.rglob('*') if p.is_file() and not any(part.startswith('.') for part in p.relative_to(root).parts)}
    images = {name: p for name, p in files.items() if p.suffix.lower() in IMAGES}
    texts = {name: unquote(p.read_text(errors='replace')) for name, p in files.items()
             if p.suffix.lower() in SOURCES and not p.name.startswith(PROTOTYPE)}
    # Discover entry-point dependencies, while retaining references in other
    # shipped source files too (they remain accessible at their public URL).
    active = {name for name in texts if name.endswith('.html')}
    local_link = re.compile(r'''["'`]([^"'`\n<>]+\.(?:html|css|m?js|json)(?:\?[^"'`\n<>]*)?)["'`]''')
    changed = True
    while changed:
        changed = False
        for source in tuple(active):
            for raw in local_link.findall(texts.get(source, '')):
                target = normalize(raw)
                if target in texts and target not in active:
                    active.add(target)
                    changed = True
    reasons = {name: [] for name in images}
    runtime = catalogue_runtime(root)
    missing_runtime = []
    for entry in runtime['refs']:
        name = normalize(entry['path'])
        if name in reasons:
            reasons[name].append({'kind': 'catalogue-' + entry['kind'], 'product_id': entry['id']})
        elif name:
            missing_runtime.append(entry)
    # Match exact names, including CSS src$ selectors and URL-encoded spaces.
    # Basename matching errs toward keeping files when directories are ambiguous.
    def scan_source(source, text, source_kind):
        for name in images:
            base = Path(name).name
            if name in text or re.search(r'''(?:["'`/(])''' + re.escape(base) + r'''(?=["'`)\s?#])''', text):
                reason = {'kind': source_kind, 'source': source}
                if reason not in reasons[name]:
                    reasons[name].append(reason)
    for source, text in texts.items():
        scan_source(source, text, 'active-source-reference' if source in active else 'shipped-source-reference')
    # Referenced SVG images can themselves refer to raster files; iterate closure.
    scanned_svg = set()
    while True:
        pending = [name for name in images if reasons[name] and name.endswith('.svg') and name not in scanned_svg]
        if not pending:
            break
        for name in pending:
            scan_source(name, unquote(images[name].read_text(errors='replace')), 'svg-reference')
            scanned_svg.add(name)
    dynamic = []
    dynamic_expr = re.compile(r'''["'`]([^"'`\n]*assets/[^"'`\n]*\$\{[^"'`\n]*)["'`]''')
    for source, text in texts.items():
        for expr in dynamic_expr.findall(text):
            pattern = re.sub(r'\$\{[^}]*\}', '*', expr)
            pattern = normalize(pattern)
            matched = []
            if pattern:
                for name in images:
                    if fnmatch.fnmatchcase(name, pattern):
                        matched.append(name)
                        reasons[name].append({'kind': 'dynamic-pattern', 'source': source, 'pattern': pattern})
            dynamic.append({'source': source, 'expression': expr, 'matches': matched})
    keep, remove = [], []
    for name, file in sorted(images.items()):
        row = {'path': name, 'bytes': file.stat().st_size, 'remote_exists': name in remote,
               'local_sha': git_blob_sha(file)}
        row['requires_upload'] = name not in remote or remote[name].get('sha') != row['local_sha']
        if reasons[name]:
            row['reasons'] = reasons[name]
            keep.append(row)
        else:
            row['reasons'] = [{'kind': 'unreferenced', 'detail': 'No reference in published HTML/CSS/JS/data, SVG closure, catalogue originals, fallbacks or alternate views.'}]
            remove.append(row)
    remote_only = []
    for name, row in sorted(remote.items()):
        if Path(name).suffix.lower() in IMAGES and name not in images:
            ref_sources = [source for source, text in texts.items() if name in text or Path(name).name in text]
            remote_only.append({'path': name, 'bytes': row.get('size'), 'sha': row.get('sha'),
                                'referenced_by': ref_sources,
                                'action': 'keep-review', 'reason': 'Remote-only file; related remote pages were not read by this local audit.'})
    missing_selected = [entry for entry in missing_runtime if entry['kind'] != 'original']
    report = {
        'schema': 1, 'root': str(root), 'read_only': True,
        'method': 'Conservative literal reference scan of every shipped source except prototype, SVG dependency closure, and real catalogue primary/fallback/original/alternate getters.',
        'excluded_sources': sorted(name for name in files if Path(name).name.startswith(PROTOTYPE)),
        'active_sources': sorted(active),
        'shipped_unlinked_sources': sorted(set(texts) - active),
        'catalogue_product_count': runtime['product_count'],
        'missing_catalogue_refs': missing_runtime,
        'dynamic_image_patterns': dynamic,
        'safe_for_local_candidate_removal': not missing_selected and all(x['matches'] for x in dynamic),
        'keep': keep, 'remove': remove, 'remote_only_review': remote_only,
        'summary': {
            'local_image_count': len(images), 'keep_count': len(keep), 'remove_count': len(remove),
            'keep_bytes': sum(x['bytes'] for x in keep), 'remove_bytes': sum(x['bytes'] for x in remove),
            'avoided_new_upload_count': sum(x['requires_upload'] for x in remove),
            'avoided_new_upload_bytes': sum(x['bytes'] for x in remove if x['requires_upload']),
            'remote_deletion_candidate_count': sum(x['remote_exists'] for x in remove),
            'remote_only_review_count': len(remote_only),
        }
    }
    output = json.dumps(report, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        args.output.write_text(output)
    else:
        print(output, end='')


if __name__ == '__main__':
    main()
