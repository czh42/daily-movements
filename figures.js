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
  // Hands may be given a point to reach for instead of angles; within one
  // move an arm keeps to one of the two, so the motion between poses stays
  // smooth.
  const SH = -L.torso;
  const softKnees = { pl: 6, sl: -6, pr: 6, sr: -6 };
  const hang = { aL: [-9, 0], aR: [9, 0] };
  // 0 at the start of a cycle, 1 halfway, 0 again at the end: one smooth swing.
  const swing = (phase) => (1 - Math.cos(phase * 2 * Math.PI)) / 2;

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

  // Big circles from the shoulder with straight arms, side on, the far arm
  // trailing a little so both can be seen. `dir` 1 forward, -1 backward.
  const bigCircles = (dir) => (phase) => {
    const a = 180 - dir * 360 * phase;
    return { ul: a - dir * 16, fl: a - dir * 16, ur: a, fr: a, ...softKnees, orbits: [[1.2, SH, L.upper + L.fore]] };
  };

  const MOVES = {
    'Lymphatic hops': { view: 'side', period: 0.55, stills: [0, 0.5], pose: cycle([
      { pl: 15, sl: -15, pr: 15, sr: -15, ul: 12, fl: 22, ur: 12, fr: 22 },
      { pl: 2, sl: -2, pr: 2, sr: -2, ftl: 55, ftr: 55, lift: 5.5, ul: 18, fl: 30, ur: 18, fr: 30 },
    ]) },

    'Body waves': { view: 'side', period: 3, stills: [0, 0.25, 0.5], pose: wave(false) },

    'Arm swings': { view: 'side', period: 1.2, stills: [0, 0.5], pose: cycle([
      { t: 2, ur: 168, fr: 174, ul: -50, fl: -56, ...softKnees },
      { t: 2, ur: -50, fr: -56, ul: 168, fl: 174, ...softKnees },
    ]) },

    // Hands laced together in front, a hoop that turns with the trunk.
    'Trunk twists': { view: 'front', period: 1.4, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 42, aL: [-13, -11], aR: [-13, -11], bL: -1, bR: 1 },
      { turn: 0, aL: [0, -9], aR: [0, -9], bL: -1, bR: 1 },
      { turn: 42, aL: [13, -11], aR: [13, -11], bL: -1, bR: 1 },
      { turn: 0, aL: [0, -9], aR: [0, -9], bL: -1, bR: 1 },
    ]) },

    'Forward arm circles': { view: 'side', period: 1.8, stills: [0, 0.25, 0.5], pose: bigCircles(1) },

    // Hinged forward, short of flat, so the back stays supported.
    'Bent over back shakes': { view: 'side', period: 0.5, stills: [0, 0.5], pose: cycle([
      { t: 62, h: 84, pl: 14, sl: -14, pr: 14, sr: -14, ul: 2, fl: 2, ur: 2, fr: 2 },
      { t: 70, h: 94, pl: 19, sl: -19, pr: 19, sr: -19, ul: -6, fl: -4, ur: -6, fr: -4 },
    ]) },

    'Backward arm circles': { view: 'side', period: 1.8, stills: [0, 0.25, 0.5], pose: bigCircles(-1) },

    // A sway with a light turn, so a limp arm swings up and lands on the chest
    // while the other swings behind.
    'Dead arms': { view: 'front', period: 1.5, stills: [0, 0.25, 0.5], pose: cycle([
      { t: -7, h: -4, turn: 30, turnHips: 8, aR: [-5, -19], bR: -1, aL: [-21, -4], bL: -1, far: ['la'] },
      { t: 0, h: 0, turn: 0, turnHips: 0, ...hang, bL: -1, bR: 1, far: [] },
      { t: 7, h: 4, turn: 30, turnHips: 8, aL: [5, -19], bL: 1, aR: [21, -4], bR: 1, far: ['ra'] },
      { t: 0, h: 0, turn: 0, turnHips: 0, ...hang, bL: -1, bR: 1, far: [] },
    ]) },

    // Turning to one side: that side's arm swings straight up behind, the
    // other bends with its hand at the chest, the back foot pivots onto its
    // ball, one line from that toe to the raised hand.
    'Golf swings': { view: 'front', period: 1.7, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 45, turnHips: 30, t: -8, h: -8, aL: [-20, -48], bL: 1, aR: [-4, -22], bR: 1, far: ['la'], pr: 10, sr: -6, ftr: 40 },
      { turn: 0, turnHips: 0, t: 0, h: 0, ...hang, bL: -1, bR: 1, far: [], ...softKnees },
      { turn: 45, turnHips: 30, t: 8, h: 8, aR: [20, -48], bR: -1, aL: [4, -22], bL: -1, far: ['ra'], pl: -10, sl: 6, ftl: -40 },
      { turn: 0, turnHips: 0, t: 0, h: 0, ...hang, bL: -1, bR: 1, far: [], ...softKnees },
    ]) },

    // Knee up to a right angle and the hands clap on it; then a beat with
    // both feet down and the hands out; then the other knee.
    'Marches': { view: 'side', period: 2, stills: [0, 0.25], pose: cycle([
      { t: 4, h: 4, pr: 88, sr: 2, ftr: 95, pl: 0, sl: 0, aL: [22, -3], aR: [22, -3], bL: -1, bR: -1 },
      { t: 4, h: 4, pr: 0, sr: 0, pl: 0, sl: 0, ftr: 90, aL: [19, -16], aR: [19, -16], bL: -1, bR: -1 },
      { t: 4, h: 4, pl: 88, sl: 2, ftl: 95, pr: 0, sr: 0, aL: [22, -3], aR: [22, -3], bL: -1, bR: -1 },
      { t: 4, h: 4, pl: 0, sl: 0, pr: 0, sr: 0, ftl: 90, aL: [19, -16], aR: [19, -16], bL: -1, bR: -1 },
    ]) },

    'Tiptoe body waves': { view: 'side', period: 3, stills: [0, 0.25, 0.5], pose: wave(true) },

    // Loose arms: turning to one side, the other arm swings across to that
    // hip while the near arm swings behind.
    'Twist the waist': { view: 'front', period: 1.5, stills: [0, 0.25, 0.5], pose: cycle([
      { turn: 55, turnHips: 40, aL: [9, 1], bL: -1, aR: [22, -7], bR: 1, far: ['ra'] },
      { turn: 0, turnHips: 0, ...hang, bL: -1, bR: 1, far: [] },
      { turn: 55, turnHips: 40, aR: [-9, 1], bR: 1, aL: [-22, -7], bL: -1, far: ['la'] },
      { turn: 0, turnHips: 0, ...hang, bL: -1, bR: 1, far: [] },
    ]) },

    // Feet flat and turned out; the arms sweep out and up at the sides on the
    // way up, and back down the same way.
    'Ballet squats': { view: 'front', period: 2, stills: [0, 0.5], pose: cycle([
      { pl: -20, sl: -12, pr: 20, sr: 12, ftl: -85, ftr: 85, ul: -160, fl: -168, ur: 160, fr: 168 },
      { pl: -52, sl: 14.8, pr: 52, sr: -14.8, ftl: -85, ftr: 85, ul: -28, fl: -22, ur: 28, fr: 22 },
    ]) },

    // Straight arms open wide as one foot steps back behind the other and the
    // body turns a little; back to the middle, the straight arms swing down
    // to meet in front for a clap.
    'Wide arm step backs': { view: 'front', period: 2.6, stills: [0, 0.25], pose: cycle([
      { ul: 20, fl: 22, ur: -20, fr: -22, far: [], turn: 0, turnHips: 0, t: 0 },
      { ul: -92, fl: -92, ur: 92, fr: 92, far: ['rl'], turn: 18, turnHips: 10, t: -3, pr: -25, sr: -20, ftr: 60 },
      { ul: 20, fl: 22, ur: -20, fr: -22, far: [], turn: 0, turnHips: 0, t: 0 },
      { ul: -92, fl: -92, ur: 92, fr: 92, far: ['ll'], turn: 18, turnHips: 10, t: 3, pl: 25, sl: 20, ftl: -60 },
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
    'Jump rope': { view: 'front', period: 0.5, stills: [0, 0.5], pose: cycle([
      { ul: -15, fl: -95, ur: 15, fr: 95, rope: 0 },
      { ul: -15, fl: -95, ur: 15, fr: 95, lift: 5, ftl: -50, ftr: 50, rope: 1 },
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
