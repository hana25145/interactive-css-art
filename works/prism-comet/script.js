// Prism Comet — Aurora (hardened v2)
(() => {
  // DOMContentLoaded 보장 + 필요한 노드 자동 생성
  const boot = () => {
    // 필수 노드 확보
    let canvas = document.getElementById('fx');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fx';
      canvas.style.position = 'fixed';
      canvas.style.inset = 0;
      canvas.style.zIndex = 5;
      document.body.appendChild(canvas);
    }
    let cometEl = document.querySelector('.comet');
    if (!cometEl) {
      cometEl = document.createElement('div');
      cometEl.className = 'comet';
      cometEl.innerHTML = `<div class="core"></div><div class="ring"></div>`;
      document.body.appendChild(cometEl);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // DPR 캔버스
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width  = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width  = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(dpr, dpr);
    };
    addEventListener('resize', resize, { passive: true });
    resize();

    // 상태
    const root = document.documentElement;
    const target = { x: innerWidth/2, y: innerHeight/2 };
    const comet  = { x: innerWidth/2, y: innerHeight/2, vx:0, vy:0 };
    let hue = 210, last = performance.now(), idleMs = 0;

    // 파티클
    const MAX = 450, P = [];
    const spawn = (x, y, mul=1, burst=0) => {
      const n = burst ? 120 : 12;
      for (let i=0;i<n;i++){
        if (P.length >= MAX) P.shift();
        const a = Math.random()*Math.PI*2;
        const s = (burst ? (Math.random()*2.2+0.6) : (Math.random()*0.8+0.2)) * mul;
        P.push({
          x, y,
          vx: Math.cos(a)*s, vy: Math.sin(a)*s,
          life: 1, max: burst ? (0.9+Math.random()*0.6) : (0.5+Math.random()*0.8),
          size: burst ? (1.8+Math.random()*2.2) : (0.8+Math.random()*1.4),
          h: (hue + (burst? (Math.random()*120-60): (Math.random()*40-20))) % 360
        });
      }
    };

    // 입력
    const moveTo = (x,y)=>{ target.x=x; target.y=y; idleMs=0; };
    addEventListener('pointermove', e=>moveTo(e.clientX,e.clientY), {passive:true});
    addEventListener('mousemove',  e=>moveTo(e.clientX,e.clientY), {passive:true});
    addEventListener('touchmove',  e=>{ const t=e.touches[0]; if(t) moveTo(t.clientX,t.clientY); }, {passive:true});
    addEventListener('click', ()=> spawn(comet.x, comet.y, 2.0, 1));
    moveTo(innerWidth/2, innerHeight/2);

    // 루프
    const tick = (now) => {
      const dt = Math.min(32, now - last || 16); last = now; idleMs += dt;

      hue = (hue + (0.008*dt) + (idleMs < 120 ? 0.05 : 0)) % 360;
      root.style.setProperty('--h', hue.toFixed(1));

      if (idleMs > 800) { // idle 드리프트
        target.x += Math.sin(now*0.0013) * 0.18;
        target.y += Math.cos(now*0.0011) * 0.18;
      }

      // 스프링 추적
      const k=0.15, d=0.82;
      const ax=(target.x-comet.x)*k, ay=(target.y-comet.y)*k;
      comet.vx=(comet.vx+ax)*d; comet.vy=(comet.vy+ay)*d;
      comet.x+=comet.vx; comet.y+=comet.vy;

      // DOM 위치
      cometEl.style.left = `${comet.x}px`;
      cometEl.style.top  = `${comet.y}px`;

      // 스폰
      const speed = Math.hypot(comet.vx, comet.vy);
      if (speed > 0.08) spawn(comet.x, comet.y, Math.min(2.5, 0.5 + speed*0.25), 0);
      else if (idleMs > 600 && Math.random() < 0.08) spawn(comet.x + (Math.random()-0.5)*24, comet.y + (Math.random()-0.5)*24, 0.6, 0);

      // 잔상 페이드
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='rgba(6,8,16,0.12)';
      ctx.fillRect(0,0,innerWidth,innerHeight);

      // 렌더
      ctx.globalCompositeOperation='lighter';
      for (let i=P.length-1;i>=0;i--){
        const p=P[i];
        p.life-=0.016*(dt/16);
        if (p.life<=0){ P.splice(i,1); continue; }
        p.vx*=0.985; p.vy*=0.985; p.vy+=0.003;
        p.x+=p.vx*(dt/9); p.y+=p.vy*(dt/9);

        const a=Math.max(0,Math.min(1,p.life/p.max));
        const r=p.size*(1+(1-a)*0.8);
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*6);
        g.addColorStop(0,   `hsla(${p.h},95%,70%,${a*0.95})`);
        g.addColorStop(0.25,`hsla(${(p.h+180)%360},95%,65%,${a*0.45})`);
        g.addColorStop(1,   `rgba(0,0,0,0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
