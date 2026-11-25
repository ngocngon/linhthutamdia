// Link ngắn TamDia: chuyển hướng sang trang chính trên tamdia.pages.dev (giữ nguyên đường dẫn và tham số).
const DICH = "https://tamdia.pages.dev";
export default {
  fetch(req) {
    const u = new URL(req.url);
    return Response.redirect(DICH + (u.pathname === "/" ? "/" : u.pathname) + u.search, 302);
  },
};
