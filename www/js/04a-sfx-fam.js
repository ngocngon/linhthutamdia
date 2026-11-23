/* Module 04a: phân họ âm thanh cho kỹ năng thẻ (thuần hàm, không đụng DOM/âm thanh).
   sfxFamOf(cardDef) -> khoá họ (xem SFX_FAMS) dựa trên điều kỹ năng THỰC SỰ làm; dùng để chọn tiếng cho kỹ năng
   không có hiệu ứng riêng, và để trang nghe thử liệt kê thẻ theo họ. */
const SFX_FAMS = {
  destroy: ["Tiêu huỷ", "destroy"], exile: ["Trục xuất", "f_exile"], discard: ["Vứt bỏ", "discard"], move: ["Di chuyển / dời", "move"],
  swap: ["Hoán đổi", "f_swap"], bounce: ["Trả về tay", "f_bounce"], pull: ["Kéo / rút từ bộ bài đối thủ", "f_pull"], draw: ["Rút thẻ của mình", "draw"], summon: ["Triệu hồi / thêm tại chiến địa", "summon"],
  create: ["Tạo thẻ vào tay", "f_create"], deckadd: ["Thêm vào bộ bài", "f_deckadd"], shuffle: ["Xáo thẻ", "f_shuffle"], revive: ["Hồi sinh", "revive"],
  copy: ["Sao chép kỹ năng", "f_copy"], steal: ["Cướp / đổi phe", "steal"], silence: ["Xoá / khoá kỹ năng", "silence"], lock: ["Cấm đặt / khoá chiến địa", "f_lock"],
  shield: ["Bất khả huỷ / bảo vệ", "shield"], up1: ["Tăng sức mạnh nhỏ", "f_smallup"], up2: ["Tăng sức mạnh vừa", "buff"], up3: ["Tăng sức mạnh lớn", "f_bigup"],
  dn1: ["Giảm sức mạnh nhỏ", "f_smalldn"], dn2: ["Giảm sức mạnh vừa", "debuff"], dn3: ["Giảm sức mạnh lớn", "f_bigdn"], dbl: ["Nhân đôi sức mạnh", "f_dbl"],
  egain: ["Nhận năng lượng", "f_energy2"], nrgloss: ["Mất năng lượng", "f_nrg_loss"], costdn: ["Giảm giá thẻ", "f_costdn"], costup: ["Tăng giá thẻ", "f_costup"],
  merge: ["Hợp thể / hấp thụ", "f_absorb"], morph: ["Biến đổi / đặt lại", "morph"], locup: ["Chiến địa tăng sức mạnh", "f_locup"], locdn: ["Chiến địa giáng hại", "f_afflict"],
  locx: ["Đổi chiến địa", "f_xform"], aura: ["Duy Trì / Bị Động", "f_aura"], endt: ["Cuối Lượt", "f_end"], act: ["Kích Hoạt", "act"], none: ["Không kỹ năng", ""]
};
function sfxFamOf(d) {
  if (!d || d.t === "none" || !d.x) return "none";
  const x = String(d.x).toLowerCase(), body = x.replace(/^[^:]*:\s*/, ""), first = (x.match(/^([^:]*):/) || [, ""])[1];
  const num = (/[+−\-]\s*(\d+)\s*sức mạnh|(\d+)\s*sức mạnh/.exec(body) || [])[1] || (/(\d+)/.exec(body) || [])[1] || 1;
  const mag = +num >= 6 ? 3 : +num >= 3 ? 2 : 1;
  if (/khi bị tiêu huỷ[^:]*:/.test(x) || /^khi bị tiêu huỷ/.test(x)) return /về tay|trả/.test(body) ? "bounce" : "revive";
  const ongoing = d.t === "on" || d.t === "pas" || first === "duy trì";
  if (ongoing) {
    if (/không thể bị|không thể di chuyển/.test(body)) return "shield";
    if (/kỹ năng lật không chạy|xoá kỹ năng|không ai có thể đặt|không thể đặt|phải đặt/.test(body)) return /đặt/.test(body) ? "lock" : "silence";
    if (/bay ra|thay thế nó|thêm một bản sao/.test(body)) return "summon";
    return "aura";
  }
  if (/trục xuất/.test(body)) return "exile";
  if (/hồi sinh/.test(body)) return "revive";
  if (/tiêu huỷ/.test(body) && !/không thể bị tiêu huỷ/.test(body)) return "destroy";
  if (/vứt/.test(body)) return "discard";
  if (/đổi phe|cướp|lấy kỹ năng/.test(body)) return "steal";
  if (/xoá (các )?kỹ năng|mất kỹ năng|kỹ năng lật không chạy/.test(body)) return "silence";
  if (/sao chép kỹ năng|chép kỹ năng|lặp lại|kích lại|dùng kỹ năng|trở thành bản sao/.test(body)) return "copy";
  if (/không thể bị|bảo vệ|miễn nhiễm/.test(body)) return "shield";
  if (/nhân đôi|gấp đôi/.test(body)) return "dbl";
  if (/xáo/.test(body)) return "shuffle";
  if (/vào bộ bài/.test(body)) return "deckadd";
  if (/hoán đổi|đổi chỗ/.test(body)) return "swap";
  if (/trả .*về tay|về tay/.test(body)) return "bounce";
  if (/kéo/.test(body)) return "pull";
  if (/làm ngập|ngập/.test(body)) return "lock";
  if (/rút/.test(body)) return /đối thủ/.test(body) ? "pull" : "draw";
  if (/đặt .*từ tay|thêm .*(vào đây|tại đây)|bản sao .*(vào đây|tại đây)/.test(body)) return "summon";
  if (/di chuyển|dời|đi nơi khác/.test(body)) return "move";
  if (/thay (đổi )?chiến địa/.test(body)) return "locx";
  if (/sao chép|tạo|vào tay|nhận .* thẻ/.test(body)) return "create";
  if (/triệu hồi|thêm .*(tại đây|vào mỗi chiến địa|vào chiến địa)/.test(body)) return "summon";
  if (/mất .*năng lượng|trừ .*năng lượng của bạn/.test(body)) return "nrgloss";
  if (/giảm .*năng lượng|năng lượng .*giảm/.test(body)) return "costdn";
  if (/nhận .*năng lượng|\+\d+ năng lượng|thêm .*năng lượng cho/.test(body)) return "egain";
  if (/tăng .*năng lượng|cộng \d+ năng lượng|năng lượng tối đa|năng lượng \d+ cho đến/.test(body)) return "costup";
  if (/(trừ|giảm) \d+ sức mạnh|[−-]\d+ sức mạnh|giảm sức mạnh/.test(body)) return "dn" + mag;
  if (/nuốt|hấp thụ|hợp thể|nhận sức mạnh của|lấy .*sức mạnh/.test(body)) return "merge";
  if (/chỉnh|đặt .*thành|đặt lại|bằng sức mạnh của/.test(body)) return "morph";
  if (/\+\d+ sức mạnh|cộng \d+|tăng \d+ sức mạnh/.test(body)) return "up" + mag;
  if (/chiến địa/.test(body)) return "locx";
  if (d.t === "end" || first === "cuối lượt") return "endt";
  if (d.t === "act" || first === "kích hoạt") return "act";
  return "morph";
}
if (typeof module !== "undefined") module.exports = { SFX_FAMS, sfxFamOf };
