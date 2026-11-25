/* Module 13 (gpu51): FXR — bộ phát hiệu ứng TÌNH HUỐNG theo TỪNG THẺ.
   Mỗi thẻ có một "chữ ký" sinh tự động từ dữ liệu thẻ (tools/sinh_fx_the.mjs -> khối FXT bên dưới):
     hệ (13 hệ ELD), mô-típ đòn (kiểu đòn 09 theo MOTA), màu phụ (4), quỹ đạo (cong trái / cong phải / thẳng), nhịp, bậc, ấn ký, tiếng riêng.
   Quy tắc hệ: HÀNH ĐỘNG (luồng sáng, ấn, cổng, đồng hồ) lấy hệ THẺ NGUỒN; VỠ/CHÁY (tiêu huỷ, vứt bỏ) lấy hệ THẺ BỊ TÁC ĐỘNG.
   Thẻ S5/S4: ấn ký độc quyền (ảnh atlas em_<id> nếu có, chưa có thì huy hiệu tròn mặt nhân vật của chính thẻ + vòng bậc).
   Ảnh: atlas www/img/fx/fx.json (+ *.webp) — thiếu tệp thì tự dùng hình SVG/CSS dự phòng, không lỗi.
   Chỉ hoạt ảnh transform/opacity; ≤3 nút DOM mỗi hiệu ứng, ≤24 nút cùng lúc; FXLV 0: không hạt; reduced: không gì; FFTURN: chỉ loé màu.
   Nối vào trận: các điểm gọi trong 05-vfx-core.js (sự kiện lật/kích hoạt/tiêu huỷ/triệu hồi/hồi sinh/năng lượng/vứt bỏ) + bọc run8/hit8 ở đây
   (lớp ngoài cùng, sau 08/09) cho các đòn có nguồn -> đích (±sức mạnh, tiêu huỷ, triệu hồi, giá thẻ). */
