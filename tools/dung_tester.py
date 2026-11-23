#!/usr/bin/env python3
"""Dựng bản tester cho link Claude artifact (giới hạn 512 tệp/phiên bản, ảnh chỉ tải được từ tệp của chính artifact).

  python3 tools/dung_tester.py <thư mục ra>        (thư mục ra phải chưa tồn tại)

- Chép www/ sang thư mục ra, trừ img/c, img/ct, img/v16 (gom vào các gói pak/*.webp) và tệp dev.
- Gói = các tệp webp nối liền; js/00-pak.js mang chỉ mục (đường dẫn -> gói, vị trí, độ dài).
  Khi cần ảnh, trang fetch() đúng gói đó rồi cắt ra Blob URL (không mã hoá lại ảnh).
- Vá trong BẢN DỰNG (không sửa www/): spLoad dùng gói, bg12 bỏ tải trước ảnh thẻ, boot12 chờ gói hiệu ứng lõi,
  IMGS.v16 thành Proxy: khoá chưa tải -> undefined (mã game tự dùng đường thay thế) và bắt đầu tải gói.
- In ra số tệp; dừng nếu vượt 500.
"""
import json, os, re, shutil, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "www")
OUT = sys.argv[1]
if os.path.exists(OUT):
    sys.exit("thư mục ra đã tồn tại: " + OUT)

PACKED = {"img/c": 1_600_000, "img/ct": 1_600_000, "img/v16": 2_400_000}  # cỡ mỗi gói (byte)
SKIP_FILES = {".nojekyll", "sw.js"}
SKIP_DIRS = set()
V16_CORE = ["lat_the", "tang_suc", "giam_suc", "hien_dia", "song_xung", "khung_lua", "khung_nuoc", "khung_set", "khung_moc"]

# 1) chép tệp thường
for dp, dn, fn in os.walk(ROOT):
    rel = os.path.relpath(dp, ROOT).replace(os.sep, "/")
    rel = "" if rel == "." else rel
    dn[:] = [d for d in dn if (rel + "/" + d).lstrip("/") not in PACKED and (rel + "/" + d).lstrip("/") not in SKIP_DIRS]
    for f in fn:
        r = (rel + "/" + f).lstrip("/")
        if r in SKIP_FILES:
            continue
        os.makedirs(os.path.join(OUT, rel), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, r), os.path.join(OUT, r))

# 2) gói
data = open(os.path.join(ROOT, "js/03-data-store.js"), encoding="utf8").read()
v16 = dict(re.findall(r'"(\w+)":"(img/v16/[^"?]+)', re.search(r'"v16":\{(.*?)\}', data).group(1)))
v16_path_key = {p: k for k, p in v16.items()}
paks, idx = [], {}
os.makedirs(os.path.join(OUT, "pak"), exist_ok=True)


def write_pak(name, files):
    i = len(paks)
    paks.append("pak/" + name + ".webp")
    off = 0
    with open(os.path.join(OUT, "pak", name + ".webp"), "wb") as w:
        for r in files:
            b = open(os.path.join(ROOT, r), "rb").read()
            w.write(b)
            idx[r] = [i, off, len(b)]
            off += len(b)


for d, cap in PACKED.items():
    files = sorted(d + "/" + f for f in os.listdir(os.path.join(ROOT, d)) if f.endswith(".webp"))
    if d == "img/v16":
        core = [v16[k] for k in V16_CORE if k in v16]
        write_pak("v16-core", core)
        files = [f for f in files if f not in core]
    chunk, size, n = [], 0, 0
    for r in files:
        z = os.path.getsize(os.path.join(ROOT, r))
        if chunk and size + z > cap:
            write_pak(d.split("/")[1] + "-" + str(n), chunk); n += 1; chunk, size = [], 0
        chunk.append(r); size += z
    if chunk:
        write_pak(d.split("/")[1] + "-" + str(n), chunk)

