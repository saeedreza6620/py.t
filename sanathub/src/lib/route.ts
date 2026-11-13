export type Pt = { lat: number; lng: number };

export function haversineKm(a: Pt, b: Pt) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * مسیر بهینه جمع‌آوری: از انبار خریدار شروع، همه کارگاه‌ها، بازگشت به انبار.
 * نزدیک‌ترین همسایه + بهبود 2-opt (برای ۱۰ تا ۳۰ توقف کاملاً کافی و آنی است).
 */
export function optimizeRoute<T extends Pt>(depot: Pt, stops: T[]): { order: T[]; km: number } {
  if (stops.length === 0) return { order: [], km: 0 };
  const left = [...stops];
  const order: T[] = [];
  let cur: Pt = depot;
  while (left.length) {
    let bi = 0;
    let bd = Infinity;
    left.forEach((p, i) => {
      const d = haversineKm(cur, p);
      if (d < bd) { bd = d; bi = i; }
    });
    cur = left[bi];
    order.push(left.splice(bi, 1)[0]);
  }
  const len = (o: Pt[]) => {
    let d = 0;
    let c: Pt = depot;
    for (const p of o) { d += haversineKm(c, p); c = p; }
    return d + haversineKm(c, depot);
  };
  let best = len(order);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      for (let k = i + 1; k < order.length; k++) {
        const cand = [...order.slice(0, i), ...order.slice(i, k + 1).reverse(), ...order.slice(k + 1)];
        const l = len(cand);
        if (l + 1e-9 < best) { best = l; order.splice(0, order.length, ...cand); improved = true; }
      }
    }
  }
  return { order, km: best };
}

/** ضریب پیچ‌وخم جاده نسبت به خط مستقیم برای تخمین مسافت واقعی */
export const ROAD_FACTOR = 1.35;
