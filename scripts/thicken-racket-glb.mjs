// Thicken a single-image racket mesh to real padel proportions.
// Real racket: head ≈ 260 mm wide × 38 mm thick → depth = 0.146 × head width.
// Head (wide part) is scaled in Z to that ratio; the handle is made round
// (depth = its width); the throat blends smoothly between the two.
// Normals get the matching inverse scale so edges shade correctly.
// Usage: node thicken.mjs in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [inp, out] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const nrm = prim.getAttribute('NORMAL');
    const n = pos.getCount();
    const p = [0, 0, 0];
    let ymin = Infinity, ymax = -Infinity;
    for (let i = 0; i < n; i++) { pos.getElement(i, p); ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
    const H = ymax - ymin;

    // Width / depth profile in 60 horizontal slices.
    const S = 60;
    const sl = Array.from({ length: S }, () => ({ xmin: Infinity, xmax: -Infinity, zmin: Infinity, zmax: -Infinity }));
    for (let i = 0; i < n; i++) {
      pos.getElement(i, p);
      const s = sl[Math.min(S - 1, Math.floor(((p[1] - ymin) / H) * S))];
      s.xmin = Math.min(s.xmin, p[0]); s.xmax = Math.max(s.xmax, p[0]);
      s.zmin = Math.min(s.zmin, p[2]); s.zmax = Math.max(s.zmax, p[2]);
    }
    const width = sl.map((s) => (s.xmax > s.xmin ? s.xmax - s.xmin : 0));
    const depth = sl.map((s) => (s.zmax > s.zmin ? s.zmax - s.zmin : 0));
    const wmax = Math.max(...width);
    // Head = upper slices wider than 55 % of max width; handle = lower narrow part.
    const headIdx = width.map((w, i) => (w > 0.55 * wmax && i > S * 0.35 ? i : -1)).filter((i) => i >= 0);
    const headStart = Math.min(...headIdx);
    const handleIdx = width.map((w, i) => (w > 0 && w < 0.22 * wmax && i < headStart ? i : -1)).filter((i) => i >= 0);
    const handleTop = handleIdx.length ? Math.max(...handleIdx) : Math.floor(headStart * 0.6);

    const med = (arr) => { const a = arr.filter((v) => v > 0).sort((x, y) => x - y); return a[Math.floor(a.length / 2)] || 0; };
    const headDepth = med(headIdx.map((i) => depth[i]));
    const headWidth = Math.max(...headIdx.map((i) => width[i]));
    const kHead = Math.min(4, Math.max(1, (0.146 * headWidth) / headDepth));
    const hW = med(handleIdx.map((i) => width[i]));
    const hD = med(handleIdx.map((i) => depth[i]));
    const kHandle = Math.min(2.5, Math.max(1, (0.95 * hW) / (hD || hW)));
    const zcHead = med(headIdx.map((i) => (sl[i].zmin + sl[i].zmax) / 2)) || 0;
    const zcHandle = med(handleIdx.map((i) => (sl[i].zmin + sl[i].zmax) / 2)) || zcHead;

    const yHandleTop = ymin + ((handleTop + 1) / S) * H;
    const yHeadStart = ymin + (headStart / S) * H;
    const q = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      pos.getElement(i, p);
      const t = smooth(yHandleTop, yHeadStart, p[1]); // 0 handle → 1 head
      const k = kHandle + (kHead - kHandle) * t;
      const zc = zcHandle + (zcHead - zcHandle) * t;
      p[2] = zc + (p[2] - zc) * k;
      pos.setElement(i, p);
      if (nrm) {
        nrm.getElement(i, q);
        q[2] /= k;
        const l = Math.hypot(q[0], q[1], q[2]) || 1;
        nrm.setElement(i, [q[0] / l, q[1] / l, q[2] / l]);
      }
    }
    console.log(`${inp}: head depth ×${kHead.toFixed(2)}, handle depth ×${kHandle.toFixed(2)} (head ${headStart}/${S}, handle top ${handleTop}/${S})`);
  }
}
await io.write(out, doc);