shim = """/* BẢN TESTER (tools/dung_tester.py): ảnh thẻ + hiệu ứng v16 nằm trong gói pak/*.webp, tải khi cần rồi cắt thành Blob URL. */
(function(){"use strict";
var P=%s,I=%s,V=%s,CORE=%s;
var blob={},ld={};
function loadPak(i){if(ld[i])return ld[i];
  return ld[i]=fetch(P[i]).then(function(r){if(!r.ok)throw new Error("pak "+r.status);return r.arrayBuffer();}).then(function(buf){
    for(var p in I){var e=I[p];if(e[0]===i&&!blob[p])blob[p]=URL.createObjectURL(new Blob([new Uint8Array(buf,e[1],e[2])],{type:"image/webp"}));}
  }).catch(function(e){delete ld[i];throw e;});}
function url(p){var e=I[p];if(!e)return Promise.resolve(null);if(blob[p])return Promise.resolve(blob[p]);
  return loadPak(e[0]).then(function(){return blob[p]||null;},function(){return null;});}
var PAK={url:url,has:function(p){return !!I[p];},
  /* thay spLoad: trả true nếu đã xử lý */
  sp:function(k){try{if(SP.c[k]||SP.k[k])return true;var q=spKey12(k);if(!IMGS.c[q.id])return true;var p="img/"+(q.f?"c":"ct")+"/"+q.id+".webp";if(!I[p])return false;
    SP.k[k]=1;url(p).then(function(u){delete SP.k[k];if(u){SP.c[k]=u;spPaint(k);}});return true;}catch(e){return false;}},
  /* chờ gói hiệu ứng lõi (tối đa 15 giây) rồi mới chạy màn hình tải */
  ready:function(){var ps=CORE.map(function(k){return V[k]?url(V[k]):null;});return Promise.race([Promise.all(ps),new Promise(function(r){setTimeout(r,15000);})]);},
  v16:function(orig){return new Proxy(orig,{get:function(t,k){if(typeof k!=="string")return t[k];var p=V[k];if(!p)return t[k];if(blob[p])return blob[p];url(p);return undefined;},
    has:function(t,k){var p=V[k];return !!(p&&blob[p]);}});}};
window.PAK=PAK;})();
""" % (json.dumps(paks), json.dumps(idx, separators=(",", ":")), json.dumps(v16, separators=(",", ":")), json.dumps(V16_CORE))
open(os.path.join(OUT, "js/00-pak.js"), "w", encoding="utf8").write(shim)


# 3) vá bản dựng
def patch(rel, old, new, count=1):
    p = os.path.join(OUT, rel)
    s = open(p, encoding="utf8").read()
    if s.count(old) != count:
        sys.exit("không vá được %s: tìm thấy %d lần: %s" % (rel, s.count(old), old[:80]))
    open(p, "w", encoding="utf8").write(s.replace(old, new))


patch("js/05-vfx-core.js", "function spLoad(k){", "function spLoad(k){if(window.PAK&&PAK.sp(k))return;")
patch("js/05-vfx-core.js", "for(const k in IMGS.c){if(SP.c[k])continue;const cu=cardUrl12(k,0);",
      "for(const k in (window.PAK?{}:IMGS.c)){if(SP.c[k])continue;const cu=cardUrl12(k,0);")
patch("js/05-vfx-core.js", "setTimeout(boot12,0);",
      "setTimeout(()=>{(window.PAK?PAK.ready():Promise.resolve()).then(boot12,boot12);},0);")
patch("js/05-vfx-core.js", "function reCard12(u){", "function reCard12(u){if(window.PAK){const m=u.match(/\\/(ct?)\\/([^/?]+)\\.webp/);if(m){const k=m[2]+(m[1]===\"c\"?\"@f\":\"\");delete SP.k[k];delete SP.c[k];spLoad(k);}return Promise.resolve();}")
s = open(os.path.join(OUT, "index.html"), encoding="utf8").read()
m = re.search(r'<script src="js/11-nen-the\.js\?v=([^"]+)"></script>', s)
if not m:
    sys.exit("không thấy thẻ script 11-nen-the.js")
ver = m.group(1)
s = s.replace(m.group(0), '<script src="js/00-pak.js?v=%s"></script>\n%s' % (ver, m.group(0)), 1)
tag = '<script src="js/03-data-store.js?v=%s"></script>' % ver
if tag not in s:
    sys.exit("không thấy thẻ script 03-data-store.js")
s = s.replace(tag, tag + '\n<script>try{if(window.PAK&&IMGS.v16)IMGS.v16=PAK.v16(IMGS.v16);}catch(e){}</script>', 1)
open(os.path.join(OUT, "index.html"), "w", encoding="utf8").write(s)

n = sum(len(f) for _, _, f in os.walk(OUT))
mb = sum(os.path.getsize(os.path.join(d, x)) for d, _, f in os.walk(OUT) for x in f) / 1e6
print("tệp: %d | gói: %d | dung lượng: %.1f MB | phiên bản %s" % (n, len(paks), mb, ver))
if n > 500:
    sys.exit("QUÁ NHIỀU TỆP (giới hạn artifact 512)")
