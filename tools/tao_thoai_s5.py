# -*- coding: utf-8 -*-
"""Sinh tools/thoai_s5.json: câu thoại ra mắt + thẻ cảm xúc + giọng ElevenLabs cho 194 thẻ S5.
Chỉ đọc dữ liệu, không gọi API. Gán giọng bằng bài toán ghép cặp tối ưu (mỗi thẻ 1 giọng riêng)."""
import json, os
import numpy as np
from scipy.optimize import linear_sum_assignment

THE = '/home/claude/thoai/the_s5.json'
GIONG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'giong_viet.json')  # kho đã loại giọng đắt (rate ≤ 1)
RA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'thoai_s5.json')

# id: (gioi, chac, tag, cau, kieu_giong)
# kieu_giong: M_OLD lão/thông thái · M_DEEP uy nghiêm · M_DARK ma mị/hung tợn · M_MID trung niên
#             M_YOUNG trẻ · F_YOUNG nữ trẻ · F_CUTE nữ tinh nghịch · F_SOFT nữ thì thầm/bí ẩn
#             F_MID nữ trưởng thành · F_STRONG nữ mạnh mẽ
D = {
 'dichcuongcot': ('khac', False, 'growls', 'Xương tàn đứng dậy — kẻ mạnh trở về.', 'M_DARK'),
 'conhansu': ('nam', True, 'mysteriously', 'Mắt thứ ba đã mở. Cổ thuật sẵn sàng.', 'M_OLD'),
 'hacdichbinh': ('khac', False, 'growls', 'Mọi quân bài — đúc lại thành ba.', 'M_DARK'),
 'kevocam': ('nam', True, 'flatly', 'Chẳng có gì làm ta lay động.', 'M_MID'),
 'maynuotthoigian': ('khac', False, 'menacing', 'Hết giờ rồi.', 'M_DARK'),
 'nghichtuvuong': ('nam', True, 'shouting', 'Đá bay! Chia quân khắp chiến địa!', 'M_OLD'),
 'bachdich': ('nam', True, 'calmly', 'Buông hết… trở về số không.', 'M_YOUNG'),
 'nhennon': ('khac', False, 'playfully', 'Nhỏ thôi… nhưng đừng xem thường.', 'F_CUTE'),
 'kysituduc': ('nam', True, 'menacing', 'Quạ đếm xác. Đủ bốn, ta hồi sinh.', 'M_DARK'),
 'chienthan': ('nam', True, 'confident', 'Đứng sau ta. Trận này ta lo.', 'M_DEEP'),
 'phanquanthiengioi': ('nam', True, 'solemnly', 'Phán quyết: các ngươi thua.', 'M_DEEP'),
 'cucquang': ('nu', True, 'calmly', 'Nhìn lên đi.', 'F_MID'),
 'namtuocmatna': ('nam', True, 'sarcastic', 'Sau mặt nạ này, quân ngươi đổi phe.', 'M_MID'),
 'phaodaimay': ('khac', False, 'proudly', 'Nạp pháo! Nhân bản cả đội hình!', 'M_DEEP'),
 'thienngaden': ('khac', False, 'gently', 'Múa đi… bước nhỏ chẳng tốn gì.', 'F_SOFT'),
 'thiemnu': ('nu', True, 'mischievously', 'Chớp mắt… đã đổi người.', 'F_SOFT'),
 'phitieuhoi': ('nu', True, 'coldly', 'Trăng khuyết bay đi… rồi quay về.', 'F_STRONG'),
 'tiensigamma': ('nam', True, 'angry', 'Còn dư sức à? Tôi sắp hoá cuồng!', 'M_YOUNG'),
 'hongtam': ('nam', False, 'confident', 'Bỏ bài nhẹ, bắn trăm phát trúng.', 'M_YOUNG'),
 'thachlucnu': ('nu', True, 'proudly', 'Cột đá còn đây, không ai ngã cả.', 'F_STRONG'),
 'kysidichkhuyen': ('nam', True, 'growls', 'Kẻ to nhất của ngươi — dịch gặm trước.', 'M_DARK'),
 'kysidaoquoc': ('nam', True, 'excited', 'Quân lớn ra trận, sóng đẩy thêm đà!', 'M_MID'),
 'nuthuantuong': ('nu', True, 'solemnly', 'Hàng sau cứ yên. Có khiên của ta.', 'F_STRONG'),
 'tammanu': ('nu', True, 'whispers', 'Mỗi lá bài của ngươi… cho ta một chút.', 'F_SOFT'),
 'longuclua': ('nam', True, 'shouting', 'Lò ngực rực lửa! Quân lớn tiếp sức!', 'M_YOUNG'),
 'daitaxacsong': ('nam', True, 'growls', 'Vứt bài đi, lính! Ta ghi công từng lượt.', 'M_DARK'),
 'nhaihinh': ('khac', False, 'mischievously', 'Đáy bài ngươi có gì? Ta học hết.', 'F_MID'),
 'matocvutru': ('khac', False, 'coldly', 'Hàng đầu các ngươi… im lặng.', 'M_YOUNG'),
 'tuthanmienvien': ('nam', True, 'laughs', 'Hà hà… người đã khuất, theo ta trở về.', 'M_DARK'),
 'kimcuongxa': ('khac', False, 'menacing', 'Đã yếu rồi à? Nanh ta cắn sâu thêm.', 'M_DARK'),
 'baochuahauthe': ('nam', True, 'proudly', 'Một lệnh duy nhất. Hậu thế tự tới.', 'M_DEEP'),
 'nguyetlong': ('khac', False, 'mysteriously', 'Trăng chỉ lấy… những số chẵn.', 'M_DEEP'),
 'phatuongsinhlinh': ('nam', True, 'growls', 'Kẻ nào mạnh hơn? Chuỳ này tìm tới.', 'M_DARK'),
 'linhduoc': ('nam', True, 'warmly', 'Ngã lượt trước? Uống thuốc rồi dậy.', 'M_OLD'),
 'songsinhtamlinh': ('nu', True, 'playfully', 'Em lấy một, chị chép thêm một!', 'F_CUTE'),
 'thienthantimkiem': ('nam', False, 'solemnly', 'Đèn soi đường. Kẻ được tạo, bước ra.', 'M_DEEP'),
 'laonhen': ('nam', True, 'laughs', 'Có kẻ mạnh hơn? Lão dệt sang chỗ khác.', 'M_OLD'),
 'kesanga': ('nam', False, 'sighs', 'Sa ngã rồi — sức mạnh đổi năng lượng.', 'M_MID'),
 'aosi': ('nam', True, 'mysteriously', 'Xu hoá bướm… còn ngươi hoá yếu.', 'M_MID'),
 'langthan': ('khac', False, 'growls', 'Xác của ngươi… giờ chạy theo bầy ta.', 'M_DARK'),
 'culongco': ('khac', False, 'menacing', 'Sức của ngươi… giờ là của ta.', 'M_OLD'),
 'toclua': ('nu', True, 'sighs', 'Ai ngã xuống… lửa của tôi nhớ thay.', 'F_SOFT'),
 'hoatinhnu': ('nu', True, 'excited', 'Chờ sao lớn rơi… em nhân đôi!', 'F_CUTE'),
 'huyetdichhangxom': ('nam', True, 'laughs', 'Dọn dẹp tí thôi… dịch sang phải nào!', 'M_MID'),
 'mauhau': ('nu', True, 'warmly', 'Đứa vừa ra trận — mẫu hậu ban thêm một.', 'F_MID'),
 'ainunuotsao': ('nu', True, 'gently', 'Sao của em… soi sáng nơi khác.', 'F_YOUNG'),
 'kenuotsao': ('nam', True, 'laughs', 'Một mình ta thắng… nuốt hết phần còn lại!', 'M_DEEP'),
 'kysibaitu': ('nam', True, 'confident', 'Bài giấy đủ sáu — kẻ thù tan tác.', 'M_MID'),
 'vuongbathu': ('nam', True, 'proudly', 'Ai được ban phước, đều tôn ta lên.', 'M_DEEP'),
 'cunhan': ('nam', True, 'gently', 'Tôi bé thôi… có bạn mới lớn được.', 'M_YOUNG'),
 'dothan': ('nam', True, 'solemnly', 'Mỗi lá lật lên — một nét sơn hà.', 'M_OLD'),
 'hongnutinhquai': ('nu', True, 'mischievously', 'Ba lần đổ xúc xắc… ai may đây?', 'F_CUTE'),
 'daubay': ('khac', False, 'laughs', 'Chém đầu à? Ta bay về tay ngay!', 'M_YOUNG'),
 'trolymay': ('khac', False, 'playfully', 'Hôm nay làm gì? Mỗi lượt một việc!', 'M_YOUNG'),
 'tienhoasu': ('nam', True, 'excited', 'Bài trơn à? Để ta tiến hoá chúng.', 'M_MID'),
 'hyvong': ('nu', True, 'warmly', 'Đặt bài đi… mai sẽ sáng hơn.', 'F_CUTE'),
 'tieukhonglo': ('nam', False, 'laughs', 'Nhỏ con thôi, mượn tài kẻ lớn!', 'M_YOUNG'),
 'hoanhansokhai': ('nam', True, 'proudly', 'Lửa nhà rông cháy mãi, đông vui càng rực.', 'M_YOUNG'),
 'linhchindau': ('nam', True, 'growls', 'Ai dám tăng cược? Chín đầu ta đổi hướng.', 'M_DARK'),
 'giapdam': ('khac', False, 'growls', 'Mỗi bước dời quân — đất rung, ta mạnh.', 'M_DEEP'),
 'cohoangvocuc': ('nam', False, 'proudly', 'Hai viên đá quyền năng — trẫm ban cho.', 'M_DEEP'),
 'annusokhai': ('nu', True, 'whispers', 'Cuối lượt này… vang thêm lần nữa.', 'F_SOFT'),
 'thietaiquoc': ('nam', True, 'shouting', 'Giữ đất này! Quân lớn sắp tới!', 'M_YOUNG'),
 'batbainu': ('nu', True, 'angry', 'Thua à? Càng thua ta càng mạnh!', 'F_STRONG'),
 'cosi': ('nam', True, 'shouting', 'Cờ lệnh phất cao — đã mạnh, mạnh thêm!', 'M_YOUNG'),
 'nuloimienvien': ('nu', True, 'solemnly', 'Sấm phán xét: ta thêm, địch bớt.', 'F_MID'),
 'caheocon': ('khac', False, 'playfully', 'Lật bài ở đây — mỗi lá thêm một!', 'F_CUTE'),
 'camapcan': ('khac', False, 'laughs', 'Cạn hay nước — đi đâu tuỳ ta.', 'M_MID'),
 'hoanhanmay': ('nam', True, 'playfully', 'Năng lượng thừa? Táo con ăn hết!', 'M_YOUNG'),
 'phiungtre': ('nam', True, 'excited', 'Bé mà lật — ta cho lật hai lần!', 'M_YOUNG'),
 'nuco': ('nu', True, 'flatly', 'Lên dây cót. Tất cả… kích hoạt.', 'F_SOFT'),
 'phaohoanganha': ('nam', True, 'excited', 'Rút bài nào — pháo hoa tặng sức!', 'M_YOUNG'),
 'kysichienxa': ('nam', True, 'shouting', 'Sáu mức sức mạnh — chiến xa xung phong!', 'M_DEEP'),
 'phonglinhnu': ('nu', True, 'playfully', 'Gió từ tay bài… thổi sức ra trận.', 'F_YOUNG'),
 'thukydungcam': ('nu', True, 'confident', 'Một, hai, ba — ghi công từng người.', 'F_YOUNG'),
 'nuthantien': ('nu', True, 'playfully', 'Hai mũi tên nữa — chờ chút nhé!', 'F_CUTE'),
 'nguyetthan': ('nam', True, 'mysteriously', 'Kẻ bị vứt bỏ… trăng gọi về.', 'M_OLD'),
 'tamlinhtu': ('nam', True, 'whispers', 'Đặt bài tiếp đi… hồn nó thuộc về ta.', 'M_MID'),
 'cuongnhanxam': ('nam', True, 'coldly', 'Sương lạnh phủ tay bài — ai cũng nhẹ đi.', 'M_OLD'),
 'tieuthu': ('nam', True, 'calmly', 'Một mũi nỏ… đổi lấy năng lượng.', 'M_MID'),
 'nuhongtam': ('nu', True, 'coldly', 'Còn sức thừa? Thêm một mũi nữa.', 'F_STRONG'),
 'kysiho': ('nu', True, 'solemnly', 'Gươm hồ ban phúc — mạnh lại thêm mạnh.', 'F_MID'),
 'kiemquyen': ('nam', True, 'confident', 'Quyền ở đây, kiếm chờ bên kia.', 'M_YOUNG'),
 'tieulong': ('khac', False, 'playfully', 'Bạn nhỏ ra trận? Ta phun lửa giúp!', 'M_YOUNG'),
 'bangca': ('nu', True, 'gently', 'Hát một khúc… băng đóng hai bên.', 'F_CUTE'),
 'bato': ('nu', True, 'warmly', 'Bà kéo sợi tơ, cháu dời chỗ nhé.', 'F_MID'),
 'hacthuatsi': ('nam', True, 'whispers', 'Còn bao nhiêu năng lượng? Bùa chép bấy nhiêu.', 'M_YOUNG'),
 'thantocnu': ('nu', True, 'excited', 'Chẳng cần gọi — tôi tự chạy ra!', 'F_YOUNG'),
 'vuatienhac': ('nam', True, 'mischievously', 'Một lá úp sẵn… cuối ván mới biết.', 'M_YOUNG'),
 'nhannhenquai': ('khac', False, 'growls', 'Sáu tay ôm trọn — nuốt rồi nhân đôi!', 'M_DARK'),
 'kydong': ('nam', True, 'proudly', 'Quân nhỏ đâu? Kỳ Đồng dẫn đầu!', 'M_YOUNG'),
 'nangtocdo': ('nu', True, 'excited', 'Chạy đi nào! Ai di chuyển, có thưởng!', 'F_YOUNG'),
 'linhdondoc': ('nam', True, 'sighs', 'Giáo gãy rồi… người sau, cầm lấy.', 'M_MID'),
 'phapsudaomong': ('nam', True, 'playfully', 'Mơ một giấc… vẽ ra đại đồ án.', 'M_MID'),
 'sautham': ('nam', True, 'sighs', 'Diễn lại lần cuối… rồi tan theo mưa.', 'M_OLD'),
 'chimnhai': ('khac', False, 'mischievously', 'Bắt chước ai cũng được — rẻ dần đi.', 'F_CUTE'),
 'muoikiepnu': ('nu', True, 'calmly', 'Diệt ta à? Ta bắt đầu lại từ đầu.', 'F_SOFT'),
 'battykhonglo': ('khac', False, 'growls', 'Bài trên cùng nặng — ta càng nhẹ.', 'M_DEEP'),
 'nguyetlongnu': ('nu', True, 'gently', 'Một lá, dùng hết — trăng thưởng cho em.', 'F_CUTE'),
 'yeuhau': ('nu', True, 'menacing', 'Hồn đã mất… về tay ta, mạnh hơn.', 'F_MID'),
 'deonhansokhai': ('nam', True, 'playfully', 'Tay dài với tới — giảm giá hay thêm sức?', 'M_YOUNG'),
 'hoasat': ('nam', True, 'menacing', 'Mỗi nơi có xác — một bức tranh đẹp.', 'M_DARK'),
 'thuyhau': ('nu', True, 'proudly', 'Kẻ đứng một mình — sóng ban năm phần.', 'F_MID'),
 'thuynu': ('nu', True, 'calmly', 'Một mình bên hồ… bài rút nhẹ đi.', 'F_SOFT'),
 'acmong': ('khac', False, 'whispers', 'Ngủ đi… tay bài sẽ đổi khác.', 'F_SOFT'),
 'dakhuc': ('nam', False, 'calmly', 'Tiếng sáo dời bước — cả vùng đất đổi thay.', 'M_YOUNG'),
 'nhencogiap': ('nam', True, 'excited', 'Gõ thêm mấy nhát — cơ giáp nhện xong!', 'M_YOUNG'),
 'kysitudich': ('nam', True, 'coldly', 'Đủ năm vết thương — kỵ binh xác tiến lên.', 'M_DARK'),
 'thandong': ('nam', True, 'confident', 'Đứng sau mà học — học là làm được.', 'M_YOUNG'),
 'dathuongnu': ('nu', True, 'coldly', 'Vứt ta đi? Ta nhảy tới chỗ yếu nhất.', 'F_STRONG'),
 'tamkiemmienvien': ('nu', True, 'calmly', 'Sen nở một nhát — quân nặng nhẹ đi.', 'F_YOUNG'),
 'vuathoigian': ('nam', True, 'solemnly', 'Quay ngược kim — ba phép xưa trở lại.', 'M_OLD'),
 'hongve': ('nam', True, 'shouting', 'Côn chắn ngang! Kẻ yếu nhất, im!', 'M_DEEP'),
 'cuongnhando': ('nam', True, 'angry', 'Còn để dành sức à? Ta nổi giận đây!', 'M_DEEP'),
 'cuongdomienvien': ('nam', True, 'shouting', 'Ra sớm thì mạnh — rìu đâu, xông lên!', 'M_DEEP'),
 'soidomienvien': ('khac', False, 'growls', 'Tay bài càng đầy, lửa ta càng dữ.', 'M_DARK'),
 'chimcanhdo': ('khac', False, 'excited', 'Ta bay đi — để lại một đồng đội!', 'M_YOUNG'),
 'chonvacay': ('khac', False, 'playfully', 'Đặt đây hả? Tụi tui lấy một chút nha!', 'M_YOUNG'),
 'haplucchiare': ('nu', True, 'sarcastic', 'Lá mạnh nhất của ngươi? Giờ là của ta.', 'F_SOFT'),
 'trinu': ('nu', True, 'proudly', 'Mỗi con số khác nhau — em cộng hết!', 'F_CUTE'),
 'nhendotham': ('nam', True, 'mysteriously', 'Một bóng ở đây… một bóng bên kia.', 'M_YOUNG'),
 'khinhdich': ('khac', False, 'laughs', 'Vứt à? Nảy lại liền, còn khoẻ hơn!', 'M_YOUNG'),
 'bocapngaymoi': ('nu', True, 'menacing', 'Lá bùa này… nhân đôi mọi vết thương.', 'F_MID'),
 'thetdich': ('nu', True, 'shouting', 'Dám nhúc nhích? Tiếng thét lấy phần!', 'F_STRONG'),
 'kysinguyetyeu': ('khac', False, 'playfully', 'Ba lá trơn đủ rồi — thỏ trăng cướp nào!', 'M_YOUNG'),
 'hoavatnu': ('nu', True, 'mischievously', 'Biến! Ai ở đây cũng thành kẻ khác.', 'F_YOUNG'),
 'vouyamdia': ('nam', True, 'coldly', 'Ba con quỷ, ta xáo vào bài.', 'M_DARK'),
 'longbattu': ('khac', False, 'growls', 'Lửa xanh không tắt — kẻ cuối được tiếp sức.', 'M_DEEP'),
 'ngansat': ('nam', False, 'whispers', 'Đỉnh bộ bài ngươi… đã mất máu.', 'M_MID'),
 'chomay': ('khac', False, 'excited', 'Gâu! Kéo bạn về, thêm sức nữa!', 'M_YOUNG'),
 'toctu': ('nam', True, 'excited', 'Dùng hết sức đi! Tôi nhanh lên mỗi lượt!', 'M_YOUNG'),
 'nhenngaymoi': ('nu', True, 'playfully', 'Nhón chân hai bước — đâu cũng thêm sức.', 'F_YOUNG'),
 'nhenbongdem': ('nu', True, 'whispers', 'Lá trên cùng… ta dệt thành tám.', 'F_SOFT'),
 'nhennoiloan': ('nam', True, 'sarcastic', 'Hát xẩm dạo qua — tiện tay lấy hai!', 'M_YOUNG'),
 'ansao': ('khac', False, 'solemnly', 'Sao bị phong ấn — địch được chút phần.', 'M_OLD'),
 'buisao': ('khac', False, 'mysteriously', 'Không ai chen vào — trừ khi tự bước tới.', 'F_YOUNG'),
 'tinhchuathaiduong': ('nam', True, 'proudly', 'Năng lượng ngươi để dành — mặt trời trả lãi.', 'M_DEEP'),
 'kysidoibao': ('nam', True, 'sighs', 'Nhịn đói hai lượt… rồi ta mới ăn.', 'M_DARK'),
 'diphaptoithuong': ('nam', True, 'calmly', 'Vạn pháp quy nhất. Hợp thể đi.', 'M_OLD'),
 'nhenthuongdang': ('nam', True, 'confident', 'Quân có công — soái cấp thêm lương.', 'M_DEEP'),
 'diennu': ('nu', True, 'excited', 'Tách! Lá kế tiếp vừa được sạc.', 'F_CUTE'),
 'hoamavuong': ('nam', True, 'laughs', 'Mười sức trở lên? Rót thêm rượu!', 'M_DEEP'),
 'nhenhacdich': ('khac', False, 'menacing', 'Kẻ nhỏ nhất ở đây… hoà vào mực ta.', 'M_DARK'),
 'nhenlong': ('khac', False, 'playfully', 'Mạnh nhất bàn là tui nha! Thưởng nè.', 'F_CUTE'),
 'virutcosinh': ('khac', False, 'coldly', 'Lây nhiễm hoàn tất. Các ngươi là ta.', 'M_DARK'),
 'tuongquan': ('nam', True, 'solemnly', 'Địch còn chần chừ — ta gọi đại quân.', 'M_DEEP'),
 'bavuongtim': ('nam', True, 'menacing', 'Sáu viên đá… định mệnh trong tay ta.', 'M_DEEP'),
 'conhan': ('nam', True, 'warmly', 'Cuộn đồ cổ này… dẫn lối cho con.', 'M_OLD'),
 'thachquaisokhai': ('khac', False, 'solemnly', 'Đá ngàn năm… mỗi lượt một vững.', 'M_OLD'),
 'nuchienbathu': ('nu', True, 'confident', 'Hai lá đúng nhịp — sẹo thêm, sức thêm.', 'F_STRONG'),
 'docdich': ('khac', False, 'laughs', 'Về tay hết đi! Ta béo thêm.', 'M_YOUNG'),
 'dacvuquocgia': ('nu', True, 'coldly', 'Kẻ to xác ở đây… giảm bớt đi.', 'F_SOFT'),
 'huyetmenu': ('nu', True, 'menacing', 'Mỗi mức năng lượng — một giọt máu.', 'F_MID'),
 'huyetsatvuong': ('nam', True, 'laughs', 'Tiêu sạch năng lượng? Ta thưởng giáo!', 'M_MID'),
 'taysatnu': ('nu', True, 'proudly', 'Đồ mới rèn ra — ta gõ thêm sức.', 'F_STRONG'),
 'huyenconu': ('nu', True, 'mysteriously', 'Thắng ở đây — tay bài sáng lên.', 'F_SOFT'),
 'comaychien': ('nam', True, 'shouting', 'Phá cổng! Đặt quân đâu cũng được!', 'M_DEEP'),
 'cosinhthe': ('khac', False, 'calmly', 'Năng lượng thừa… để ta sửa chữa.', 'M_MID'),
 'vukhih': ('khac', False, 'growls', 'Vứt ta? Gang sắt quay lại, rẻ hơn.', 'M_DEEP'),
 'vukhix': ('nam', True, 'growls', 'Đồng đội ngã — móng hổ thêm sắc.', 'M_DEEP'),
 'docnutrang': ('nu', True, 'mischievously', 'Một nụ hôn… gửi tặng đối thủ.', 'F_SOFT'),
 'phuthuytre': ('nu', True, 'excited', 'Dùng hết rồi à? Thêm hai năng lượng nhé!', 'F_CUTE'),
 'trumthanhpho': ('nam', True, 'proudly', 'Kẻ mạnh nhất bàn? Bá hộ giảm giá!', 'M_MID'),
 'kysivuottu': ('nam', True, 'menacing', 'Đủ sáu sức — móng xương chia phần.', 'M_DARK'),
 'saotrongdau': ('nu', True, 'mysteriously', 'Ba hay bốn… đều phải rời khỏi đây.', 'F_SOFT'),
 'xachacmieu': ('khac', False, 'mischievously', 'Meo… vứt thêm một đứa nữa đi.', 'F_SOFT'),
 'xacdao': ('nam', True, 'growls', 'Lật bài đi — bầy xác ăn phần.', 'M_DARK'),
 'xactinhquang': ('nu', True, 'menacing', 'Đồng đội ơi… hoá ánh sao cho ta.', 'F_STRONG'),
 'bayxacnuotsao': ('khac', False, 'growls', 'Sáu kẻ đã chọn… đều thành ta.', 'M_DARK'),
 'xacdeo': ('khac', False, 'laughs', 'Kéo dài ra nào — bầy xác thêm hai!', 'M_YOUNG'),
 'xachongphuthuy': ('nu', True, 'mysteriously', 'Đặt bài đây… bầy xác lại đông.', 'F_MID'),
 'xachacdich': ('nam', True, 'coldly', 'Kẻ đầu tiên bên ta… nằm xuống trước.', 'M_DARK'),
 'hoathuatnu': ('nu', True, 'whispers', 'Cường hoá ta đi… lửa đen sẽ đến.', 'F_YOUNG'),
 'lanvuong': ('nam', True, 'excited', 'Lặn xuống, mò lên — thêm bạn nhỏ!', 'M_YOUNG'),
 'thanai': ('nam', True, 'warmly', 'Se thêm sợi chỉ — mạnh thêm chút nữa.', 'M_OLD'),
 'hacdiemchua': ('nam', True, 'menacing', 'Nghi thức bắt đầu. Lửa đen trỗi dậy.', 'M_DARK'),
 'khoinguyenvuong': ('nam', True, 'solemnly', 'Gieo đủ mọi miền… tận thế nảy mầm.', 'M_DEEP'),
 'kechinhphatthoigian': ('nam', True, 'confident', 'Bốn thời đại… bốn ta cùng chinh phạt.', 'M_DEEP'),
 'lucac': ('khac', False, 'laughs', 'Sáu đứa ác… gộp lại thành một!', 'M_DARK'),
 'phapsugia': ('nam', True, 'mysteriously', 'Mỗi lượt một câu thần chú, nhé.', 'M_OLD'),
 'chutruongnu': ('nu', True, 'playfully', 'Lá kế tiếp… để em yểm phép!', 'F_YOUNG'),
 'quyensuthaphoan': ('nam', True, 'confident', 'Mười chiếc vòng — khai mở càn khôn.', 'M_DEEP'),
 'kerinh': ('nam', False, 'whispers', 'Suỵt… hai món đồ nghề, sẵn rồi.', 'M_MID'),
 'thuanung': ('khac', False, 'proudly', 'Khiên lớn qua bên kia — ta canh chừng!', 'M_YOUNG'),
 'huyettruonglao': ('nam', True, 'menacing', 'Ba lần cướp máu… ta hoá cự thú.', 'M_OLD'),
 'tamtudo': ('nam', True, 'mysteriously', 'Ba con mắt — ba quyền năng ngẫu nhiên.', 'M_MID'),
 'nuhoanghonmang': ('nu', True, 'laughs', 'Hỗn loạn mỗi lượt — miễn phí nhé!', 'F_MID'),
 'loantuong': ('nam', True, 'laughs', 'Lật! Lật! Lật! Ha ha — cái lớn nhất đây!', 'M_MID'),
 'trungphatcogiap': ('khac', False, 'coldly', 'Đã đánh dấu. Thắng nó, thêm năng lượng.', 'M_DEEP'),
 'bavuongmienvien': ('nam', True, 'confident', 'Mỗi lá bài một mũi tên. Bắn!', 'M_DEEP'),
 'nguyetthach': ('khac', False, 'calmly', 'Kẻ nhỏ giữ gì… ta giữ nấy.', 'M_OLD'),
 'thietgiapthuongdang': ('nam', True, 'proudly', 'Giảm hay tăng — ta nhận gấp đôi.', 'M_DEEP'),
 'kenuotsaosokhai': ('nam', True, 'sarcastic', 'Lá tiếp theo ngươi đặt… sẽ phục vụ ta.', 'M_DARK'),
 'dihien': ('nu', True, 'warmly', 'Dời chỗ xong chưa con? Dì bớt giá cho.', 'F_MID'),
}

