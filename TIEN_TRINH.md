# TIẾN TRÌNH DỰ ÁN — đọc file này đầu tiên khi mở phiên mới

Cập nhật: 2026-11-25 12:45 (giờ VN). Phiên bản đang chạy: **gpu52**.
Phiên mới có thể không có dữ liệu của phiên cũ. Mọi thứ cần để làm tiếp đều nằm trong repo này, cộng với 2 tài liệu dự án claude.ai (Project "Neo"): `ghi-chu/NHAT_KY_AGENT.md` và `ghi-chu/QUY_TRINH_DA_AGENT.md`.

## 1. Link và nơi chạy
| Thứ | Địa chỉ |
|---|---|
| Repo | github.com/ngocngon/linhthutamdia — nhánh làm việc `gpu24`, đẩy cả `gpu24` và `main` |
| Trang chính (GitHub Pages) | https://ngocngon.github.io/linhthutamdia/ (nhánh `gh-pages`, dựng bằng `tools/trien_khai_trang.sh`) |
| Bản tester (artifact claude.ai, công khai) | https://claude.ai/artifact/9o9yqZvSfZK6RNABdv7aMn — slug `473adb56-d39d-44da-88d7-20ec1af09819`, tiêu đề "Linh Thú Tam Địa", shared_live `public`, bản cuối `1795583822-7c6d` (153 tệp) |
| Server | https://linhthu-server.likiop00.workers.dev (Cloudflare Worker + D1 + Durable Objects, mã ở `server/`) |
| Trang quản trị | https://linhthu-server.likiop00.workers.dev/admin (đăng nhập bằng ADMIN_TOKEN — người dùng tự giữ, KHÔNG lưu ở đâu) |
| APK | chỉ dựng khi người dùng yêu cầu (workflow "Dựng APK Android") |

## 2. Quy tắc của người dùng (bắt buộc)
- Luôn trả lời tiếng Việt. Mỗi báo cáo kết thúc bằng "Tiếp theo:" và "Cần anh:".
- Mỗi lần phát hành: đẩy trang chính + tester, báo cáo kèm CẢ HAI link. APK chỉ khi được yêu cầu.
- Lỗi thì tự sửa, báo rõ đã sửa gì. Giao diện không được chồng/cắt chữ.
- Tốc độ mặc định trong trận: "Rất chậm" (SPD 2.0).
- Repo công khai: KHÔNG commit khoá API, mật khẩu, token. Không gõ mật khẩu/token vào trang web thay người dùng.
- Khi người dùng gọi skill `dieu-phoi-agent`: chạy agent song song, bảng trạng thái có giờ thật, QA độc lập, ghi nhật ký vào `ghi-chu/NHAT_KY_AGENT.md` (Project Neo).

## 3. Đã xong (gpu50 → gpu52)
- **gpu50** — người chơi tự đăng ký tài khoản (tên + mật khẩu), lưu tiến độ lên server. Đăng nhập Google: mã đã có nhưng đang ẩn (chờ OAuth Client ID).
- **gpu51** — trang quản trị `/admin` (kiểu Monverse Admin): người chơi, khoá/mở, sửa vàng/ngọc/thẻ, hộp thư, giftcode, thông báo, nhật ký. Migration D1 0003, 0004. Mở chiến địa kiểu Marvel Snap; ấn triện đỏ khi tố (snap); thẻ di chuyển bay mượt giữa chiến địa.
- **gpu52** — bộ phát hiệu ứng tình huống `www/js/13-fxr.js`: tăng/giảm sức mạnh có luồng sáng từ thẻ nguồn → thẻ đích, tiêu huỷ, vứt bỏ, triệu hồi, hồi sinh, kích hoạt, tạo thẻ, đổi năng lượng; màu và tiếng theo 13 hệ; thẻ S4/S5 có ấn ký riêng. 10 tiếng tình huống ElevenLabs (`www/sfx/fx.mp3` + `fx.json`). 24 tấm atlas ChatGPT trong `www/img/fx/` (9 nguyên mẫu × 16 hệ + 15 tấm ấn ký cho 235 thẻ S4/S5); tấm ấn ký nạp lười. Sửa theo QA-52: gộp tiếng "tim" dồn.

## 4. Việc còn dở / tiếp theo (theo thứ tự)
1. **Người dùng chơi thử gpu52** trên điện thoại, góp ý hiệu ứng/ấn ký → vẽ lại lưới nào chưa ưng (quy trình mục 6).
2. **Tiếng theo hệ (ElevenLabs)** ~1.040 credit — kế hoạch ở `docs/KE_HOACH_VFX_SFX.md` (tầng âm thanh). Công cụ: `tools/tao_sfx_elevenlabs.mjs`, `tools/sfx_fx_build.py`, `tools/sfx_fx_ds.json`.
3. **Rà tay hệ của 48 thẻ** trong `tools/fx_he_ra_tay.txt` (hệ đang đoán bằng băm) → ghi đè ở `tools/fx_ghi_de.json`.
4. **Điểm nghi chưa xử lý (QA-52):** tiếng "move" đôi khi kêu 2 lần cho 1 lần di chuyển (nghi `04a-sfx-fam.js` regex "di chuyển" + `cue("move")` ở 05-vfx-core.js:427). Thử chặn theo thời gian làm hỏng `tests/move-smooth.mjs` (2 thẻ cùng bay phải có 2 tiếng) → cần chặn theo uid thẻ. Chưa đo fps trên GPU thật.
5. **Đăng nhập Google:** khi người dùng đưa OAuth Client ID → đặt `GOOGLE_CLIENT_ID` trong `server/wrangler.toml` [vars], bỏ ẩn nút ở client, deploy. (Google Cloud cần người dùng tự bật 2FA và chấp nhận điều khoản.)
6. Giới hạn đã biết: thư nhận quà mất nếu rớt mạng sau khi server trả 200 (không bao giờ nhận đôi); thẻ bị kéo/đẩy kêu 2 tiếng; nhịp Chấn Nữ chưa khớp hẳn; tiếng mới chưa ai nghe bằng tai.

