#!/usr/bin/env python3
"""Dựng bản tester cho link Claude artifact (giới hạn 512 tệp/phiên bản, ảnh chỉ tải được từ tệp của chính artifact).

  python3 tools/dung_tester.py <thư mục ra>        (thư mục ra phải chưa tồn tại)

- Chép www/ sang thư mục ra, trừ img/c, img/ct, img/v16 và img/v, l, nen, u, a (gom vào các gói pak/*.webp) và tệp dev.
  Ảnh nằm trong thư mục gói nhưng được CSS tĩnh tham chiếu (url(../img/l/...)) thì để nguyên tệp lẻ vì CSS không đi qua pak.
- Gói = các tệp webp nối liền; js/00-pak.js mang chỉ mục (đường dẫn -> gói, vị trí, độ dài).
  Khi cần ảnh, trang fetch() đúng gói đó rồi cắt ra Blob URL (không mã hoá lại ảnh).
- Vá trong BẢN DỰNG (không sửa www/): spLoad dùng gói, bg12 bỏ tải trước ảnh thẻ, boot12 chờ gói hiệu ứng lõi,
  IMGS.v16 thành Proxy: khoá chưa tải -> undefined (mã game tự dùng đường thay thế) và bắt đầu tải gói.
- Thư mục v, l, nen, u, a: gói theo điểm cắt CỐ ĐỊNH theo tên tệp (GROUPS) nên đổi vài ảnh chỉ đổi gói chứa chúng, thứ tự cố định, không nhúng thời gian.
  Chúng được dùng cả bằng chuỗi cứng trong mã nên bản dựng vá (có kiểm đếm) và PAK.k(đường dẫn) trả Blob URL nếu gói đã tải, chưa tải thì trả ảnh giữ chỗ
  (gif 1x1 mang "#pk=<đường dẫn>") + bắt đầu tải gói; tải xong thì quét DOM thay ảnh giữ chỗ (thuộc tính src và style) bằng Blob URL.
  IMGS.u/l/a bọc Proxy kiểu giữ chỗ; IMGS.v bọc Proxy kiểu v16 (chưa tải -> undefined) vì ảnh v còn dùng cho canvas.
  Gói u và v được chờ ở màn hình tải (như bản gốc từng tải hết u, v ở màn hình tải); l, nen, a tải ngầm lúc rảnh hoặc khi cần.
- Cuối bản dựng có bước kiểm: mọi chuỗi img/(v|l|nen|u|a)/ còn sót trong js/css/html mà trỏ tới tệp đã gói phải nằm trong danh sách cho phép, nếu không dừng.
- In ra số tệp; dừng nếu vượt 300 (mục tiêu của bản này; giới hạn cứng của artifact là 512).
"""
import json, os, re, shutil, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "www")
OUT = sys.argv[1]
if os.path.exists(OUT):
    sys.exit("thư mục ra đã tồn tại: " + OUT)

PACKED = {"img/c": 1_600_000, "img/ct": 1_600_000, "img/v16": 2_400_000}  # cỡ mỗi gói (byte)
# Điểm cắt cố định: tệp có tên (sắp xếp) >= điểm cắt thứ i thì vào gói i+1. Chọn theo cỡ lúc dựng (~1,3 MB/gói); đổi cỡ ảnh không làm lệch gói.
GROUPS = {
    "img/v": ["v_dakhuc.webp", "v_maynuotthoigian.webp", "v_song_xung.webp"],
    "img/l": ["cautre.webp", "dinhlang.webp", "kholuong.webp", "snow.webp", "village.webp"],
    "img/nen": ["gachbong.webp", "ngocson.webp", "thanglong.webp"],
    "img/u": ["bk_huyenthoai_2.webp", "bk_vocuc_3.webp", "pack_CB.webp"],
    "img/a": [],
}
READY_DIRS = ["img/u", "img/v"]  # gói phải có trước khi vào sảnh; còn lại tải ngầm
WARM_ORDER = ["img/v", "img/l", "img/nen", "img/a", "img/u"]
MAX_FILES = 300
SKIP_FILES = {".nojekyll", "sw.js"}
SKIP_DIRS = set()
# ảnh trong thư mục gói mà CSS tĩnh/HTML trỏ tới -> để tệp lẻ
CSS_REF = set()
for _dp, _dn, _fn in os.walk(ROOT):
    for _f in _fn:
        if _f.endswith((".css", ".html")):
            _t = open(os.path.join(_dp, _f), encoding="utf8").read()
            for _m in re.finditer(r"img/(v|l|nen|u|a)/([\w.\-]+\.webp)", _t):
                CSS_REF.add("img/%s/%s" % _m.groups())
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
        if rel in GROUPS and f.endswith(".webp") and r not in CSS_REF:
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

