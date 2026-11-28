# Máy chủ online Linh Thú Tam Địa

Cloudflare Worker + Durable Objects + D1. Không cần máy chủ riêng, không cần thẻ riêng ngoài tài khoản Cloudflare (gói Free đủ cho nhóm tester; Durable Objects dùng loại SQLite nên chạy được trên gói Free).

## Kiến trúc ngắn gọn

- **Worker** (`src/index.js`): REST + WebSocket, kiểm tra CORS (`https://ngocngon.github.io`, `https://localhost`, `capacitor://localhost`, `http://localhost:*`), phục vụ trang quản trị `/admin`.
- **Tài khoản**: người chơi tự đăng ký (tên đăng nhập + mật khẩu, tối đa 5 tài khoản mới/IP/giờ; quản trị tắt/bật ở `/admin`), đăng nhập bằng Google (khi đã đặt `GOOGLE_CLIENT_ID`), hoặc do quản trị tạo. Mật khẩu băm PBKDF2-SHA256 (WebCrypto). Đăng nhập trả về mã phiên ký HMAC (`SESSION_SECRET (không bắt buộc — để trống thì máy chủ tự sinh và lưu trong D1)`), hạn 30 ngày; khoá tài khoản hoặc đổi mật khẩu sẽ thu hồi các phiên cũ. Sai quá 6 lần/10 phút thì tạm khoá.
- **D1** (`migrations/`): `users`, `ratings` (Elo theo chế độ), `scores` (điểm theo ngày/tháng/tuần mỗi chế độ), `matches` (lịch sử), `saves` (tiến trình người chơi, đồng bộ nhiều máy), `activity` (hoạt động theo ngày), `mail`/`mail_claim`, `giftcodes`/`giftcode_redeem`, `announcements`, `admin_log`.
- **Durable Object `Matchmaker`**: hàng chờ ghép trận theo chế độ + mã riêng + độ gần Elo (chờ càng lâu càng nới rộng).
- **Trận do máy chủ giữ trạng thái** (mặc định từ o70, `src/authgame.js` + `src/authmatch.js`): DO `Match` chạy chính bộ luật game (`src/engine.gen.js`, sinh từ `www/js/01-engine.js` bằng `node scripts/gen-engine.mjs` — chạy lại MỖI KHI sửa engine), giữ toàn bộ trạng thái, nhận hành động từng lượt (`sub`/`unsub`), tự giải lượt và gửi mỗi bên chỉ phần được thấy (`state` khi vào/kết nối lại, `turn` = chuỗi khung hình để client diễn hoạt ảnh). Tay/bộ bài đối thủ chỉ là mặt lưng, bộ bài mình chỉ số lượng, thẻ úp và chiến địa chưa lộ bị che, không gửi hạt giống/danh sách bộ bài đối thủ. Máy chủ tự chấm thắng thua, giữ đồng hồ lượt 90 s (+8 s bù trễ) và luật bỏ 3 lượt liên tiếp = thua. Biến `ONLINE_MODE`: `auth` (mặc định; client cũ vẫn ghép lockstep), `auth-only` (chặn client cũ), `lockstep` (tắt chế độ mới).
- **Durable Object `Match`** — đường lockstep cũ (dự phòng, client cũ hoặc `?lockstep=1`; một DO mỗi trận, WebSocket Hibernation): chuyển tiếp trạng thái "presence" của game (giữ nguyên giao thức lockstep của client: hạt giống, thao tác từng lượt, khoá, băm trạng thái), giới hạn kích thước/tốc độ tin, và nắm các hạn chót phía máy chủ:
  - mất kết nối quá 3 phút thì xử thua;
  - đối thủ đã ra bài mà mình không ra bài quá 3 phút thì xử thua;
  - ghi kết quả khi hai bên báo khớp nhau (hoặc một bên rút lui/hết giờ); lệch nhau thì trận không tính điểm.
  - Đồng hồ lượt 90 giây và luật "bỏ 3 lượt liên tiếp thì thua" vẫn do client xử lý như cũ.
- **Client**: `www/js/10-online-cf.js` cắm vào game khi có địa chỉ máy chủ; không có thì game chạy cách cũ.

