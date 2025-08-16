(() => {
  const root  = document.documentElement;
  const stage = document.getElementById('stage');
  const clock = document.getElementById('clock');
  const dateEl= document.getElementById('date');
  const pill  = document.getElementById('pill');

  /* 중복 실행 방지 */
  if (clock.dataset.built === "1") return;
  clock.dataset.built = "1";

  /* 패럴럭스 */
  addEventListener('pointermove', (e)=>{
    const r = stage.getBoundingClientRect();
    const mx = ((e.clientX - r.left)/r.width)*100;
    const my = ((e.clientY - r.top)/r.height)*100;
    root.style.setProperty('--mx', mx.toFixed(2));
    root.style.setProperty('--my', my.toFixed(2));
  }, {passive:true});

  /* 한 자리 카드 생성 */
  const makeFlip = (v="0")=>{
    const flip = document.createElement('div'); flip.className='flip'; flip.dataset.value=v;

    const panel = document.createElement('div'); panel.className='panel';

    const top = document.createElement('div'); top.className='half top';
    const bot = document.createElement('div'); bot.className='half bot';
    const backTop = document.createElement('div'); backTop.className='back-top';
    const backBot = document.createElement('div'); backBot.className='back-bot';

    // 숫자 래퍼(.val)로 동일 폰트/정렬 사용 → 절반 클립으로 깨끗하게 보임
    top.innerHTML = `<div class="val">${v}</div>`;
    bot.innerHTML = `<div class="val">${v}</div>`;
    backTop.innerHTML = `<div class="val">${v}</div>`;
    backBot.innerHTML = `<div class="val">${v}</div>`;

    panel.append(top, bot, backTop, backBot);
    flip.append(panel);
    return flip;
  };

  /* 그룹 구성: HH:MM:SS → 6자리 */
  const groups = [...clock.querySelectorAll('.group')];
  groups.forEach(g => g.innerHTML = '');
  const digits = [];
  groups.forEach(g => { const a = makeFlip("0"), b = makeFlip("0"); g.append(a,b); digits.push(a,b); });

  /* 안전한 flip: 진행 중엔 재트리거 금지 + 끝나면 상태 정리 */
  function setFlip(flip, newVal){
    const cur = flip.dataset.value;
    if (cur === newVal) return;
    if (flip.dataset.animating === "1") return;

    const topVal     = flip.querySelector('.top .val');
    const botVal     = flip.querySelector('.bot .val');
    const backTopVal = flip.querySelector('.back-top .val');
    const backBotVal = flip.querySelector('.back-bot .val');

    // back면에만 새 값 넣고, 앞면은 현재값 유지 → 애니 중 겹침 방지
    backTopVal.textContent = cur;     // 뒤집히며 사라질 위쪽(현재값)
    backBotVal.textContent = newVal;  // 뒤집히며 나타날 아래쪽(새값)

    // 애니 트리거
    flip.dataset.animating = "1";
    flip.classList.remove('play'); void flip.offsetWidth; flip.classList.add('play');

    const onEnd = () => {
      // 최종적으로 앞면 top/bot 둘 다 새 값으로 정리
      topVal.textContent = newVal;
      botVal.textContent = newVal;
      flip.dataset.value = newVal;
      flip.classList.remove('play');
      flip.dataset.animating = "";
      flip.removeEventListener('animationend', onEnd);
    };
    flip.addEventListener('animationend', onEnd);
  }

  /* 인터랙션: 12/24, Hue, Theme */
  let is24h = true, hue = 200, themeIdx = 0;
  pill.addEventListener('click', ()=>{
    is24h = !is24h; pill.textContent = is24h ? '24H' : '12H';
    lastSec = -1; // 강제 리렌더
  });
  addEventListener('wheel', (e)=>{
    hue = (hue + (e.deltaY>0?-6:6) + 360) % 360;
    root.style.setProperty('--hue', hue);
  }, {passive:true});
  addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 't'){
      themeIdx = (themeIdx+1)%4;
      const names = ["", "sunset", "mint", "violet"];
      const th = names[themeIdx];
      if (th) root.setAttribute('data-theme', th); else root.removeAttribute('data-theme');
    }
  });

  /* 시간 루프: 초 경계에 맞춰 업데이트 (드리프트 방지) */
  const pad2 = n => String(n).padStart(2, '0');
  let lastSec = -1;
  function render(now){
    // 날짜
    const w = ['일','월','화','수','목','금','토'][now.getDay()];
    dateEl.textContent = `${now.getFullYear()}.${pad2(now.getMonth()+1)}.${pad2(now.getDate())} ${w}요일`;

    // 시·분·초
    let h = now.getHours(); const m = now.getMinutes(); const s = now.getSeconds();
    const hh = is24h ? h : ((h%12)||12);

    if (s !== lastSec){
      const str = (pad2(hh) + pad2(m) + pad2(s)).split('');
      for (let i=0;i<digits.length;i++) setFlip(digits[i], str[i]);
      lastSec = s;
    }
  }
  function tick(){
    const now = new Date();
    render(now);
    const ms = now.getMilliseconds();
    setTimeout(()=>requestAnimationFrame(tick), 1000 - ms + 2);
  }
  tick();
})();