ready_paks, warm_paks = [], []
for d in GROUPS:
    names = sorted(f for f in os.listdir(os.path.join(ROOT, d)) if f.endswith(".webp") and d + "/" + f not in CSS_REF)
    cuts, buckets = GROUPS[d], [[] for _ in range(len(GROUPS[d]) + 1)]
    for f in names:
        buckets[sum(1 for c in cuts if f >= c)].append(d + "/" + f)
    for n, b in enumerate(buckets):
        if b:
            write_pak(d.split("/")[1] + "-" + str(n), b)
            (ready_paks if d in READY_DIRS else warm_paks).append((WARM_ORDER.index(d), len(paks) - 1))
ready_paks = [i for _, i in sorted(ready_paks)]
warm_paks = [i for _, i in sorted(warm_paks)]

shim = """/* BẢN TESTER (tools/dung_tester.py): ảnh nằm trong gói pak/*.webp, tải khi cần rồi cắt thành Blob URL. */
(function(){"use strict";
var P=%s,I=%s,V=%s,CORE=%s,READY=%s,WARM=%s;
var blob={},ld={};
var BASE=(function(){try{return new URL(".",document.baseURI).href;}catch(e){return "";}})();
var PH="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
var RE=/data:image[/]gif;base64,[A-Za-z0-9+/=]+#pk=([^"')\\s,]+)/g;
function norm(u){if(typeof u!=="string")return "";if(BASE&&u.indexOf(BASE)===0)u=u.slice(BASE.length);var i=u.search(/[?#]/);return i<0?u:u.slice(0,i);}
function loadPak(i){if(ld[i])return ld[i];
  return ld[i]=fetch(P[i]).then(function(r){if(!r.ok)throw new Error("pak "+r.status);return r.arrayBuffer();}).then(function(buf){
    for(var p in I){var e=I[p];if(e[0]===i&&!blob[p])blob[p]=URL.createObjectURL(new Blob([new Uint8Array(buf,e[1],e[2])],{type:"image/webp"}));}
  }).catch(function(e){delete ld[i];throw e;});}
function url(p){var e=I[p];if(!e)return Promise.resolve(null);if(blob[p])return Promise.resolve(blob[p]);
  return loadPak(e[0]).then(function(){return blob[p]||null;},function(){return null;});}
function fix(s){return s.replace(RE,function(m,p){return blob[p]||m;});}
/* quét DOM: thay ảnh giữ chỗ (src, style) bằng Blob URL khi gói đã tải */
function sweep(){try{
  var a=document.querySelectorAll('[src*="#pk="],[style*="#pk="]');
  for(var i=0;i<a.length;i++){var e=a[i],s=e.getAttribute("src");
    if(s&&s.indexOf("#pk=")>=0){var n=fix(s);if(n!==s)e.setAttribute("src",n);}
    var t=e.getAttribute("style");if(t&&t.indexOf("#pk=")>=0){var m=fix(t);if(m!==t)e.setAttribute("style",m);}}
}catch(e){}}
/* ảnh giữ chỗ có thể nằm trong chuỗi mã game giữ lại (dựng lúc nạp trang) và xuất hiện ở DOM muộn: sau khi đã phát ra ảnh giữ chỗ, theo dõi DOM và quét (gộp 80 ms) */
var obs=null,tm=0;
function watch(){if(obs||!window.MutationObserver)return;
  obs=new MutationObserver(function(){if(tm)return;tm=setTimeout(function(){tm=0;sweep();},80);});
  obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["src","style"]});}
function kick(p){var e=I[p];if(e&&!blob[p])loadPak(e[0]).then(sweep,function(){});}
/* PAK.k: chuỗi URL ảnh -> Blob URL nếu đã có, chưa có thì ảnh giữ chỗ + bắt đầu tải; đường dẫn không gói thì giữ nguyên */
function k(u){var p=norm(u);if(!I[p])return u;if(blob[p])return blob[p];kick(p);watch();return PH+"#pk="+p;}
/* PAK.sync: như k nhưng cho canvas/Image: chưa có thì null (và bắt đầu tải) */
function sync(u){var p=norm(u);if(!I[p])return u;if(blob[p])return blob[p];kick(p);return null;}
var deepC=new WeakMap();
function deep(o){if(!o||typeof o!=="object")return o;var c=deepC.get(o);if(c)return c;
  c=new Proxy(o,{get:function(t,key){var v=t[key];if(typeof v==="string")return k(v);if(v&&typeof v==="object")return deep(v);return v;}});deepC.set(o,c);return c;}
var PAK={url:url,has:function(p){return !!I[p];},k:k,sync:sync,sweep:sweep,
  /* thay spLoad: trả true nếu đã xử lý */
  sp:function(key){try{if(SP.c[key]||SP.k[key])return true;var q=spKey12(key);if(!IMGS.c[q.id])return true;var p="img/"+(q.f?"c":"ct")+"/"+q.id+".webp";if(!I[p])return false;
    SP.k[key]=1;url(p).then(function(u){delete SP.k[key];if(u){SP.c[key]=u;spPaint(key);}});return true;}catch(e){return false;}},
  /* chờ gói hiệu ứng lõi + gói u, v (tối đa 15 giây) rồi mới chạy màn hình tải */
  ready:function(){var ps=CORE.map(function(key){return V[key]?url(V[key]):null;}).concat(READY.map(function(i){return loadPak(i).catch(function(){});}));
    return Promise.race([Promise.all(ps).then(sweep),new Promise(function(r){setTimeout(r,15000);})]);},
  /* tải ngầm các gói còn lại (l, nen, a), từng gói một */
  warm:function(){var n=0;(function nx(){if(n>=WARM.length)return;var i=WARM[n++];loadPak(i).then(sweep,function(){}).then(function(){setTimeout(nx,60);});})();},
  v16:function(orig){return new Proxy(orig,{get:function(t,key){if(typeof key!=="string")return t[key];var p=V[key];if(!p)return t[key];if(blob[p])return blob[p];url(p);return undefined;},
    has:function(t,key){var p=V[key];return !!(p&&blob[p]);}});},
  /* IMGS.v: chưa tải -> undefined (canvas/mã game tự dùng đường thay thế) */
  vv:function(orig){return new Proxy(orig,{get:function(t,key){var v=t[key];if(typeof v!=="string")return v;var p=norm(v);if(!I[p])return v;if(blob[p])return blob[p];kick(p);return undefined;}});},
  wrap:function(o){try{if(o.v)o.v=PAK.vv(o.v);for(var d of ["u","l","a"])if(o[d])o[d]=deep(o[d]);}catch(e){}}};
window.PAK=PAK;})();
""" % (json.dumps(paks), json.dumps(idx, separators=(",", ":")), json.dumps(v16, separators=(",", ":")), json.dumps(V16_CORE), json.dumps(ready_paks), json.dumps(warm_paks))
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
      "setTimeout(()=>{const r=window.PAK?PAK.ready():Promise.resolve();r.then(boot12,boot12);if(window.PAK)r.then(()=>setTimeout(PAK.warm,3000));},0);")