API: `GET /api/config` (công khai: `googleClientId`, `registerOpen`), `POST /api/register`, `POST /api/login`, `POST /api/login/google`, `POST /api/link/google`, `POST /api/unlink/google`, `POST /api/password`, `GET /api/me`, `GET|PUT /api/save` (`?slot=avatar` cho ảnh), `GET /api/leaderboard?mode=online[&key=d2026-11-23]`, `POST /api/score` (điểm các chế độ chơi với máy), `GET /api/history`, `GET|POST|PATCH /api/admin/users`, `GET|PUT /api/admin/config` và các API quản trị khác (cần `ADMIN_TOKEN`, xem mục Trang quản trị), WebSocket `/api/play` (ghép trận) và `/api/play?room=<mã trận>`.

API cho game (hợp đồng cố định): `POST /api/ping {v, platform:'web'|'apk'|'tester'}` (ghi hoạt động theo ngày giờ VN, tối đa 30 lần/giờ), `GET /api/announce` (công khai), `GET /api/mail`, `POST /api/mail/claim {id}` (409 `claimed`, 410 `expired`), `POST /api/giftcode {code}` (404 `not_found`, 410 `expired`/`not_started`, 409 `used_up`/`already`, 429 sau 10 lần sai/giờ). Phần quà `{vang?, ngoc?, token?, diem?, the?: [id]}`, máy chủ kiểm khoá và trần (1.000.000 / 100.000 / 10.000 / 100.000 / 20 thẻ). Tài khoản đang bị khoá: mọi API cần đăng nhập trả `403 {error:'banned', reason, until}` (`until: null` = vĩnh viễn).

## Trang quản trị `/admin`

Mở `https://<worker>/admin`, nhập `ADMIN_TOKEN` (chỉ giữ trong phiên trình duyệt, có nút Đăng xuất). Gồm: Tổng quan; Người chơi (Tra cứu theo mã/tên/email, chi tiết người chơi với các tab Tổng quan / Tiến trình / Trận đấu / Thư / Nhật ký / Cờ và lưới "Ngày có chơi (60 ngày)", Khoá tài khoản có lý do + thời hạn, Cờ gian lận, Tạo tài khoản); Vận hành (Gửi thư/quà cho một người hoặc tất cả, Giftcode, Thông báo, Cài đặt đăng ký/Google); Phân tích (Thời gian thực, Người chơi & DAU, Giữ chân D1–D30, Trận đấu & Elo, Nền tảng & phiên bản); Hệ thống (Sức khoẻ máy chủ, Nhật ký quản trị). API ở `/api/admin/*` (header `x-admin-token`), mọi thao tác ghi đều vào bảng `admin_log`.

- Trang quản trị **chỉ đọc** bản lưu người chơi (xem/tải JSON), không sửa hay xoá.
- Cờ gian lận chỉ liệt kê, không tự phạt. "Nhiều tài khoản cùng mạng" dùng IP đã băm HMAC (không lưu IP thô), chỉ có cho tài khoản tạo sau migration 0004.
- Số liệu hoạt động/giữ chân/thời gian chơi dựa trên `/api/ping` của game; trước khi bản game có ping, các số này trống.
- Tên thẻ lấy từ `src/cards.js`, sinh bằng `node scripts/gen-cards.mjs` (chạy lại khi game thêm thẻ). Đổi mã máy chủ thì tăng `WORKER_VERSION` trong `src/ops.js`.
- Thử trên máy với dữ liệu MẪU (giả, lưu ở `.wrangler/demo`, không commit): `node scripts/seed-demo.mjs && npx wrangler dev --local --port 8787 --persist-to .wrangler/demo`, rồi mở `http://localhost:8787/admin`. Chụp ảnh: `PW_PATH=<thư mục node_modules có playwright-core> SERVER=http://localhost:8787 OUT=shots node scripts/shots-admin.mjs`.

## Việc chủ game phải làm MỘT LẦN để chạy thật

