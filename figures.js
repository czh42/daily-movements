/* Morning movements: the line figures.

   One small figure per move, drawn from joint angles so the limbs keep their
   lengths, and moved by a phase that runs from 0 to 1 over the move's period.
   The page asks for a pose at a phase and draws it; the notes panel draws a
   few still phases as a storyboard.

   Three views. "side": the figure faces right; angles are degrees measured
   from straight down, positive toward the right, so 0 hangs, 90 points
   forward and 180 points up, and the torso and head are measured from
   straight up, positive leaning forward. "front": the figure faces the
   viewer, with the same angle convention (positive toward the viewer's
   right), and `turn` narrows the shoulders to suggest a turn of the body.
   "quarter": the figure is turned three-quarters toward the viewer, and
   each limb is placed in three dimensions by two angles, one in the plane
   of walking (0 hangs, 90 points forward, 180 up) and one out to the side,
   so that arms moving forward and arms moving sideways both show. In the
   side and quarter views the left limbs are the far ones, drawn paler. */
(() => {
  'use strict';

  const L = { torso: 26, neck: 4, head: 5.2, upper: 14, fore: 13, thigh: 21, shin: 20, foot: 7, shoulder: 7, hip: 5 };
  const GROUND = 105, CX = 60;

  const rad = (d) => d * Math.PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // A limb from a joint: angle 0 hangs, 90 points right, 180 up.
  const limb = (p, a, len) => [p[0] + len * Math.sin(rad(a)), p[1] + len * Math.cos(rad(a))];
  // The torso and neck point up: angle 0 upright, positive leaning right.
  const rise = (p, a, len) => [p[0] + len * Math.sin(rad(a)), p[1] - len * Math.cos(rad(a))];

  // A hand reaching for a point: where the elbow goes. `bend` picks the side
  // the elbow bends to. Out of reach, the arm straightens toward the point.
  function reach(sh, to, bend) {
    const dx = to[0] - sh[0], dy = to[1] - sh[1];
    const h = Math.hypot(dx, dy) || 0.001;
    const d = clamp(h, Math.abs(L.upper - L.fore) + 0.01, L.upper + L.fore - 0.01);
    const base = Math.atan2(dx, dy);
    const a = Math.acos((L.upper * L.upper + d * d - L.fore * L.fore) / (2 * L.upper * d));
    const ang = base + bend * a;
    const elbow = [sh[0] + L.upper * Math.sin(ang), sh[1] + L.upper * Math.cos(ang)];
    const hand = [sh[0] + dx / h * d, sh[1] + dy / h * d];
    return [elbow, hand];
  }

  // The lowest foot point sits on the ground; on the floor, the hands count
  // too. Everything is then moved into the picture.
  function settle(k, p) {
    let pts = [k.ll[2], k.ll[3], k.rl[2], k.rl[3]];
    if (p.floor) pts = pts.concat([k.la[2], k.ra[2]]);
    const low = Math.max(...pts.map((q) => q[1]));
    const ox = CX + (p.dx || 0), oy = GROUND - low - (p.lift || 0);
    const at = (q) => [q[0] + ox, q[1] + oy];
    return { H: at(k.H), S: at(k.S), N: at(k.N), C: at(k.C), la: k.la.map(at), ra: k.ra.map(at), ll: k.ll.map(at), rl: k.rl.map(at), ox, oy };
  }

  // ---------- The flat views ----------
  function skeletonFlat(p) {
    const side = p.view === 'side';
    const sw = side ? 1.2 : L.shoulder * Math.cos(rad(p.turn || 0));
    const hw = side ? 0.8 : L.hip * Math.cos(rad(p.turnHips || 0));
    const t = p.t || 0, hd = p.h == null ? t : p.h;
    const H = [0, 0];
    const S = rise(H, t, L.torso);
    const N = rise(S, hd, L.neck);
    const C = rise(S, hd, L.neck + L.head);
    const shL = [S[0] - sw, S[1]], shR = [S[0] + sw, S[1]];
    const hipL = [-hw, 0], hipR = [hw, 0];
    const arm = (sh, u, f, to, bend) => {
      if (to) { const [e, w] = reach(sh, to, bend); return [sh, e, w]; }
      const e = limb(sh, u || 0, L.upper);
      return [sh, e, limb(e, f || 0, L.fore)];
    };
    const leg = (hip, th, sn, ft, flen) => {
      const k = limb(hip, th || 0, L.thigh);
      const a = limb(k, sn || 0, L.shin);
      return [hip, k, a, limb(a, ft, flen == null ? L.foot : flen)];
    };
    const la = arm(shL, p.ul, p.fl, p.aL, p.bL == null ? -1 : p.bL);
    const ra = arm(shR, p.ur, p.fr, p.aR, p.bR == null ? 1 : p.bR);
    const ll = leg(hipL, p.pl, p.sl, p.ftl == null ? (side ? 90 : -90) : p.ftl, p.footl);
    const rl = leg(hipR, p.pr, p.sr, p.ftr == null ? 90 : p.ftr, p.footr);
    return settle({ H, S, N, C, la, ra, ll, rl }, p);
  }

  // ---------- The three-quarter view ----------
  // Points are [right, forward, up] in the figure's own frame.
  const v3 = {
    along: (q, d, len) => [q[0] + d[0] * len, q[1] + d[1] * len, q[2] + d[2] * len],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  // A direction from two angles: `a` in the walking plane (0 hangs, 90
  // forward, 180 up) and `b` out to the figure's own side.
  const dir3 = (side, a, b) => {
    const A = rad(a || 0), B = rad(b || 0);
    return [side * Math.sin(B), Math.cos(B) * Math.sin(A), -Math.cos(B) * Math.cos(A)];
  };
  // A hand reaching for a point in space; the elbow goes toward `pole`.
  function reach3(S, T, pole) {
    const d = v3.sub(T, S);
    const h = v3.len(d) || 0.001;
    const dd = clamp(h, Math.abs(L.upper - L.fore) + 0.01, L.upper + L.fore - 0.01);
    const dh = [d[0] / h, d[1] / h, d[2] / h];
    const along = (L.upper * L.upper + dd * dd - L.fore * L.fore) / (2 * dd);
    const perp = Math.sqrt(Math.max(0, L.upper * L.upper - along * along));
    let n = v3.sub(pole, [dh[0] * v3.dot(pole, dh), dh[1] * v3.dot(pole, dh), dh[2] * v3.dot(pole, dh)]);
    const nl = v3.len(n);
    n = nl < 1e-6 ? [0, 0, -1] : [n[0] / nl, n[1] / nl, n[2] / nl];
    const E = v3.along(v3.along(S, dh, along), n, perp);
    return [E, v3.along(S, dh, dd)];
  }

  const QUARTER = 45;
  function skeletonQuarter(p) {
    const phi = rad(p.phi == null ? QUARTER : p.phi), cph = Math.cos(phi), sph = Math.sin(phi);
    const proj = (v) => [v[0] * cph + v[1] * sph, -v[2]];
    const t = rad(p.t || 0), hd = rad(p.h == null ? (p.t || 0) : p.h);
    const H = [0, 0, 0];
    const S = [0, L.torso * Math.sin(t), L.torso * Math.cos(t)];
    const N = [0, S[1] + L.neck * Math.sin(hd), S[2] + L.neck * Math.cos(hd)];
    const C = [0, S[1] + (L.neck + L.head) * Math.sin(hd), S[2] + (L.neck + L.head) * Math.cos(hd)];
    const shL = [-L.shoulder, S[1], S[2]], shR = [L.shoulder, S[1], S[2]];
    const hipL = [-L.hip, 0, 0], hipR = [L.hip, 0, 0];
    const arm = (sh, side, us, ul, fs, fl, to, pole) => {
      if (to) { const [e, w] = reach3(sh, to, pole || [side * 0.3, -0.2, -1]); return [sh, e, w]; }
      const e = v3.along(sh, dir3(side, us, ul), L.upper);
      return [sh, e, v3.along(e, dir3(side, fs, fl), L.fore)];
    };
    const leg = (hip, side, ps, pl, ss, sl, fs, fl, flen) => {
      const k = v3.along(hip, dir3(side, ps, pl), L.thigh);
      const a = v3.along(k, dir3(side, ss, sl), L.shin);
      return [hip, k, a, v3.along(a, dir3(side, fs == null ? 90 : fs, fl), flen == null ? L.foot : flen)];
    };
    const la = arm(shL, -1, p.uls, p.ull, p.fls, p.fll, p.tL, p.pL);
    const ra = arm(shR, 1, p.urs, p.url, p.frs, p.frl, p.tR, p.pR);
    const ll = leg(hipL, -1, p.pls, p.pll, p.sls, p.sll, p.ftls, p.ftll, p.footl);
    const rl = leg(hipR, 1, p.prs, p.prl, p.srs, p.srl, p.ftrs, p.ftrl, p.footr);
    return settle({ H: proj(H), S: proj(S), N: proj(N), C: proj(C), la: la.map(proj), ra: ra.map(proj), ll: ll.map(proj), rl: rl.map(proj) }, p);
  }

  const skeleton = (p) => (p.view === 'quarter' ? skeletonQuarter(p) : skeletonFlat(p));

  const f1 = (n) => Math.round(n * 10) / 10;
  const poly = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1])).join('');

  // Give an <svg> the parts of a figure: the ground, any dotted paths, the
  // rope behind, the far limbs, the body, the head, the near limbs, and the
  // rope in front, in that order.
  function make(svg) {
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.innerHTML = `<line class="fg-ground" x1="18" y1="${GROUND + 1}" x2="102" y2="${GROUND + 1}"/>`
      + '<path class="fg-extra"/><path class="fg-rope"/><path class="fg-far"/><path class="fg-body"/>'
      + `<circle class="fg-head" r="${L.head}"/><path class="fg-near"/><path class="fg-rope fg-rope-front"/>`;
    const c = svg.children;
    return { extra: c[1], rope: c[2], far: c[3], body: c[4], head: c[5], near: c[6], ropeFront: c[7] };
  }

  function draw(g, p) {
    const k = skeleton(p);
    const far = new Set(p.far || (p.view === 'front' ? [] : ['la', 'll']));
    const limbs = { ll: k.ll, rl: k.rl, la: k.la, ra: k.ra };
    let dFar = '', dNear = '';
    for (const id of ['ll', 'rl', 'la', 'ra']) {
      if (far.has(id)) dFar += poly(limbs[id]); else dNear += poly(limbs[id]);
    }
    g.far.setAttribute('d', dFar);
    g.near.setAttribute('d', dNear);
    g.body.setAttribute('d', poly([k.H, k.S, k.N]));
    g.head.setAttribute('cx', f1(k.C[0]));
    g.head.setAttribute('cy', f1(k.C[1]));
    let extra = '';
    if (p.orbits) {
      // A circle [x, y, r] or an oval [x, y, rx, ry], in the figure's own frame.
      for (const [x, y, rx, ry = rx] of p.orbits) {
        const X = f1(x + k.ox), Y = f1(y + k.oy);
        extra += `M${f1(X - rx)} ${Y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
      }
    }
    g.extra.setAttribute('d', extra);
    let rope = '';
    if (p.rope != null) {
      // A rope from hand to hand: under the feet at 0, over the head at 1.
      const a = k.la[2], b = k.ra[2];
      const apex = (GROUND + 1.5) + p.rope * ((k.C[1] - L.head - 8) - (GROUND + 1.5));
      const cy = 2 * apex - (a[1] + b[1]) / 2;
      rope = `M${f1(a[0])} ${f1(a[1])}Q${f1((a[0] + b[0]) / 2)} ${f1(cy)} ${f1(b[0])} ${f1(b[1])}`;
    }
    g.rope.setAttribute('d', p.ropeFront ? '' : rope);
    g.ropeFront.setAttribute('d', p.ropeFront ? rope : '');
  }

  // ---------- Moving between poses ----------
  // Numbers are angles unless listed here, and turn the short way round.
  const PLAIN = new Set(['lift', 'dx', 'rope', 'footl', 'footr', 'phi']);
  // Which way an elbow bends never blends; it holds until the midpoint.
  const SNAP = new Set(['bL', 'bR']);
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpAngle = (a, b, k) => a + (((b - a + 540) % 360) - 180) * k;

  function mix(a, b, k) {
    const out = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[key], y = b[key];
      if (typeof x === 'number' && typeof y === 'number') {
        out[key] = SNAP.has(key) ? (k < 0.5 ? x : y) : PLAIN.has(key) ? lerp(x, y, k) : lerpAngle(x, y, k);
      } else if (Array.isArray(x) && Array.isArray(y) && typeof x[0] === 'number') {
        out[key] = x.map((v, i) => lerp(v, y[i], k));
      } else {
        out[key] = k < 0.5 ? x : y;
      }
    }
    return out;
  }

  // Key poses, cycled: the phase runs through them and back to the first.
  const cycle = (frames) => (phase) => {
    const n = frames.length;
    const x = (((phase % 1) + 1) % 1) * n, i = Math.floor(x);
    return mix(frames[i], frames[(i + 1) % n], ease(x - i));
  };

  // ---------- The moves ----------
  // Shoulder joints stand at (±7, -26) in a front view; the hips at (±5, 0).
  // Hands may be given a point to reach for instead of angles; within one
  // move an arm keeps to one of the two, and to one elbow direction, so the
  // motion between poses stays smooth.
  const SH = -L.torso;
  const softKnees = { pl: 6, sl: -6, pr: 6, sr: -6 };
  const hang = { aL: [-9, 0], aR: [9, 0], bL: -1, bR: 1 };
  // 0 at the start of a cycle, 1 halfway, 0 again at the end: one smooth swing.
  const swing = (phase) => (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  // 0 below `from`, 1 above `to`, smooth between.
  const ramp = (x, from, to) => { const k = clamp((x - from) / (to - from), 0, 1); return k * k * (3 - 2 * k); };
  // A smooth curve through three values, at 0, 1/2 and 1.
  const through = (k, y0, y1, y2) => y0 * 2 * (k - 0.5) * (k - 1) - y1 * 4 * k * (k - 1) + y2 * 2 * k * (k - 0.5);

  // A body wave, side on: from a shallow squat with the arms swung behind,
  // rising as the arms swing forward and up overhead, then back down into
  // the squat as they swing behind again. With `tiptoe`, the heels lift as
  // the arms reach the top.
  const wave = (tiptoe) => (phase) => {
    const k = swing(phase);
    const arm = -45 + 220 * k;
    const bend = 26 * (1 - k);
    const up = tiptoe ? Math.max(0, (k - 0.55) / 0.45) : 0;
    return {
      t: 14 * (1 - k) - 4 * k, h: 22 * (1 - k) - 6 * k,
      ul: arm - 6, fl: arm - 2, ur: arm, fr: arm + 4,
      pl: bend, sl: -bend, pr: bend, sr: -bend,
      ftl: 90 - 50 * up, ftr: 90 - 50 * up,
    };
  };

  // One straight arm swings forward and up overhead while the other swings
  // down and a little behind, then they change places. Side on.
  const armSwings = (phase) => {
    const k = swing(phase);
    const a = -35 + 205 * k, b = 170 - 205 * k;
    return { t: 2, ul: a, fl: a, ur: b, fr: b, ...softKnees };
  };

  // Big circles from the shoulder with straight arms, both arms together,
  // seen from three-quarters on so that both show. `dir` 1 forward, -1 back.
  const bigCircles = (dir) => {
    const cph = Math.cos(rad(QUARTER)), sph = Math.sin(rad(QUARTER));
    const span = L.upper + L.fore;
    const ovals = [[-L.shoulder * cph, SH, span * sph, span], [L.shoulder * cph, SH, span * sph, span]];
    return (phase) => {
      const a = 180 - dir * 360 * phase;
      return { uls: a, fls: a, urs: a, frs: a, pls: 5, sls: -5, prs: 5, srs: -5, orbits: ovals };
    };
  };

  // The whole body turns like a pendulum. Turned to one side, that side's
  // arm is straight up and back, the other arm is bent with its hand at the
  // chest, and the far foot is up on its toes with the knee turned in while
  // the near foot stays flat. The raised arm swings down in front on the
  // way to the other side.
  const golf = (phase) => {
    const k = swing(phase);
    const ul = through(k, -160, -10, 40), ur = -through(1 - k, -160, -10, 40);
    const bl = ramp(k, 0.5, 1), br = ramp(k, 0.5, 0);
    return {
      turn: 45 * (1 - 2 * k), turnHips: 28 * (1 - 2 * k),
      ul, fl: ul + 120 * ramp(k, 0.55, 1), ur, fr: ur - 120 * ramp(k, 0.45, 0),
      pl: -8 + 32 * bl, sl: 8 - 37 * bl, ftl: -90 + 105 * bl, footl: 7 - 3 * bl,
      pr: 8 - 32 * br, sr: -8 + 37 * br, ftr: 90 - 105 * br, footr: 7 - 3 * br,
    };
  };

  // Turning at the waist with the arms hanging loose: the body leads and
  // the arms follow, the forearms a little behind the upper arms, so they
  // swing across to the hip on one side and behind on the other.
  const twist = (phase) => {
    const th = phase * 2 * Math.PI, s = Math.sin(th);
    const u = 42 * Math.sin(th - 0.45), f = 50 * Math.sin(th - 0.95);
    return { turn: 55 * s, turnHips: 40 * s, ul: u, fl: f, ur: u, fr: f, far: s > 0.25 ? ['ra'] : s < -0.25 ? ['la'] : [] };
  };

  // The rope passes under the feet while the body is up, and over the head
  // while the feet are down; it is in front on the way down.
  const rope = (phase) => {
    const th = phase * 2 * Math.PI;
    const down = Math.max(0, -Math.cos(th));
    return {
      ul: -15, fl: -95, ur: 15, fr: 95, lift: 5.5 * down, ftl: -90 + 40 * down, ftr: 90 - 40 * down,
      rope: (1 + Math.cos(th)) / 2, ropeFront: Math.sin(th) > 0,
    };
  };

  // Marching, three-quarters on: a knee up to a right angle with both hands
  // meeting on top of it, then a beat with both feet down and the forearms
  // out to the sides, then the other knee.
  const marchLean = { t: 16, h: 10 };
  const marchOut = { ...marchLean, pls: 0, pll: 0, sls: 0, ftls: 90, prs: 0, prl: 0, srs: 0, ftrs: 90,
    tL: [-19, 11, 11], tR: [19, 11, 11], pL: [0, 0, -1], pR: [0, 0, -1] };
  const marchKnee = (side) => ({ ...marchLean,
    pls: side < 0 ? 100 : 0, pll: side < 0 ? 4 : 0, sls: side < 0 ? 8 : 0, ftls: side < 0 ? 50 : 90,
    prs: side > 0 ? 100 : 0, prl: side > 0 ? 4 : 0, srs: side > 0 ? 8 : 0, ftrs: side > 0 ? 50 : 90,
    tL: [side * 6.35 - 1.85, 19, 6], tR: [side * 6.35 + 1.85, 19, 6], pL: [-0.4, -0.2, -1], pR: [0.4, -0.2, -1] });

  const MOVES = {
    'Lymphatic hops': { view: 'side', period: 0.55, stills: [0, 0.5], pose: cycle([
      { pl: 15, sl: -15, pr: 15, sr: -15, ul: 12, fl: 22, ur: 12, fr: 22 },
      { pl: 2, sl: -2, pr: 2, sr: -2, ftl: 55, ftr: 55, lift: 5.5, ul: 18, fl: 30, ur: 18, fr: 30 },
    ]) },

    'Body waves': { view: 'side', period: 2.4, stills: [0, 0.25, 0.5], pose: wave(false) },

    'Arm swings': { view: 'side', period: 1.2, stills: [0, 0.5], pose: armSwings },

    // Hands laced together in front, a hoop that turns with the trunk, on
    // soft knees.
    'Trunk twists': { view: 'front', period: 1.4, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 58, aL: [-19, -13], aR: [-19, -13], bL: -1, bR: 1, ...softKnees },
      { turn: 0, aL: [0, -9], aR: [0, -9], bL: -1, bR: 1, ...softKnees },
      { turn: 58, aL: [19, -13], aR: [19, -13], bL: -1, bR: 1, ...softKnees },
      { turn: 0, aL: [0, -9], aR: [0, -9], bL: -1, bR: 1, ...softKnees },
    ]) },

    'Forward arm circles': { view: 'quarter', period: 1.8, stills: [0, 0.25, 0.5], pose: bigCircles(1) },

    // Hinged forward, short of flat, so the back stays supported.
    'Bent over back shakes': { view: 'side', period: 0.5, stills: [0, 0.5], pose: cycle([
      { t: 62, h: 84, pl: 14, sl: -14, pr: 14, sr: -14, ul: 2, fl: 2, ur: 2, fr: 2 },
      { t: 70, h: 94, pl: 19, sl: -19, pr: 19, sr: -19, ul: -6, fl: -4, ur: -6, fr: -4 },
    ]) },

    'Backward arm circles': { view: 'quarter', period: 1.8, stills: [0, 0.25, 0.5], pose: bigCircles(-1) },

    // A sway with a light turn: a limp arm swings up so its forearm lands
    // across the chest, elbow hanging low, while the other arm swings behind.
    'Dead arms': { view: 'front', period: 1.5, stills: [0, 0.25, 0.5], pose: cycle([
      { t: -6, h: -4, turn: 30, turnHips: 8, aL: [6, -23], aR: [15, -2], bL: -1, bR: 1, far: ['ra'] },
      { t: 0, h: 0, turn: 0, turnHips: 0, ...hang, far: [] },
      { t: 6, h: 4, turn: 30, turnHips: 8, aR: [-6, -23], aL: [-15, -2], bL: -1, bR: 1, far: ['la'] },
      { t: 0, h: 0, turn: 0, turnHips: 0, ...hang, far: [] },
    ]) },

    'Golf swings': { view: 'front', period: 1.7, stills: [0, 0.25, 0.5], pose: golf },

    // The hands-out pose is held for a beat between knees.
    'Marches': { view: 'quarter', period: 2.7, stills: [0, 1 / 6], pose: cycle([marchKnee(1), marchOut, marchOut, marchKnee(-1), marchOut, marchOut]) },

    'Tiptoe body waves': { view: 'side', period: 2.4, stills: [0, 0.25, 0.5], pose: wave(true) },

    'Twist the waist': { view: 'front', period: 1.5, stills: [0, 0.25, 0.5], pose: twist },

    // Feet flat and turned out; the arms sweep out and up at the sides on the
    // way up, and back down the same way.
    'Ballet squats': { view: 'front', period: 2, stills: [0, 0.5], pose: cycle([
      { pl: -20, sl: -12, pr: 20, sr: 12, ftl: -85, ftr: 85, ul: -160, fl: -168, ur: 160, fr: 168 },
      { pl: -52, sl: 14.8, pr: 52, sr: -14.8, ftl: -85, ftr: 85, ul: -28, fl: -22, ur: 28, fr: 22 },
    ]) },

    // Straight arms open wide as one foot steps back behind the other and the
    // body turns a little; back to the middle for a clap.
    'Wide arm step backs': { view: 'front', period: 2.6, stills: [0, 0.25], pose: cycle([
      { aL: [0, -18], aR: [0, -18], bL: -1, bR: 1, far: [], turn: 0, turnHips: 0, t: 0 },
      { aL: [-33.9, -27], aR: [33.9, -27], bL: -1, bR: 1, far: ['rl'], turn: 18, turnHips: 10, t: -3, pr: -25, sr: -20, ftr: 60 },
      { aL: [0, -18], aR: [0, -18], bL: -1, bR: 1, far: [], turn: 0, turnHips: 0, t: 0 },
      { aL: [-33.9, -27], aR: [33.9, -27], bL: -1, bR: 1, far: ['ll'], turn: 18, turnHips: 10, t: 3, pl: 25, sl: 20, ftl: -60 },
    ]) },

    // One motion: the leg steps back into a light lunge as both arms rise
    // overhead, and everything returns to the middle together.
    'Backstep wave lunges': { view: 'side', period: 2.8, stills: [0, 0.25], pose: cycle([
      { t: 3, h: 6, ul: 10, fl: 16, ur: 10, fr: 16 },
      { t: -4, h: -8, pr: -38, sr: -38, ftr: 40, pl: 40, sl: -5, ul: 172, fl: 178, ur: 172, fr: 178 },
      { t: 3, h: 6, ul: 10, fl: 16, ur: 10, fr: 16 },
      { t: -4, h: -8, pl: -38, sl: -38, ftl: 40, pr: 40, sr: -5, ul: 172, fl: 178, ur: 172, fr: 178 },
    ]) },

    'Pushups': { view: 'side', period: 1.6, stills: [0, 0.5], pose: cycle([
      { t: 72, h: 95, pl: -72, sl: -72, pr: -72, sr: -72, ftl: 0, ftr: 0, aL: [24.7, 19], aR: [24.7, 19], bL: -1, bR: -1, floor: true, dx: 8 },
      { t: 80, h: 100, pl: -80, sl: -80, pr: -80, sr: -80, ftl: 0, ftr: 0, aL: [25, 14], aR: [25, 14], bL: -1, bR: -1, floor: true, dx: 8 },
    ]) },

    // Elbows loosely bent at the sides, hands turning out from the body.
    'Jump rope': { view: 'front', period: 0.6, stills: [0, 0.5], pose: rope },
  };

  // A still pose for a move at a phase, with the view filled in.
  const pose = (name, phase) => {
    const m = MOVES[name];
    return m ? { view: m.view, ...m.pose(phase) } : null;
  };

  window.Figures = {
    names: Object.keys(MOVES),
    has: (name) => Boolean(MOVES[name]),
    period: (name) => (MOVES[name] ? MOVES[name].period : 1),
    stills: (name) => (MOVES[name] ? MOVES[name].stills : [0]),
    pose,
    make,
    draw,
    // An <svg> element showing one still of a move.
    still(name, phase) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'fig-svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const g = make(svg);
      const p = pose(name, phase);
      if (p) draw(g, p);
      return svg;
    },
  };
})();