# Bản giao đấu (yêu cầu sửa lần 2): id → (tag, câu). tag nhiều thẻ ngăn bằng '|'.
MOI = {
 'dichcuongcot': ('growls', 'Mộ mở rồi! Kẻ mạnh nhất, đứng dậy!'),
 'conhansu': ('commanding', 'Mắt thứ ba đã mở! Cổ thuật, xuất!'),
 'hacdichbinh': ('aggressive', 'Cả đạo quân — đúc lại thành ba!'),
 'kevocam': ('coldly|threatening', 'Chẳng gì làm ta lay động. Khóc đi!'),
 'maynuotthoigian': ('growls|shouting', 'Hết giờ rồi!'),
 'nghichtuvuong': ('war cry', 'Đá bay! Đè nát mọi chiến địa!'),
 'bachdich': ('coldly', 'Về số không — rồi phá tan tất cả!'),
 'nhennon': ('determined', 'Nhỏ thôi — nhưng đừng xem thường!'),
 'kysituduc': ('menacing', 'Quạ đã đếm xác! Đủ bốn, ta trỗi dậy!'),
 'chienthan': ('battle cry', 'Đứng sau ta! Trận này ta lo!'),
 'phanquanthiengioi': ('commanding', 'Phán quyết: các ngươi thua!'),
 'cucquang': ('commanding', 'Nhìn lên đi — và quỳ xuống!'),
 'namtuocmatna': ('sarcastic', 'Sau mặt nạ này, quân ngươi là của ta!'),
 'phaodaimay': ('commanding|shouting', 'Nạp pháo! Nhân bản cả đội — khai hoả!'),
 'thienngaden': ('coldly', 'Vũ điệu tử thần! Quân nhỏ, miễn phí!'),
 'thiemnu': ('threatening', 'Chớp mắt thôi — ngươi đã mất dấu ta!'),
 'phitieuhoi': ('coldly', 'Trăng khuyết bay đi — mang sức ngươi về!'),
 'tiensigamma': ('furious', 'Còn dư sức à? Ta hoá cuồng đây!'),
 'hongtam': ('aggressive', 'Bỏ bài nhẹ! Trăm mũi tên, trúng hết!'),
 'thachlucnu': ('determined', 'Cột đá còn đây — không ai được ngã!'),
 'kysidichkhuyen': ('growls', 'Kẻ to nhất của ngươi — dịch xé trước!'),
 'kysidaoquoc': ('battle cry', 'Quân lớn ra trận! Sóng dữ, tiến lên!'),
 'nuthuantuong': ('commanding', 'Hàng sau đứng vững! Khiên ta đã dựng!'),
 'tammanu': ('menacing', 'Từng lá bài của ngươi… ta rút cạn!'),
 'longuclua': ('roars', 'Lò ngực bùng cháy! Quân lớn, tiếp lửa!'),
 'daitaxacsong': ('commanding', 'Vứt bài đi, lính! Mỗi lượt một huân chương!'),
 'nhaihinh': ('sarcastic', 'Đáy bài ngươi có gì? Ta cướp hết!'),
 'matocvutru': ('coldly', 'Hàng đầu các ngươi — câm lặng!'),
 'tuthanmienvien': ('laughs maniacally', 'Hà hà! Người đã khuất, theo ta trở về!'),
 'kimcuongxa': ('threatening', 'Đã yếu rồi à? Nanh ta cắn sâu hơn!'),
 'baochuahauthe': ('commanding', 'Một lệnh thôi! Hậu thế, xuất trận!'),
 'nguyetlong': ('menacing', 'Số chẵn à? Trăng đòi phần của ta!'),
 'phatuongsinhlinh': ('growls', 'Kẻ nào mạnh hơn? Chuỳ này đập tới!'),
 'linhduoc': ('determined', 'Ngã xuống ư? Uống thuốc, đánh tiếp!'),
 'songsinhtamlinh': ('confident', 'Chị em ta — một hoá hai, đánh gấp đôi!'),
 'thienthantimkiem': ('commanding', 'Đèn đã rọi! Kẻ được tạo, bước ra!'),
 'laonhen': ('laughs maniacally', 'Kẻ mạnh hơn đến? Lão giăng lưới chỗ khác!'),
 'kesanga': ('intense', 'Cánh đã cháy — sức ta hoá năng lượng!'),
 'aosi': ('sarcastic', 'Xu hoá bướm — còn ngươi hoá yếu!'),
 'langthan': ('roars', 'Xác của ngươi — giờ chạy theo bầy ta!'),
 'culongco': ('roars', 'Sức của ngươi? Giờ là của ta!'),
 'toclua': ('intense', 'Ai ngã xuống — lửa ta phản đòn thay!'),
 'hoatinhnu': ('fierce', 'Chờ sao lớn rơi — ta nhân đôi sức mạnh!'),
 'huyetdichhangxom': ('laughs maniacally', 'Dịch sang phải hết! Mạnh lên nào!'),
 'mauhau': ('commanding', 'Con ta vừa ra trận — mẫu hậu ban thêm!'),
 'ainunuotsao': ('determined', 'Sao ta chiếu tới đâu, quân ta lật tới đó!'),
 'kenuotsao': ('roars', 'Một mình ta thắng — nuốt trọn thiên hạ!'),
 'kysibaitu': ('war cry', 'Bài giấy đủ sáu — quân thù tan xác!'),
 'vuongbathu': ('proudly', 'Ai được ban phước — đều phải tôn ta!'),
 'cunhan': ('determined', 'Nhỏ con thì sao? Có đồng đội, ta khổng lồ!'),
 'dothan': ('commanding', 'Lật bài đi! Mỗi lá — một nét sơn hà!'),
 'hongnutinhquai': ('confident', 'Ba lần xúc xắc — vận may là của ta!'),
 'daubay': ('laughs maniacally', 'Chém đầu ta à? Ta bay về, mạnh hơn!'),
 'trolymay': ('determined', 'Mỗi lượt một chiêu mới — chờ đó!'),
 'tienhoasu': ('intense', 'Bài trơn à? Tiến hoá đi — ngay bây giờ!'),
 'hyvong': ('determined', 'Đèn còn sáng — lượt sau ta mạnh hơn!'),
 'tieukhonglo': ('confident', 'Nhỏ con? Ta mượn sức kẻ khổng lồ!'),
 'hoanhansokhai': ('war cry', 'Lửa nhà rông bùng lên! Càng đông càng rực!'),
 'linhchindau': ('growls', 'Dám tăng cược? Chín đầu ta quay sang!'),
 'giapdam': ('roars', 'Mỗi bước dời quân — đất rung, ta mạnh!'),
 'cohoangvocuc': ('commanding', 'Hai viên đá quyền năng! Trẫm ban sức!'),
 'annusokhai': ('coldly', 'Cuối lượt này — đòn đánh vang hai lần.'),
 'thietaiquoc': ('battle cry', 'Giữ đất này! Quân lớn sắp tới!'),
 'batbainu': ('furious', 'Thua à? Càng thua ta càng mạnh!'),
 'cosi': ('war cry', 'Cờ lệnh phất cao! Đã mạnh, mạnh thêm!'),
 'nuloimienvien': ('commanding', 'Sấm phán xét! Ta thêm, địch bớt!'),
 'caheocon': ('confident', 'Lật bài chỗ ta — lá nào cũng mạnh thêm!'),
 'camapcan': ('aggressive', 'Cạn hay nước — không gì cản nổi ta!'),
 'hoanhanmay': ('confident', 'Năng lượng thừa? Táo con ăn hết!'),
 'phiungtre': ('battle cry', 'Quân nhỏ lật bài — ta cho lật lần nữa!'),
 'nuco': ('coldly', 'Lên dây cót. Tất cả — kích hoạt!'),
 'phaohoanganha': ('shouting', 'Rút bài đi! Pháo hoa nổ thành sức mạnh!'),
 'kysichienxa': ('war cry', 'Sáu mức sức mạnh! Chiến xa, xung phong!'),
 'phonglinhnu': ('fierce', 'Gió nổi từ tay bài — thổi sức ra trận!'),
 'thukydungcam': ('determined', 'Một, hai, ba — ai cũng được ghi công!'),
 'nuthantien': ('confident', 'Thêm hai mũi tên — không trượt phát nào!'),
 'nguyetthan': ('menacing', 'Kẻ bị vứt bỏ — trăng gọi về chiến đấu!'),
 'tamlinhtu': ('menacing', 'Đặt bài tiếp đi — hồn nó thuộc về ta!'),
 'cuongnhanxam': ('coldly', 'Sương lạnh phủ tay bài — không ai thoát!'),
 'tieuthu': ('intense', 'Một mũi nỏ — đổi lấy năng lượng!'),
 'nuhongtam': ('coldly', 'Còn sức thừa? Thêm một mũi nữa!'),
 'kysiho': ('commanding', 'Gươm hồ đã rút! Mạnh lại càng mạnh!'),
 'kiemquyen': ('fierce', 'Quyền ở đây — kiếm chờ bên kia!'),
 'tieulong': ('roars', 'Quân nhỏ ra trận? Lửa rồng thiêu địch!'),
 'bangca': ('coldly', 'Hát một khúc — băng phong hai phía!'),
 'bato': ('commanding', 'Sợi tơ đã kéo! Quân ta, dời trận!'),
 'hacthuatsi': ('menacing', 'Còn bao năng lượng — bùa chép bấy nhiêu!'),
 'thantocnu': ('shouting', 'Khỏi cần gọi! Ta tự lao vào trận!'),
 'vuatienhac': ('sarcastic', 'Một lá úp sẵn — cuối ván mới biết!'),
 'nhannhenquai': ('roars', 'Sáu tay ôm trọn — nuốt rồi nhân đôi!'),
 'kydong': ('battle cry', 'Quân nhỏ đâu? Kỳ Đồng dẫn đầu!'),
 'nangtocdo': ('shouting', 'Chạy lên! Ai di chuyển, kẻ đó mạnh!'),
 'linhdondoc': ('determined', 'Giáo gãy cũng không lùi! Người sau, cầm lấy!'),
 'phapsudaomong': ('confident', 'Một giấc mơ — vẽ nên đại đồ án!'),
 'sautham': ('intense', 'Diễn lại lần cuối — rồi cùng tan xác!'),
 'chimnhai': ('sarcastic', 'Bắt chước ai cũng được — ta càng rẻ!'),
 'muoikiepnu': ('threatening', 'Giết ta à? Ta làm lại từ đầu!'),
 'battykhonglo': ('growls', 'Đỉnh bài càng nặng — ta càng nhẹ!'),
 'nguyetlongnu': ('fierce', 'Một lá, dồn hết sức — trăng tiếp lửa!'),
 'yeuhau': ('menacing', 'Hồn đã mất — về tay ta, mạnh hơn!'),
 'deonhansokhai': ('confident', 'Tay ta vươn tới — giảm giá hay thêm sức!'),
 'hoasat': ('laughs maniacally', 'Mỗi nơi có xác — một bức tranh đẹp!'),
 'thuyhau': ('commanding', 'Kẻ đứng một mình — sóng ban năm phần!'),
 'thuynu': ('coldly', 'Một mình bên hồ — bài rút nhẹ đi.'),
 'acmong': ('threatening', 'Ngủ đi… tỉnh dậy, tay bài đã khác!'),
 'dakhuc': ('intense', 'Tiếng sáo vang — chiến địa đổi chủ!'),
 'nhencogiap': ('shouting', 'Gõ thêm mấy nhát — cơ giáp nhện xuất trận!'),
 'kysitudich': ('coldly', 'Đủ năm vết thương — kỵ binh xác tiến lên!'),
 'thandong': ('confident', 'Đứng sau mà học — học là đánh được!'),
 'dathuongnu': ('coldly', 'Vứt ta đi? Ta nhảy tới chỗ yếu nhất!'),
 'tamkiemmienvien': ('fierce', 'Sen nở một nhát — quân nặng nhẹ đi!'),
 'vuathoigian': ('commanding', 'Quay ngược kim! Ba phép xưa, trở lại!'),
 'hongve': ('shouting', 'Côn chắn ngang! Kẻ yếu nhất, câm miệng!'),
 'cuongnhando': ('furious', 'Còn để dành sức à? Ta nổi giận đây!'),
 'cuongdomienvien': ('war cry', 'Ra sớm thì mạnh! Rìu đâu, xông lên!'),
 'soidomienvien': ('growls', 'Tay bài càng đầy, lửa ta càng dữ!'),
 'chimcanhdo': ('battle cry', 'Ta bay đi — đồng đội thế chỗ!'),
 'chonvacay': ('sarcastic', 'Đặt đây hả? Tụi ta lấy phần trước!'),
 'haplucchiare': ('sarcastic', 'Lá mạnh nhất của ngươi? Giờ là của ta!'),
 'trinu': ('proudly', 'Mỗi con số khác nhau — ta cộng hết!'),
 'nhendotham': ('menacing', 'Một bóng ở đây — một bóng sau lưng ngươi!'),
 'khinhdich': ('laughs maniacally', 'Vứt à? Ta nảy lại, còn khoẻ hơn!'),
 'bocapngaymoi': ('menacing', 'Lá bùa này — nhân đôi mọi vết thương!'),
 'thetdich': ('furious', 'Dám nhúc nhích? Tiếng thét đòi phần!'),
 'kysinguyetyeu': ('aggressive', 'Ba lá trơn đủ rồi — thỏ trăng, cướp!'),
 'hoavatnu': ('commanding', 'Biến! Ai ở đây cũng thành kẻ khác!'),
 'vouyamdia': ('threatening', 'Ba con quỷ đã vào bài. Run đi!'),
 'longbattu': ('roars', 'Lửa xanh bất diệt! Kẻ cuối, tiếp sức!'),
 'ngansat': ('coldly', 'Lá đầu bài ngươi — đã mất máu.'),
 'chomay': ('aggressive', 'Gâu! Kéo đồng đội về — cắn tiếp!'),
 'toctu': ('shouting', 'Dùng hết sức đi! Ta nhanh hơn mỗi lượt!'),
 'nhenngaymoi': ('fierce', 'Hai bước nhảy — đâu cũng thêm sức!'),
 'nhenbongdem': ('menacing', 'Lá trên cùng — ta dệt thành tám!'),
 'nhennoiloan': ('sarcastic', 'Hát xẩm dạo qua — tiện tay cướp hai!'),
 'ansao': ('confident', 'Cho địch ba sao? Ta vẫn thắng!'),
 'buisao': ('threatening', 'Không ai chen vào — trừ khi tự bước tới!'),
 'tinhchuathaiduong': ('proudly', 'Năng lượng để dành — mặt trời trả lãi!'),
 'kysidoibao': ('growls', 'Nhịn đói hai lượt — rồi ta ăn sạch!'),
 'diphaptoithuong': ('commanding|shouting', 'Vạn pháp quy nhất! Hợp thể!'),
 'nhenthuongdang': ('commanding', 'Quân có công — soái cấp thêm lương!'),
 'diennu': ('aggressive', 'Tách! Lá kế tiếp đã được sạc điện!'),
 'hoamavuong': ('laughs maniacally', 'Mười sức trở lên? Rót thêm rượu lửa!'),
 'nhenhacdich': ('menacing', 'Kẻ nhỏ nhất ở đây — hoà vào mực ta!'),
 'nhenlong': ('proudly', 'Mạnh nhất bàn là ta! Ai dám tranh?'),
 'virutcosinh': ('coldly', 'Lây nhiễm hoàn tất. Các ngươi là ta.'),
 'tuongquan': ('commanding', 'Địch còn chần chừ? Đại quân, xuất kích!'),
 'bavuongtim': ('threatening', 'Sáu viên đá — định mệnh trong tay ta!'),
 'conhan': ('determined', 'Đồ cổ đã mở — theo ta mở đường!'),
 'thachquaisokhai': ('growls', 'Đá ngàn năm — mỗi lượt một vững!'),
 'nuchienbathu': ('fierce', 'Hai lá đúng nhịp — sẹo thêm, sức thêm!'),
 'docdich': ('laughs maniacally', 'Về tay hết đi! Ta béo thêm!'),
 'dacvuquocgia': ('coldly', 'Kẻ to xác ở đây — giảm sức đi.'),
 'huyetmenu': ('threatening', 'Mỗi mức năng lượng — một giọt máu!'),
 'huyetsatvuong': ('laughs maniacally', 'Tiêu sạch năng lượng? Thưởng giáo máu!'),
 'taysatnu': ('fierce', 'Đồ mới rèn ra — ta nện thêm sức!'),
 'huyenconu': ('confident', 'Thắng ở đây — tay bài sáng rực!'),
 'comaychien': ('war cry', 'Phá cổng! Đặt quân đâu cũng được!'),
 'cosinhthe': ('intense', 'Năng lượng thừa — ta rèn thành lợi thế!'),
 'vukhih': ('growls', 'Vứt ta? Gang sắt quay lại, rẻ hơn!'),
 'vukhix': ('roars', 'Đồng đội ngã — móng hổ càng sắc!'),
 'docnutrang': ('sarcastic', 'Một nụ hôn độc — tặng ngươi đấy!'),
 'phuthuytre': ('confident', 'Dùng hết rồi à? Thêm hai năng lượng!'),
 'trumthanhpho': ('proudly', 'Mạnh nhất bàn? Bá hộ ra giá rẻ!'),
 'kysivuottu': ('menacing', 'Đủ sáu sức — móng xương chia phần!'),
 'saotrongdau': ('commanding', 'Ba hay bốn năng lượng — biến khỏi đây!'),
 'xachacmieu': ('threatening', 'Meo… vứt thêm một đứa nữa!'),
 'xacdao': ('growls', 'Lật bài đi — bầy xác ăn phần!'),
 'xactinhquang': ('intense', 'Đồng đội ơi — hoá ánh sao cho ta!'),
 'bayxacnuotsao': ('growls', 'Sáu kẻ đã chọn — đều thành ta!'),
 'xacdeo': ('laughs maniacally', 'Kéo dài ra! Bầy xác thêm hai!'),
 'xachongphuthuy': ('menacing', 'Đặt bài đây — bầy xác lại đông!'),
 'xachacdich': ('coldly', 'Kẻ đầu tiên bên ta — nằm xuống trước.'),
 'hoathuatnu': ('threatening', 'Cường hoá ta đi — lửa đen sẽ đến!'),
 'lanvuong': ('shouting', 'Lặn xuống, mò lên — thêm quân nhỏ!'),
 'thanai': ('determined', 'Se thêm sợi chỉ — mạnh thêm một phần!'),
 'hacdiemchua': ('menacing', 'Nghi thức bắt đầu! Lửa đen trỗi dậy!'),
 'khoinguyenvuong': ('commanding', 'Gieo đủ mọi miền — tận thế nảy mầm!'),
 'kechinhphatthoigian': ('war cry', 'Bốn thời đại — bốn ta cùng chinh phạt!'),
 'lucac': ('laughs maniacally', 'Sáu đứa ác — gộp lại thành một!'),
 'phapsugia': ('confident', 'Mỗi lượt một thần chú — đỡ nổi không?'),
 'chutruongnu': ('fierce', 'Lá kế tiếp — để ta yểm phép!'),
 'quyensuthaphoan': ('battle cry', 'Mười chiếc vòng! Khai mở càn khôn!'),
 'kerinh': ('threatening', 'Suỵt… đồ nghề sẵn rồi. Giữ chặt túi!'),
 'thuanung': ('battle cry', 'Khiên lớn sang bên kia! Ta canh chừng!'),
 'huyettruonglao': ('menacing', 'Ba lần cướp máu — ta hoá cự thú!'),
 'tamtudo': ('intense|menacing', 'Ba con mắt — ba quyền năng!'),
 'nuhoanghonmang': ('laughs maniacally', 'Hỗn loạn mỗi lượt — miễn phí!'),
 'loantuong': ('laughs maniacally', 'Lật! Lật! Lật! Cái lớn nhất đây!'),
 'trungphatcogiap': ('threatening', 'Đã đánh dấu. Kẻ nào cản — bị phạt!'),
 'bavuongmienvien': ('war cry|shouting', 'Mỗi lá bài một mũi tên. Bắn!'),
 'nguyetthach': ('coldly', 'Kẻ nhỏ giữ gì — ta giữ nấy.'),
 'thietgiapthuongdang': ('proudly', 'Giảm hay tăng — ta nhận gấp đôi!'),
 'kenuotsaosokhai': ('sarcastic', 'Lá tiếp theo ngươi đặt — sẽ phục vụ ta!'),
 'dihien': ('commanding', 'Dời chỗ xong chưa? Dì thưởng tận tay!'),
}


