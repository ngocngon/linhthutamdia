/* Linh Thú Tam Địa — bộ máy luật (không đụng DOM, chạy được trong Node và trình duyệt) */
(function (root) {
"use strict";

const HE = { KD: "Khởi Đầu", C1: "Cấp 1–14", TB: "Tân Binh", S1: "Bậc 1", S2: "Bậc 2", S3: "Bậc 3", S4: "Bậc 4", S5: "Bậc 5", MP: "Mới phát hành", PH: "Thẻ phụ" };
const DANG = { none: "Không kỹ năng", rev: "Lật", on: "Duy Trì", act: "Kích Hoạt", end: "Cuối Lượt", start: "Đầu Ván", react: "Phản Ứng", pas: "Bị Động" };

// [id, tên, hình, giá, sức mạnh, dạng, hệ, kỹ năng]
const RAW = [
  ["quaituong", "Quái Tướng", "", 5, 9, "none", "KD", ""],
  ["tinhquyennu", "Tinh Quyền Nữ", "", 1, 2, "rev", "S1", "Lật: Cho thẻ trên cùng bộ bài của bạn +3 sức mạnh."],
  ["thienduc", "Thiên Dực", "", 2, 4, "pas", "S1", "Khi một thẻ của bạn bị tiêu huỷ, thẻ này bay ra từ tay hoặc bộ bài của bạn để thay thế nó."],
  ["thanhkiemnu", "Thánh Kiếm Nữ", "", 2, 3, "pas", "S1", "Sau khi bạn đặt 1 thẻ tại đây, +1 sức mạnh."],
  ["kiengiap", "Kiến Giáp", "", 1, 1, "on", "TB", "Duy Trì: Nếu phía bạn ở chiến địa này đã đầy, +4 sức mạnh."],
  ["matthevuong", "Mạt Thế Vương", "", 6, 10, "react", "S1", "Khi Bị Vứt Bỏ: Trả thẻ này lại với +4 sức mạnh."],
  ["giaphon", "Giáp Hồn", "", 2, 3, "on", "S1", "Duy Trì: Các thẻ tại đây không thể bị tiêu huỷ."],
  ["hapnangthu", "Hấp Năng Thủ", "", 3, 2, "pas", "S1", "Sau khi bạn đặt 1 thẻ, thẻ này nhận +1 sức mạnh."],
  ["daothosan", "Đao Thợ Săn", "", 1, 3, "rev", "S1", "Lật: Vứt bỏ thẻ ngoài cùng bên phải khỏi tay bạn."],
  ["lamkynhan", "Lam Kỳ Nhân", "", 5, 3, "on", "TB", "Duy Trì: Các thẻ khác của bạn có +1 sức mạnh."],
  ["linhtuonglai", "Lính Tương Lai", "", 2, 4, "rev", "S1", "Lật: Rút 1 thẻ từ bộ bài đối thủ."],
  ["thuantuong", "Thuẫn Tướng", "", 3, 3, "on", "S1", "Duy Trì: Các thẻ Duy Trì khác của bạn tại đây có +2 sức mạnh."],
  ["huyetdich", "Huyết Dịch", "", 2, 2, "rev", "S1", "Lật: Tiêu huỷ các thẻ khác của bạn tại đây. +2 sức mạnh cho mỗi thẻ bị tiêu huỷ."],
  ["thepnhan", "Thép Nhân", "", 2, 4, "on", "TB", "Duy Trì: Không thể bị tiêu huỷ, di chuyển hoặc giảm sức mạnh."],
  ["khuyenduhanh", "Khuyển Du Hành", "", 3, 3, "on", "S1", "Duy Trì: Kỹ năng Lật không chạy tại đây."],
  ["docnhan", "Độc Nhãn", "", 3, 5, "none", "KD", ""],
  ["xacmay", "Xác Máy", "", 3, 6, "rev", "S1", "Lật: Tiêu huỷ các thẻ khác của bạn tại đây."],
  ["longdo", "Long Đỏ", "", 5, 4, "on", "S1", "Duy Trì: +2 sức mạnh cho mỗi thẻ trên tay bạn."],
  ["diphapsu", "Dị Pháp Sư", "", 2, 4, "rev", "S1", "Lật: Di chuyển (các) thẻ có sức mạnh cao nhất của bạn đến chiến địa này."],
  ["maymannu", "May Mắn Nữ", "", 2, 3, "pas", "S1", "Bạn luôn rút thẻ này vào lượt 2, và không sớm hơn."],
  ["songchuynu", "Song Chuỷ Nữ", "", 1, 2, "rev", "S1", "Lật: Tiêu huỷ 1 thẻ địch 1 năng lượng tại đây."],
  ["mehoacnu", "Mê Hoặc Nữ", "", 5, 8, "rev", "S1", "Lật: Xoá kỹ năng của tất cả thẻ Duy Trì tại đây."],
  ["thoren", "Thợ Rèn", "", 2, 2, "rev", "S1", "Lật: Cho thẻ tiếp theo bạn đặt +2 sức mạnh."],
  ["lucsatnu", "Lục Sát Nữ", "", 5, 8, "rev", "TB", "Lật: Nếu đối thủ đã đặt 1 thẻ tại đây trong lượt này, +4 sức mạnh."],
  ["mocnhan", "Mộc Nhân", "", 3, 5, "rev", "S1", "Lật: Nếu đối thủ đã đặt 1 thẻ tại đây trong lượt này, +4 sức mạnh."],
  ["thantien", "Thần Tiễn", "", 1, 1, "rev", "KD", "Lật: Nếu bạn đặt 1 thẻ ở chiến địa này vào lượt sau, +4 sức mạnh."],
  ["thukieu", "Thủ Kiều", "", 6, 10, "rev", "S1", "Lật: Di chuyển các thẻ khác của bạn sang trái một chiến địa."],
  ["cuongnhan", "Cuồng Nhân", "", 6, 14, "none", "KD", ""],
  ["giapchongcuong", "Giáp Chống Cuồng", "", 2, 3, "rev", "S1", "Lật: Hợp thể thẻ này vào một thẻ của bạn tại đây."],
  ["thietquyen", "Thiết Quyền", "", 1, 3, "rev", "S1", "Lật: Sau khi bạn đặt thẻ tiếp theo, di chuyển nó sang trái một chiến địa."],
  ["thietgiap", "Thiết Giáp", "", 5, 0, "on", "KD", "Duy Trì: Tổng sức mạnh của bạn tại đây được nhân đôi."],
  ["thiettam", "Thiết Tâm", "", 3, 0, "rev", "TB", "Lật: Cộng 3 sức mạnh cho 2 thẻ khác của bạn."],
  ["thamtunu", "Thám Tử Nữ", "", 4, 5, "rev", "C1", "Lật: Nếu lượt sau bạn không đặt thẻ nào ở chiến địa này, +5 sức mạnh."],
  ["chuarung", "Chúa Rừng", "", 4, 6, "on", "C1", "Duy Trì: Các thẻ 1 năng lượng của bạn có +1 sức mạnh."],
  ["amtrao", "Âm Trảo", "", 4, 3, "on", "S1", "Duy Trì: Chiến địa bên phải có +6 sức mạnh."],
  ["thachnhan", "Thạch Nhân", "", 1, 2, "rev", "S1", "Lật: Xáo một Đá vào bộ bài của đối thủ."],
  ["thosan", "Thợ Săn", "", 2, 3, "pas", "S1", "Khi một thẻ di chuyển đến đây, thẻ này nhận +2 sức mạnh."],
  ["nuchienthan", "Nữ Chiến Thần", "", 3, 6, "rev", "S1", "Lật: Vứt bỏ thẻ có năng lượng cao nhất trên tay bạn."],
  ["thanlannhan", "Thằn Lằn Nhân", "", 2, 6, "on", "S1", "Duy Trì: -4 sức mạnh nếu đối thủ có 4 thẻ tại đây."],
  ["xucgiacnu", "Xúc Giác Nữ", "", 1, 3, "rev", "S1", "Lật: Nếu đối thủ đã đặt thẻ nào tại đây trong lượt này, sao chép một trong số đó vào tay bạn."],
  ["tocnuhoang", "Tóc Nữ Hoàng", "", 2, 2, "rev", "KD", "Lật: Nếu thẻ này ở chiến địa giữa, +3 sức mạnh."],
  ["deonhan", "Dẻo Nhân", "", 3, 1, "on", "C1", "Duy Trì: Các chiến địa liền kề có +3 sức mạnh."],
  ["tasu", "Tà Sư", "", 2, 2, "rev", "S1", "Lật: Thêm một Bản Sao Tà có cùng sức mạnh vào đây."],
  ["taymaynu", "Tay Máy Nữ", "", 1, 3, "none", "KD", ""],
  ["nguyetdong", "Nguyệt Đồng", "", 4, 5, "rev", "S1", "Lật: Sao chép tay bạn."],
  ["bienhinh", "Biến Hình", "", 3, 0, "rev", "S1", "Lật: Trở thành bản sao của một thẻ trên tay đối thủ."],
  ["phanthan", "Phân Thân", "", 2, 4, "pas", "S1", "Khi thẻ này di chuyển, thêm một bản sao vào chiến địa cũ."],
  ["thuyvuong", "Thuỷ Vương", "", 4, 6, "on", "S1", "Duy Trì: +5 sức mạnh nếu đây là thẻ duy nhất của bạn tại đây."],
  ["dahanh", "Dạ Hành", "", 1, 3, "pas", "C1", "Có thể di chuyển một lần."],
  ["tantinh", "Tân Tinh", "", 1, 1, "react", "S1", "Khi Bị Tiêu Huỷ: Cộng 1 sức mạnh cho các thẻ của bạn."],
  ["phuthan", "Phụ Thần", "", 6, 10, "rev", "C1", "Lật: Lặp lại các kỹ năng Lật của các thẻ khác của bạn tại đây."],
  ["tamtuquai", "Tâm Từ Quái", "", 6, 8, "on", "S1", "Duy Trì: Các kỹ năng Duy Trì khác của bạn tại đây được áp dụng thêm một lần."],
  ["giaosutam", "Giáo Sư Tâm", "", 5, 2, "on", "S1", "Duy Trì: Di chuyển là cách duy nhất để thêm hoặc loại một nhân vật khỏi đây."],
  ["ketrungphat", "Kẻ Trừng Phạt", "", 3, 3, "on", "KD", "Duy Trì: +1 sức mạnh cho mỗi thẻ địch tại đây."],
  ["ngantoc", "Ngân Tốc", "", 1, 2, "pas", "KD", "Luôn có trên tay khởi đầu."],
  ["chonphao", "Chồn Pháo", "", 1, 1, "rev", "S1", "Lật: Nếu đối thủ đã đặt một thẻ tại đây lượt này, +4 sức mạnh."],
  ["hongphuthuy", "Hồng Phù Thuỷ", "", 2, 3, "rev", "S1", "Lật: Thay chiến địa này bằng một chiến địa mới."],
  ["linhgacmay", "Lính Gác Máy", "", 2, 3, "rev", "KD", "Lật: Thêm một Lính Gác Máy khác vào tay bạn."],
  ["chanthu", "Chấn Thủ", "", 2, 4, "none", "KD", ""],
  ["quangpho", "Quang Phổ", "", 6, 7, "rev", "C1", "Lật: Cộng 2 sức mạnh cho các thẻ Duy Trì của bạn."],
  ["nhennu", "Nhện Nữ", "", 5, 8, "rev", "S1", "Lật: Trừ 1 sức mạnh tất cả thẻ đối thủ tại đây."],
  ["socnu", "Sóc Nữ", "", 1, 2, "rev", "S1", "Lật: Thêm một Sóc 1 sức mạnh vào mỗi chiến địa khác."],
  ["tinhchua", "Tinh Chúa", "", 2, 2, "rev", "KD", "Lật: Nếu đối thủ đã đặt một thẻ tại đây lượt này, +4 sức mạnh."],
  ["lucsi", "Lực Sĩ", "", 3, 4, "on", "S1", "Duy Trì: +6 sức mạnh nếu tay bạn có từ 1 thẻ trở xuống."],
  ["kiemsu", "Kiếm Sư", "", 3, 7, "rev", "S1", "Lật: Vứt bỏ một thẻ có năng lượng lẻ khỏi tay bạn."],
  ["thachquai", "Thạch Quái", "", 4, 7, "none", "KD", ""],
  ["kequansat", "Kẻ Quan Sát", "", 1, 2, "start", "S1", "Đầu Ván: Bạn có thể thấy các chiến địa chưa lật."],
  ["bachhau", "Bạch Hậu", "", 3, 5, "rev", "S1", "Lật: Sao chép thẻ có năng lượng cao nhất trên tay đối thủ vào tay bạn."],
  ["bachho", "Bạch Hổ", "", 5, 1, "rev", "C1", "Lật: Thêm một Hổ 10 sức mạnh vào một chiến địa khác."],
  ["soinu", "Sói Nữ", "", 3, 2, "rev", "C1", "Lật: +2 sức mạnh cho mỗi thẻ khác của bạn tại đây."],
  ["vuotsoi", "Vuốt Sói", "", 2, 3, "react", "S1", "Khi Bị Vứt Bỏ hoặc Bị Tiêu Huỷ: Hồi sinh thẻ này với +2 sức mạnh ở một chiến địa ngẫu nhiên."],
  ["tieuvuong", "Tiêu Vương", "", 1, 2, "rev", "S1", "Lật: Trục xuất thẻ có năng lượng thấp nhất trong bộ bài của đối thủ."],
  ["da", "Đá", "", 1, 0, "none", "PH", "Không có kỹ năng."],
  ["bansaota", "Bản Sao Tà", "", 2, 2, "none", "PH", "Bản sao mang sức mạnh của Tà Sư."],
  ["soc", "Sóc", "", 1, 1, "none", "PH", "Thẻ phụ."],
  ["ho", "Hổ", "", 5, 10, "none", "PH", "Thẻ phụ."],
  ["thuhoang", "Lính Thuê", "", 0, 3, "none", "PH", "Thẻ phụ của chiến địa."],
  ["kientho", "Bot Thợ", "", 0, 1, "none", "PH", "Thẻ phụ của chiến địa."],
  ["kimthuatsi", "Kim Thuật Sĩ", "", 2, 0, "end", "S3", "Cuối Lượt: Rút 1 thẻ nếu bạn đang thắng tại đây. Nếu không, +1 sức mạnh."],
  ["phongnu", "Phong Nữ", "", 5, 9, "rev", "S3", "Lật: Thẻ cuối cùng đối thủ đặt di chuyển đến chiến địa này."],
  ["matvumuoiba", "Mật Vụ Mười Ba", "", 1, 3, "rev", "S2", "Lật: Thêm 1 thẻ ngẫu nhiên vào tay bạn."],
  ["dacvutruong", "Đặc Vụ Trưởng", "", 3, 5, "rev", "S3", "Lật: Thêm 1 thẻ 4 năng lượng và 1 thẻ 5 năng lượng ngẫu nhiên vào tay bạn."],
  ["naomay", "Não Máy", "", 6, 0, "rev", "S3", "Lật: Tiêu huỷ 1 thẻ khác của bạn tại đây để sao chép nó tại các chiến địa khác."],
  ["thuyba", "Thuỷ Bá", "", 4, 10, "end", "S3", "Cuối Lượt: Tiêu huỷ 1 thẻ của bạn tại đây có sức mạnh thấp hơn."],
  ["namtuocamthuat", "Nam Tước Ám Thuật", "", 2, 3, "rev", "S3", "Lật: Thẻ trên cùng bộ bài đối thủ có năng lượng 6 cho đến lượt 6."],
  ["mieuthan", "Miêu Thần", "", 1, 1, "rev", "S3", "Lật: Chỉnh sức mạnh của tất cả thẻ trên tay bạn thành 3."],
  ["lamthu", "Lam Thú", "", 3, 5, "rev", "S3", "Lật: Trả các thẻ khác của bạn tại đây về tay. Chúng giảm 1 năng lượng ở lượt sau."],
  ["camvuong", "Câm Vương", "", 5, 8, "rev", "S3", "Lật: Vứt bỏ thẻ có năng lượng thấp nhất khỏi tay đối thủ."],
  ["hacmieu", "Hắc Miêu", "", 1, 4, "end", "S3", "Cuối Lượt: Vứt bỏ thẻ này khỏi tay bạn."],
  ["hacbaovuong", "Hắc Báo Vương", "", 5, 5, "rev", "S3", "Lật: Nhân đôi sức mạnh của thẻ này."],
  ["docnu", "Độc Nữ", "", 3, 3, "act", "S3", "Kích Hoạt: Thêm 1 Vết Cắn Độc vào tay đối thủ."],
  ["trungmau", "Trùng Mẫu", "", 3, 2, "rev", "S3", "Lật: Thêm 2 Trùng Con tại đây với cùng sức mạnh."],
  ["taythep", "Tay Thép", "", 2, 2, "react", "S2", "Khi Bị Tiêu Huỷ: Thay thẻ này bằng Lính Mùa Đông."],
  ["tinhquangnu", "Tinh Quang Nữ", "", 4, 6, "pas", "S3", "Khi kết thúc ván, di chuyển đến chiến địa giúp bạn thắng ván. (nếu có thể)"],
  ["maydotam", "Máy Dò Tâm", "", 3, 0, "on", "S3", "Duy Trì: Các thẻ có sức mạnh cao nhất của bạn có +3 sức mạnh."],
  ["aochoangtoi", "Áo Choàng Tối", "", 2, 4, "rev", "S2", "Lật: Lượt sau, tất cả thẻ đều có thể di chuyển (Dời Được) đến chiến địa này."],
  ["kiemnupho", "Kiếm Nữ Phố", "", 2, 5, "rev", "S3", "Lật: Vứt bỏ thẻ có năng lượng thấp nhất khỏi tay bạn."],
  ["socheo", "Sọ Chéo", "", 4, 10, "pas", "S3", "Bạn chỉ có thể đặt thẻ này ở những chiến địa bạn đang thắng."],
  ["tunguyennu", "Tứ Nguyên Nữ", "", 3, 6, "rev", "S3", "Lật: Mỗi người chơi rút 1 thẻ."],
  ["quangchuy", "Quang Chuỷ", "", 2, 2, "pas", "S3", "Khi thẻ này di chuyển đến một chiến địa, +2 sức mạnh cho mỗi thẻ địch ở đó."],
  ["quangca", "Quang Ca", "", 2, 2, "on", "S3", "Duy Trì: +2 sức mạnh cho mỗi chiến địa đã đầy ở phía bạn."],
  ["linhbattu", "Lính Bất Tử", "", 1, 1, "react", "S3", "Khi Bị Tiêu Huỷ: Trả thẻ này về tay bạn với sức mạnh gấp đôi."],
  ["tuthan", "Tử Thần", "", 8, 12, "pas", "S3", "Giảm 1 năng lượng cho mỗi thẻ bị tiêu huỷ trong ván này."],
  ["phethachnu", "Phế Thạch Nữ", "", 3, 7, "rev", "S3", "Lật: Thêm 1 Đá vào mỗi chiến địa khác."],
  ["giaphuydiet", "Giáp Huỷ Diệt", "", 6, 18, "rev", "S3", "Lật: Tiêu huỷ các thẻ của bạn ở các chiến địa khác."],
  ["baochuasat", "Bạo Chúa Sắt", "", 6, 5, "rev", "S3", "Lật: Thêm 1 Bạo Cơ 5 sức mạnh vào mỗi chiến địa khác."],
  ["batty", "Bát Tý", "", 4, 8, "rev", "S3", "Lật: Kéo nhân vật có sức mạnh thấp nhất từ tay đối thủ về phía họ ở chiến địa này."],
  ["huyetbatuoc", "Huyết Bá Tước", "", 4, 2, "pas", "S3", "Khi kết thúc ván, vứt bỏ 1 thẻ khỏi tay bạn để nhận sức mạnh của nó."],
  ["phatuong", "Phá Tướng", "", 4, 6, "rev", "S3", "Lật: Nếu đối thủ đã đặt 1 thẻ tại đây trong lượt này, +4 sức mạnh."],
  ["hacthiet", "Hắc Thiệt", "", 1, 7, "pas", "S2", "Bạn không thể đặt thẻ này sau lượt 3. Duy Trì: Bạn không thể đặt thẻ tại đây."],
  ["vonganh", "Vọng Ảnh", "", 1, 2, "pas", "S3", "Sau khi đối thủ đặt 1 thẻ Duy Trì tại đây, xoá kỹ năng của nó."],
  ["diennhan", "Điện Nhân", "", 3, 5, "rev", "S3", "Lật: +1 năng lượng tối đa. Duy Trì: Bạn chỉ có thể đặt 1 thẻ mỗi lượt."],
  ["phiung", "Phi Ưng", "", 2, 3, "rev", "S3", "Lật: Trả các thẻ 1 năng lượng của bạn về tay."],
  ["baithu", "Bài Thủ", "", 3, 3, "rev", "S3", "Lật: Vứt bỏ 1 thẻ khỏi tay bạn để tiêu huỷ 1 thẻ địch ngẫu nhiên."],
  ["bongma", "Bóng Ma", "", 3, 5, "rev", "S3", "Lật: Xoá kỹ năng của tất cả thẻ Cuối Lượt tại đây."],
  ["matoc", "Ma Tốc", "", 4, 5, "rev", "S3", "Lật: Đưa 1 thẻ bị vứt bỏ của bạn trở lại chiến địa này."],
  ["nhenma", "Nhện Ma", "", 1, 3, "rev", "S3", "Lật: Thẻ cuối cùng bạn đặt di chuyển đến đây."],
  ["cuthubien", "Cự Thú Biển", "", 6, 16, "pas", "S3", "Bạn chỉ có thể đặt thẻ này ở chiến địa bên trái."],
  ["mieunuot", "Miêu Nuốt", "", 2, 2, "on", "S3", "Duy Trì: Không ai có thể đặt thẻ từ 4 năng lượng trở lên tại đây."],
  ["yeutinhluc", "Yêu Tinh Lục", "", 3, -4, "rev", "S3", "Lật: Đổi phe."],
  ["xanang", "Xạ Năng", "", 2, 1, "end", "S3", "Cuối Lượt: Bạn mất 1 năng lượng tối đa và thẻ này nhận +3 sức mạnh."],
  ["docxanu", "Độc Xạ Nữ", "", 3, 3, "rev", "S3", "Lật: Trừ 1 sức mạnh cho tất cả thẻ khác."],
  ["minhhau", "Minh Hậu", "", 6, 6, "rev", "S3", "Lật: Với mỗi mức năng lượng khác nhau trong số đó, hồi sinh 1 thẻ bạn đã vứt bỏ đến một chiến địa ngẫu nhiên."],
  ["mauhambay", "Mẫu Hạm Bay", "", 6, 12, "react", "S3", "Khi Bị Vứt Bỏ: Lấp đầy tay bạn bằng các thẻ ngẫu nhiên."],
  ["nguuma", "Ngưu Ma", "", 3, 5, "act", "S3", "Kích Hoạt: Vứt bỏ 1 thẻ khỏi tay bạn."],
  ["lucthan", "Lực Thần", "", 3, 5, "pas", "S3", "Lần đầu tiên mỗi lượt một thẻ khác của bạn di chuyển đến đây, di chuyển nó đến một chiến địa khác."],
  ["yeutinhcam", "Yêu Tinh Cam", "", 5, -8, "rev", "S2", "Lật: Đổi phe."],
  ["hoanhan", "Hoả Nhân", "", 3, 2, "pas", "S3", "Khi thẻ này di chuyển, nhân đôi sức mạnh của nó."],
  ["bangnhan", "Băng Nhân", "", 1, 2, "rev", "S2", "Lật: Cộng 1 năng lượng cho một thẻ trên tay đối thủ. (tối đa 6)"],
  ["nuloithan", "Nữ Lôi Thần", "", 5, 9, "rev", "S3", "Lật: Rút tất cả thẻ có năng lượng 0 từ bộ bài của bạn."],
  ["phaohoanu", "Pháo Hoa Nữ", "", 4, 1, "rev", "S2", "Lật: Thêm thẻ trên cùng bộ bài bạn vào chiến địa này."],
  ["batkhacan", "Bất Khả Cản", "", 4, 5, "rev", "S3", "Lật: Di chuyển tất cả thẻ địch được đặt tại đây trong lượt này đi nơi khác. (kể cả thẻ chưa lật)"],
  ["satvuong", "Sát Vương", "", 3, 3, "rev", "S2", "Lật: Tiêu huỷ TẤT CẢ thẻ 1 năng lượng."],
  ["trum", "Trùm", "", 1, 3, "pas", "S3", "Khi một thẻ địch di chuyển đến đây, trừ 2 sức mạnh của nó."],
  ["xuyentuongnu", "Xuyên Tường Nữ", "", 1, 1, "pas", "S3", "Đầu Lượt: Trả thẻ này về tay bạn. Khi thẻ này trở về tay bạn, +1 sức mạnh."],
  ["hacthan", "Hắc Thần", "", 6, 0, "on", "S3", "Duy Trì: Có tổng sức mạnh của tất cả thẻ bị tiêu huỷ trong ván này."],
  ["tutraonu", "Tử Trảo Nữ", "", 5, 7, "rev", "S3", "Lật: Tiêu huỷ mỗi thẻ tại đây có từ 3 sức mạnh trở xuống."],
  ["dainao", "Đại Não", "", 6, 5, "rev", "S3", "Lật: Sao chép (các) thẻ địch có sức mạnh cao nhất được đặt trong lượt này, nhưng ở phía bạn."],
  ["dianang", "Đỉa Năng", "", 4, 5, "rev", "S2", "Lật: Xoá kỹ năng của các thẻ có năng lượng từ 6 trở lên trên tay đối thủ."],
  ["dathep", "Da Thép", "", 2, 2, "on", "S3", "Duy Trì: Các thẻ hàng trước của bạn không thể bị giảm sức mạnh."],
  ["khitrang", "Khỉ Trắng", "", 1, 3, "pas", "S3", "Cuối ván, thẻ này nhảy từ bộ bài của bạn vào chiến địa bạn có tổng sức mạnh thấp nhất. (chưa đầy)"],
  ["dauto", "Đầu To", "", 5, 7, "rev", "S3", "Lật: Vứt bỏ toàn bộ tay bạn."],
  ["tuvuong", "Từ Vương", "", 6, 12, "rev", "S3", "Lật: Di chuyển tất cả thẻ địch 3 và 4 năng lượng đến chiến địa này."],
  ["phochihuy", "Phó Chỉ Huy", "", 1, 3, "rev", "S3", "Lật: Thêm một thẻ 2 năng lượng ngẫu nhiên vào tay bạn."],
  ["ketudao", "Kẻ Tử Đạo", "", 1, 5, "pas", "S3", "Cuối ván, thẻ này di chuyển sang chiến địa khiến bạn THUA ván. (nếu có thể)"],
  ["khuonmauchu", "Khuôn Mẫu Chủ", "", 2, 3, "rev", "S3", "Lật: Thêm 2 Lính Gác Máy vào tay đối thủ."],
  ["cuongvuong", "Cuồng Vương", "", 2, 6, "rev", "S3", "Lật: Đối thủ rút 2 thẻ."],
  ["nhentre", "Nhện Trẻ", "", 4, 6, "pas", "S3", "Nếu có thẻ đã di chuyển ở lượt trước, thẻ này có năng lượng 1."],
  ["aomongnu", "Ảo Mộng Nữ", "", 2, 3, "rev", "S3", "Lật: Sao chép nhân vật có năng lượng thấp nhất trên tay đối thủ vào tay bạn. Cộng 2 sức mạnh cho nó."],
  ["amban", "Âm Bản", "", 4, -1, "rev", "S3", "Lật: Hoán đổi sức mạnh và năng lượng của tất cả thẻ trong bộ bài của bạn."],
  ["quanthoigian", "Quan Thời Gian", "", 3, 3, "on", "S3", "Duy Trì: Năng lượng của bạn không thể bị tăng. Năng lượng của đối thủ không thể bị giảm."],
  ["trumtruyenhinh", "Trùm Truyền Hình", "", 2, 2, "on", "S3", "Duy Trì: Nếu cả hai phía tại đây đều đầy, +6 sức mạnh."],
  ["nguyetkysi", "Nguyệt Kỵ Sĩ", "", 3, 3, "rev", "S3", "Lật: Vứt bỏ một thẻ có năng lượng chẵn khỏi tay mỗi người chơi."],
  ["huyetbacsi", "Huyết Bác Sĩ", "", 2, 0, "on", "S2", "Duy Trì: +2 sức mạnh cho mỗi lần bạn vứt bỏ một thẻ trong ván này."],
  ["matthamnu", "Mật Thám Nữ", "", 3, 4, "rev", "S2", "Lật: Cộng 1 sức mạnh cho tất cả thẻ trên tay bạn."],
  ["lamconu", "Lam Cơ Nữ", "", 1, 1, "pas", "S3", "Mỗi lượt đối thủ không đặt thẻ vào đây, +2 sức mạnh. (trừ lượt bạn đặt thẻ này)"],
  ["daudanthieunu", "Đầu Đạn Thiếu Nữ", "", 4, 4, "pas", "S3", "Sau khi một nhân vật địch được đặt vào đây, tiêu huỷ nó. (một lần mỗi ván)"],
  ["docnhanchihuy", "Độc Nhãn Chỉ Huy", "", 4, 6, "rev", "S3", "Lật: Thêm 3 thẻ 6 năng lượng ngẫu nhiên vào tay bạn."],
  ["thosanmay", "Thợ Săn Máy", "", 5, 6, "react", "S3", "Khi Bị Tiêu Huỷ: Thêm một bản sao của thẻ này vào mỗi chiến địa khác."],
  ["nucanve", "Nữ Cận Vệ", "", 2, 3, "rev", "S2", "Lật: Cộng 1 sức mạnh cho mọi thẻ trong bộ bài của bạn."],
  ["xichxuctu", "Xích Xúc Tu", "", 4, 6, "on", "S3", "Duy Trì: Nếu bạn đang thắng tại đây, +3 sức mạnh cho các chiến địa khác."],
  ["kinhnhan", "Kình Nhân", "", 6, 11, "on", "S3", "Duy Trì: +7 sức mạnh nếu đây là thẻ duy nhất của bạn tại đây."],
  ["aiquoc", "Ái Quốc", "", 3, 2, "on", "S3", "Duy Trì: Các thẻ không có kỹ năng của bạn có +2 sức mạnh."],
  ["tunu", "Từ Nữ", "", 3, 5, "rev", "S3", "Lật: Di chuyển một thẻ địch 1 hoặc 2 năng lượng đến chiến địa này."],
  ["tamkiemnu", "Tâm Kiếm Nữ", "", 2, 2, "rev", "S3", "Lật: Lượt sau, bạn nhận +1 năng lượng."],
  ["channu", "Chấn Nữ", "", 2, 3, "rev", "S3", "Lật: Hoán đổi vị trí của hai chiến địa còn lại."],
  ["phiconamcanh", "Phi Cơ Năm Cánh", "", 1, 1, "on", "S3", "Duy Trì: Các thẻ được tạo ra của bạn giảm 1 năng lượng. (tối thiểu 1)"],
  ["sodo", "Sọ Đỏ", "", 5, 14, "on", "S3", "Duy Trì: Thẻ đối thủ tại đây có +2 sức mạnh."],
  ["giapcuuho", "Giáp Cứu Hộ", "", 4, 4, "rev", "S3", "Lật: Nếu bạn đặt một thẻ ở chiến địa này lượt sau, +5 sức mạnh."],
  ["tegiap", "Tê Giáp", "", 2, 5, "rev", "S2", "Lật: Thêm một Đá vào phía bạn ở chiến địa này."],
  ["loda", "Lở Đá", "", 4, 5, "rev", "S3", "Lật: Xáo 2 Đá vào bộ bài của đối thủ."],
  ["phanquanbua", "Phán Quan Búa", "", 5, 5, "on", "S3", "Duy Trì: +2 sức mạnh cho mỗi thẻ trên tay đối thủ."],
  ["nanhkiem", "Nanh Kiếm", "", 3, 5, "react", "S2", "Khi Bị Tiêu Huỷ: Trả thẻ này về tay bạn. Nó có năng lượng 0."],
  ["catnhan", "Cát Nhân", "", 5, 8, "rev", "S2", "Lật: Lượt sau, các thẻ tăng 1 năng lượng. (tối đa 6)"],
  ["duclongnhan", "Dực Long Nhân", "", 1, 2, "rev", "S3", "Lật: Xoá kỹ năng của tất cả thẻ Duy Trì trong bộ bài của bạn."],
  ["bocap", "Bọ Cạp", "", 2, 3, "rev", "S2", "Lật: Trừ 1 sức mạnh của các thẻ trên tay đối thủ."],
  ["nguyetyeu", "Nguyệt Yêu", "", 1, 2, "rev", "S3", "Lật: Trừ 3 sức mạnh của thẻ có sức mạnh thấp nhất trên tay mỗi người chơi."],
  ["kimve", "Kim Vệ", "", 4, 9, "rev", "S3", "Bạn không thể đặt thẻ này ở chiến địa bên phải. Lật: Thêm một Hư Không -9 sức mạnh vào chiến địa bên phải."],
  ["thienlenhnu", "Thiên Lệnh Nữ", "", 5, 5, "on", "S3", "Duy Trì: Các thẻ trên tay bạn giảm 1 năng lượng. (tối thiểu 1)"],
  ["vuabong", "Vua Bóng", "", 3, 4, "rev", "S3", "Lật: Đặt lại tất cả thẻ tại đây về sức mạnh gốc."],
  ["quyensu", "Quyền Sư", "", 4, 3, "rev", "S2", "Lật: Tiêu huỷ một thẻ đối thủ tại đây có 10 sức mạnh trở lên."],
  ["nuchuarung", "Nữ Chúa Rừng", "", 3, 4, "rev", "S3", "Lật: Thêm một nhân vật 1 năng lượng ngẫu nhiên vào mỗi chiến địa."],
  ["nucuongnhan", "Nữ Cuồng Nhân", "", 6, 10, "pas", "S3", "Giảm 1 năng lượng cho mỗi năng lượng chưa dùng ở lượt trước."],
  ["congchuacongnghe", "Công Chúa Công Nghệ", "", 4, 3, "rev", "S3", "Lật: Nếu bạn đặt thẻ tiếp theo ở chiến địa này, nhân đôi sức mạnh của nó."],
  ["tonu", "Tơ Nữ", "", 2, 5, "pas", "S3", "Sau khi BẤT KỲ thẻ nào được đặt tại đây, di chuyển thẻ này đến một chiến địa khác."],
  ["ngankiemsi", "Ngân Kiếm Sĩ", "", 4, 6, "rev", "S3", "Lật: Mỗi người chơi vứt bỏ nhân vật có sức mạnh thấp nhất trên tay họ."],
  ["nganluot", "Ngân Lướt", "", 3, 2, "rev", "S3", "Lật: Cộng 2 sức mạnh cho các thẻ 3 năng lượng khác của bạn."],
  ["heonhen", "Heo Nhện", "", 1, 1, "act", "S3", "Kích Hoạt: Thay kỹ năng của một nhân vật ngẫu nhiên trên tay đối thủ bằng \"oink!\""],
  ["nhennhan", "Nhện Nhân", "", 2, 4, "rev", "S3", "Lật: Di chuyển đến một chiến địa khác và kéo một thẻ đối thủ từ đây sang đó."],
  ["nhenhauthe", "Nhện Hậu Thế", "", 4, 5, "pas", "S3", "Có thể di chuyển 1 lần. Khi thẻ này di chuyển đến một chiến địa, trừ 3 sức mạnh một thẻ đối thủ ở đó."],
  ["caonu", "Cao Nữ", "", 5, 7, "pas", "S3", "Có năng lượng 1 nếu đối thủ đã vứt bỏ một thẻ trong ván này."],
  ["kiemlongnhan", "Kiếm Long Nhân", "", 4, 7, "rev", "S3", "Lật: Di chuyển một thẻ đối thủ tại đây sang chiến địa bên phải."],
  ["baonu", "Bão Nữ", "", 3, 1, "rev", "S2", "Lật: Làm ngập chiến địa này. Lượt sau là lượt cuối có thể đặt thẻ tại đây."],
  ["vetmattroi", "Vết Mặt Trời", "", 1, 0, "end", "S2", "Cuối Lượt: Nhận +1 sức mạnh cho mỗi năng lượng chưa dùng."],
  ["bayong", "Bầy Ong", "", 1, 3, "react", "S2", "Khi Bị Vứt Bỏ: Thêm hai bản sao của thẻ này có năng lượng 0 vào tay bạn."],
  ["suphunhai", "Sư Phụ Nhại", "", 6, 0, "rev", "S3", "Lật: Chỉnh sức mạnh của thẻ này bằng sức mạnh của thẻ cuối cùng bạn đặt. (nếu có thể)"],
  ["nhasuutam", "Nhà Sưu Tầm", "", 2, 3, "pas", "S2", "Khi một thẻ vào tay bạn từ bất kỳ đâu (trừ bộ bài), +1 sức mạnh."],
  ["trummu", "Trùm Mũ", "", 1, -3, "rev", "S3", "Lật: Thêm một Quỷ vào tay bạn."],
  ["vohannhan", "Vô Hạn Nhân", "", 6, 20, "pas", "S2", "Nếu bạn đã đặt một thẻ ở lượt trước, bạn không thể đặt thẻ này."],
  ["loithan", "Lôi Thần", "", 3, 5, "rev", "S3", "Lật: Xáo Búa Sấm vào bộ bài của bạn."],
  ["lucnu", "Lực Nữ", "", 1, 5, "pas", "S3", "Sau khi BẤT KỲ thẻ nào được đặt tại đây, thẻ này đổi phe."],
  ["dichnu", "Dịch Nữ", "", 4, 10, "on", "S3", "Duy Trì: Các thẻ khác của bạn tại đây có -2 sức mạnh."],
  ["cohoang", "Cơ Hoàng", "", 6, 8, "rev", "S3", "Lật: Triệu hồi bốn Máy Bay Con 2 sức mạnh vào mỗi chiến địa khác."],
  ["nuthanchienma", "Nữ Thần Chiến Mã", "", 5, 3, "rev", "S3", "Lật: Đặt TẤT CẢ thẻ tại đây thành 3 sức mạnh."],
  ["hacdich", "Hắc Dịch", "", 3, 3, "rev", "S3", "Lật: Tiêu huỷ các thẻ khác của bạn tại đây. Cộng sức mạnh của chúng vào thẻ này."],
  ["ranlucnu", "Rắn Lục Nữ", "", 3, 4, "rev", "S3", "Lật: Một thẻ khác của bạn tại đây có sức mạnh thấp nhất đổi phe."],
  ["huyenco", "Huyễn Cơ", "", 5, 9, "pas", "S2", "Có thể di chuyển"],
  ["kenken", "Kền Kền", "", 1, 3, "pas", "S2", "Khi thẻ này di chuyển, +4 sức mạnh."],
  ["chienlo", "Chiến Lộ", "", 4, 5, "on", "S2", "Duy Trì: Nếu có chiến địa nào của bạn trống, +5 sức mạnh."],
  ["ongnu", "Ong Nữ", "", 0, 1, "none", "S3", ""],
  ["songnu", "Sóng Nữ", "", 3, 6, "rev", "S3", "Lật: Tất cả thẻ có năng lượng tối đa 4 cho đến hết lượt sau."],
  ["thuthu", "Thủ Thư", "", 4, 2, "on", "S3", "Duy Trì: Các kỹ năng Lật của bạn tại đây được lặp lại."],
  ["ongvang", "Ong Vàng", "", 0, 2, "rev", "S3", "Lật: Trừ 1 sức mạnh của các thẻ khác của bạn tại đây."],
  ["horangkiem", "Hổ Răng Kiếm", "", 1, 1, "rev", "S3", "Lật: Giảm 1 năng lượng cho mỗi thẻ 4 năng lượng trong bộ bài bạn."],
  ["sokhong", "Số Không", "", 1, 3, "rev", "S3", "Lật: Xoá các kỹ năng của thẻ tiếp theo bạn đặt."],
  ["vetcandoc", "Vết Cắn Độc", "", 0, -1, "none", "PH", "Khi thẻ này còn trên tay, bạn không rút được bài."],
  ["trungcon", "Trùng Con", "", 3, 2, "none", "PH", "Thẻ phụ."],
  ["linhmuadong", "Lính Mùa Đông", "", 2, 8, "none", "PH", "Thẻ phụ."],
  ["baoco", "Bạo Cơ", "", 6, 5, "none", "PH", "Thẻ phụ."],
  ["hukhong", "Hư Không", "", 4, -9, "none", "PH", "Thẻ phụ."],
  ["quy", "Quỷ", "", 1, 6, "none", "PH", "Thẻ phụ."],
  ["buasam", "Búa Sấm", "", 0, 0, "rev", "PH", "Lật: Lôi Thần +7 sức mạnh."],
  ["maybaycon", "Máy Bay Con", "", 1, 2, "none", "PH", "Thẻ phụ."],
  ["hapthunhan", "Hấp Thụ Nhân", "", 4, 5, "rev", "S3", "Lật: Nếu thẻ cuối cùng bạn đặt có Lật, sao chép kỹ năng của nó. (nếu có thể)"],
  ["laophuthuy", "Lão Phù Thuỷ", "", 6, 12, "start", "S3", "Đầu Ván: Rút Lão Phù Thuỷ. Bà ta điều khiển các thẻ của bạn vào các lượt chẵn."],
  ["vouy", "Vô Uý", "", 2, 3, "pas", "S3", "Ở lượt 5, bạn được xem các nước đi của đối thủ trước khi đi nước của mình."],
  ["vitthamtu", "Vịt Thám Tử", "", 1, 2, "on", "S3", "Duy Trì: Chạm vào thẻ này để xem thẻ trên cùng của bộ bài bạn."],
  ["annu", "Ẩn Nữ", "", 2, 4, "on", "S3", "Duy Trì: Các thẻ bạn đặt tại đây không được lật cho đến khi ván đấu kết thúc."],
  ["phuongtamnu", "Phượng Tâm Nữ", "", 3, 4, "on", "S3", "Duy Trì: Mỗi lượt, người chơi phải đặt thẻ đầu tiên của họ tại đây. (nếu có thể)"],
  ["khuyendichchuyen", "Khuyển Dịch Chuyển", "", 2, 3, "act", "S3", "Kích Hoạt: Sau khi bạn đặt nhân vật tiếp theo, đổi nó với một thẻ từ bộ bài của bạn."],
  ["kiemnuuminh", "Kiếm Nữ U Minh", "", 3, 2, "rev", "S3", "Lật: Thay chiến địa này bằng 'U Minh'. Không có tác dụng sau lượt 5."],
  ["aothuatgia", "Ảo Thuật Gia", "", 2, 5, "rev", "S3", "Lật: Thêm một Ảo Ảnh vào một chiến địa khác. Kích Hoạt: Hoán đổi sức mạnh với nó."],
  ["thiendien", "Thiên Diện", "", 3, 1, "rev", "S3", "Lật: Nếu thẻ cuối cùng bạn đặt có kỹ năng Duy Trì, sao chép kỹ năng của nó. (nếu có thể)"],
  ["haplucnu", "Hấp Lực Nữ", "", 3, 3, "rev", "S3", "Lật: Lấy kỹ năng của một thẻ Duy Trì của đối thủ tại đây."],
  ["tuyetve", "Tuyết Vệ", "", 1, 2, "rev", "S3", "Lật: Thêm các aurora Ưng và Gấu vào tay bạn."],
  ["sieudihinh", "Siêu Dị Hình", "", 4, 2, "on", "S3", "Duy Trì: Có kỹ năng Duy Trì của tất cả thẻ đối thủ."],
  ["aoanh", "Ảo Ảnh", "", 2, 0, "none", "PH", "Đâu mới là Ảo Thuật Gia thật?"],
  ["cucquangung", "Cực Quang Ưng", "", 3, 3, "rev", "PH", "Lật: Bỏ qua mọi kỹ năng chiến địa đến hết lượt sau."],
  ["cucquanggau", "Cực Quang Gấu", "", 3, 4, "rev", "PH", "Lật: Kích lại hiệu ứng lộ diện của chiến địa này."],
  ["thongkho", "Thống Khổ", "", 1, 2, "pas", "S4", "Sau khi bạn đặt 1 thẻ tại đây, hợp thể thẻ này vào thẻ đó."],
  ["lukhachtroi", "Lữ Khách Trời", "", 3, 4, "react", "S4", "Khi Bị Tiêu Huỷ: Thay thẻ này bằng 1 thẻ 4 năng lượng từ tay hoặc bộ bài của bạn."],
  ["trungvuong", "Trùng Vương", "", 5, 8, "rev", "S4", "Lật: Các thẻ của bạn có sức mạnh dưới 0 đổi phe. Tiêu huỷ những thẻ không thể đổi."],
  ["hauduethoikhong", "Hậu Duệ Thời Không", "", 2, 3, "act", "S4", "Kích Hoạt: Tạo 1 thẻ 1 năng lượng tại chiến địa khác. Tăng năng lượng mỗi lần bạn đang thắng tại đây khi lượt bắt đầu."],
  ["honxuatkhieu", "Hồn Xuất Khiếu", "", 3, 0, "rev", "S4", "Lật: Sao chép kỹ năng của 1 thẻ Lật trên tay bạn."],
  ["dauvuong", "Đầu Vuông", "", 2, 3, "act", "S4", "Kích Hoạt: Cho 1 thẻ của bạn ở mỗi chiến địa khác +2 sức mạnh."],
  ["cuocthu", "Cước Thủ", "", 1, 2, "pas", "S4", "Khi một thẻ di chuyển, thẻ này đi theo và nhận +2 sức mạnh. (một lần mỗi lượt)"],
  ["madienloi", "Mã Diện Lôi", "", 4, 6, "rev", "S4", "Lật: Xáo Rìu Bão vào bộ bài của bạn."],
  ["hackysi", "Hắc Kỵ Sĩ", "", 1, 2, "pas", "S4", "Sau khi bạn vứt bỏ một thẻ, thêm Hắc Kiếm vào tay bạn với sức mạnh của thẻ đó. (một lần mỗi ván)"],
  ["khoithit", "Khối Thịt", "", 6, 0, "rev", "S4", "Lật: Hợp thể các thẻ từ bộ bài của bạn vào thẻ này cho đến khi nó nhận được từ 13 sức mạnh trở lên."],
  ["dannguoi", "Đạn Người", "", 5, 5, "rev", "S4", "Lật: Di chuyển thẻ địch có sức mạnh cao nhất tại đây đi nơi khác. Nếu không thể, tiêu huỷ nó bằng 1 Đá."],
  ["tackehoa", "Tắc Kè Hoa", "", 3, 3, "rev", "S4", "Lật: Sao chép kỹ năng của 1 thẻ khác tại đây mà bạn đã lật trong lượt này."],
  ["xanhan", "Xà Nhân", "", 2, 3, "act", "S4", "Kích Hoạt: Tiêu huỷ 1 thẻ địch được tạo ra tại đây."],
  ["quadao", "Quạ Đao", "", 3, 5, "rev", "S4", "Lật: Vứt bỏ 2 thẻ khỏi tay bạn để nhận +1 năng lượng tối đa."],
  ["hacthachtuong", "Hắc Thạch Tướng", "", 4, 10, "pas", "S4", "Bạn chỉ có thể đặt thẻ này ở nơi bạn có 1 thẻ 1 năng lượng."],
  ["monghoang", "Móng Hoang", "", 3, 4, "rev", "S4", "Lật: Thêm Mảnh Kiếm Quỷ vào tay bạn."],
  ["phonghiem", "Phòng Hiểm", "", 4, 6, "act", "S4", "Kích Hoạt: Tiêu huỷ 1 thẻ địch tại đây có sức mạnh thấp hơn."],
  ["ungtoi", "Ưng Tối", "", 5, 3, "on", "S4", "Duy Trì: +2 sức mạnh cho mỗi thẻ trong bộ bài đối thủ."],
  ["hopamdiectai", "Hợp Âm Điếc Tai", "", 1, 0, "rev", "S4", "Lật: Xoá kỹ năng của 1 nhân vật địch từ 3 năng lượng trở xuống tại đây."],
  ["battymienvien", "Bát Tý Miền Viễn", "", 2, 2, "rev", "S4", "Lật: Đặt thẻ ngoài cùng bên trái trên tay bạn lên trên cùng bộ bài để nhận 1 nhân vật ngẫu nhiên. Cho cả hai +3 sức mạnh."],
  ["longchu", "Long Chủ", "", 5, 5, "rev", "S4", "Lật: Đặt 1 thẻ từ tay bạn vào đây."],
  ["thosanhuyetthach", "Thợ Săn Huyết Thạch", "", 3, 5, "pas", "S4", "Mỗi thẻ bạn đặt để lấp đầy phía bạn ở một chiến địa nhận +2 sức mạnh."],
  ["loanxa", "Loạn Xạ", "", 3, 4, "pas", "S4", "Đầu Lượt: Lấy 1 năng lượng thưởng từ đối thủ. (nếu họ có)"],
  ["thuytoquyen", "Thuỷ Tổ Quyền", "", 4, 5, "act", "S4", "Kích Hoạt: Cho các thẻ khác của bạn tại đây +1 sức mạnh và di chuyển chúng sang phải."],
  ["xebay", "Xe Bay", "", 4, 5, "act", "S4", "Kích Hoạt: Cho các thẻ Cuối Lượt của bạn +2 sức mạnh."],
  ["cunemthantoc", "Cú Ném Thần Tốc", "", 2, 0, "rev", "S4", "Lật: Tiêu huỷ thẻ có sức mạnh cao nhất của bạn tại đây để giảm sức mạnh âm tương ứng cho 1 thẻ địch tại đây."],
  ["hoasu", "Hoả Sứ", "", 4, 7, "rev", "S4", "Lật: Hồi sinh 1 thẻ 3 năng lượng bị vứt bỏ hoặc bị tiêu huỷ của bạn tại đây."],
  ["giacdausi", "Giác Đấu Sĩ", "", 3, 8, "rev", "S4", "Lật: Thêm 1 thẻ từ bộ bài đối thủ về phía họ ở chiến địa này. Nếu nó có sức mạnh thấp hơn, tiêu huỷ nó."],
  ["giacnguu", "Giác Ngưu", "", 2, 3, "on", "S4", "Duy Trì: Các thẻ được tạo ra của đối thủ tăng 1 năng lượng. (tối đa 6)"],
  ["kychu", "Kỳ Chủ", "", 2, 3, "rev", "S4", "Lật: Di chuyển 1 thẻ Lật khác của bạn tại đây đến chiến địa giữa. Kỹ năng của nó kích hoạt lại."],
  ["nguumamienvien", "Ngưu Ma Miền Viễn", "", 3, 3, "end", "S4", "Cuối Lượt: Trừ 1 sức mạnh cho TẤT CẢ các thẻ khác tại đây. Sau đó tiêu huỷ các thẻ khác của bạn tại đây có sức mạnh từ 0 trở xuống."],
  ["niemluctu", "Niệm Lực Tử", "", 5, 8, "rev", "S4", "Lật: Lượt sau, các thẻ của bạn có thể di chuyển (Dời Được) đến chiến địa này."],
  ["khisatthu", "Khỉ Sát Thủ", "", 3, 3, "rev", "S4", "Lật: Nhận +2 sức mạnh cho mỗi thẻ khác bạn đã đặt trong lượt này."],
  ["thuynhan", "Thuỷ Nhân", "", 5, 10, "rev", "S4", "Lật: Chỉnh năng lượng của thẻ trên cùng MỖI bộ bài thành 1."],
  ["nokiem", "Nộ Kiếm", "", 4, 12, "pas", "S4", "Bạn chỉ có thể đặt thẻ này ở nơi có thẻ địch đang bị trừ sức mạnh."],
  ["thietthieunien", "Thiết Thiếu Niên", "", 4, 7, "rev", "S4", "Lật: Sao chép kỹ năng của thẻ trên cùng bộ bài bạn."],
  ["chubao", "Chủ Báo", "", 1, 3, "on", "S4", "Duy Trì: Biểu cảm chữ của bạn thô lỗ hơn."],
  ["phuthuydamlay", "Phù Thuỷ Đầm Lầy", "", 2, 3, "act", "S4", "Kích Hoạt: Lượt sau, bạn nhận +1 năng lượng."],
  ["vualunren", "Vua Lùn Rèn", "", 1, 3, "act", "S4", "Kích Hoạt: Rút một thẻ được tạo ra từ bộ bài của bạn."],
  ["roidich", "Roi Dịch", "", 2, 2, "act", "S4", "Kích Hoạt: Giảm sức mạnh của một thẻ địch tại đây một lượng bằng sức mạnh của thẻ này."],
  ["bangvuong", "Băng Vương", "", 4, 5, "rev", "S4", "Lật: Lấy 1 sức mạnh từ mỗi thẻ khác tại đây."],
  ["quandoanmotnguoi", "Quân Đoàn Một Người", "", 5, 7, "rev", "S4", "Lật: Thay mỗi chiến địa khác bằng chiến địa này."],
  ["trathan", "Trá Thần", "", 1, 2, "rev", "S4", "Lật: Thay bộ bài của bạn bằng bộ bài ban đầu của đối thủ. Giảm 1 năng lượng của các thẻ đó."],
  ["cuongtri", "Cuồng Trí", "", 1, 3, "pas", "S4", "Đầu Lượt (sau khi rút): +2 sức mạnh nếu tay bạn đã đầy."],
  ["cuvocanhhungvi", "Cú Vỗ Cánh Hùng Vĩ", "", 1, 0, "rev", "S4", "Lật: Cộng 3 sức mạnh cho thẻ ngoài cùng bên trái trên tay bạn. Nếu nó có năng lượng từ 5 trở lên, giảm thêm 1 năng lượng."],
  ["thieutachienthang", "Thiếu Tá Chiến Thắng", "", 3, 5, "rev", "S4", "Lật: Thêm 2 thành viên của đội Vệ Binh vào tay bạn."],
  ["damquai", "Đầm Quái", "", 4, 7, "on", "S4", "Duy Trì: Các thẻ có năng lượng từ 3 trở xuống tại đây có -2 sức mạnh."],
  ["cotnu", "Cốt Nữ", "", 2, 3, "pas", "S4", "Khi Bị Vứt Bỏ hoặc Bị Tiêu Huỷ: Chia ngẫu nhiên -7 sức mạnh cho các thẻ địch."],
  ["thuyngannu", "Thuỷ Ngân Nữ", "", 3, 4, "pas", "S4", "Có thể di chuyển một lần. Duy Trì: Thẻ địch tại đây không thể di chuyển."],
  ["trungchien", "Trùng Chiến", "", 1, 1, "pas", "S4", "Khi bạn vứt bỏ một thẻ, thẻ này nhận +1 sức mạnh và có thể di chuyển ở lượt sau."],
  ["chuotchuivuong", "Chuột Chũi Vương", "", 3, 4, "rev", "S4", "Lật: Trục xuất thẻ trên cùng bộ bài bạn. Thêm 2 Đá vào tay bạn. Chỉnh sức mạnh của chúng bằng năng lượng của thẻ bị trục xuất."],
  ["mauthoikhong", "Mẫu Thời Không", "", 4, 4, "rev", "S4", "Lật: Sao chép thẻ ngoài cùng bên trái trên tay bạn. Cho bản sao -1 năng lượng và +2 sức mạnh."],
  ["kynu", "Kỳ Nữ", "", 4, 5, "on", "S4", "Duy Trì: Các chiến địa liền kề của bạn có từ 2 thẻ trở lên và không có năng lượng trùng nhau có +6 sức mạnh."],
  ["quytu", "Quỷ Tử", "", 1, 3, "pas", "S4", "Sau khi bạn đặt một kỹ năng, +1 sức mạnh."],
  ["linhgaccuoi", "Lính Gác Cuối", "", 4, 3, "act", "S4", "Kích Hoạt: Trừ 7 sức mạnh của thẻ địch có sức mạnh cao nhất."],
  ["datientri", "Đá Tiên Tri", "", 5, 9, "on", "S4", "Duy Trì: Các Đá của bạn có +3 sức mạnh."],
  ["thantho", "Thần Thợ", "", 3, 4, "rev", "S4", "Lật: Giảm 1 năng lượng hoặc cộng 2 sức mạnh cho mỗi thẻ trong bộ bài của bạn."],
  ["phuonghoa", "Phượng Hoả", "", 4, 5, "rev", "S4", "Lật: Hồi sinh một thẻ đã bị tiêu huỷ của bạn và hợp thể thẻ này vào nó. Nó có thể di chuyển."],
  ["tienbui", "Tiên Bụi", "", 2, 3, "rev", "S4", "Lật: Xáo trộn năng lượng gốc của tất cả thẻ trong bộ bài bạn mà vốn bắt đầu ở đó."],
  ["catlun", "Cát Lún", "", 2, 4, "pas", "S4", "Lần tới khi đối thủ bắt đầu lượt với năng lượng thưởng, họ sẽ không nhận được."],
  ["nuphanquan", "Nữ Phán Quan", "", 2, 2, "on", "S4", "Duy Trì: Các thẻ có 1 sức mạnh trở xuống của bạn giảm 1 năng lượng. (tối thiểu 1)"],
  ["dichdo", "Dịch Đỏ", "", 2, 3, "rev", "S4", "Lật: Vứt bỏ thẻ ngoài cùng bên trái trên tay bạn để thêm một thẻ ngẫu nhiên cùng năng lượng vào tay bạn."],
  ["baocat", "Bão Cát", "", 2, 0, "rev", "S4", "Lật: Thêm 2 Đá vào tay bạn. Cộng 1 sức mạnh cho chúng với mỗi nhân vật hàng trước của bạn."],
  ["nguoituyet", "Người Tuyết", "", 6, 11, "pas", "S4", "Giảm 1 năng lượng cho mỗi thẻ bạn đã đặt lượt trước."],
  ["nganluotsokhai", "Ngân Lướt Sơ Khai", "", 3, 5, "end", "S4", "Cuối Lượt: Nếu bạn đang thắng chiến địa này với một thẻ Lật, sao chép kỹ năng của nó."],
  ["cuongtu", "Cuồng Tử", "", 7, 12, "pas", "S4", "Giảm 2 năng lượng cho mỗi thẻ của bạn có 10 sức mạnh trở lên."],
  ["giacquannhen", "Giác Quan Nhện", "", 5, 0, "rev", "S4", "Lật: Cộng 3 sức mạnh cho các nhân vật của bạn tại đây. Giảm 1 năng lượng cho mỗi thẻ có thể di chuyển bạn đã đặt."],
  ["ungsao", "Ưng Sao", "", 2, 3, "rev", "S4", "Lật: +1 sức mạnh cho các thẻ của bạn ở chiến địa bên trái nếu là lượt lẻ, nếu không thì cho chiến địa bên phải."],
  ["laogay", "Lão Gậy", "", 4, 3, "rev", "S4", "Lật: Tăng cho thẻ tiếp theo bạn đặt lượng sức mạnh bằng sức mạnh của thẻ này."],
  ["maythichnghi", "Máy Thích Nghi", "", 3, 5, "rev", "S4", "Lật: Lấy kỹ năng của một thẻ Kích Hoạt của đối thủ tại đây."],
  ["sieusaokhonglo", "Siêu Sao Khổng Lồ", "", 4, 5, "rev", "S4", "Lật: Tất cả thẻ được đặt ở lượt sau sẽ không lật cho đến khi ván đấu kết thúc."],
  ["diaba", "Địa Bá", "", 3, 4, "rev", "S4", "Lật: Với mỗi chiến địa, xáo một Đá vào bộ bài của người chơi đang thua ở đó."],
  ["matocdautien", "Ma Tốc Đầu Tiên", "", 2, 8, "rev", "S4", "Lật: Vứt bỏ nhân vật có sức mạnh thấp nhất khỏi tay bạn. Trừ sức mạnh của thẻ đó khỏi thẻ này."],
  ["condoi", "Cơn Đói", "", 1, 0, "rev", "S4", "Lật: Bầy Xác +3."],
  ["daonghich", "Đảo Nghịch", "", 3, 0, "rev", "S4", "Lật: Đảo ngược sức mạnh của (các) thẻ có sức mạnh thấp nhất tại đây. (dương thành âm và ngược lại)"],
  ["toaansong", "Toà Án Sống", "", 6, 9, "on", "S4", "Duy Trì: Chia đều tổng sức mạnh của bạn cho tất cả chiến địa."],
  ["biamo", "Bia Mộ", "", 2, 5, "rev", "S4", "Lật: Tiêu huỷ thẻ có sức mạnh thấp nhất của bạn ở mỗi chiến địa khác."],
  ["hoangngoc", "Hoàng Ngọc", "", 2, 4, "pas", "S4", "Sau khi bạn đặt một thẻ tại đây, di chuyển nó đến chiến địa ở giữa."],
  ["chodoc", "Chó Độc", "", 2, 3, "rev", "S4", "Lật: Cộng 2 sức mạnh cho 2 nhân vật trên tay bạn. Bạn không thể đặt chúng ở lượt sau."],
  ["ngunhan", "Ngư Nhân", "", 3, 6, "rev", "S4", "Lật: Cộng 3 sức mạnh cho nhân vật cuối cùng MỖI người chơi đã đặt ở lượt trước."],
  ["chuhien", "Chú Hiền", "", 1, 2, "react", "S4", "Khi Bị Tiêu Huỷ: Thay thẻ này bằng Nhện Nhân."],
  ["nubatuoc", "Nữ Bá Tước", "", 2, 3, "rev", "S4", "Lật: Thêm một thẻ 6 năng lượng ngẫu nhiên vào tay bạn. Cho nó -2 năng lượng và -2 sức mạnh."],
  ["linhthuelammom", "Lính Thuê Lắm Mồm", "", 2, 2, "react", "S4", "Khi Bị Tiêu Huỷ: Thay thẻ này bằng một thẻ 1 năng lượng từ tay hoặc bộ bài của bạn với +2 sức mạnh."],
  ["cuduto", "Cú Đu Tơ", "", 1, 0, "rev", "S4", "Lật: Lượt sau, một thẻ của bạn tại đây có thể di chuyển và nhận +1 sức mạnh khi di chuyển. (bạn chọn)"],
  ["nguoisoidem", "Người Sói Đêm", "", 3, 3, "pas", "S4", "Sau khi bạn đặt một thẻ, di chuyển đến đó để nhận +2 sức mạnh nếu thẻ đó có Lật."],
  ["duatrehoang", "Đứa Trẻ Hoang", "", 2, 1, "on", "S4", "Duy Trì: +4 sức mạnh nếu bạn đã vứt bỏ một thẻ. +4 sức mạnh nếu một thẻ của bạn đã bị tiêu huỷ."],
  ["vuotnu", "Vuốt Nữ", "", 1, 1, "pas", "S4", "Khi Bị Vứt Bỏ hoặc Bị Tiêu Huỷ: Hồi sinh thẻ này ở một chiến địa ngẫu nhiên và bạn nhận +1 năng lượng ở lượt sau."],
  ["xaccunhan", "Xác Cự Nhân", "", 5, 4, "rev", "S4", "Lật: Bầy Xác +2, sau đó thẻ này nhận sức mạnh bằng Zombie Bầy Xác của bạn."],
  ["xacdathep", "Xác Da Thép", "", 2, 4, "end", "S4", "Cuối Lượt: Nếu bạn đang thắng tại đây, vứt bỏ thẻ ngoài cùng bên trái trên tay bạn."],
  ["xackimve", "Xác Kim Vệ", "", 2, 1, "rev", "S4", "Lật: Bầy Xác +1 cho mỗi thẻ của bạn ở chiến địa bên phải."],
  ["riubao", "Rìu Bão", "", 0, 4, "rev", "PH", "Lật: Nhân đôi sức mạnh của Mã Diện Lôi."],
  ["manhkiemquy", "Mảnh Kiếm Quỷ", "", 1, 1, "react", "PH", "Khi bị vứt bỏ hoặc tiêu huỷ: nhân đôi sức mạnh của Móng Hoang."],
  ["hackiem", "Hắc Kiếm", "", 4, 0, "on", "PH", "Duy Trì: Không thể bị tiêu huỷ."],
  ["bayxac", "Bầy Xác", "", 0, 0, "none", "PH", "Thẻ phụ. Lớn dần theo các kỹ năng Bầy Xác."],
  ["dichcuongcot", "Dịch Cường Cốt", "", 4, 0, "rev", "S5", "Lật: Trục xuất thẻ này để hồi sinh thẻ bị tiêu huỷ có sức mạnh cao nhất của bạn tại đây với sức mạnh gấp đôi."],
  ["conhansu", "Cổ Nhãn Sư", "", 5, 10, "start", "S5", "Đầu Ván: Xáo 4 Cổ Thuật vào bộ bài của bạn."],
  ["hacdichbinh", "Hắc Dịch Binh", "", 2, 5, "rev", "S5", "Lật: Chỉnh sức mạnh của tất cả thẻ trong bộ bài của bạn thành 3."],
  ["kevocam", "Kẻ Vô Cảm", "", 5, 7, "on", "S5", "Duy Trì: +1 sức mạnh cho mỗi thẻ trên bàn đang bị trừ sức mạnh."],
  ["maynuotthoigian", "Mây Nuốt Thời Gian", "", 6, 7, "rev", "S5", "Lật: Xoá kỹ năng của tất cả nhân vật địch chưa được lật tại đây."],
  ["nghichtuvuong", "Nghịch Từ Vương", "", 6, 8, "rev", "S5", "Lật: Thêm 1 thẻ 3 hoặc 4 năng lượng từ tay bạn vào mỗi chiến địa khác."],
  ["bachdich", "Bạch Dịch", "", 4, 7, "rev", "S5", "Lật: Chỉnh năng lượng và sức mạnh của thẻ trên cùng bộ bài của bạn thành 0."],
  ["nhennon", "Nhện Non", "", 1, 2, "act", "S5", "Kích Hoạt: Sau khi bạn đặt thẻ tiếp theo, cho nó +1 sức mạnh và di chuyển nó sang phải."],
  ["kysituduc", "Kỵ Sĩ Tử Dực", "", 2, 4, "pas", "S5", "Nhiệm Vụ: Thẻ của bạn bị tiêu huỷ 4 lần → Hồi sinh 1 thẻ tại đây với +5 sức mạnh. (0/4)"],
  ["chienthan", "Chiến Thần", "", 4, 7, "rev", "S5", "Lật: So sánh sức mạnh của 3 thẻ trên cùng của cả hai bộ bài. Nếu tổng của bạn cao hơn, +6 sức mạnh."],
  ["phanquanthiengioi", "Phán Quan Thiên Giới", "", 7, 7, "start", "S5", "Đầu Ván: Xáo 12 thẻ mới vào bộ bài của bạn. Ở lượt 3, nhận +1 năng lượng tối đa."],
  ["cucquang", "Cực Quang", "", 6, 5, "rev", "S5", "Lật: Cho 1 thẻ Lật khác của bạn ở mỗi chiến địa +2 sức mạnh. Lặp lại với Duy Trì, Kích Hoạt và Cuối Lượt."],
  ["namtuocmatna", "Nam Tước Mặt Nạ", "", 3, 5, "rev", "S5", "Lật: Chiêu mộ thẻ có năng lượng thấp nhất từ bộ bài đối thủ về phía bạn ở chiến địa này."],
  ["phaodaimay", "Pháo Đài Máy", "", 4, 3, "rev", "S5", "Lật: Thêm bản sao các thẻ khác của bạn tại đây vào tay bạn. Chỉnh năng lượng của chúng thành 2 và sức mạnh thành 3."],
  ["thienngaden", "Thiên Nga Đen", "", 2, 3, "act", "S5", "Kích Hoạt: Cho đến hết lượt sau, các thẻ 1 năng lượng của bạn có năng lượng 0."],
  ["thiemnu", "Thiểm Nữ", "", 5, 8, "rev", "S5", "Lật: Hoán đổi thẻ cuối cùng bạn đặt với 1 thẻ có năng lượng bằng hoặc cao hơn từ bộ bài của bạn."],
  ["phitieuhoi", "Phi Tiêu Hồi", "", 2, 2, "pas", "S5", "Khi thẻ này trở về tay bạn, lấy ngẫu nhiên 4 sức mạnh từ các nhân vật trên tay đối thủ. Kích Hoạt: Trả thẻ này về tay bạn."],
  ["tiensigamma", "Tiến Sĩ Gamma", "", 2, 1, "end", "S5", "Cuối Lượt: Nếu bạn còn năng lượng chưa dùng, 33% cơ hội HOÁ CUỒNG!"],
  ["hongtam", "Hồng Tâm", "", 3, 2, "act", "S5", "Kích Hoạt: Vứt bỏ tất cả thẻ có năng lượng từ 1 trở xuống khỏi tay bạn. Trừ 2 sức mạnh cho chừng đó thẻ địch khác nhau."],
  ["thachlucnu", "Thạch Lực Nữ", "", 3, 5, "on", "S5", "Duy Trì: Các thẻ 1 và 6 năng lượng của bạn không thể bị tiêu huỷ."],
  ["kysidichkhuyen", "Kỵ Sĩ Dịch Khuyển", "", 3, 4, "pas", "S5", "Nhiệm Vụ: Có 3 thẻ từ 4 năng lượng trở lên trên bàn → Trừ 6 sức mạnh cho thẻ địch có năng lượng cao nhất. (0/3)"],
  ["kysidaoquoc", "Kỵ Sĩ Đảo Quốc", "", 2, 2, "pas", "S5", "Sau khi bạn đặt 1 thẻ từ 4 năng lượng trở lên, cho nó +1 sức mạnh và cho 1 thẻ trên tay bạn -1 năng lượng."],
  ["nuthuantuong", "Nữ Thuẫn Tướng", "", 3, 2, "on", "S5", "Duy Trì: Cộng sức mạnh của thẻ này vào các thẻ hàng sau của bạn tại đây. (không cộng cho chính nó)"],
  ["tammanu", "Tâm Ma Nữ", "", 3, 0, "rev", "S5", "Lật: Lấy 1 sức mạnh từ mỗi thẻ trong bộ bài đối thủ."],
  ["longuclua", "Lò Ngực Lửa", "", 2, 1, "act", "S5", "Kích Hoạt: +2 sức mạnh cho mỗi thẻ từ 5 năng lượng trở lên bạn có tại đây và trên tay."],
  ["daitaxacsong", "Đại Tá Xác Sống", "", 3, 4, "on", "S5", "Duy Trì: Các thẻ khác của bạn tại đây có +1 sức mạnh cho mỗi lượt bạn đã vứt bỏ thẻ. (0 lượt.)"],
  ["nhaihinh", "Nhại Hình", "", 3, 5, "pas", "S5", "Khi bạn rút thẻ này, sao chép kỹ năng của thẻ dưới cùng bộ bài đối thủ."],
  ["matocvutru", "Ma Tốc Vũ Trụ", "", 5, 6, "rev", "S5", "Lật: Xoá kỹ năng của các thẻ địch hàng trước tại đây."],
  ["tuthanmienvien", "Tử Thần Miền Viễn", "", 5, 9, "rev", "S5", "Lật: Hồi sinh tất cả nhân vật bị tiêu huỷ của bạn đến → các chiến địa ngẫu nhiên."],
  ["kimcuongxa", "Kim Cương Xà", "", 3, 3, "on", "S5", "Duy Trì: Các thẻ địch tại đây đang bị trừ sức mạnh chịu thêm -2 sức mạnh."],
  ["baochuahauthe", "Bạo Chúa Hậu Thế", "", 4, 6, "end", "S5", "Cuối Lượt: Thêm 1 Bạo Cơ Hậu Thế vào một chiến địa ngẫu nhiên nếu bạn đã đặt (đúng) 1 thẻ."],
  ["nguyetlong", "Nguyệt Long", "", 3, 4, "rev", "S5", "Lật: Lấy 1 sức mạnh từ các thẻ có năng lượng chẵn trong TẤT CẢ các tay."],
  ["phatuongsinhlinh", "Phá Tướng Sinh Linh", "", 3, 3, "end", "S5", "Cuối Lượt: +3 sức mạnh nếu đối thủ đã đặt 1 thẻ có sức mạnh cao hơn trong lượt này. Di chuyển đến thẻ đó nếu bạn sẽ thắng ở chiến địa của nó."],
  ["linhduoc", "Linh Dược", "", 2, 3, "rev", "S5", "Lật: 1 thẻ của bạn bị tiêu huỷ ở lượt trước được hồi sinh tại đây."],
  ["songsinhtamlinh", "Song Sinh Tâm Linh", "", 3, 4, "rev", "S5", "Lật: Sao chép 1 thẻ từ bộ bài vào tay bạn. Chỉnh năng lượng của nó thành 3 và sức mạnh thành 4."],
  ["thienthantimkiem", "Thiên Thần Tìm Kiếm", "", 6, 10, "end", "S5", "Cuối Lượt: Đặt 1 thẻ được tạo ra từ tay bạn vào đây."],
  ["laonhen", "Lão Nhện", "", 2, 2, "pas", "S5", "Sau khi bạn đặt 1 thẻ có sức mạnh cao hơn tại đây, cho thẻ này +2 sức mạnh và di chuyển nó đến chiến địa khác."],
  ["kesanga", "Kẻ Sa Ngã", "", 5, 5, "rev", "S5", "Lật: Đặt năng lượng tối đa của bạn bằng sức mạnh của thẻ này."],
  ["aosi", "Ảo Sĩ", "", 4, 7, "act", "S5", "Kích Hoạt: Nếu bạn đã có thẻ bị vứt bỏ và bị tiêu huỷ, trừ 2 sức mạnh cho các thẻ địch hàng trước ở mỗi chiến địa."],
  ["langthan", "Lang Thần", "", 3, 4, "act", "S5", "Kích Hoạt: Hồi sinh thẻ bị vứt bỏ hoặc bị tiêu huỷ có sức mạnh cao nhất của đối thủ về phía bạn ở chiến địa này."],
  ["culongco", "Cự Long Cổ", "", 7, 14, "rev", "S5", "Lật: Nhận sức mạnh của 1 thẻ địch hàng trước tại đây."],
  ["toclua", "Tóc Lửa", "", 2, 4, "pas", "S5", "Khi một thẻ của bạn bị tiêu huỷ, thẻ này dùng kỹ năng Lật của thẻ đó."],
  ["hoatinhnu", "Hoả Tinh Nữ", "", 2, 3, "pas", "S5", "Sau lần tới bạn đặt một thẻ 6 năng lượng, nhân đôi sức mạnh của thẻ này."],
  ["huyetdichhangxom", "Huyết Dịch Hàng Xóm", "", 3, 4, "rev", "S5", "Lật: Di chuyển các thẻ khác của bạn tại đây sang phải. +2 sức mạnh cho mỗi thẻ được di chuyển."],
  ["mauhau", "Mẫu Hậu", "", 3, 3, "rev", "S5", "Lật: Thêm 1 bản sao của thẻ cuối cùng bạn đặt vào tay bạn. (nếu có thể)"],
  ["ainunuotsao", "Ái Nữ Nuốt Sao", "", 4, 6, "pas", "S5", "Mỗi lượt, thẻ đầu tiên bạn đặt ở chiến địa khác được lật với +2 sức mạnh."],
  ["kenuotsao", "Kẻ Nuốt Sao", "", 6, 6, "rev", "S5", "Lật: Nếu bạn đang thắng ở chiến địa này và đây là thẻ duy nhất của bạn tại đây, tiêu huỷ tất cả chiến địa khác."],
  ["kysibaitu", "Kỵ Sĩ Bài Tử", "", 4, 6, "pas", "S5", "Nhiệm Vụ: Đặt tổng cộng 6 năng lượng thẻ được tạo ra → Tiêu huỷ ngẫu nhiên các thẻ địch có tổng năng lượng tối đa 3. (0/6)"],
  ["vuongbathu", "Vương Bất Hủ", "", 5, 9, "rev", "S5", "Lật: +1 sức mạnh cho mỗi thẻ khác của bạn trên bàn được tăng sức mạnh."],
  ["cunhan", "Cự Nhân", "", 2, 1, "on", "S5", "Duy Trì: +1 sức mạnh cho mỗi thẻ Duy Trì khác bạn có trên bàn."],
  ["dothan", "Đồ Thần", "", 6, 1, "on", "S5", "Duy Trì: +2 sức mạnh cho MỖI thẻ Lật trên bàn."],
  ["hongnutinhquai", "Hồng Nữ Tinh Quái", "", 4, 5, "rev", "S5", "Lật: Chọn ngẫu nhiên 1 nhân vật trên tay bạn 3 lần. Mỗi lần cho +2 sức mạnh."],
  ["daubay", "Đầu Bay", "", 1, 1, "react", "S5", "Khi Bị Tiêu Huỷ: Trả thẻ này về tay bạn, rồi cho tất cả thẻ trên tay bạn +1 sức mạnh."],
  ["trolymay", "Trợ Lý Máy", "", 2, 3, "pas", "S5", "Mỗi lượt thẻ này ở trên bàn, đổi sang một kỹ năng Kích Hoạt mới cho đến khi một kỹ năng được dùng."],
  ["tienhoasu", "Tiến Hoá Sư", "", 4, 7, "start", "S5", "Đầu Ván: Mở khoá tiềm năng của các thẻ không có kỹ năng của bạn."],
  ["hyvong", "Hy Vọng", "", 3, 4, "pas", "S5", "Sau khi bạn đặt một thẻ tại đây, lượt sau bạn nhận +1 năng lượng."],
  ["tieukhonglo", "Tiểu Khổng Lồ", "", 6, 12, "start", "S5", "Đầu Ván: Sao chép kỹ năng của 1 thẻ 6 năng lượng ngẫu nhiên."],
  ["hoanhansokhai", "Hoả Nhân Sơ Khai", "", 3, 2, "end", "S5", "Cuối Lượt: +1 sức mạnh. Một lần mỗi ván, nếu phía bạn tại đây đã đầy, thay vào đó nhân đôi sức mạnh của thẻ này."],
  ["linhchindau", "Lính Chín Đầu", "", 1, 4, "end", "S5", "Cuối Lượt: Thẻ này di chuyển nếu có người chơi đã Snap."],
  ["giapdam", "Giáp Dậm", "", 3, 3, "on", "S5", "Duy Trì: +1 sức mạnh cho mỗi lần một thẻ của bạn di chuyển trong ván này."],
  ["cohoangvocuc", "Cơ Hoàng Vô Cực", "", 5, 6, "rev", "S5", "Lật: Thêm 2 Viên đá của Cơ Hoàng vào tay bạn."],
  ["annusokhai", "Ẩn Nữ Sơ Khai", "", 3, 3, "act", "S5", "Kích Hoạt: Trong lượt này, các kỹ năng Cuối Lượt của bạn được lặp lại."],
  ["thietaiquoc", "Thiết Ái Quốc", "", 2, 3, "rev", "S5", "Lật: Thêm một thẻ ngẫu nhiên có năng lượng từ 4 trở lên vào tay bạn. Nếu bạn đang thắng tại đây sau lượt tiếp theo, giảm 3 năng lượng của nó."],
  ["batbainu", "Bất Bại Nữ", "", 4, 2, "end", "S5", "Cuối Lượt: Nếu bạn đang thua ở chiến địa này, nhân đôi sức mạnh của thẻ này."],
  ["cosi", "Cờ Sĩ", "", 3, 3, "on", "S5", "Duy Trì: Các thẻ của bạn tại đây đã được tăng sức mạnh có thêm +2 sức mạnh."],
  ["nuloimienvien", "Nữ Lôi Miền Viễn", "", 3, 3, "rev", "S5", "Lật: Phán xét 4 nhân vật ngẫu nhiên khác. +1 sức mạnh (nếu là của bạn) hoặc -1 sức mạnh (thẻ địch). Rút Nhanh: Phán xét lại những kẻ xứng đáng."],
  ["caheocon", "Cá Heo Con", "", 2, 2, "pas", "S5", "Các thẻ của bạn được lật tại đây với +1 sức mạnh. Có thể di chuyển một lần."],
  ["camapcan", "Cá Mập Cạn", "", 2, 4, "pas", "S5", "Có thể di chuyển một lần. Không gì có thể ngăn bạn di chuyển hoặc đặt thẻ này đến bất kỳ chiến địa nào."],
  ["hoanhanmay", "Hoả Nhân Máy", "", 1, 2, "pas", "S5", "Đầu Lượt: +1 sức mạnh cho mỗi năng lượng thưởng bạn có."],
  ["phiungtre", "Phi Ưng Trẻ", "", 2, 3, "on", "S5", "Duy Trì: Các kỹ năng Lật của thẻ 1 năng lượng của bạn tại đây được lặp lại."],
  ["nuco", "Nữ Cơ", "", 3, 3, "act", "S5", "Kích Hoạt: Lập tức Kích Hoạt các thẻ khác của bạn tại đây. (không tiêu hao kỹ năng Kích Hoạt của chúng)"],
  ["phaohoanganha", "Pháo Hoa Ngân Hà", "", 4, 3, "pas", "S5", "Khi bạn rút một thẻ, cộng sức mạnh của thẻ này vào nó."],
  ["kysichienxa", "Kỵ Sĩ Chiến Xa", "", 2, 2, "pas", "S5", "Nhiệm Vụ: Có 6 mức sức mạnh khác nhau trong số các thẻ khác của bạn trên bàn → +6 sức mạnh. (0/6)"],
  ["phonglinhnu", "Phong Linh Nữ", "", 4, 7, "rev", "S5", "Lật: Mỗi thẻ trên tay bạn cộng 1 sức mạnh cho một thẻ khác của bạn trên bàn."],
  ["thukydungcam", "Thư Ký Dũng Cảm", "", 4, 5, "rev", "S5", "Lật: Cộng 2 sức mạnh cho mỗi nhân vật 1, 2 và 3 năng lượng của bạn (mỗi loại một thẻ)."],
  ["nuthantien", "Nữ Thần Tiễn", "", 2, 3, "rev", "S5", "Lật: Thêm 2 Mũi Tên vào tay bạn."],
  ["nguyetthan", "Nguyệt Thần", "", 6, 5, "rev", "S5", "Khi Bị Vứt Bỏ: Trở lại ở pha tiếp theo. Lật: Hồi sinh một nhân vật bạn đã vứt bỏ đến một chiến địa khác với sức mạnh đặt thành 5."],
  ["tamlinhtu", "Tâm Linh Tử", "", 2, 1, "act", "S5", "Kích Hoạt: Tiêu huỷ thẻ tiếp theo bạn đặt trong lượt này để nhận sức mạnh của nó."],
  ["cuongnhanxam", "Cuồng Nhân Xám", "", 5, 11, "rev", "S5", "Lật: MỖI người chơi ngẫu nhiên giảm 1 năng lượng của một thẻ trên tay họ cho mỗi mức năng lượng khác nhau trong số các thẻ của họ trên bàn."],
  ["tieuthu", "Tiêu Thủ", "", 3, 5, "rev", "S5", "Lật: Trục xuất thẻ trên cùng bộ bài bạn. Nếu nó có năng lượng từ 4 trở lên, lượt sau +2 năng lượng, ngược lại cộng 4 sức mạnh cho thẻ này."],
  ["nuhongtam", "Nữ Hồng Tâm", "", 2, 3, "rev", "S5", "Lật: Trừ 2 sức mạnh của một thẻ địch. Lặp lại trên một thẻ địch khác cho mỗi năng lượng chưa dùng của bạn."],
  ["kysiho", "Kỵ Sĩ Hồ", "", 4, 6, "on", "S5", "Duy Trì: Các thẻ đã được tăng sức mạnh của bạn có thêm +1 sức mạnh."],
  ["kiemquyen", "Kiếm Quyền", "", 2, 3, "rev", "S5", "Lật: Thêm Kiếm Phục Hy vào một chiến địa khác."],
  ["tieulong", "Tiểu Long", "", 2, 2, "end", "S5", "Cuối Lượt: Nếu bạn đã đặt một thẻ 1 năng lượng trong lượt này, trừ 2 sức mạnh của một thẻ địch tại đây."],
  ["bangca", "Băng Ca", "", 3, 6, "rev", "S5", "Lật: Thêm một Khối Băng vào mỗi phía của chiến địa này."],
  ["bato", "Bà Tơ", "", 2, 1, "on", "S5", "Duy Trì: Mỗi lượt, một thẻ khác của bạn tại đây có thể di chuyển. (bạn chọn)"],
  ["hacthuatsi", "Hắc Thuật Sĩ", "", 2, 4, "act", "S5", "Kích Hoạt: Sao chép kỹ năng của một nhân vật trong bộ bài bạn có năng lượng bằng số năng lượng chưa dùng của bạn. (không kích hoạt Lật của nó)"],
  ["thantocnu", "Thần Tốc Nữ", "", 3, 3, "end", "S5", "Cuối Lượt: Chạy từ tay bạn đến một chiến địa ngẫu nhiên. (nếu có thể)"],
  ["vuatienhac", "Vua Tiên Hắc", "", 4, 6, "rev", "S5", "Lật: Thêm một thẻ có năng lượng từ 3 trở xuống từ bộ bài bạn vào đây, nhưng không lật nó cho đến khi ván đấu kết thúc."],
  ["nhannhenquai", "Nhân Nhện Quái", "", 5, 1, "rev", "S5", "Lật: Hợp thể thẻ cuối cùng bạn đã đặt vào thẻ này. Khi thẻ này hợp thể, nhân đôi sức mạnh của nó."],
  ["kydong", "Kỳ Đồng", "", 3, 2, "end", "S5", "Cuối Lượt: Cộng 1 sức mạnh cho 3 thẻ 1 năng lượng của bạn."],
  ["nangtocdo", "Nàng Tóc Đỏ", "", 3, 3, "end", "S5", "Cuối Lượt: Cộng 1 sức mạnh cho mỗi thẻ của bạn đã di chuyển trong lượt này."],
  ["tenaxit", "Tên Axit", "", 1, -2, "rev", "PH", "Lật: Đổi phe."],
  ["tenthuong", "Tên Thường", "", 1, 1, "rev", "PH", "Lật: Nếu lượt sau bạn đặt thẻ tại đây, +4 sức mạnh."],
  ["tenmoc", "Tên Móc", "", 1, 3, "rev", "PH", "Lật: Sau khi bạn đặt thẻ kế tiếp, dời nó về chiến địa này."],
  ["tenthuphong", "Tên Thu Phóng", "", 1, 1, "on", "PH", "Duy Trì: Nếu phía bạn tại đây đã đầy, +3 sức mạnh."],
  ["chopcothuat", "Chớp Cổ Thuật", "", 3, 0, "rev", "PH", "Lật: Lượt sau bạn có +4 năng lượng."],
  ["anhcothuat", "Ảnh Cổ Thuật", "", 4, 0, "rev", "PH", "Lật: Biến các thẻ khác của bạn tại đây thành bản sao của thẻ mạnh nhất."],
  ["thoicothuat", "Thời Cổ Thuật", "", 1, 0, "rev", "PH", "Lật: Cổ Nhãn Sư +3 sức mạnh. Đưa ông vào tay bạn nếu chưa ở trên bàn."],
  ["giocothuat", "Gió Cổ Thuật", "", 2, 0, "rev", "PH", "Lật: Trừ 5 sức mạnh của một thẻ địch tại đây và dời nó sang phải."],
  ["datamtri", "Đá Tâm Trí", "", 2, 2, "on", "PH", "Duy Trì: Kỹ năng Lật của bạn tại đây lặp lại."],
  ["dasucmanh", "Đá Sức Mạnh", "", 2, 1, "rev", "PH", "Lật: Nhân đôi sức mạnh của Cơ Hoàng Vô Cực."],
  ["dathuctai", "Đá Thực Tại", "", 2, 1, "rev", "PH", "Lật: Thêm một Máy Bay Con tại đây với sức mạnh của Cơ Hoàng Vô Cực."],
  ["dalinhhon", "Đá Linh Hồn", "", 2, 3, "rev", "PH", "Lật: Với mỗi chiến địa đã đầy của bạn, cho một thẻ của bạn ở đó +3 sức mạnh."],
  ["dakhonggian", "Đá Không Gian", "", 2, 6, "rev", "PH", "Lật: Dời thẻ địch yếu nhất tại đây tới chiến địa của Cơ Hoàng Vô Cực."],
  ["dathoigian", "Đá Thời Gian", "", 2, 4, "rev", "PH", "Lật: Đặt một thẻ từ tay bạn vào đây."],
  ["kiemphuchy", "Kiếm Phục Hy", "", 2, 2, "on", "PH", "Duy Trì: Nếu Kiếm Quyền ở đây, Kiếm Quyền +8 sức mạnh."],
  ["khoibang", "Khối Băng", "", 1, 0, "pas", "PH", "Đầu Lượt: +1 năng lượng. Sau đó tự huỷ nếu phía bạn tại đây đã đầy."],
  ["baocohauthe", "Bạo Cơ Hậu Thế", "", 4, 0, "on", "PH", "Duy Trì: Các Bạo Cơ khác và Bạo Chúa của bạn +1 sức mạnh."],
  ["nguyetthanbannguyet", "Nguyệt Thần Bán Nguyệt", "", 6, 8, "rev", "PH", "Khi Bị Vứt Bỏ: Trở lại ở dạng cuối. Lật: Hồi sinh một nhân vật bạn đã vứt bỏ tới chiến địa khác với sức mạnh 8."],
  ["nguyetthantrangtron", "Nguyệt Thần Trăng Tròn", "", 6, 12, "rev", "PH", "Lật: Hồi sinh một nhân vật bạn đã vứt bỏ tới chiến địa khác với sức mạnh 12."],
  ["quaituongtienhoa", "Quái Tướng Tiến Hoá", "", 5, 9, "pas", "PH", "Năng lượng giảm 1 cho mỗi thẻ địch trên bàn đang bị trừ sức mạnh."],
  ["docnhantienhoa", "Độc Nhãn Tiến Hoá", "", 3, 5, "end", "PH", "Cuối Lượt: Nếu còn năng lượng chưa dùng, trừ 1 sức mạnh của 2 thẻ địch tại đây."],
  ["cuongnhantienhoa", "Cuồng Nhân Tiến Hoá", "", 6, 14, "end", "PH", "Cuối Lượt: Nếu còn năng lượng chưa dùng, +2 sức mạnh. (trên tay hoặc trên bàn)"],
  ["taymaynutienhoa", "Tay Máy Nữ Tiến Hoá", "", 1, 3, "end", "PH", "Cuối Lượt: Nếu còn năng lượng chưa dùng, cho một thẻ khác của bạn +1 sức mạnh."],
  ["chanthutienhoa", "Chấn Thủ Tiến Hoá", "", 2, 4, "rev", "PH", "Lật: Thẻ ngoài cùng bên trái trên tay bạn giảm 1 năng lượng."],
  ["thachquaitienhoa", "Thạch Quái Tiến Hoá", "", 4, 7, "rev", "PH", "Lật: Trừ 1 sức mạnh của 3 thẻ địch tại đây."],
  ["ongnutienhoa", "Ong Nữ Tiến Hoá", "", 0, 1, "rev", "PH", "Lật: Trừ 1 sức mạnh của một thẻ địch tại đây."],
  ["linhdondoc", "Lính Đơn Độc", "", 3, 2, "act", "S5", "Kích Hoạt: Cho thẻ tiếp theo bạn đặt sức mạnh bằng sức mạnh của thẻ này."],
  ["phapsudaomong", "Pháp Sư Đảo Mộng", "", 1, 2, "rev", "S5", "Lật: Thêm Đại Đồ Án vào tay bạn."],
  ["sautham", "Sầu Thảm", "", 4, 8, "rev", "S5", "Lật: Lặp lại các kỹ năng Lật của các thẻ khác của bạn tại đây, sau đó tiêu huỷ chúng."],
  ["chimnhai", "Chim Nhại", "", 6, 9, "pas", "S5", "Giảm 1 năng lượng cho mỗi thẻ được tạo ra của bạn trên bàn."],
  ["muoikiepnu", "Mười Kiếp Nữ", "", 1, 2, "react", "S5", "Khi Bị Tiêu Huỷ: Nhận một bản sao của tay bài ban đầu của bạn."],
  ["battykhonglo", "Bát Tý Khổng Lồ", "", 8, 8, "pas", "S5", "Năng lượng của thẻ này được giảm bằng năng lượng của thẻ trên cùng bộ bài bạn."],
  ["nguyetlongnu", "Nguyệt Long Nữ", "", 2, 1, "end", "S5", "Cuối Lượt: +2 sức mạnh nếu bạn đã đặt 1 thẻ trong lượt này và dùng hết năng lượng."],
  ["yeuhau", "Yêu Hậu", "", 3, 4, "rev", "S5", "Lật: Trả tất cả thẻ đã bị vứt bỏ và bị tiêu huỷ của bạn về tay với +3 sức mạnh."],
  ["deonhansokhai", "Dẻo Nhân Sơ Khai", "", 3, 5, "end", "S5", "Cuối Lượt: Giảm 1 năng lượng hoặc cộng 3 sức mạnh cho một thẻ trên tay bạn."],
  ["hoasat", "Hoạ Sát", "", 3, 3, "on", "S5", "Duy Trì: +3 sức mạnh cho mỗi chiến địa có thẻ của bạn đã bị tiêu huỷ."],
  ["thuyhau", "Thuỷ Hậu", "", 5, 7, "rev", "S5", "Lật: Cộng 5 sức mạnh cho mỗi thẻ của bạn đứng một mình ở một chiến địa khác."],
  ["thuynu", "Thuỷ Nữ", "", 3, 5, "pas", "S5", "Khi bạn rút một thẻ, giảm 1 năng lượng của nó nếu đây là thẻ duy nhất của bạn tại đây."],
  ["acmong", "Ác Mộng", "", 3, 1, "rev", "S5", "Lật: Thay kỹ năng của mỗi thẻ trên tay bạn bằng kỹ năng của một thẻ ngẫu nhiên có cùng năng lượng."],
  ["dakhuc", "Dạ Khúc", "", 3, 5, "pas", "S5", "Có thể di chuyển một lần. Khi thẻ này di chuyển, thay chiến địa của nó bằng một chiến địa mới ngẫu nhiên."],
  ["nhencogiap", "Nhện Cơ Giáp", "", 2, 3, "rev", "S5", "Lật: Thêm Cơ Giáp Nhện vào tay bạn. Khi thẻ này hợp thể, lượt sau bạn nhận +1 năng lượng."],
  ["kysitudich", "Kỵ Sĩ Từ Dịch", "", 2, 2, "pas", "S5", "Nhiệm Vụ: Các thẻ trên bàn bị trừ 5 sức mạnh → Đặt một thẻ từ tay bạn vào đây. (0/5)"],
  ["thandong", "Thần Đồng", "", 3, 4, "rev", "S5", "Lật: Nếu thẻ này ở hàng sau, sao chép kỹ năng của thẻ phía trước nó."],
  ["dathuongnu", "Dạ Thương Nữ", "", 4, 7, "react", "S5", "Khi Bị Vứt Bỏ: Thẻ này nhảy đến chiến địa có sức mạnh thấp nhất của bạn. (chưa đầy)"],
  ["tamkiemmienvien", "Tâm Kiếm Miền Viễn", "", 3, 4, "rev", "S5", "Lật: Giảm 1 năng lượng của các thẻ trên tay bạn có năng lượng từ 5 trở lên. Rút Nhanh: Thay vào đó áp dụng cho toàn bộ tay bạn."],
  ["vuathoigian", "Vua Thời Gian", "", 4, 5, "rev", "S5", "Lật: Dùng 3 kỹ năng Lật từ các thẻ ra mắt trước thời của Vua Thời Gian."],
  ["hongve", "Hồng Vệ", "", 3, 2, "rev", "S5", "Lật: Trừ 2 sức mạnh của thẻ đối thủ có sức mạnh thấp nhất tại đây và xoá kỹ năng của nó."],
  ["cuongnhando", "Cuồng Nhân Đỏ", "", 6, 10, "end", "S5", "Cuối Lượt: Nếu đối thủ còn năng lượng chưa dùng, +3 sức mạnh. (khi ở trên tay hoặc trên bàn)"],
  ["cuongdomienvien", "Cuồng Đỏ Miền Viễn", "", 3, 8, "rev", "S5", "Lật: -1 sức mạnh cho mỗi thẻ đối thủ tại đây. Rút Nhanh: Thay vào đó +1 sức mạnh."],
  ["soidomienvien", "Sói Đỏ Miền Viễn", "", 2, 1, "rev", "S5", "Lật: +1 sức mạnh cho mỗi thẻ trên tay bạn. Rút Nhanh: Cộng 1 sức mạnh cho các thẻ trên tay bạn."],
  ["chimcanhdo", "Chim Cánh Đỏ", "", 3, 5, "pas", "S5", "Lần đầu thẻ này di chuyển, thêm một thẻ từ tay bạn vào chiến địa cũ."],
  ["chonvacay", "Chồn Và Cây", "", 3, 3, "pas", "S5", "Có thể di chuyển 1 lần. Sau khi đối thủ đặt một thẻ tại đây, lấy 1 sức mạnh từ thẻ đó."],
  ["haplucchiare", "Hấp Lực Chia Rẽ", "", 5, 5, "rev", "S5", "Lật: Lấy kỹ năng của thẻ có năng lượng cao nhất trên tay đối thủ."],
  ["trinu", "Trí Nữ", "", 3, 0, "rev", "S5", "Lật: +2 sức mạnh cho mỗi giá trị sức mạnh khác nhau trong số các thẻ khác tại đây."],
  ["nhendotham", "Nhện Đỏ Thẫm", "", 4, 5, "act", "S5", "Kích Hoạt: Thêm một bản sao y hệt thẻ này vào một chiến địa khác."],
  ["khinhdich", "Khinh Dịch", "", 1, 2, "react", "S5", "Khi Bị Vứt Bỏ: Đặt thẻ này trở lại và cộng 2 sức mạnh cho chính nó và một thẻ của bạn trên bàn."],
  ["bocapngaymoi", "Bọ Cạp Ngày Mới", "", 6, 6, "on", "S5", "Duy Trì: Nhân đôi lượng sức mạnh bị giảm trên tất cả thẻ đối thủ."],
  ["thetdich", "Thét Dịch", "", 2, 1, "pas", "S5", "Khi một thẻ địch di chuyển, lấy 2 sức mạnh từ nó. (một lần mỗi lượt)"],
  ["kysinguyetyeu", "Kỵ Sĩ Nguyệt Yêu", "", 4, 4, "pas", "S5", "Nhiệm Vụ: Có 3 thẻ không có kỹ năng trên bàn → Lấy 5 sức mạnh từ một thẻ đối thủ tại đây. (0/3)"],
  ["hoavatnu", "Hoá Vật Nữ", "", 5, 7, "rev", "S5", "Lật: Biến các nhân vật khác của bạn tại đây thành nhân vật ngẫu nhiên có năng lượng cao hơn 1. (nếu có thể)"],
  ["vouyamdia", "Vô Uý Ám Địa", "", 2, 3, "rev", "S5", "Lật: Xáo 3 Quỷ vào bộ bài. Khi bạn rút một thẻ có 6 sức mạnh trở lên, +2 sức mạnh."],
  ["longbattu", "Long Bất Tử", "", 5, 8, "rev", "S5", "Lật: Tăng cho nhân vật cuối cùng bạn đặt +2 sức mạnh cho mỗi lượt bạn đã đặt 2 thẻ trở lên. (+0)"],
  ["ngansat", "Ngân Sát", "", 1, 0, "rev", "S5", "Lật: Lấy 2 sức mạnh từ nhân vật trên cùng của bộ bài đối thủ."],
  ["chomay", "Chó Máy", "", 2, 2, "act", "S5", "Kích Hoạt: Cộng 2 sức mạnh cho thẻ của bạn vừa di chuyển gần nhất và di chuyển nó về chiến địa trước đó."],
  ["toctu", "Tốc Tử", "", 3, 3, "on", "S5", "Duy Trì: +1 sức mạnh cho mỗi lượt bạn đã dùng hết năng lượng."],
  ["nhenngaymoi", "Nhện Ngày Mới", "", 1, 2, "pas", "S5", "Có thể di chuyển 2 lần. Sau khi thẻ này di chuyển đến một chiến địa, cộng 1 sức mạnh cho một thẻ khác của bạn ở đó. (kể cả thẻ chưa lật)"],
  ["nhenbongdem", "Nhện Bóng Đêm", "", 4, 5, "rev", "S5", "Lật: Chỉnh sức mạnh của nhân vật trên cùng bộ bài bạn thành 8. Nếu các thẻ khác của bạn trên bàn có tổng năng lượng đúng bằng 8, thêm nó vào đây. (0/8)"],
  ["nhennoiloan", "Nhện Nổi Loạn", "", 3, 3, "pas", "S5", "Có thể di chuyển 1 lần. Khi thẻ này di chuyển đến một chiến địa, lấy 2 sức mạnh từ thẻ đối thủ có sức mạnh cao nhất ở đó."],
  ["ansao", "Ấn Sao", "", 3, 10, "on", "S5", "Duy Trì: Đối thủ có +3 sức mạnh ở mỗi chiến địa khác."],
  ["buisao", "Bụi Sao", "", 4, 6, "on", "S5", "Duy Trì: Không thể thêm thẻ vào chiến địa trừ khi đặt hoặc di chuyển chúng."],
  ["tinhchuathaiduong", "Tinh Chúa Thái Dương", "", 5, 7, "rev", "S5", "Lật: Lượt sau, bạn nhận +1 năng lượng cho mỗi lượt bạn đã kết thúc mà còn năng lượng chưa dùng. (0 lượt.)"],
  ["kysidoibao", "Kỵ Sĩ Đói Bão", "", 3, 1, "pas", "S5", "Nhiệm Vụ: Kết thúc 2 lượt liên tiếp mà còn năng lượng chưa dùng → Cộng 2 sức mạnh cho các thẻ khác của bạn tại đây và trên tay bạn. (0/2)"],
  ["diphaptoithuong", "Dị Pháp Tối Thượng", "", 2, 2, "end", "S5", "Nhận +2 sức mạnh từ việc hợp thể. Cuối Lượt: Hợp thể một thẻ được tạo ra của bạn vào thẻ này."],
  ["nhenthuongdang", "Nhện Thượng Đẳng", "", 3, 4, "pas", "S5", "Đầu Lượt: +1 năng lượng nếu bạn có thẻ nào được tăng sức mạnh trên bàn."],
  ["diennu", "Điện Nữ", "", 2, 1, "rev", "S5", "Lật: Cho thẻ trên cùng bộ bài của bạn -1 năng lượng và +1 sức mạnh. Sau khi bạn đặt nó, lặp lại kỹ năng này."],
  ["hoamavuong", "Hoả Ma Vương", "", 3, 5, "pas", "S5", "Sau khi bạn đặt một thẻ có 10 sức mạnh trở lên, thẻ này nhận +2 sức mạnh."],
  ["nhenhacdich", "Nhện Hắc Dịch", "", 4, 7, "act", "S5", "Kích Hoạt: Hợp thể thẻ có năng lượng thấp nhất của bạn tại đây vào thẻ này. Sao chép kỹ năng của nó như thể nó vừa được lật."],
  ["nhenlong", "Nhện Lông", "", 2, 2, "end", "S5", "Cuối Lượt: Nếu bạn có sức mạnh cao nhất trong số các thẻ trên bàn, cộng 1 sức mạnh cho thẻ này và 2 nhân vật trên tay bạn."],
  ["virutcosinh", "Vi-rút Cơ Sinh", "", 2, 0, "rev", "S5", "Lật: Lây nhiễm các thẻ khác của bạn tại đây (thay kỹ năng của chúng). Sao chép thẻ này vào tay bạn."],
  ["tuongquan", "Tướng Quân", "", 2, 2, "end", "S5", "Cuối Lượt: Nếu đối thủ còn năng lượng chưa dùng, rút một thẻ có 10 sức mạnh trở lên."],
  ["bavuongtim", "Bá Vương Tím", "", 6, 12, "start", "S5", "Đầu Ván: Xáo sáu Đá Vô Cực vào bộ bài của bạn."],
  ["conhan", "Cổ Nhân", "", 3, 5, "rev", "S5", "Lật: Thêm Đạo Đồ vào tay bạn."],
  ["thachquaisokhai", "Thạch Quái Sơ Khai", "", 5, 6, "end", "S5", "Cuối Lượt: +2 sức mạnh. Một lần mỗi ván, nếu phía bạn tại đây đã đầy, tiêu huỷ một thẻ đối thủ tại đây có sức mạnh thấp hơn."],
  ["nuchienbathu", "Nữ Chiến Bất Hủ", "", 2, 0, "end", "S5", "Cuối Lượt: +3 sức mạnh nếu bạn đã đặt (đúng) 2 thẻ."],
  ["docdich", "Độc Dịch", "", 2, 2, "rev", "S5", "Lật: Trả các thẻ khác của bạn tại đây về tay. +2 sức mạnh cho mỗi thẻ được trả về."],
  ["dacvuquocgia", "Đặc Vụ Quốc Gia", "", 2, 3, "on", "S5", "Duy Trì: Các thẻ 4 năng lượng trở lên tại đây có -3 sức mạnh."],
  ["huyetmenu", "Huyết Mê Nữ", "", 6, 7, "rev", "S5", "Lật: Với mỗi mức năng lượng khác nhau trong số các thẻ của bạn trên bàn, lấy 1 sức mạnh từ một thẻ đối thủ tại đây."],
  ["huyetsatvuong", "Huyết Sát Vương", "", 2, 2, "end", "S5", "Cuối Lượt: Nếu bạn đã dùng hết năng lượng, nhận một Giáo Hút Máu."],
  ["taysatnu", "Tay Sắt Nữ", "", 2, 2, "on", "S5", "Duy Trì: Các thẻ của bạn được tạo ra trên tay có +2 sức mạnh."],
  ["huyenconu", "Huyễn Cơ Nữ", "", 3, 4, "pas", "S5", "Đầu Lượt: Cộng 1 sức mạnh cho tất cả thẻ trên tay bạn nếu bạn đang thắng tại đây. Nếu không, di chuyển thẻ này đến một chiến địa khác."],
  ["comaychien", "Cỗ Máy Chiến", "", 5, 9, "on", "S5", "Duy Trì: Không gì có thể ngăn bạn đặt thẻ ở bất kỳ đâu."],
  ["cosinhthe", "Cơ Sinh Thể", "", 3, 4, "act", "S5", "Kích Hoạt: Với mỗi năng lượng chưa dùng, giảm 1 năng lượng của một thẻ trên tay bạn."],
  ["vukhih", "Vũ Khí H", "", 7, 14, "react", "S5", "Khi Bị Vứt Bỏ: Đặt thẻ này trở lại với -2 năng lượng."],
  ["vukhix", "Vũ Khí X", "", 2, 3, "pas", "S5", "Sau khi một thẻ khác của bạn bị tiêu huỷ, +1 sức mạnh. Sau mỗi 3 lần, mức cộng này tăng thêm 1. (0/3)"],
  ["docnutrang", "Độc Nữ Trắng", "", 2, 2, "rev", "S5", "Lật: Thêm một Nụ Hôn Độc vào phía đối thủ ở chiến địa này."],
  ["phuthuytre", "Phù Thuỷ Trẻ", "", 4, 6, "rev", "S5", "Lật: Nếu bạn đã dùng hết năng lượng ở các lượt trước, +2 năng lượng tối đa."],
  ["trumthanhpho", "Trùm Thành Phố", "", 5, 8, "pas", "S5", "Có năng lượng 3 nếu bạn có sức mạnh cao nhất trong số các thẻ trên bàn."],
  ["kysivuottu", "Kỵ Sĩ Vuốt Tử", "", 4, 4, "pas", "S5", "Nhiệm Vụ: Thẻ này có 6 sức mạnh trở lên → Cộng 4 sức mạnh cho một thẻ của bạn ở mỗi chiến địa. (4/6)"],
  ["saotrongdau", "Sao Trong Đầu", "", 2, 3, "pas", "S5", "Sau khi BẤT KỲ thẻ 3 hoặc 4 năng lượng nào được đặt tại đây, di chuyển nó đến một chiến địa khác."],
  ["xachacmieu", "Xác Hắc Miêu", "", 3, 5, "react", "S5", "Khi Bị Vứt Bỏ: Vứt bỏ một thẻ Khi Bị Vứt Bỏ khác. Nhảy tới chiến địa của bạn có ít thẻ nhất."],
  ["xacdao", "Xác Đao", "", 2, 3, "end", "S5", "Cuối Lượt: Nếu bạn đã đặt một thẻ Lật, Zombie Bầy Xác của bạn lấy 1 sức mạnh từ một nhân vật trên tay đối thủ. (Tạo Bầy Xác trước nếu cần)"],
  ["xactinhquang", "Xác Tinh Quang", "", 4, 6, "act", "S5", "Kích Hoạt: Tiêu huỷ các thẻ khác của bạn tại đây để nhận +3 sức mạnh cho mỗi thẻ. Di chuyển tới một chiến địa bạn đang thua."],
  ["bayxacnuotsao", "Bầy Xác Nuốt Sao", "", 7, 5, "start", "S5", "Đầu Ván: Chọn 6 nhân vật khác trong bộ bài bạn. Lật: Biến các thẻ đó thành bản sao của thẻ này."],
  ["xacdeo", "Xác Dẻo", "", 2, 2, "rev", "S5", "Lật: Bầy Xác +2. Kích Hoạt: Cộng 1 sức mạnh cho 4 thẻ được tạo ra của bạn."],
  ["xachongphuthuy", "Xác Hồng Phù Thuỷ", "", 3, 4, "pas", "S5", "Sau khi bạn đặt một thẻ tại đây, Bầy Xác +2."],
  ["xachacdich", "Xác Hắc Dịch", "", 3, 3, "rev", "S5", "Lật: Tiêu huỷ thẻ khác đầu tiên của bạn tại đây. Sau khi một thẻ khác của bạn bị tiêu huỷ, Bầy Xác +3."],
  ["vuarutkiem", "Vua Rút Kiếm", "", 4, 4, "rev", "MP", "Lật: Rút Thánh Kiếm ra và đặt tại đây."],
  ["phankysi", "Phản Kỵ Sĩ", "", 3, 4, "on", "MP", "Duy Trì: +2 sức mạnh cho mỗi thẻ có năng lượng cao hơn tại đây."],
  ["huyettinhquyen", "Huyết Tinh Quyền", "", 3, 4, "rev", "MP", "Lật: Với mỗi chiến địa bạn đang thắng, lấy 1 sức mạnh từ nhân vật trên cùng của bộ bài đối thủ."],
  ["xactantinh", "Xác Tân Tinh", "", 2, 0, "rev", "MP", "Lật và khi bị tiêu huỷ: Bầy Xác +3."],
  ["thanhkiem", "Thánh Kiếm", "", 1, 1, "on", "PH", "Duy Trì: Các thẻ 4 năng lượng trở lên của bạn +2 sức mạnh."],
  ["cogiapnhen", "Cơ Giáp Nhện", "", 3, 5, "rev", "PH", "Lật: Hợp thể vào một thẻ của bạn tại đây. Thẻ đó dời được ở lượt sau."],
  ["daodo", "Đạo Đồ", "", 3, 0, "rev", "PH", "Lật: Chép kỹ năng của một thẻ Duy Trì của bạn tại đây sang các nhân vật khác của bạn tại đây."],
  ["giaohutmau", "Giáo Hút Máu", "", 1, 0, "rev", "PH", "Lật: Huyết Sát Vương lấy 2 sức mạnh từ một nhân vật trên tay đối thủ."],
  ["nuhondoc", "Nụ Hôn Độc", "", 0, -4, "pas", "PH", "Tự huỷ khi phía bạn tại đây đã đầy."],
  ["daidoan", "Đại Đồ Án", "", 6, 0, "rev", "PH", "Năng lượng giảm 1 cho mỗi thẻ được tạo ra mà bạn đã đặt. Lật: Cho một thẻ của bạn ở mỗi chiến địa khác +5 sức mạnh."],
  ["datam", "Đá Tâm", "", 1, 1, "rev", "PH", "Lật: Rút 2 viên Đá từ bộ bài."],
  ["daluc", "Đá Lực", "", 1, 3, "on", "PH", "Duy Trì: Nếu bạn đã đặt đủ 6 viên Đá, Bá Vương Tím +10 sức mạnh."],
  ["dathuc", "Đá Thực", "", 1, 2, "rev", "PH", "Lật: Thay chiến địa này bằng một chiến địa mới."],
  ["dahon", "Đá Hồn", "", 1, 1, "rev", "PH", "Lật: Rút 1 thẻ."],
  ["dakhong", "Đá Không", "", 1, 3, "rev", "PH", "Lật: Rút Bá Vương Tím."],
  ["dathoi", "Đá Thời", "", 1, 1, "rev", "PH", "Lật: Rút 1 thẻ. Bá Vương Tím giảm 1 năng lượng."],
  ["hapkinh", "Hấp Kình", "", 3, 5, "pas", "S4", "Khi thẻ này được cường hoá, nhận thêm +2 sức mạnh. (khi ở trên tay, trong bộ bài hoặc trên bàn)"],
  ["hoathuatnu", "Hoả Thuật Nữ", "", 1, 3, "pas", "S5", "Khi thẻ này được Cường Hoá, thêm Lửa Hắc Diệm vào tay bạn. (nếu ở trên tay hoặc trên bàn)"],
  ["lanvuong", "Lặn Vương", "", 1, 2, "pas", "S5", "Khi thẻ này được cường hoá, thêm một nhân vật 1 năng lượng ngẫu nhiên vào tay bạn với cùng mức tăng đó. (khi ở trên tay hoặc trên bàn)"],
  ["thanai", "Thần Ái", "", 3, 2, "pas", "S5", "Khi các thẻ của bạn trên bàn được cường hoá, tăng thêm +1 sức mạnh cho các thẻ đó."],
  ["hacdiemchua", "Hắc Diệm Chúa", "", 7, 13, "start", "S5", "Đầu Ván: Bắt đầu Nghi thức Triệu hồi. (Thêm bước 1 vào tay.)"],
  ["khoinguyenvuong", "Khởi Nguyên Vương", "", 4, 5, "pas", "S5", "Nhiệm Vụ: Có từ 2 thẻ trở lên ở mỗi chiến địa → Biến thành Mạt Thế Thiên Tuyển."],
  ["kechinhphatthoigian", "Kẻ Chinh Phạt Thời Gian", "", 3, 4, "start", "S5", "Đầu Ván: Thay thẻ này bằng 4 Kẻ Chinh Phạt Thời Gian mang kỹ năng của các thẻ ngẫu nhiên có năng lượng từ 3 trở lên."],
  ["lucac", "Lục Ác", "", 6, 12, "start", "S5", "Đầu Ván: 6 nhân vật đầu tiên bạn rút trở nên ÁC. Sau khi bạn đặt hết chúng, hợp thể chúng vào thẻ này và thêm thẻ này vào chiến địa của thẻ cuối cùng."],
  ["phapsugia", "Pháp Sư Già", "", 2, 2, "pas", "S5", "Đầu Lượt: Thêm một Thần Chú ngẫu nhiên vào tay bạn."],
  ["chutruongnu", "Chú Trượng Nữ", "", 1, 2, "rev", "S5", "Lật: Sau khi bạn đặt thẻ tiếp theo, niệm một phép lên thẻ đó. Phép đổi theo lượt: hoá Quỷ / tiêu huỷ để rút 2 thẻ / dời sang phải / +2 sức mạnh / thay chiến địa / thêm bản sao vào tay / nhân đôi sức mạnh thẻ này."],
  ["quyensuthaphoan", "Quyền Sư Thập Hoàn", "", 3, 5, "rev", "S5", "Đầu Ván: Thập Hoàn bắt đầu trên tay bạn. Lật: Khai mở tiềm năng của chúng."],
  ["kerinh", "Kẻ Rình", "", 3, 4, "rev", "S5", "Lật: Thêm 2 Đồ Nghề Trộm vào tay bạn. Chỉnh năng lượng của chúng thành 0 nếu có thẻ đã di chuyển ở lượt trước."],
  ["thuanung", "Thuẫn Ưng", "", 2, 2, "rev", "S5", "Lật: Thêm Khiên Tướng vào một chiến địa khác. Duy Trì: Khiên Tướng có thể di chuyển."],
  ["huyettruonglao", "Huyết Trưởng Lão", "", 4, 5, "pas", "S5", "Nhiệm Vụ: 3 thẻ của bạn có sức mạnh lấy được → Biến thành Cự Thú Đỏ Thẫm. (0/3)"],
  ["tamtudo", "Tâm Từ Đỏ", "", 4, 4, "on", "S5", "Duy Trì: Có 3 kỹ năng Duy Trì ngẫu nhiên."],
  ["nuhoanghonmang", "Nữ Hoàng Hỗn Mang", "", 3, 4, "pas", "S5", "Đầu Lượt: Thêm một kỹ năng CỰC KỲ ngẫu nhiên vào tay bạn. Nó có năng lượng 0 trong lượt này."],
  ["loantuong", "Loạn Tướng", "", 4, 6, "pas", "S5", "Nhiệm Vụ: Đặt 3 thẻ Lật → Kích hoạt thẻ Lật có năng lượng cao nhất trên tay bạn. (0/3)"],
  ["trungphatcogiap", "Trừng Phạt Cơ Giáp", "", 2, 2, "pas", "S5", "Khi được rút, đánh dấu một chiến địa bạn chưa có thẻ. Nhiệm Vụ: Thắng chiến địa đó → +1 năng lượng tối đa."],
  ["bavuongmienvien", "Bá Vương Miền Viễn", "", 5, 7, "rev", "S5", "Đầu Ván: Các thẻ của bạn có \"Rút Nhanh: nạp một Phát Bắn ngẫu nhiên.\" Lật: Bắn tất cả Phát Bắn đã nạp (rút 1 thẻ / +3 sức mạnh / chép thẻ rẻ nhất tại đây / tiêu huỷ thẻ địch yếu nhất tại đây / +1 sức mạnh và dời được ở lượt sau / tay bạn -1 năng lượng)."],
  ["nguyetthach", "Nguyệt Thạch", "", 4, 6, "on", "S5", "Duy Trì: Có các kỹ năng Duy Trì của các thẻ có năng lượng từ 3 trở xuống của bạn tại đây."],
  ["thietgiapthuongdang", "Thiết Giáp Thượng Đẳng", "", 5, 8, "pas", "S5", "Nhân đôi lượng giảm năng lượng cho thẻ này. Duy Trì: Nhân đôi lượng tăng sức mạnh cho thẻ này."],
  ["kenuotsaosokhai", "Kẻ Nuốt Sao Sơ Khai", "", 6, 11, "pas", "S5", "Sứ Giả của ta là nhân vật tiếp theo ta thấy ngươi đặt. Cuối Lượt: +2 sức mạnh nếu bạn đang thắng ở chiến địa của Sứ Giả. (nếu ở trên tay hoặc trên bàn)"],
  ["dihien", "Dì Hiền", "", 2, 4, "end", "S5", "Cuối Lượt: Nếu bạn đã dùng kỹ năng Dời Được, cho 1 thẻ Dời Được trên tay bạn -1 năng lượng và +2 sức mạnh."],
  ["luahacdiem", "Lửa Hắc Diệm", "", 0, 0, "rev", "PH", "Lật: Trừ 3 sức mạnh của một thẻ địch tại đây."],
  ["hienthanvangioi", "Hiện Thân Vạn Giới", "", 1, 0, "rev", "PH", "Lật: Thay chiến địa này bằng một chiến địa mới và cho Pháp Sư Già +1 sức mạnh."],
  ["vuongtrieutailai", "Vương Triều Tái Lai", "", 1, 0, "rev", "PH", "Lật: Xáo thẻ yếu nhất của bạn tại đây vào bộ bài để nhận +2 năng lượng ở lượt sau."],
  ["bienhinhthuat", "Biến Hình Thuật", "", 1, 0, "rev", "PH", "Lật: Biến nhân vật yếu nhất của bạn tại đây thành một nhân vật tốn hơn 1 năng lượng."],
  ["daibay", "Đai Bay", "", 1, 0, "rev", "PH", "Lật: Cho thẻ mạnh nhất của bạn tại đây +1 sức mạnh và dời nó sang phải."],
  ["mintuxa", "Mìn Từ Xa", "", 1, 0, "rev", "PH", "Lật: Trừ 2 sức mạnh của 2 thẻ địch mạnh nhất tại đây."],
  ["gangchandong", "Găng Chấn Động", "", 1, 0, "rev", "PH", "Lật: Cho thẻ mạnh nhất của bạn tại đây +2 sức mạnh. Bạn nhận +1 năng lượng ở lượt sau."],
  ["nghithuctrieuhoii", "Nghi Thức Triệu Hồi I", "", 0, 0, "rev", "PH", "Lật: Hợp thể thẻ đã bị tiêu huỷ mạnh nhất của bạn vào Hắc Diệm Chúa để tiếp tục. (bước 1/3)"],
  ["nghithuctrieuhoiii", "Nghi Thức Triệu Hồi II", "", 1, 0, "rev", "PH", "Lật: Hắc Diệm Chúa lấy 1 sức mạnh từ MỖI thẻ tại đây để tiếp tục. (bước 2/3)"],
  ["nghithuctrieuhoiiii", "Nghi Thức Triệu Hồi III", "", 2, 0, "rev", "PH", "Lật: Tiêu huỷ 2 nhân vật của bạn tại đây để triệu hồi Hắc Diệm Chúa. (bước 3/3)"],
  ["matthethientuyen", "Mạt Thế Thiên Tuyển", "", 4, 8, "rev", "PH", "Lật: Đổi nhân vật yếu nhất của bạn trên bàn với một thẻ trong bộ bài."],
  ["thaphoan", "Thập Hoàn", "", 2, 2, "rev", "PH", "Lật: Cho một thẻ khác của bạn tại đây +1 sức mạnh."],
  ["thaphoankhaimo", "Thập Hoàn Khai Mở", "", 2, 3, "end", "PH", "Cuối Lượt: Cho các thẻ khác của bạn tại đây +1 sức mạnh."],
  ["khientuong", "Khiên Tướng", "", 0, 0, "on", "PH", "Duy Trì: Không thể bị tiêu huỷ. Cho Thuẫn Ưng +2 sức mạnh khi thẻ này dời tới chiến địa của Thuẫn Ưng."],
  ["cuthudotham", "Cự Thú Đỏ Thẫm", "", 4, 9, "rev", "PH", "Lật: Lấy toàn bộ sức mạnh của một thẻ địch tại đây."]
];
const C = {};
for (const r of RAW) C[r[0]] = { id: r[0], n: r[1], e: r[2], c: r[3], p: r[4], t: r[5], h: r[6], x: r[7], tok: r[6] === "PH" };
const COLLECT = RAW.filter(r => r[6] !== "PH").map(r => r[0]);

// [id, tên, chữ ngắn trên bàn, mô tả đầy đủ]
const LRAW = [
  ["meadow", "Đồng Cỏ", "Yên bình. Không có hiệu ứng.", "Không có hiệu ứng."],
  ["forest", "Rừng Thiêng", "Thẻ năng lượng 1–2 tại đây +2.", "Thẻ năng lượng 1 và 2 tại đây +2."],
  ["mist", "Thung Lũng Sương", "Thẻ không kỹ năng +2.", "Thẻ không kỹ năng tại đây +2."],
  ["forge", "Lò Rèn", "Thẻ đặt vào đây được +2.", "Thẻ đặt từ tay vào đây được +2 vĩnh viễn."],
  ["snow", "Đỉnh Tuyết", "Mọi thẻ tại đây −1.", "Mọi thẻ tại đây −1."],
  ["crystal", "Mỏ Pha Lê", "Ai dẫn tại đây: +1 năng lượng mỗi lượt.", "Đầu mỗi lượt, bên đang dẫn tại đây có thêm 1 năng lượng."],
  ["village", "Làng Chài", "Lộ diện: mỗi bên rút 1 thẻ.", "Khi lộ diện: mỗi bên rút 1 thẻ."],
  ["arena", "Đấu Trường", "Kỹ năng Lật chạy 2 lần.", "Kỹ năng Lật tại đây chạy 2 lần."],
  ["swamp", "Đầm Lầy", "Lượt 6 không đặt được bài.", "Lượt 6 không đặt được bài từ tay vào đây."],
  ["spring", "Suối Tiên", "Cuối lượt: thẻ yếu nhất mỗi bên +1.", "Cuối mỗi lượt, thẻ yếu nhất của mỗi bên tại đây +1."],
  ["falls", "Thác Bạc", "Duy Trì tại đây gấp đôi.", "Kỹ năng Duy Trì tại đây có hiệu lực gấp đôi."],
  ["terrace", "Ruộng Bậc Thang", "Lộ diện: lượt sau cả hai +1 năng lượng.", "Khi lộ diện: lượt sau mỗi bên có thêm 1 năng lượng."],
  ["gate", "Cổng Trời", "Thẻ đặt ở lượt 6 được +3.", "Thẻ đặt từ tay vào đây ở lượt 6 được +3."],
  ["temple", "Đền Thần", "Thẻ năng lượng 5 trở lên +3.", "Thẻ năng lượng 5 trở lên tại đây +3."],
  ["watch", "Chòi Canh", "Kỹ năng Lật không chạy.", "Kỹ năng Lật không chạy tại đây."],
  ["cave", "Hang Dơi", "Mỗi bên chỉ có 2 ô.", "Mỗi bên chỉ có 2 ô tại đây."],
  ["bamboo", "Rừng Trúc", "Thẻ tại đây không bị tiêu huỷ.", "Thẻ tại đây không thể bị tiêu huỷ."],
  ["market", "Chợ Phiên", "Lộ diện: mỗi bên vứt 1 thẻ.", "Khi lộ diện: mỗi bên vứt bỏ 1 thẻ ngẫu nhiên."],
  ["abyss", "Vực Thẳm", "Thẻ đặt sau lượt 4 bị tiêu huỷ.", "Thẻ đặt từ tay vào đây sau lượt 4 bị tiêu huỷ ngay sau khi lật."],
  ["volcano", "Núi Lửa", "Cuối lượt 4: tiêu huỷ mọi thẻ.", "Cuối lượt 4, tiêu huỷ mọi thẻ tại đây."],
  ["graveyard", "Nghĩa Địa Voi", "Thẻ bị tiêu huỷ: chủ rút 1 thẻ.", "Khi một thẻ bị tiêu huỷ tại đây, chủ của nó rút 1 thẻ."],
  ["den", "Hang Ổ", "Lộ diện: mỗi bên có 1 Thú Hoang.", "Khi lộ diện: triệu hồi 1 Thú Hoang (3) cho mỗi bên tại đây."],
  ["anthill", "Tổ Kiến", "Cuối lượt: bên ít thẻ hơn có 1 Kiến Thợ.", "Cuối mỗi lượt, triệu hồi 1 Kiến Thợ (1) cho bên có ít thẻ hơn tại đây."],
  ["ferry", "Bến Đò", "Thẻ di chuyển tới đây +2.", "Thẻ di chuyển tới đây được +2 vĩnh viễn."],
  ["windhill", "Đồi Gió", "Cuối lượt: thẻ yếu nhất mỗi bên bị thổi đi.", "Cuối mỗi lượt, thẻ yếu nhất của mỗi bên tại đây bị thổi sang chiến địa khác."],
  ["shrine", "Miếu Hoang", "Thẻ hồi sinh tại đây +2.", "Thẻ được hồi sinh tại đây +2 vĩnh viễn."],
  ["mirror", "Gương Hồ", "Lộ diện: mọi thẻ tại đây biến hoá.", "Khi lộ diện: mọi thẻ tại đây biến thành thẻ ngẫu nhiên cùng giá."],
  ["blackmarket", "Chợ Đen", "Lộ diện: mỗi bên chép 1 thẻ của đối thủ.", "Khi lộ diện: mỗi bên nhận bản sao 1 thẻ ngẫu nhiên từ bộ bài đối thủ."],
  ["reverse", "Thung Lũng Ngược", "Bên yếu hơn giữ chiến địa này.", "Bên có tổng sức mạnh thấp hơn giữ chiến địa này."],
  ["treasure", "Kho Báu", "Thắng ván và giữ chiến địa này: +1 ngọc.", "Ai thắng ván và giữ chiến địa này nhận thêm 1 ngọc."]
];
LRAW.push(["limbo", "U Minh", "Ván này có lượt 7.", "Ván đấu kéo dài thêm lượt 7."]);
const LOC = {};
for (const r of LRAW) LOC[r[0]] = { id: r[0], n: r[1], s: r[2], x: r[3] };
/* ===== chiến địa mở rộng (dữ liệu + quy tắc) ===== */
/* mỗi dòng: id, tên, mô tả ngắn, mô tả dài, nhóm hiệu ứng (nuoc/lua/rung/suong/thieng/toi), màu */
const LRAW2 = [
  ["hoguom", "Hồ Gươm", "Thẻ tại đây +1.", "Mọi thẻ tại đây được +1 sức mạnh.", "nuoc", "#3fc9b0"],
  ["halong", "Vịnh Hạ Long", "Thẻ đứng một mình tại đây +5.", "Nếu chỉ có 1 thẻ của một bên tại đây, thẻ đó được +5 sức mạnh.", "nuoc", "#2fb6d6"],
  ["bachdang", "Sông Bạch Đằng", "Thẻ tại đây −1.", "Mọi thẻ tại đây bị −1 sức mạnh.", "nuoc", "#4f8fb0"],
  ["amphu", "Âm Phủ", "Thẻ tại đây −3.", "Mọi thẻ tại đây bị −3 sức mạnh.", "toi", "#6a3a9a"],
  ["longcung", "Long Cung", "Thẻ tại đây +4.", "Mọi thẻ tại đây được +4 sức mạnh.", "nuoc", "#2f9dff"],
  ["vanmieu", "Văn Miếu", "Thẻ có kỹ năng Lật +2.", "Thẻ có kỹ năng Lật tại đây được +2 sức mạnh.", "thieng", "#e0b04a"],
  ["dinhlang", "Đình Làng", "Thẻ không kỹ năng +3.", "Thẻ không có kỹ năng tại đây được +3 sức mạnh.", "thieng", "#d49a4a"],
  ["dongvan", "Cao Nguyên Đá", "Thẻ 1 năng lượng +3.", "Thẻ có giá 1 năng lượng tại đây được +3 sức mạnh.", "suong", "#9aa6b8"],
  ["phongnha", "Động Phong Nha", "Thẻ mạnh nhất mỗi bên +3.", "Thẻ có sức mạnh cao nhất của mỗi bên tại đây được +3.", "toi", "#5a7ab8"],
  ["thapcham", "Tháp Chàm", "Thẻ Duy Trì +2.", "Thẻ có kỹ năng Duy Trì tại đây được +2 sức mạnh.", "thieng", "#d9774a"],
  ["caurong", "Cầu Rồng", "Thẻ 6 năng lượng trở lên +4.", "Thẻ có giá từ 6 năng lượng trở lên tại đây được +4 sức mạnh.", "lua", "#ff9a2b"],
  ["battrang", "Làng Gốm Bát Tràng", "Thẻ 3 năng lượng +2.", "Thẻ có giá 3 năng lượng tại đây được +2 sức mạnh.", "lua", "#c9773a"],
  ["dongho", "Làng Tranh Đông Hồ", "Thẻ 2 năng lượng +2.", "Thẻ có giá 2 năng lượng tại đây được +2 sức mạnh.", "rung", "#e06a4a"],
  ["hoian", "Phố Đèn Hội An", "Mỗi thẻ +1 cho mỗi thẻ khác cùng bên tại đây.", "Mỗi thẻ tại đây được +1 sức mạnh cho mỗi thẻ khác của cùng bên tại đây.", "lua", "#ffb347"],
  ["muicamau", "Mũi Cà Mau", "Bên đang kém tại đây: mỗi thẻ +2.", "Bên có tổng sức mạnh gốc thấp hơn tại đây: mỗi thẻ được +2.", "nuoc", "#3aa8a0"],
  ["bangioc", "Thác Bản Giốc", "Từ lượt 4, thẻ tại đây +2.", "Từ lượt 4 trở đi, mọi thẻ tại đây được +2 sức mạnh.", "nuoc", "#4fb0ff"],
  ["sondoong", "Hang Sơn Đoòng", "Thẻ sức mạnh gốc từ 3 trở xuống +2.", "Thẻ có sức mạnh gốc từ 3 trở xuống tại đây được +2.", "toi", "#4a6a7a"],
  ["lungcu", "Cột Cờ Lũng Cú", "Thẻ ở ô đầu tiên mỗi bên +4.", "Thẻ đặt ở ô đầu tiên của mỗi bên tại đây được +4 sức mạnh.", "thieng", "#ff4d4d"],
  ["kinhthanhhue", "Kinh Thành Huế", "Thẻ 5+ năng lượng +2, thẻ 1–2 năng lượng −1.", "Thẻ từ 5 năng lượng trở lên được +2; thẻ 1–2 năng lượng bị −1 tại đây.", "thieng", "#c9a24a"],
  ["badennui", "Núi Bà Đen", "Thẻ dưới 6 năng lượng −2.", "Thẻ có giá dưới 6 năng lượng tại đây bị −2 sức mạnh.", "toi", "#3a3a5a"],
  ["chuahuong", "Chùa Hương", "Thẻ +1 cho mỗi thẻ trên tay chủ (tối đa +4).", "Mỗi thẻ tại đây được +1 sức mạnh cho mỗi thẻ trên tay chủ của nó, tối đa +4.", "thieng", "#e8c46a"],
  ["cungtrang", "Cung Trăng", "Thẻ +1 cho mỗi thẻ đối thủ tại đây.", "Mỗi thẻ tại đây được +1 sức mạnh cho mỗi thẻ của đối thủ tại đây.", "suong", "#cfe0ff"],
  ["coloa", "Thành Cổ Loa", "Đủ 4 thẻ: mọi thẻ của bên đó +2.", "Bên nào có đủ 4 thẻ tại đây thì mọi thẻ của bên đó tại đây được +2.", "thieng", "#b88a4a"],
  ["chilang", "Ải Chi Lăng", "Bên ít thẻ hơn tại đây: mỗi thẻ +3.", "Bên có ít thẻ hơn tại đây: mỗi thẻ của bên đó được +3 sức mạnh.", "rung", "#5a9a4a"],
  ["dongda", "Gò Đống Đa", "Thẻ đặt từ lượt 5 trở đi +2.", "Thẻ được đặt vào đây từ lượt 5 trở đi được +2 sức mạnh.", "rung", "#ff7a7a"],
  ["hoalu", "Cố Đô Hoa Lư", "Thẻ đặt ở lượt 1–2 +3.", "Thẻ được đặt vào đây ở lượt 1 hoặc 2 được +3 sức mạnh.", "thieng", "#c08a5a"],
  ["muine", "Đồi Cát Mũi Né", "Thẻ −1 mỗi lượt sau khi đặt (tối đa −3).", "Thẻ tại đây bị −1 sức mạnh cho mỗi lượt đã qua kể từ khi đặt, tối đa −3.", "lua", "#e8b06a"],
  ["sapa", "Ruộng Mây Sa Pa", "Thẻ có sức mạnh gốc chẵn +2.", "Thẻ có sức mạnh gốc là số chẵn tại đây được +2.", "suong", "#9ad06a"],
  ["fansipan", "Đỉnh Phan Xi Păng", "Đặt ở đây tốn thêm 1, nhưng thẻ +3.", "Thẻ đặt vào đây tốn thêm 1 năng lượng; mọi thẻ tại đây được +3 sức mạnh.", "suong", "#dfeaff"],
  ["thiendinh", "Thiên Đình", "Chỉ đặt được thẻ 5 năng lượng trở lên.", "Chỉ thẻ có giá gốc từ 5 năng lượng trở lên mới đặt được ở đây.", "thieng", "#ffe08a"],
  ["oquoc", "Cầu Ô Thước", "Mỗi bên chỉ có 1 ô.", "Mỗi bên chỉ đặt được 1 thẻ tại đây.", "suong", "#9fb8ff"],
  ["hamrong", "Hàm Rồng", "Thẻ 4 năng lượng trở lên không đặt được.", "Thẻ có giá gốc từ 4 năng lượng trở lên không đặt được ở đây.", "lua", "#ff6a3a"],
  ["chucuoi", "Gốc Đa Chú Cuội", "Thẻ 1 năng lượng không đặt được.", "Thẻ có giá gốc 1 năng lượng không đặt được ở đây.", "rung", "#7aa04a"],
  ["kholuong", "Kho Lương", "Từ lượt 5 không đặt được bài.", "Từ lượt 5 trở đi không đặt được bài ở đây.", "rung", "#c8a060"],
  ["haivan", "Đèo Hải Vân", "Lượt 3 và 4 không đặt được bài.", "Ở lượt 3 và lượt 4 không đặt được bài ở đây.", "suong", "#a0b8d0"],
  ["datrach", "Đầm Dạ Trạch", "Chỉ đặt được thẻ không kỹ năng.", "Thẻ có kỹ năng không đặt được ở đây.", "nuoc", "#5a8a6a"],
  ["luathieng", "Ngọn Lửa Thiêng", "Chỉ đặt được thẻ có kỹ năng Lật.", "Chỉ thẻ có kỹ năng Lật mới đặt được ở đây.", "lua", "#ff8a2b"],
  ["cuabien", "Cửa Biển", "Mỗi lượt mỗi bên chỉ đặt 1 thẻ ở đây.", "Mỗi lượt, mỗi bên chỉ được đặt 1 thẻ vào đây.", "nuoc", "#3a9ad0"],
  ["hangen", "Hang Én", "Mỗi bên chỉ có 3 ô.", "Mỗi bên chỉ đặt được 3 thẻ tại đây.", "toi", "#5a6a8a"],
  ["lovoi", "Lò Vôi", "Thẻ 1–2 năng lượng không đặt được.", "Thẻ có giá gốc 1 hoặc 2 năng lượng không đặt được ở đây.", "lua", "#e8e0c8"],
  ["benthanh", "Chợ Bến Thành", "Thẻ đặt ở đây giảm 1 năng lượng.", "Thẻ đặt vào đây tốn ít hơn 1 năng lượng.", "thieng", "#ffcf5a"],
  ["bencang", "Bến Cảng", "Thẻ 6+ năng lượng đặt ở đây giảm 2.", "Thẻ có giá gốc từ 6 năng lượng trở lên đặt vào đây tốn ít hơn 2 năng lượng.", "nuoc", "#4a8ab0"],
  ["chophien", "Chợ Phiên Vùng Cao", "Lộ diện: mỗi bên thêm 1 thẻ ngẫu nhiên.", "Khi lộ diện: mỗi bên thêm 1 thẻ ngẫu nhiên vào tay.", "rung", "#e07ab0"],
  ["denhung", "Đền Hùng", "Lộ diện: mỗi bên thêm 1 thẻ 3 năng lượng.", "Khi lộ diện: mỗi bên thêm 1 thẻ 3 năng lượng ngẫu nhiên vào tay.", "thieng", "#d9a04a"],
  ["babe", "Hồ Ba Bể", "Lộ diện: mỗi bên rút 2 thẻ.", "Khi lộ diện: mỗi bên rút 2 thẻ.", "nuoc", "#3ab0c8"],
  ["baidaco", "Bãi Đá Cổ", "Lộ diện: mỗi bên có 2 Đá (0) tại đây.", "Khi lộ diện: mỗi bên có 2 Đá với 0 sức mạnh tại đây.", "suong", "#9a9aa8"],
  ["truongson", "Rừng Trường Sơn", "Lộ diện: mỗi bên có 1 Hổ (10) tại đây.", "Khi lộ diện: mỗi bên có 1 Hổ với 10 sức mạnh tại đây.", "rung", "#3a8a3a"],
  ["tanvien", "Núi Tản Viên", "Lộ diện: mỗi bên có 1 Sóc (1) ở mỗi chiến địa.", "Khi lộ diện: mỗi bên có 1 Sóc với 1 sức mạnh ở mỗi chiến địa.", "rung", "#6aa05a"],
  ["ngabasong", "Ngã Ba Sông", "Lộ diện: mọi thẻ trên tay +1.", "Khi lộ diện: mọi thẻ trên tay mỗi bên được +1 sức mạnh.", "nuoc", "#4ac0d0"],
  ["vanphuc", "Làng Lụa Vạn Phúc", "Lộ diện: mỗi bên vứt 1 thẻ rồi rút 2.", "Khi lộ diện: mỗi bên vứt 1 thẻ ngẫu nhiên trên tay rồi rút 2 thẻ.", "rung", "#e08ab0"],
  ["dentran", "Đền Trần", "Lộ diện: lượt này mỗi bên +2 năng lượng.", "Khi lộ diện: lượt này mỗi bên được thêm 2 năng lượng.", "thieng", "#e0b060"],
  ["aolang", "Ao Làng", "Lộ diện: 1 thẻ trên tay mỗi bên −1 năng lượng.", "Khi lộ diện: 1 thẻ ngẫu nhiên trên tay mỗi bên giảm 1 năng lượng.", "nuoc", "#5ab0a0"],
  ["dongrom", "Đồng Rơm", "Lộ diện: mọi thẻ trên tay −1.", "Khi lộ diện: mọi thẻ trên tay mỗi bên bị −1 sức mạnh.", "rung", "#d8c070"],
  ["cautreo", "Cầu Treo", "Lộ diện: 1 thẻ trên sân mỗi bên trở về tay.", "Khi lộ diện: 1 thẻ ngẫu nhiên trên sân của mỗi bên trở về tay.", "suong", "#b8a07a"],
  ["tamdao", "Tam Đảo", "Lộ diện: mỗi bên thêm bản sao thẻ mạnh nhất của mình vào tay.", "Khi lộ diện: mỗi bên thêm vào tay 1 bản sao thẻ mạnh nhất của mình trên sân.", "suong", "#a0c8e0"],
  ["hotay", "Hồ Tây", "Lộ diện: mỗi bên rút 1 thẻ 1 năng lượng.", "Khi lộ diện: mỗi bên rút 1 thẻ 1 năng lượng từ bộ bài (nếu có).", "nuoc", "#4ab8e0"],
  ["banhchung", "Lò Bánh Chưng", "Thẻ đặt ở đây: thêm 1 bản sao vào tay.", "Khi một thẻ được đặt vào đây, chủ của nó nhận 1 bản sao vào tay.", "lua", "#7ac04a"],
  ["giengngoc", "Giếng Ngọc", "Thẻ đặt ở đây nhân đôi sức mạnh gốc.", "Thẻ đặt vào đây được thêm sức mạnh bằng sức mạnh gốc của nó.", "nuoc", "#6ae0ff"],
  ["tokien", "Ổ Kiến Lửa", "Thẻ đặt ở đây: −2 một thẻ đối thủ tại đây.", "Khi một thẻ được đặt vào đây: một thẻ ngẫu nhiên của đối thủ tại đây bị −2 sức mạnh.", "lua", "#ff5a3a"],
  ["songdao", "Dòng Sông Đào", "Thẻ đặt ở đây: rút 1 thẻ.", "Khi một thẻ được đặt vào đây, chủ của nó rút 1 thẻ.", "nuoc", "#3a9ad0"],
  ["ongbamuoi", "Gò Ông Ba Mươi", "Thẻ đặt ở đây bị tiêu huỷ, lượt sau +2 năng lượng.", "Thẻ đặt vào đây bị tiêu huỷ; chủ của nó được thêm 2 năng lượng ở lượt sau.", "toi", "#c06a2a"],
  ["miengnuilua", "Miệng Núi Lửa", "Thẻ đặt ở đây có 1/4 khả năng bị tiêu huỷ.", "Mỗi thẻ đặt vào đây có 25% khả năng bị tiêu huỷ.", "lua", "#ff3a1a"],
  ["tramdich", "Trạm Dịch", "Thẻ đặt ở đây chạy sang chiến địa khác và +2.", "Thẻ đặt vào đây được +2 rồi di chuyển sang một chiến địa ngẫu nhiên khác còn ô.", "suong", "#c8b08a"],
  ["daudinh", "Cây Đa Đầu Làng", "Thẻ đặt ở đây: các thẻ khác cùng bên tại đây +1.", "Khi một thẻ được đặt vào đây, các thẻ khác của cùng bên tại đây được +1.", "rung", "#4a9a4a"],
  ["thanhgiong", "Đền Thánh Gióng", "Thẻ đặt ở đây +1 cho mỗi 2 lượt đã qua.", "Thẻ đặt vào đây được +1 sức mạnh cho mỗi 2 lượt đã qua.", "thieng", "#e0a040"],
  ["lyson", "Đảo Lý Sơn", "Thẻ đặt ở đây có sức mạnh gốc thành 4.", "Thẻ đặt vào đây có sức mạnh gốc trở thành 4.", "nuoc", "#3ac0b0"],
  ["choamphu", "Chợ Âm Phủ", "Thẻ đặt ở đây: đối thủ nhận 1 bản sao.", "Khi một thẻ được đặt vào đây, đối thủ nhận 1 bản sao của nó vào tay.", "toi", "#8a4ab0"],
  ["bichdong", "Chùa Bích Động", "Thẻ đặt ở đây trở về tay và giảm 1 năng lượng.", "Thẻ đặt vào đây trở về tay chủ và giảm 1 năng lượng.", "thieng", "#a0c08a"],
  ["baiboi", "Bãi Bồi", "Thẻ đặt ở đây: thêm 1 Đá vào bộ bài của bạn.", "Khi một thẻ được đặt vào đây, chủ của nó có thêm 1 Đá (0 sức mạnh) xáo vào bộ bài.", "suong", "#b0a080"],
  ["cucphuong", "Rừng Cúc Phương", "Cuối mỗi lượt, thẻ tại đây +1.", "Cuối mỗi lượt, mọi thẻ tại đây được +1 sức mạnh.", "rung", "#3aa05a"],
  ["mauson", "Đỉnh Mẫu Sơn", "Cuối mỗi lượt, thẻ tại đây −1.", "Cuối mỗi lượt, mọi thẻ tại đây bị −1 sức mạnh.", "suong", "#c0d8f0"],
  ["nguhanh", "Núi Ngũ Hành", "Cuối lượt 5, mọi thẻ tại đây +2.", "Cuối lượt 5, mọi thẻ tại đây được +2 sức mạnh.", "thieng", "#c0b0a0"],
  ["bienho", "Biển Hồ", "Cuối lượt: bên dẫn tại đây rút 1 thẻ.", "Cuối mỗi lượt, bên đang dẫn tại đây rút 1 thẻ.", "nuoc", "#4a90c0"],
  ["lothan", "Lò Than", "Cuối lượt: 1 thẻ trên tay mỗi bên +1.", "Cuối mỗi lượt, 1 thẻ ngẫu nhiên trên tay mỗi bên được +1 sức mạnh.", "lua", "#ff7a3a"],
  ["cuulong", "Đồng Bằng Cửu Long", "Cuối lượt 3: bên thua tại đây có 1 Lính Thuê (3).", "Cuối lượt 3, bên đang thua tại đây có 1 Lính Thuê với 3 sức mạnh tại đây.", "rung", "#6ac05a"],
  ["batham", "Bãi Tha Ma Cổ", "Cuối lượt 3: tiêu huỷ mọi thẻ tại đây.", "Cuối lượt 3, tiêu huỷ mọi thẻ tại đây.", "toi", "#5a4a6a"],
  ["cautre", "Cầu Tre Lắt Lẻo", "Cuối lượt: bên có hơn 1 thẻ tại đây mất hết thẻ đó.", "Cuối mỗi lượt, nếu một bên có hơn 1 thẻ tại đây, tiêu huỷ các thẻ đó.", "suong", "#c0a870"],
  ["vankiep", "Kinh Đô Vạn Kiếp", "Cuối lượt 4: tiêu huỷ thẻ của bên đang thua tại đây.", "Cuối lượt 4, tiêu huỷ mọi thẻ của bên đang thua tại đây.", "toi", "#8a3a3a"],
  ["songthuong", "Bến Sông Thương", "Cuối lượt 5: thẻ tại đây chuyển sang chiến địa khác.", "Cuối lượt 5, mọi thẻ tại đây di chuyển sang một chiến địa ngẫu nhiên khác còn ô.", "nuoc", "#5aa0c0"],
  ["hangtoi", "Hang Tối", "Cuối lượt: thẻ mạnh nhất mỗi bên tại đây −1.", "Cuối mỗi lượt, thẻ mạnh nhất của mỗi bên tại đây bị −1 sức mạnh.", "toi", "#3a3a6a"],
  ["vuondao", "Vườn Đào Nhật Tân", "Cuối lượt: mỗi bên thêm 1 Sóc (1) tại đây.", "Cuối mỗi lượt, mỗi bên có thêm 1 Sóc với 1 sức mạnh tại đây (nếu còn ô).", "rung", "#ff8ac0"],
  ["thuongngan", "Rừng Thượng Ngàn", "Cuối lượt 3: mỗi bên đặt 1 thẻ từ bộ bài vào đây.", "Cuối lượt 3, mỗi bên đặt 1 thẻ ngẫu nhiên từ bộ bài vào đây.", "thieng", "#5ab06a"],
  ["chotet", "Chợ Tết", "Cuối lượt 5: mỗi bên đặt 1 thẻ trên tay vào đây.", "Cuối lượt 5, mỗi bên đặt 1 thẻ ngẫu nhiên trên tay vào đây (nếu còn ô).", "lua", "#ff4d6d"],
  ["suoimo", "Suối Mỡ", "Đầu lượt: bên không có thẻ ở đây +1 năng lượng.", "Đầu mỗi lượt, bên không có thẻ nào tại đây được thêm 1 năng lượng.", "nuoc", "#5ad0c0"],
  ["giomua", "Đỉnh Gió Mùa", "Đầu lượt 4: xáo tay vào bộ bài rồi rút 3.", "Đầu lượt 4, mỗi bên xáo bài trên tay vào bộ bài rồi rút 3 thẻ.", "suong", "#b0c8e8"],
  ["bachma", "Đỉnh Bạch Mã", "Lượt 5, mọi thẻ tốn thêm 1 năng lượng.", "Ở lượt 5, mọi thẻ (ở mọi chiến địa) tốn thêm 1 năng lượng.", "suong", "#e0e8ff"],
  ["tinhyeu", "Thung Lũng Tình Yêu", "Thẻ 6+ năng lượng tốn ít hơn 1.", "Thẻ có giá gốc từ 6 năng lượng trở lên tốn ít hơn 1 năng lượng (ở mọi chiến địa).", "thieng", "#ff8ab0"],
  ["dongbattan", "Cánh Đồng Bất Tận", "Bên có nhiều thẻ hơn giữ chiến địa này.", "Bên có nhiều thẻ hơn tại đây giữ chiến địa này; bằng nhau thì so sức mạnh.", "rung", "#b0d060"],
  ["ngocson", "Đền Ngọc Sơn", "Ai dẫn ở đây: +2 ở các chiến địa khác.", "Bên đang dẫn tại đây được +2 sức mạnh ở hai chiến địa còn lại.", "thieng", "#ff6a5a"]
];
for (const r of LRAW2) LOC[r[0]] = { id: r[0], n: r[1], s: r[2], x: r[3], th: r[4], hu: r[5] };
/* quy tắc */
const rawP = k => basePow(k) + k.bonus;
const shownAt = (G, li, s) => G.locs[li].cards[s].filter(c => c.rev);
function rawSum(G, li, s) { let n = 0; for (const c of shownAt(G, li, s)) n += rawP(c); return n; }
function rawLead(G, li) { let p = 0, a = 0; for (const c of shownAt(G, li, "p")) p += power(G, c, li); for (const c of shownAt(G, li, "a")) a += power(G, c, li); return p === a ? null : p > a ? "p" : "a"; }
function handAdd(G, s, id) { if (id) toHand(G, s, mk(G, id, s), true); }
function lxDestroyAll(G, arr, li) { for (const k of arr.slice()) if (locOf(G, k) === li) destroy(G, k, li); }
const LXF = {
  hoguom: { pow: () => 1 },
  halong: { pow: (G, i, li) => shownAt(G, li, i.side).length === 1 ? 5 : 0 },
  bachdang: { pow: () => -1 },
  amphu: { pow: () => -3 },
  longcung: { pow: () => 4 },
  vanmieu: { pow: (G, i) => C[ab(i)].t === "rev" ? 2 : 0 },
  dinhlang: { pow: (G, i) => C[ab(i)].t === "none" ? 3 : 0 },
  dongvan: { pow: (G, i, li, d) => d.c === 1 ? 3 : 0 },
  phongnha: { pow: (G, i, li) => { const me = rawP(i); return shownAt(G, li, i.side).every(k => rawP(k) <= me) ? 3 : 0; } },
  thapcham: { pow: (G, i) => C[ab(i)].t === "on" ? 2 : 0 },
  caurong: { pow: (G, i, li, d) => d.c >= 6 ? 4 : 0 },
  battrang: { pow: (G, i, li, d) => d.c === 3 ? 2 : 0 },
  dongho: { pow: (G, i, li, d) => d.c === 2 ? 2 : 0 },
  hoian: { pow: (G, i, li) => Math.max(0, shownAt(G, li, i.side).length - 1) },
  muicamau: { pow: (G, i, li) => rawSum(G, li, i.side) < rawSum(G, li, other(i.side)) ? 2 : 0 },
  bangioc: { pow: G => G.turn >= 4 ? 2 : 0 },
  sondoong: { pow: (G, i) => basePow(i) <= 3 ? 2 : 0 },
  lungcu: { pow: (G, i, li) => G.locs[li].cards[i.side][0] === i ? 4 : 0 },
  kinhthanhhue: { pow: (G, i, li, d) => d.c >= 5 ? 2 : d.c <= 2 ? -1 : 0 },
  badennui: { pow: (G, i, li, d) => d.c < 6 ? -2 : 0 },
  chuahuong: { pow: (G, i) => Math.min(4, G.hand[i.side].length) },
  cungtrang: { pow: (G, i, li) => shownAt(G, li, other(i.side)).length },
  coloa: { pow: (G, i, li) => G.locs[li].cards[i.side].length >= 4 ? 2 : 0 },
  chilang: { pow: (G, i, li) => G.locs[li].cards[i.side].length < G.locs[li].cards[other(i.side)].length ? 3 : 0 },
  dongda: { pow: (G, i) => i.turn >= 5 ? 2 : 0 },
  hoalu: { pow: (G, i) => i.turn >= 1 && i.turn <= 2 ? 3 : 0 },
  muine: { pow: (G, i) => -Math.min(3, Math.max(0, G.turn - (i.turn || G.turn))) },
  sapa: { pow: (G, i) => basePow(i) % 2 === 0 ? 2 : 0 },
  fansipan: { pow: () => 3, cost: () => 1 },
  thiendinh: { can: (G, s, i) => C[i.id].c >= 5 },
  oquoc: { cap: 1 },
  hamrong: { can: (G, s, i) => C[i.id].c <= 3 },
  chucuoi: { can: (G, s, i) => C[i.id].c !== 1 },
  kholuong: { can: G => G.turn < 5 },
  haivan: { can: G => G.turn !== 3 && G.turn !== 4 },
  datrach: { can: (G, s, i) => C[ab(i)].t === "none" },
  luathieng: { can: (G, s, i) => C[ab(i)].t === "rev" },
  cuabien: { can: (G, s, i, li) => !G.q[s].some(a => a.t === "play" && a.li === li) },
  hangen: { cap: 3 },
  lovoi: { can: (G, s, i) => C[i.id].c >= 3 },
  benthanh: { cost: () => -1 },
  bencang: { cost: (G, i) => C[i.id].c >= 6 ? -2 : 0 },
  chophien: { rev: G => { for (const s of SIDES) handAdd(G, s, pick(G, COLLECT)); } },
  denhung: { rev: G => { for (const s of SIDES) handAdd(G, s, pick(G, COLLECT.filter(id => C[id].c === 3))); } },
  babe: { rev: G => { for (const s of SIDES) { draw(G, s); draw(G, s); } } },
  baidaco: { rev: (G, li) => { for (const s of SIDES) { summon(G, s, "da", li, 0); summon(G, s, "da", li, 0); } } },
  truongson: { rev: (G, li) => { for (const s of SIDES) summon(G, s, "ho", li, 10); } },
  tanvien: { rev: G => { for (const s of SIDES) for (let k = 0; k < 3; k++) if (!G.locs[k].gone) summon(G, s, "soc", k, 1); } },
  ngabasong: { rev: G => { for (const s of SIDES) for (const c of G.hand[s]) c.bonus += 1; } },
  vanphuc: { rev: G => { for (const s of SIDES) { const c = pick(G, G.hand[s]); if (c) discard(G, s, c); draw(G, s); draw(G, s); } } },
  dentran: { rev: G => { for (const s of SIDES) G.energy[s] += 2; } },
  aolang: { rev: G => { for (const s of SIDES) { const c = pick(G, G.hand[s]); if (c) c.cm -= 1; } } },
  dongrom: { rev: G => { for (const s of SIDES) for (const c of G.hand[s]) c.bonus -= 1; } },
  cautreo: { rev: G => { for (const s of SIDES) { const e = pick(G, boardCards(G, s)); if (e) bounce(G, e[0], e[1]); } } },
  tamdao: { rev: G => { for (const s of SIDES) { let hi = null, hv = -1e9; for (const [k, l] of boardCards(G, s)) { const v = power(G, k, l); if (v > hv) { hv = v; hi = k; } } if (hi && G.hand[s].length < HAND_MAX) toHand(G, s, clone1(G, hi, s), true); } } },
  hotay: { rev: G => { for (const s of SIDES) { const dk = G.deck[s], ix = dk.findIndex(c => C[c.id].c === 1); if (ix >= 0 && G.hand[s].length < HAND_MAX) G.hand[s].push(dk.splice(ix, 1)[0]); } } },
  banhchung: { play: (G, i) => { if (G.hand[i.side].length < HAND_MAX) toHand(G, i.side, mk(G, i.id, i.side), true); } },
  giengngoc: { play: (G, i) => { const b = basePow(i); if (b > 0) i.bonus += b; } },
  tokien: { play: (G, i, li) => { const t = pick(G, shownAt(G, li, other(i.side))); if (t) hurt(G, t, li, 2); } },
  songdao: { play: (G, i) => draw(G, i.side) },
  ongbamuoi: { play: (G, i, li) => { G.nextBonus[i.side] += 2; destroy(G, i, li); } },
  miengnuilua: { play: (G, i, li) => { if (rnd(G) < .25) destroy(G, i, li); } },
  tramdich: { play: (G, i, li) => { i.bonus += 2; const to = pick(G, otherLocs(G, li, i.side)); if (to != null) moveCard(G, i, li, to); } },
  daudinh: { play: (G, i, li) => { for (const k of shownAt(G, li, i.side)) if (k !== i) k.bonus += 1; } },
  thanhgiong: { play: (G, i) => { i.bonus += Math.floor(G.turn / 2); } },
  lyson: { play: (G, i) => { i.bp = 4; } },
  choamphu: { play: (G, i) => { const o = other(i.side); if (G.hand[o].length < HAND_MAX) toHand(G, o, mk(G, i.id, o), true); } },
  bichdong: { play: (G, i, li) => { if (G.hand[i.side].length < HAND_MAX && bounce(G, i, li)) i.cm -= 1; } },
  baiboi: { play: (G, i) => { const dk = G.deck[i.side]; dk.splice(Math.floor(rnd(G) * (dk.length + 1)), 0, mk(G, "da", i.side)); } },
  cucphuong: { end: (G, li) => { for (const s of SIDES) for (const k of shownAt(G, li, s)) k.bonus += 1; } },
  mauson: { end: (G, li) => { for (const s of SIDES) for (const k of shownAt(G, li, s)) hurt(G, k, li, 1); } },
  nguhanh: { end: (G, li) => { if (G.turn === 5) for (const s of SIDES) for (const k of shownAt(G, li, s)) k.bonus += 2; } },
  bienho: { end: (G, li) => { const w = rawLead(G, li); if (w) draw(G, w); } },
  lothan: { end: G => { for (const s of SIDES) { const c = pick(G, G.hand[s]); if (c) c.bonus += 1; } } },
  cuulong: { end: (G, li) => { if (G.turn !== 3) return; const w = rawLead(G, li); if (w) summon(G, other(w), "thuhoang", li, 3); } },
  batham: { end: (G, li) => { if (G.turn === 3) for (const s of SIDES) lxDestroyAll(G, shownAt(G, li, s), li); } },
  cautre: { end: (G, li) => { for (const s of SIDES) { const a = shownAt(G, li, s); if (a.length > 1) lxDestroyAll(G, a, li); } } },
  vankiep: { end: (G, li) => { if (G.turn !== 4) return; const w = rawLead(G, li); if (w) lxDestroyAll(G, shownAt(G, li, other(w)), li); } },
  songthuong: { end: (G, li) => { if (G.turn !== 5) return; for (const s of SIDES) for (const k of shownAt(G, li, s)) { const to = pick(G, otherLocs(G, li, s)); if (to != null) moveCard(G, k, li, to); } } },
  hangtoi: { end: (G, li) => { for (const s of SIDES) { const a = shownAt(G, li, s); if (!a.length) continue; let hi = a[0]; for (const k of a) if (power(G, k, li) > power(G, hi, li)) hi = k; hurt(G, hi, li, 1); } } },
  vuondao: { end: (G, li) => { for (const s of SIDES) summon(G, s, "soc", li, 1); } },
  thuongngan: { end: (G, li) => { if (G.turn !== 3) return; for (const s of SIDES) { const dk = G.deck[s]; if (!dk.length || !space(G, li, s)) continue; const c = dk.splice(Math.floor(rnd(G) * dk.length), 1)[0]; place(G, c, li, s); } } },
  chotet: { end: (G, li) => { if (G.turn !== 5) return; for (const s of SIDES) { const h = G.hand[s]; if (!h.length || !space(G, li, s)) continue; const c = h.splice(Math.floor(rnd(G) * h.length), 1)[0]; place(G, c, li, s); } } },
  suoimo: { start: (G, li) => { for (const s of SIDES) if (!G.locs[li].cards[s].length) G.energy[s] += 1; } },
  giomua: { start: G => { if (G.turn !== 4) return; for (const s of SIDES) { const h = G.hand[s].splice(0); const dk = G.deck[s]; for (const c of h) dk.splice(Math.floor(rnd(G) * (dk.length + 1)), 0, c); for (let k = 0; k < 3; k++) draw(G, s); } } },
  bachma: { gcost: G => G.turn === 5 ? 1 : 0 },
  tinhyeu: { gcost: (G, i) => C[i.id].c >= 6 ? -1 : 0 },
  dongbattan: { lead: (G, li) => { const p = G.locs[li].cards.p.length, a = G.locs[li].cards.a.length; return p === a ? undefined : p > a ? "p" : "a"; } },
  ngocson: { aura: 2 }
};
function LX(G, L) { return lon(G, L) ? LXF[L.id] : null; }


const TURNS = 6, HAND_MAX = 7, SIDES = ["p", "a"];
const other = s => (s === "p" ? "a" : "p");

/* ---------- ngẫu nhiên có hạt giống ---------- */
function rnd(G) {
  G.rs = (G.rs + 0x6D2B79F5) | 0;
  let t = G.rs;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick(G, arr) { return arr.length ? arr[Math.floor(rnd(G) * arr.length)] : null; }
function shuffle(G, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(G) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function log(G, m) { if (G.msgs) G.msgs.push(m); }
function anyInst(G, uid) { for (const s of SIDES) for (const k of ["hand", "deck", "disc", "dead"]) { const c = (G[k][s] || []).find(x => x.uid === uid); if (c) return c; } const f = find(G, uid); return f ? f.inst : null; }
function track(G) {
  if (!G.evs) return; let by = null;
  if (G.lsk > 0) { const c = anyInst(G, G.lsk); by = c ? c.id : null; } else if (G.lsk < 0) { const L = G.locs[-G.lsk - 1]; by = L ? "L:" + L.id : null; }
  const scan = c => {
    const b0 = c._b == null ? 0 : c._b, m0 = c._m == null ? 0 : c._m;
    if (c.bonus !== b0) { (c.hist = c.hist || []).push({ k: "p", d: c.bonus - b0, by, t: G.turn }); c._b = c.bonus; }
    if (c.cm !== m0) { (c.hist = c.hist || []).push({ k: "c", d: c.cm - m0, by, t: G.turn }); c._m = c.cm; }
    if (c.sil && !c.silBy) { c.silBy = by || "?"; G.evs.push({ k: "sil", uid: c.uid, src: G.lsk > 0 ? G.lsk : 0 }); } else if (!c.sil && c.silBy) c.silBy = null;
    if (c.hist && c.hist.length > 12) c.hist.splice(0, c.hist.length - 12);
  };
  for (const s of SIDES) { for (const c of G.hand[s]) scan(c); for (const c of G.deck[s]) scan(c); }
  for (let i = 0; i < 3; i++) for (const s of SIDES) for (const c of G.locs[i].cards[s]) scan(c);
}
function ev(G, k, o) { if (G.evs) { if (k === "skill" || k === "act" || k === "flip") { track(G); G.lsk = o.uid; } else if (k === "locfx" || k === "loc") { track(G); G.lsk = -(o.li + 1); } o.k = k; if (o.src == null && G.srcU) o.src = G.srcU; G.evs.push(o); } }

/* ---------- lá bài ---------- */
function mk(G, id, side) { return { uid: ++G.uid, id, side, own: side, cr: !!G.live, by: G.live && G.srcU ? ((anyInst(G, G.srcU) || {}).id || null) : null, bonus: 0, bp: null, cm: 0, rev: false, turn: 0, sum: false, rvv: false, eb: 0, sil: null, act: false, mv: false, age: 0, played: false, et: 0 }; }
const ab = c => c.ab || c.id;
function is(G, c, x) {
  const a = c.ab || c.id; if (a === x) return true;
  if (c.xab && c.xab.includes(x)) return true;
  if (a === "nguyetthach" && C[x] && C[x].t === "on") { const l = locOf(G, c); if (l >= 0) for (const k of G.locs[l].cards[c.side]) if (k !== c && k.rev && !k.sil && C[k.id].c <= 3 && (k.ab || k.id) === x) return true; }
  if (a === "sieudihinh" && C[x] && C[x].t === "on" && x !== "sieudihinh") { const o = other(c.side); for (let l = 0; l < 3; l++) for (const k of G.locs[l].cards[o]) if (k.rev && !k.sil && (k.ab || k.id) === x) return true; }
  return false;
}
function abs(G, c) {
  const a = c.ab || c.id;
  if (c.xab) return [a].concat(c.xab);
  if (a === "nguyetthach") { const out = [a], l = locOf(G, c); if (l >= 0) for (const k of G.locs[l].cards[c.side]) { const b = k.ab || k.id; if (k !== c && k.rev && !k.sil && C[k.id].c <= 3 && C[b].t === "on" && b !== "nguyetthach" && !out.includes(b)) out.push(b); } return out; }
  if (a !== "sieudihinh") return [a];
  const out = [], o = other(c.side); for (let l = 0; l < 3; l++) for (const k of G.locs[l].cards[o]) { const b = k.ab || k.id; if (k.rev && !k.sil && C[b].t === "on" && b !== "sieudihinh" && !out.includes(b)) out.push(b); }
  return out;
}
const lon = (G, L) => L.rvl && !(G.noLoc >= G.turn);
function turns(G) { return (G.locs.some(L => L.rvl && L.id === "limbo") ? TURNS + 1 : TURNS) + (G.mods && G.mods.g && G.mods.g.turns7 ? 1 : 0); }
function basePow(i) { return i.bp != null ? i.bp : C[i.id].p; }
function shown(G, li, side) { return G.locs[li].cards[side].filter(c => c.rev); }
function boardCards(G, side) { const o = []; for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[side]) if (c.rev) o.push([c, i]); return o; }
function locOf(G, inst) { for (let i = 0; i < 3; i++) for (const s of SIDES) if (G.locs[i].cards[s].includes(inst)) return i; return -1; }
function find(G, uid) { for (let i = 0; i < 3; i++) for (const s of SIDES) for (const c of G.locs[i].cards[s]) if (c.uid === uid) return { inst: c, li: i }; return null; }
function cap(G, li) { const L = G.locs[li]; if (L.gone) return 0; if (lon(G, L) && L.id === "cave") return 2; const X = LX(G, L); return X && X.cap ? X.cap : 4; }
function space(G, li, side) { return G.locs[li].cards[side].length < cap(G, li); }
function otherLocs(G, li, side) { return [0, 1, 2].filter(i => i !== li && space(G, i, side)); }
function hasOn(G, li, side, id) { return G.locs[li].cards[side].some(c => c.rev && !c.sil && is(G, c, id)); }
function cntOn(G, side, id) { let n = 0; for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[side]) if (c.rev && !c.sil && is(G, c, id)) n += ongMult(G, i, side, c); return n; }
function anyOn(G, side, id) { for (let i = 0; i < 3; i++) if (hasOn(G, i, side, id)) return true; return false; }
function unpile(G, inst) { for (const s of SIDES) for (const k of ["disc", "dead"]) { const a = G[k][s], ix = a.indexOf(inst); if (ix >= 0) a.splice(ix, 1); } }

function noReduce(G, inst, li) {
  if (anyOn(G, inst.side, "dathep") && G.locs[li].cards[inst.side].indexOf(inst) < 2) return true;
  if (G.mods && MD(G, inst.side).lowsh && basePow(inst) <= 2) return true;
  return !inst.sil && (is(G, inst, "thepnhan") || !!inst.ug_sh);
}
function stardust(G) { return anyOn(G, "p", "buisao") || anyOn(G, "a", "buisao"); }
function profX(G, li) { for (const s of SIDES) if (hasOn(G, li, s, "giaosutam")) return true; return false; }
function noDestroy(G, inst, li) {
  const L = G.locs[li];
  if ((C[inst.id].c === 1 || C[inst.id].c === 6) && anyOn(G, inst.side, "thachlucnu")) return true;
  if (lon(G, L) && L.id === "bamboo") return true;
  if (!inst.sil && (is(G, inst, "thepnhan") || is(G, inst, "hackiem") || is(G, inst, "khientuong"))) return true;
  if (!inst.sil && inst.ug_iv) return true;
  if (G.mods && MD(G, inst.side).midiv && li === 1) return true;
  if (profX(G, li)) return true;
  return hasOn(G, li, "p", "giaphon") || hasOn(G, li, "a", "giaphon");
}
function noMove(G, inst, from, to) {
  if (hasOn(G, from, other(inst.side), "thuyngannu")) return true;
  return !inst.sil && is(G, inst, "thepnhan");
}

/* ---------- sức mạnh ---------- */
function ongMult(G, li, side, src) {
  let m = 1; const L = G.locs[li];
  if (lon(G, L) && L.id === "falls") m *= 2;
  for (const c of L.cards[side]) if (c !== src && c.rev && !c.sil && is(G, c, "tamtuquai")) m *= 2;
  return m;
}
function power(G, inst, li, noCer) {
  const d = C[inst.id], L = G.locs[li], s = inst.side, o = other(s);
  let p = basePow(inst) + inst.bonus + modPow(G, inst, li);
  const mine = L.cards[s];
  if (!inst.sil) {
    const m = ongMult(G, li, s, inst);
    for (const aid of abs(G, inst)) switch (aid) {
      case "phankysi": { let n = 0; for (const sd of SIDES) for (const k of shown(G, li, sd)) if (C[k.id].c > d.c) n++; p += 2 * n * m; break; }
      case "hoasat": p += 3 * (G.destLoc[s][0] + G.destLoc[s][1] + G.destLoc[s][2]) * m; break;
      case "toctu": p += G.cnt.allSpent[s] * m; break;
      case "daluc": break;
      case "kevocam": { let n = 0; for (const sd of SIDES) for (const [k] of boardCards(G, sd)) if (k.bonus < 0) n++; p += n * m; break; }
      case "cunhan": p += boardCards(G, s).filter(([k]) => k !== inst && !k.sil && C[ab(k)].t === "on").length * m; break;
      case "dothan": { let n = 0; for (const sd of SIDES) for (const [k] of boardCards(G, sd)) if (C[ab(k)].t === "rev") n++; p += 2 * n * m; break; }
      case "giapdam": p += G.cnt.moves[s] * m; break;
      case "tenthuphong": if (mine.length >= cap(G, li)) p += 3 * m; break;
      case "ungtoi": p += 2 * G.deck[o].length * m; break;
      case "duatrehoang": p += ((G.cnt.disc[s] > 0 ? 4 : 0) + (G.cnt.destOwn[s] > 0 ? 4 : 0)) * m; break;
      case "quangca": { let n = 0; for (let k = 0; k < 3; k++) if (G.locs[k].cards[s].length >= cap(G, k)) n++; p += 2 * n * m; break; }
      case "hacthan": p += G.cnt.destPow * m; break;
      case "trumtruyenhinh": if (mine.length >= cap(G, li) && L.cards[o].length >= cap(G, li)) p += 6 * m; break;
      case "huyetbacsi": p += 2 * G.cnt.disc[s] * m; break;
      case "kinhnhan": if (mine.length === 1) p += 7 * m; break;
      case "phanquanbua": p += 2 * G.hand[o].length * m; break;
      case "chienlo": if ([0, 1, 2].some(k => G.locs[k].cards[s].length === 0)) p += 5 * m; break;
      case "kiengiap": if (mine.length >= cap(G, li)) p += 4 * m; break;
      case "longdo": p += 2 * G.hand[s].length * m; break;
      case "thanlannhan": if (L.cards[o].length >= 4) p -= 4 * m; break;
      case "thuyvuong": if (mine.length === 1) p += 5 * m; break;
      case "ketrungphat": p += shown(G, li, o).length * m; break;
      case "lucsi": if (G.hand[s].length <= 1) p += 6 * m; break;
    }
  }
  for (const c of mine) {
    if (c === inst || !c.rev || c.sil) continue;
    if (is(G, c, "thuantuong") && d.t === "on" && !inst.sil) p += 2 * ongMult(G, li, s, c);
  }
  for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) {
    if (!c.rev || c.sil || c === inst) continue;
    if (is(G, c, "aiquoc")) { if (d.t === "none") p += 2 * ongMult(G, i, s, c); continue; }
    if (is(G, c, "lamkynhan")) p += ongMult(G, i, s, c);
    else if (is(G, c, "chuarung")) { if (d.c === 1) p += ongMult(G, i, s, c); }
  }
  for (const c of mine) if (c !== inst && c.rev && !c.sil && is(G, c, "dichnu") && !noReduce(G, inst, li)) p -= 2 * ongMult(G, li, s, c);
  if (inst.id === "bavuongtim" && G.stones[s] >= 6) p += 10 * cntOn(G, s, "daluc");
  if (inst.cr && !inst.sum) for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c !== inst && c.rev && !c.sil && is(G, c, "taysatnu")) p += 2 * ongMult(G, i, s, c);
  if (d.c >= 4) { for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c !== inst && c.rev && !c.sil && is(G, c, "thanhkiem")) p += 2 * ongMult(G, i, s, c);
    for (const sd of SIDES) for (const c of L.cards[sd]) if (c !== inst && c.rev && !c.sil && is(G, c, "dacvuquocgia") && !noReduce(G, inst, li)) p -= 3 * ongMult(G, li, sd, c); }
  if (inst.bonus < 0 && !noReduce(G, inst, li)) for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[o]) if (c.rev && !c.sil && is(G, c, "bocapngaymoi")) p += inst.bonus * ongMult(G, i, o, c);
  if (inst.id === "kiemquyen" && !inst.sil) { const kp = mine.find(c => c.rev && !c.sil && c.id === "kiemphuchy"); if (kp) p += 8 * ongMult(G, li, s, kp); }
  for (const c of mine) if (c !== inst && c.rev && !c.sil) {
    if (is(G, c, "daitaxacsong")) p += G.cnt.discTurns[s] * ongMult(G, li, s, c);
    else if (is(G, c, "cosi")) { if (inst.bonus > 0) p += 2 * ongMult(G, li, s, c); }
    else if (is(G, c, "nuthuantuong")) { if (mine.indexOf(inst) >= 2) p += Math.max(0, pw0(c)) * ongMult(G, li, s, c); }
  }
  for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c !== inst && c.rev && !c.sil) {
    if (is(G, c, "kysiho")) { if (inst.bonus > 0) p += ongMult(G, i, s, c); }
    else if (is(G, c, "baocohauthe")) { if (["baoco", "baocohauthe", "baochuasat", "baochuahauthe"].includes(inst.id)) p += ongMult(G, i, s, c); }
  }
  if (inst.bonus < 0) for (const c of L.cards[o]) if (c.rev && !c.sil && is(G, c, "kimcuongxa") && !noReduce(G, inst, li)) p -= 2 * ongMult(G, li, o, c);
  for (const sd of SIDES) for (const c of L.cards[sd]) if (c !== inst && c.rev && !c.sil && is(G, c, "damquai") && d.c <= 3 && !noReduce(G, inst, li)) p -= 2 * ongMult(G, li, sd, c);
  if (inst.id === "da") for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c.rev && !c.sil && is(G, c, "datientri")) p += 3 * ongMult(G, i, s, c);
  for (const c of L.cards[o]) if (c.rev && !c.sil && is(G, c, "sodo")) p += 2 * ongMult(G, li, o, c);
  if (!noCer) {
    let nC = 0; for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c.rev && !c.sil && is(G, c, "maydotam")) nC += ongMult(G, i, s, c);
    if (nC) { const my = power(G, inst, li, true); let hi = -1e9; for (let i = 0; i < 3; i++) for (const c of G.locs[i].cards[s]) if (c.rev) hi = Math.max(hi, power(G, c, i, true)); if (my === hi) p += 3 * nC; }
  }
  if (lon(G, L)) {
    if (L.id === "snow" && !noReduce(G, inst, li)) p -= 1;
    if (L.id === "forest" && (d.c === 1 || d.c === 2)) p += 2;
    else if (L.id === "mist" && d.t === "none") p += 2;
    else if (L.id === "temple" && d.c >= 5) p += 3;
    const X = LXF[L.id]; if (X && X.pow) { const v = X.pow(G, inst, li, d); if (!(v < 0 && noReduce(G, inst, li))) p += v; }
  }
  if (!inst.sil && is(G, inst, "thietgiapthuongdang")) { const b0 = basePow(inst); if (p > b0) p = b0 + 2 * (p - b0); }
  return p;
}
function locPower(G, li, side) {
  if (G.locs[li].gone) return 0;
  if (anyOn(G, side, "toaansong")) return Math.floor((locPowerRaw(G, 0, side) + locPowerRaw(G, 1, side) + locPowerRaw(G, 2, side)) / 3);
  return locPowerRaw(G, li, side);
}
function locPowerRaw(G, li, side) {
  let s = 0; const mine = G.locs[li].cards[side];
  for (let k = 0; k < 3; k++) if (k !== li) { const X = LX(G, G.locs[k]); if (X && X.aura && rawLead(G, k) === side) s += X.aura; }
  for (const c of mine) if (c.rev) s += power(G, c, li);
  for (const c of mine) if (c.rev && !c.sil && is(G, c, "thietgiap")) s *= Math.pow(2, ongMult(G, li, side, c));
  for (const a of [li - 1, li + 1]) if (a >= 0 && a < 3) for (const c of G.locs[a].cards[side]) {
    if (!c.rev || c.sil) continue;
    if (is(G, c, "deonhan")) s += 3 * ongMult(G, a, side, c);
    else if (is(G, c, "amtrao") && a === li - 1) s += 6 * ongMult(G, a, side, c);
  }
  for (let a = 0; a < 3; a++) if (a !== li) for (const c of G.locs[a].cards[other(side)]) if (c.rev && !c.sil && is(G, c, "ansao")) s += 3 * ongMult(G, a, other(side), c);
  { const mine2 = G.locs[li].cards[side].filter(c => c.rev), cs = mine2.map(c => C[c.id].c + c.cm);
    if (mine2.length >= 2 && new Set(cs).size === cs.length) for (const a of [li - 1, li + 1]) if (a >= 0 && a < 3) for (const c of G.locs[a].cards[side]) if (c.rev && !c.sil && is(G, c, "kynu")) s += 6 * ongMult(G, a, side, c); }
  for (let a = 0; a < 3; a++) if (a !== li) for (const c of G.locs[a].cards[side]) if (c.rev && !c.sil && is(G, c, "xichxuctu")) {
    let me = 0, th = 0; for (const x of G.locs[a].cards[side]) if (x.rev) me += power(G, x, a); for (const x of G.locs[a].cards[other(side)]) if (x.rev) th += power(G, x, a);
    if (me > th) s += 3 * ongMult(G, a, side, c);
  }
  return s;
}
function lead(G, li) {
  { const X = LX(G, G.locs[li]); if (X && X.lead) { const r = X.lead(G, li); if (r !== undefined) return r; } }
  const a = locPower(G, li, "a"), p = locPower(G, li, "p");
  if (a === p) return null;
  const hi = a > p ? "a" : "p", L = G.locs[li];
  return lon(G, L) && L.id === "reverse" ? other(hi) : hi;
}
function extreme(G, arr, li, sign) {
  if (!arr.length) return null;
  let best = [], bv = null;
  for (const c of arr) { const v = sign * power(G, c, li); if (bv === null || v > bv) { bv = v; best = [c]; } else if (v === bv) best.push(c); }
  return pick(G, best);
}
const strongest = (G, arr, li) => extreme(G, arr, li, 1);
const weakest = (G, arr, li) => extreme(G, arr, li, -1);

/* ---------- thao tác cơ bản ---------- */
function hurt(G, inst, li, amt) {
  if (amt <= 0) return 0;
  if (noReduce(G, inst, li)) { log(G, C[inst.id].n + " được bảo vệ"); ev(G, "blocked", { uid: inst.uid, w: "r" }); return 0; }
  if (G.mods && MD(G, inst.side).shield1 && !(G.km && G.km[inst.side])) { G.km = G.km || {}; G.km[inst.side] = 1; log(G, "Khiên Mây chặn lần giảm sức mạnh đầu tiên"); ev(G, "blocked", { uid: inst.uid, w: "r" }); return 0; }
  inst.bonus -= amt;
  return amt;
}
function drawRaw(G, side) { if (G.deck[side].length && G.hand[side].length < HAND_MAX) { G.hand[side].push(G.deck[side].pop()); return true; } return false; }
function destroy(G, inst, li) {
  const arr = G.locs[li].cards[inst.side], ix = arr.indexOf(inst);
  if (ix < 0 || !inst.rev) return false;
  if (noDestroy(G, inst, li)) { log(G, C[inst.id].n + " không thể bị tiêu huỷ"); ev(G, "blocked", { uid: inst.uid, w: "d" }); return false; }
  G.cnt.destPow += power(G, inst, li);
  arr.splice(ix, 1); G.cnt.dest++; G.cnt.destOwn[inst.own]++; ev(G, "destroy", { uid: inst.uid, side: inst.side, src: G.srcU || 0 });
  const d = C[inst.id];
  if (!d.tok) G.dead[inst.own].push(inst);
  log(G, d.n + " bị tiêu huỷ");
  const L = G.locs[li];
  if (lon(G, L) && L.id === "graveyard") draw(G, inst.own);
  if (!inst.sil && G.depth < 20) { const fn = DESTROYED[ab(inst)]; if (fn) { G.depth++; ev(G, "skill", { uid: inst.uid, t: "react" }); fn(G, inst, li, ix); } }
  inst.dt = G.turn; G.destLoc[inst.own][li] = 1;
  if (G.mods && MD(G, inst.own).mogo && !(G.mg && G.mg[inst.own] === G.turn)) { G.mg = G.mg || {}; G.mg[inst.own] = G.turn; draw(G, inst.own); log(G, "Mõ Gỗ: rút 1 thẻ"); }
  if (inst.ug_de && !inst.sil) { const ks = boardCards(G, inst.side).map(e => e[0]).filter(k => k !== inst); if (ks.length) { const k = pick(G, ks); k.bonus += 2; log(G, d.n + " (nâng cấp): +2 sức mạnh cho " + C[k.id].n); } }
  for (const [k] of boardCards(G, inst.own)) if (k !== inst && !k.sil) {
    if (is(G, k, "vukhix")) { k.wx = (k.wx || 0) + 1; k.bonus += 1 + Math.floor((k.wx - 1) / 3); }
    else if (is(G, k, "xachacdich")) horde(G, inst.own, 3);
  }
  for (const [k, kl] of boardCards(G, inst.own)) if (!k.sil) {
    if (is(G, k, "kysituduc") && !k.done) {
      k.prog = (k.prog || 0) + 1;
      if (k.prog >= 4 && G.dead[inst.own].length && space(G, kl, inst.own) && !profX(G, kl)) {
        k.done = true; const sv = G.srcU; G.srcU = k.uid;
        ev(G, "skill", { uid: k.uid, t: "react" }); log(G, C[k.id].n + " hoàn thành Nhiệm Vụ!");
        const t = pick(G, G.dead[inst.own]); if (t && revive(G, inst.own, t, kl)) t.bonus += 5;
        G.srcU = sv;
      }
    }
    else if (is(G, k, "toclua") && (C[ab(inst)].t === "rev" || !!REV[ab(inst)]) && REV[ab(inst)] && G.depth < 6) { G.depth++; ev(G, "skill", { uid: k.uid, t: "react" }); REV[ab(inst)](G, k, kl); }
  }
  const own = inst.side; // Thiên Dực bay ra thế chỗ
  if (!is(G, inst, "thienduc") && space(G, li, own)) for (const k of ["hand", "deck"]) {
    const a = G[k][own], ax = a.findIndex(c => is(G, c, "thienduc") && !c.sil);
    if (ax >= 0) { const an = a.splice(ax, 1)[0]; an.side = own; an.rev = true; an.sum = true; an.turn = G.turn; G.locs[li].cards[own].splice(Math.min(ix, G.locs[li].cards[own].length), 0, an); log(G, C.thienduc.n + " bay ra thế chỗ"); ev(G, "summon", { uid: an.uid }); break; }
  }
  return true;
}
function discard(G, side, inst) {
  if (!inst) return false;
  const h = G.hand[side], ix = h.indexOf(inst);
  if (ix < 0) return false;
  h.splice(ix, 1); G.cnt.disc[side]++; if (G.cnt.discLast[side] !== G.turn) { G.cnt.discLast[side] = G.turn; G.cnt.discTurns[side]++; } ev(G, "discard", { side, uid: inst.uid, id: inst.id, src: G.srcU || 0 });
  const d = C[inst.id];
  if (!d.tok) G.disc[side].push(inst);
  log(G, (side === "p" ? "Bạn" : "Máy") + " vứt bỏ " + d.n);
  if (G.mods && MD(G, side).dpow) { const ks = boardCards(G, side).map(e => e[0]); if (ks.length) { const k = pick(G, ks); k.bonus += MD(G, side).dpow; } }
  for (const [k] of boardCards(G, side)) if (!k.sil) {
    if (is(G, k, "trungchien")) { k.bonus += 1; k.free = G.turn + 1; }
    else if (is(G, k, "hackysi") && !k.used) { k.used = true; const b = mk(G, "hackiem", side); b.bp = pw0(inst); toHand(G, side, b, true); }
  }
  if (!inst.sil && G.depth < 20) { const fn = DISCARDED[ab(inst)]; if (fn) { G.depth++; fn(G, inst, side); } }
  return true;
}
/* thẻ được thêm vào chiến địa KHÔNG qua lượt đặt thường (triệu hồi, kéo/đặt từ tay-bộ bài, hồi sinh, bản sao):
   kích hoạt các kỹ năng "Sau khi BẤT KỲ thẻ nào được đặt tại đây" (Lực Bạt Sơn, Tơ Nữ) như khi đặt thường, mỗi thẻ một lần */
function afterAdd(G, inst, li) {
  if (!inst || !G.locs[li] || !G.locs[li].cards[inst.side].includes(inst)) return;
  for (const [sd, k] of SIDES.flatMap(x => shown(G, li, x).map(c => [x, c]))) if (k !== inst && !k.sil && locOf(G, k) === li && k.side === sd) {
    if (is(G, k, "tonu")) { const ol = otherLocs(G, li, sd); if (ol.length) moveCard(G, k, li, pick(G, ol)); }
    else if (is(G, k, "lucnu")) sw(G, k, li);
  }
}
function summon(G, side, id, li, pw, at) {
  if (!space(G, li, side) || profX(G, li) || stardust(G)) return null;
  const t = mk(G, id, side); t.rev = true; t.sum = true; t.turn = G.turn;
  if (pw != null) t.bp = pw;
  const arr = G.locs[li].cards[side];
  if (at != null && at <= arr.length) arr.splice(at, 0, t); else arr.push(t);
  log(G, C[id].n + " xuất hiện"); ev(G, "summon", { uid: t.uid, src: G.srcU || 0 });
  afterAdd(G, t, li);
  return t;
}
function revive(G, side, inst, li) {
  if (!inst || !space(G, li, side) || profX(G, li) || stardust(G)) return null;
  unpile(G, inst);
  inst.side = side; inst.bonus = 0; inst.bp = null; inst.sil = null; inst.act = false; inst.mv = false; inst.age = 0; inst.cm = 0;
  inst.rev = true; inst.sum = true; inst.rvv = true; inst.turn = G.turn; inst.played = false;
  G.locs[li].cards[side].push(inst);
  const L = G.locs[li];
  if (lon(G, L) && L.id === "shrine") inst.bonus += 2;
  log(G, C[inst.id].n + " được hồi sinh"); ev(G, "revive", { uid: inst.uid, src: G.srcU || 0 });
  afterAdd(G, inst, li);
  return inst;
}
function moveCard(G, inst, from, to) {
  if (from === to || !inst.rev) return false;
  const s = inst.side;
  if (!space(G, to, s)) return false;
  if (noMove(G, inst, from, to)) { log(G, C[inst.id].n + " không di chuyển được"); ev(G, "blocked", { uid: inst.uid, w: "m" }); return false; }
  const arr = G.locs[from].cards[s], ix = arr.indexOf(inst);
  if (ix < 0) return false;
  arr.splice(ix, 1); G.locs[to].cards[s].push(inst);
  if (G.mods && MD(G, s).mvpow) inst.bonus += MD(G, s).mvpow;
  G.cnt.moves[s]++; G.cnt.movedTurn[s]++; inst.mt = G.turn; G.lastMove[s] = { u: inst.uid, f: from }; ev(G, "move", { uid: inst.uid });
  const L = G.locs[to];
  if (lon(G, L) && L.id === "ferry") inst.bonus += 2;
  log(G, C[inst.id].n + " dời sang " + (L.rvl ? LOC[L.id].n : "vùng chưa lộ diện"));
  if (!inst.sil && G.depth < 20) { const fn = MOVED[ab(inst)]; if (fn) { G.depth++; ev(G, "skill", { uid: inst.uid, t: "react" }); fn(G, inst, from, to); } }
  for (const k of shown(G, to, other(s))) if (!k.sil && is(G, k, "trum")) hurt(G, inst, to, 2);
  for (const k of shown(G, to, s)) if (k !== inst && !k.sil && is(G, k, "lucthan") && k.ht !== G.turn && G.depth < 10) { k.ht = G.turn; const ol = otherLocs(G, to, s); if (ol.length) { G.depth++; moveCard(G, inst, to, pick(G, ol)); } break; }
  for (const [k, kl] of boardCards(G, s)) if (k !== inst && !k.sil && is(G, k, "cuocthu") && k.bt !== G.turn && kl !== to && G.depth < 10) { k.bt = G.turn; G.depth++; if (moveCard(G, k, kl, to)) k.bonus += 2; }
  for (const [k] of boardCards(G, other(s))) if (!k.sil && is(G, k, "thetdich") && k.sc !== G.turn) { k.sc = G.turn; const sl = locOf(G, inst); if (sl >= 0 && hurt(G, inst, sl, 2)) { k.bonus += 2; k.stl = true; } }
  for (const k of shown(G, to, s)) if (!inst.sil && is(G, inst, "nhenngaymoi") && k !== inst) { k.bonus += 1; break; }
  for (const sd of SIDES) for (const k of shown(G, to, sd)) if (k !== inst && !k.sil && is(G, k, "thosan")) k.bonus += 2;
  return true;
}
function transform(G, inst, id) { inst.id = id; inst.ab = null; inst.bonus = 0; inst.bp = null; inst.sil = null; inst.act = false; inst.age = 0; inst.turn = G.turn; log(G, "Biến thành " + C[id].n); ev(G, "morph", { uid: inst.uid }); }
function copyInto(G, inst, src) { inst.id = src.id; inst.ab = src.ab || null; inst.bonus = src.bonus; inst.bp = src.bp; inst.sil = src.sil; inst.act = false; inst.turn = G.turn; log(G, "Sao chép " + C[src.id].n); ev(G, "clone", { uid: inst.uid, from: src.uid, into: 1 }); ev(G, "morph", { uid: inst.uid }); }
function clone1(G, src, side) { const c = mk(G, src.id, side); c.bonus = src.bonus; c.bp = src.bp; c.cm = src.cm; c.ab = src.ab || null; c.eb = c.bonus; ev(G, "clone", { uid: c.uid, from: src.uid, side }); return c; }
function lowHigh(G, arr, sign) { // lá có năng lượng hiện tại thấp/cao nhất trên tay/bàn, hoà thì ngẫu nhiên
  if (!arr.length) return null;
  let best = [], bv = null;
  for (const c of arr) { const ec = G && G.hand ? cost(G, c, null) : C[c.id].c, v = sign * ec; if (bv === null || v > bv) { bv = v; best = [c]; } else if (v === bv) best.push(c); }
  return pick(G, best);
}

/* ---------- kỹ năng Lật ---------- */
function toHand(G, s, c, created) {
  if (G.hand[s].length >= HAND_MAX) return false;
  c.side = s; if (created) c.cr = true; G.hand[s].push(c); ev(G, "tohand", { side: s, uid: c.uid, src: G.srcU || 0 });
  for (const [k] of boardCards(G, s)) if (!k.sil && is(G, k, "nhasuutam")) k.bonus += 1;
  return true;
}
function addRand(G, s, pred) { const pool = COLLECT.filter(pred); if (pool.length) toHand(G, s, mk(G, pick(G, pool), s), true); }
function bounce(G, c, li) {
  const s = c.side; if (G.hand[s].length >= HAND_MAX) return false;
  const a = G.locs[li].cards[s], ix = a.indexOf(c); if (ix < 0) return false;
  a.splice(ix, 1); c.rev = false; c.played = false; c.sum = false; c.turn = 0; c.act = false; c.mv = false; c.wait = 0;
  log(G, C[c.id].n + " trở về tay"); const okh = toHand(G, s, c);
  if (okh && !c.sil && is(G, c, "phitieuhoi")) for (let k = 0; k < 4; k++) { const t = pick(G, G.hand[other(s)]); if (t) { t.bonus -= 1; c.bonus += 1; } }
  return okh;
}
function sw(G, c, li) {
  const o = other(c.side); if (!space(G, li, o) || profX(G, li)) return false;
  const a = G.locs[li].cards[c.side]; a.splice(a.indexOf(c), 1); c.side = o; G.locs[li].cards[o].push(c);
  log(G, C[c.id].n + " đổi phe"); ev(G, "morph", { uid: c.uid }); return true;
}
function place(G, c, li, s) { c.side = s; c.rev = true; c.sum = true; c.turn = G.turn; G.locs[li].cards[s].push(c); ev(G, "summon", { uid: c.uid, src: G.srcU || 0, deck: 1 }); afterAdd(G, c, li); }
function shove(G, c, from, to) { if (c.rev) return moveCard(G, c, from, to); const s = c.side; if (!space(G, to, s) || noMove(G, c, from, to)) return false; const a = G.locs[from].cards[s]; a.splice(a.indexOf(c), 1); G.locs[to].cards[s].push(c); return true; }
const pw0 = c => basePow(c) + c.bonus;
function lowPow(G, arr, charOnly) {
  let src = arr;
  if (charOnly) { const chars = arr.filter(c => !SKILLS.includes(c.id)); if (chars.length) src = chars; }
  if (!src.length) return null;
  let lo = Infinity;
  for (const c of src) lo = Math.min(lo, pw0(c));
  return pick(G, src.filter(c => pw0(c) === lo));
}
/* thẻ úp đến cuối ván: bên đang thắng lật trước, mỗi bên lật theo thứ tự đã đặt */
function hiddenOrder(G) {
  const f = priority(G), out = [];
  for (const s of [f, other(f)]) { const a = []; for (let l = 0; l < 3; l++) for (const c of G.locs[l].cards[s]) if (!c.rev && c.hid) a.push([c, l]); a.sort((x, y) => (x[0].ps || 0) - (y[0].ps || 0) || x[0].uid - y[0].uid); for (const [c, l] of a) out.push({ uid: c.uid, li: l, s }); }
  return out;
}
function revealHidden(G, uid) {
  for (let l = 0; l < 3; l++) for (const s of ["p", "a"]) { const c = G.locs[l].cards[s].find(x => x.uid === uid); if (c && !c.rev && c.hid) { c.hid = false; revealCard(G, c, l, s); return true; } }
  return false;
}
function endGame(G) {
  for (let r = 0, L; r < 4 && (L = hiddenOrder(G)).length; r++) for (const h of L) revealHidden(G, h.uid);
  for (const s of [G.first, other(G.first)]) {
    const o = other(s);
    const mi = G.deck[s].findIndex(c => is(G, c, "khitrang") && !c.sil);
    if (mi >= 0) { const ls = [0, 1, 2].filter(l => space(G, l, s) && !profX(G, l)); if (ls.length) { let b = ls[0]; for (const l of ls) if (locPower(G, l, s) < locPower(G, b, s)) b = l; place(G, G.deck[s].splice(mi, 1)[0], b, s); } }
    for (const [c, li] of boardCards(G, s)) {
      if (c.sil) continue;
      if (is(G, c, "huyetbatuoc")) { const t = pick(G, G.hand[s]); if (t) { const v = pw0(t); if (discard(G, s, t)) c.bonus += v; } }
      else if (is(G, c, "tinhquangnu") || is(G, c, "ketudao")) {
        const want = is(G, c, "ketudao") ? o : s; if (outcome(G) === want || noMove(G, c, li, li)) continue;
        for (const to of otherLocs(G, li, s)) { const a = G.locs[li].cards[s]; a.splice(a.indexOf(c), 1); G.locs[to].cards[s].push(c); if (outcome(G) === want) break; const b = G.locs[to].cards[s]; b.splice(b.indexOf(c), 1); G.locs[li].cards[s].push(c); }
      }
    }
  }
}
const ARCANA = ["giocothuat", "thoicothuat", "anhcothuat", "chopcothuat"];
const ARROWS = ["tenaxit", "tenthuong", "tenmoc", "tenthuphong"];
const STONES = ["datamtri", "dasucmanh", "dathuctai", "dalinhhon", "dakhonggian", "dathoigian"];
const EVO = { quaituong: "quaituongtienhoa", docnhan: "docnhantienhoa", cuongnhan: "cuongnhantienhoa", taymaynu: "taymaynutienhoa", chanthu: "chanthutienhoa", thachquai: "thachquaitienhoa", ongnu: "ongnutienhoa" };
const STONE6 = ["datam", "daluc", "dathuc", "dahon", "dakhong", "dathoi"];
function topPow(G, s) { let me = -1e9, th = -1e9; for (const [c, l] of boardCards(G, s)) me = Math.max(me, power(G, c, l)); for (const [c, l] of boardCards(G, other(s))) th = Math.max(th, power(G, c, l)); return me > -1e9 && me >= th; }
function surge(G, s, src) { const d = G.deck[s]; if (!d.length) return; const c = d[d.length - 1]; c.cm -= 1; c.bonus += 1; c.surge = true; ev(G, "surge", { side: s, uid: c.uid, src: src || G.srcU || 0 }); }
function newLoc(G, li) { const L = G.locs[li], used = G.locs.map(x => x.id), id = pick(G, Object.keys(LOC).filter(k => !used.includes(k) && k !== "limbo")); if (!id) return; const o = L.rvl ? L.id : "?"; L.id = id; log(G, "Chiến địa đổi thành " + LOC[id].n); revealLoc(G, li, o); }
function jumpTo(G, i, s, l) { unpile(G, i); const h = G.hand[s], hx = h.indexOf(i); if (hx >= 0) h.splice(hx, 1); place(G, i, l, s); }
const SKILLS = ["daodo", "giaohutmau", "giocothuat", "thoicothuat", "anhcothuat", "chopcothuat", "dichcuongcot", "honxuatkhieu", "hopamdiectai", "cunemthantoc", "cuvocanhhungvi", "giacquannhen", "daonghich", "cuduto", "luahacdiem", "hienthanvangioi", "vuongtrieutailai", "bienhinhthuat", "daibay", "mintuxa", "gangchandong", "nghithuctrieuhoii", "nghithuctrieuhoiii", "nghithuctrieuhoiiii"];
const INCANT = ["hienthanvangioi", "vuongtrieutailai", "bienhinhthuat"], TOOLS = ["daibay", "mintuxa", "gangchandong"], SHOTN = ["Tâm", "Lực", "Thực", "Hồn", "Không", "Thời"];
const MOVERS = ["dahanh", "huyenco", "nhenhauthe", "thuyngannu"];
const GUARD = ["phatuong", "lucsatnu", "mocnhan", "xucgiacnu", "lamconu", "chonphao", "tinhchua"];
function horde(G, s, n) {
  if (n <= 0) return; const f = boardCards(G, s).find(([c]) => c.id === "bayxac");
  if (f) f[0].bonus += n; else { const ls = [0, 1, 2].filter(l => space(G, l, s) && !profX(G, l)); if (ls.length) summon(G, s, "bayxac", pick(G, ls), n); }
  log(G, "Bầy Xác +" + n);
}
function hordePow(G, s) { const f = boardCards(G, s).find(([c]) => c.id === "bayxac"); return f ? power(G, f[0], f[1]) : 0; }
function fromHandDeck(G, s, pred) { for (const k of ["hand", "deck"]) { const a = G[k][s], ix = a.findIndex(pred); if (ix >= 0) return a.splice(ix, 1)[0]; } return null; }
function regenX(G, i) { const ls = [0, 1, 2].filter(l => space(G, l, i.own) && !profX(G, l)); if (!ls.length) return; unpile(G, i); i.side = i.own; i.rev = true; i.sum = true; i.turn = G.turn; i.played = false; G.locs[pick(G, ls)].cards[i.own].push(i); G.nextBonus[i.own] += 1; ev(G, "revive", { uid: i.uid }); }
function marrow(G, i) { const o = other(i.own); for (let k = 0; k < 7; k++) { const e = pick(G, boardCards(G, o)); if (e) hurt(G, e[0], e[1], 1); } }
function iuAt(G, s) { return boardCards(G, s).find(([c]) => c.id === "cohoangvocuc"); }
function khonshu(G, i, li, v) { const t = pick(G, G.disc[i.side].filter(c => !C[c.id].tok && c !== i)), ol = otherLocs(G, li, i.side).filter(l => !profX(G, l)); if (t && ol.length && revive(G, i.side, t, pick(G, ol))) { t.bp = v; t.bonus = 0; } }
function hurtN(G, arr, n, amt) { const pool = arr.slice(); for (let k = 0; k < n && pool.length; k++) { const e = pool.splice(Math.floor(rnd(G) * pool.length), 1)[0]; hurt(G, e[0], e[1], amt); } }
const REV = {
  chutruongnu(G, i) { G.nico[i.side] = i.uid; },
  kerinh(G, i) { for (let k = 0; k < 2; k++) { const c = mk(G, pick(G, TOOLS), i.side); if (G.cnt.movedPrev) c.cm = -C[c.id].c; toHand(G, i.side, c, true); } },
  luahacdiem(G, i, li) { const t = pick(G, shown(G, li, other(i.side))); if (t) hurt(G, t, li, 3); },
  hienthanvangioi(G, i, li) { newLoc(G, li); for (const [k] of boardCards(G, i.side)) if (!k.sil && is(G, k, "phapsugia")) k.bonus += 1; },
  vuongtrieutailai(G, i, li) { const s = i.side, t = lowPow(G, shown(G, li, s).filter(c => c !== i)); if (!t) return; const a = G.locs[li].cards[s]; a.splice(a.indexOf(t), 1); t.rev = false; t.played = false; t.sum = false; t.turn = 0; G.deck[s].push(t); G.deck[s] = shuffle(G, G.deck[s]); G.nextBonus[s] += 2; },
  bienhinhthuat(G, i, li) { const t = lowPow(G, shown(G, li, i.side).filter(c => c !== i)); if (!t) return; const pool = COLLECT.filter(id => C[id].c === C[t.id].c + 1); if (pool.length) transform(G, t, pick(G, pool)); },
  daibay(G, i, li) { const t = strongest(G, shown(G, li, i.side).filter(c => c !== i), li); if (!t) return; t.bonus += 1; if (li < 2) moveCard(G, t, li, li + 1); },
  mintuxa(G, i, li) { const e = shown(G, li, other(i.side)).map(c => [c, power(G, c, li)]).sort((a, b) => b[1] - a[1]).slice(0, 2); for (const [c] of e) hurt(G, c, li, 2); },
  gangchandong(G, i, li) { const t = strongest(G, shown(G, li, i.side).filter(c => c !== i), li); if (t) t.bonus += 2; G.nextBonus[i.side] += 1; },
  nghithuctrieuhoii(G, i) { const s = i.side, dd = G.dead[s], dm = dorm(G, s); let t = null; for (const c of dd) if (!t || pw0(c) > pw0(t)) t = c; if (!t || !dm) { toHand(G, s, mk(G, "nghithuctrieuhoii", s)); return; } dd.splice(dd.indexOf(t), 1); dm.bonus += Math.max(0, pw0(t)); toHand(G, s, mk(G, "nghithuctrieuhoiii", s)); },
  nghithuctrieuhoiii(G, i, li) { const dm = dorm(G, i.side); let n = 0; for (const sd of SIDES) for (const c of shown(G, li, sd)) if (c !== i) { c.bonus -= 1; n++; } if (dm) dm.bonus += n; toHand(G, i.side, mk(G, "nghithuctrieuhoiiii", i.side)); },
  nghithuctrieuhoiiii(G, i, li) { const s = i.side, cs = shown(G, li, s).filter(c => c !== i && !noDestroy(G, c, li)); if (cs.length < 2) { toHand(G, s, mk(G, "nghithuctrieuhoiiii", s)); return; } for (const c of shuffle(G, cs).slice(0, 2)) destroy(G, c, li); const dm = fromHandDeck(G, s, c => c.id === "hacdiemchua"); if (dm) { if (space(G, li, s)) place(G, dm, li, s); else G.hand[s].push(dm); } },
  matthethientuyen(G, i) { const s = i.side, e = boardCards(G, s).filter(([c]) => c !== i), dk = G.deck[s]; if (!e.length || !dk.length) return; let lo = e[0]; for (const x of e) if (power(G, x[0], x[1]) < power(G, lo[0], lo[1])) lo = x; const kx = Math.floor(rnd(G) * dk.length), nw = dk[kx], a = G.locs[lo[1]].cards[s]; dk[kx] = lo[0]; lo[0].rev = false; lo[0].played = false; lo[0].turn = 0; a[a.indexOf(lo[0])] = nw; nw.side = s; nw.rev = true; nw.sum = true; nw.turn = G.turn; ev(G, "summon", { uid: nw.uid }); },
  quyensuthaphoan(G, i) { const s = i.side; for (const c of G.hand[s].concat(G.deck[s], boardCards(G, s).map(e => e[0]))) if (c.id === "thaphoan") { c.id = "thaphoankhaimo"; if (c.rev) ev(G, "morph", { uid: c.uid }); } },
  thaphoan(G, i, li) { const t = pick(G, shown(G, li, i.side).filter(c => c !== i)); if (t) t.bonus += 1; },
  thuanung(G, i, li) { const ol = otherLocs(G, li, i.side); if (ol.length) summon(G, i.side, "khientuong", pick(G, ol)); },
  cuthudotham(G, i, li) { const t = pick(G, shown(G, li, other(i.side))); if (!t) return; const v = Math.max(0, power(G, t, li)); if (v && hurt(G, t, li, v)) { i.bonus += v; i.stl = true; } },
  bavuongmienvien(G, i) { const s = i.side, sh = G.shots[s]; G.shots[s] = []; for (const k of sh) { const cur = locOf(G, i); if (cur < 0) break; log(G, "Bắn Phát Bắn " + SHOTN[k]); if (k === 0) draw(G, s); else if (k === 1) i.bonus += 3; else if (k === 2) { const t = lowHigh(G, shown(G, cur, s).filter(c => c !== i), -1); if (t && space(G, cur, s) && !profX(G, cur)) place(G, clone1(G, t, s), cur, s); } else if (k === 3) { const t = weakest(G, shown(G, cur, other(s)), cur); if (t) destroy(G, t, cur); } else if (k === 4) { i.bonus += 1; i.free = G.turn + 1; } else for (const c of G.hand[s]) c.cm -= 1; } },
  phapsudaomong(G, i) { toHand(G, i.side, mk(G, "daidoan", i.side), true); },
  daidoan(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) { const t = pick(G, shown(G, l, i.side)); if (t) t.bonus += 5; } },
  sautham(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) { const a = ab(c); if (!c.sil && C[a].t === "rev" && REV[a] && a !== "sautham" && G.depth < 6) { G.depth++; REV[a](G, c, li); } if (locOf(G, c) === li) destroy(G, c, li); } },
  yeuhau(G, i) { const s = i.side; for (const c of G.disc[s].concat(G.dead[s])) { if (G.hand[s].length >= HAND_MAX) break; unpile(G, c); c.rev = false; c.played = false; c.sil = null; c.bonus = c.bonus + 3; toHand(G, s, c); } },
  thuyhau(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) { const a = G.locs[l].cards[i.side]; if (a.length === 1 && a[0].rev) a[0].bonus += 5; } },
  acmong(G, i) { for (const c of G.hand[i.side]) { const pool = COLLECT.filter(id => C[id].c === C[c.id].c && C[id].t !== "start" && id !== c.id); if (pool.length) c.ab = pick(G, pool); } },
  nhencogiap(G, i) { toHand(G, i.side, mk(G, "cogiapnhen", i.side), true); },
  cogiapnhen(G, i, li) { const t = pick(G, shown(G, li, i.side).filter(c => c !== i)); if (!t) return; t.bonus += pw0(i); t.free = G.turn + 1; const a = G.locs[li].cards[i.side]; a.splice(a.indexOf(i), 1); if (is(G, t, "nhencogiap")) G.nextBonus[i.side] += 1; },
  thandong(G, i, li) { const a = G.locs[li].cards[i.side], ix = a.indexOf(i); if (ix < 2) return; const f = a[ix - 2]; if (!f || !f.rev || f.sil || C[ab(f)].t === "none") return; i.ab = ab(f); ev(G, "abcopy", { uid: i.uid, from: f.uid }); ev(G, "morph", { uid: i.uid }); },
  tamkiemmienvien(G, i) { const q = i.dr === G.turn; for (const c of G.hand[i.side]) if (q || C[c.id].c >= 5) c.cm -= 1; },
  vuathoigian(G, i, li) { const pool = COLLECT.filter(id => ["KD", "C1", "TB", "S1", "S2"].includes(C[id].h) && C[id].t === "rev" && REV[id]); for (let k = 0; k < 3; k++) { const id = pick(G, pool); if (G.depth < 8 && locOf(G, i) >= 0) { G.depth++; log(G, "Dùng kỹ năng của " + C[id].n); REV[id](G, i, locOf(G, i)); } } },
  hongve(G, i, li) { const t = weakest(G, shown(G, li, other(i.side)), li); if (t) { hurt(G, t, li, 2); t.sil = true; } },
  cuongdomienvien(G, i, li) { const n = shown(G, li, other(i.side)).length; i.bonus += i.dr === G.turn ? n : -n; },
  soidomienvien(G, i) { if (i.dr === G.turn) { for (const c of G.hand[i.side]) c.bonus += 1; } else i.bonus += G.hand[i.side].length; },
  haplucchiare(G, i) { const t = lowHigh(G, G.hand[other(i.side)].filter(c => !c.sil && C[ab(c)].t !== "none"), 1); if (t) { i.ab = ab(t); t.sil = true; ev(G, "abcopy", { uid: i.uid, from: t.uid, st: 1 }); ev(G, "morph", { uid: i.uid }); } },
  trinu(G, i, li) { const set = new Set(); for (const s of SIDES) for (const c of shown(G, li, s)) if (c !== i) set.add(power(G, c, li)); i.bonus += 2 * set.size; },
  hoavatnu(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) { const pool = COLLECT.filter(id => C[id].c === C[c.id].c + 1); if (pool.length) transform(G, c, pick(G, pool)); } },
  vouyamdia(G, i) { const d = G.deck[i.side]; for (let k = 0; k < 3; k++) d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "quy", i.side)); },
  longbattu(G, i) { const f = find(G, G.prevPlay[i.side]); if (f) f.inst.bonus += 2 * G.cnt.two[i.side]; },
  ngansat(G, i) { const d = G.deck[other(i.side)]; if (d.length) { d[d.length - 1].bonus -= 2; i.bonus += 2; } },
  nhenbongdem(G, i, li) { const d = G.deck[i.side]; if (!d.length) return; const c = d[d.length - 1]; c.bp = 8; c.bonus = 0; let tot = 0; for (const [k] of boardCards(G, i.side)) if (k !== i) tot += C[k.id].c; if (tot === 8 && space(G, li, i.side) && !profX(G, li)) { d.pop(); place(G, c, li, i.side); } },
  tinhchuathaiduong(G, i) { G.nextBonus[i.side] += G.cnt.unspentTurns[i.side]; },
  diennu(G, i) { surge(G, i.side, i.uid); },
  virutcosinh(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) { c.ab = "virutcosinh"; ev(G, "morph", { uid: c.uid }); } toHand(G, i.side, mk(G, "virutcosinh", i.side), true); },
  conhan(G, i) { toHand(G, i.side, mk(G, "daodo", i.side), true); },
  daodo(G, i, li) { const cs = shown(G, li, i.side).filter(c => c !== i), src = pick(G, cs.filter(c => !c.sil && C[ab(c)].t === "on")); if (src) for (const c of cs) if (c !== src) { c.ab = ab(src); ev(G, "abcopy", { uid: c.uid, from: src.uid }); } },
  docdich(G, i, li) { let n = 0; for (const c of shown(G, li, i.side)) if (c !== i && bounce(G, c, li)) n++; i.bonus += 2 * n; },
  huyetmenu(G, i, li) { const n = new Set(boardCards(G, i.side).map(([c]) => C[c.id].c)).size; for (let k = 0; k < n; k++) { const t = pick(G, shown(G, li, other(i.side))); if (t && hurt(G, t, li, 1)) i.bonus += 1; } },
  giaohutmau(G, i) { const f = boardCards(G, i.side).find(([c]) => c.id === "huyetsatvuong"), t = pick(G, G.hand[other(i.side)]); if (f && t) { t.bonus -= 2; f[0].bonus += 2; } },
  docnutrang(G, i, li) { summon(G, other(i.side), "nuhondoc", li); },
  phuthuytre(G, i) { if (G.cnt.allSpent[i.side] >= G.turn - 1) G.maxE[i.side] += 2; },
  bayxacnuotsao(G, i) {
    for (const [c] of boardCards(G, i.side)) if (c !== i && c.zg) { c.zg = false; copyInto(G, c, i); }
    for (const k of ["deck", "hand"]) for (const c of G[k][i.side]) if (c.zg) { c.id = i.id; c.ab = i.ab || null; c.bonus = i.bonus; c.bp = i.bp; c.zg = false; }
  },
  xacdeo(G, i) { horde(G, i.side, 2); },
  xachacdich(G, i, li) { const t = shown(G, li, i.side).find(c => c !== i); if (t) destroy(G, t, li); },
  xactantinh(G, i) { horde(G, i.side, 3); },
  vuarutkiem(G, i, li) { summon(G, i.side, "thanhkiem", li); },
  huyettinhquyen(G, i) { const d = G.deck[other(i.side)]; if (!d.length) return; let n = 0; for (const l of [0, 1, 2]) if (lead(G, l) === i.side) n++; d[d.length - 1].bonus -= n; i.bonus += n; },
  datam(G, i) { const d = G.deck[i.side]; for (let k = 0; k < 2; k++) { const ix = d.findIndex(c => STONE6.includes(c.id)); if (ix >= 0 && G.hand[i.side].length < HAND_MAX) G.hand[i.side].push(d.splice(ix, 1)[0]); } },
  dathuc(G, i, li) { newLoc(G, li); },
  dahon(G, i) { draw(G, i.side); },
  dakhong(G, i) { const d = G.deck[i.side], ix = d.findIndex(c => c.id === "bavuongtim"); if (ix >= 0 && G.hand[i.side].length < HAND_MAX) G.hand[i.side].push(d.splice(ix, 1)[0]); },
  dathoi(G, i) { draw(G, i.side); for (const k of ["deck", "hand"]) for (const c of G[k][i.side]) if (c.id === "bavuongtim") c.cm -= 1; },
  dichcuongcot(G, i, li) { const d = G.dead[i.side]; if (!d.length) return; let b = d[0]; for (const c of d) if (pw0(c) > pw0(b)) b = c; const v = pw0(b); if (revive(G, i.side, b, li)) b.bonus += Math.max(0, v) + (v - basePow(b)); },
  hacdichbinh(G, i) { for (const c of G.deck[i.side]) { c.bp = 3; c.bonus = 0; } },
  maynuotthoigian(G, i, li) { for (const c of G.locs[li].cards[other(i.side)]) if (!c.rev) c.sil = true; },
  nghichtuvuong(G, i, li) { for (const l of [0, 1, 2]) if (l !== li && space(G, l, i.side) && !profX(G, l)) { const h = G.hand[i.side], c = pick(G, h.filter(x => C[x.id].c === 3 || C[x.id].c === 4)); if (c) { h.splice(h.indexOf(c), 1); place(G, c, l, i.side); } } },
  bachdich(G, i) { const d = G.deck[i.side]; if (d.length) { const c = d[d.length - 1]; c.cm = -C[c.id].c; c.bp = 0; c.bonus = 0; } },
  chienthan(G, i) { const sum = s => G.deck[s].slice(-3).reduce((a, c) => a + pw0(c), 0); if (sum(i.side) > sum(other(i.side))) i.bonus += 6; },
  cucquang(G, i) { for (const t of ["rev", "on", "act", "end"]) for (const l of [0, 1, 2]) { const c = pick(G, shown(G, l, i.side).filter(x => x !== i && (t === "act" ? !!ACT[ab(x)] : C[ab(x)].t === t))); if (c) c.bonus += 2; } },
  namtuocmatna(G, i, li) { const d = G.deck[other(i.side)], t = lowHigh(G, d, -1); if (t && space(G, li, i.side) && !profX(G, li)) { d.splice(d.indexOf(t), 1); place(G, t, li, i.side); } },
  phaodaimay(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) { const n = mk(G, c.id, i.side); n.cm = 2 - C[c.id].c; n.bp = 3; toHand(G, i.side, n, true); } },
  thiemnu(G, i) { const f = find(G, G.prevPlay[i.side]); if (!f || f.inst.side !== i.side) return; const old = f.inst, d = G.deck[i.side], pool = d.filter(c => C[c.id].c >= C[old.id].c); const n = pick(G, pool); if (!n) return; const a = G.locs[f.li].cards[i.side]; d[d.indexOf(n)] = old; old.rev = false; old.played = false; a[a.indexOf(old)] = n; n.side = i.side; n.rev = true; n.sum = true; n.turn = G.turn; ev(G, "morph", { uid: n.uid }); },
  tammanu(G, i) { for (const c of G.deck[other(i.side)]) { c.bonus -= 1; i.bonus += 1; } },
  matocvutru(G, i, li) { G.locs[li].cards[other(i.side)].slice(0, 2).forEach(c => { if (c.rev) c.sil = true; }); },
  tuthanmienvien(G, i) { for (const c of G.dead[i.side].slice()) { const ls = [0, 1, 2].filter(l => space(G, l, i.side) && !profX(G, l)); if (ls.length) revive(G, i.side, c, pick(G, ls)); } },
  nguyetlong(G, i) { for (const s of SIDES) for (const c of G.hand[s]) if (C[c.id].c % 2 === 0) { c.bonus -= 1; i.bonus += 1; } },
  linhduoc(G, i, li) { const t = pick(G, G.dead[i.side].filter(c => c.dt === G.turn - 1)); if (t) revive(G, i.side, t, li); },
  songsinhtamlinh(G, i) { const t = pick(G, G.deck[i.side]); if (!t) return; const n = mk(G, t.id, i.side); n.cm = 3 - C[t.id].c; n.bp = 4; toHand(G, i.side, n, true); },
  kesanga(G, i, li) { G.maxE[i.side] = power(G, i, li) - G.turn; },
  culongco(G, i, li) { const t = pick(G, G.locs[li].cards[other(i.side)].slice(0, 2).filter(c => c.rev)); if (t) i.bonus += Math.max(0, power(G, t, li)); },
  huyetdichhangxom(G, i, li) { if (li >= 2) return; let n = 0; for (const c of shown(G, li, i.side)) if (c !== i && moveCard(G, c, li, li + 1)) n++; i.bonus += 2 * n; },
  mauhau(G, i) { const f = find(G, G.prevPlay[i.side]); if (f) toHand(G, i.side, mk(G, f.inst.id, i.side), true); },
  kenuotsao(G, i, li) { if (lead(G, li) !== i.side || G.locs[li].cards[i.side].length !== 1) return; for (const l of [0, 1, 2]) if (l !== li) { const L = G.locs[l], o = L.rvl ? L.id : "?"; L.cards.p = []; L.cards.a = []; L.gone = true; L.rvl = true; ev(G, "loc", { li: l, old: o, gone: 1 }); } log(G, "Hai chiến địa còn lại bị huỷ diệt"); },
  vuongbathu(G, i) { i.bonus += boardCards(G, i.side).filter(([c]) => c !== i && c.bonus > 0).length; },
  hongnutinhquai(G, i) { for (let k = 0; k < 3; k++) { const t = pick(G, G.hand[i.side]); if (t) t.bonus += 2; } },
  cohoangvocuc(G, i) { const pool = STONES.slice(); for (let k = 0; k < 2; k++) toHand(G, i.side, mk(G, pool.splice(Math.floor(rnd(G) * pool.length), 1)[0], i.side), true); },
  thietaiquoc(G, i) { const n = mk(G, pick(G, COLLECT.filter(id => C[id].c >= 4)), i.side); if (toHand(G, i.side, n, true)) i.ip = { t: G.turn + 1, u: n.uid }; },
  nuloimienvien(G, i) {
    const all = []; for (const s of SIDES) for (const e of boardCards(G, s)) if (e[0] !== i) all.push(e);
    const chosen = [];
    for (let k = 0; k < 4 && all.length; k++) { const e = all.splice(Math.floor(rnd(G) * all.length), 1)[0]; chosen.push(e); if (e[0].side === i.side) e[0].bonus += 1; else hurt(G, e[0], e[1], 1); }
    if (i.dr === G.turn) { for (const e of chosen) if (locOf(G, e[0]) >= 0) { if (e[0].side === i.side) e[0].bonus += 1; else hurt(G, e[0], locOf(G, e[0]), 1); } }
  },
  phonglinhnu(G, i) { const pool = boardCards(G, i.side).filter(([c]) => c !== i); if (pool.length) for (let k = 0; k < G.hand[i.side].length; k++) pick(G, pool)[0].bonus += 1; },
  thukydungcam(G, i) { for (const k of [1, 2, 3]) { const t = pick(G, boardCards(G, i.side).filter(([c]) => C[c.id].c === k)); if (t) t[0].bonus += 2; } },
  nuthantien(G, i) { for (let k = 0; k < 2; k++) toHand(G, i.side, mk(G, pick(G, ARROWS), i.side), true); },
  nguyetthan(G, i, li) { khonshu(G, i, li, 5); },
  nguyetthanbannguyet(G, i, li) { khonshu(G, i, li, 8); },
  nguyetthantrangtron(G, i, li) { khonshu(G, i, li, 12); },
  cuongnhanxam(G) { for (const s of SIDES) { const n = new Set(boardCards(G, s).map(([c]) => C[c.id].c)).size, t = pick(G, G.hand[s]); if (t) t.cm -= n; } },
  tieuthu(G, i) { const d = G.deck[i.side]; if (!d.length) { i.bonus += 4; return; } const c = d.pop(); if (C[c.id].c + c.cm >= 4) G.nextBonus[i.side] += 2; else i.bonus += 4; },
  nuhongtam(G, i) { hurtN(G, boardCards(G, other(i.side)), 1 + G.unspent[i.side], 2); },
  kiemquyen(G, i, li) { const ol = otherLocs(G, li, i.side); if (ol.length) summon(G, i.side, "kiemphuchy", pick(G, ol)); },
  bangca(G, i, li) { for (const s of SIDES) summon(G, s, "khoibang", li); },
  vuatienhac(G, i, li) { const d = G.deck[i.side], t = pick(G, d.filter(c => C[c.id].c <= 3)); if (!t || !space(G, li, i.side) || profX(G, li)) return; d.splice(d.indexOf(t), 1); t.side = i.side; t.hid = true; t.turn = G.turn; G.locs[li].cards[i.side].push(t); },
  nhannhenquai(G, i, li) { const f = find(G, G.prevPlay[i.side]); if (!f || f.inst.side !== i.side || f.inst === i) return; const v = power(G, f.inst, f.li), a = G.locs[f.li].cards[i.side]; a.splice(a.indexOf(f.inst), 1); i.bonus += v; i.bonus += power(G, i, li); },
  tenaxit(G, i, li) { sw(G, i, li); },
  tenthuong(G, i) { i.w2 = { t: G.turn + 1, a: 4 }; },
  tenmoc(G, i, li) { G.grapple[i.side] = li + 1; },
  chopcothuat(G, i) { G.nextBonus[i.side] += 4; },
  anhcothuat(G, i, li) { const cs = shown(G, li, i.side).filter(c => c !== i), b = strongest(G, cs, li); if (b) for (const c of cs) if (c !== b) copyInto(G, c, b); },
  thoicothuat(G, i) { const f = boardCards(G, i.side).find(([c]) => c.id === "conhansu"); if (f) { f[0].bonus += 3; return; } if (G.hand[i.side].length >= HAND_MAX && !G.hand[i.side].some(x => x.id === "conhansu")) return; const c = fromHandDeck(G, i.side, x => x.id === "conhansu"); if (c) { c.bonus += 3; toHand(G, i.side, c); } },
  giocothuat(G, i, li) { const t = pick(G, shown(G, li, other(i.side))); if (t) { hurt(G, t, li, 5); if (li < 2) moveCard(G, t, li, li + 1); } },
  dasucmanh(G, i) { const f = iuAt(G, i.side); if (f) f[0].bonus += power(G, f[0], f[1]); },
  dathuctai(G, i, li) { const f = iuAt(G, i.side); summon(G, i.side, "maybaycon", li, f ? power(G, f[0], f[1]) : 2); },
  dalinhhon(G, i) { for (const l of [0, 1, 2]) if (G.locs[l].cards[i.side].length >= cap(G, l)) { const t = pick(G, shown(G, l, i.side)); if (t) t.bonus += 3; } },
  dakhonggian(G, i, li) { const f = iuAt(G, i.side), t = weakest(G, shown(G, li, other(i.side)), li); if (f && t && f[1] !== li) moveCard(G, t, li, f[1]); },
  dathoigian(G, i, li) { const h = G.hand[i.side], c = pick(G, h); if (c && space(G, li, i.side) && !profX(G, li)) { h.splice(h.indexOf(c), 1); place(G, c, li, i.side); } },
  chanthutienhoa(G, i) { const c = G.hand[i.side][0]; if (c) c.cm -= 1; },
  thachquaitienhoa(G, i, li) { hurtN(G, shown(G, li, other(i.side)).map(c => [c, li]), 3, 1); },
  ongnutienhoa(G, i, li) { hurtN(G, shown(G, li, other(i.side)).map(c => [c, li]), 1, 1); },
  trungvuong(G, i) { for (const [c, l] of boardCards(G, i.side)) if (c !== i && power(G, c, l) < 0 && !sw(G, c, l)) destroy(G, c, l); },
  honxuatkhieu(G, i, li) { const t = pick(G, G.hand[i.side].filter(c => !c.sil && C[ab(c)].t === "rev" && REV[ab(c)] && !SKILLS.includes(c.id))); if (t && G.depth < 6) { G.depth++; log(G, "Chép kỹ năng của " + C[t.id].n); REV[ab(t)](G, i, li); } },
  madienloi(G, i) { const d = G.deck[i.side]; d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "riubao", i.side)); },
  riubao(G, i) { for (const [c, l] of boardCards(G, i.side)) if (c.id === "madienloi") c.bonus += power(G, c, l); },
  khoithit(G, i) { const d = G.deck[i.side]; let g = 0; while (g < 13 && d.length) { const c = d.pop(), v = pw0(c); i.bonus += v; g += v; if (v <= 0 && !d.some(x => pw0(x) > 0)) break; } },
  dannguoi(G, i, li) { const o = other(i.side), t = strongest(G, shown(G, li, o), li); if (!t) return; const ol = otherLocs(G, li, o); if (!(ol.length && moveCard(G, t, li, pick(G, ol))) && destroy(G, t, li)) summon(G, o, "da", li); },
  tackehoa(G, i, li) { const t = pick(G, shown(G, li, i.side).filter(c => c !== i && c.turn === G.turn && !c.sil && C[ab(c)].t !== "none")); if (!t) return; i.ab = ab(t); ev(G, "abcopy", { uid: i.uid, from: t.uid }); ev(G, "morph", { uid: i.uid }); log(G, C[i.id].n + " chép kỹ năng của " + C[t.id].n); if (C[i.ab].t === "rev" && REV[i.ab] && G.depth < 6) { G.depth++; REV[i.ab](G, i, li); } },
  quadao(G, i) { const h = G.hand[i.side]; if (h.length < 2) return; discard(G, i.side, pick(G, h)); discard(G, i.side, pick(G, h)); G.maxE[i.side] += 1; },
  monghoang(G, i) { toHand(G, i.side, mk(G, "manhkiemquy", i.side), true); },
  hopamdiectai(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => !c.sil && C[c.id].c <= 3)); if (t) t.sil = true; },
  battymienvien(G, i) { const h = G.hand[i.side]; if (!h.length) return; const c = h.shift(); c.bonus += 3; G.deck[i.side].push(c); const n = mk(G, pick(G, COLLECT), i.side); n.bonus += 3; toHand(G, i.side, n, true); },
  longchu(G, i, li) { const h = G.hand[i.side], c = pick(G, h); if (c && space(G, li, i.side) && !profX(G, li)) { h.splice(h.indexOf(c), 1); place(G, c, li, i.side); } },
  cunemthantoc(G, i, li) { const t = strongest(G, shown(G, li, i.side).filter(c => c !== i), li); if (!t) return; const v = power(G, t, li); if (destroy(G, t, li) && v > 0) { const e = pick(G, shown(G, li, other(i.side))); if (e) hurt(G, e, li, v); } },
  hoasu(G, i, li) { const t = pick(G, G.disc[i.side].concat(G.dead[i.side]).filter(c => C[c.id].c === 3)); if (t) revive(G, i.side, t, li); },
  giacdausi(G, i, li) { const o = other(i.side), d = G.deck[o]; if (!d.length || !space(G, li, o) || profX(G, li)) return; const c = d.splice(Math.floor(rnd(G) * d.length), 1)[0]; place(G, c, li, o); if (power(G, c, li) < power(G, i, li)) destroy(G, c, li); },
  kychu(G, i, li) { if (li === 1) return; const t = pick(G, shown(G, li, i.side).filter(c => c !== i && !c.sil && C[ab(c)].t === "rev" && REV[ab(c)])); if (t && moveCard(G, t, li, 1) && G.depth < 6) { G.depth++; REV[ab(t)](G, t, 1); } },
  niemluctu(G, i, li) { const L = G.locs[li]; L.hell = L.hell || { p: 0, a: 0 }; L.hell[i.side] = G.turn + 1; },
  khisatthu(G, i) { i.bonus += 2 * Math.max(0, G.cnt.playedNow[i.side] - 1); },
  thuynhan(G) { for (const s of SIDES) { const d = G.deck[s]; if (d.length) { const c = d[d.length - 1]; c.cm = 1 - C[c.id].c; } } },
  thietthieunien(G, i, li) { const d = G.deck[i.side]; if (!d.length) return; const a = ab(d[d.length - 1]); if (C[a].t === "none" || a === "thietthieunien") return; i.ab = a; ev(G, "abcopy", { uid: i.uid, from: d[d.length - 1].uid, deck: 1 }); ev(G, "morph", { uid: i.uid }); log(G, C[i.id].n + " chép kỹ năng của " + C[a].n); if (C[a].t === "rev" && REV[a] && G.depth < 6) { G.depth++; REV[a](G, i, li); } },
  bangvuong(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) if (c !== i && hurt(G, c, li, 1)) i.bonus += 1; },
  quandoanmotnguoi(G, i, li) { const id = G.locs[li].id; for (const l of [0, 1, 2]) if (l !== li) { const o = G.locs[l].rvl ? G.locs[l].id : "?"; G.locs[l].id = id; G.locs[l].rvl = true; ev(G, "loc", { li: l, old: o }); } log(G, "Mọi chiến địa thành " + LOC[id].n); },
  trathan(G, i) { const s = i.side; G.deck[s] = shuffle(G, G.start[other(s)]).map(id => { const c = mk(G, id, s); c.cm = -1; return c; }); },
  cuvocanhhungvi(G, i) { const c = G.hand[i.side][0]; if (!c) return; c.bonus += 3; if (C[c.id].c >= 5) c.cm -= 1; },
  thieutachienthang(G, i) { for (let k = 0; k < 2; k++) toHand(G, i.side, mk(G, pick(G, GUARD), i.side), true); },
  chuotchuivuong(G, i) { const d = G.deck[i.side]; if (!d.length) return; const c = d.pop(), v = C[c.id].c + c.cm; for (let k = 0; k < 2; k++) { const r = mk(G, "da", i.side); r.bp = v; toHand(G, i.side, r, true); } },
  mauthoikhong(G, i) { const c = G.hand[i.side][0]; if (!c) return; const n = clone1(G, c, i.side); n.cm -= 1; n.bonus += 2; toHand(G, i.side, n, true); },
  thantho(G, i) { for (const c of G.deck[i.side]) { if (rnd(G) < 0.5 && C[c.id].c + c.cm > 0) c.cm -= 1; else c.bonus += 2; } },
  phuonghoa(G, i, li) { const t = pick(G, G.dead[i.side]); if (!t || !revive(G, i.side, t, li)) return; t.bonus += pw0(i); t.fly = true; const a = G.locs[li].cards[i.side], ix = a.indexOf(i); if (ix >= 0) a.splice(ix, 1); },
  tienbui(G, i) { const d = G.deck[i.side], cs = shuffle(G, d.map(c => C[c.id].c)); d.forEach((c, k) => { c.cm = cs[k] - C[c.id].c; }); },
  dichdo(G, i) { const c = G.hand[i.side][0]; if (!c) return; const k = cost(G, c, null), k0 = C[c.id].c; if (discard(G, i.side, c)) { const hasK = COLLECT.some(id => C[id].c === k); addRand(G, i.side, id => C[id].c === (hasK ? k : k0)); } },
  baocat(G, i) { let n = 0; for (const l of [0, 1, 2]) n += Math.min(2, shown(G, l, i.side).length); for (let k = 0; k < 2; k++) { const r = mk(G, "da", i.side); r.bonus += n; toHand(G, i.side, r, true); } },
  giacquannhen(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) c.bonus += 3; },
  ungsao(G, i) { const l = G.turn % 2 === 1 ? 0 : 2; for (const c of shown(G, l, i.side)) c.bonus += 1; },
  laogay(G, i, li) { G.forge[i.side] += Math.max(0, power(G, i, li)); },
  maythichnghi(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => !c.sil && ACT[ab(c)])); if (!t) return; i.ab = ab(t); t.sil = true; ev(G, "abcopy", { uid: i.uid, from: t.uid, st: 1 }); ev(G, "morph", { uid: i.uid }); },
  sieusaokhonglo(G) { G.hideT = G.turn + 1; },
  diaba(G) { for (const l of [0, 1, 2]) { const w = lead(G, l); if (!w) continue; const o = other(w), d = G.deck[o]; d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "da", o)); } },
  matocdautien(G, i) { const t = lowPow(G, G.hand[i.side], true); if (!t) return; const v = pw0(t); if (discard(G, i.side, t)) i.bonus -= v; },
  condoi(G, i) { horde(G, i.side, 3); },
  xaccunhan(G, i) { horde(G, i.side, 2); i.bonus += hordePow(G, i.side); },
  xackimve(G, i) { horde(G, i.side, shown(G, 2, i.side).length); },
  daonghich(G, i, li) { const all = []; for (const s of SIDES) for (const c of shown(G, li, s)) if (c !== i) all.push(c); if (!all.length) return; let lo = Infinity; for (const c of all) lo = Math.min(lo, power(G, c, li)); for (const c of all) if (power(G, c, li) === lo) c.bonus = -pw0(c) - basePow(c); },
  biamo(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) { const t = weakest(G, shown(G, l, i.side), l); if (t) destroy(G, t, l); } },
  chodoc(G, i) { const h = G.hand[i.side].slice(); for (let k = 0; k < 2 && h.length; k++) { const c = h.splice(Math.floor(rnd(G) * h.length), 1)[0]; c.bonus += 2; c.noPlay = G.turn + 1; ev(G, "lock", { side: i.side, uid: c.uid, t: "np" }); } },
  ngunhan(G) { for (const s of SIDES) { const f = find(G, G.ltp[s]); if (f) f.inst.bonus += 3; } },
  nubatuoc(G, i) { const n = mk(G, pick(G, COLLECT.filter(id => C[id].c === 6)), i.side); n.cm -= 2; n.bonus -= 2; toHand(G, i.side, n, true); },
  cuduto(G, i, li) { G.locs[li].grant[i.side] = G.turn + 1; G.sling[i.side] = G.turn + 1; },
  hapthunhan(G, i, li) { const f = find(G, G.prevPlay[i.side]); if (!f) return; const a = ab(f.inst); if (C[a].t !== "rev" || a === "hapthunhan" || !REV[a]) return; i.ab = a; ev(G, "abcopy", { uid: i.uid, from: f.inst.uid }); log(G, C[i.id].n + " chép kỹ năng của " + C[a].n); ev(G, "morph", { uid: i.uid }); if (G.depth < 6) { G.depth++; REV[a](G, i, li); } },
  thiendien(G, i) { const f = find(G, G.prevPlay[i.side]); if (!f) return; const a = ab(f.inst); if (C[a].t !== "on" || f.inst.sil) return; i.ab = a; ev(G, "abcopy", { uid: i.uid, from: f.inst.uid }); log(G, C[i.id].n + " chép kỹ năng của " + C[a].n); ev(G, "morph", { uid: i.uid }); },
  haplucnu(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => !c.sil && C[ab(c)].t === "on")); if (!t) return; i.ab = ab(t); t.sil = true; ev(G, "abcopy", { uid: i.uid, from: t.uid, st: 1 }); log(G, C[i.id].n + " lấy kỹ năng của " + C[t.id].n); ev(G, "morph", { uid: i.uid }); },
  aothuatgia(G, i, li) { const ol = otherLocs(G, li, i.side); if (!ol.length) return; const t = summon(G, i.side, "aoanh", pick(G, ol)); if (t) i.ill = t.uid; },
  tuyetve(G, i) { toHand(G, i.side, mk(G, "cucquangung", i.side), true); toHand(G, i.side, mk(G, "cucquanggau", i.side), true); },
  cucquangung(G) { G.noLoc = G.turn + 1; log(G, "Kỹ năng chiến địa bị bỏ qua đến hết lượt sau"); },
  cucquanggau(G, i, li) { if (G.locs[li].rvl) revealLoc(G, li); },
  kiemnuuminh(G, i, li) { if (G.turn > 5) return; const L = G.locs[li], o = L.rvl ? L.id : "?"; L.id = "limbo"; log(G, "Chiến địa đổi thành U Minh: ván này có lượt 7"); revealLoc(G, li, o); },
  phongnu(G, i, li) { const f = find(G, G.lastPlay[other(i.side)]); if (f && f.inst.side !== i.side && f.li !== li) moveCard(G, f.inst, f.li, li); },
  matvumuoiba(G, i) { addRand(G, i.side, () => true); },
  dacvutruong(G, i) { addRand(G, i.side, id => C[id].c === 4); addRand(G, i.side, id => C[id].c === 5); },
  naomay(G, i, li) { const t = pick(G, shown(G, li, i.side).filter(c => c !== i)); if (!t) return; const snap = clone1(G, t, i.side); if (destroy(G, t, li)) for (const l of [0, 1, 2]) if (l !== li && space(G, l, i.side) && !profX(G, l)) place(G, clone1(G, snap, i.side), l, i.side); },
  namtuocamthuat(G, i) { const d = G.deck[other(i.side)]; if (d.length) d[d.length - 1].fix6 = true; },
  mieuthan(G, i) { for (const c of G.hand[i.side]) { c.bp = 3; c.bonus = 0; } },
  lamthu(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i && bounce(G, c, li)) c.tcm = { t: G.turn + 1, a: -1 }; },
  camvuong(G, i) { discard(G, other(i.side), lowHigh(G, G.hand[other(i.side)], -1)); },
  hacbaovuong(G, i, li) { i.bonus += power(G, i, li); },
  trungmau(G, i, li) { const v = power(G, i, li); summon(G, i.side, "trungcon", li, v); summon(G, i.side, "trungcon", li, v); },
  aochoangtoi(G, i, li) { G.locs[li].cloak = G.turn + 1; },
  kiemnupho(G, i) { discard(G, i.side, lowHigh(G, G.hand[i.side], -1)); },
  tunguyennu(G) { draw(G, "p"); draw(G, "a"); },
  phethachnu(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) for (const s of SIDES) summon(G, s, "da", l); },
  giaphuydiet(G, i, li) { for (const [c, l] of boardCards(G, i.side)) if (l !== li) destroy(G, c, l); },
  baochuasat(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) summon(G, i.side, "baoco", l); },
  batty(G, i, li) { const o = other(i.side), h = G.hand[o], t = lowPow(G, h, true); if (t && space(G, li, o) && !profX(G, li)) { h.splice(h.indexOf(t), 1); place(G, t, li, o); } },
  phatuong(G, i, li) { if (oppPlayed(G, i, li).length) i.bonus += 4; },
  diennhan(G, i) { G.maxE[i.side] += 1; },
  phiung(G, i) { for (const [c, l] of boardCards(G, i.side)) if (c !== i && C[c.id].c === 1) bounce(G, c, l); },
  baithu(G, i) { const t = pick(G, G.hand[i.side]); if (!t || !discard(G, i.side, t)) return; const e = pick(G, boardCards(G, other(i.side))); if (e) destroy(G, e[0], e[1]); },
  bongma(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) if (C[ab(c)].t === "end") c.sil = true; },
  matoc(G, i, li) { const t = pick(G, G.disc[i.side]); if (t) revive(G, i.side, t, li); },
  nhenma(G, i, li) { const f = find(G, G.prevPlay[i.side]); if (f && f.inst.side === i.side && f.li !== li) moveCard(G, f.inst, f.li, li); },
  yeutinhluc(G, i, li) { sw(G, i, li); },
  yeutinhcam(G, i, li) { sw(G, i, li); },
  docxanu(G, i) { for (const s of SIDES) for (const [c, l] of boardCards(G, s)) if (c !== i) hurt(G, c, l, 1); },
  minhhau(G, i) { const seen = {}; for (const c of shuffle(G, G.disc[i.side])) { const k = C[c.id].c; if (seen[k]) continue; seen[k] = 1; const ls = [0, 1, 2].filter(l => space(G, l, i.side) && !profX(G, l)); if (ls.length) revive(G, i.side, c, pick(G, ls)); } },
  bangnhan(G, i) { const t = pick(G, G.hand[other(i.side)].filter(c => cost(G, c, null) < 6)); if (t) t.cm += 1; },
  nuloithan(G, i) { const d = G.deck[i.side]; for (const c of d.slice()) if (cost(G, c, null) === 0 && G.hand[i.side].length < HAND_MAX) { d.splice(d.indexOf(c), 1); toHand(G, i.side, c); } },
  phaohoanu(G, i, li) { const d = G.deck[i.side]; if (!d.length || !space(G, li, i.side) || profX(G, li)) return; const c = d.pop(); c.side = i.side; c.turn = G.turn; G.locs[li].cards[i.side].push(c); if (G.depth < 6) { G.depth++; revealCard(G, c, li, i.side); } else c.rev = true; },
  batkhacan(G, i, li) { for (const c of oppPlayed(G, i, li)) { const ol = otherLocs(G, li, c.side); if (ol.length) shove(G, c, li, pick(G, ol)); } },
  satvuong(G) { for (const s of SIDES) for (const [c, l] of boardCards(G, s)) if (C[c.id].c === 1) destroy(G, c, l); },
  tutraonu(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) if (c !== i && power(G, c, li) <= 3) destroy(G, c, li); },
  dainao(G, i) { const o = other(i.side), ps = boardCards(G, o).filter(([c]) => c.played && c.turn === G.turn); if (!ps.length) return; let hi = -1e9; for (const [c, l] of ps) hi = Math.max(hi, power(G, c, l)); for (const [c, l] of ps) if (power(G, c, l) === hi && space(G, l, i.side) && !profX(G, l)) place(G, clone1(G, c, i.side), l, i.side); },
  dianang(G, i) { for (const c of G.hand[other(i.side)]) if (C[c.id].c >= 6) c.sil = true; },
  tuvuong(G, i, li) { for (const [c, l] of boardCards(G, other(i.side))) if (l !== li && (C[c.id].c === 3 || C[c.id].c === 4)) moveCard(G, c, l, li); },
  phochihuy(G, i) { addRand(G, i.side, id => C[id].c === 2); },
  khuonmauchu(G, i) { const o = other(i.side); toHand(G, o, mk(G, "linhgacmay", o), true); toHand(G, o, mk(G, "linhgacmay", o), true); },
  cuongvuong(G, i) { draw(G, other(i.side)); draw(G, other(i.side)); },
  aomongnu(G, i) { const t = lowHigh(G, G.hand[other(i.side)], -1); if (t) { const c = clone1(G, t, i.side); c.bonus += 2; toHand(G, i.side, c, true); } },
  amban(G, i) { for (const c of G.deck[i.side]) { const oc = C[c.id].c + c.cm, op = pw0(c); c.cm = Math.max(0, op) - C[c.id].c; c.bp = oc; c.bonus = 0; } },
  nguyetkysi(G) { for (const s of SIDES) discard(G, s, pick(G, G.hand[s].filter(c => cost(G, c, null) % 2 === 0))); },
  matthamnu(G, i) { for (const c of G.hand[i.side]) c.bonus += 1; },
  docnhanchihuy(G, i) { for (let k = 0; k < 3; k++) addRand(G, i.side, id => C[id].c === 6); },
  nucanve(G, i) { for (const c of G.deck[i.side]) c.bonus += 1; },
  tunu(G, i, li) { const t = pick(G, boardCards(G, other(i.side)).filter(([c, l]) => l !== li && (C[c.id].c === 1 || C[c.id].c === 2))); if (t) moveCard(G, t[0], t[1], li); },
  tamkiemnu(G, i) { G.nextBonus[i.side] += 1; },
  channu(G, i, li) { const [a, b] = [0, 1, 2].filter(l => l !== li); const t = G.locs[a]; G.locs[a] = G.locs[b]; G.locs[b] = t; log(G, "Hai chiến địa đổi chỗ"); },
  giapcuuho(G, i) { i.wait = G.turn + 1; },
  tegiap(G, i, li) { summon(G, i.side, "da", li); },
  loda(G, i) { const o = other(i.side), d = G.deck[o]; for (let k = 0; k < 2; k++) d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "da", o)); },
  catnhan(G) { G.costUp = G.turn + 1; },
  duclongnhan(G, i) { for (const c of G.deck[i.side]) if (C[ab(c)].t === "on") c.sil = true; },
  bocap(G, i) { for (const c of G.hand[other(i.side)]) c.bonus -= 1; },
  nguyetyeu(G) { for (const s of SIDES) { const t = lowPow(G, G.hand[s], true); if (t) t.bonus -= 3; } },
  kimve(G, i) { summon(G, i.side, "hukhong", 2); },
  vuabong(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) { c.bonus = 0; c.bp = null; } },
  quyensu(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => power(G, c, li) >= 10)); if (t) destroy(G, t, li); },
  nuchuarung(G, i) { const pool = COLLECT.filter(id => C[id].c === 1); for (const l of [0, 1, 2]) summon(G, i.side, pick(G, pool), l); },
  congchuacongnghe(G, i, li) { G.shuri[i.side] = li + 1; },
  ngankiemsi(G) { for (const s of SIDES) discard(G, s, lowPow(G, G.hand[s], true)); },
  nganluot(G, i) { for (const [c] of boardCards(G, i.side)) if (c !== i && C[c.id].c === 3) c.bonus += 2; },
  nhennhan(G, i, li) { const ol = otherLocs(G, li, i.side); if (!ol.length) return; const to = pick(G, ol), t = pick(G, shown(G, li, other(i.side))); if (moveCard(G, i, li, to) && t) moveCard(G, t, li, to); },
  kiemlongnhan(G, i, li) { const t = pick(G, shown(G, li, other(i.side))); if (t && li < 2) moveCard(G, t, li, li + 1); },
  baonu(G, i, li) { G.locs[li].flood = G.turn + 1; ev(G, "lock", { li, t: "flood" }); log(G, "Chiến địa bị ngập: lượt sau là lượt cuối đặt được thẻ tại đây"); },
  suphunhai(G, i) { const f = find(G, G.prevPlay[i.side]); if (f) i.bp = power(G, f.inst, f.li); },
  trummu(G, i) { toHand(G, i.side, mk(G, "quy", i.side), true); },
  loithan(G, i) { const d = G.deck[i.side]; d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "buasam", i.side)); },
  buasam(G, i) { for (const [c] of boardCards(G, i.side)) if (is(G, c, "loithan")) c.bonus += 7; },
  cohoang(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) for (let k = 0; k < 4; k++) summon(G, i.side, "maybaycon", l); },
  nuthanchienma(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) { c.bp = 3; c.bonus = 0; } },
  hacdich(G, i, li) { let v = 0; for (const c of shown(G, li, i.side)) if (c !== i) { const x = power(G, c, li); if (destroy(G, c, li)) v += x; } i.bonus += v; },
  ranlucnu(G, i, li) { const t = weakest(G, shown(G, li, i.side).filter(c => c !== i), li); if (t) sw(G, t, li); },
  songnu(G) { G.costCap = G.turn + 1; },
  ongvang(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) hurt(G, c, li, 1); },
  horangkiem(G, i) { for (const c of G.deck[i.side]) if (C[c.id].c === 4) c.cm -= 1; },
  sokhong(G, i) { G.zero[i.side] = true; },
  dauto(G, i) { for (const c of G.hand[i.side].slice()) discard(G, i.side, c); },
  tinhquyennu(G, i) { const d = G.deck[i.side]; if (d.length) d[d.length - 1].bonus += 3; },
  daothosan(G, i) { const h = G.hand[i.side]; if (h.length) discard(G, i.side, h[h.length - 1]); },
  linhtuonglai(G, i) { const d = G.deck[other(i.side)]; if (d.length && G.hand[i.side].length < HAND_MAX) { const c = d.pop(); c.side = i.side; c.own = i.side; G.hand[i.side].push(c); } },
  huyetdich(G, i, li) { let n = 0; for (const c of shown(G, li, i.side)) if (c !== i && destroy(G, c, li)) n++; i.bonus += 2 * n; },
  xacmay(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) destroy(G, c, li); },
  diphapsu(G, i, li) {
    const all = boardCards(G, i.side).filter(([c, l]) => c !== i && l !== li); if (!all.length) return;
    let hi = -1e9; for (const [c, l] of all) hi = Math.max(hi, power(G, c, l));
    for (const [c, l] of all) if (power(G, c, l) === hi) moveCard(G, c, l, li);
  },
  songchuynu(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => C[c.id].c === 1)); if (t) destroy(G, t, li); },
  mehoacnu(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) if (C[ab(c)].t === "on" && !c.sil) { c.sil = true; log(G, C[c.id].n + " mất kỹ năng"); } },
  thoren(G, i) { G.forge[i.side] += 2; },
  lucsatnu(G, i, li) { if (oppPlayed(G, i, li).length) i.bonus += 4; },
  mocnhan(G, i, li) { if (oppPlayed(G, i, li).length) i.bonus += 4; },
  chonphao(G, i, li) { if (oppPlayed(G, i, li).length) i.bonus += 4; },
  tinhchua(G, i, li) { if (oppPlayed(G, i, li).length) i.bonus += 4; },
  thantien(G, i) { i.wait = G.turn + 1; },
  thamtunu(G, i) { i.wait = G.turn + 1; },
  thukieu(G, i) { for (const li of [1, 2]) for (const c of shown(G, li, i.side)) if (c !== i) moveCard(G, c, li, li - 1); },
  giapchongcuong(G, i, li) {
    const t = pick(G, shown(G, li, i.side).filter(c => c !== i)); if (!t) return;
    t.bonus += basePow(i) + i.bonus; const a = G.locs[li].cards[i.side]; a.splice(a.indexOf(i), 1);
    log(G, C[i.id].n + " hợp thể vào " + C[t.id].n); ev(G, "morph", { uid: t.uid });
  },
  thietquyen(G, i) { G.fist[i.side] = true; },
  thiettam(G, i) { const pool = boardCards(G, i.side).map(x => x[0]).filter(c => c !== i); for (let k = 0; k < 2 && pool.length; k++) { const t = pool.splice(Math.floor(rnd(G) * pool.length), 1)[0]; t.bonus += 3; } },
  thachnhan(G, i) { const d = G.deck[other(i.side)]; d.splice(Math.floor(rnd(G) * (d.length + 1)), 0, mk(G, "da", other(i.side))); },
  nuchienthan(G, i) { discard(G, i.side, lowHigh(G, G.hand[i.side], 1)); },
  xucgiacnu(G, i, li) { const t = pick(G, oppPlayed(G, i, li)); if (t) toHand(G, i.side, mk(G, t.id, i.side), true); },
  tocnuhoang(G, i, li) { if (li === 1) i.bonus += 3; },
  tasu(G, i, li) { summon(G, i.side, "bansaota", li, power(G, i, li)); },
  nguyetdong(G, i) { const h = G.hand[i.side]; for (const c of h.slice()) if (h.length < HAND_MAX) toHand(G, i.side, clone1(G, c, i.side), true); },
  bienhinh(G, i) { const t = pick(G, G.hand[other(i.side)]); if (t) copyInto(G, i, t); },
  phuthan(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i && !c.sil && (C[ab(c)].t === "rev" || !!REV[ab(c)]) && !is(G, c, "phuthan")) { const fn = REV[ab(c)]; const cur = locOf(G, c); if (fn && cur >= 0) fn(G, c, cur); } },
  hongphuthuy(G, i, li) { const L = G.locs[li], used = G.locs.map(x => x.id), id = pick(G, Object.keys(LOC).filter(k => !used.includes(k))); if (!id) return; const o = L.rvl ? L.id : "?"; L.id = id; log(G, "Chiến địa đổi thành " + LOC[id].n); revealLoc(G, li, o); },
  linhgacmay(G, i) { toHand(G, i.side, mk(G, "linhgacmay", i.side), true); },
  quangpho(G, i) { for (const [c] of boardCards(G, i.side)) if (c !== i && C[ab(c)].t === "on") c.bonus += 2; },
  nhennu(G, i, li) { for (const c of shown(G, li, other(i.side))) hurt(G, c, li, 1); },
  socnu(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) summon(G, i.side, "soc", l); },
  kiemsu(G, i) { discard(G, i.side, pick(G, G.hand[i.side].filter(c => cost(G, c, null) % 2 === 1))); },
  bachhau(G, i) { const t = lowHigh(G, G.hand[other(i.side)], 1); if (t) toHand(G, i.side, clone1(G, t, i.side), true); },
  bachho(G, i, li) { const o = otherLocs(G, li, i.side); if (o.length) summon(G, i.side, "ho", pick(G, o)); },
  soinu(G, i, li) { i.bonus += 2 * shown(G, li, i.side).filter(c => c !== i).length; },
  tieuvuong(G, i) { const d = G.deck[other(i.side)], t = lowHigh(G, d, -1); if (t) { d.splice(d.indexOf(t), 1); log(G, C[t.id].n + " bị trục xuất khỏi bộ bài"); } }
};
function oppPlayed(G, i, li) { return G.locs[li].cards[other(i.side)].filter(c => c.played && c.turn === G.turn); }
function regen(G, i) {
  const ls = [0, 1, 2].filter(l => space(G, l, i.own) && !profX(G, l)); if (!ls.length) return;
  unpile(G, i); i.side = i.own; i.bonus += 2; i.rev = true; i.sum = true; i.turn = G.turn; i.played = false;
  G.locs[pick(G, ls)].cards[i.own].push(i); log(G, C[i.id].n + " tái sinh +2"); ev(G, "revive", { uid: i.uid });
}
const ACT = {
  linhdondoc(G, i, li) { G.forge[i.side] += Math.max(0, power(G, i, li)); },
  nhendotham(G, i, li) { const ol = otherLocs(G, li, i.side).filter(l => !profX(G, l)); if (ol.length && !stardust(G)) { const c = clone1(G, i, i.side); c.act = true; place(G, c, pick(G, ol), i.side); } },
  chomay(G, i) { const m = G.lastMove[i.side], f = m && find(G, m.u); if (!f || f.inst.side !== i.side) return; f.inst.bonus += 2; moveCard(G, f.inst, f.li, m.f); },
  nhenhacdich(G, i, li) { const t = lowHigh(G, shown(G, li, i.side).filter(c => c !== i), -1); if (!t) return; const a = ab(t), v = power(G, t, li), arr = G.locs[li].cards[i.side]; arr.splice(arr.indexOf(t), 1); i.bonus += v; if (!t.sil && C[a].t !== "none") { i.ab = a; ev(G, "abcopy", { uid: i.uid, from: t.uid }); ev(G, "morph", { uid: i.uid }); if (C[a].t === "rev" && REV[a] && G.depth < 6) { G.depth++; REV[a](G, i, li); } } },
  cosinhthe(G, i) { for (let k = 0; k < G.unspent[i.side]; k++) { const t = pick(G, G.hand[i.side]); if (t) t.cm -= 1; } },
  xactinhquang(G, i, li) { let n = 0; for (const c of shown(G, li, i.side)) if (c !== i && destroy(G, c, li)) n++; i.bonus += 3 * n; const ls = otherLocs(G, li, i.side).filter(l => { const w = lead(G, l); return w && w !== i.side; }); if (ls.length) moveCard(G, i, li, pick(G, ls)); },
  xacdeo(G, i) { const pool = boardCards(G, i.side).filter(([c]) => c.sum || c.cr); for (let k = 0; k < 4 && pool.length; k++) pool.splice(Math.floor(rnd(G) * pool.length), 1)[0][0].bonus += 1; },
  nhennon(G, i) { G.arana[i.side] = true; },
  thienngaden(G, i) { G.swan[i.side] = G.turn + 1; },
  phitieuhoi(G, i, li) { bounce(G, i, li); },
  hongtam(G, i) { let n = 0; for (const c of G.hand[i.side].slice()) if (cost(G, c, null) <= 1 && discard(G, i.side, c)) n++; hurtN(G, boardCards(G, other(i.side)), n, 2); },
  longuclua(G, i, li) { i.bonus += 2 * (shown(G, li, i.side).filter(c => C[c.id].c >= 5).length + G.hand[i.side].filter(c => C[c.id].c >= 5).length); },
  aosi(G, i) { if (!(G.cnt.disc[i.side] > 0 && G.cnt.destOwn[i.side] > 0)) return; const o = other(i.side); for (const l of [0, 1, 2]) G.locs[l].cards[o].slice(0, 2).forEach(c => { if (c.rev) hurt(G, c, l, 2); }); },
  langthan(G, i, li) { const o = other(i.side), pool = G.disc[o].concat(G.dead[o]); if (!pool.length) return; let b = pool[0]; for (const c of pool) if (pw0(c) > pw0(b)) b = c; revive(G, i.side, b, li); },
  trolymay(G, i, li) { const k = (G.turn - i.turn) % 4; if (k === 1) G.nextBonus[i.side] += 2; else if (k === 2) { for (const l of [0, 1, 2]) if (l !== li) { const pool = shown(G, l, i.side).slice(); for (let n = 0; n < 2 && pool.length; n++) pool.splice(Math.floor(rnd(G) * pool.length), 1)[0].bonus += 1; } } else if (k === 3) summon(G, i.side, "da", li, 4); else i.bonus += power(G, i, li); },
  annusokhai(G, i) { G.endTwice[i.side] = G.turn; },
  nuco(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i && !c.sil && ACT[ab(c)] && ab(c) !== "nuco" && G.depth < 6) { G.depth++; ev(G, "act", { uid: c.uid }); ACT[ab(c)](G, c, li); } },
  tamlinhtu(G, i) { G.omega[i.side] = i.uid; },
  hacthuatsi(G, i) { const t = pick(G, G.deck[i.side].filter(c => C[c.id].c === G.unspent[i.side] && C[ab(c)].t !== "none")); if (t) { i.ab = ab(t); ev(G, "abcopy", { uid: i.uid, from: t.uid, deck: 1 }); ev(G, "morph", { uid: i.uid }); } },
  hauduethoikhong(G, i, li) { const ol = otherLocs(G, li, i.side); if (!ol.length) return; const lv = i.lv || 1; summon(G, i.side, pick(G, COLLECT.filter(id => C[id].c === lv)), pick(G, ol)); },
  dauvuong(G, i, li) { for (const l of [0, 1, 2]) if (l !== li) { const t = pick(G, shown(G, l, i.side)); if (t) t.bonus += 2; } },
  xanhan(G, i, li) { const t = pick(G, shown(G, li, other(i.side)).filter(c => c.sum || c.cr)); if (t) destroy(G, t, li); },
  phonghiem(G, i, li) { const v = power(G, i, li), t = pick(G, shown(G, li, other(i.side)).filter(c => power(G, c, li) < v)); if (t) destroy(G, t, li); },
  thuytoquyen(G, i, li) { for (const c of shown(G, li, i.side)) if (c !== i) { c.bonus += 1; if (li < 2) moveCard(G, c, li, li + 1); } },
  xebay(G, i) { for (const [c] of boardCards(G, i.side)) if (C[ab(c)].t === "end") c.bonus += 2; },
  phuthuydamlay(G, i) { G.nextBonus[i.side] += 1; },
  vualunren(G, i) { const d = G.deck[i.side], ix = d.findIndex(c => c.cr || C[c.id].tok); if (ix >= 0 && G.hand[i.side].length < HAND_MAX) G.hand[i.side].push(d.splice(ix, 1)[0]); },
  roidich(G, i, li) { const t = pick(G, shown(G, li, other(i.side))); if (t) hurt(G, t, li, power(G, i, li)); },
  linhgaccuoi(G, i) { const all = boardCards(G, other(i.side)); if (!all.length) return; let b = all[0]; for (const e of all) if (power(G, e[0], e[1]) > power(G, b[0], b[1])) b = e; hurt(G, b[0], b[1], 7); },
  khuyendichchuyen(G, i) { G.lockjaw[i.side] = true; },
  aothuatgia(G, i) { const f = i.ill && find(G, i.ill); if (!f) return; const t = f.inst, a = [basePow(i), i.bonus]; i.bp = basePow(t); i.bonus = t.bonus; t.bp = a[0]; t.bonus = a[1]; ev(G, "morph", { uid: t.uid }); },
  docnu(G, i) { const o = other(i.side); toHand(G, o, mk(G, "vetcandoc", o), true); },
  nguuma(G, i) { discard(G, i.side, pick(G, G.hand[i.side])); },
  heonhen(G, i) { const t = pick(G, G.hand[other(i.side)].filter(c => !c.sil && C[ab(c)].t !== "none")); if (t) t.sil = true; }
};
const END = {
  dihien(G, i) { const s = i.side; if (!G.cnt.movedTurn[s]) return; const t = pick(G, G.hand[s].filter(c => MOVERS.includes(ab(c)) || /[Dd]ời [Đđ]ược|có thể di chuyển/.test(C[ab(c)].x || ""))); if (t) { t.cm -= 1; t.bonus += 2; } },
  thaphoankhaimo(G, i, li) { for (const k of shown(G, li, i.side)) if (k !== i) k.bonus += 1; },
  nguyetlongnu(G, i) { if (G.cnt.playedNow[i.side] === 1 && G.unspent[i.side] === 0) i.bonus += 2; },
  deonhansokhai(G, i) { const t = pick(G, G.hand[i.side]); if (!t) return; if (rnd(G) < 0.5 && cost(G, t, null) > 0) t.cm -= 1; else t.bonus += 3; },
  cuongnhando(G, i) { if (G.unspent[other(i.side)] > 0) i.bonus += 3; },
  diphaptoithuong(G, i, li) { const t = pick(G, boardCards(G, i.side).filter(([c]) => c !== i && (c.sum || c.cr))); if (!t) return; const v = power(G, t[0], t[1]), a = G.locs[t[1]].cards[i.side]; a.splice(a.indexOf(t[0]), 1); i.bonus += v + 2; },
  nhenlong(G, i) { if (!topPow(G, i.side)) return; i.bonus += 1; const h = G.hand[i.side].slice(); for (let k = 0; k < 2 && h.length; k++) h.splice(Math.floor(rnd(G) * h.length), 1)[0].bonus += 1; },
  tuongquan(G, i) { if (G.unspent[other(i.side)] <= 0) return; const d = G.deck[i.side], ix = d.findIndex(c => pw0(c) >= 10); if (ix >= 0 && G.hand[i.side].length < HAND_MAX) { const c = d.splice(ix, 1)[0]; c.side = i.side; G.hand[i.side].push(c); ev(G, "draw", { side: i.side, uid: c.uid }); onDrawn(G, i.side, c); log(G, C[i.id].n + " rút " + C[c.id].n); } },
  thachquaisokhai(G, i, li) { i.bonus += 2; if (!i.used && G.locs[li].cards[i.side].length >= cap(G, li)) { const v = power(G, i, li), t = pick(G, shown(G, li, other(i.side)).filter(c => power(G, c, li) < v)); if (t) { i.used = true; destroy(G, t, li); } } },
  nuchienbathu(G, i) { if (G.cnt.playedNow[i.side] === 2) i.bonus += 3; },
  huyetsatvuong(G, i) { if (G.unspent[i.side] === 0) toHand(G, i.side, mk(G, "giaohutmau", i.side), true); },
  xacdao(G, i) { if (G.cnt.revT[i.side] !== G.turn) return; const t = pick(G, G.hand[other(i.side)]); if (!t) return; t.bonus -= 1; horde(G, i.side, 1); },
  tiensigamma(G, i) { if (G.unspent[i.side] > 0 && rnd(G) < 1 / 3) { const b = i.bonus; transform(G, i, "cuongnhan"); i.bonus = b; } },
  baochuahauthe(G, i) { if (G.cnt.playedNow[i.side] !== 1) return; const ls = [0, 1, 2].filter(l => space(G, l, i.side) && !profX(G, l)); if (ls.length) summon(G, i.side, "baocohauthe", pick(G, ls)); },
  phatuongsinhlinh(G, i, li) { const v = power(G, i, li), e = boardCards(G, other(i.side)).filter(([c, l]) => c.played && c.turn === G.turn && power(G, c, l) > v); if (!e.length) return; i.bonus += 3; const t = pick(G, e); if (t[1] !== li && locPower(G, t[1], i.side) + power(G, i, li) > locPower(G, t[1], other(i.side))) moveCard(G, i, li, t[1]); },
  thienthantimkiem(G, i, li) { const h = G.hand[i.side], c = pick(G, h.filter(x => x.cr)); if (c && space(G, li, i.side) && !profX(G, li)) { h.splice(h.indexOf(c), 1); place(G, c, li, i.side); } },
  hoanhansokhai(G, i, li) { if (!i.used && G.locs[li].cards[i.side].length >= cap(G, li)) { i.used = true; i.bonus += power(G, i, li); } else i.bonus += 1; },
  linhchindau(G, i, li) { if (G.pendingDouble > 0 || G.snap.p || G.snap.a) { const ol = otherLocs(G, li, i.side); if (ol.length) moveCard(G, i, li, pick(G, ol)); } },
  batbainu(G, i, li) { const w = lead(G, li); if (w && w !== i.side) i.bonus += power(G, i, li); },
  tieulong(G, i, li) { if (G.cnt.one[i.side] === G.turn) hurtN(G, shown(G, li, other(i.side)).map(c => [c, li]), 1, 2); },
  kydong(G, i) { const pool = boardCards(G, i.side).filter(([c]) => C[c.id].c === 1); for (let k = 0; k < 3 && pool.length; k++) pool.splice(Math.floor(rnd(G) * pool.length), 1)[0][0].bonus += 1; },
  nangtocdo(G, i) { for (const [c] of boardCards(G, i.side)) if (c.mt === G.turn) c.bonus += 1; },
  docnhantienhoa(G, i, li) { if (G.unspent[i.side] > 0) hurtN(G, shown(G, li, other(i.side)).map(c => [c, li]), 2, 1); },
  cuongnhantienhoa(G, i) { if (G.unspent[i.side] > 0) i.bonus += 2; },
  taymaynutienhoa(G, i) { if (G.unspent[i.side] > 0) { const t = pick(G, boardCards(G, i.side).filter(([c]) => c !== i)); if (t) t[0].bonus += 1; } },
  nguumamienvien(G, i, li) { for (const s of SIDES) for (const c of shown(G, li, s)) if (c !== i) hurt(G, c, li, 1); for (const c of shown(G, li, i.side)) if (c !== i && power(G, c, li) <= 0) destroy(G, c, li); },
  nganluotsokhai(G, i, li) { if (lead(G, li) !== i.side) return; const t = pick(G, shown(G, li, i.side).filter(c => c !== i && !c.sil && C[ab(c)].t === "rev")); if (t) { i.ab = ab(t); ev(G, "abcopy", { uid: i.uid, from: t.uid }); ev(G, "morph", { uid: i.uid }); } },
  xacdathep(G, i, li) { if (lead(G, li) === i.side && G.hand[i.side].length) discard(G, i.side, G.hand[i.side][0]); },
  kimthuatsi(G, i, li) { if (lead(G, li) === i.side) draw(G, i.side); else i.bonus += 1; },
  thuyba(G, i, li) { const v = power(G, i, li), t = pick(G, shown(G, li, i.side).filter(c => c !== i && power(G, c, li) < v)); if (t) destroy(G, t, li); },
  xanang(G, i) { G.maxE[i.side] -= 1; i.bonus += 3; },
  vetmattroi(G, i) { i.bonus += G.unspent[i.side]; }
};
const DESTROYED = {
  manhkiemquy(G, i) { DISCARDED.manhkiemquy(G, i, i.own); },
  muoikiepnu(G, i) { for (const id of G.open[i.own]) toHand(G, i.own, mk(G, id, i.own), true); },
  xactantinh(G, i) { horde(G, i.own, 3); },
  daubay(G, i) { unpile(G, i); i.rev = false; i.played = false; if (!toHand(G, i.own, i)) { G.dead[i.own].push(i); return; } for (const c of G.hand[i.own]) c.bonus += 1; },
  lukhachtroi(G, i, li, ix) { const c = fromHandDeck(G, i.own, x => C[x.id].c === 4); if (c && space(G, li, i.side) && !profX(G, li)) { c.side = i.side; c.rev = true; c.sum = true; c.turn = G.turn; G.locs[li].cards[i.side].splice(Math.min(ix, G.locs[li].cards[i.side].length), 0, c); ev(G, "summon", { uid: c.uid }); } },
  chuhien(G, i, li, ix) { summon(G, i.side, "nhennhan", li, null, ix); },
  linhthuelammom(G, i, li, ix) { const c = fromHandDeck(G, i.own, x => C[x.id].c === 1); if (c && space(G, li, i.side) && !profX(G, li)) { c.side = i.side; c.rev = true; c.sum = true; c.turn = G.turn; c.bonus += 2; G.locs[li].cards[i.side].splice(Math.min(ix, G.locs[li].cards[i.side].length), 0, c); ev(G, "summon", { uid: c.uid }); } },
  cotnu(G, i) { marrow(G, i); },
  vuotnu(G, i) { regenX(G, i); },
  taythep(G, i, li, ix) { summon(G, i.side, "linhmuadong", li, null, ix); },
  linhbattu(G, i) { unpile(G, i); i.bonus = 2 * pw0(i) - basePow(i); i.rev = false; i.played = false; if (!toHand(G, i.own, i)) G.dead[i.own].push(i); },
  thosanmay(G, i, li) { for (const l of [0, 1, 2]) if (l !== li && space(G, l, i.side) && !profX(G, l)) place(G, clone1(G, i, i.side), l, i.side); },
  nanhkiem(G, i) { unpile(G, i); i.cm = -C[i.id].c; i.rev = false; i.played = false; if (!toHand(G, i.own, i)) G.dead[i.own].push(i); },
  tantinh(G, i) { for (const [c] of boardCards(G, i.side)) c.bonus += 1; },
  vuotsoi(G, i) { regen(G, i); }
};
const DISCARDED = {
  dathuongnu(G, i, side) { const ls = [0, 1, 2].filter(l => space(G, l, side) && !profX(G, l)); if (!ls.length) return; let b = ls[0]; for (const l of ls) if (locPower(G, l, side) < locPower(G, b, side)) b = l; jumpTo(G, i, side, b); },
  khinhdich(G, i, side) { unpile(G, i); i.bonus += 2; if (!toHand(G, side, i)) G.disc[side].push(i); const t = pick(G, boardCards(G, side)); if (t) t[0].bonus += 2; },
  vukhih(G, i, side) { unpile(G, i); i.cm -= 2; if (!toHand(G, side, i)) G.disc[side].push(i); },
  xachacmieu(G, i, side) { const o2 = G.hand[side].find(c => c !== i && !c.sil && DISCARDED[ab(c)]); if (o2 && G.depth < 10) discard(G, side, o2); const ls = [0, 1, 2].filter(l => space(G, l, side) && !profX(G, l)); if (!ls.length) return; let b = ls[0]; for (const l of ls) if (G.locs[l].cards[side].length < G.locs[b].cards[side].length) b = l; jumpTo(G, i, side, b); },
  nguyetthan(G, i, side) { unpile(G, i); i.id = "nguyetthanbannguyet"; if (!toHand(G, side, i)) G.disc[side].push(i); },
  nguyetthanbannguyet(G, i, side) { unpile(G, i); i.id = "nguyetthantrangtron"; if (!toHand(G, side, i)) G.disc[side].push(i); },
  cotnu(G, i) { marrow(G, i); },
  vuotnu(G, i) { regenX(G, i); },
  manhkiemquy(G, i, side) { for (const [c, l] of boardCards(G, side)) if (c.id === "monghoang") c.bonus += power(G, c, l); },
  bayong(G, i, side) { for (let k = 0; k < 2; k++) { const c = mk(G, "bayong", side); c.cm = -C[i.id].c; toHand(G, side, c, true); } },
  mauhambay(G, i, side) { while (G.hand[side].length < HAND_MAX) addRand(G, side, () => true); },
  matthevuong(G, i, side) { unpile(G, i); i.bonus += 4; if (!toHand(G, side, i)) G.disc[side].push(i); },
  vuotsoi(G, i) { regen(G, i); }
};
const MOVED = {
  khientuong(G, i, from, to) { for (const k of shown(G, to, i.side)) if (!k.sil && is(G, k, "thuanung")) k.bonus += 2; },
  dakhuc(G, i, from, to) { newLoc(G, to); },
  chimcanhdo(G, i, from) { if (i.used) return; i.used = true; const h = G.hand[i.side], c = pick(G, h); if (c && space(G, from, i.side) && !profX(G, from)) { h.splice(h.indexOf(c), 1); place(G, c, from, i.side); } },
  nhennoiloan(G, i, from, to) { const t = strongest(G, shown(G, to, other(i.side)), to); if (t && hurt(G, t, to, 2)) i.bonus += 2; },
  quangchuy(G, i, from, to) { i.bonus += 2 * shown(G, to, other(i.side)).length; },
  hoanhan(G, i, from, to) { i.bonus += power(G, i, to); },
  kenken(G, i) { i.bonus += 4; },
  nhenhauthe(G, i, from, to) { const t = pick(G, shown(G, to, other(i.side))); if (t) hurt(G, t, to, 3); },
  phanthan(G, i, from) { if (space(G, from, i.side) && !profX(G, from)) { const c = clone1(G, i, i.side); c.rev = true; c.sum = true; c.turn = G.turn; G.locs[from].cards[i.side].push(c); ev(G, "summon", { uid: c.uid }); } }
};

/* ---------- giá và điều kiện đặt bài ---------- */
for (const M of [REV, ACT, END]) for (const id of Object.keys(C)) if (M[id] && /[Ll]ấy[^.]*sức mạnh/.test(C[id].x || "")) {
  const f0 = M[id];
  M[id] = function (G, i, li) { const s = i.side, m = {}; for (const [k] of boardCards(G, s)) m[k.uid] = k.bonus; const r = f0(G, i, li); for (const [k] of boardCards(G, s)) if (m[k.uid] != null && k.bonus > m[k.uid]) k.stl = true; return r; };
}
function cost(G, inst, li) {
  const d = C[inst.id], s = inst.side, o = other(s);
  let c = d.c + inst.cm;
  if (G.mods && G.mods.g && G.mods.g.costm1) c -= 1;
  if (inst.tcm && inst.tcm.t === G.turn) c += inst.tcm.a;
  if (!inst.sil) {
    if (is(G, inst, "tuthan")) c -= G.cnt.dest;
    else if (is(G, inst, "nucuongnhan")) c -= G.unspentPrev[s];
    else if (is(G, inst, "nhentre")) { if (G.cnt.movedPrev) c = 1; }
    else if (is(G, inst, "caonu")) { if (G.cnt.disc[o] > 0) c = 1; }
  }
  if (!inst.sil) {
    if (is(G, inst, "nguoituyet")) c -= G.cnt.playedLast[s];
    else if (is(G, inst, "cuongtu")) { for (const [k, l] of boardCards(G, s)) if (power(G, k, l) >= 10) c -= 2; }
    else if (is(G, inst, "giacquannhen")) c -= G.cnt.mvPlayed[s];
  }
  if (inst.cr && c < 6) { const n = cntOn(G, o, "giacnguu"); if (n) c = Math.min(6, c + n); }
  if (pw0(inst) <= 1 && c > 1) { const n = cntOn(G, s, "nuphanquan"); if (n) c = Math.max(1, c - n); }
  if (d.c === 1 && G.swan[s] >= G.turn) c = 0;
  if (!inst.sil && is(G, inst, "quaituongtienhoa")) c -= boardCards(G, o).filter(([k]) => k.bonus < 0).length;
  if (!inst.sil) {
    if (is(G, inst, "battykhonglo")) { const dk = G.deck[s]; if (dk.length) c -= C[dk[dk.length - 1].id].c; }
    else if (is(G, inst, "chimnhai")) c -= boardCards(G, s).filter(([k]) => k.sum || k.cr).length;
    else if (is(G, inst, "trumthanhpho")) { if (topPow(G, s)) c = Math.min(c, 3); }
    else if (is(G, inst, "daidoan")) c -= G.cnt.crPlayed[s];
  }
  let red = 0; for (const [k, kl] of boardCards(G, s)) if (!k.sil) { if (is(G, k, "thienlenhnu")) red += ongMult(G, kl, s, k); else if (is(G, k, "phiconamcanh") && inst.cr) red += ongMult(G, kl, s, k); }
  if (red && c > 1) c = Math.max(1, c - red);
  if (G.costUp === G.turn && c < 6) c += 1;
  if (G.costCap >= G.turn) c = Math.min(c, 4);
  if (inst.fix6 && G.turn < 6) c = 6;
  if (anyOn(G, s, "quanthoigian")) c = Math.min(c, d.c);
  if (anyOn(G, o, "quanthoigian")) c = Math.max(c, d.c);
  if (!inst.sil && is(G, inst, "thietgiapthuongdang") && c < d.c) c = d.c - 2 * (d.c - c);
  if (li != null && G.locs[li]) { const X = LX(G, G.locs[li]); if (X && X.cost) c += X.cost(G, inst, li); }
  for (const L of G.locs) { const X = LX(G, L); if (X && X.gcost) c += X.gcost(G, inst); }
  return Math.max(0, c);
}
function rowOf(inst, side) { return side; }
function canPlay(G, side, inst, li) {
  if (!canPlay0(G, side, inst, li)) return false;
  if (!G.q[side].some(a => a.t === "play")) { const js = [0, 1, 2].filter(l => hasOn(G, l, "p", "phuongtamnu") || hasOn(G, l, "a", "phuongtamnu")); if (js.length && !js.includes(li) && js.some(l => canPlay0(G, side, inst, l))) return false; }
  return true;
}
function canPlay0(G, side, inst, li) {
  if (anyOn(G, side, "comaychien") && !G.locs[li].gone) { let n = G.locs[li].cards[side].length; for (const a of G.q[side]) if (a.t === "play" && a.li === li) n++; return n < cap(G, li) && cost(G, inst, li) <= G.energy[side]; }
  const L = G.locs[li], row = side, id = inst.sil ? "" : inst.id;
  let n = L.cards[row].length, q = 0;
  for (const a of G.q[side]) if (a.t === "play") { q++; if (a.li === li && a.row === row) n++; }
  if (n >= cap(G, li)) return false;
  if (lon(G, L) && L.id === "swamp" && G.turn === turns(G)) return false;
  if (L.lock[side] === G.turn) return false;
  if (profX(G, li)) return false;
  if (L.flood && G.turn > L.flood) return false;
  if (q > 0 && anyOn(G, side, "diennhan")) return false;
  if (hasOn(G, li, side, "hacthiet")) return false;
  const c = cost(G, inst, li);
  { const X = LX(G, L); if (X && X.can && !X.can(G, side, inst, li)) return false; }
  if (c >= 4 && (hasOn(G, li, "p", "mieunuot") || hasOn(G, li, "a", "mieunuot"))) return false;
  if (id === "hacthiet" && G.turn > 3) return false;
  if (id === "socheo" && lead(G, li) !== side) return false;
  if (id === "cuthubien" && li !== 0) return false;
  if (id === "kimve" && li === 2) return false;
  if (id === "vohannhan" && G.cnt.playedLast[side] > 0) return false;
  if (L.gone) return false;
  if (inst.noPlay === G.turn) return false;
  if (id === "hacthachtuong" && !L.cards[side].some(k => k.rev && C[k.id].c === 1)) return false;
  if (id === "nokiem" && !shown(G, li, other(side)).some(k => k.bonus < 0)) return false;
  return c <= G.energy[side];
}
function queuePlay(G, side, uid, li) {
  const h = G.hand[side], ix = h.findIndex(c => c.uid === uid);
  if (ix < 0) return false;
  const inst = h[ix];
  if (!canPlay(G, side, inst, li)) return false;
  const c = cost(G, inst, li);
  h.splice(ix, 1); G.energy[side] -= c;
  G.q[side].push({ t: "play", uid, li, row: rowOf(inst, side), c, hi: ix, inst });
  return true;
}
function queued(G, side, uid, t) { return G.q[side].find(a => a.uid === uid && a.t === t); }
function canActivate(G, side, inst) {
  return inst.rev && inst.side === side && !!ACT[ab(inst)] && !inst.sil && !inst.act && inst.turn < G.turn && !queued(G, side, inst.uid, "act");
}
function queueAct(G, side, uid) {
  const f = find(G, uid); if (!f || !canActivate(G, side, f.inst)) return false;
  G.q[side].push({ t: "act", uid }); return true;
}
function moveRight(G, side, inst, li) { // "self" | "grant" | null
  if (!inst.rev || inst.side !== side || inst.turn >= G.turn || queued(G, side, inst.uid, "move")) return null;
  if (!inst.sil) {
    if (is(G, inst, "huyenco")) return "self";
    if (inst.ug_mv && (inst.mvn || 0) < inst.ug_mv) return "self";
    if (is(G, inst, "khientuong") && !inst.mv && anyOn(G, side, "thuanung")) return "self";
    if ((is(G, inst, "dahanh") || is(G, inst, "nhenhauthe")) && !inst.mv) return "self";
  }
  if (!inst.sil && (inst.fly || inst.free === G.turn || (is(G, inst, "nhenngaymoi") && (inst.mvn || 0) < 2) || ((is(G, inst, "dakhuc") || is(G, inst, "chonvacay") || is(G, inst, "nhennoiloan")) && !inst.mv) || ((is(G, inst, "caheocon") || is(G, inst, "camapcan")) && !inst.mv) || (is(G, inst, "thuyngannu") && !inst.mv))) return "self";
  if ([0, 1, 2].some(l => l !== li && (G.locs[l].cloak === G.turn || (G.locs[l].hell && G.locs[l].hell[side] === G.turn)))) return "cloak";
  if (G.locs[li].grant[side] === G.turn && !G.q[side].some(a => a.t === "move" && a.grant && a.from === li)) return "grant";
  return null;
}
function queueMove(G, side, uid, to) {
  const f = find(G, uid); if (!f || f.li === to) return false;
  const r = moveRight(G, side, f.inst, f.li); if (!r) return false;
  if (r === "cloak" && G.locs[to].cloak !== G.turn && !(G.locs[to].hell && G.locs[to].hell[side] === G.turn)) return false;
  G.q[side].push({ t: "move", uid, to, from: f.li, grant: r === "grant" }); return true;
}
function unqueue(G, side, uid, t) {
  const ix = G.q[side].findIndex(a => a.uid === uid && (!t || a.t === t));
  if (ix < 0) return false;
  const a = G.q[side].splice(ix, 1)[0];
  if (a.t === "play") { G.energy[side] += a.c; G.hand[side].splice(Math.min(a.hi, G.hand[side].length), 0, a.inst); }
  return true;
}

/* ---------- vòng lượt ---------- */
/* luật thêm cho chế độ Hành Trình / Biến Động: G.mods = { p:{}, a:{}, g:{} } (dữ liệu thuần để AI clone được) */
function MD(G, s) { return (G.mods && G.mods[s]) || {}; }
function modPow(G, inst, li) {
  if (!G.mods) return 0;
  const s = inst.side, m = MD(G, s), g = MD(G, "g"), d = C[inst.id], c = d.c, t = C[ab(inst)].t; let p = 0;
  if (m.c1 && c <= 1) p += m.c1; if (m.c2 && c === 2) p += m.c2; if (m.c3 && c === 3) p += m.c3; if (m.c45 && (c === 4 || c === 5)) p += m.c45; if (m.c6 && c >= 6) p += m.c6;
  if (m["t_" + t]) p += m["t_" + t];
  if (m["l" + li]) p += m["l" + li];
  if (m.full && G.locs[li].cards[s].length >= 4) p += m.full;
  if (m.rearly && t === "rev" && inst.turn && inst.turn <= 3) p += m.rearly;
  if (m.all) p += m.all;
  if (g.big56 && c >= 5) p += g.big56; if (g.small12 && c <= 2) p += g.small12;
  return p;
}
/* nâng cấp riêng từng thẻ (chế độ Tuyển chọn / Chinh phục): p +sức mạnh, c -năng lượng, g lớn dần mỗi cuối lượt, ch cổ vũ khi lật, iv bất hoại */
function applyUpg(c, u) {
  if (!u) return;
  if (u.p) c.bp = C[c.id].p + u.p;
  if (u.c) c.cm -= u.c;
  if (u.g) c.ug_g = u.g;
  if (u.ch) c.ug_ch = u.ch;
  if (u.iv) c.ug_iv = 1;
  for (const k of ["mv", "rr", "ds", "wk", "dr", "en", "de", "sh"]) if (u[k]) c["ug_" + k] = u[k];
  c.ug = (u.n || 0);
}
function newGame(deckP, deckA, opts) {
  opts = opts || {};
  const G = {
    uid: 0, rs: (opts.seed != null ? opts.seed : Math.floor(Math.random() * 4294967296)) | 0,
    turn: 0, phase: "play", first: "p", newLoc: -1,
    energy: { p: 0, a: 0 }, nextBonus: { p: 0, a: 0 }, unspent: { p: 0, a: 0 },
    stake: 1, pendingDouble: 0, snap: { p: false, a: false }, retreatChecked: 0,
    locs: [], deck: { p: [], a: [] }, hand: { p: [], a: [] }, disc: { p: [], a: [] }, dead: { p: [], a: [] },
    q: { p: [], a: [] }, lastRev: { p: null, a: null },
    cnt: { disc: { p: 0, a: 0 }, dest: 0, moves: { p: 0, a: 0 }, movedTurn: { p: 0, a: 0 }, playedNow: { p: 0, a: 0 }, playedLast: { p: 0, a: 0 }, missed: 0, destPow: 0, allSpent: { p: 0, a: 0 }, unspentTurns: { p: 0, a: 0 }, two: { p: 0, a: 0 }, revT: { p: 0, a: 0 }, crPlayed: { p: 0, a: 0 }, discTurns: { p: 0, a: 0 }, discLast: { p: 0, a: 0 }, one: { p: 0, a: 0 }, crCost: { p: 0, a: 0 }, destOwn: { p: 0, a: 0 }, mvPlayed: { p: 0, a: 0 }, movedPrev: false },
    forge: { p: 0, a: 0 }, maxE: { p: 0, a: 0 }, lastPlay: { p: 0, a: 0 }, prevPlay: { p: 0, a: 0 }, zero: { p: false, a: false }, shuri: { p: 0, a: 0 }, unspentPrev: { p: 0, a: 0 }, costUp: 0, costCap: 0, noLoc: 0, lastMove: { p: null, a: null }, destLoc: { p: [0, 0, 0], a: [0, 0, 0] }, usStreak: { p: 0, a: 0 }, stones: { p: 0, a: 0 }, arana: { p: false, a: false }, grapple: { p: 0, a: 0 }, omega: { p: 0, a: 0 }, swan: { p: 0, a: 0 }, endTwice: { p: 0, a: 0 }, arishem: { p: false, a: false }, hideT: 0, sling: { p: 0, a: 0 }, ltp: { p: 0, a: 0 }, bonusNow: { p: 0, a: 0 }, start: { p: deckP.slice(), a: deckA.slice() }, lockjaw: { p: false, a: false }, agatha: { p: false, a: false }, fist: { p: false, a: false }, ph: { p: [0, 0, 0], a: [0, 0, 0] }, uatu: { p: false, a: false },
    s6: { p: null, a: null }, tff: { p: false, a: false }, shots: { p: [], a: [] }, nico: { p: 0, a: 0 },
    depth: 0, msgs: [], evs: [], msg: "", result: null
  };
  const ids = opts.locs || shuffle(G, Object.keys(LOC)).slice(0, 3);
  G.locs = ids.map(id => ({ id, rvl: false, cards: { p: [], a: [] }, lock: { p: 0, a: 0 }, trapT: { p: 0, a: 0 }, trapA: { p: 0, a: 0 }, bless: { p: 0, a: 0 }, grant: { p: 0, a: 0 } }));
  const decks = { p: deckP, a: deckA };
  /* hiệu ứng Đầu Ván để giao diện diễn lại: thẻ nguồn, nơi nhận (deck/hand/none), các thẻ được thêm */
  G.startFx = []; const BASE = {}, SF = (s, id, to, add) => { G.startFx.push({ s, id, to, add: add || [] }); if (to === "deck" || to === "hand") for (const c of G[to][s]) if (!BASE[s].has(c.uid)) { c.cr = true; if (!c.by) c.by = id; } };
  for (const s of SIDES) {
    G.deck[s] = shuffle(G, decks[s]).map(id => mk(G, id, s));
    BASE[s] = new Set(G.deck[s].map(c => c.uid));
    if (opts.upg && opts.upg[s]) for (const c of G.deck[s]) applyUpg(c, opts.upg[s][c.id]);
    let n = 3; G.uatu[s] = decks[s].includes("kequansat");
    { const kx = G.deck[s].findIndex(c => c.id === "kechinhphatthoigian"); if (kx >= 0) { G.deck[s].splice(kx, 1); for (let k = 0; k < 4; k++) { const c = mk(G, "kechinhphatthoigian", s); c.ab = pick(G, COLLECT.filter(id => C[id].c >= 3 && C[id].t !== "start" && id !== "kechinhphatthoigian")); G.deck[s].push(c); } SF(s, "kechinhphatthoigian", "deck", [0, 0, 0, 0].map(() => "kechinhphatthoigian")); G.deck[s] = shuffle(G, G.deck[s]); } }
    { const sx = G.deck[s].findIndex(c => c.id === "lucac"); if (sx >= 0) { G.s6[s] = { c: G.deck[s].splice(sx, 1)[0], m: 0, n: 0, last: -1, done: false }; SF(s, "lucac", "none"); } }
    if (decks[s].includes("hacdiemchua")) { G.hand[s].push(mk(G, "nghithuctrieuhoii", s)); SF(s, "hacdiemchua", "hand", ["nghithuctrieuhoii"]); }
    if (decks[s].includes("quyensuthaphoan")) { G.hand[s].push(mk(G, "thaphoan", s)); SF(s, "quyensuthaphoan", "hand", ["thaphoan"]); }
    G.tff[s] = decks[s].includes("bavuongmienvien");
    for (const c of G.deck[s]) if (c.id === "tamtudo") c.xab = roAbs(G);
    if (decks[s].includes("phanquanthiengioi")) { G.arishem[s] = true; const ad = []; for (let k = 0; k < 12; k++) { const c = mk(G, pick(G, COLLECT), s); ad.push(c.id); G.deck[s].push(c); } SF(s, "phanquanthiengioi", "deck", ad); G.deck[s] = shuffle(G, G.deck[s]); }
    if (decks[s].includes("conhansu")) { for (const a of ARCANA) G.deck[s].push(mk(G, a, s)); SF(s, "conhansu", "deck", ARCANA.slice()); G.deck[s] = shuffle(G, G.deck[s]); }
    if (decks[s].includes("tieukhonglo")) SF(s, "tieukhonglo", "none"); if (decks[s].includes("tienhoasu")) SF(s, "tienhoasu", "none"); if (G.uatu[s]) SF(s, "kequansat", "none");
    for (const c of G.deck[s]) {
      if (c.id === "tieukhonglo") c.ab = pick(G, COLLECT.filter(id => C[id].c === 6 && id !== "tieukhonglo" && C[id].t !== "start"));
      else if (decks[s].includes("tienhoasu") && EVO[c.id]) c.ab = EVO[c.id];
    }
    if (decks[s].includes("bavuongtim")) { for (const a of STONE6) G.deck[s].push(mk(G, a, s)); SF(s, "bavuongtim", "deck", STONE6.slice()); G.deck[s] = shuffle(G, G.deck[s]); }
    if (decks[s].includes("bayxacnuotsao")) { const pool = shuffle(G, G.deck[s].filter(c => c.id !== "bayxacnuotsao" && !SKILLS.includes(c.id))).slice(0, 6); for (const c of pool) c.zg = true; SF(s, "bayxacnuotsao", "none"); }
    const ai = G.deck[s].findIndex(c => c.id === "laophuthuy"); G.agatha[s] = ai >= 0;
    if (ai >= 0) { G.hand[s].push(G.deck[s].splice(ai, 1)[0]); n--; SF(s, "laophuthuy", "hand", ["laophuthuy"]); }
    const gi = G.deck[s].findIndex(c => is(G, c, "ngantoc"));
    if (gi >= 0) { G.hand[s].push(G.deck[s].splice(gi, 1)[0]); n--; }
    if (opts.mods && opts.mods[s] && opts.mods[s].h1) n += opts.mods[s].h1;
    for (let k = 0; k < n; k++) draw(G, s);
    if (opts.mods && opts.mods[s] && opts.mods[s].tc) for (const c of G.hand[s]) c.cm -= opts.mods[s].tc;
  }
  G.open = { p: G.hand.p.map(c => c.id), a: G.hand.a.map(c => c.id) };
  if (opts.mods) G.mods = { p: opts.mods.p || {}, a: opts.mods.a || {}, g: opts.mods.g || {} };
  startTurn(G);
  if (G.mods && G.mods.g.revAll) { for (let i = 0; i < 3; i++) if (!G.locs[i].rvl) revealLoc(G, i); }
  else if (G.mods && (G.mods.p.chieu || G.mods.a.chieu) && !G.locs[1].rvl) revealLoc(G, 1);
  G.live = true; /* từ đây mọi thẻ sinh thêm đều là "thẻ được tạo" */
  return G;
}
function onDrawn(G, s, c) {
  c.dr = G.turn;
  if (G.s6[s] && G.s6[s].m < 6 && !SKILLS.includes(c.id)) { c.evil = true; G.s6[s].m++; }
  if (c.id === "trungphatcogiap" && c.mk == null) { const ls = [0, 1, 2].filter(l => !G.locs[l].gone && !G.locs[l].cards[s].length); if (ls.length) { c.mk = pick(G, ls); c.mkn = c.mk + 1; if (s === "p") log(G, C[c.id].n + " đánh dấu chiến địa " + c.mkn); } }
  for (const [k, l] of boardCards(G, s)) if (!k.sil) {
    if (is(G, k, "thuynu") && G.locs[l].cards[s].length === 1) c.cm -= 1;
    else if (is(G, k, "vouyamdia") && pw0(c) >= 6) k.bonus += 2;
  }
  for (const [k, l] of boardCards(G, s)) if (!k.sil && is(G, k, "phaohoanganha")) c.bonus += Math.max(0, power(G, k, l));
  if (c.id === "nhaihinh" && !c.sil && !c.ab) { const od = G.deck[other(s)]; if (od.length) c.ab = ab(od[0]); }
}
function draw(G, s) {
  const h = G.hand[s], n = h.length, r = draw1(G, s);
  if (r && h.length > n) onDrawn(G, s, h[h.length - 1]);
  return r;
}
function draw1(G, s) { // May Mắn Nữ: luôn rút ở lượt 2, không sớm hơn
  const d = G.deck[s]; if (!d.length || G.hand[s].length >= HAND_MAX) return false;
  if (G.hand[s].some(c => is(G, c, "vetcandoc"))) return false;
  const di = d.findIndex(c => is(G, c, "maymannu") && !c.sil);
  if (di >= 0) {
    if (G.turn === 2) { G.hand[s].push(d.splice(di, 1)[0]); return true; }
    if (G.turn < 2 && di === d.length - 1) { if (d.length < 2) return false; G.hand[s].push(d.splice(d.length - 2, 1)[0]); return true; }
  }
  return drawRaw(G, s);
}
function revealLoc(G, li, old) {
  const L = G.locs[li]; L.rvl = true; G.newLoc = li; const lo = { li }; if (old !== undefined) lo.old = old; ev(G, "loc", lo);
  switch (L.id) {
    case "village": draw(G, "p"); draw(G, "a"); break;
    case "terrace": G.nextBonus.p += 1; G.nextBonus.a += 1; break;
    case "market": for (const s of SIDES) discard(G, s, pick(G, G.hand[s])); break;
    case "den": for (const s of SIDES) summon(G, s, "thuhoang", li); break;
    case "mirror":
      for (const s of SIDES) for (const c of shown(G, li, s)) { const pool = COLLECT.filter(id => C[id].c === C[c.id].c && id !== c.id); if (pool.length) transform(G, c, pick(G, pool)); }
      break;
    case "blackmarket":
      for (const s of SIDES) { const src = pick(G, G.deck[other(s)]); if (src && G.hand[s].length < HAND_MAX) G.hand[s].push(clone1(G, src, s)); }
      break;
    default: { const X = LXF[L.id]; if (X && X.rev) X.rev(G, li); }
  }
}
function startTurn0(G) {
  G.turn++; G.newLoc = -1; G.depth = 0; if (G.msgs) G.msgs.length = 0; if (G.evs) G.evs.length = 0;
  if (G.pendingDouble) { G.stake = Math.min(8, G.stake * Math.pow(2, G.pendingDouble)); G.pendingDouble = 0; }
  for (const s of SIDES) { G.cnt.movedTurn[s] = 0; G.bonusNow[s] = G.nextBonus[s]; if (G.bonusNow[s] > 0) for (const [k] of boardCards(G, other(s))) if (!k.sil && is(G, k, "catlun") && !k.used) { k.used = true; G.bonusNow[s] = 0; break; }
    G.energy[s] = Math.max(0, G.turn + G.maxE[s] + G.bonusNow[s]); G.nextBonus[s] = 0; }
  for (const s of SIDES) for (const [k, l] of boardCards(G, s)) if (!k.sil) {
    if (is(G, k, "loanxa") && G.bonusNow[other(s)] > 0) { G.bonusNow[other(s)]--; G.energy[other(s)] = Math.max(0, G.energy[other(s)] - 1); G.energy[s]++; ev(G, "skill", { uid: k.uid, t: "end" }); }
    else if (is(G, k, "hauduethoikhong") && lead(G, l) === s) k.lv = Math.min(6, (k.lv || 1) + 1);
  }
  for (const s of SIDES) {
    if (G.turn === 3 && G.arishem[s]) { G.maxE[s] += 1; G.energy[s] += 1; }
    for (const [k, l] of boardCards(G, s)) if (!k.sil) {
      if (k.id === "khoibang") { G.energy[s] += 1; if (G.locs[l].cards[s].length >= cap(G, l)) destroy(G, k, l); }
      else if (is(G, k, "hoanhanmay")) k.bonus += Math.max(0, G.bonusNow[s]);
      else if (is(G, k, "bato")) G.locs[l].grant[s] = G.turn;
    }
  }
  if (G.turn <= 3 && !G.locs[G.turn - 1].rvl) revealLoc(G, G.turn - 1);
  for (let i = 0; i < 3; i++) { const L = G.locs[i]; if (lon(G, L) && L.id === "crystal") { const w = lead(G, i); if (w) { G.energy[w] += 1; ev(G, "egain", { li: i, side: w }); } } }
  for (const s of SIDES) for (const [c, l] of boardCards(G, s)) if (!c.sil && is(G, c, "xuyentuongnu") && bounce(G, c, l)) c.bonus += 1;
  for (const s of SIDES) for (const [k, l] of boardCards(G, s)) if (!k.sil) {
    if (is(G, k, "huyenconu")) { if (lead(G, l) === s) { for (const c of G.hand[s]) c.bonus += 1; } else { const ol = otherLocs(G, l, s); if (ol.length) moveCard(G, k, l, pick(G, ol)); } }
    else if (is(G, k, "nhenthuongdang") && boardCards(G, s).some(([c]) => c.bonus > 0)) G.energy[s] += 1;
  }
  for (const s of SIDES) draw(G, s);
  for (const s of SIDES) if (G.hand[s].length >= HAND_MAX) for (const [k] of boardCards(G, s)) if (!k.sil && is(G, k, "cuongtri")) k.bonus += 2;
  G.phase = "play";
}
function priority(G) {
  let w = { p: 0, a: 0 }, tp = 0, ta = 0;
  for (let i = 0; i < 3; i++) { const l = lead(G, i); if (l) w[l]++; tp += locPower(G, i, "p"); ta += locPower(G, i, "a"); }
  if (w.p !== w.a) return w.p > w.a ? "p" : "a";
  if (tp !== ta) return tp > ta ? "p" : "a";
  return rnd(G) < 0.5 ? "p" : "a";
}
function beginReveal(G) {
  G.phase = "reveal"; G.depth = 0; if (G.msgs) G.msgs.length = 0; if (G.evs) G.evs.length = 0;
  for (const s of SIDES) { G.cnt.playedNow[s] = G.q[s].filter(a => a.t === "play").length; G.unspent[s] = G.energy[s]; }
  G.ph = { p: [0, 0, 0], a: [0, 0, 0] };
  const first = priority(G); G.first = first;
  const order = [first, other(first)];
  for (const pass of [0, 1]) for (const s of order) for (const a of G.q[s]) {
    if (a.t !== "play") continue;
    const cross = a.row !== s;
    if ((pass === 1) !== cross) continue;
    const inst = a.inst; inst.turn = G.turn; inst.played = true; inst.ps = (G.pseq = (G.pseq || 0) + 1);
    if (G.locs[a.li].cards[a.row].length < cap(G, a.li)) { inst.side = a.row; G.locs[a.li].cards[a.row].push(inst); a.ok = true; G.ph[s][a.li]++; }
    else { a.ok = false; inst.side = s; if (G.hand[s].length < HAND_MAX) G.hand[s].push(inst); }
  }
  const steps = [];
  for (const s of order) for (const a of G.q[s]) steps.push({ s, t: a.t, uid: a.uid, to: a.to, ok: a.ok, grant: a.grant });
  G.q = { p: [], a: [] };
  return steps;
}
/* hiệu ứng chiến địa lên thẻ vừa đặt: chạy SAU khi kỹ năng Lật của thẻ xong; dùng chiến địa hiện tại (nếu thẻ đã đổi/huỷ chiến địa thì hiệu ứng cũ không chạy) */
function locPlay(G, inst, li) {
  const L = G.locs[li]; if (!L || locOf(G, inst) !== li) return;
  if (lon(G, L) && L.id === "forge") { inst.bonus += 2; ev(G, "locfx", { li }); }
  if (lon(G, L) && L.id === "gate" && G.turn === turns(G)) inst.bonus += 3;
  const X = LX(G, L); if (X && X.play) { X.play(G, inst, li); ev(G, "locfx", { li }); }
}
function revealCard(G, inst, li, by) {
  const L = G.locs[li], d = C[inst.id], s = inst.side, o = other(s);
  inst.rev = true;
  if (inst.id === "tamtudo" && !inst.xab && !inst.ab) inst.xab = roAbs(G);
  log(G, (by === "p" ? "Bạn" : "Máy") + " lật " + d.n); ev(G, "flip", { uid: inst.uid, id: inst.id, own: inst.own });
  if (L.bless[s]) { inst.bonus += L.bless[s]; L.bless[s] = 0; }
  if (G.mods && MD(G, s).firstrev && inst.played && !(G.fr && G.fr[s] === G.turn)) { G.fr = G.fr || {}; G.fr[s] = G.turn; inst.bonus += MD(G, s).firstrev; log(G, "Bánh Chưng: " + d.n + " +" + MD(G, s).firstrev + " sức mạnh"); }
  if (inst.ug_ch && !inst.sil) { for (const k of L.cards[s]) if (k !== inst) k.bonus += inst.ug_ch; log(G, d.n + " cổ vũ: +" + inst.ug_ch + " sức mạnh cho các thẻ khác của bạn tại đây"); }
  if (!inst.sil) {
    if (inst.ug_ds) { const t = L.cards[o].filter(k => k.rev && power(G, k, li) <= 2).sort((a, b) => power(G, a, li) - power(G, b, li))[0]; if (t) { log(G, d.n + " (nâng cấp): tiêu huỷ " + C[t.id].n); destroy(G, t, li); } }
    if (inst.ug_wk) { const ts = L.cards[o].filter(k => k.rev); if (ts.length) { const t = pick(G, ts); hurt(G, t, li, 2); log(G, d.n + " (nâng cấp): −2 sức mạnh " + C[t.id].n); } }
    if (inst.ug_dr) { draw(G, s); log(G, d.n + " (nâng cấp): rút 1 thẻ"); }
    if (inst.ug_en) { G.nextBonus[s] += 1; log(G, d.n + " (nâng cấp): lượt sau +1 năng lượng"); }
  }
  if (G.lockjaw[s] && inst.played && G.deck[s].length) {
    G.lockjaw[s] = false; const dk = G.deck[s], kx = Math.floor(rnd(G) * dk.length), nw = dk[kx], arr = L.cards[s];
    dk[kx] = inst; inst.played = false; inst.turn = 0; arr[arr.indexOf(inst)] = nw; nw.side = s; nw.turn = G.turn; nw.played = true;
    log(G, d.n + " đổi chỗ với " + C[nw.id].n + " từ bộ bài"); ev(G, "morph", { uid: nw.uid });
    return revealCard(G, nw, li, by);
  }
  G.prevPlay[s] = G.lastPlay[s];
  const aranaNow = G.arana[s] && inst.played; if (aranaNow) G.arana[s] = false;
  const grapNow = inst.played ? G.grapple[s] : 0; if (grapNow) G.grapple[s] = 0;
  const omegaNow = inst.played ? G.omega[s] : 0; if (omegaNow) G.omega[s] = 0;
  if (inst.played) {
    for (const k of shown(G, li, s)) if (k !== inst && !k.sil && is(G, k, "caheocon")) inst.bonus += 1;
    for (const [k, kl] of boardCards(G, s)) if (k !== inst && !k.sil && is(G, k, "ainunuotsao") && kl !== li && k.gt !== G.turn) { k.gt = G.turn; inst.bonus += 2; }
  }
  if (G.zero[s] && !is(G, inst, "sokhong")) { G.zero[s] = false; inst.sil = true; inst.silBy = "sokhong"; ev(G, "sil", { uid: inst.uid }); log(G, d.n + " mất kỹ năng"); }
  const shuriAt = G.shuri[s]; if (shuriAt) G.shuri[s] = 0;
  if (G.forge[s]) { inst.bonus += G.forge[s]; G.forge[s] = 0; }
  const fistNow = G.fist[s]; if (fistNow) G.fist[s] = false;
  if (L.trapT[o] === G.turn) hurt(G, inst, li, L.trapA[o]);
  if ((C[ab(inst)].t === "rev" || !!REV[ab(inst)]) && !inst.sil) {
    if ((lon(G, L) && L.id === "watch") || hasOn(G, li, o, "khuyenduhanh") || hasOn(G, li, s, "khuyenduhanh")) { log(G, "Kỹ năng Lật bị chặn"); ev(G, "blocked", { uid: inst.uid }); }
    else {
      const fn = REV[ab(inst)]; let n = lon(G, L) && L.id === "arena" ? 2 : 1;
      if (inst.ug_rr) n = Math.min(4, n + 1);
      for (const k of shown(G, li, s)) if (k !== inst && !k.sil && is(G, k, "thuthu")) n = Math.min(4, n * 2);
      for (const k of shown(G, li, s)) if (k !== inst && !k.sil && (is(G, k, "datamtri") || (is(G, k, "phiungtre") && C[inst.id].c === 1))) n = Math.min(4, n * 2);
      if (fn) ev(G, "skill", { uid: inst.uid, t: "rev" });
      const sv = G.srcU; G.srcU = inst.uid;
      for (let k = 0; k < n && fn; k++) { const cur = locOf(G, inst); if (cur < 0) break; G.depth = 0; fn(G, inst, cur); }
      G.srcU = sv;
      G.lastRev[s] = inst.id;
    }
  }
  for (const [c, l] of boardCards(G, s)) if (c !== inst && !c.sil) { if (is(G, c, "hapnangthu")) c.bonus += 1; else if (is(G, c, "thanhkiemnu") && l === li) c.bonus += 1; }
  if (SKILLS.includes(inst.id)) { locPlay(G, inst, li); const a = G.locs[li].cards[s], ix = a.indexOf(inst); if (ix >= 0) a.splice(ix, 1); for (const [k] of boardCards(G, s)) if (!k.sil && is(G, k, "quytu")) k.bonus += 1; G.lastPlay[s] = inst.uid; return; }
  if (MOVERS.includes(ab(inst))) G.cnt.mvPlayed[s]++;
  if (inst.played && locOf(G, inst) >= 0) {
    const bc = C[inst.id].c; if (bc === 1) G.cnt.one[s] = G.turn;
    if (G.tff[s] && inst.dr === G.turn) { const k = Math.floor(rnd(G) * 6); G.shots[s].push(k); log(G, "Nạp Phát Bắn " + SHOTN[k]); }
    for (const g of G.hand[s].concat(boardCards(G, s).map(e => e[0]))) if (g !== inst && !g.sil && !g.her && is(G, g, "kenuotsaosokhai")) g.her = inst.uid;
    if (inst.evil && G.s6[s] && !G.s6[s].done) { inst.evp = true; G.s6[s].n++; G.s6[s].last = li; }
    if (C[ab(inst)].t === "rev" || !!REV[ab(inst)]) for (const [k, kl] of boardCards(G, s)) if (k !== inst && !k.sil && !k.done && is(G, k, "loantuong")) { k.q = (k.q || 0) + 1; if (k.q >= 3) { k.done = true; const t = lowHigh(G, G.hand[s].filter(c => !c.sil && (C[ab(c)].t === "rev" || !!REV[ab(c)]) && REV[ab(c)] && !SKILLS.includes(c.id)), 1); if (t && G.depth < 6) { G.depth++; ev(G, "skill", { uid: k.uid, t: "react" }); log(G, "Dùng kỹ năng Lật của " + C[t.id].n); REV[ab(t)](G, k, kl); } } }
    if (C[ab(inst)].t === "rev" || !!REV[ab(inst)]) G.cnt.revT[s] = G.turn;
    if (inst.cr) G.cnt.crPlayed[s]++;
    if (STONE6.includes(inst.id)) G.stones[s]++;
    if (inst.surge) { inst.surge = false; surge(G, s, inst.uid); }
    for (const sd of SIDES) for (const [k, kl] of boardCards(G, sd)) if (k !== inst && !k.sil) {
      if (sd === s && is(G, k, "hoamavuong") && power(G, inst, li) >= 10) k.bonus += 2;
      else if (sd === s && is(G, k, "xachongphuthuy") && kl === li) horde(G, s, 2);
      else if (sd !== s && is(G, k, "chonvacay") && kl === li) { inst.bonus -= 1; k.bonus += 1; k.stl = true; }
    }
    for (const k of shown(G, li, s)) if (k.id === "nuhondoc" && L.cards[s].length >= cap(G, li)) destroy(G, k, li);
    if ((bc === 3 || bc === 4) && (hasOn(G, li, "p", "saotrongdau") || hasOn(G, li, "a", "saotrongdau")) && !is(G, inst, "saotrongdau")) { const ol = otherLocs(G, li, s); if (ol.length) moveCard(G, inst, li, pick(G, ol)); }
    if (inst.cr) G.cnt.crCost[s] += bc;
    for (const [k] of boardCards(G, s)) if (!k.sil && is(G, k, "kysibaitu") && !k.done && G.cnt.crCost[s] - (k.base || 0) >= 6) {
      k.done = true; const sv = G.srcU; G.srcU = k.uid;
      ev(G, "skill", { uid: k.uid, t: "react" }); log(G, C[k.id].n + " hoàn thành Nhiệm Vụ!");
      let left = 3; for (const e of shuffle(G, boardCards(G, o))) if (C[e[0].id].c <= left && destroy(G, e[0], e[1])) left -= C[e[0].id].c;
      G.srcU = sv;
    }
    for (const [k, kl] of boardCards(G, s)) if (k !== inst && !k.sil) {
      if (is(G, k, "kysidaoquoc") && bc >= 4) { inst.bonus += 1; const t = pick(G, G.hand[s]); if (t) t.cm -= 1; }
      else if (is(G, k, "hoatinhnu") && bc === 6 && !k.used) { k.used = true; k.bonus += power(G, k, kl); }
      else if (is(G, k, "hyvong") && kl === li) G.nextBonus[s] += 1;
      else if (is(G, k, "laonhen") && kl === li && power(G, inst, li) > power(G, k, kl)) { k.bonus += 2; const ol = otherLocs(G, kl, s); if (ol.length) moveCard(G, k, kl, pick(G, ol)); }
    }
    if (aranaNow) { inst.bonus += 1; const cur = locOf(G, inst); if (cur >= 0 && cur < 2) moveCard(G, inst, cur, cur + 1); }
    if (grapNow) { const cur = locOf(G, inst); if (cur >= 0 && cur !== grapNow - 1) moveCard(G, inst, cur, grapNow - 1); }
    if (omegaNow) { const f = find(G, omegaNow), cur = locOf(G, inst); if (f && cur >= 0) { const v = power(G, inst, cur); if (destroy(G, inst, cur)) f.inst.bonus += v; return; } }
  }
  if (locOf(G, inst) === li && inst.side === s) {
    if (L.cards[s].length >= cap(G, li) && boardCards(G, s).some(([k]) => k !== inst && !k.sil && is(G, k, "thosanhuyetthach"))) inst.bonus += 2;
    const ag = shown(G, li, s).find(k => k !== inst && !k.sil && is(G, k, "thongkho")); if (ag) { inst.bonus += pw0(ag); const a = L.cards[s]; a.splice(a.indexOf(ag), 1); log(G, C[ag.id].n + " hợp thể vào " + d.n); }
    if (li !== 1 && shown(G, li, s).some(k => k !== inst && !k.sil && is(G, k, "hoangngoc"))) moveCard(G, inst, li, 1);
    if (C[ab(inst)].t === "rev" || !!REV[ab(inst)]) for (const [k, kl] of boardCards(G, s)) if (k !== inst && !k.sil && is(G, k, "nguoisoidem")) { const cur = locOf(G, inst); if (cur >= 0 && kl !== cur && moveCard(G, k, kl, cur)) k.bonus += 2; }
  }
  if (shuriAt === li + 1 && locOf(G, inst) === li) inst.bonus += pw0(inst);
  G.lastPlay[s] = inst.uid;
  if (locOf(G, inst) === li && inst.side === s) {
    for (const k of shown(G, li, o)) if (!k.sil) {
      if (is(G, k, "vonganh") && d.t === "on" && !inst.sil) { inst.sil = true; inst.silBy = "vonganh"; ev(G, "sil", { uid: inst.uid, src: k.uid }); log(G, d.n + " mất kỹ năng"); }
      else if (is(G, k, "daudanthieunu") && !k.used && inst.played) { k.used = true; destroy(G, inst, li); break; }
    }
    for (const [sd, k] of SIDES.flatMap(x => shown(G, li, x).map(c => [x, c]))) if (k !== inst && !k.sil && locOf(G, k) === li && k.side === sd) {
      if (is(G, k, "tonu")) { const ol = otherLocs(G, li, sd); if (ol.length) moveCard(G, k, li, pick(G, ol)); }
      else if (is(G, k, "lucnu")) sw(G, k, li);
    }
  }
  if (fistNow) { const cur = locOf(G, inst); if (cur > 0 && inst.rev) moveCard(G, inst, cur, cur - 1); }
  locPlay(G, inst, li);
  if (lon(G, L) && L.id === "abyss" && G.turn > 4 && inst.played && G.locs[li].cards[inst.side].includes(inst)) destroy(G, inst, li);
  if (inst.played && G.nico[s] && G.nico[s] !== inst.uid) { const nu = G.nico[s]; G.nico[s] = 0; nicoCast(G, nu, inst, s); }
}
function roAbs(G) { return shuffle(G, COLLECT.filter(id => C[id].t === "on" && id !== "tamtudo" && id !== "sieudihinh" && id !== "nguyetthach")).slice(0, 3); }
function nicoCast(G, nu, inst, s) {
  const cur = locOf(G, inst); if (cur < 0) return; const k = G.turn % 7, f = find(G, nu); if (f) ev(G, "skill", { uid: nu, t: "react" });
  if (k === 0) transform(G, inst, "quy");
  else if (k === 1) { if (destroy(G, inst, cur)) { draw(G, s); draw(G, s); } }
  else if (k === 2) { if (cur < 2) moveCard(G, inst, cur, cur + 1); }
  else if (k === 3) inst.bonus += 2;
  else if (k === 4) newLoc(G, cur);
  else if (k === 5) toHand(G, s, clone1(G, inst, s), true);
  else if (f) f.inst.bonus += Math.max(0, pw0(f.inst));
}
function dorm(G, s) { return G.hand[s].find(c => c.id === "hacdiemchua") || G.deck[s].find(c => c.id === "hacdiemchua"); }
function s6Check(G) {
  for (const s of SIDES) { const x = G.s6[s]; if (!x || x.done || x.n < 6) continue; x.done = true; let sum = 0;
    for (const [k, kl] of boardCards(G, s)) if (k.evp) { sum += Math.max(0, pw0(k)); const a = G.locs[kl].cards[s]; a.splice(a.indexOf(k), 1); }
    let l = x.last; if (l < 0 || !space(G, l, s)) l = [0, 1, 2].find(i => space(G, i, s)); if (l == null) continue;
    x.c.bonus += sum; place(G, x.c, l, s); log(G, C[x.c.id].n + " hợp thể 6 thẻ, +" + sum); }
}
function empScan(G) {
  for (const s of SIDES) {
    const vn = boardCards(G, s).filter(([k]) => !k.sil && is(G, k, "thanai")).length;
    const all = boardCards(G, s).map(e => [e[0], 2]).concat(G.hand[s].map(c => [c, 1]), G.deck[s].map(c => [c, 0]));
    for (const [c, z] of all) {
      if (c.eb == null || c.bonus <= c.eb) { c.eb = c.bonus; continue; }
      if (z === 2 && vn) c.bonus += vn;
      const dlt = c.bonus - c.eb;
      if (!c.sil) {
        if (is(G, c, "hapkinh")) { c.bonus += 2; if (z === 2) ev(G, "skill", { uid: c.uid, t: "react" }); }
        else if (z && is(G, c, "hoathuatnu")) { toHand(G, s, mk(G, "luahacdiem", s), true); if (z === 2) ev(G, "skill", { uid: c.uid, t: "react" }); }
        else if (z && is(G, c, "lanvuong")) { const n = mk(G, pick(G, COLLECT.filter(id => C[id].c === 1)), s); n.bonus = dlt; n.eb = dlt; toHand(G, s, n, true); if (z === 2) ev(G, "skill", { uid: c.uid, t: "react" }); }
      }
      c.eb = c.bonus;
    }
  }
}
function startExtra(G) {
  for (let li = 0; li < 3; li++) { const X = LX(G, G.locs[li]); if (X && X.start) { ev(G, "locfx", { li, ph: "s" }); X.start(G, li); } }
  if (G.mods) {
    const g = MD(G, "g");
    for (const s of SIDES) { const m = MD(G, s);
      if (m["e" + G.turn]) G.energy[s] += m["e" + G.turn];
      if (g.eAll) G.energy[s] += g.eAll;
      if (m.d4 && G.turn === 4) draw(G, s);
      if (g.drawX && G.turn > 1) draw(G, s);
    }
    if (g.steal && G.turn >= 2 && G.hand.p.length) { const h = G.hand.p, k = Math.floor(rnd(G) * h.length), c = h.splice(k, 1)[0]; G.deck.p.unshift(c); log(G, "Hồ Tinh mê hoặc: " + C[c.id].n + " bị trả về đáy bộ bài của bạn"); ev(G, "locfx", { li: 1 }); }
  }
  for (const s of SIDES) for (const [k] of boardCards(G, s)) if (!k.sil) {
    if (is(G, k, "phapsugia")) { toHand(G, s, mk(G, pick(G, INCANT), s), true); ev(G, "skill", { uid: k.uid, t: "end" }); }
    else if (is(G, k, "nuhoanghonmang")) { const c = mk(G, pick(G, SKILLS), s); if (toHand(G, s, c, true)) { c.z0 = G.turn; c.z0c = C[c.id].c; c.cm -= c.z0c; ev(G, "skill", { uid: k.uid, t: "end" }); } }
  }
}
function runBoardQuest(G, c, l) {
  if (!c || !c.rev || c.sil || c.done) return false;
  const s = c.side, o = other(s);
  const fire = (msg, fn) => {
    c.done = true; const sv = G.srcU; G.srcU = c.uid;
    ev(G, "skill", { uid: c.uid, t: "react" });
    if (msg) log(G, msg);
    fn();
    G.srcU = sv;
    return true;
  };
  if (is(G, c, "kysituduc") && (c.prog || 0) >= 4 && G.dead[s].length && space(G, l, s) && !profX(G, l)) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { const t = pick(G, G.dead[s]); if (t && revive(G, s, t, l)) t.bonus += 5; });
  }
  if (is(G, c, "kysibaitu") && G.cnt.crCost[s] - (c.base || 0) >= 6) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { let left = 3; for (const e of shuffle(G, boardCards(G, o))) if (C[e[0].id].c <= left && destroy(G, e[0], e[1])) left -= C[e[0].id].c; });
  }
  if (is(G, c, "kysidichkhuyen") && boardCards(G, s).filter(([k]) => C[k.id].c >= 4).length >= 3) {
    const foes = boardCards(G, o).map(e => e[0]);
    if (foes.length) return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { const t = lowHigh(G, foes, 1); if (t) hurt(G, t, locOf(G, t), 6); });
  }
  if (is(G, c, "kysichienxa") && new Set(boardCards(G, s).filter(([k]) => k !== c).map(([k, kl]) => power(G, k, kl))).size >= 6) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ (+6 sức mạnh)!", () => { c.bonus += 6; });
  }
  if (is(G, c, "kysinguyetyeu") && boardCards(G, s).filter(([k]) => C[ab(k)].t === "none").length >= 3) {
    const foes = shown(G, l, o);
    if (foes.length) return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { const t = pick(G, foes); if (t) { t.bonus -= 5; c.bonus += 5; c.stl = true; } });
  }
  if (is(G, c, "kysitudich")) {
    let n = 0; for (const sd of SIDES) for (const [k] of boardCards(G, sd)) if (k.bonus < 0) n -= k.bonus;
    if (n >= 5 && G.hand[s].length && space(G, l, s) && !profX(G, l)) {
      return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { const h = G.hand[s], t = pick(G, h); if (t) { h.splice(h.indexOf(t), 1); place(G, t, l, s); } });
    }
  }
  if (is(G, c, "huyettruonglao") && boardCards(G, s).filter(([k]) => k.stl).length >= 3) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => {
      transform(G, c, "cuthudotham");
      const cur = locOf(G, c); if (cur >= 0 && !c.sil && REV.cuthudotham) REV.cuthudotham(G, c, cur);
    });
  }
  if (is(G, c, "khoinguyenvuong") && [0, 1, 2].every(x => shown(G, x, s).length >= 2)) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => {
      transform(G, c, "matthethientuyen");
      const cur = locOf(G, c); if (cur >= 0 && !c.sil && REV.matthethientuyen) REV.matthethientuyen(G, c, cur);
    });
  }
  if (is(G, c, "kysivuottu") && power(G, c, l) >= 6) {
    return fire(C[c.id].n + " hoàn thành Nhiệm Vụ!", () => { for (const x of [0, 1, 2]) { const t = pick(G, shown(G, x, s)); if (t) t.bonus += 4; } });
  }
  return false;
}
function questScan(G) {
  let any = false;
  for (let pass = 0; pass < 3; pass++) {
    let hit = false;
    for (const s of [G.first || "p", other(G.first || "p")]) {
      for (const [c, l] of boardCards(G, s)) {
        if (locOf(G, c) === l && runBoardQuest(G, c, l)) { hit = true; any = true; }
      }
    }
    if (!hit) break;
  }
  return any;
}
function startTurn(G) { startTurn0(G); startExtra(G); empScan(G); }
function doStep(G, st) { const r = doStep0(G, st); s6Check(G); empScan(G); if (questScan(G)) empScan(G); return r; }
function doStep0(G, st) {
  G.depth = 0; if (G.msgs) G.msgs.length = 0; if (G.evs) G.evs.length = 0;
  if (st.t === "play") {
    if (!st.ok) return false;
    const f = find(G, st.uid); if (!f || f.inst.rev) return false;
    if (shown(G, f.li, st.s).some(k => !k.sil && is(G, k, "annu"))) { f.inst.hid = true; log(G, "Một thẻ được giấu đến cuối ván"); return true; }
    if (G.hideT === G.turn) { f.inst.hid = true; log(G, "Một thẻ được giấu đến cuối ván"); return true; }
    revealCard(G, f.inst, f.li, st.s); return true;
  }
  const f = find(G, st.uid);
  if (!f || !f.inst.rev || f.inst.side !== st.s) return false;
  if (st.t === "act") {
    if (f.inst.sil || f.inst.act || !ACT[ab(f.inst)]) return false;
    f.inst.act = true;
    log(G, (st.s === "p" ? "Bạn" : "Máy") + " kích hoạt " + C[f.inst.id].n); ev(G, "act", { uid: f.inst.uid });
    const fn = ACT[ab(f.inst)]; if (fn) { const sv = G.srcU; G.srcU = f.inst.uid; fn(G, f.inst, f.li); G.srcU = sv; }
    return true;
  }
  if (st.t === "move") {
    const id = f.inst.id;
    if (moveCard(G, f.inst, f.li, st.to)) { f.inst.mvn = (f.inst.mvn || 0) + 1; if (!st.grant) f.inst.mv = true; else if (G.sling[st.s] === G.turn) f.inst.bonus += 1; return true; }
    return false;
  }
  return false;
}
function beginEndTurn(G) {
  const steps = [], order = [G.first || "p", other(G.first || "p")];
  for (const s of order) for (let li = 0; li < 3; li++) for (const inst of G.locs[li].cards[s]) {
    if (inst.rev && !inst.sil && inst.et !== G.turn && inst.side === s && END[ab(inst)]) steps.push({ t: "end_card", uid: inst.uid, s });
  }
  for (let li = 0; li < 3; li++) {
    const L = G.locs[li];
    if (lon(G, L) && (["spring", "volcano", "anthill", "windhill"].includes(L.id) || (LX(G, L) && LX(G, L).end))) steps.push({ t: "end_loc", li });
  }
  if (G.mods) steps.push({ t: "end_mod" });
  for (const s of order) for (const [c] of boardCards(G, s)) {
    if (!c.sil && (c.wait === G.turn || (c.w2 && c.w2.t === G.turn) || (c.ip && c.ip.t === G.turn) || (is(G, c, "lamconu") && c.turn < G.turn) || c.ug_g || (c.her && is(G, c, "kenuotsaosokhai")))) {
      steps.push({ t: "end_delayed", uid: c.uid, s });
    }
  }
  for (const s of order) for (const c of G.hand[s]) {
    if (!c.sil && (is(G, c, "hacmieu") || is(G, c, "thantocnu") || is(G, c, "cuongnhantienhoa") || is(G, c, "cuongnhando") || (c.her && is(G, c, "kenuotsaosokhai")))) {
      steps.push({ t: "end_hand", uid: c.uid, s });
    }
  }
  steps.push({ t: "end_streak" });
  for (const s of order) {
    for (const [c] of boardCards(G, s)) if (!c.sil && !c.done) {
      if (["kysidichkhuyen", "kysichienxa", "kysinguyetyeu", "kysitudich", "huyettruonglao", "khoinguyenvuong", "kysidoibao", "kysivuottu", "kysituduc", "kysibaitu", "trungphatcogiap"].includes(ab(c))) {
        steps.push({ t: "end_quest", uid: c.uid, s });
      }
    }
    for (const g of G.hand[s]) if (!g.sil && !g.done && is(G, g, "trungphatcogiap") && g.mk != null) {
      steps.push({ t: "end_quest", uid: g.uid, s });
    }
  }
  return steps;
}
function stepEndTurn(G, st) {
  G.depth = 0; if (G.msgs) G.msgs.length = 0; if (G.evs) G.evs.length = 0;
  if (st.t === "end_card") {
    const f = find(G, st.uid);
    if (!f || !f.inst.rev || f.inst.sil || f.inst.et === G.turn || f.inst.side !== st.s) return false;
    const inst = f.inst, li = f.li, fn = END[ab(inst)];
    if (!fn) return false;
    inst.et = G.turn;
    const b0 = inst.bonus, evLen0 = G.evs ? G.evs.length : 0, sv = G.srcU;
    G.srcU = inst.uid;
    ev(G, "skill", { uid: inst.uid, t: "end" });
    fn(G, inst, li);
    if (G.endTwice[st.s] === G.turn && G.locs[li].cards[st.s].includes(inst)) fn(G, inst, li);
    G.srcU = sv;
    const changed = inst.bonus !== b0 || (G.evs && G.evs.length > evLen0 + 1) || (G.msgs && G.msgs.length > 0);
    if (!changed && G.evs && G.evs.length === evLen0 + 1) { G.evs.pop(); return false; }
    if (G.msgs && !G.msgs.length) log(G, C[inst.id].n + " kích hoạt Cuối Lượt");
    empScan(G); if (questScan(G)) empScan(G);
    return true;
  }
  if (st.t === "end_loc") {
    const li = st.li, L = G.locs[li];
    if (!lon(G, L)) return false;
    let did = false;
    const X = LX(G, L);
    if (X && X.end) { ev(G, "locfx", { li, ph: "e" }); X.end(G, li); did = true; }
    if (["spring", "volcano", "anthill", "windhill"].includes(L.id)) {
      if (L.id === "volcano" && G.turn !== 4) return did;
      ev(G, "locfx", { li, ph: "e" });
      if (L.id === "spring") { for (const s of SIDES) { const w = weakest(G, shown(G, li, s), li); if (w) { w.bonus += 1; did = true; } } }
      else if (L.id === "volcano" && G.turn === 4) { for (const s of SIDES) for (const c of shown(G, li, s)) if (destroy(G, c, li)) did = true; }
      else if (L.id === "anthill") { const np = L.cards.p.length, na = L.cards.a.length; if (np !== na && summon(G, np < na ? "p" : "a", "kientho", li)) did = true; }
      else if (L.id === "windhill") { for (const s of SIDES) { const w = weakest(G, shown(G, li, s), li), o = otherLocs(G, li, s); if (w && o.length && moveCard(G, w, li, pick(G, o))) did = true; } }
      if (did && G.msgs && !G.msgs.length) log(G, LOC[L.id].n + " kích hoạt");
    }
    if (did) { empScan(G); if (questScan(G)) empScan(G); }
    return did;
  }
  if (st.t === "end_mod") {
    if (!G.mods) return false;
    let did = false;
    const g = MD(G, "g");
    for (const s of SIDES) {
      const m = MD(G, s), bc = boardCards(G, s).map(e => e[0]);
      if (m.t3all && G.turn === 3 && bc.length) { for (const k of bc) k.bonus += m.t3all; did = true; }
      if (m.spent && G.unspent[s] === 0) { const last = bc.filter(k => k.played && k.turn === G.turn).sort((a, b) => b.uid - a.uid)[0]; if (last) { last.bonus += m.spent; did = true; } }
      if (m.colau && G.turn === 5) { let w = 0; for (let i = 0; i < 3; i++) if (lead(G, i) === s) w++; if (w >= 2) { G.nextBonus[s] += 1; did = true; } }
    }
    if (g.flood && G.turn >= 2) {
      let lo = -1, lv = 1e9;
      for (let i = 0; i < 3; i++) { if (!G.locs[i].cards.p.length) continue; const v = locPower(G, i, "p"); if (v < lv) { lv = v; lo = i; } }
      if (lo >= 0) { for (const k of G.locs[lo].cards.p.slice()) hurt(G, k, lo, 1); log(G, "Nước dâng: thẻ của bạn ở chiến địa " + (lo + 1) + " −1 sức mạnh"); ev(G, "locfx", { li: lo }); did = true; }
    }
    if (g.chan) for (let i = 0; i < 3; i++) { const ks = G.locs[i].cards.a.filter(k => k.rev); if (!ks.length) continue; const t = ks.sort((x, y) => power(G, y, i) - power(G, x, i))[0]; t.bonus += 1; did = true; }
    if (did) { empScan(G); if (questScan(G)) empScan(G); }
    return did;
  }
  if (st.t === "end_delayed") {
    const f = find(G, st.uid);
    if (!f || !f.inst.rev || f.inst.sil || f.inst.side !== st.s) return false;
    const c = f.inst, l = f.li, s = st.s, sv = G.srcU;
    let did = false;
    G.srcU = c.uid;
    if (c.wait === G.turn) {
      c.wait = 0; const n = G.ph[s][l];
      if (is(G, c, "thantien") && n > 0) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += 4; log(G, C[c.id].n + " +4 sức mạnh"); did = true; }
      else if (is(G, c, "thamtunu") && n === 0) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += 5; log(G, C[c.id].n + " +5 sức mạnh"); did = true; }
      else if (is(G, c, "giapcuuho") && n > 0) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += 5; log(G, C[c.id].n + " +5 sức mạnh"); did = true; }
    }
    if (is(G, c, "lamconu") && c.turn < G.turn && G.ph[other(s)][l] === 0) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += 2; log(G, C[c.id].n + " +2 sức mạnh"); did = true; }
    if (c.w2 && c.w2.t === G.turn) { const a = c.w2.a; c.w2 = null; if (G.ph[s][l] > 0) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += a; log(G, C[c.id].n + " +" + a + " sức mạnh"); did = true; } }
    if (is(G, c, "thietaiquoc") && c.ip && c.ip.t === G.turn) {
      const u = c.ip.u; c.ip = null;
      if (lead(G, l) === s) { const t = G.hand[s].find(h => h.uid === u); if (t) { ev(G, "skill", { uid: c.uid, t: "end" }); t.cm -= 3; log(G, C[c.id].n + ": giảm 3 năng lượng cho " + C[t.id].n); did = true; } }
    }
    if (c.ug_g) { c.bonus += c.ug_g; did = true; }
    if (c.her && is(G, c, "kenuotsaosokhai")) { const hf = find(G, c.her); if (hf && hf.inst.rev && hf.inst.side === s && lead(G, hf.li) === s) { ev(G, "skill", { uid: c.uid, t: "end" }); c.bonus += 2; log(G, C[c.id].n + " +2 sức mạnh"); did = true; } }
    G.srcU = sv;
    if (did) { empScan(G); if (questScan(G)) empScan(G); }
    return did;
  }
  if (st.t === "end_hand") {
    const s = st.s, c = G.hand[s].find(x => x.uid === st.uid);
    if (!c || c.sil) return false;
    if (is(G, c, "hacmieu")) return discard(G, s, c);
    if (is(G, c, "thantocnu")) {
      const ls = [0, 1, 2].filter(l => space(G, l, s) && !profX(G, l));
      if (!ls.length) return false;
      G.hand[s].splice(G.hand[s].indexOf(c), 1);
      place(G, c, pick(G, ls), s);
      log(G, C[c.id].n + " bay từ tay ra chiến địa");
      empScan(G); if (questScan(G)) empScan(G);
      return true;
    }
    if (is(G, c, "cuongnhantienhoa") && G.unspent[s] > 0) { c.bonus += 2; if (s === "p") log(G, C[c.id].n + " trên tay +2 sức mạnh"); empScan(G); return true; }
    if (is(G, c, "cuongnhando") && G.unspent[other(s)] > 0) { c.bonus += 3; log(G, C[c.id].n + " trên tay +3 sức mạnh"); empScan(G); return true; }
    if (c.her && is(G, c, "kenuotsaosokhai")) { const hf = find(G, c.her); if (hf && hf.inst.rev && hf.inst.side === s && lead(G, hf.li) === s) { c.bonus += 2; if (s === "p") log(G, C[c.id].n + " trên tay +2 sức mạnh"); empScan(G); return true; } }
    return false;
  }
  if (st.t === "end_streak") {
    for (const s of SIDES) {
      G.ltp[s] = G.cnt.playedNow[s] > 0 ? G.lastPlay[s] : 0;
      if (G.unspent[s] === 0) { G.cnt.allSpent[s]++; G.usStreak[s] = 0; } else { G.cnt.unspentTurns[s]++; G.usStreak[s]++; }
      if (G.cnt.playedNow[s] >= 2) G.cnt.two[s]++;
    }
    return false;
  }
  if (st.t === "end_quest") {
    const s = st.s, f = find(G, st.uid);
    if (f && f.inst.rev && !f.inst.sil && !f.inst.done && f.inst.side === s) {
      const c = f.inst, l = f.li;
      if (is(G, c, "kysidoibao") && G.usStreak[s] >= 2) {
        c.done = true; const sv = G.srcU; G.srcU = c.uid;
        ev(G, "skill", { uid: c.uid, t: "react" });
        log(G, C[c.id].n + " hoàn thành Nhiệm Vụ!");
        for (const k of shown(G, l, s)) if (k !== c) k.bonus += 2;
        for (const k of G.hand[s]) k.bonus += 2;
        G.srcU = sv; empScan(G); return true;
      }
      if (is(G, c, "trungphatcogiap") && c.mk != null && lead(G, c.mk) === s) {
        c.done = true; const sv = G.srcU; G.srcU = c.uid;
        ev(G, "skill", { uid: c.uid, t: "react" });
        G.maxE[s] += 1; log(G, C[c.id].n + " hoàn thành Nhiệm Vụ: +1 năng lượng tối đa");
        G.srcU = sv; return true;
      }
      if (runBoardQuest(G, c, l)) { empScan(G); return true; }
      return false;
    }
    const hc = G.hand[s].find(x => x.uid === st.uid);
    if (hc && !hc.sil && !hc.done && is(G, hc, "trungphatcogiap") && hc.mk != null && lead(G, hc.mk) === s) {
      hc.done = true; G.maxE[s] += 1; log(G, C[hc.id].n + " hoàn thành Nhiệm Vụ: +1 năng lượng tối đa");
      return true;
    }
    return false;
  }
  return false;
}
function finishEndTurn(G) {
  for (const s of SIDES) {
    for (const c of G.hand[s]) if (c.z0 === G.turn) { c.cm += c.z0c; c.z0 = 0; }
    G.unspentPrev[s] = G.unspent[s];
    G.cnt.playedLast[s] = G.cnt.playedNow[s];
  }
  G.cnt.movedPrev = G.cnt.movedTurn.p + G.cnt.movedTurn.a > 0;
  empScan(G);
  if (questScan(G)) empScan(G);
}
function endTurn(G) {
  const msgs = [], evs = [];
  for (const st of beginEndTurn(G)) {
    stepEndTurn(G, st);
    if (G.msgs && G.msgs.length) msgs.push(...G.msgs);
    if (G.evs && G.evs.length) evs.push(...G.evs);
  }
  finishEndTurn(G);
  if (G.msgs) { G.msgs.length = 0; G.msgs.push(...msgs); }
  if (G.evs) { G.evs.length = 0; G.evs.push(...evs); }
}
function outcome(G) {
  let w = { p: 0, a: 0 }, tp = 0, ta = 0;
  for (let i = 0; i < 3; i++) { const l = lead(G, i); if (l) w[l]++; tp += locPower(G, i, "p"); ta += locPower(G, i, "a"); }
  if (w.p !== w.a) return w.p > w.a ? "p" : "a";
  if (tp !== ta) return tp > ta ? "p" : "a";
  return "draw";
}
function finish(G, kind) {
  let winner, stake = G.stake;
  if (kind === "end") { endGame(G);
    stake = Math.min(8, G.stake * Math.pow(2, G.pendingDouble) * 2); winner = outcome(G);
    if (winner !== "draw") for (let i = 0; i < 3; i++) { const L = G.locs[i]; if (lon(G, L) && L.id === "treasure" && lead(G, i) === winner) stake += 1; }
  } else winner = kind === "retreatP" || kind === "timeoutP" ? "a" : "p";
  G.stake = stake; G.pendingDouble = 0; G.phase = "over"; G.result = { winner, stake, kind };
}
/* chạy trọn một lượt không có hoạt ảnh (dùng cho máy và kiểm thử) */
function runTurn(G) { const steps = beginReveal(G); for (const st of steps) doStep(G, st); endTurn(G); }

/* ---------- máy đối thủ ---------- */
function clone(G) { return JSON.parse(JSON.stringify(G)); }
function sideStats(G, side) {
  let w = 0, l = 0, tot = 0; const ds = [];
  for (let i = 0; i < 3; i++) {
    const mine = locPower(G, i, side), theirs = locPower(G, i, other(side));
    let d = mine - theirs; const L = G.locs[i];
    if (lon(G, L) && L.id === "reverse") d = -d;
    ds.push(d); tot += mine - theirs; if (d > 0) w++; else if (d < 0) l++;
  }
  return { w, l, tot, ds };
}
function evaluate(S, side) {
  const b = sideStats(S, side); let s = 0; const last = S.turn >= turns(S), k = last ? 8 : 5;
  for (const d of b.ds) s += Math.tanh(d / k);
  if (last) { if (b.w >= 2) s += 2; else if (b.w === b.l && b.tot > 0) s += 1; if (b.l >= 2) s -= 2; s += b.tot * 0.02; }
  else s += 0.3 * (S.nextBonus[side] - S.nextBonus[other(side)]) + 0.06 * (S.hand[side].length - S.hand[other(side)].length) + b.tot * 0.01;
  return s;
}
function randomPlan(S, side) {
  const R = Math.random;
  const hand = S.hand[side].slice().sort(() => R() - 0.5);
  for (const c of hand) {
    if (R() < 0.12) continue;
    const ls = [0, 1, 2].sort(() => R() - 0.5);
    for (const li of ls) if (queuePlay(S, side, c.uid, li)) break;
  }
  for (const [c, li] of boardCards(S, side)) {
    if (canActivate(S, side, c) && R() < 0.6) queueAct(S, side, c.uid);
    if (moveRight(S, side, c, li) && R() < 0.35) { const o = otherLocs(S, li, side); if (o.length) queueMove(S, side, c.uid, o[Math.floor(R() * o.length)]); }
  }
  if (R() < 0.5) S.q[side].sort(() => R() - 0.5);
  return S.q[side].map(a => ({ t: a.t, uid: a.uid, li: a.li, to: a.to }));
}
function aiPlan(G, side, tries) {
  tries = tries || 300;
  const o = other(side);
  let base = clone(G); base.msgs = null; base.evs = null; if (!(G.turn === 5 && anyOn(G, side, "vouy"))) base.q[o] = []; base.q[side] = [];
  let best = { score: -1e9, plan: [] };
  for (let t = 0; t <= tries; t++) {
    const S = clone(base);
    S.rs = (Math.random() * 4294967296) | 0;
    S.deck[side].sort(() => Math.random() - 0.5);
    const plan = t === 0 ? [] : randomPlan(S, side);
    if (t > 0 && !plan.length) continue;
    runTurn(S);
    const sc = evaluate(S, side);
    if (sc > best.score) best = { score: sc, plan };
  }
  G.q[side] = [];
  for (const a of best.plan) {
    if (a.t === "play") queuePlay(G, side, a.uid, a.li);
    else if (a.t === "act") queueAct(G, side, a.uid);
    else if (a.t === "move") queueMove(G, side, a.uid, a.to);
  }
  return best;
}
function aiWantsSnap(G, side) {
  if (G.snap[side] || G.turn < 3) return false;
  const b = sideStats(G, side); return b.w >= 2 && b.tot >= 4 && Math.random() < 0.5;
}
function aiWantsRetreat(G, side) {
  if (!G.snap[other(side)] || G.turn < 4 || G.retreatChecked === G.turn) return false;
  G.retreatChecked = G.turn;
  const b = sideStats(G, side); return b.l >= 2 && b.tot <= -8 && Math.random() < 0.5;
}
const PARTNER = { KD: 1, C1: 1, S1: 1, S2: 1, S3: 1, S4: 1, S5: 1 };
function themedDeck(h, R) {
  R = R || Math.random;
  const sh = a => a.slice().sort(() => R() - 0.5);
  const target = [2, 3, 3, 2, 1, 1], out = [];
  const main = COLLECT.filter(id => C[id].h === h);
  for (let b = 1; b <= 6; b++) {
    const fit = id => Math.min(6, C[id].c) === b && !out.includes(id);
    const rest = sh(main.filter(fit)).concat(sh(COLLECT.filter(id => fit(id) && !main.includes(id))));
    for (let k = 0; k < target[b - 1] && k < rest.length; k++) out.push(rest[k]);
  }
  return out;
}
function randomDeck(R) {
  R = R || Math.random;
  const target = [2, 3, 3, 2, 1, 1], out = [];
  for (let b = 1; b <= 6; b++) {
    const c = COLLECT.filter(id => Math.min(6, C[id].c) === b).sort(() => R() - 0.5);
    for (let k = 0; k < target[b - 1]; k++) out.push(c[k]);
  }
  return out;
}

const API = { hiddenOrder, revealHidden, HE, DANG, C, COLLECT, LOC, TURNS, HAND_MAX, SIDES, other, rnd, pick, mk, basePow, shown, boardCards, locOf, find, cap, space, power, locPower, lead, hurt, draw, destroy, discard, summon, revive, moveCard, transform, cost, canPlay, queuePlay, queueAct, queueMove, unqueue, queued, canActivate, moveRight, newGame, startTurn, beginReveal, doStep, beginEndTurn, stepEndTurn, finishEndTurn, endTurn, runTurn, outcome, finish, priority, clone, sideStats, evaluate, aiPlan, aiWantsSnap, aiWantsRetreat, themedDeck, randomDeck, REV, ACT, END, DESTROYED, DISCARDED, MOVED, PARTNER, ab, is, turns, endGame, toHand, questScan };
for (const fn of ["doStep", "stepEndTurn", "endTurn", "startTurn", "revealHidden"]) { const f0 = API[fn]; API[fn] = function (G) { if (G.evs) { track(G); G.lsk = 0; } const r = f0.apply(null, arguments); track(G); return r; }; }
API.cntOn = cntOn;
if (typeof module !== "undefined" && module.exports) module.exports = API; else root.LT = API;
})(typeof globalThis !== "undefined" ? globalThis : this);