## 5. Lệnh thường dùng
```bash
# test (cần Chrome: CHROME_PATH=/usr/bin/google-chrome; playwright ở /opt/npm-tools/node_modules hoặc npm i trong tests/)
node tests/rules-pulled.mjs && node tests/rules-revive.mjs && node tests/rules-undo.mjs
for t in ui-smoke ui-meta gpu49-check sfx-ra-mat sfx-the hopthu dia-snap move-smooth fxr-check; do node tests/$t.mjs | tail -2; done
cd server && npm test            # 46 test
# phát hành (chỉ khi test đạt — dùng &&, không dùng ;)
git push origin gpu24 && git push origin gpu24:main         # push server/** → workflow tự migration + deploy Worker
bash tools/trien_khai_trang.sh <thư mục clone nhánh gh-pages>   # trang chính
python3 tools/dung_tester.py <thư mục MỚI chưa tồn tại>         # dựng tester (pak)
```
- Phát hành tester: `list_files` artifact ở trên → so sha256 từng tệp của bản dựng với danh sách → `publish_files` CHỈ các tệp khác (index.html sau cùng), `base_version` = bản cuối, `shared_live: "public"`, `artifact_title: "Linh Thú Tam Địa"`.
- Đổi mã: tăng `?v=gpuNN` của mọi script trong `www/index.html` khi ra bản mới.
- Sau phát hành: fetch thử 1 tệp MỚI trên cả trang chính và tester (bài học: trang chính từng 404 cả `img/fx` vì script phát hành thiếu thư mục mới).

## 6. Vẽ hiệu ứng bằng ChatGPT (máy Mac của người dùng, Chrome đã đăng nhập ChatGPT)
- Prompt mẫu: "Tạo 1 ảnh vuông, nền ĐEN TUYỀN tuyệt đối, lưới 4x4 (16 ô bằng nhau, mỗi ô một hiệu ứng căn giữa ~70%, không chạm mép, không chữ, không số, không khung, không nhân vật), chỉ xuất 1 ảnh. Hiệu ứng …: …, theo màu hệ. Thứ tự: (1) lửa đỏ cam, (2) băng xanh nhạt, (3) sấm vàng, (4) độc xanh lá và tím, (5) bóng tối tím đen, (6) ánh sáng trắng vàng, (7) gió ngọc bích, (8) đất nâu vàng, (9) nước xanh biển, (10) máu đỏ thẫm, (11) cơ khí đồng thau, (12) hồn xanh lam ma mị, (13) mộc xanh lá, (14) trắng bạc trung tính, (15) tím hoàng kim, (16) vàng kim."
- Ấn ký S4/S5: `node tools/fx_atlas/prompt_anky.mjs` → `tools/fx_atlas/anky_prompts.json` (16 mô tả rút từ MOTA cho mỗi tấm, không dùng tên riêng).
- Tải ảnh: mở ảnh → nút tải góc trên; nếu có 2 biến thể thì chọn "Tải xuống ảnh". Đổi tên trong ~/Downloads, đưa vào máy làm việc.
- Cắt: `python3 tools/fx_atlas/cat_atlas.py <ảnh.png> www/img/fx/<Lxx_ten>.webp den` (nền trắng: `cat_atlas_trang.py`) → xem `*_xem.png` (đừng commit) → `python3 tools/fx_atlas/them.py <Lxx_ten>.webp` (chạy ở gốc repo) để thêm mục vào `www/img/fx/fx.json` theo mẫu `tools/fx_atlas_mau.json`.

## 7. Bí mật (KHÔNG có trong repo — phải xin lại người dùng ở phiên mới)
- Khoá ElevenLabs (gói miễn phí 10.000 credit/tháng; khoá hiện tại không đọc được số dư, ~20 credit/giây, cộng dồn theo header `character-cost`). Đã dùng tháng này ≈ 1.518 credit trên khoá mới. Lưu ở `/home/claude/.secrets/elevenlabs_key`, không commit.
- ADMIN_TOKEN, SESSION_SECRET, CLOUDFLARE_API_TOKEN/ACCOUNT_ID: nằm trong GitHub Secrets (workflow tự dùng), không cần đưa vào phiên.
- Nên đổi các khoá/mật khẩu đã từng dán trong chat (ElevenLabs, HeyGen, mật khẩu admin).