# ảnh chiến địa, ảnh vùng đấu: gói l, a tải ngầm bởi PAK.warm (bg12 gốc bắt Proxy đọc hết giá trị nên bỏ hai vòng lặp này)
patch("js/05-vfx-core.js", 'for(const k in IMGS.l){const u=IMGS.l[k];if(typeof u==="string"&&!seen.has(u)){seen.add(u);q.push(u);}}for(const k in IMGS.a){const x=IMGS.a[k]||{};for(const u of [x.b,x.t])if(u&&!seen.has(u)){seen.add(u);q.push(u);}}', "")
# ảnh v dùng cho canvas: Blob URL hoặc null (chưa tải thì không lưu cache)
patch("js/09-card-choreo.js", "const url = vfxUrl(key);", "const url = window.PAK ? PAK.sync(vfxUrl(key)) : vfxUrl(key);")
patch("js/09-card-choreo.js", "const u = vfxUrl(key);", "const u = window.PAK ? PAK.k(vfxUrl(key)) : vfxUrl(key);")
for rel, n in (("js/09-card-choreo.js", 2), ("js/08-vfx-webgl.js", 1)):
    p_ = os.path.join(OUT, rel)
    t = open(p_, encoding="utf8").read()
    t, c = re.subn(r'<img src="(img/v/v_[a-z_]+\.webp\?v=gpu19)" alt="">', r'<img src="${PAK.k(\1)}" alt="">'.replace("PAK.k(", 'PAK.k("').replace(r"\1)", r'\1")'), t)
    if c != n:
        sys.exit("không vá được %s: %d chỗ <img src=img/v/...> (cần %d)" % (rel, c, n))
    open(p_, "w", encoding="utf8").write(t)
