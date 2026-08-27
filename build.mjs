/* Inline css/ and js/ into one self-contained dist/sakura.html.
   Nothing is minified — the point is a single portable file, not a small one. */
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

/* The replacement MUST be a function. Passing file contents as a replacement
   *string* lets `$$`, `$&` and friends inside the source be read as
   substitution patterns — which silently rewrites the code being inlined. */
function inline(needle, open, file, close) {
  html = html.replace(needle, () => open + '\n' + read(file) + '\n' + close);
}

inline('<link rel="stylesheet" href="css/style.css">', '<style>', 'css/style.css', '</style>');
inline('<script src="js/site.js"></script>', '<script>', 'js/site.js', '</' + 'script>');
inline('<script src="js/motion.js"></script>', '<script>', 'js/motion.js', '</' + 'script>');

/* check the TAGS are gone, not the paths — they are also named in a comment */
for (const tag of ['href="css/style.css"', 'src="js/site.js"', 'src="js/motion.js"']) {
  if (html.includes(tag)) throw new Error('failed to inline ' + tag);
}

/* images become data URIs so the single file really is single (assets/ is
   walked recursively — the gallery lives in a subfolder) */
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relPath = rel ? rel + '/' + entry.name : entry.name;
    if (entry.isDirectory()) { walk(path.join(dir, entry.name), relPath); continue; }
    const ext = path.extname(entry.name).toLowerCase();
    if (!mime[ext]) continue;
    const b64 = fs.readFileSync(path.join(root, dir, entry.name)).toString('base64');
    const uri = 'data:' + mime[ext] + ';base64,' + b64;
    // the ../ form first — otherwise the bare match leaves a dangling '../'
    html = html.split('../assets/' + relPath).join(uri);
    html = html.split('assets/' + relPath).join(uri);
  }
}
walk('assets');
if (html.includes('assets/')) throw new Error('an asset reference survived inlining');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'sakura.html');
fs.writeFileSync(out, html);
console.log('wrote', out, '(' + Math.round(html.length / 1024) + ' KB)');