CO_DINH = {  # 6 thẻ mẫu đã duyệt: giữ đúng giọng
 'chienthan': '7hsfEc7irDn6E8br0qfw', 'phanquanthiengioi': 'Vr1jwoqy1MDvyAPwDY9C',
 'maynuotthoigian': 'DXiwi9uoxet6zAiZXynP', 'kevocam': 'ueSxRO0nLF1bj93J2hVt',
 'cucquang': 'DvG3I1kDzdBY3u4EzYh6', 'nhennon': 'a3AkyqGG4v8Pg7SWQ0Y3',
}

KIEU_MO_TA = {
 'M_OLD': 'nhân vật lão/thông thái → giọng nam lớn tuổi, trầm chậm',
 'M_DEEP': 'tướng/vua/thần uy nghiêm → giọng nam trầm, mạnh',
 'M_DARK': 'nhân vật ma mị/hung tợn → giọng nam trầm tối',
 'M_MID': 'nam trung niên, mưu mẹo → giọng nam trung niên diễn cảm',
 'M_YOUNG': 'nhân vật trẻ/lanh lợi → giọng nam trẻ',
 'F_YOUNG': 'nữ trẻ năng động → giọng nữ trẻ sáng',
 'F_CUTE': 'nhân vật nhỏ/tinh nghịch → giọng nữ trẻ dễ thương',
 'F_SOFT': 'nữ bí ẩn/ma mị → giọng nữ mềm, thì thầm',
 'F_MID': 'nữ quyền uy/trưởng thành → giọng nữ trung niên',
 'F_STRONG': 'nữ chiến binh → giọng nữ chắc, tự tin',
}


