(() => {
  const clock = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const pill = document.getElementById('pill');

  if (clock.dataset.built === "1") return;
  clock.dataset.built = "1";

  const groups = [...clock.querySelectorAll('.group')];
  groups.forEach(g => g.innerHTML = '');

  function makeFlip(v="0") {
    const flip = document.createElement('div');
    flip.className = 'flip';
    flip.dataset.value = v;
    const panel = document.createElement('div');
    panel.className = 'panel';
    const top = document.createElement('div');
    top.className = 'half top'; top.textContent = v;
    const bot = document.createElement('div');
    bot.className = 'half bot'; bot.textContent = v;
    const backTop = document.createElement('div');
    backTop.className = 'back-top'; backTop.textContent = v;
    const backBot = document.createElement('div');
    backBot.className = 'back-bot'; backBot.textContent = v;
    panel.append(top, bot, backTop, backBot);
    flip.append(panel);
    return flip;
  }

  const digits = [];
  groups.forEach(g => {
    const f = makeFlip("0");
    g.append(f);
    digits.push(f);
  });

  let is24h = true;
  pill.onclick = () => {
    is24h = !is24h;
    pill.textContent = is24h ? "24H" : "12H";
    updateClock(true);
  };

  function setFlip(flip, newVal) {
    const cur = flip.dataset.value;
    if (cur === newVal) return;

    const top = flip.querySelector('.top');
    const bot = flip.querySelector('.bot');
    const backTop = flip.querySelector('.back-top');
    const backBot = flip.querySelector('.back-bot');

    backTop.textContent = cur;
    backBot.textContent = newVal;
    top.textContent = cur;
    bot.textContent = newVal;

    flip.classList.remove('play');
    void flip.offsetWidth;
    flip.classList.add('play');

    flip.dataset.value = newVal;
  }

  function updateClock(force=false) {
    const now = new Date();
    let h = now.getHours();
    if (!is24h) h = (h % 12) || 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const vals = [
      Math.floor(h/10), h%10,
      Math.floor(m/10), m%10,
      Math.floor(s/10), s%10
    ];
    vals.forEach((v,i)=> setFlip(digits[i], String(v)));

    dateEl.textContent = now.toLocaleDateString("ko-KR", {weekday:"long", month:"long", day:"numeric"});
  }

  updateClock(true);
  setInterval(updateClock, 1000);
})();
