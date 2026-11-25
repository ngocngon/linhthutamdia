# Kế hoạch VFX + SFX "riêng từng thẻ" — Linh Thú Tam Địa (nhánh gpu24)

Người lập: Agent Thiết kế hiệu ứng · 2026-11-25 · Chỉ phân tích, chưa sửa mã.
Nguồn đọc: `www/js/01-engine.js`, `05-vfx-core.js`, `08-vfx-webgl.js`, `09-card-choreo.js`, `04-audio.js`, `04a-sfx-fam.js`,
`www/sfx/*.json`, `www/img/v`, `www/img/v16`, `tu_lieu_hoat_anh/`, `tools/dung_tester.py`, `tools/tao_sfx_elevenlabs.mjs`.

---

## A. KIỂM KÊ HIỆN TRẠNG

### A1. Sự kiện engine phát ra (`ev(G,k,o)` dòng 879 + `track()` dòng 846)
22 loại `ev.k`: `skill`(t: rev/react/end/end_*/play/move/act/np) · `act` · `flip` · `summon` · `revive` · `destroy` · `discard` ·
`move` · `morph` · `abcopy` · `clone` · `tohand` · `draw` · `top` · `surge` · `egain` · `lock` · `blocked` · `sil` · `loc` · `locfx`.
Thay đổi **sức mạnh/năng lượng KHÔNG có sự kiện riêng**: `track()` ghi `c.hist` (k:"p" d=±N, k:"c" giá ±N, k:"bp" đặt lại, kèm `by`=id thẻ nguồn);
05-vfx-core so P0/P1 (dòng 448–457) và EN0 (dòng 458) để vẽ. → Đã đủ dữ liệu nguồn→đích, không cần sửa engine.

### A2. Hiện trạng theo tình huống (16 tình huống)

| # | Tình huống | VFX hiện có | Mức | SFX hiện có | Mức |
|---|---|---|---|---|---|
| 1 | Đặt thẻ từ tay | vết đáp + `place` | chung | `place` | chung |
| 2 | Lật mở | `elFx` theo 13 hệ + màn ra mắt S4/S5 + `SIG` 13 thẻ | hệ (+13 thẻ) | `rv_a/b/c` nhuộm hệ; S4/S5 `ra_s5/ra_s4` | hệ |
| 3 | Kỹ năng Lật/Cuối lượt/Bắt đầu | S4/S5 "ra tay" (HERO); 80 thẻ có chiêu v16 riêng (SIGV); 11 kiểu đòn theo MOTA (09) | 80 thẻ riêng | họ × hệ; **285 S4/S5 có tiếng riêng** | S4/S5 riêng |
| 4 | Kích hoạt (act) | ấn vàng `FX.sigil #ffd65a` | chung | `act` | chung |
| 5 | +sức mạnh thẻ khác | số "+N" xanh, `tang_suc`, cột sáng; đạo cụ x7 (trống/cờ) chọn theo hệ | chung (đạo cụ 2 loại) | `up1/2/3` | chung |
| 6 | −sức mạnh | "−N" đỏ + `miasma`, `giam_suc` | chung | `dn1/2/3` | chung |
| 7 | Nhân đôi | `nhan_doi` | chung | `f_dbl` | chung |
| 8 | +năng lượng (tổng) | đồng xu bay vào viên năng lượng, `nang_luong` | chung | `f_energy2`/`energy` | chung |
| 9 | Giá thẻ ± (cost) | viên ngọc + chữ "±N NĂNG LƯỢNG" | chung | `f_costdn/costup` | chung |
| 10 | Tiêu huỷ | lưỡi chém đỏ + `tieu_diet` + `CFX.destroy` | chung | `destroy` | chung |
| 11 | Vứt bỏ | `discardBeat` + `CFX.burn`; nhánh bàn (dòng 828) **rỗng** | chung | `discard` | chung |
| 12 | Triệu hồi / tạo thẻ | ấn xanh lá + vortex / `tao_the` | chung | `summon`/`f_create` | chung |
| 13 | Hồi sinh | `hoi_sinh` + cột xanh `#4dffa6` | chung | `revive` | chung |
| 14 | Di chuyển | `di_chuyen` (phần mượt: agent khác) | chung | `move` | chung |
| 15 | Bị chặn | `shield7`/`khien_chan` | chung | `f_block` | chung |
| 16 | Biến đổi / sao chép | ấn hồng `#ff7ac0`, `sao_chep` | chung | `morph`/`f_copy` | chung |