def dac_diem(v):
    s = ' '.join(str(v.get(k) or '') for k in ('ten', 'mota', 'kieu', 'nhan')).lower()
    def co(*w):
        return any(x in s for x in w)
    return dict(
        tuoi=(v.get('tuoi') or '').replace('-', '_'),
        deep=co('deep', 'powerful', 'resonant', 'baritone', 'authoritative', 'strong', 'forceful', 'serious', 'mature', 'husky'),
        soft=co('soft', 'whisper', 'gentle', 'calm', 'soothing', 'dreamy', 'peaceful', 'smooth', 'pensive'),
        cute=co('cute', 'bubbly', 'playful', 'bright', 'lively', 'energetic', 'youthful', 'sweet', 'excited', 'vibrant', 'upbeat', 'curious'),
        conf=co('confident', 'firm', 'powerful', 'strong', 'dynamic', 'emphatic', 'inspiring'),
        whisper=co('whisper', 'mysterious', 'alluring', 'atmospheric'),
        story=(v.get('dung') in ('narrative_story', 'entertainment_tv', 'characters_anima')) or co('story', 'narrat', 'actor', 'character', 'cinematic', 'expressive'),
        xau=(v.get('dung') in ('advertisement', 'informative_educ')) or co('news', 'commercial', 'sales', 'teacher', 'doctor', 'educator', 'finance', 'review', 'tutorial', 'announcer', 'mc '),
        treem=co('child', 'young girl', 'kid', 'fairy tale', 'lullab'),
        luc=co('deep', 'powerful', 'strong', 'intense', 'dramatic', 'authoritative', 'energetic', 'forceful',
               'bold', 'commanding', 'epic', 'heroic', 'cinematic', 'power', 'dynamic', 'gravelly', 'rough'),
        mem=co('soft', 'whisper', 'soothing', 'gentle', 'peaceful', 'relax', 'sleep', 'meditat', 'asmr', 'comfort',
               'consult', 'customer', 'support', 'healing', 'sweet', 'tender', 'calming', 'podcast'),
    )


