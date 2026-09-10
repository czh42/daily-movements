/* Morning movements: the line figures.

   One small figure per move, drawn from joint angles so the limbs keep their
   lengths, and moved by a phase that runs from 0 to 1 over the move's period.
   The page asks for a pose at a phase and draws it; the notes panel draws a
   few still phases as a storyboard.

   Angles are degrees. A limb angle is measured from straight down, positive
   toward the right: 0 hangs, 90 points right, 180 points up. The torso and
   the head are measured from straight up instead, positive leaning right.
   In a side view the figure faces right, and its left limbs are the far
   ones, drawn paler and behind. In a front view it faces the viewer. */
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

  // Every joint of a pose, in figure coordinates, standing on the ground.
  function skeleton(p) {
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
    const leg = (hip, th, sn, ft) => {
      const k = limb(hip, th || 0, L.thigh);
      const a = limb(k, sn || 0, L.shin);
      return [hip, k, a, limb(a, ft, L.foot)];
    };
    const la = arm(shL, p.ul, p.fl, p.aL, p.bL == null ? -1 : p.bL);
    const ra = arm(shR, p.ur, p.fr, p.aR, p.bR == null ? 1 : p.bR);
    const ll = leg(hipL, p.pl, p.sl, p.ftl == null ? (side ? 90 : -90) : p.ftl);
    const rl = leg(hipR, p.pr, p.sr, p.ftr == null ? 90 : p.ftr);
    // The lowest foot point sits on the ground; on the floor, the hands count too.
    let pts = [ll[2], ll[3], rl[2], rl[3]];
    if (p.floor) pts = pts.concat([la[2], ra[2]]);
    const low = Math.max(...pts.map((q) => q[1]));
    const ox = CX + (p.dx || 0), oy = GROUND - low - (p.lift || 0);
    const at = (q) => [q[0] + ox, q[1] + oy];
    return { H: at(H), S: at(S), N: at(N), C: at(C), la: la.map(at), ra: ra.map(at), ll: ll.map(at), rl: rl.map(at), ox, oy };
  }

  const f1 = (n) => Math.round(n * 10) / 10;
  const poly = (pts) => pts.map((q, i) => (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1])).join('');

  // Give an <svg> the parts of a figure: the ground, any extra marks, the far
  // limbs, the body, the head, and the near limbs, in that order.
  function make(svg) {
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.innerHTML = `<line class="fg-ground" x1="18" y1="${GROUND + 1}" x2="102" y2="${GROUND + 1}"/>`
      + '<path class="fg-extra"/><path class="fg-rope"/><path class="fg-far"/><path class="fg-body"/>'
      + `<circle class="fg-head" r="${L.head}"/><path class="fg-near"/>`;
    const c = svg.children;
    return { extra: c[1], rope: c[2], far: c[3], body: c[4], head: c[5], near: c[6] };
  }

  function draw(g, p) {
    const k = skeleton(p);
    const far = new Set(p.far || (p.view === 'side' ? ['la', 'll'] : []));
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
      for (const [x, y, r] of p.orbits) {
        const X = f1(x + k.ox), Y = f1(y + k.oy);
        extra += `M${f1(X - r)} ${Y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
      }
    }
    g.extra.setAttribute('d', extra);
    let rope = '';
    if (p.rope != null) {
      // A rope from hand to hand, under the feet at 0 and over the head at 1.
      const a = k.la[2], b = k.ra[2];
      const apex = (GROUND + 6) + p.rope * ((k.C[1] - L.head - 9) - (GROUND + 6));
      const cy = 2 * apex - (a[1] + b[1]) / 2;
      rope = `M${f1(a[0])} ${f1(a[1])}Q${f1((a[0] + b[0]) / 2)} ${f1(cy)} ${f1(b[0])} ${f1(b[1])}`;
    }
    g.rope.setAttribute('d', rope);
  }

  // ---------- Moving between poses ----------
  const ANGLES = new Set(['t', 'h', 'ul', 'fl', 'ur', 'fr', 'pl', 'sl', 'pr', 'sr', 'ftl', 'ftr']);
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpAngle = (a, b, k) => a + (((b - a + 540) % 360) - 180) * k;

  function mix(a, b, k) {
    const out = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[key], y = b[key];
      if (typeof x === 'number' && typeof y === 'number') out[key] = ANGLES.has(key) ? lerpAngle(x, y, k) : lerp(x, y, k);
      else if (Array.isArray(x) && Array.isArray(y) && typeof x[0] === 'number') out[key] = x.map((v, i) => lerp(v, y[i], k));
      else out[key] = k < 0.5 ? x : y;
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
  const SH = -L.torso;
  const softKnees = { pl: 6, sl: -6, pr: 6, sr: -6 };

  // Arms out to the sides, hands tracing small circles; `dir` 1 or -1.
  const circles = (dir) => (phase) => {
    const a = dir * phase * 2 * Math.PI, r = 3.2;
    const cL = [-(L.shoulder + 24.5), SH - 1], cR = [L.shoulder + 24.5, SH - 1];
    return {
      aL: [cL[0] - r * Math.cos(a), cL[1] + r * Math.sin(a)], bL: 1,
      aR: [cR[0] + r * Math.cos(a), cR[1] + r * Math.sin(a)], bR: -1,
      orbits: [[cL[0], cL[1], r], [cR[0], cR[1], r]],
      ...softKnees,
    };
  };

  const MOVES = {
    'Lymphatic hops': { view: 'side', period: 0.55, stills: [0, 0.5], pose: cycle([
      { pl: 15, sl: -15, pr: 15, sr: -15, ul: 12, fl: 22, ur: 12, fr: 22 },
      { pl: 2, sl: -2, pr: 2, sr: -2, ftl: 55, ftr: 55, lift: 5.5, ul: 18, fl: 30, ur: 18, fr: 30 },
    ]) },

    'Body waves': { view: 'side', period: 4, stills: [1 / 7, 3 / 7, 5 / 7], pose: cycle([
      { t: 0, h: 0 },
      { t: -7, h: -14, ul: -12, fl: -18, ur: -12, fr: -18 },
      { t: 25, h: 60, pl: 18, sl: -18, pr: 18, sr: -18, ul: 8, fl: 12, ur: 8, fr: 12 },
      { t: 40, h: 80, pl: 28, sl: -28, pr: 28, sr: -28, ul: 10, fl: 16, ur: 10, fr: 16 },
      { t: 10, h: 15, pl: 10, sl: -10, pr: 10, sr: -10, ul: 110, fl: 125, ur: 110, fr: 125 },
      { t: -3, h: -5, ul: 172, fl: 178, ur: 172, fr: 178 },
      { t: 0, h: 0, ul: 95, fl: 100, ur: 95, fr: 100 },
    ]) },

    'Arm swings': { view: 'side', period: 1.1, stills: [0, 0.5], pose: cycle([
      { t: 3, ur: 85, fr: 95, ul: -55, fl: -60, ...softKnees },
      { t: 3, ur: -55, fr: -60, ul: 85, fl: 95, ...softKnees },
    ]) },

    'Trunk twists': { view: 'front', period: 1.2, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 40, ul: -75, fl: -55, ur: -40, fr: -70, far: ['la'] },
      { turn: 0, ul: 8, fl: 12, ur: -8, fr: -12, far: [] },
      { turn: 40, ul: 40, fl: 70, ur: 75, fr: 55, far: ['ra'] },
      { turn: 0, ul: 8, fl: 12, ur: -8, fr: -12, far: [] },
    ]) },

    'Forward arm circles': { view: 'front', period: 1.6, stills: [0, 0.25, 0.5], pose: circles(1) },

    'Bent over back shakes': { view: 'side', period: 0.5, stills: [0, 0.5], pose: cycle([
      { t: 82, h: 100, pl: 12, sl: -12, pr: 12, sr: -12, ul: 3, fl: 3, ur: 3, fr: 3 },
      { t: 90, h: 108, pl: 16, sl: -16, pr: 16, sr: -16, ul: -6, fl: -4, ur: -6, fr: -4 },
    ]) },

    'Backward arm circles': { view: 'front', period: 1.6, stills: [0, 0.25, 0.5], pose: circles(-1) },

    'Dead arms': { view: 'front', period: 1.3, stills: [0, 0.5], pose: cycle([
      { t: -10, h: -6, ul: 30, fl: 55, ur: 35, fr: 60 },
      { t: 10, h: 6, ul: -35, fl: -60, ur: -30, fr: -55 },
    ]) },

    'Golf swings': { view: 'front', period: 1.4, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 30, turnHips: 18, aL: [19, -41], aR: [19, -41], bL: -1, bR: -1, ...softKnees },
      { turn: 0, turnHips: 0, aL: [0, -1], aR: [0, -1], bL: -1, bR: 1, ...softKnees },
      { turn: 30, turnHips: 18, aL: [-19, -41], aR: [-19, -41], bL: 1, bR: 1, ...softKnees },
      { turn: 0, turnHips: 0, aL: [0, -1], aR: [0, -1], bL: -1, bR: 1, ...softKnees },
    ]) },

    'Marches': { view: 'side', period: 1, stills: [0, 0.5], pose: cycle([
      { t: 6, h: 4, pr: 75, sr: 5, ftr: 100, pl: 0, sl: 0, aL: [20, 4], bL: 1, ur: -45, fr: -40 },
      { t: 6, h: 4, pl: 75, sl: 5, ftl: 100, pr: 0, sr: 0, aR: [20, 4], bR: 1, ul: -45, fl: -40 },
    ]) },

    'Tiptoe arm swings': { view: 'side', period: 1.4, stills: [0, 0.5], pose: cycle([
      { t: 4, ul: -35, fl: -30, ur: -35, fr: -30, pl: 8, sl: -8, pr: 8, sr: -8, ftl: 90, ftr: 90 },
      { t: 0, ul: 150, fl: 165, ur: 150, fr: 165, pl: 0, sl: 0, pr: 0, sr: 0, ftl: 40, ftr: 40 },
    ]) },

    'Twist the waist': { view: 'front', period: 1.3, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 55, turnHips: 35, ul: -45, fl: -30, ur: -25, fr: -60, far: ['la'] },
      { turn: 0, turnHips: 0, ul: 6, fl: 8, ur: -6, fr: -8, far: [] },
      { turn: 55, turnHips: 35, ul: 25, fl: 60, ur: 45, fr: 30, far: ['ra'] },
      { turn: 0, turnHips: 0, ul: 6, fl: 8, ur: -6, fr: -8, far: [] },
    ]) },

    'Ballet squats': { view: 'front', period: 2, stills: [0, 0.5], pose: cycle([
      { pl: -20, sl: -12, pr: 20, sr: 12, ftl: -65, ftr: 65, ul: -158, fl: -170, ur: 158, fr: 170 },
      { pl: -52, sl: 14.8, pr: 52, sr: -14.8, ftl: -65, ftr: 65, ul: 25, fl: 35, ur: -25, fr: -35 },
    ]) },

    'Wide arm step backs': { view: 'front', period: 2.4, stills: [0, 0.25], pose: cycle([
      { aL: [0, -18], aR: [0, -18], bL: -1, bR: 1, far: [] },
      { ul: -100, fl: -112, ur: 100, fr: 112, pr: 8, sr: -4, ftr: 60, far: ['rl'] },
      { aL: [0, -18], aR: [0, -18], bL: -1, bR: 1, far: [] },
      { ul: -100, fl: -112, ur: 100, fr: 112, pl: -8, sl: 4, ftl: -60, far: ['ll'] },
    ]) },

    'Backstep wave lunges': { view: 'side', period: 2.6, stills: [1 / 6, 2 / 6, 4 / 6], pose: cycle([
      { t: 0, h: 0 },
      { t: 25, h: 60, pr: -38, sr: -38, ftr: 40, pl: 40, sl: -5, ul: 20, fl: 32, ur: 20, fr: 32 },
      { t: -5, h: -10, pr: -38, sr: -38, ftr: 40, pl: 40, sl: -5, ul: 170, fl: 178, ur: 170, fr: 178 },
      { t: 0, h: 0, ul: 60, fl: 70, ur: 60, fr: 70 },
      { t: 25, h: 60, pl: -38, sl: -38, ftl: 40, pr: 40, sr: -5, ul: 20, fl: 32, ur: 20, fr: 32 },
      { t: -5, h: -10, pl: -38, sl: -38, ftl: 40, pr: 40, sr: -5, ul: 170, fl: 178, ur: 170, fr: 178 },
    ]) },

    'Pushups': { view: 'side', period: 1.6, stills: [0, 0.5], pose: cycle([
      { t: 72, h: 95, pl: -72, sl: -72, pr: -72, sr: -72, ftl: 0, ftr: 0, aL: [24.7, 19], aR: [24.7, 19], bL: -1, bR: -1, floor: true, dx: 8 },
      { t: 80, h: 100, pl: -80, sl: -80, pr: -80, sr: -80, ftl: 0, ftr: 0, aL: [25, 14], aR: [25, 14], bL: -1, bR: -1, floor: true, dx: 8 },
    ]) },

    'Jump rope': { view: 'front', period: 0.5, stills: [0, 0.5], pose: cycle([
      { ul: 25, fl: 100, ur: -25, fr: -100, rope: 0 },
      { ul: 25, fl: 100, ur: -25, fr: -100, lift: 5, ftl: -50, ftr: 50, rope: 1 },
    ]) },
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