**Tóm lại:** 14/16 tình huống chỉ có VFX chung (không đổi theo hệ, không đổi theo thẻ); chỉ #2–#3 có biến thể hệ.
SFX: mọi tình huống có tiếng họ + lớp nhấn hệ (`EL` trong 04-audio: đổi tốc/lọc + `e_<hệ>`), nhưng **tiếng riêng S4/S5 là 1 tiếng/thẻ
dùng cho mọi tình huống** (`cardSkill()` thay tiếng họ) → +sức, tiêu huỷ, triệu hồi của cùng 1 thẻ nghe giống hệt nhau.

### A3. Độ phủ theo Bậc (585 thẻ)

| Bậc | Số thẻ | VFX riêng (SIG/SIGV/v16) | SFX riêng (the.json) | Thiếu VFX riêng |
|---|---|---|---|---|
| S5 | 194 | 50 | 194 | 144 |
| S4 | 91 | 8 | 91 | 83 |
| S3 | 125 | 17 | 0 | 108 |
| S2/S1/C1/TB/KD/MP | 101 | 16 | 0 | 85 |
| PH (thẻ tạo ra) | 74 | 0 | 0 | 74 |
| **Tổng** | **585** | **91** | **285** | **494** |

### A4. Số thẻ theo loại kỹ năng
Loại kích hoạt (`C[id].t`): rev 285 · pas 105 · on 79 · end 34 · act 30 · react 19 · start 11 · none 22.
Họ kỹ năng chính (`sfxFamOf`): aura 168 · create 32 · destroy 31 · move 30 · summon 29 · up1/2/3 51 · morph 23 · copy 19 · revive 18 ·
discard 17 · draw 14 · merge 12 · shuffle 11 · silence 10 · dn1/2/3 13 · dbl 8 · egain 8 · costdn 8 · costup 5 · steal 7 · pull 7 · locx 7 · khác 22.
Thẻ có nhắc tới (một thẻ có thể nhiều loại; trong ngoặc: S4/S5): +sức cho thẻ khác 85 (50) · +sức bản thân 57 (40) · −sức 36 (18) ·
nhân đôi 16 (8) · tiêu huỷ 67 (38) · vứt bỏ 43 (20) · triệu hồi/tạo/thêm 70 (40) · hồi sinh 13 (9) · di chuyển 71 (38) · giá thẻ 24 (16) ·
năng lượng thật sự (+/−/giá) ≈ 22 theo họ.
Hệ (`elOf` 05-vfx-core dòng 875, 13 hệ): cokhi 101 · toi 79 · dat 58 · gio 55 · moc 48 · sang 46 · doc 44 · nuoc 38 · hon 34 · mau 32 · lua 20 · sam 18 · bang 12.
Lưu ý: thẻ không khớp từ khoá rơi vào hệ theo băm (`lhash%6`) → nên rà tay ~40 thẻ trong bảng ghi đè.

### A5. Tài nguyên sẵn có dùng lại được
- `img/v` 133 ảnh tĩnh 256px (đạo cụ Đông Sơn, nổ 6 hệ, khung 4 hệ, 80 chiêu riêng) · `img/v16` 137 bảng 4×4 16 khung 1024² (41 MB, ~300 KB/bảng, nặng).
- Âm: `sfx3.mp3` 104 tiếng (70 s; gồm 37 họ, 13 `e_<hệ>`, 20 đạo cụ: slash/bow/chain/forge/chime…) · `the-1..6.mp3` 285 tiếng thẻ (272 s).
- Công cụ: `tools/tao_sfx_elevenlabs.mjs` (có `--ngan-sach`, `--thu`), `sfx_the_build.py`, `cat_luoi_nhan_vat.py`, `tach_nen_nhan_vat.py`,
  `dung_tester.py` (đã gói ảnh vào pak → file mới trong thư mục gói không làm tăng số tệp đáng kể).

