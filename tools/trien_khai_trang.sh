#!/usr/bin/env bash
# Đưa www/ lên nhánh gh-pages (trang chính GitHub Pages).
#   tools/trien_khai_trang.sh <thu_muc_worktree_gh-pages> [ten_ban_thu]
# - Không có ten_ban_thu: cập nhật trang chính (index.html, sw.js, css/, js/ ở gốc).
# - Có ten_ban_thu (vd gpu25): chỉ thêm bản thử ở /<ten_ban_thu>/ (index có <base href="../">).
# Ảnh, font, âm thanh luôn dùng chung ở gốc; chỉ chép thư mục nào thay đổi.
set -euo pipefail
GHP="$1"; BAN="${2:-}"
W="$(cd "$(dirname "$0")/.." && pwd)/www"
cd "$GHP"
git fetch -q --depth=5 origin gh-pages && git reset -q --hard FETCH_HEAD
for d in img/c img/ct img/cut img/nen img/l img/v img/v16 img/u img/a img/fx fonts sfx; do
  [ -d "$W/$d" ] || continue
  if ! diff -rq "$W/$d" "$d" >/dev/null 2>&1; then rm -rf "$d"; mkdir -p "$(dirname "$d")"; cp -r "$W/$d" "$d"; echo "cap nhat $d"; fi
done
if [ -z "$BAN" ]; then
  rm -rf css js && cp -r "$W/css" "$W/js" . && cp "$W/index.html" "$W/sw.js" .
  MSG="Trang chính: cập nhật"
else
  rm -rf "$BAN" && mkdir "$BAN" && cp -r "$W/css" "$W/js" "$BAN/"
  python3 - "$W/index.html" "$BAN" <<'PY'
import re, sys
src, ban = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf8").read()
s = s.replace('<head>\n', '<head>\n<base href="../">\n', 1).replace('href="css/', f'href="{ban}/css/').replace('src="js/', f'src="{ban}/js/')
s = re.sub(r"<title>[^<]*</title>", f"<title>Linh Thú Tam Địa — BẢN THỬ {ban}</title>", s, count=1)
open(f"{ban}/index.html", "w", encoding="utf8").write(s)
PY
  MSG="Bản thử $BAN"
fi
git add -A
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lr2WGAT2DCPraFATEfHpyN" || { echo "khong co gi thay doi"; exit 0; }
git -c push.negotiate=true push -q origin HEAD:gh-pages
git rev-parse --short HEAD