1. Có tài khoản Cloudflare (miễn phí). Lấy **Account ID**: vào dash.cloudflare.com, chọn Workers & Pages, Account ID nằm ở cột bên phải.
2. Tạo **API token**: dash.cloudflare.com, My Profile, API Tokens, Create Token, chọn mẫu **Edit Cloudflare Workers**, rồi bấm thêm quyền **Account, D1, Edit** (Durable Objects đã nằm trong quyền Workers Scripts). Chép token (chỉ hiện một lần).
3. Trên GitHub, kho `ngocngon/linhthutamdia`: Settings, Secrets and variables, Actions, New repository secret, thêm:
   - `CLOUDFLARE_API_TOKEN` = token ở bước 2
   - `CLOUDFLARE_ACCOUNT_ID` = Account ID ở bước 1
   - (khuyên dùng, để workflow tự đẩy bí mật cho Worker) `ADMIN_TOKEN` = một chuỗi ngẫu nhiên dài từ 24 ký tự trở lên, `SESSION_SECRET` = một chuỗi ngẫu nhiên khác từ 32 ký tự. Tạo nhanh: `openssl rand -base64 32`. Không đặt trùng nhau và đừng dán vào mã nguồn.
4. Vào tab Actions, chọn **Triển khai máy chủ online (Cloudflare)**, bấm **Run workflow**. Workflow sẽ chạy kiểm thử, tự tạo D1 `linhthu` nếu chưa có, áp dụng migration, triển khai Worker và đẩy hai bí mật (nếu bạn đã thêm ở bước 3). Từ sau đó, mỗi lần đẩy thay đổi trong `server/` lên `main` nó tự triển khai lại.
5. Nếu bạn **không** thêm `ADMIN_TOKEN`/`SESSION_SECRET` vào GitHub secrets, đặt tay một lần (trong thư mục `server/`):
   ```
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put SESSION_SECRET
   ```
   hoặc trên dashboard: Workers & Pages, `linhthu-server`, Settings, Variables and Secrets, thêm hai biến loại Secret. Chưa có `SESSION_SECRET` thì không ai đăng nhập được; chưa có `ADMIN_TOKEN` thì không tạo được tài khoản.
6. Lấy địa chỉ Worker (dạng `https://linhthu-server.<tên-bạn>.workers.dev`, hiện ở cuối log của bước triển khai và trong dashboard).
7. Trỏ game tới máy chủ: sửa dòng `var DEFAULT_SERVER="";` trong `www/js/10-online-cf.js` thành địa chỉ Worker rồi đẩy lên (GitHub Pages và APK Android sẽ tự cập nhật theo workflow sẵn có). Để thử mà chưa sửa mã: mở game với `?server=https://...` (được nhớ lại trong trình duyệt; `?server=off` để tắt).

## Tạo tài khoản cho người chơi

Người chơi tự đăng ký trong game (Hồ sơ, Tài khoản online, tab Đăng ký). Muốn đóng đăng ký mở (ví dụ khi bị spam): mở `/admin`, tải danh sách, bỏ chọn **Cho phép đăng ký**.

Quản trị vẫn tạo được tài khoản: mở `https://<địa-chỉ-worker>/admin`, nhập `ADMIN_TOKEN`, rồi tạo tài khoản (tên đăng nhập + mật khẩu), xem danh sách, đổi mật khẩu, khoá/mở khoá. Gửi tên và mật khẩu cho tester. Cũng có thể gọi trực tiếp:

```
curl -X POST https://<worker>/api/admin/users -H "x-admin-token: $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"username":"tester1","password":"mat-khau-dai","display":"Tester 1"}'
```

Trong game: Hồ sơ, mục "Tài khoản online", Đăng nhập. Bấm chế độ Online sẽ ghép với người chơi khác đã đăng nhập. Muốn tester chỉ ghép với nhau: mỗi người nhập cùng **"Mã ghép riêng"** (cũng ngay trong mục tài khoản, hoặc mở game với `?code=abc`); người có mã chỉ ghép với người cùng mã. Mục "Liên kết tài khoản" ở ngay dưới đồng bộ tiến trình giữa các máy.

## Bật đăng nhập Google

Không bắt buộc. Chưa làm bước này thì nút "Đăng nhập bằng Google" tự ẩn, người chơi vẫn đăng ký/đăng nhập bằng mật khẩu.