---

## B. KIẾN TRÚC "RIÊNG TỪNG THẺ" — 3 TẦNG

**Tầng 1 – Nguyên mẫu theo LOẠI hành động (FXP).** Mỗi nguyên mẫu = kịch bản 2–3 nhịp (khởi từ nguồn → bay → chạm đích) dùng đạo cụ/sprite:

| Mã | Tình huống | Hình (nhịp chính) | Tiếng |
|---|---|---|---|
| `tang` | +sức mạnh thẻ khác | luồng sáng màu hệ bay nguồn→đích, đích loé + số "+N" nảy | vút sáng + chuông ngân |
| `giam` | −sức mạnh | vệt đỏ/tím quất xuống, vết nứt trên khung, số "−N" rơi | quất + nứt |
| `x2` | nhân đôi | bóng thẻ tách đôi + ấn "×2" | giữ `f_dbl` |
| `nl_cong` | +năng lượng | đồng hồ cát/ngọc năng lượng xoay bay vào viên năng lượng | tích tắc + nạp |
| `nl_tru` | −năng lượng | ngọc nứt vỡ thành bụi | ngọc vỡ |
| `gia` | giá thẻ −/+ | ngọc nhỏ gắn lên góc giá thẻ, mũi tên ↓ xanh / ↑ đỏ | leng keng ↓ / nặng ↑ |
| `ung_ho` | hồi/ủng hộ (+sức cho thẻ phe mình, Duy Trì) | trái tim/hoa sen sáng nhịp đập | nhịp tim ấm |
| `huy` | tiêu huỷ | thẻ vỡ vụn theo chất liệu hệ (đá, băng, tro, nhớt…) | vỡ theo hệ |
| `vut` | vứt bỏ | thẻ cháy mép, giấy tàn bay về chồng bỏ | giấy cháy phựt |
| `trieu` | triệu hồi/thêm tại chiến địa | vòng ấn trống đồng mở cổng, thẻ trồi lên | cổng mở |
| `tao` | tạo thẻ vào tay/bộ bài | lá bài sáng thành hình rồi bay về tay | rút sáng |
| `hoi` | hồi sinh | sen linh hồn trồi từ mộ, cột sáng | hồi sinh theo hệ |
| `kich` | kích hoạt (act) & kỹ năng Lật S1–S3 | ấn chú xoay dưới chân thẻ | ấn chú |
| `dat` | đặt thẻ | sóng chạm đất màu hệ | giữ `place` + nhấn hệ |
| `di` | di chuyển (bổ sung) | vệt lướt màu hệ + dấu đáp | giữ `move` + nhấn hệ |
| `chan`,`bien` | bị chặn, biến đổi | giữ hiện có, chỉ nhuộm màu hệ | giữ |

**Tầng 2 – Biến thể theo HỆ (13 hệ đúng `ELD`/`EL`: lua, bang, sam, doc, toi, sang, gio, dat, nuoc, mau, cokhi, hon, moc).**
Mỗi (nguyên mẫu × hệ) đổi: sprite ô lưới riêng, màu chính/phụ `ELD`, kiểu hạt `elFx` sẵn có, tiếng họ + lớp `e_<hệ>`.
Quy tắc chọn hệ: **hành động** (luồng, ấn, cổng) theo hệ thẻ NGUỒN; **chạm/vỡ** (huy, vut) theo hệ thẻ BỊ TÁC ĐỘNG.