/*FXT:BAT_DAU — sinh tự động bởi tools/sinh_fx_the.mjs, KHÔNG sửa tay (ghi đè: tools/fx_ghi_de.json) */
const FXT_EL=["lua","bang","sam","doc","toi","sang","gio","dat","nuoc","mau","cokhi","hon","moc"],FXT_MOT=["slash_cleave","throw_daggers","throw_cards","shoot_royal_bow","shoot_venom_bow","shoot_cannon","melee_fist","water_fist","arena_ko","sky_hammer","forge_strike","yama_judge","claw_rip","beast_bite","beast_devour","venom_hex","mystic_seal","talisman_summon","kite_summon","mirror_copy","feather_copy","persimmon_gift","banyan_steal","goblin_flip","destroyer_beam","shield_bash"],FXT_SIT=["tang","giam","ung","x2","nl","gia","huy","vut","kich","trieu","tao","hoi","chan"],FXT_N=585,FXT_C2X={"lua":"#ff3d8a","bang":"#b08cff","sam":"#ff9a2b","doc":"#ffe04a","toi":"#5ad0ff","sang":"#ff9a4d","gio":"#fff2a8","dat":"#7dde5a","nuoc":"#7dffb0","mau":"#ffd27a","cokhi":"#5ad0ff","hon":"#ff7ac0","moc":"#ffd65a"},FXT_TIERC={"4":"#c77dff","5":"#ffd65a"};
const FXT_RAW="acmong:4,16,1,2,1,5,4304,1,1,1;ainunuotsao:5,13,1,0,0,5,4292,1,1,1;aiquoc:4,16,1,1,0,3,4292,0,1,1;amban:4,2,0,2,1,3,4304,0,1,1;amtrao:8,12,2,1,1,1,4292,0,0,1;anhcothuat:4,19,1,2,0,0,5312,0,0,1;annu:5,15,0,2,1,3,4292,0,1,3;annusokhai:12,15,0,0,1,5,4544,1,1,1;ansao:5,16,1,2,0,5,4292,1,1,3;aoanh:11,2,0,2,1,0,4288,0,0,1;aochoangtoi:4,16,3,0,0,1,4288,0,0,1;aomongnu:11,15,0,2,0,3,5328,0,1,1;aosi:11,2,3,0,0,5,4544,2,1,0;aothuatgia:11,2,1,0,1,3,4288,0,1,1;bachdich:4,2,2,2,0,5,4304,1,1,0;bachhau:5,20,2,0,0,1,5328,0,0,1;bachho:12,13,2,0,0,1,4800,2,0,1;baithu:6,2,3,1,1,3,4288,2,1,1;bangca:1,9,3,0,1,5,4800,2,1,1;bangnhan:1,15,0,1,1,1,4336,0,0,1;bangvuong:1,15,3,0,1,4,4288,2,1,0;bansaota:4,16,3,1,0,0,5312,0,0,1;baocat:7,16,0,1,0,4,5312,1,1,1;baochuahauthe:1,13,2,2,0,5,4800,2,1,1;baochuasat:10,15,3,2,1,3,4800,0,1,1;baoco:10,5,1,0,0,0,4288,0,0,1;baocohauthe:1,16,3,1,1,0,4292,0,0,1;baonu:6,9,1,1,0,1,4800,2,0,1;batbainu:6,6,2,1,0,5,4296,1,1,1;batkhacan:7,13,1,2,0,3,4288,2,1,1;bato:6,16,1,1,0,5,4292,2,1,2;batty:8,16,0,1,1,3,4288,2,1,1;battykhonglo:2,2,0,1,0,5,4308,1,1,2;battymienvien:12,2,0,1,0,4,4289,1,1,1;bavuongmienvien:10,3,0,0,0,5,4307,2,1,1;bavuongtim:7,2,0,0,1,5,4288,1,1,1;bayong:12,15,0,2,0,1,5328,0,0,1;bayxac:7,16,2,2,1,0,4288,0,0,3;bayxacnuotsao:8,2,3,0,0,5,5312,1,1,2;biamo:9,16,2,1,1,4,4288,1,1,2;bienhinh:4,16,1,0,0,1,5312,0,0,1;bienhinhthuat:2,15,2,1,0,0,4336,0,0,2;bocap:3,15,3,1,0,1,4290,0,0,1;bocapngaymoi:3,15,2,0,1,5,4300,1,1,1;bongma:11,16,0,2,1,3,4288,0,1,1;buasam:10,9,3,1,0,0,4289,0,0,1;buisao:6,16,1,1,1,5,4804,1,1,1;caheocon:8,16,1,2,0,5,4292,1,1,1;camapcan:8,1,1,1,0,5,4292,1,1,1;camvuong:1,16,3,2,0,3,4304,0,1,1;caonu:4,12,1,1,1,3,4308,0,1,1;catlun:7,15,3,1,0,4,4308,1,1,1;catnhan:7,16,0,2,0,1,4336,0,0,1;channu:7,9,3,0,0,3,4288,2,1,1;chanthu:2,9,0,2,0,1,4288,0,0,0;chanthutienhoa:7,6,0,0,0,0,4336,0,0,1;chienlo:3,5,2,1,0,1,4292,0,0,1;chienthan:7,2,1,2,0,5,4289,1,1,0;chimcanhdo:6,16,0,1,0,5,4804,1,1,1;chimnhai:6,16,3,2,1,5,5332,1,1,1;chodoc:3,15,0,0,1,4,4289,1,1,0;chomay:10,1,2,0,0,5,4544,2,1,1;chonphao:10,5,2,1,1,1,4801,0,0,1;chonvacay:12,15,0,1,1,5,4804,2,1,1;chopcothuat:2,9,3,2,0,0,4305,0,0,1;chuarung:12,16,1,1,1,1,4308,0,0,1;chubao:8,13,1,1,0,4,4292,1,1,1;chuhien:3,15,3,2,0,4,6336,1,1,1;chuotchuivuong:7,2,0,2,0,4,5328,1,1,1;chutruongnu:11,16,3,0,1,5,5321,2,1,1;cogiapnhen:10,15,1,2,1,0,4288,0,0,1;cohoang:6,18,0,2,0,3,4800,2,1,1;cohoangvocuc:5,16,3,2,0,5,5312,1,1,1;comaychien:10,16,3,2,0,5,4292,1,1,1;condoi:8,16,2,1,1,4,4289,1,1,3;congchuacongnghe:8,13,2,2,0,3,4296,0,1,1;conhan:5,16,0,1,1,5,5312,1,1,1;conhansu:5,2,0,1,0,5,4288,1,1,0;cosi:12,16,3,2,0,5,4292,1,1,1;cosinhthe:10,16,1,1,1,5,4592,1,1,1;cotnu:9,16,3,2,1,4,4294,2,1,0;cucquang:5,15,3,2,1,5,4289,2,1,0;cucquanggau:7,13,1,1,0,0,4288,0,0,1;cucquangung:6,15,0,1,1,0,4288,0,0,1;cuduto:6,5,2,1,0,4,4289,1,1,1;culongco:7,12,2,2,0,5,4288,2,1,0;cunemthantoc:0,9,1,0,1,4,4290,2,1,0;cunhan:12,13,1,0,1,5,4292,1,1,1;cuocthu:6,6,0,0,0,4,4292,1,1,2;cuongdomienvien:8,0,1,2,0,5,4291,2,1,2;cuongnhan:7,13,3,0,1,1,4288,0,0,1;cuongnhando:0,13,2,2,0,5,4305,1,1,1;cuongnhantienhoa:7,13,1,0,1,0,4305,0,0,1;cuongnhanxam:7,13,2,2,1,5,4336,1,1,1;cuongtri:12,2,0,0,0,4,4292,1,1,1;cuongtu:10,13,0,0,1,4,4310,1,1,1;cuongvuong:8,16,2,1,0,3,4288,0,1,2;cuthubien:8,13,0,2,1,3,4292,0,1,1;cuthudotham:12,13,0,1,0,0,4288,0,0,1;cuvocanhhungvi:6,13,2,1,1,4,4336,1,1,0;da:7,16,1,0,1,0,4288,0,0,1;dacvuquocgia:0,5,3,1,1,5,4310,1,1,1;dacvutruong:6,16,3,1,1,3,5328,0,1,1;dahanh:11,16,3,2,0,1,4292,0,0,1;dahon:11,15,1,2,0,0,4288,0,0,1;daibay:6,16,0,2,1,0,4289,0,0,1;daidoan:5,13,2,0,0,0,5331,0,0,1;dainao:8,19,1,0,1,3,4800,0,1,3;daitaxacsong:3,16,1,2,0,5,4292,1,1,0;dakhong:7,15,0,0,1,0,4288,0,0,1;dakhonggian:11,16,0,0,1,0,4288,0,0,1;dakhuc:6,13,1,2,1,5,4292,2,1,1;dalinhhon:11,16,1,0,1,0,4289,0,0,1;daluc:7,9,3,0,1,0,4292,0,0,1;damquai:2,16,2,1,0,4,4310,1,1,2;dannguoi:7,6,0,2,0,4,4288,1,1,1;daodo:5,15,3,0,1,0,4288,0,0,1;daonghich:6,16,2,1,1,4,4288,1,1,3;daothosan:10,0,2,0,0,1,4288,0,0,1;dasucmanh:7,9,0,1,0,0,4296,0,0,1;datam:7,2,0,0,0,0,4288,0,0,1;datamtri:7,15,3,2,0,0,4292,0,0,1;dathep:10,16,0,2,0,3,4294,0,1,1;dathoi:7,15,2,2,0,0,4304,0,0,1;dathoigian:7,15,3,0,1,0,4800,0,0,1;dathuc:7,16,3,2,1,0,4288,0,0,1;dathuctai:7,18,0,2,0,0,4800,0,0,1;dathuongnu:4,0,2,2,0,5,4288,1,1,1;datientri:7,16,0,1,1,4,4292,1,1,1;daubay:6,16,2,2,0,5,4289,1,1,1;daudanthieunu:10,6,3,0,0,3,4292,2,1,1;dauto:5,2,2,0,0,3,4288,0,1,1;dauvuong:6,16,0,0,0,4,4545,1,1,3;deonhan:3,15,2,2,1,1,4292,0,0,1;deonhansokhai:6,16,1,2,1,5,4338,1,1,1;diaba:7,1,2,1,1,4,4288,1,1,1;dianang:4,16,1,0,1,1,4304,0,0,1;dichcuongcot:4,13,3,1,0,5,6344,1,1,0;dichdo:9,2,3,0,0,4,5328,1,1,0;dichnu:3,15,2,0,0,3,4294,0,1,1;diennhan:2,9,0,2,1,3,4305,0,1,1;diennu:2,2,2,0,1,5,4307,1,1,1;dihien:12,16,3,2,1,5,4307,1,1,1;diphapsu:11,16,3,0,0,1,4288,0,0,1;diphaptoithuong:6,0,0,0,1,5,5313,1,1,1;docdich:3,15,0,2,1,5,4289,1,1,1;docnhan:3,15,3,0,0,1,4288,0,0,1;docnhanchihuy:10,0,0,0,1,3,5328,0,1,1;docnhantienhoa:3,15,1,0,1,0,4306,0,0,1;docnu:3,13,1,0,1,3,5568,0,1,1;docnutrang:3,15,1,2,1,5,4800,2,1,1;docxanu:3,4,3,0,0,3,4290,0,1,1;dothan:5,13,3,0,0,5,4292,1,1,1;duatrehoang:9,16,0,0,1,4,4292,1,1,2;duclongnhan:8,2,2,2,1,3,4288,0,1,2;gangchandong:8,16,3,2,0,0,4305,0,0,1;giacdausi:2,8,1,1,1,4,4288,1,1,1;giacnguu:2,16,3,0,1,4,5332,1,1,2;giacquannhen:3,15,3,1,1,4,4304,1,1,1;giaohutmau:9,0,2,2,1,0,4288,0,0,1;giaosutam:5,0,0,2,0,1,4292,0,0,1;giapchongcuong:10,13,1,2,0,1,4288,0,0,1;giapcuuho:10,15,3,1,1,3,4289,0,1,1;giapdam:10,6,2,1,0,5,4292,1,1,1;giaphon:10,4,3,0,0,1,4292,0,0,1;giaphuydiet:10,24,0,1,0,3,4288,0,1,1;giocothuat:6,15,2,2,0,0,4288,0,0,1;hacbaovuong:4,13,0,2,0,3,4296,0,1,1;hacdich:4,14,2,2,0,3,4288,0,1,1;hacdichbinh:4,2,2,0,1,5,4288,1,1,0;hacdiemchua:4,13,1,0,1,5,5824,1,1,1;hackiem:10,0,0,1,0,0,4292,0,0,1;hackysi:4,1,2,0,0,4,5316,1,1,0;hacmieu:4,16,3,2,1,3,4288,0,1,1;hacthachtuong:0,13,1,2,1,4,4308,1,1,0;hacthan:4,13,2,2,1,3,4292,0,1,1;hacthiet:4,15,2,2,0,1,4804,0,0,1;hacthuatsi:4,2,2,1,1,5,4560,1,1,1;hapkinh:8,2,3,1,0,4,4292,1,1,1;haplucchiare:4,15,3,0,0,5,4304,1,1,1;haplucnu:5,16,0,0,1,3,4288,0,1,1;hapnangthu:7,3,1,2,0,1,4292,0,0,1;hapthunhan:5,13,0,2,1,3,4288,0,1,1;hauduethoikhong:11,16,3,2,1,4,6096,1,1,0;heonhen:3,5,3,1,1,3,4544,0,1,1;hienthanvangioi:4,15,0,2,1,0,4289,0,0,1;ho:12,12,2,1,1,0,4288,0,0,1;hoamavuong:0,16,2,1,1,5,4292,1,1,1;hoangngoc:5,16,0,0,0,4,4804,1,1,0;hoanhan:0,16,1,2,1,3,4300,0,1,1;hoanhanmay:0,2,2,2,1,5,4308,1,1,1;hoanhansokhai:0,16,3,2,1,5,4297,1,1,1;hoasat:9,13,2,1,0,5,4292,1,1,1;hoasu:0,16,2,0,1,4,6352,1,1,0;hoathuatnu:0,13,0,0,0,5,5316,1,1,1;hoatinhnu:0,16,2,0,0,5,4316,1,1,0;hoavatnu:6,16,2,2,1,5,4304,2,1,1;hongnutinhquai:5,2,2,0,1,5,4289,1,1,1;hongphuthuy:8,17,2,1,1,1,4288,2,0,1;hongtam:10,3,0,2,1,5,4560,2,1,1;hongve:9,16,1,1,1,5,4288,2,1,1;honxuatkhieu:11,16,2,1,0,4,4288,1,1,0;hopamdiectai:8,16,1,1,1,4,4304,1,1,1;horangkiem:10,2,0,0,0,3,4336,0,1,1;hukhong:4,13,2,0,1,0,4288,0,0,1;huyenco:10,15,0,2,0,1,4292,0,0,1;huyenconu:10,2,1,2,1,5,4292,1,1,1;huyetbacsi:9,15,1,2,0,1,4292,0,0,1;huyetbatuoc:9,13,2,2,1,3,4292,0,1,1;huyetdich:3,14,3,1,1,1,4289,0,0,1;huyetdichhangxom:9,15,1,2,1,5,4289,2,1,0;huyetmenu:9,15,2,1,0,5,4304,2,1,1;huyetsatvuong:9,0,2,1,1,5,4336,1,1,1;huyettinhquyen:9,2,1,1,0,5,4288,1,0,1;huyettruonglao:9,13,3,0,0,5,4292,1,1,1;hyvong:4,16,0,0,0,5,4820,1,1,1;kechinhphatthoigian:10,13,1,0,0,5,4304,1,1,1;kenken:6,12,3,1,1,1,4292,0,0,1;kenuotsao:4,13,1,2,0,5,4288,2,1,1;kenuotsaosokhai:4,13,3,0,1,5,4292,1,1,1;kequansat:9,13,3,2,0,1,4288,0,0,1;kerinh:4,1,1,0,0,5,5328,1,1,1;kesanga:5,15,2,2,0,5,4336,1,1,0;ketrungphat:4,5,1,2,0,1,4292,0,0,1;ketudao:6,16,3,0,1,3,4292,0,1,2;kevocam:4,16,0,1,0,5,4292,1,1,1;khientuong:10,3,3,1,0,0,4292,0,0,1;khinhdich:3,15,2,1,1,5,4289,1,1,1;khisatthu:9,15,3,1,1,4,4289,1,1,1;khitrang:12,2,1,0,0,3,4292,0,1,1;khoibang:1,15,0,1,0,0,4308,0,0,1;khoinguyenvuong:12,6,2,2,1,5,4292,1,1,1;khoithit:9,2,2,2,0,4,4288,1,1,1;khuonmauchu:10,10,2,0,1,3,5312,0,1,1;khuyendichchuyen:3,2,3,1,1,3,4544,0,1,1;khuyenduhanh:7,16,2,0,1,1,4292,0,0,1;kiemlongnhan:10,0,1,2,0,3,4288,2,1,1;kiemnupho:10,0,2,2,1,3,4304,0,1,1;kiemnuuminh:4,0,2,1,0,3,4288,2,1,1;kiemphuchy:10,6,1,0,1,0,4292,0,0,1;kiemquyen:10,0,0,2,1,5,4800,2,1,1;kiemsu:10,0,0,0,0,1,4304,0,0,1;kiengiap:10,0,3,2,1,1,4292,0,0,1;kientho:10,9,2,0,1,0,4288,0,0,1;kimcuongxa:7,5,0,2,1,5,4294,1,1,0;kimthuatsi:10,2,1,1,0,3,4289,0,1,1;kimve:10,13,1,1,1,3,4802,0,1,1;kinhnhan:8,5,0,2,1,3,4292,0,1,1;kychu:11,16,0,1,0,4,4288,1,1,0;kydong:10,16,3,2,1,5,4305,1,1,1;kynu:4,15,3,2,0,4,4308,1,1,1;kysibaitu:12,2,3,1,0,5,5332,2,1,1;kysichienxa:10,15,0,0,0,5,4292,1,1,1;kysidaoquoc:8,0,2,0,0,5,4310,1,1,0;kysidichkhuyen:3,13,2,0,0,5,4308,2,1,0;kysidoibao:6,16,3,0,0,5,4308,1,1,1;kysiho:8,0,2,2,0,5,4292,1,1,1;kysinguyetyeu:12,0,2,2,0,5,4292,2,1,1;kysitudich:3,9,3,1,0,5,4292,1,1,1;kysituduc:4,13,0,2,1,5,6340,1,1,0;kysivuottu:9,12,1,1,0,5,4292,2,1,1;lamconu:12,5,3,0,0,3,4292,0,1,1;lamkynhan:8,13,0,0,1,1,4292,0,0,1;lamthu:12,16,0,1,0,3,4304,0,1,1;langthan:5,13,3,0,1,5,6592,2,1,0;lanvuong:4,13,3,0,0,5,5332,1,1,1;laogay:9,16,3,1,1,4,4289,1,1,1;laonhen:3,15,2,2,0,5,4804,1,1,0;laophuthuy:8,15,2,2,1,3,4288,0,1,1;linhbattu:1,0,3,1,0,3,4296,0,1,1;linhchindau:3,15,0,1,0,5,4288,1,1,1;linhdondoc:3,0,3,1,0,5,4544,1,1,1;linhduoc:12,16,0,1,1,5,6336,1,1,0;linhgaccuoi:12,1,0,1,0,4,4546,2,1,1;linhgacmay:10,0,2,0,1,1,5312,0,0,1;linhmuadong:1,0,2,1,0,0,4288,0,0,1;linhthuelammom:7,2,2,2,0,4,6353,1,1,1;linhtuonglai:12,22,2,1,1,1,4288,0,0,1;loantuong:9,16,0,1,1,5,4308,1,1,1;loanxa:6,3,2,1,0,4,4308,1,1,1;loda:7,2,2,2,0,3,4288,0,1,1;loithan:2,9,1,0,1,3,4288,0,1,1;longbattu:0,5,2,2,1,5,4289,2,1,1;longchu:7,13,2,1,1,4,4800,1,1,0;longdo:0,13,0,0,1,1,4292,0,0,1;longuclua:0,10,2,1,0,5,4561,1,1,0;luahacdiem:4,15,3,1,1,0,4290,0,0,1;lucac:4,13,0,1,0,5,4800,1,1,1;lucnu:7,16,1,2,0,3,4292,0,1,1;lucsatnu:10,0,0,2,0,1,4801,0,0,1;lucsi:7,16,3,0,1,1,4292,0,0,3;lucthan:6,13,3,0,0,3,4292,0,1,1;lukhachtroi:6,1,1,1,1,4,6352,1,1,0;madienloi:2,2,1,1,1,4,4288,1,1,0;manhkiemquy:4,0,0,1,1,0,4296,0,0,1;matoc:11,2,3,2,1,3,4288,0,1,1;matocdautien:11,16,2,1,1,4,4288,1,1,0;matocvutru:11,16,0,2,0,5,4288,2,1,1;matthamnu:12,16,2,1,1,1,4289,0,0,1;matthethientuyen:10,2,3,1,0,0,4288,0,0,1;matthevuong:8,16,2,2,1,1,4289,0,0,1;matvumuoiba:5,16,3,0,0,1,5312,0,0,3;mauhambay:6,16,3,1,0,3,4288,0,1,1;mauhau:12,15,3,1,1,5,5312,1,1,1;mauthoikhong:11,16,1,1,0,4,5331,1,1,0;maybaycon:6,16,0,2,0,0,4288,0,0,1;maydotam:10,16,0,2,1,3,4292,0,1,1;maymannu:6,2,0,0,0,1,4292,0,0,1;maynuotthoigian:11,16,2,1,0,5,4288,2,1,0;maythichnghi:10,13,2,0,1,4,4288,1,1,0;mehoacnu:11,16,0,1,1,1,4288,2,0,1;mieunuot:7,13,0,0,1,3,4820,0,1,1;mieuthan:10,15,1,0,1,3,4288,0,1,3;minhhau:4,15,0,2,0,3,6352,0,1,1;mintuxa:10,5,3,2,1,0,4290,0,0,1;mocnhan:12,15,3,1,0,1,4801,0,0,1;monghoang:4,12,0,0,0,4,5312,1,1,1;muoikiepnu:4,2,3,1,1,5,7360,1,1,1;namtuocamthuat:4,2,1,1,1,3,4336,0,1,1;namtuocmatna:6,2,1,0,0,5,4304,2,1,1;nangtocdo:6,15,2,0,1,5,4288,1,1,1;nanhkiem:9,0,3,2,0,1,4304,0,0,1;naomay:10,9,2,0,0,3,4288,0,1,1;ngankiemsi:10,0,1,2,1,3,4288,0,1,1;nganluot:8,16,3,1,1,3,4305,0,1,1;nganluotsokhai:12,13,1,2,0,4,4288,1,1,1;ngansat:9,1,2,0,0,5,4288,1,1,1;ngantoc:6,16,2,1,0,1,4292,0,0,1;nghichtuvuong:10,9,1,2,1,5,4816,2,1,0;nghithuctrieuhoii:4,16,1,2,0,0,4288,0,0,1;nghithuctrieuhoiii:4,16,2,0,0,0,4288,0,0,1;nghithuctrieuhoiiii:4,13,1,1,1,0,4800,0,0,1;ngunhan:10,16,3,0,0,4,4289,1,1,3;nguoisoidem:4,13,1,1,0,4,4292,1,1,0;nguoituyet:1,13,2,1,1,4,4308,1,1,0;nguuma:11,0,2,0,0,3,4544,0,1,1;nguumamienvien:11,0,1,2,1,4,4288,1,1,1;nguyetdong:10,19,0,0,0,1,5312,0,0,1;nguyetkysi:12,0,1,0,0,3,4304,0,1,1;nguyetlong:5,13,1,0,1,5,4304,1,1,0;nguyetlongnu:9,13,1,0,0,5,4305,1,1,1;nguyetthach:7,13,2,2,0,5,4308,1,1,1;nguyetthan:4,16,1,1,1,5,6336,1,1,1;nguyetthanbannguyet:4,15,0,0,0,0,6336,0,0,1;nguyetthantrangtron:6,13,0,2,0,0,6336,0,0,1;nguyetyeu:4,16,2,0,1,3,4290,0,1,1;nhaihinh:8,2,1,0,0,5,4292,1,1,2;nhannhenquai:3,15,1,1,0,5,4296,2,1,1;nhasuutam:8,2,0,1,0,1,5316,0,0,2;nhenbongdem:4,2,0,2,0,5,4816,1,1,1;nhencogiap:10,9,0,1,0,5,5361,1,1,1;nhendotham:3,15,3,0,1,5,6080,2,1,1;nhenhacdich:3,13,0,0,1,5,4560,2,1,1;nhenhauthe:10,15,0,1,1,3,4292,0,1,1;nhenlong:3,0,1,1,0,5,4289,1,1,1;nhenma:3,15,0,2,0,3,4288,0,1,1;nhenngaymoi:3,4,1,1,1,5,4292,2,1,1;nhennhan:3,5,0,2,0,3,4288,2,1,1;nhennoiloan:3,15,2,1,0,5,4292,2,1,1;nhennon:3,15,3,2,1,5,4545,2,1,0;nhennu:3,15,0,1,1,1,4290,2,0,1;nhenthuongdang:3,15,1,2,0,5,4308,1,1,1;nhentre:3,15,1,1,1,3,4308,0,1,1;niemluctu:11,16,3,1,0,4,4288,1,1,0;nokiem:10,0,2,2,1,4,4292,1,1,0;nubatuoc:10,16,1,2,1,4,5330,1,1,1;nucanve:10,2,0,2,0,1,4289,0,0,1;nuchienbathu:10,0,1,1,1,5,4289,1,1,1;nuchienthan:10,13,3,2,1,1,4304,0,0,1;nuchuarung:12,16,1,0,1,3,4816,0,1,1;nuco:10,15,1,1,0,5,4544,1,1,1;nucuongnhan:7,0,1,0,1,3,4308,0,1,1;nuhoanghonmang:6,15,3,2,0,5,5332,1,1,1;nuhondoc:3,13,1,1,1,0,4292,0,0,1;nuhongtam:10,3,0,0,1,5,4304,2,1,1;nuloimienvien:2,9,2,0,0,5,4291,2,1,1;nuloithan:2,9,1,2,0,3,4304,2,1,1;nuphanquan:4,9,2,1,0,4,4308,1,1,1;nuthanchienma:4,16,2,1,1,3,4800,0,1,1;nuthantien:10,3,3,2,0,5,5312,2,1,1;nuthuantuong:10,13,1,0,1,5,4292,1,1,1;ongnu:12,15,1,0,0,3,4288,0,1,1;ongnutienhoa:12,15,1,2,1,0,4290,0,0,1;ongvang:12,15,3,0,1,3,4290,0,1,1;phankysi:4,16,2,2,1,5,4308,1,0,1;phanquanbua:10,9,2,1,1,3,4292,0,1,1;phanquanthiengioi:5,2,1,2,1,5,4305,1,1,1;phanthan:4,15,0,1,1,1,5828,0,0,1;phaodaimay:10,5,0,2,1,5,5840,1,1,0;phaohoanganha:10,5,0,0,0,5,4292,1,1,1;phaohoanu:12,5,2,2,0,1,4800,0,0,1;phapsudaomong:11,16,1,2,0,5,5312,1,1,1;phapsugia:11,15,3,1,1,5,5316,1,1,1;phatuong:7,15,1,1,0,3,4801,0,1,3;phatuongsinhlinh:11,15,2,0,1,5,4289,1,1,0;phethachnu:7,16,2,1,0,3,4800,0,1,1;phiconamcanh:6,13,2,1,0,3,5332,0,1,1;phitieuhoi:5,1,0,0,0,5,4292,1,1,0;phiung:2,16,3,1,1,3,4304,0,1,2;phiungtre:6,16,2,0,1,5,4308,1,1,1;phochihuy:7,0,1,1,0,3,5328,0,1,1;phonghiem:10,25,3,1,0,4,4544,2,1,0;phonglinhnu:6,15,2,1,1,5,4289,2,1,1;phongnu:6,13,1,0,1,3,4288,2,1,1;phuonghoa:0,16,0,0,1,4,6336,1,1,0;phuongtamnu:0,16,1,2,0,3,4804,0,1,1;phuthan:6,15,2,0,0,1,4288,0,0,1;phuthuydamlay:8,16,1,1,0,4,4561,1,1,1;phuthuytre:11,13,0,2,1,5,4305,1,1,1;quadao:6,0,1,2,1,4,4305,1,1,0;quaituong:12,13,2,0,1,1,4288,0,0,1;quaituongtienhoa:12,13,0,0,0,0,4310,0,0,1;quandoanmotnguoi:4,5,2,0,1,4,4288,1,1,0;quangca:5,16,0,2,0,3,4292,0,1,1;quangchuy:4,1,0,2,0,3,4292,0,1,1;quangpho:10,13,0,2,0,1,4289,2,0,3;quanthoigian:11,13,1,1,0,3,4308,0,1,1;quy:4,12,1,2,1,0,4288,0,0,1;quyensu:5,6,3,1,0,1,4288,2,0,1;quyensuthaphoan:7,6,3,2,0,5,4288,1,1,1;quytu:4,16,2,1,1,4,4292,1,1,1;ranlucnu:3,15,0,0,0,3,4288,0,1,1;riubao:6,9,0,1,0,0,4296,0,0,1;roidich:3,16,2,1,1,4,4546,1,1,1;saotrongdau:9,15,1,1,0,5,4308,2,1,1;satvuong:9,11,2,2,1,1,4304,2,0,1;sautham:8,16,0,0,0,5,4288,1,1,1;sieudihinh:5,16,1,2,1,3,4292,0,1,3;sieusaokhonglo:12,13,2,0,0,4,4288,1,1,3;soc:12,16,1,2,1,0,4288,0,0,1;socheo:9,0,1,2,1,3,4292,0,1,1;socnu:12,21,0,2,1,1,4800,2,0,1;sodo:9,16,0,2,1,3,4292,0,1,1;soidomienvien:12,13,1,2,1,5,4289,1,1,1;soinu:12,12,0,2,1,1,4289,0,0,1;sokhong:10,15,1,2,0,3,4288,0,1,3;songchuynu:9,1,0,2,0,1,4304,2,0,1;songnu:8,16,1,2,1,3,4336,0,1,1;songsinhtamlinh:11,2,1,1,0,5,5328,1,1,1;suphunhai:4,16,2,1,0,3,4288,0,1,1;tackehoa:12,15,2,2,1,4,4288,1,1,1;tamkiemmienvien:10,0,1,0,0,5,4304,1,1,1;tamkiemnu:10,0,3,0,0,3,4305,0,1,1;tamlinhtu:11,15,2,2,0,5,4544,2,1,1;tammanu:4,2,0,1,1,5,4288,1,1,0;tamtudo:5,16,1,1,0,5,4292,1,1,3;tamtuquai:10,16,1,0,0,1,4292,0,0,1;tantinh:5,15,3,2,0,1,6336,0,0,1;tasu:4,17,0,1,1,1,5824,0,0,1;taymaynu:10,1,1,2,1,1,4288,0,0,1;taymaynutienhoa:10,13,2,2,1,0,4305,0,0,1;taysatnu:10,9,0,1,1,5,5316,1,1,1;taythep:10,16,2,2,1,1,6336,0,0,1;tegiap:7,16,2,0,0,1,4800,0,0,1;tenaxit:3,4,1,2,1,0,4288,0,0,1;tenmoc:6,3,2,1,0,0,4288,0,0,1;tenthuong:10,4,3,2,0,0,4801,0,0,1;tenthuphong:7,3,3,2,0,0,4292,0,0,1;thachlucnu:7,16,3,1,0,5,4308,1,1,0;thachnhan:7,2,0,1,0,1,4288,0,0,1;thachquai:7,16,3,1,1,1,4288,0,0,1;thachquaisokhai:7,13,1,1,1,5,4289,2,1,1;thachquaitienhoa:7,9,1,1,1,0,4290,0,0,1;thamtunu:6,16,1,2,0,1,4289,0,0,1;thanai:12,16,0,2,1,5,4292,1,1,1;thandong:10,13,2,2,0,5,4288,1,1,1;thanhkiem:5,0,3,2,1,0,4308,0,0,1;thanhkiemnu:10,0,1,1,0,1,4804,0,0,1;thanlannhan:9,12,3,0,0,1,4294,0,0,1;thantho:2,10,0,2,0,4,4338,1,1,2;thantien:10,3,0,2,0,1,4289,0,0,1;thantocnu:6,16,2,1,1,5,4288,1,1,1;thaphoan:5,16,1,1,1,0,4289,0,0,1;thaphoankhaimo:5,16,3,0,1,0,4289,0,0,1;thepnhan:10,16,3,1,1,1,4294,0,0,1;thetdich:3,15,1,0,0,5,4292,2,1,1;thiemnu:11,2,3,2,0,5,4304,1,1,0;thiendien:5,16,3,1,1,3,4288,0,1,3;thienduc:6,5,3,1,1,1,4804,0,0,1;thienlenhnu:10,2,2,2,0,3,4308,0,1,1;thienngaden:4,15,2,2,1,5,4560,1,1,0;thienthantimkiem:5,0,2,1,1,5,5824,1,1,1;thietaiquoc:4,0,3,2,1,5,5840,1,1,1;thietgiap:10,16,0,0,0,1,4300,0,0,1;thietgiapthuongdang:10,16,2,1,1,5,4318,1,1,1;thietquyen:4,6,2,0,1,1,4288,0,0,1;thiettam:5,1,0,1,0,1,4289,2,0,1;thietthieunien:10,10,3,1,1,4,4288,1,1,0;thieutachienthang:10,0,2,0,0,4,5312,1,1,1;thoicothuat:6,16,1,0,0,0,5313,0,0,1;thongkho:11,13,0,0,1,4,4804,1,1,0;thoren:10,10,0,2,0,1,4289,0,0,1;thosan:6,3,3,2,0,1,4292,0,0,2;thosanhuyetthach:9,16,0,2,0,4,4292,1,1,0;thosanmay:10,16,2,0,0,3,7360,0,1,1;thuantuong:10,0,2,1,0,1,4292,0,0,1;thuanung:6,9,3,1,0,5,4288,2,1,1;thuhoang:5,0,3,0,1,0,4288,0,0,3;thukieu:6,15,0,0,1,1,4288,2,0,1;thukydungcam:2,16,2,0,0,5,4305,1,1,2;thuthu:5,16,1,0,1,3,4292,0,1,1;thuyba:8,13,2,1,1,3,4288,0,1,1;thuyhau:8,5,2,2,0,5,4289,2,1,1;thuyngannu:10,16,2,0,1,4,4292,1,1,0;thuynhan:8,2,3,2,1,4,4304,1,1,0;thuynu:8,16,0,2,1,5,4308,1,1,1;thuytoquyen:8,7,1,2,1,4,4545,1,1,0;thuyvuong:8,5,3,2,1,1,4292,0,0,1;tienbui:5,2,1,0,0,4,4304,1,1,0;tienhoasu:5,16,0,2,1,5,4288,1,1,1;tiensigamma:3,16,2,0,0,5,4304,1,1,0;tieukhonglo:2,13,0,2,0,5,4304,1,1,2;tieulong:7,13,2,1,0,5,4818,2,1,1;tieuthu:10,3,1,0,0,5,4305,1,1,1;tieuvuong:4,2,1,2,1,1,4304,0,0,1;tinhchua:6,13,3,1,0,1,4801,0,0,1;tinhchuathaiduong:0,13,1,1,1,5,4305,1,1,0;tinhquangnu:4,15,1,2,0,3,4292,0,1,1;tinhquyennu:5,21,1,2,1,1,4289,0,0,1;toaansong:7,16,0,0,0,4,4292,1,1,3;toclua:0,16,1,0,1,5,4292,1,1,0;tocnuhoang:5,21,3,1,0,1,4289,0,0,1;toctu:2,16,2,1,0,5,4308,1,1,2;tonu:12,16,3,0,0,3,4292,2,1,1;trathan:11,2,0,0,1,4,4336,1,1,0;trinu:1,15,1,0,0,5,4321,1,1,1;trolymay:10,13,2,1,0,5,4292,1,1,1;trum:6,16,2,0,0,3,4292,0,1,1;trummu:4,16,0,2,0,3,5312,0,1,1;trumthanhpho:4,15,2,0,1,5,4308,1,1,1;trumtruyenhinh:12,13,1,0,0,3,4292,0,1,1;trungchien:12,16,3,1,0,4,4292,1,1,0;trungcon:12,15,2,2,0,0,4288,0,0,1;trungmau:10,13,2,1,1,3,4800,0,1,3;trungphatcogiap:10,13,3,1,1,5,4308,1,1,1;trungvuong:3,13,0,2,0,4,4288,1,1,0;tunguyennu:7,16,3,0,0,3,4288,0,1,1;tunu:10,5,3,2,0,3,4304,2,1,1;tuongquan:10,0,3,1,0,5,4304,1,1,1;tuthan:9,15,0,2,0,3,4308,0,1,2;tuthanmienvien:4,11,3,1,0,5,6336,2,1,0;tutraonu:4,12,3,1,0,3,4288,2,1,1;tuvuong:7,16,1,0,0,3,4304,0,1,1;tuyetve:1,15,2,0,0,3,5312,0,1,1;ungsao:5,16,0,1,0,4,4289,1,1,0;ungtoi:4,2,1,0,1,4,4292,1,1,0;vetcandoc:3,2,3,0,0,0,4288,0,0,1;vetmattroi:5,16,1,0,0,1,4305,0,0,1;virutcosinh:10,15,2,0,1,5,5312,2,1,1;vitthamtu:8,2,0,2,0,3,4292,0,1,2;vohannhan:7,13,2,1,1,1,4292,0,0,1;vonganh:4,15,0,0,1,3,4804,0,1,1;vouy:11,5,0,1,1,3,4292,0,1,0;vouyamdia:4,2,0,0,0,5,4289,1,1,1;vuabong:4,16,2,2,0,3,4800,0,1,1;vualunren:8,2,2,2,1,4,5568,1,1,2;vuarutkiem:7,0,1,2,1,5,4288,1,0,1;vuathoigian:10,3,2,0,0,5,4288,1,1,1;vuatienhac:4,2,3,1,0,5,4816,1,1,1;vukhih:0,16,2,2,0,5,4306,1,1,1;vukhix:12,13,0,2,1,5,4292,1,1,1;vuongbathu:5,15,3,1,0,5,4289,1,1,1;vuongtrieutailai:5,2,3,2,0,0,4305,0,0,1;vuotnu:12,12,0,1,0,4,6356,1,1,0;vuotsoi:0,12,0,0,0,1,6337,0,0,1;xaccunhan:12,16,3,0,1,4,4289,1,1,3;xacdao:10,0,2,2,0,5,5312,1,1,1;xacdathep:10,16,1,2,0,4,4288,1,1,1;xacdeo:7,16,1,1,0,5,5313,1,1,1;xachacdich:4,14,2,0,0,5,4289,1,1,1;xachacmieu:4,15,1,0,0,5,4288,1,1,1;xachongphuthuy:8,15,2,0,0,5,4804,1,1,1;xackimve:10,15,3,1,0,4,4289,1,1,1;xacmay:10,14,0,0,1,1,4288,0,0,1;xactantinh:12,16,1,2,0,5,6337,1,0,1;xactinhquang:5,14,3,1,0,5,4545,1,1,0;xanang:5,3,1,2,0,3,4305,0,1,1;xanhan:9,16,1,0,0,4,5568,1,1,2;xebay:6,13,3,2,1,4,4545,1,1,1;xichxuctu:10,16,1,1,0,3,4292,0,1,1;xucgiacnu:4,19,2,1,1,1,5824,0,0,1;xuyentuongnu:6,16,3,2,0,3,4292,0,1,3;yeuhau:4,16,3,2,0,5,4289,1,1,1;yeutinhcam:4,23,3,2,1,1,4288,0,0,1;yeutinhluc:7,23,3,0,0,3,4288,0,1,1";
/*FXT:KET_THUC*/
(function () {
  "use strict";
  const T = {}, WHYN = ["man", "kw", "text", "hash", "tay"];
  for (const r of FXT_RAW.split(";")) {
    const i = r.indexOf(":"), v = r.slice(i + 1).split(",").map(Number);
    T[r.slice(0, i)] = { e: FXT_EL[v[0]], m: FXT_MOT[v[1]], c2: v[2], q: v[3], nh: v[4], t: v[5], p: v[6], em: v[7], snd: v[8], why: WHYN[v[9]] };
  }
  /* màu phụ thứ 4 (bổ sắc) theo hệ */
  const C2X = FXT_C2X, TIERC = FXT_TIERC; /* màu phụ thứ 4 (bổ sắc theo hệ) + màu bậc: định nghĩa trong khối sinh tự động */
  /* mô-típ -> hình đầu luồng (SVG dự phòng) */
  const MOT2GL = { slash_cleave: "blade", throw_daggers: "dagger", throw_cards: "card", shoot_royal_bow: "arrow", shoot_venom_bow: "arrow", shoot_cannon: "orb",
    melee_fist: "fist", water_fist: "fist", arena_ko: "fist", sky_hammer: "hammer", forge_strike: "hammer", yama_judge: "hammer", claw_rip: "fang", beast_bite: "fang",
    beast_devour: "fang", venom_hex: "drop", mystic_seal: "rune", talisman_summon: "rune", kite_summon: "leaf", mirror_copy: "rune", feather_copy: "leaf",
    persimmon_gift: "leaf", banyan_steal: "leaf", goblin_flip: "card", destroyer_beam: "bolt", shield_bash: "shield" };
  const ROT = { blade: 1, dagger: 1, arrow: 1, bolt: 1, drop: 1 };
  const GL = {
    blade: `<path d="M-18 0L-10-4H14L19 0L14 4H-10Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.6"/><path d="M-12 0H16" stroke="var(--b)" stroke-width="1"/>`,
    dagger: `<path d="M-16-5L-6-7H10L15-5L10-3H-6Z M-16 5L-6 3H10L15 5L10 7H-6Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.3"/>`,
    card: `<rect x="-9" y="-13" width="18" height="26" rx="3" fill="var(--a)" stroke="var(--b)" stroke-width="2" transform="rotate(-14)"/><circle r="4" fill="var(--b)"/>`,
    arrow: `<path d="M-18-1.5H8V-6L18 0L8 6V1.5H-18Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.4" stroke-linejoin="round"/><path d="M-18-5L-13 0L-18 5" fill="none" stroke="var(--b)" stroke-width="2"/>`,
    orb: `<circle r="11" fill="var(--a)" stroke="var(--b)" stroke-width="2.5"/><circle cx="-3" cy="-3" r="3.5" fill="var(--b)"/>`,
    fist: `<rect x="-11" y="-9" width="22" height="18" rx="6" fill="var(--a)" stroke="var(--b)" stroke-width="2"/><path d="M-5-9V-2M1-9V-2M7-9V-2" stroke="var(--b)" stroke-width="1.6"/>`,
    hammer: `<rect x="-12" y="-11" width="24" height="10" rx="2.5" fill="var(--a)" stroke="var(--b)" stroke-width="1.8"/><rect x="-2" y="-1" width="4" height="13" rx="1.5" fill="var(--b)"/>`,
    fang: `<path d="M-12-10Q-4 0-10 12M-2-12Q6 0 0 12M8-10Q16 0 10 12" fill="none" stroke="var(--a)" stroke-width="4" stroke-linecap="round"/><path d="M-12-10Q-4 0-10 12M-2-12Q6 0 0 12M8-10Q16 0 10 12" fill="none" stroke="var(--b)" stroke-width="1.4" stroke-linecap="round"/>`,
    drop: `<path d="M-16 0C-6-9 6-9 15 0C6 9-6 9-16 0Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.8"/><circle cx="5" r="3" fill="var(--b)"/>`,
    rune: `<circle r="12" fill="none" stroke="var(--a)" stroke-width="3"/><path d="M0-9L2.6-2.6L9 0L2.6 2.6L0 9L-2.6 2.6L-9 0L-2.6-2.6Z" fill="var(--b)"/>`,
    leaf: `<path d="M-14 8C-12-8 2-14 14-12C12 2 2 12-14 8Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.6"/><path d="M-12 6L10-9" stroke="var(--b)" stroke-width="1.2"/>`,
    bolt: `<path d="M-16 2L-2-8V-2H16L2 8V2Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.5" stroke-linejoin="round"/>`,
    shield: `<path d="M0-13L11-8V0C11 7 6 11 0 13C-6 11-11 7-11 0V-8Z" fill="var(--a)" stroke="var(--b)" stroke-width="2"/>`
  };
  /* biểu tượng tình huống (SVG dự phòng; khi có atlas thì dùng ô ic_*) */
  const IC = {
    clock: `<svg viewBox="-24 -24 48 48"><path d="M-12-20H12M-12 20H12" stroke="var(--b)" stroke-width="3.5" stroke-linecap="round"/><path d="M-10-18C-10-6 10-6 10 0C10 6-10 6-10 18H10C10 6-10 6-10 0C-10-6 10-6 10-18Z" fill="rgba(10,20,40,.55)" stroke="var(--a)" stroke-width="2.6" stroke-linejoin="round"/><path d="M-6 16L0 6L6 16Z M-5-12H5L0-5Z" fill="var(--a)"/></svg>`,
    gem: `<svg viewBox="-24 -24 48 48"><path d="M0-20L16-4L0 20L-16-4Z" fill="var(--a)" stroke="var(--b)" stroke-width="2.4" stroke-linejoin="round"/><path d="M-16-4H16M0-20L-6-4L0 20L6-4Z" fill="none" stroke="var(--b)" stroke-width="1.2" opacity=".85"/></svg>`,
    gemcrack: `<svg viewBox="-24 -24 48 48"><path d="M0-20L16-4L0 20L-16-4Z" fill="var(--a)" stroke="var(--b)" stroke-width="2.4" stroke-linejoin="round" opacity=".8"/><path d="M-3-18L3-6L-4 2L4 10L-1 19" fill="none" stroke="#1a0410" stroke-width="2.6"/></svg>`,
    heart: `<svg viewBox="-24 -24 48 48"><path d="M0 19C-14 9-20 1-20-7C-20-14-14-19-8-19C-4-19-1-17 0-14C1-17 4-19 8-19C14-19 20-14 20-7C20 1 14 9 0 19Z" fill="var(--a)" stroke="var(--b)" stroke-width="2.6" stroke-linejoin="round"/><path d="M-12-9C-12-12-10-14-7-14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></svg>`,
    lotus: `<svg viewBox="-24 -24 48 48"><path d="M0 14C-4 4-4-8 0-18C4-8 4 4 0 14Z M0 14C-8 8-14 0-14-10C-6-8-2 2 0 14Z M0 14C8 8 14 0 14-10C6-8 2 2 0 14Z M0 14C-10 14-18 10-21 2C-12 0-4 6 0 14Z M0 14C10 14 18 10 21 2C12 0 4 6 0 14Z" fill="var(--a)" stroke="var(--b)" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    gemdn: `<svg viewBox="-24 -24 48 48"><path d="M-6-20L8-6L-6 12L-20-6Z" fill="var(--a)" stroke="var(--b)" stroke-width="2" stroke-linejoin="round"/><path d="M14-4V16M8 10L14 17L20 10" fill="none" stroke="#7dffb0" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    gemup: `<svg viewBox="-24 -24 48 48"><path d="M-6-20L8-6L-6 12L-20-6Z" fill="var(--a)" stroke="var(--b)" stroke-width="2" stroke-linejoin="round"/><path d="M14 16V-4M8 2L14-5L20 2" fill="none" stroke="#ff5a6e" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    crack: `<svg viewBox="-30 -40 60 80" preserveAspectRatio="none"><path d="M-4-38L4-16L-8-2L6 10L-2 24L4 38M4-16L18-22M-8-2L-24 4M6 10L22 16" fill="none" stroke="var(--a)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M-4-38L4-16L-8-2L6 10L-2 24L4 38" fill="none" stroke="#fff" stroke-width="1.4" opacity=".75"/></svg>`,
    shards: `<svg viewBox="-40 -40 80 80"><circle r="15" fill="var(--a)" opacity=".45"/><circle r="8" fill="#fff" opacity=".6"/><g fill="var(--a)" stroke="var(--b)" stroke-width="1.2" stroke-linejoin="round"><path d="M-6-30L2-38L6-24Z"/><path d="M22-20L34-22L26-10Z"/><path d="M26 12L36 20L22 22Z"/><path d="M-4 28L4 38L-10 36Z"/><path d="M-30 14L-36 24L-22 22Z"/><path d="M-30-14L-38-22L-24-24Z"/><path d="M8-8L16-2L6 4Z"/><path d="M-12 2L-4 8L-14 12Z"/></g></svg>`,
    flame: `<svg viewBox="-24 -30 48 60"><path d="M0 26C-14 26-18 14-14 4C-11-4-4-6-6-18C2-14 6-6 4 2C8 0 10-6 9-12C16-4 18 6 14 14C11 22 6 26 0 26Z" fill="var(--a)" stroke="var(--b)" stroke-width="2" stroke-linejoin="round"/><path d="M0 22C-6 22-8 16-6 11C-4 7 0 7 0 1C4 5 6 10 5 14C4 19 3 22 0 22Z" fill="var(--b)" opacity=".85"/></svg>`,
    seal: `<svg viewBox="-50 -50 100 100"><circle r="44" fill="none" stroke="var(--a)" stroke-width="6"/><circle r="36" fill="none" stroke="var(--b)" stroke-width="3" stroke-dasharray="6 4"/><circle r="24" fill="var(--a)" fill-opacity=".22" stroke="var(--a)" stroke-width="3"/><path d="M0-44V-34M0 34V44M-44 0H-34M34 0H44M31-31L24-24M-31 31L-24 24M31 31L24 24M-31-31L-24-24" stroke="var(--b)" stroke-width="4"/><path d="M0-20L5.8-5.8L20 0L5.8 5.8L0 20L-5.8 5.8L-20 0L-5.8-5.8Z" fill="var(--b)" opacity=".9"/></svg>`,
    portal: `<svg viewBox="-50 -50 100 100"><circle r="44" fill="none" stroke="var(--a)" stroke-width="5" stroke-dasharray="14 6"/><circle r="33" fill="none" stroke="var(--b)" stroke-width="2.4"/><circle r="22" fill="var(--a)" opacity=".28"/><g stroke="var(--b)" stroke-width="2.4" stroke-linecap="round"><path d="M0-30L0-38M21-21L27-27M30 0H38M21 21L27 27M0 30V38M-21 21L-27 27M-30 0H-38M-21-21L-27-27"/></g></svg>`
  };

  const ok = () => typeof reduced === "undefined" || !reduced;
  const lo = () => window.FXLV === 0;
  const ff = () => !!(window.FFTURN && FFTURN.on);
  const ELs = () => (typeof ELD !== "undefined" ? ELD : {});
  const idOf = uid => { try { const c = uid > 0 ? anyC(uid) : null; return c ? (E.ab && E.ab(c)) || c.id : null; } catch (e) { return null; } };
  const baseIdOf = uid => { try { const c = uid > 0 ? anyC(uid) : null; return c ? c.id : null; } catch (e) { return null; } };

  /* ---- cấu hình ---- */
  function cfg(id) {
    const t = id && T[id];
    if (!t) return null;
    const D = ELs()[t.e] || ["#ffffff", "#ffd65a"];
    const c2 = [D[1], "#ffffff", TIERC[t.t] || "#ffd65a", C2X[t.e] || D[1]][t.c2] || D[1];
    return { id, e: t.e, c1: D[0], c2, m: t.m, gl: MOT2GL[t.m] || "rune", q: t.q, nh: t.nh, t: t.t, em: t.t >= 4 || t.em === 2, snd: !!t.snd, p: t.p, why: t.why, src: "the" };
  }
  const SITS = typeof FXT_SIT !== "undefined" ? FXT_SIT : [];
  /* cấu hình của thẻ cho một tình huống: nguyên mẫu × hệ × chữ ký thẻ (không có thẻ -> null: nơi gọi giữ hiệu ứng cũ) */
  function sit(id, k) { const c = cfg(id); if (!c) return null; return Object.assign(c, { k, proto: k, cell: k + "_" + c.e, tierCell: c.t >= 5 ? k + "_s5" : c.t === 4 ? k + "_s4" : k + "_tr" }); }

  /* ---- atlas ảnh (www/img/fx/fx.json) ----
     Định dạng: {"v":1,"tam":[{"f":"L01_tang.webp","n":4,"k":["tang_lua",…16 mã ô theo hàng, "" = bỏ trống]}, …]}
     Mỗi tấm vuông n×n ô (768² với n=4 -> ô 192px). Mã ô: <nguyên mẫu>_<hệ> | <nguyên mẫu>_tr|_s4|_s5 | ic_<biểu tượng> | em_<id thẻ>. */
  const ATL = { st: 0, m: {}, lz: {} };
  function atlasLoad() {
    if (ATL.st) return; ATL.st = 1;
    try {
      fetch("img/fx/fx.json").then(r => (r.ok ? r.json() : null)).then(j => {
        if (!j || !Array.isArray(j.tam)) { ATL.st = 3; return; }
        ATL.st = 2;
        /* chỉ nhận một tấm khi ảnh của nó tải được (thiếu tệp -> các ô của tấm đó dùng hình dự phòng) */
        /* gpu52: tấm nguyên mẫu (L01–L09) nạp ngay; tấm ấn ký (*_anky) chỉ nạp khi lần đầu cần một ô của nó
           (24 tấm 768² giải mã ≈ 57 MB -> nạp hết làm nặng máy yếu; một trận chỉ chạm vài tấm ấn ký) */
        for (const s of j.tam) {
          const ld = () => { if (s._ld) return; s._ld = 1; const n = +s.n || 4, f = "img/fx/" + s.f, im = new Image();
            im.onload = () => (s.k || []).forEach((k, i) => { if (k) ATL.m[k] = { f, n, x: i % n, y: Math.floor(i / n) }; });
            im.src = window.PAK && PAK.k ? PAK.k(f) : f; };
          if (/anky/.test(s.f)) (s.k || []).forEach(k => { if (k) ATL.lz[k] = ld; }); else ld();
        }
      }).catch(() => { ATL.st = 3; });
    } catch (e) { ATL.st = 3; }
  }
  function spr(keys) {
    if (ATL.st !== 2) return null;
    for (const k of keys) { const a = k && ATL.m[k]; if (!a && k && ATL.lz[k]) ATL.lz[k](); if (a) { const u = window.PAK && PAK.k ? PAK.k(a.f) : a.f, p = v => (a.n > 1 ? (v * 100 / (a.n - 1)).toFixed(3) : 0) + "%"; return `<i class="fxr-sp" style="background-image:url('${u}');background-size:${a.n * 100}% ${a.n * 100}%;background-position:${p(a.x)} ${p(a.y)}"></i>`; } }
    return null;
  }

  /* ---- nút DOM có ngân sách ---- */
  let NODES = 0;
  const MAXN = 24;
  function node(cls, x, y, w, h, html, vars) {
    if (NODES >= MAXN) return null;
    const d = document.createElement("div");
    d.className = "fxr " + cls; d.setAttribute("aria-hidden", "true");
    d.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
    if (vars) for (const k in vars) d.style.setProperty(k, vars[k]);
    d.innerHTML = html || "";
    document.body.appendChild(d); NODES++;
    let gone = false; d._rm = () => { if (gone) return; gone = true; NODES--; d.remove(); };
    return d;
  }
  function play(d, kf, o, extra) {
    if (!d) return;
    const dl = (o && o.delay) || 0, du = (o && o.duration) || 400;
    const a = d.animate(kf, Object.assign({ fill: "both", easing: "linear" }, o || {})); /* nhịp đặt bằng offset của khung, không bóp méo cả trục thời gian */
    if (a) a.onfinish = () => d._rm();
    fxT(() => d._rm(), dl + du + (extra || 160));
  }
  const vars = c => ({ "--a": c.c1, "--b": c.c2 });

  /* ---- ghi nhật ký cho kiểm thử (window.FXR_LOG = true) ---- */
  const LOG = [];
  function log(o) { if (!window.FXR_LOG) return; o.t = performance.now(); LOG.push(o); if (LOG.length > 400) LOG.shift(); }

  /* ấn ký độc quyền: ô atlas em_<id> hoặc huy hiệu mặt nhân vật của thẻ */
  function emblem(c, sz) {
    const im = spr(["em_" + c.id]);
    if (im) return im;
    let face = "";
    try { face = typeof artFace === "function" ? artFace(c.id) : ""; } catch (e) {}
    return `<i class="fxr-em" style="--r:${TIERC[c.t] || c.c2};--a:${c.c1}">${face}</i>`;
  }
  function glyph(c) { return spr([c.k + "_" + c.e]) || `<svg viewBox="-20 -20 40 40">${GL[c.gl] || GL.rune}</svg>`; }

  /* điểm trên đường cong bậc hai nguồn -> đích theo quỹ đạo của thẻ (q: 0 cong trái, 1 cong phải, 2 thẳng) */
  function curve(a, b, q, t) {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, k = q === 2 ? 0 : (q === 0 ? -1 : 1) * Math.min(70, L * .28);
    const cx = a.x + dx / 2 - dy / L * k, cy = a.y + dy / 2 + dx / L * k, u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
  }

  /* ===== nguyên mẫu ===== */
  /* luồng sáng nguồn -> đích (±sức mạnh, ủng hộ, giá thẻ, năng lượng): vệt thẳng (dây nối) + đầu luồng bay theo quỹ đạo thẻ */
  function beam(sp, tp, srcUid, k, o) {
    o = o || {};
    if (!ok() || !sp || !tp) return false;
    const c = sit(idOf(srcUid), k);
    if (!c) return false;
    atlasLoad();
    /* gpu51: điểm đầu/cuối theo vị trí THẬT của thẻ lúc bắn (thẻ nguồn có thể đang được nhấc lên/phóng to) */
    const live = u => { const el = u > 0 && document.querySelector(`#board [data-mc="${u}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return r.height > 8 ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.max(r.width, r.height * .7), h: r.height } : null; };
    sp = live(srcUid) || sp; tp = live(o.dst) || tp;
    const dl = o.dl || 0, du = Math.max(120, o.dur || 300), sg = k === "giam" ? "#b0102e" : k === "nl" || k === "gia" ? "#7fe0ff" : "#7dffb0";
    if (window.FXR_LOG) { /* kiểm thử: đo lại thẻ nguồn lúc đầu luồng rời đi và thẻ đích lúc đầu luồng tới nơi */
      const L = { k: "beam", kind: k, src: srcUid, dst: o.dst, srcId: c.id, e: c.e, a: { x: sp.x, y: sp.y }, b: { x: tp.x, y: tp.y }, dl, du };
      log(L); fxT(() => { L.as = live(srcUid); }, dl); fxT(() => { L.bs = live(o.dst); }, dl + du); }
    if (ff()) { fxT(() => FX.glow(tp.x, tp.y, c.c1, 30, .5), dl + du); return true; }
    const dx = tp.x - sp.x, dy = tp.y - sp.y, L = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
    /* 1. vệt sáng thẳng (màu hệ nguồn -> màu dấu ±) */
    const bar = node("fxr-bm" + (k === "giam" ? " neg" : ""), sp.x, sp.y, L, 8, "", { "--a": c.c1, "--g": sg }), BT = du + 220, f1 = du / BT;
    play(bar, [{ transform: `rotate(${ang}rad) scaleX(0)`, opacity: 0 }, { transform: `rotate(${ang}rad) scaleX(.12)`, opacity: 1, offset: f1 * .12 }, { transform: `rotate(${ang}rad) scaleX(1)`, opacity: 1, offset: f1 }, { transform: `rotate(${ang}rad) scaleX(1)`, opacity: .85, offset: Math.min(.95, f1 + .1) }, { transform: `rotate(${ang}rad) scaleX(1)`, opacity: 0 }],
      { duration: BT, delay: dl, easing: "linear" });
    /* 2. đầu luồng: ấn ký (S4/S5) hoặc hình mô-típ, bay theo đường cong riêng của thẻ */
    const S = c.em ? 34 : 30, rot = !c.em && ROT[c.gl];
    const hd = node("fxr-hd" + (c.em ? " em" : ""), sp.x, sp.y, S, S, c.em ? emblem(c) : glyph(c), vars(c));
    const kf = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, p = curve(sp, tp, c.q, t), p2 = curve(sp, tp, c.q, Math.min(1, t + .05)), a = Math.atan2(p2.y - p.y, p2.x - p.x) || ang;
      const sc = i === 0 ? .4 : i === 6 ? .9 : 1 + (c.nh ? .12 * Math.sin(t * Math.PI) : 0);
      kf.push({ transform: `translate(-50%,-50%) translate(${(p.x - sp.x).toFixed(1)}px,${(p.y - sp.y).toFixed(1)}px)${rot ? ` rotate(${a.toFixed(3)}rad)` : ""} scale(${sc.toFixed(2)})`, opacity: i === 0 ? 0 : 1, offset: t });
    }
    play(hd, kf, { duration: du, delay: dl, easing: c.nh ? "cubic-bezier(.5,0,.5,1)" : "cubic-bezier(.3,.1,.5,1)" }, 60);
    if (!lo()) fxT(() => { try { FX.trail(sp.x, sp.y, tp.x, tp.y, c.c1); } catch (e) {} }, dl);
    return true;
  }
  /* đích nhói sáng theo hệ nguồn + biểu tượng tình huống */
  function hit(k, tp, srcUid, o) {
    o = o || {};
    if (!ok() || !tp) return false;
    const c = sit(idOf(srcUid) || o.id, k);
    if (!c) return false;
    atlasLoad();
    log({ k: "hit", kind: k, src: srcUid, dst: o.dst, srcId: c.id, e: c.e, b: { x: tp.x, y: tp.y } });
    const w = tp.w || 50, h = tp.h || 70, first = !(o.i > 0);
    try { FX.glow(tp.x, tp.y, c.c1, Math.min(46, w * .8), .55); } catch (e) {}
    if (ff()) return true;
    if (first && !lo()) try { if (typeof elFx === "function") elFx(c.e, tp.x, tp.y, w, h, true); } catch (e) {}
    const S = Math.max(46, w * 1.05);
    if (k === "tang" || k === "x2") {
      const im = spr([c.cell, c.tierCell]);
      const d = node("fxr-ht", tp.x, tp.y, S * 1.3, S * 1.3, im || "", { "--a": c.c1, "--b": c.c2 });
      play(d, [{ transform: "translate(-50%,-50%) scale(.5)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.05)", opacity: 1, offset: .35 }, { transform: "translate(-50%,-50%) scale(1.45)", opacity: 0 }], { duration: 420 });
    } else if (k === "giam") {
      const d = node("fxr-ck", tp.x, tp.y, w * .9, h * .9, spr([c.cell, c.tierCell]) || IC.crack, { "--a": "#c0153a", "--b": c.c1 });
      play(d, [{ transform: "translate(-50%,-50%) scale(1.25)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 1, offset: .18 }, { transform: "translate(-50%,-50%) scale(1)", opacity: .9, offset: .7 }, { transform: "translate(-50%,-50%) scale(.96)", opacity: 0 }], { duration: 520 });
    } else if (k === "ung") {
      const d = node("fxr-ic", tp.x, tp.y - h * .18, 34, 34, spr(["ic_tim"]) || IC.heart, { "--a": c.c1, "--b": c.c2 });
      play(d, [{ transform: "translate(-50%,-50%) translateY(10px) scale(.4)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.15)", opacity: 1, offset: .3 }, { transform: "translate(-50%,-50%) scale(.95)", opacity: 1, offset: .5 }, { transform: "translate(-50%,-50%) scale(1.12)", opacity: 1, offset: .68 }, { transform: "translate(-50%,-50%) translateY(-18px) scale(.9)", opacity: 0 }], { duration: 760 });
    }
    return true;
  }
  /* tiêu huỷ: vỡ vụn theo chất liệu HỆ CỦA THẺ BỊ HUỶ */
  function huy(r, dstUid, srcUid, o) {
    o = o || {};
    if (!ok() || !r) return false;
    const c = sit(baseIdOf(dstUid) || o.id, "huy");
    if (!c) return false;
    atlasLoad();
    log({ k: "huy", src: srcUid, dst: dstUid, srcId: c.id, e: c.e, b: { x: r.x, y: r.y } });
    const w = r.w || 50;
    try { FX.glow(r.x, r.y, c.c1, 56, .5); } catch (e) {}
    if (ff()) return true;
    if (!lo()) { try { FX.shards(r.x, r.y, c.c1); FX.shards(r.x, r.y, c.c2); } catch (e) {} try { if (typeof elFx === "function") elFx(c.e, r.x, r.y, w, r.h || 70, true); } catch (e) {} }
    const S = Math.max(84, w * 2.1), d = node("fxr-hy", r.x, r.y, S, S, spr([c.cell, c.tierCell]) || IC.shards, vars(c));
    play(d, [{ transform: "translate(-50%,-50%) scale(.35) rotate(0deg)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1) rotate(12deg)", opacity: 1, offset: .3 }, { transform: "translate(-50%,-50%) scale(1.5) rotate(30deg)", opacity: 0 }], { duration: 560, delay: o.dl || 0 });
    return true;
  }
  /* vứt bỏ: lá bị vứt cháy theo HỆ CỦA LÁ ĐÓ */
  function vut(r, cardId, srcUid, o) {
    o = o || {};
    if (!ok() || !r) return false;
    const c = sit(cardId, "vut");
    if (!c) return false;
    atlasLoad();
    log({ k: "vut", src: srcUid, srcId: c.id, e: c.e, b: { x: r.x, y: r.y } });
    if (ff()) return true;
    const S = Math.max(40, (r.w || 60) * .6), d = node("fxr-fl", r.x, r.y - (r.h || 80) * .2, S, S * 1.25, spr([c.cell, c.tierCell]) || IC.flame, vars(c));
    play(d, [{ transform: "translate(-50%,-50%) translateY(14px) scale(.4)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.08)", opacity: 1, offset: .35 }, { transform: "translate(-50%,-50%) translateY(-26px) scale(.7)", opacity: 0 }], { duration: 520, delay: o.dl || 0 });
    if (!lo()) fxT(() => { try { FX.rise(r.x, r.y, c.c1, 10); FX.rise(r.x, r.y - 10, c.c2, 6); } catch (e) {} }, (o.dl || 0) + 80);
    return true;
  }
  /* kích hoạt: ấn chú xoay dưới chân thẻ theo hệ nguồn (+ ấn ký S4/S5 ở giữa) */
  function kich(p, uid) {
    if (!ok() || !p) return false;
    const c = sit(idOf(uid), "kich");
    if (!c) return false;
    atlasLoad();
    log({ k: "kich", src: uid, srcId: c.id, e: c.e, b: { x: p.x, y: p.y } });
    if (ff()) { try { FX.glow(p.x, p.y, c.c1, 40, .5); } catch (e) {} return true; }
    const S = Math.max(70, (p.w || 50) * 1.5), d = node("fxr-sl", p.x, p.y + (p.h || 70) * .3, S, S, spr([c.cell, c.tierCell]) || IC.seal, vars(c));
    const dir = c.q === 0 ? -1 : 1;
    /* vòng ấn nằm "trên mặt đất": dẹt theo chiều dọc (scaleY) rồi mới xoay trong mặt phẳng của nó */
    play(d, [{ transform: "translate(-50%,-50%) scale(.3) scaleY(.46) rotate(0deg)", opacity: 0 }, { transform: `translate(-50%,-50%) scale(1) scaleY(.46) rotate(${dir * 90}deg)`, opacity: 1, offset: .35 }, { transform: `translate(-50%,-50%) scale(1.1) scaleY(.46) rotate(${dir * 200}deg)`, opacity: 0 }], { duration: 640 });
    if (c.em) { const e = node("fxr-hd em", p.x, p.y - (p.h || 70) * .5, 30, 30, emblem(c), vars(c)); play(e, [{ transform: "translate(-50%,-50%) scale(.4)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.1)", opacity: 1, offset: .3 }, { transform: "translate(-50%,-50%) translateY(-10px) scale(1)", opacity: 0 }], { duration: 640 }); }
    return true;
  }
  /* triệu hồi / tạo thẻ: cổng ấn trống đồng mở theo hệ NGUỒN */
  function trieu(p, dstUid, srcUid, o) {
    o = o || {};
    if (!ok() || !p) return false;
    const k = o.tao ? "tao" : "trieu", c = sit(idOf(srcUid) || baseIdOf(dstUid), k);
    if (!c) return false;
    atlasLoad();
    log({ k, src: srcUid, dst: dstUid, srcId: c.id, e: c.e, b: { x: p.x, y: p.y } });
    try { FX.glow(p.x, p.y, c.c1, 50, .45); } catch (e) {}
    if (ff()) return true;
    const S = Math.max(70, (p.w || 50) * (o.tao ? 1.2 : 1.7)), d = node("fxr-pt", p.x, p.y, S, S, spr([c.cell, c.tierCell]) || IC.portal, vars(c));
    const dir = c.q === 1 ? 1 : -1;
    play(d, [{ transform: "translate(-50%,-50%) scale(.2) rotate(0deg)", opacity: 0 }, { transform: `translate(-50%,-50%) scale(1) rotate(${dir * 120}deg)`, opacity: 1, offset: .4 }, { transform: `translate(-50%,-50%) scale(1.25) rotate(${dir * 220}deg)`, opacity: 0 }], { duration: 700, delay: o.dl || 0 });
    if (c.em) { const e = node("fxr-hd em", p.x, p.y, 32, 32, emblem(c), vars(c)); play(e, [{ transform: "translate(-50%,-50%) scale(.3)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.15)", opacity: 1, offset: .4 }, { transform: "translate(-50%,-50%) scale(1.3)", opacity: 0 }], { duration: 640, delay: o.dl || 0 }); }
    if (!lo()) fxT(() => { try { FX.vortex(p.x, p.y, c.c1, 10); } catch (e) {} }, (o.dl || 0) + 120);
    return true;
  }
  /* hồi sinh: sen linh hồn trồi lên (hệ nguồn; tự hồi sinh -> hệ của chính thẻ) */
  function hoi(p, dstUid, srcUid) {
    if (!ok() || !p) return false;
    const c = sit(idOf(srcUid) || baseIdOf(dstUid), "hoi");
    if (!c) return false;
    atlasLoad();
    log({ k: "hoi", src: srcUid, dst: dstUid, srcId: c.id, e: c.e, b: { x: p.x, y: p.y } });
    try { FX.pillar(p.x, p.y + (p.h || 70) * .45, c.c1, (p.w || 50) * .8, (p.h || 70) * 2); } catch (e) {}
    if (ff()) return true;
    const d = node("fxr-ic lg", p.x, p.y + (p.h || 70) * .1, 58, 58, spr(["ic_sen", c.cell]) || IC.lotus, vars(c));
    play(d, [{ transform: "translate(-50%,-50%) translateY(26px) scale(.4)", opacity: 0 }, { transform: "translate(-50%,-50%) translateY(0) scale(1.1)", opacity: 1, offset: .45 }, { transform: "translate(-50%,-50%) translateY(-30px) scale(1)", opacity: 0 }], { duration: 820 });
    if (!lo()) try { FX.rise(p.x, p.y, c.c2, 10); } catch (e) {}
    return true;
  }
  /* năng lượng (đồng hồ cát xoay bay vào viên năng lượng) và giá thẻ (viên ngọc + mũi tên) — biểu tượng nhuộm hệ nguồn */
  function nl(sp, op, srcUid, n, o) {
    o = o || {};
    if (!ok() || !op) return false;
    const c = sit(idOf(srcUid), o.gia ? "gia" : "nl");
    if (!c) return false;
    atlasLoad();
    const a = sp || op, ic = o.gia ? (n < 0 ? spr(["ic_ngocxuong"]) || IC.gemdn : spr(["ic_ngoclen"]) || IC.gemup) : n < 0 ? spr(["ic_ngocvo"]) || IC.gemcrack : spr(["ic_dongho"]) || IC.clock;
    log({ k: o.gia ? "gia" : "nl", src: srcUid, srcId: c.id, e: c.e, a: { x: a.x, y: a.y }, b: { x: op.x, y: op.y }, n });
    if (ff()) { fxT(() => { try { FX.glow(op.x, op.y, c.c1, 30, .5); } catch (e) {} }, o.dl || 0); return true; }
    const d = node("fxr-ic", a.x, a.y, o.gia ? 40 : 36, o.gia ? 40 : 36, ic, vars(c)), dx = op.x - a.x, dy = op.y - a.y, du = Math.max(160, o.dur || 260), m = curve(a, op, c.q, .5);
    play(d, [{ transform: "translate(-50%,-50%) scale(.5) rotate(0deg)", opacity: 0 }, { transform: `translate(-50%,-50%) translate(${(m.x - a.x).toFixed(1)}px,${(m.y - a.y).toFixed(1)}px) scale(1.15) rotate(180deg)`, opacity: 1, offset: .5 }, { transform: `translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.9) rotate(360deg)`, opacity: 1, offset: .9 }, { transform: `translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(1.3) rotate(360deg)`, opacity: 0 }],
      { duration: du, delay: o.dl || 0, easing: "cubic-bezier(.35,.1,.4,1)" });
    fxT(() => { try { FX.glow(op.x, op.y, c.c1, 36, .55); if (!lo()) FX.sparks(op.x, op.y, c.c2, 8, 160); } catch (e) {} }, (o.dl || 0) + du * .9);
    return true;
  }
  /* bị chặn: vòng khiên nhuộm hệ nguồn */
  function chan(p, srcUid) {
    if (!ok() || !p) return false;
    const c = sit(idOf(srcUid), "chan");
    if (!c) return false;
    log({ k: "chan", src: srcUid, srcId: c.id, e: c.e, b: { x: p.x, y: p.y } });
    try { FX.ring(p.x, p.y, c.c1, (p.w || 50) * .7, 4); } catch (e) {}
    return true;
  }
  /* vứt bỏ do thẻ trên bàn gây ra: luồng nguồn -> tay/ảnh đối thủ (hệ nguồn) */
  function vutSrc(ev, sp) {
    if (!ok() || !sp || !ev) return false;
    let to = null;
    try { to = ev.side === "p" ? (typeof zpt === "function" && zpt("hand")) : (typeof zpt === "function" && (zpt("avFoe") || zpt("oppSub"))); } catch (e) {}
    if (!to) return false;
    return beam(sp, to, ev.src, "vut", { dur: 260 });
  }

  /* đo chi phí CPU của chính FXR (số lần gọi, tổng ms) — để so hiệu năng */
  const PRF = { n: 0, ms: 0, max: 0 };
  const tm = f => function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - t; PRF.n++; PRF.ms += d; if (d > PRF.max) PRF.max = d; } };
  beam = tm(beam); hit = tm(hit); huy = tm(huy); vut = tm(vut); kich = tm(kich); trieu = tm(trieu); hoi = tm(hoi); nl = tm(nl); chan = tm(chan);

  /* ===== bọc đòn có nguồn -> đích (run8/hit8, lớp ngoài cùng) ===== */
  const KIND = s => s.k === "up" ? (s.ong ? "ung" : s.dbl ? "x2" : "tang") : s.k === "down" ? "giam" : s.k === "cost" ? "gia" : null;
  if (typeof run8 === "function") {
    const _run8 = run8;
    run8 = function (s) {
      try { const id = s && s.src > 0 ? baseIdOf(s.src) : null; if (id && ATL.st === 2) spr(["em_" + id]); } catch (e) {} /* nạp sớm tấm ấn ký của thẻ nguồn */
      try {
        const k = s && KIND(s);
        if (k && s.sp && s.tp && s.src > 0 && !s.self29 && !s.ong) {
          const tm = typeof q8 === "function" ? q8(s, () => [s.nl ? 0 : T8.LIFT, T8.FLY]) : [95, 290];
          if (k === "gia") nl(s.sp, s.tp, s.src, s.d, { gia: 1, dl: tm[0], dur: tm[1] });
          else beam(s.sp, s.tp, s.src, k, { dl: tm[0], dur: tm[1], dst: s.dst });
        }
      } catch (e) {}
      return _run8.apply(this, arguments);
    };
  }
  if (typeof hit8 === "function") {
    const _hit8 = hit8;
    hit8 = function (s) {
      let k = null;
      try { k = s && (s.k === "kill" ? "huy" : s.k === "summon" ? "trieu" : KIND(s)); } catch (e) {}
      /* tiếng tình huống: đòn ủng hộ (Duy Trì) -> tim; vỡ/cháy -> hệ thẻ bị tác động */
      let hint = null;
      try { if (k === "ung") hint = { k: "tim" }; else if (k === "huy") hint = { el: (cfg(baseIdOf(s.dst)) || {}).e }; } catch (e) {}
      if (hint && SFX.hint) SFX.hint(hint);
      try { _hit8.apply(this, arguments); } finally { if (hint && SFX.hint) SFX.hint(null); }
      try {
        const gi = s.grp ? s.grp.i : 0;
        if (k === "huy") huy(s.r0 || s.tp, s.dst, s.src);
        else if (k === "trieu") trieu(s.tp, s.dst, s.src);
        else if (k === "gia") { /* viên ngọc đã bay tới ở run8 */ }
        else if (k && (s.src > 0 || s.ong || s.self29)) hit(k, s.tp, s.src > 0 ? s.src : s.dst, { dst: s.dst, i: gi });
      } catch (e) {}
    };
  }

  window.FXR = {
    cfg, sit, beam, hit, huy, vut, vutSrc, kich, trieu, hoi, nl, chan,
    c1: (uid, def) => { const c = cfg(idOf(uid)); return c ? c.c1 : def; },
    c1Id: (id, def) => { const c = cfg(id); return c ? c.c1 : def; },
    ids: () => Object.keys(T), n: () => Object.keys(T).length, SITS,
    atlas: () => ({ st: ATL.st, n: Object.keys(ATL.m).length }), atlasLoad,
    log: LOG, nodes: () => NODES, prf: PRF
  };
})();