1. Vào [Google Cloud Console](https://console.cloud.google.com/), tạo (hoặc chọn) một project.
2. **APIs & Services → OAuth consent screen**: chọn loại **External**, điền tên ứng dụng "Linh Thú Tam Địa", email hỗ trợ, bấm lưu. Phạm vi (scopes) chỉ cần mặc định (`openid`, `email`, `profile`). Khi sẵn sàng cho mọi người dùng, bấm **Publish app** (khi còn ở chế độ Testing chỉ các email trong danh sách Test users đăng nhập được).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, loại **Web application**.
   - **Authorized JavaScript origins**: `https://ngocngon.github.io` (thêm `http://localhost:8080` và `http://localhost` nếu muốn thử trên máy). Không cần Authorized redirect URIs.
4. Chép **Client ID** (dạng `1234567890-abc...apps.googleusercontent.com`). Đây là giá trị **công khai**, không phải bí mật; KHÔNG dùng Client secret ở đâu cả.
5. Mở `server/wrangler.toml`, mục `[vars]`, đặt `GOOGLE_CLIENT_ID = "<Client ID vừa chép>"`, commit và đẩy lên `main`: workflow tự áp migration và triển khai lại.
6. Kiểm tra: mở `https://<worker>/api/config` thấy `googleClientId` có giá trị; trong game, Hồ sơ → Tài khoản online → Đăng nhập sẽ có nút Google.

Ghi chú:
- Đăng nhập Google chỉ chạy trên trang web (GitHub Pages). Bản APK (`https://localhost`/`capacitor://localhost`) và trang nhúng trong khung (bản tester) tự ẩn nút Google; người chơi ở đó dùng tên đăng nhập + mật khẩu. Ai đăng nhập Google trên web có thể vào Tài khoản → "Đặt mật khẩu" để dùng thêm trên APK.
- Máy chủ chỉ lưu `sub` (mã người dùng Google) và email, không lưu token Google. Token được kiểm chữ ký RS256 bằng khoá công khai của Google, `iss`, `aud` = Client ID, hạn dùng và `email_verified`.
- Đóng đăng ký ở `/admin` thì Google cũng không tạo tài khoản mới (tài khoản đã liên kết vẫn đăng nhập được).

## Chạy thử trên máy

```
cd server
npm ci
printf 'ADMIN_TOKEN=dev-admin-token-123456\nSESSION_SECRET=dev-session-secret-abcdefghijklmnop\n' > .dev.vars   # không commit (đã .gitignore)
npm test                      # vitest trong runtime workerd (API, ghép trận, Durable Object, hạn chót)
npm run migrate:local && npm run dev    # Worker cục bộ ở http://localhost:8787
npm run smoke                 # kiểm tra nhanh bằng WebSocket thật (cần npm run dev đang chạy)
PW_PATH=<đường dẫn playwright> node scripts/e2e-auth.mjs   # hai Chrome chơi trọn một ván (máy chủ giữ trạng thái), cắt mạng + tải lại trang giữa trận, quét rò rỉ
PW_PATH=<đường dẫn playwright> node scripts/e2e.mjs        # như trên nhưng lockstep cũ (dự phòng)
node ../tests/online-auth.mjs # không cần Cloudflare: so khớp engine cục bộ, quét rò rỉ, kết nối lại, đồng hồ lượt
```

## Giới hạn đã biết

- Điểm các chế độ chơi với máy (Hành Trình, Biến Động...) do client tự báo lên, chỉ giới hạn tần suất, không xác minh được. Chế độ **Online** thì máy chủ tự tính từ kết quả hai bên báo khớp.
- Trận lockstep cũ (dự phòng) vẫn để hai máy giữ toàn bộ trạng thái; đặt `ONLINE_MODE=auth-only` khi mọi người đã lên bản mới.
- Giải một lượt tốn ~5 ms CPU (p95 ~13 ms, đo trên Node); gói Workers Free giới hạn 10 ms CPU mỗi lần gọi — nên dùng gói Paid hoặc theo dõi lỗi vượt CPU.
- Chưa triển khai thật trong môi trường phát triển này (không truy cập được mạng Cloudflare); mọi thứ đã chạy được bằng workerd cục bộ.