**Tầng 3 – Độc quyền S5/S4 (và tuỳ chọn S3).** Mỗi thẻ có 1 "ấn ký" (emblem) vẽ riêng 256px: hiện ở nguồn mỗi khi thẻ ra tay
(trên luồng sáng, giữa vòng triệu hồi, đầu đạo cụ bay) + tiếng riêng đã có (`the.json`). 91 thẻ có chiêu v16 riêng: dùng ô đầu của bảng v16 làm ấn ký, không vẽ lại.

**Chữ ký riêng cho MỌI thẻ** (kể cả S1–S3/PH không có ảnh riêng): chữ ký = (hệ, mô-típ đạo cụ, màu phụ, quỹ đạo, nhịp, ấn ký|–, tiếng).
Mô-típ: 11 kiểu đòn sẵn trong 09 (throw_daggers, throw_cards, water_fist, melee_fist, sky_hammer, claw_rip, beast_bite, beast_devour,
slash_cleave, venom_hex, mystic_seal) + đạo cụ `img/v` (kiếm, đao, tên, búa, cờ, trống, sáo, xích, gương…). Không gian tổ hợp
13 hệ × 12 mô-típ × 4 màu phụ × 3 quỹ đạo (cong trái/phải/thẳng) = 1.872 > 585 → bảo đảm mỗi thẻ một tổ hợp khác nhau.

### B1. Dữ liệu cấu hình
- `tools/sinh_fx_the.mjs` (mới) đọc `C` (engine), `sfxFamOf`, hệ, MOTA, `the.json`, SIGV/SIG, `tools/fx_ghi_de.json` → sinh `www/js/04b-fx-the.js`:
  ```
  FXT["hoatinhnu"] = { e:"lua", m:"throw_daggers", c2:1, q:0, nh:2, em:"em:hoatinhnu",
    p:{ lat:"kich", ky:"tang", huy:"huy", vut:"vut", trieu:"trieu", hoi:"hoi", nl:"nl_cong", gia:"gia", di:"di" }, s:"the:hoatinhnu" }
  ```
  `p` chỉ ghi tình huống thẻ có thể gây ra (suy từ `t`, họ, regex mô tả) + tình huống thẻ chịu (huy/vut/di luôn có).
- Cần tách `ELW/ELMAN/elOf` + `MOTA` khỏi 05-vfx-core sang module thuần (vd `www/js/04c-he.js`) để node dùng chung, tránh lệch hệ.
- `tools/fx_ghi_de.json`: ghi đè tay {id: {e, m, em, p…}} — ưu tiên ~40 thẻ đang rơi hệ theo băm và thẻ S5 nổi bật.
- Bộ phát `www/js/05b-fx-rieng.js` (mới): `FXR.play(tinhHuong, srcUid, dstUid, {d, n})` → chọn nguyên mẫu × hệ × ấn ký; gọi từ các điểm
  hiện có trong 05-vfx-core (switch dòng 405–440, vòng P0/P1 dòng 448–457, năng lượng dòng 458, cost dòng 1679, discardBeat dòng 939).
  Thiếu dữ liệu → rơi về hiệu ứng cũ (không vỡ trận).
- Âm: `fam()` thêm tham số tình huống; tiếng riêng S4/S5 chỉ phát ở nhịp LẬT/KÍCH HOẠT của chính thẻ; nhịp chạm đích phát tiếng nguyên mẫu × hệ.

### B2. Kiểm tra tự động "mọi thẻ đều có" — `tests/fx-the-check.mjs` (chặn khi lỗi)
1. Đủ 585/585 id trong `FXT`; mỗi `e` ∈ 13 hệ; 0 thẻ hệ "băm" chưa duyệt (cảnh báo).
2. Với mỗi tình huống thẻ có thể gây ra: nguyên mẫu tồn tại, ô sprite (nguyên mẫu × hệ) có trong chỉ mục atlas, khoá tiếng có trong `fx.json`/`sfx3.json`.
3. 0 thẻ dùng nguyên mẫu "chung" (`*_chung`); S4/S5: 285/285 có `em` và `s`.
4. Chữ ký trùng = 0 (đếm tổ hợp khác nhau == 585).
5. Chạy giả lập `tests/engine-sim.mjs` 200 trận, ghi mọi (tình huống, uid nguồn) đã phát → tỉ lệ rơi về hiệu ứng cũ = 0%.

