
(()=>{
  const root   = document.documentElement;
  const trail  = document.getElementById('trail');
  const N = 10; // 꼬리 점 개수

  const pos = Array.from({length:N}, (_,i)=>({ x: innerWidth/2, y: innerHeight/2, t: performance.now() - i*16 }));

  // trail DOM 구성
  trail.innerHTML = "";
  for(let i=0;i<N;i++){
    const dot = document.createElement('i');
    const k = (1 - i/(N+2)); // 작아짐
    dot.style.setProperty('--k', (0.6 + k*0.6).toFixed(2));
    dot.style.setProperty('--o', (0.08 + k*0.55).toFixed(2));
    trail.appendChild(dot);
  }
  const dots = [...trail.children];
  let lastX = innerWidth/2, lastY = innerHeight/2, lastT = performance.now();
  let hue = 200;

  function onMove(e){
    const x = e.clientX, y = e.clientY;
    const t = performance.now(), dt = t - lastT || 16;
    const dx = x - lastX, dy = y - lastY;
    const dist = Math.hypot(dx,dy);
    const v = Math.min(1.8, dist / Math.max(8, dt));   // 속도 지표

    hue = (hue + dx*0.25 + dy*0.2 + v*18) % 360; if(hue<0) hue+=360;
    root.style.setProperty('--h', hue.toFixed(1));
    root.style.setProperty('--x', x + "px");
    root.style.setProperty('--y', y + "px");

    pos.unshift({x, y, t});
    pos.length = N;

    for(let i=0;i<N;i++){
      const p = pos[i];
      const el = dots[i];
      el.style.left = p.x + "px";
      el.style.top  = p.y + "px";
      const r = (hue + i*22 + (t - p.t)*0.3) % 360;
      el.style.setProperty('--r', r + "deg");
    }

    lastX = x; lastY = y; lastT = t;
  }

  addEventListener('mousemove', onMove, {passive:true});

  // 초기 1회 셋업
  const start = new MouseEvent('mousemove', {clientX:lastX, clientY:lastY});
  onMove(start);

  addEventListener('resize', () => {
    lastX = Math.min(Math.max(0, lastX), innerWidth);
    lastY = Math.min(Math.max(0, lastY), innerHeight);
  }, {passive:true});
})();