def diem(kieu, f):
    t = f['tuoi']
    d = 0.0
    if kieu == 'M_OLD':
        d += {'old': 5, 'middle_aged': 2, 'young': -2}.get(t, 0) + 2 * f['deep'] + f['soft'] * .5
    elif kieu == 'M_DEEP':
        d += {'old': 1, 'middle_aged': 2, 'young': 0}.get(t, 0) + 3 * f['deep'] + f['conf']
    elif kieu == 'M_DARK':
        d += {'old': 1, 'middle_aged': 1.5, 'young': .5}.get(t, 0) + 3 * f['deep'] + f['whisper']
    elif kieu == 'M_MID':
        d += {'old': 0, 'middle_aged': 2, 'young': .5}.get(t, 0) + .5 * f['conf']
    elif kieu == 'M_YOUNG':
        d += {'old': -3, 'middle_aged': 0, 'young': 3}.get(t, 0) + f['cute']
    elif kieu == 'F_YOUNG':
        d += {'middle_aged': 0, 'young': 2}.get(t, 0) + .7 * f['cute'] + .5 * f['conf']
    elif kieu == 'F_CUTE':
        d += {'middle_aged': -1, 'young': 2}.get(t, 0) + 2 * f['cute']
    elif kieu == 'F_SOFT':  # nay: nữ lạnh lùng/đe doạ
        d += {'middle_aged': 1, 'young': 1}.get(t, 0) + f['deep'] + f['conf'] + f['whisper']
    elif kieu == 'F_MID':
        d += {'middle_aged': 3, 'young': 0}.get(t, 0) + f['deep'] + .5 * f['soft']
    elif kieu == 'F_STRONG':
        d += {'middle_aged': 1, 'young': 1}.get(t, 0) + 2 * f['conf'] + f['deep']
    d += 1.0 * f['story'] - 1.2 * f['xau'] - 8 * f['treem'] + 2.0 * f['luc'] - 2.0 * f['mem']
    return d


