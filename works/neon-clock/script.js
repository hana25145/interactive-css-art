(() => {
  const root  = document.documentElement;
  const stage = document.getElementById('stage');
  const clock = document.getElementById('clock');
  const dateEl= document.getElementById('date');
  const pill  = document.getElementById('pill');

  if (clock.dataset.built === "1") return;
  clock.dataset.built = "1";

  // 패럴럭스
  addEventListener('pointermove', (e)=>{
    const r = stage.getBoundingClientRect();
    const mx = ((e.clientX - r.left)/r.width)*100;
    const my = ((e.clientY - r.top)/r.height)*100;
    root.style.setProperty('--mx', mx.toFixed(2));
    root.style.setProperty('--my', my.toFixed(2));
  }, {passive:true});

  // 자리 1개 생성
  const makeFlip = (v="0")=>{
    const wrap = document.createElement('div'); wrap.className='flip'; wrap.dataset.value=v;
    const panel = document.createElement('div'); panel.className='panel';
    const top = document.createElement('div'); top.className='half top';       top.innerHTML = `<div class="val">${v}</div>`;
    const bot = document.createElement('div'); bot.className='half bot';       bot.innerHTML = `<div class="val">${v}</div>`;
    const bT  = document.createElement('div'); bT.className='back-top';        bT.innerHTML  = `<div class="val">${v}</div>`;
    const bB  = document.createElement('div'); bB.className='back-bot';        bB.innerHTML  = `<div class="val">${v}</div>`;
    panel.append(top, bot, bT, bB); wrap.append(panel);
    return wrap;
  };

  // 그룹 구성
  const groups = [...clock.querySelectorAll('.group')];
  groups.forEach(g => g.innerHTML = '');
  const digits = [];
  groups.forEach(g => { const a = makeFlip('0'), b = makeFlip('0'); g.append(a,b); digits.push(a,b); });

  // 플립(중복 방지 + 애니 끝나면 정리)
  function setFlip(flip, newVal){
    const cur = flip.dataset.value;
    if (cur === newVal || flip.dataset.animating === '1') return;

    const topVal = flip.querySelector('.top .val');
    const botVal = flip.querySelector('.bot .val');
    const btVal  = flip.querySelector('.back-top .val');
    const bbVal  = flip.querySelector('.back-bot .val');

    // back 면 값 설정: 위판(back-top)=현재, 아래판(back-bot)=새값
    btVal.textContent = cur;
    bbVal.textContent = newVal;

    // 트리거
    flip.dataset.animating = '1';
    flip.classList.remove('play'); void flip.offsetWidth; flip.classList.add('play');

    const onEnd = () => {
      // 최종 상태: 앞면 둘 다 새 값
      topVal.textContent = newVal;
      botVal.textContent = newVal;
      flip.dataset.value = newVal;

      flip.classList.remove('play');   // ← 가시성 복구 (bot 보이게, back-bot 숨김)
      flip.dataset.animating = '';
      flip.removeEventListener('animationend', onEnd);
    };
    flip.addEventListener('animationend', onEnd);
  }

  // 상호작용
  let is24h = true, hue = 200, themeIdx = 0;
  pill.addEventListener('click', ()=>{ is24h=!is24h; pill.textContent=is24h?'24H':'12H'; lastSec=-1; });
  addEventListener('wheel', (e)=>{ hue=(hue+(e.deltaY>0?-6:6)+360)%360; root.style.setProperty('--hue',hue); }, {passive:true});
  addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase()==='t'){
      const names=['','sunset','mint','violet'];
      themeIdx=(themeIdx+1)%names.length;
      const th=names[themeIdx]; if(th) root.setAttribute('data-theme',th); else root.removeAttribute('data-theme');
    }
  });

  // 초 경계 정렬 + 자리별 미세 지연(현실감)
  const pad2 = n => String(n).padStart(2,'0');
  let lastSec = -1;
  function render(now){
    const w = ['일','월','화','수','목','금','토'][now.getDay()];
    const padM = pad2(now.getMonth()+1), padD = pad2(now.getDate());
    dateEl.textContent = `${now.getFullYear()}.${padM}.${padD} ${w}요일`;

    let h = now.getHours(); const m = now.getMinutes(); const s = now.getSeconds();
    const hh = is24h ? h : ((h%12)||12);

    if (s !== lastSec){
      const seq = (pad2(hh)+pad2(m)+pad2(s)).split('');
      // 자리별 0/15/30/45/60/75ms 지연 → 폭포처럼 플립
      const delays = [0,15,30,30,45,60];
      for (let i=0;i<digits.length;i++){
        const val = seq[i];
        const d = digits[i];
        if (d.dataset.value !== val){
          setTimeout(()=> setFlip(d, val), delays[i]);
        }
      }
      lastSec = s;
    }
  }
  function tick(){
    const now = new Date();
    render(now);
    const ms = now.getMilliseconds();
    setTimeout(()=> requestAnimationFrame(tick), 1000 - ms + 2);
  }
  tick();
})();
