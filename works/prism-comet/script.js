// Prism Comet — Aurora (fade timeout + richer color)
(() => {
  const TRAIL_SECONDS = 3.0;   // ← 잔상(캔버스 글로우) 유지 시간 (초)
  const FADESPEED_IDLE = 0.18; // ← 유휴 시 캔버스 페이드 가속(0~1, 높을수록 빨리 사라짐)

  const boot = () => {
    // 필수 노드 보장
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
    let lastActiveAt = performance.now();

    // 파티클
    const MAX = 520;                 // 살짝 증가
    const P = [];                    // {x,y,vx,vy,life,max,size,h}
    const spawn = (x, y, mul=1, burst=0) => {
      const n = burst ? 140 : 14;
      for (let i=0;i<n;i++){
        if (P.length >= MAX) P.shift();
        const a = Math.random()*Math.PI*2;
        const s = (burst ? (Math.random()*2.2+0.6) : (Math.random()*0.8+0.2)) * mul;
        // 다양한 색을 더 섞기: 기본 hue ±(0~90), 보조 complementary ±(0~60)
        const hueJitter = burst ? (Math.random()*180 - 90) : (Math.random()*90 - 45);
        const compBias  = (Math.random() < 0.25) ? 180 + (Math.random()*60 - 30) : 0;
        P.push({
          x, y,
          vx: Math.cos(a)*s, vy: Math.sin(a)*s,
          life: 1,
          max: burst ? (1.6 + Math.random()*1.2) : (0.9 + Math.random()*0.9), // 개별 수명 ↑ (초 느낌)
          size: burst ? (1.6 + Math.random()*2.4) : (0.8 + Math.random()*1.6),
          h: (hue + hueJitter + compBias + 3600) % 360
        });
      }
    };

    // 입력
    const moveTo = (x,y)=>{ target.x=x; target.y=y; idleMs=0; lastActiveAt = performance.now(); };
    addEventListener('pointermove', e=>moveTo(e.clientX,e.clientY), {passive:true});
    addEventListener('mousemove',  e=>moveTo(e.clientX,e.clientY), {passive:true});
    addEventListener('touchmove',  e=>{ const t=e.touches[0]; if(t) moveTo(t.clientX,t.clientY); }, {passive:true});
    addEventListener('click', ()=> { spawn(comet.x, comet.y, 2.0, 1); lastActiveAt = performance.now(); });

    moveTo(innerWidth/2, innerHeight/2); // 초기 위치

    // 루프
    const tick = (now) => {
      const dt = Math.min(32, now - last || 16); last = now; idleMs += dt;

      // Hue drift(항상 살아 있음)
      hue = (hue + (0.008*dt) + (idleMs < 120 ? 0.05 : 0)) % 360;
      root.style.setProperty('--h', hue.toFixed(1));

      // Idle 미세 드리프트
      if (idleMs > 800) {
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

      // 스폰(움직임 기반) + 유휴 스파클
      const speed = Math.hypot(comet.vx, comet.vy);
      if (speed > 0.08) {
        spawn(comet.x, comet.y, Math.min(2.6, 0.55 + speed*0.27), 0);
      } else if (idleMs > 600 && Math.random() < 0.08) {
        spawn(comet.x + (Math.random()-0.5)*24, comet.y + (Math.random()-0.5)*24, 0.6, 0);
      }

      // ===== 캔버스 페이드/클리어 정책 =====
      // 기본 잔상 페이드
      let fadeAlpha = 0.12;
      // 입력이 없으면 서서히 빨리 지우기
      const idleSec = (now - lastActiveAt) / 1000;
      if (idleSec > 0.5) fadeAlpha = Math.min(0.12 + (idleSec*FADESPEED_IDLE*0.25), 0.42);
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=`rgba(6,8,16,${fadeAlpha})`;
      ctx.fillRect(0,0,innerWidth,innerHeight);

      // “몇 초 뒤 완전 제거”: TRAIL_SECONDS 경과 시 하드 클리어
      if (idleSec >= TRAIL_SECONDS) {
        ctx.clearRect(0,0,innerWidth,innerHeight);
      }

      // 파티클 업데이트/렌더 (개별 수명은 초 단위 느낌으로 소멸)
      ctx.globalCompositeOperation='lighter';
      for (let i=P.length-1;i>=0;i--){
        const p=P[i];
        p.life -= 0.016*(dt/16);
        if (p.life<=0){ P.splice(i,1); continue; }
        p.vx*=0.984; p.vy*=0.984; p.vy+=0.003;
        p.x+=p.vx*(dt/9); p.y+=p.vy*(dt/9);

        const a=Math.max(0, Math.min(1, p.life/p.max));
        const r=p.size*(1+(1-a)*0.8);

        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*6);
        g.addColorStop(0.00, `hsla(${p.h},96%,70%,${a*0.95})`);
        g.addColorStop(0.22, `hsla(${(p.h+120)%360},96%,66%,${a*0.55})`);
        g.addColorStop(0.48, `hsla(${(p.h+240)%360},96%,64%,${a*0.35})`);
        g.addColorStop(1.00, `rgba(0,0,0,0)`);

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
