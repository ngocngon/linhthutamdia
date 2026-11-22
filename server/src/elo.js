// Elo đơn giản cho xếp hạng online
export const START_RATING = 1000;
export function eloDelta(ra, rb, scoreA, k = 24) {
  const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  return Math.round(k * (scoreA - ea));
}
export const PTS_WIN = 3, PTS_DRAW = 1; // khớp lbAdd của client (thắng +3, hoà +1)
export const MODES = ["online"]; // chế độ có xếp hạng Elo do máy chủ chấm
export const SCORE_MODES = ["rank", "online", "jr", "wk", "conq", "draft"]; // chế độ có bảng điểm theo kỳ
export const PKEY_RE = /^(d\d{4}-\d{2}-\d{2}|m\d{4}-\d{2}|w\d{1,5})$/;