---

## C. TÀI NGUYÊN CẦN TẠO

### C1. Ảnh (ChatGPT, lưới 4×4 = 16 ô, 1024², mỗi ô ~256px)
Lưới 4×4 là tối ưu: 13 hệ + 3 ô (trung tính trắng, S4 tím, S5 vàng) vừa khít 1 nguyên mẫu. Ảnh TĨNH, chuyển động bằng transform/opacity (nhẹ hơn bảng 16 khung).

| Nhóm | Ô cần | Lưới | Nền |
|---|---|---|---|
| Nguyên mẫu × hệ: tang, giam, huy, vut, trieu, hoi, kich, dat, tao (9 × 13 hệ + 9 × 3 ô phụ) | 144 | 9 | đen (phát sáng, hoà "screen") |
| Biểu tượng chung (đồng hồ, ngọc, tim, sen, mũi tên giá…) | 16 | 1 | trắng (vật thể đặc, tách nền) |
| Ấn ký độc quyền S5/S4 chưa có ảnh (144 + 83) | 227 | 15 (240 ô, 13 ô dự phòng vẽ lại) | đen |
| (Tuỳ chọn đợt 4) Ấn ký S3 chưa có | 108 | 7 | đen |
| **Bắt buộc** | **387 sprite** | **25 lưới** | |

Thời gian: 25 lưới × 2 phút tạo = 50 phút + tải/kiểm/ghi tên ~2 phút/lưới + làm lại ~30% → **≈ 2,5–3 giờ** làn Chrome.
Ra bản dùng: cắt ô → nén `www/img/fx/<mã>.webp` dạng atlas 768² (ô 192px) mỗi lưới 1 tệp (≈25 tệp, đi vào pak của `dung_tester.py`: thêm `img/fx` vào GROUPS).
Thứ tự ô ghi trong `tools/fx_luoi_ds.json` (mã lưới → 16 mã ô) để công cụ cắt đặt tên tự động; Claude xem lại từng ô sau cắt.

**Phong cách chung (dán đầu mọi prompt):**
> Tranh hiệu ứng game thẻ bài, phong cách anime chi tiết, huyền sử Việt Nam, hoa văn trống đồng Đông Sơn, nét vẽ tay sắc, phát sáng mạnh.
> Lưới 4×4 gồm 16 ô vuông bằng nhau, mỗi ô MỘT hiệu ứng căn giữa, chiếm khoảng 70% ô, không chạm mép, giữa các ô có khoảng trống rõ.
> KHÔNG chữ, KHÔNG số, KHÔNG kí hiệu chữ cái, KHÔNG khung viền, KHÔNG nhân vật có thật hay nhân vật có bản quyền.

