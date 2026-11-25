// Link ngắn TamDia: chuyển hướng sang trang chính trên GitHub Pages (giữ nguyên đường dẫn và tham số).
const DICH = "https://ngocngon.github.io/linhthutamdia";
export default {
  fetch(req) {
    const u = new URL(req.url);
    return Response.redirect(DICH + (u.pathname === "/" ? "/" : u.pathname) + u.search, 302);
  },
};