patch("js/08-vfx-webgl.js", '<img class="bfx-sig" src="${m.sig}"', '<img class="bfx-sig" src="${window.PAK?PAK.k(m.sig):m.sig}"')
patch("js/08-vfx-webgl.js", '<img class="bfx-crest" src="${m.img}"', '<img class="bfx-crest" src="${window.PAK?PAK.k(m.img):m.img}"')
patch("js/07-meta-modes.js", 'UI(uKey)||("img/u/"+uKey+".webp")', 'UI(uKey)||(window.PAK?PAK.k("img/u/"+uKey+".webp"):"img/u/"+uKey+".webp")')
patch("js/11-nen-the.js", "url(${nbUrl(id)})", "url(${window.PAK?PAK.k(nbUrl(id)):nbUrl(id)})")
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
s = s.replace(tag, tag + '\n<script>try{if(window.PAK){if(IMGS.v16)IMGS.v16=PAK.v16(IMGS.v16);PAK.wrap(IMGS);}}catch(e){}</script>', 1)
# sw.js không có trong bản tester -> không đăng ký (tránh yêu cầu 404); phần kiểm bản mới (chk) giữ nguyên
_o = 'addEventListener("load",function(){try{navigator.serviceWorker.register('
if s.count(_o) != 1:
    sys.exit("không vá được index.html: đăng ký service worker")
s = s.replace(_o, 'addEventListener("load",function(){try{if(0)navigator.serviceWorker.register(')
open(os.path.join(OUT, "index.html"), "w", encoding="utf8").write(s)

# kiểm: chuỗi ảnh đã gói còn sót trong mã phải nằm trong chỗ đã vá/được cho phép
ALLOW = [r"PAK\.k\($", r"PAK\.k\(vfxUrl", r'^\s*\w+:\s+"$', r"\$\{key\}", r"NEW_PAINTED"]
bad = []
for dp, _, fn in os.walk(OUT):
    for f in fn:
        if not f.endswith((".js", ".css", ".html")) or f == "00-pak.js" or f == "03-data-store.js":
            continue
        rp = os.path.relpath(os.path.join(dp, f), OUT).replace(os.sep, "/")
        t = open(os.path.join(dp, f), encoding="utf8").read()
        for m in re.finditer(r"img/(v|l|nen|u|a)/([\w.\-]+\.webp)", t):
            if "img/%s/%s" % m.groups() not in idx:
                continue
            ls = t.rfind("\n", 0, m.start()) + 1
            head = t[max(ls, m.start() - 40):m.start()]
            if rp == "js/09-card-choreo.js" and re.match(r'^\s+\w+:\s+"$', head):
                continue  # bảng NEW_PAINTED_VFX: giá trị đi qua IMGS.v (Proxy) và vfxUrl
            if rp == "js/08-vfx-webgl.js" and re.search(r'(img|sig):\s+"$', head):
                continue  # bảng 08: dùng ở chỗ đã vá ${PAK.k(m.img)}
            if head.endswith('PAK.k("') or head.endswith('PAK.k("'):
                continue
            bad.append("%s: %s" % (rp, t[max(ls, m.start() - 50):m.end() + 20].strip()[:150]))
if bad:
    sys.exit("CÒN CHUỖI ẢNH ĐÃ GÓI CHƯA VÁ:\n" + "\n".join(bad))

n = sum(len(f) for _, _, f in os.walk(OUT))
mb = sum(os.path.getsize(os.path.join(d, x)) for d, _, f in os.walk(OUT) for x in f) / 1e6
print("tệp: %d | gói: %d | dung lượng: %.1f MB | phiên bản %s" % (n, len(paks), mb, ver))
if n > MAX_FILES:
    sys.exit("QUÁ NHIỀU TỆP (mục tiêu %d, giới hạn artifact 512)" % MAX_FILES)
