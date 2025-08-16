(() => {
  const root  = document.documentElement;
  const stage = document.getElementById('stage');
  const clock = document.getElementById('clock');
  const dateEl= document.getElementById('date');
  const pill  = document.getElementById('pill');

  // ===== state =====
  let is24h = true;
  let hue = 210;
  const themes = ["", "sunset", "mint", "violet"];
  let themeIndex = 0;

  // parallax
  addEventListener('pointermove', (e)=>{
    const r = stage.getBoundingClientRect();
    const mx = ((e.clientX - r.left)/r.width)*100;
    const my = ((e.clientY - r.top)/r.height)*100;
    root.style.setProperty('--mx', mx.toFixed(2));
    root.style.setProperty('--my', my.toFixed(2));
  }, {passive:true});

  // build digits (2 per group)
  const makeFlip = (v="0")=>{
    const flip = document.createElement('div'); flip.className='flip'; flip.dataset.value=v;
    const panel=document.createElement('div'); panel.className='panel';
    const top = document.createElement('div'); top.className='half top'; top.innerHTML = `<div class="value">${v}</div>`;
    const bot = document.createElement('div'); bot.className='half bot'; bot.innerHTML = `<div class="value">${v}</div>`;
    const backTop = document.createElement('div'); backTop.className='back-top'; backTop.innerHTML = `<div class="value">${v}</div>`;
    const backBot = document.createElement('div'); backBot.className='back-bot'; backBot.innerHTML = `<div class="value">${v}</div>`;
    panel.append(top, bot, backTop, backBot); flip.append(panel);
    return flip;
  };
  const groups = [...clock.querySelectorAll('.group')];
  const digits = [];
  groups.forEach(g=>{ const a=makeFlip("0"), b=makeFlip("0"); g.append(a,b); digits.push(a,b); });

  // safe flip (no stacking, no ghost)
  function setFlip(flip, newVal){
    const cur = flip.dataset.value;
    if (cur === newVal || flip.dataset.animating === "1") return;

    const topVal = flip.querySelector('.top .value');
    const botVal = flip.querySelector('.bot .value');
    const backTopVal = flip.querySelector('.back-top .value');
    const backBotVal = flip.querySelector('.back-bot .value');

    // 새 값은 back 면에만 먼저 세팅
    backTopVal.textContent = newVal;
    backBotVal.textContent = newVal;

    // 애니메이션 트리거
    flip.dataset.animating = "1";
    flip.classList.remove('play'); void flip.offsetWidth; flip.classList.add('play');

    // 애니 끝나면 앞면 교체 & 초기화
    const onEnd = () => {
      topVal.textContent = newVal;
      botVal.textContent = newVal;
      flip.dataset.value = newVal;
      flip.classList.remove('play');
      flip.dataset.animating = "";
      flip.removeEventListener('animationend', onEnd);
    };
    flip.addEventListener('animationend', onEnd);
  }

  // interactions
  stage.addEventListener('click', ()=> { is24h = !is24h; });
  addEventListener('wheel', (e)=>{
    hue = (hue + (e.deltaY>0?-6:6) + 360) % 360;
    root.style.setProperty('--hue', hue);
    pill.textContent = `Hue ${Math.round(hue)}°`;
    pill.style.opacity = 1; clearTimeout(pill._t);
    pill._t = setTimeout(()=> pill.style.opacity = .0, 900);
  }, {passive:true});
  addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 't'){
      themeIndex = (themeIndex+1)%themes.length;
      const th = themes[themeIndex];
      if (th) root.setAttribute('data-theme', th);
      else root.removeAttribute('data-theme');
    }
  });

  // time loop — align to real seconds (no drift)
  const pad2 = n => String(n).padStart(2,'0');
  let lastSec = -1;

  function render(nowDate){
    const s = nowDate.getSeconds();
    const m = nowDate.getMinutes();
    let h  = nowDate.getHours();
    const hh = is24h ? h : ((h%12)||12);

    // date text
    const w = ['일','월','화','수','목','금','토'][nowDate.getDay()];
    dateEl.textContent = `${nowDate.getFullYear()}.${pad2(nowDate.getMonth()+1)}.${pad2(nowDate.getDate())} (${w})`;

    if (s !== lastSec){
      const str = (pad2(hh) + pad2(m) + pad2(s)).split('');
      for (let i=0;i<digits.length;i++) setFlip(digits[i], str[i]);
      lastSec = s;
    }
  }

  // rAF ticker aligned to next second
  function tick(){
    const now = new Date();
    render(now);
    // 다음 전체 초까지 남은 시간을 계산해 타이밍을 보정
    const ms = now.getMilliseconds();
    const delay = 1000 - ms + 2; // 약간 여유
    setTimeout(()=>requestAnimationFrame(tick), delay);
  }
  tick();
})();
