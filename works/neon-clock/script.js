(() => {
  const root  = document.documentElement;
  const stage = document.getElementById('stage');
  const clock = document.getElementById('clock');
  const dateEl= document.getElementById('date');
  const pill  = document.getElementById('pill');

  // ===== Options / State =====
  let is24h = true;          // 클릭으로 토글
  let hue   = 210;           // 휠로 조절
  let themeIndex = 0;        // T 키로 순환
  const themes = ["", "sunset", "mint", "violet"]; // "" = 기본

  // 시간 스크럽(오프셋) 상태
  let dragging = false;
  let offsetSec = 0;         // 드래그로 ± 변경 (더블클릭 리셋)

  // 마우스 패럴럭스용
  function onPointer(e){
    const rect = stage.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top)  / rect.height) * 100;
    root.style.setProperty('--mx', mx.toFixed(2));
    root.style.setProperty('--my', my.toFixed(2));
  }
  addEventListener('pointermove', onPointer, { passive:true });

  // ===== Build flip digits =====
  // 한 자리 flip 카드 DOM 생성
  const createFlip = (initial="0") => {
    const flip = document.createElement('div');
    flip.className = 'flip';
    flip.dataset.value = initial;

    const panel = document.createElement('div');
    panel.className = 'panel';

    const top = document.createElement('div');
    top.className = 'half top';
    top.innerHTML = `<div class="value">${initial}</div>`;

    const bot = document.createElement('div');
    bot.className = 'half bot';
    bot.innerHTML = `<div class="value">${initial}</div>`;

    const backTop = document.createElement('div');
    backTop.className = 'back-top';
    backTop.innerHTML = `<div class="value">${initial}</div>`;

    const backBot = document.createElement('div');
    backBot.className = 'back-bot';
    backBot.innerHTML = `<div class="value">${initial}</div>`;

    panel.append(top, bot, backTop, backBot);
    flip.append(panel);
    return flip;
  };

  // HH:MM:SS 그룹 각각 2자리씩 구성
  const groups = [...clock.querySelectorAll('.group')];
  const digits = [];
  groups.forEach(g => {
    const d1 = createFlip("0");
    const d2 = createFlip("0");
    g.append(d1, d2);
    digits.push(d1, d2);
  });

  // ===== Flip update =====
  function setFlip(flip, newVal){
    const cur = flip.dataset.value;
    if (cur === newVal) return;

    // 값 세팅 (top/bot/back에 새 값 반영)
    const [top, bot, backTop, backBot] = [
      flip.querySelector('.top .value'),
      flip.querySelector('.bot .value'),
      flip.querySelector('.back-top .value'),
      flip.querySelector('.back-bot .value')
    ];
    // back 면에 새 값
    backTop.textContent = newVal;
    backBot.textContent = newVal;

    // 애니메이션 트리거
    flip.classList.remove('play');
    // 강제 리플로우로 re-start
    void flip.offsetWidth;
    flip.classList.add('play');

    // 애니 종료 후 실제 값 교체
    const onEnd = () => {
      top.textContent = newVal;
      bot.textContent = newVal;
      flip.dataset.value = newVal;
      flip.removeEventListener('animationend', onEnd);
    };
    flip.addEventListener('animationend', onEnd, { once:true });
  }

  // ===== Time utilities =====
  const pad2 = (n)=> String(n).padStart(2,'0');

  // 드래그 스크럽
  let dragStartX = 0, dragStartOffset = 0;
  stage.addEventListener('pointerdown', e => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartOffset = offsetSec;
  });
  addEventListener('pointerup',  ()=> dragging=false);
  addEventListener('pointercancel', ()=> dragging=false);
  addEventListener('pointermove', e=>{
    if(!dragging) return;
    const dx = e.clientX - dragStartX;
    // 1px ≈ 0.1초로 매핑 (천천히 스크럽)
    offsetSec = Math.max(-24*3600, Math.min(24*3600, Math.round(dragStartOffset + dx*0.1)));
  });

  // 더블클릭 리셋
  stage.addEventListener('dblclick', ()=> offsetSec = 0);

  // 클릭: 12/24h 토글
  stage.addEventListener('click', (e)=>{
    // 드래그 막 끝난 클릭은 무시(작은 이동량 무시)
    if (Math.abs(e.detail) > 1 && dragging) return;
    is24h = !is24h;
  });

  // 휠: Hue 조절
  addEventListener('wheel', (e)=>{
    hue = (hue + (e.deltaY>0 ? -6 : 6) + 360) % 360;
    root.style.setProperty('--hue', hue);
    pill.textContent = `Hue ${Math.round(hue)}°`;
    pill.style.opacity = 1;
    clearTimeout(pill._t);
    pill._t = setTimeout(()=> pill.style.opacity = .0, 900);
  }, { passive:true });

  // T: 테마 순환
  addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 't'){
      themeIndex = (themeIndex + 1) % themes.length;
      const theme = themes[themeIndex];
      if (theme) root.setAttribute('data-theme', theme);
      else root.removeAttribute('data-theme');
    }
  });

  // ===== Main loop =====
  let lastSec = -1;
  function tick(){
    const now = new Date(Date.now() + offsetSec*1000);
    const s = now.getSeconds();
    const m = now.getMinutes();
    let h = now.getHours();

    // 12h 변환
    const hh = is24h ? h : ((h%12) || 12);

    // 날짜 텍스트
    const weekday = ['일','월','화','수','목','금','토'][now.getDay()];
    dateEl.textContent = `${now.getFullYear()}.${pad2(now.getMonth()+1)}.${pad2(now.getDate())} (${weekday})`;

    // 자리값 문자열
    const H = pad2(hh), M = pad2(m), S = pad2(s);
    const arr = (H+M+S).split('');

    // 초가 바뀔 때만 flip 트리거 (불필요한 애니 회피)
    if (s !== lastSec){
      for (let i=0;i<digits.length;i++){
        setFlip(digits[i], arr[i]);
      }
      lastSec = s;
    }

    requestAnimationFrame(tick);
  }
  tick();
})();
