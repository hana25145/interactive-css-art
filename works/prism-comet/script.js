(() => {
  // ===== Canvas setup =====
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let w = 0, h = 0;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
  }
  addEventListener('resize', resize, { passive: true });
  resize();

  // ===== Cursor / target physics =====
  const cometEl = document.querySelector('.comet');
  const root = document.documentElement;

  const target = { x: innerWidth/2, y: innerHeight/2 };
  const comet  = { x: innerWidth/2, y: innerHeight/2, vx:0, vy:0 };
  let hue = 210;               // base hue
  let lastT = performance.now();
  let idleTimer = 0;

  // ===== Particles =====
  const MAX = 450;             // 최대 파티클 수
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,max:number,size:number,h:number}[]} */
  const P = [];

  function spawn(x, y, speedMul=1, burst=0) {
    const n = burst ? 120 : 12;
    for (let i = 0; i < n; i++) {
      if (P.length >= MAX) { P.shift(); }
      const a = Math.random() * Math.PI * 2;
      const s = (burst ? (Math.random()*2.2+0.6) : (Math.random()*0.8+0.2)) * speedMul;
      P.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        max: burst ? (0.9 + Math.random()*0.6) : (0.5 + Math.random()*0.8),
        size: burst ? (1.8 + Math.random()*2.2) : (0.8 + Math.random()*1.4),
        h: (hue + (burst? (Math.random()*120-60): (Math.random()*40-20))) % 360
      });
    }
  }

  // ===== Input =====
  function moveTo(e) {
    target.x = e.clientX;
    target.y = e.clientY;
    idleTimer = 0; // 활동 감지
  }
  addEventListener('mousemove', moveTo, { passive: true });
  addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) moveTo({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: true });

  addEventListener('click', () => {
    spawn(comet.x, comet.y, 2.0, 1); // burst!
  });

  // ===== Animation loop =====
  function tick(now) {
    const dt = Math.min(32, now - lastT); // ms
    lastT = now;
    idleTimer += dt;

    // hue는 천천히 변하고, 활동 시 가속
    const hueDrift = 0.008 * dt + (idleTimer < 120 ? 0.05 : 0);
    hue = (hue + hueDrift * 60) % 360;
    root.style.setProperty('--h', hue.toFixed(1));

    // target이 멈춰도 아주 미세한 드리프트로 '생명감'
    if (idleTimer > 1400) {
      target.x += Math.sin(now * 0.0013) * 0.15;
      target.y += Math.cos(now * 0.0011) * 0.15;
    }

    // 스프링 물리(부드러운 추적)
    const k = 0.15;         // spring
    const d = 0.82;         // damping
    const ax = (target.x - comet.x) * k;
    const ay = (target.y - comet.y) * k;
    comet.vx = (comet.vx + ax) * d;
    comet.vy = (comet.vy + ay) * d;
    comet.x += comet.vx;
    comet.y += comet.vy;

    // DOM 위치 업데이트
    cometEl.style.left = `${comet.x}px`;
    cometEl.style.top  = `${comet.y}px`;

    // 이동량 기반 스폰
    const speed = Math.hypot(comet.vx, comet.vy);
    if (speed > 0.1) {
      const mul = Math.min(2.5, 0.5 + speed * 0.25);
      spawn(comet.x, comet.y, mul, 0);
    }

    // 캔버스 페이드 (잔상)
    ctx.globalCompositeOperation = 'source-over';
    const fade = 0.1; // 0=지속, 1=즉시 클리어
    ctx.fillStyle = `rgba(6,8,16,${fade})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    // 파티클 업데이트 & 렌더
    ctx.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= 0.016 * (dt / 16);
      if (p.life <= 0) { P.splice(i, 1); continue; }

      // 가벼운 가속/저항
      p.vx *= 0.985; p.vy *= 0.985;
      p.vy += 0.003; // 아주 약한 하강

      p.x += p.vx * (dt / 9);
      p.y += p.vy * (dt / 9);

      const alpha = Math.max(0, Math.min(1, p.life / p.max));
      const radius = p.size * (1 + (1 - alpha) * 0.8);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius*6);
      grad.addColorStop(0.00, `hsla(${p.h},95%,70%,${alpha * 0.95})`);
      grad.addColorStop(0.25, `hsla(${(p.h+180)%360},95%,65%,${alpha * 0.45})`);
      grad.addColorStop(1.00, `rgba(0,0,0,0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // 초기 위치 한 번 세팅
  const start = new MouseEvent('mousemove', { clientX: innerWidth/2, clientY: innerHeight/2 });
  dispatchEvent(start);
})();