**Lưới 1 — `L01_tang` (nền đen tuyền #000):** "luồng sáng ban phước bay lên dạng mũi giáo ánh sáng xoắn ốc, đuôi hạt sáng, đầu có hoa văn trống đồng"
Ô 1–16: 1 lửa (đỏ cam, tàn lửa) · 2 băng (xanh nhạt, tinh thể) · 3 sấm (vàng, tia chớp nhỏ) · 4 độc (xanh lá chua, giọt nhớt tím) ·
5 bóng tối (tím đen, khói) · 6 ánh sáng (trắng vàng, tia toả) · 7 gió (ngọc bích, vệt gió cuộn) · 8 đất (nâu vàng, đá vụn bay) ·
9 nước (xanh biển, bọt sóng) · 10 máu (đỏ thẫm, giọt) · 11 cơ khí (đồng thau, bánh răng nhỏ) · 12 hồn (xanh lam ma mị, đốm lửa ma) ·
13 mộc (xanh lá, lá non, dây leo) · 14 trung tính trắng · 15 tím hoàng kim (Bậc 4) · 16 vàng kim rực (Bậc 5).
Prompt mẫu: "[Phong cách chung] Nền đen tuyền tuyệt đối. 16 ô là 16 biến thể của cùng một hiệu ứng 'luồng sáng ban phước bay lên…', theo thứ tự trái→phải, trên→xuống: (1) hệ lửa … (16) vàng kim rực. Mỗi ô cùng kích thước và cùng hướng bay lên."

**Lưới 2 — `L02_bieutuong` (nền trắng tinh #fff, vật thể có viền tối rõ để tách nền):**
1 đồng hồ cát bằng đồng có cát sáng xanh · 2 đồng hồ mặt trời trống đồng · 3 viên ngọc năng lượng xanh lam toả sáng · 4 ngọc năng lượng nứt vỡ ·
5 ngọc xanh kèm mũi tên chỉ xuống · 6 ngọc đỏ kèm mũi tên chỉ lên · 7 trái tim pha lê hồng phát sáng · 8 hoa sen trắng linh hồn ·
9 khiên đồng hoa văn chim Lạc · 10 vòng xích đồng khoá · 11 mảnh giấy bản cháy mép bay · 12 vòng ấn trống đồng (cổng) · 13 lá bài trống phát sáng ·
14 la bàn/kim chỉ hướng (di chuyển) · 15 chuông đồng nhỏ · 16 hồ lô thần.
Prompt mẫu: "[Phong cách chung] Nền trắng tinh, không bóng đổ lên nền. 16 biểu tượng vật thể đơn lẻ theo thứ tự: (1) … (16) …, mỗi vật thể có viền đậm và ánh sáng tự phát nhẹ."

**Lưới 3 — `L03_huy` (nền đen):** "lá thẻ vỡ vụn tung mảnh theo chất liệu" — 1 lửa (thẻ cháy thành tàn tro) · 2 băng (vỡ mảnh băng) · 3 sấm (nổ tia chớp xé) ·
4 độc (tan chảy nhớt) · 5 bóng tối (tan thành khói đen) · 6 ánh sáng (tan thành hạt sáng) · 7 gió (xé vụn cuốn xoáy) · 8 đất (vỡ đá tảng) ·
9 nước (vỡ tung bọt nước) · 10 máu (bắn tung giọt đỏ thẫm) · 11 cơ khí (bung bánh răng, ốc vít) · 12 hồn (hồn xanh thoát lên) · 13 mộc (tách thành lá úa) ·
14 trung tính · 15 tím Bậc 4 · 16 vàng Bậc 5.

Lưới 4–9: `vut` (giấy cháy bay, ngọn lửa theo hệ), `trieu` (vòng ấn mở cổng), `hoi` (sen linh hồn trồi lên), `giam` (vệt quất + vết nứt), `kich` (ấn chú xoay), `dat`+`tao` gộp nửa-nửa nếu cần.
Lưới 11–25 (ấn ký): mỗi ô ghi "ấn ký biểu tượng của <mô tả MOTA rút gọn của thẻ>, dạng huy hiệu tròn phát sáng màu hệ" — lấy MOTA, không dùng tên riêng có bản quyền.

### C2. Âm thanh (ElevenLabs, giả định ~20 credit/giây; đo lại bằng header `character-cost` ở lô đầu)

| Lô | Nội dung | Số tiếng | Giây/tiếng | Bản | Giây | Credit |
|---|---|---|---|---|---|---|
| S-1 | 10 tiếng nền tình huống mới: luồng sáng tăng, quất giảm, đồng hồ tích tắc+nạp, ngọc vỡ, giá ↓ leng keng, giá ↑ nặng, nhịp tim ấm, giấy cháy phựt, cổng ấn mở, ấn chú kích hoạt | 10 | 1,0 | 2 | 20 | ~400 |
| S-2 | 5 tình huống nặng × 13 hệ: huy, vut, trieu, tang, giam | 65 | 0,8 | 1 | 52 | ~1.040 |
| **Bắt buộc** | | **75 (85 lần tạo)** | | | **72** | **~1.440** |
| S-3 (tuỳ chọn) | tiếng riêng S3 (125 thẻ) | 125 | 0,9 | 1 | 113 | ~2.250 |

Dùng lại, KHÔNG tạo mới: 285 tiếng thẻ S4/S5 (`the.json`, chuyển sang nhịp lật/kích hoạt), 37 tiếng họ + 13 `e_<hệ>` (cho hoi, kich, dat, di, tao, chan, bien:
họ × lớp nhấn hệ), 20 tiếng đạo cụ (slash, bow, chain, forge, chime…) theo mô-típ — cộng 3 lớp này đã đủ khác nhau giữa các thẻ thường.
Đóng gói: `tools/sfx_fx_ds.json` → `www/sfx/fx.mp3` + `fx.json` (1 sprite, ~1 MB) qua mẫu `sfx_the_build.py`. Chạy với `--ngan-sach=1500 --du-phong=500`.

**Giọng đọc tên chiêu:** chưa nên làm đại trà. Đọc 194 tên S5 (~14 ký tự) ≈ 2.700 ký tự ≈ 1.400–2.700 credit (tuỳ model), lặp lại gây nhàm,
chất lượng tiếng Việt phải nghe thử. Đề xuất: thử 10 tên S5 (~150 credit) ở đợt 4, chỉ phát ở màn ra mắt S5 và có công tắc tắt.

---

## D. LỘ TRÌNH (mỗi đợt ra 1 bản tester)

| Đợt | Nội dung | Tài nguyên | Thấy khác biệt |
|---|---|---|---|
| **1** | Bộ phát `FXR` + `04b-fx-the.js` sinh tự động; nhuộm hệ NGUỒN cho mọi tình huống chung (màu, kiểu hạt `elFx` có sẵn); luồng sáng nguồn→đích cho ±sức mạnh; đồng hồ/ngọc cho năng lượng & giá; tim/sen cho ủng hộ; vá nhánh vứt bỏ rỗng; tách tiếng S4/S5 (chỉ ở nhịp kỹ năng) | Lưới 1 + 2 (2 lưới, 32 ô) · Lô S-1 (~400 credit) | Rất rõ: mọi +/−/năng lượng có nguồn→đích, màu theo thẻ |
| 2 | 7 lưới nguyên mẫu × hệ còn lại (huy, vut, trieu, hoi, giam, kich, dat/tao); Lô S-2; kiểm tra `fx-the-check` chặn | 7 lưới · ~1.040 credit | Tiêu huỷ/vứt/triệu hồi khác nhau theo hệ |
| 3 | 15 lưới ấn ký S4/S5 + mô-típ/quỹ đạo/màu phụ → chữ ký duy nhất 585/585; rà tay 40 thẻ hệ băm | 15 lưới · 0 credit | Mỗi S4/S5 có dấu ấn riêng trong mọi tình huống |
| 4 (tuỳ) | Ấn ký S3 (7 lưới), tiếng riêng S3 (~2.250), thử giọng 10 tên | tuỳ ngân sách | |

### D1. Làn song song (tệp sở hữu — không chồng nhau)
| Làn | Ai | Sở hữu |
|---|---|---|
| Chrome (duy nhất 1 agent giữ trình duyệt) | tạo lưới ChatGPT, lưu bản gốc | `tu_lieu_hoat_anh/anh_goc_chatgpt/fx/*`, `tools/fx_luoi_ds.json` (prompt + thứ tự ô) |
| Cắt ảnh | cắt, tách nền, nén atlas, chỉ mục | `tools/cat_luoi_fx.py`, `www/img/fx/*`, `www/js/04d-fx-atlas.js`, mục GROUPS trong `tools/dung_tester.py` |
| ElevenLabs (duy nhất 1 agent giữ khoá) | tạo + chọn bản + đóng gói | `tools/sfx_fx_ds.json`, `www/sfx/fx.mp3`, `www/sfx/fx.json` |
| Mã | dữ liệu + bộ phát + móc | `tools/sinh_fx_the.mjs`, `tools/fx_ghi_de.json`, `www/js/04b-fx-the.js`, `04c-he.js`, `05b-fx-rieng.js`, điểm móc trong `05-vfx-core.js`, `04-audio.js` (fam/cardSkill), `index.html` (thẻ script), `tests/fx-the-check.mjs` |
| Di chuyển mượt (agent khác) | giữ nguyên | `09-card-choreo.js` phần move, `08-vfx-webgl.js` — làn Mã chỉ gọi `FXR.play("di",…)` qua 1 móc thống nhất |
Làn Mã bắt đầu ngay với chỗ giữ ảnh (ô thiếu → vẽ bằng FX có sẵn), không chờ ảnh.

### D2. Rủi ro hiệu năng & cách đo
- Giới hạn cứng: ≤ 3 lớp sprite/sự kiện, ≤ 24 nút FX cùng lúc, ≤ 40 hạt/khung; chỉ `transform/opacity`; không `filter: blur/hue-rotate` (đổi màu bằng chọn ô theo hệ, không lọc).
- Bộ nhớ ảnh: atlas 768² ≈ 2,3 MB khi giải mã; chỉ nạp atlas nguyên mẫu (10) + ấn ký của 2 bộ bài trong trận (≤ 24 ô → nạp theo atlas chứa) → ≤ 35 MB. Không thêm bảng 1024² 16 khung.
- Dồn sự kiện: gộp cùng (tình huống, hệ) trong 1 bước thành 1 lần phát + "×N" (đã có mẫu `sayGroup11`); khi `FFTURN`/`reduced` → chỉ màu + số.
- Đo: `tests/perf-match.mjs` (CPU chậm 4×) trước/sau mỗi đợt: p95 khung ≤ 20 ms, long task > 50 ms không tăng, heap + ảnh tăng ≤ 30 MB;
  trên máy thật: lớp FPS (`?fps=1`) 3 trận × 6 lượt ở SPD 2.0 — mục tiêu ≥ 45 FPS trung bình, không khung > 100 ms.
- Âm: `fx.mp3` tải sau sảnh (không chặn màn hình tải), tối đa 3 tiếng/bước như hiện tại.

---

## E. ĐỀ XUẤT THÊM (hiển thị trong trận, cho điện thoại)

| # | Đề xuất | Công sức |
|---|---|---|
| 1 | **Dây nối nguồn→đích giữ 0,6 s** cho mọi hiệu ứng nhắm thẻ (kèm ấn ký nguồn), để người chơi biết "ai làm gì ai" trên màn nhỏ. | Nhỏ (dùng `beam` sẵn có) |
| 2 | **Đèn Duy Trì**: 184 thẻ on/pas hiện không báo khi đang tác dụng — thêm chấm sáng màu hệ nhấp nháy trên thẻ nguồn + viền mờ ở thẻ được hưởng khi tổng sức đổi vì Duy Trì. | Vừa |
| 3 | **Chạm giữ thẻ → dòng lịch sử** "+2 từ X, −1 từ Y" lấy từ `c.hist` (đã ghi `by`), chữ ≥ 12px, không che bàn. | Nhỏ–vừa |
| 4 | **Chạm 2 lần để tua ×2 tạm thời** trong lượt dài (mặc định Rất chậm SPD 2.0 dễ sốt ruột khi chuỗi hiệu ứng dài). | Nhỏ |
| 5 | **Tự hạ chất lượng hiệu ứng** khi FPS < 40 trong 3 s (bớt hạt, tắt lớp WebGL, giữ màu + số) và báo nhỏ 1 lần. | Vừa |
| 6 | **Đổi người dẫn chiến địa**: số tổng đếm lăn + viền chiến địa đổi màu + rung nhẹ (haptic) khi lật thế dẫn. | Nhỏ |
