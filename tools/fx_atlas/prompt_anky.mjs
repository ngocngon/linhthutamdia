import { load } from "../he_mota.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const H = load();
const m = JSON.parse(readFileSync("tools/fx_atlas_mau.json","utf8"));
const MAU={lua:"đỏ cam",bang:"xanh băng",sam:"vàng điện",doc:"xanh lá độc và tím",toi:"tím đen",sang:"trắng vàng",gio:"ngọc bích",dat:"nâu vàng đất",nuoc:"xanh biển",mau:"đỏ thẫm",cokhi:"đồng thau",hon:"xanh lam ma mị",moc:"xanh lá cây"};
const out={};
for (const t of m.tam) { if (!t.f.includes("anky")) continue;
  const lines = t.k.map((k,i)=>{ if(!k) return `(${i+1}) huy hiệu trống đồng đơn giản, vàng kim`;
    const id=k.slice(3); let d=H.MOTA[id]||("hình tượng gợi ý niệm "+(H.C[id]?.n||id).toLowerCase()); d=d.replace(/^[^:]{1,40}:\s*/,"").split(/[,.]/).slice(0,2).join(",").trim().split(" ").slice(0,18).join(" ");
    const he=H.elOf(id); return `(${i+1}) ${d} — màu ${MAU[he]||"vàng kim"}`; });
  out[t.f]=lines;
}
writeFileSync("tools/fx_atlas/anky_prompts.json", JSON.stringify(out,null,1));
console.log(Object.keys(out).length); console.log(out["L11_anky.webp"].join("\n"));