def main():
    the = json.load(open(THE, encoding='utf-8'))
    giong = json.load(open(GIONG, encoding='utf-8'))
    assert set(MOI) == set(D), set(MOI) ^ set(D)
    assert len(the) == 194 and set(D) == {x['id'] for x in the}, set(D) ^ {x['id'] for x in the}
    gmap = {g['id']: g for g in giong}
    feats = [dac_diem(g) for g in giong]
    LON = 1e6
    C = np.full((len(the), len(giong)), LON)
    for i, x in enumerate(the):
        gioi, chac, tag, cau, kieu = D[x['id']]
        if x['id'] in CO_DINH:
            C[i, [g['id'] for g in giong].index(CO_DINH[x['id']])] = -1000
            continue
        can = 'male' if kieu.startswith('M') else 'female'
        for j, g in enumerate(giong):
            if g['id'] in CO_DINH.values():
                continue
            gg = g.get('gioi') or ''
            if gioi in ('nam', 'nu'):
                if gg != can:
                    continue
            else:  # khac: theo cảm giác, cho phép giọng trung tính/không ghi
                if gg not in (can, '', 'neutral'):
                    continue
            C[i, j] = -diem(kieu, feats[j]) + (0.5 if gg in ('', 'neutral') and kieu not in ('M_OLD', 'M_DEEP', 'M_DARK') else 0)
    r, c = linear_sum_assignment(C)
    assert (C[r, c] < LON).all()
    ra = []
    for i, j in zip(r, c):
        x = the[i]; g = giong[j]
        gioi, chac, _t, _c, kieu = D[x['id']]
        tg, cau = MOI[x['id']]
        tag = ' '.join(f'[{t}]' for t in tg.split('|'))
        ten_g = g['ten'].strip()
        ky = x['kyNang'].split('.')[0][:70]
        ra.append(dict(
            k=x['id'], ten=x['ten'], gioi=gioi, chac=chac, cau=cau, tag=tag,
            text=f'{tag} {cau}', giong=g['id'], tenGiong=ten_g,
            lydo=f'Câu gợi kỹ năng "{ky}"; {KIEU_MO_TA[kieu]} ({g.get("gioi") or "?"}/{g.get("tuoi")}, {(g.get("kieu") or "").strip() or "—"}).'
        ))
    ra.sort(key=lambda e: [x['id'] for x in the].index(e['k']))
    out = {'_ghi_chu': 'Câu thoại ra mắt 194 thẻ S5 — bản GIAO ĐẤU (văn phong C, khẩu khí tuyên chiến, thẻ cảm xúc giao đấu). '
                       'tag = audio tag eleven_v3; text = tag + " " + cau gửi ElevenLabs; mỗi thẻ một voice id riêng. '
                       'Giọng chỉ lấy từ tools/giong_viet.json (rate ≤ 1). gioi khac = quái vật/đồ vật, chac=false = giới tính suy đoán. Sinh bởi tools/tao_thoai_s5.py, kiểm bằng tools/kiem_thoai_s5.py.',
           'list': ra}
    json.dump(out, open(RA, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('ghi', RA, len(ra))


if __name__ == '__main__':
    main()
