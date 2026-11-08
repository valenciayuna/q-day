/* Q-DAY × NEAR testnet
 *
 * Drop-in layer for the finished build: it never touches the game's own code. It reads the
 * leaderboard contract with a view call (no wallet), shows it on the main menu, and catches the
 * moment a run beats the stored high score so the player can post it on-chain.
 */
(() => {
  const CONTRACT = 'qday-arena-5959.testnet';
  const RPC = 'https://rpc.testnet.fastnear.com';

  const style = document.createElement('style');
  style.textContent = `
  #nl{position:fixed;right:16px;bottom:14px;z-index:40;width:min(310px,40vw);background:rgba(6,8,12,.86);
      border:1px solid #2a3140;border-radius:12px;padding:10px 12px;font:11px/1.5 ui-monospace,monospace;
      color:#d9d3c7;backdrop-filter:blur(4px);opacity:0;transition:opacity .25s;pointer-events:none}
  #nl.on{opacity:1;pointer-events:auto}
  #nl h4{margin:0 0 6px;font:700 9px/1 ui-monospace,monospace;letter-spacing:1.6px;color:#f5d547;text-transform:uppercase}
  #nl .row{display:flex;justify-content:space-between;gap:8px;padding:1px 0}
  #nl .row b{color:#f4efe4;font-weight:600}
  #nl .me{color:#5fd0cf}
  #nl .addr{margin-top:6px;font-size:9px;color:#6b7076;word-break:break-all}
  #nl .copy{margin-top:7px;width:100%;background:#151b26;color:#c9a6ff;border:1px solid #2f3a4d;border-radius:7px;
            padding:6px 8px;font:600 9.5px/1.3 ui-monospace,monospace;cursor:pointer;letter-spacing:.4px}
  #nl .copy:hover{background:#1b2331}
  #nt{position:fixed;left:50%;top:16%;transform:translate(-50%,-8px);z-index:60;background:rgba(6,8,12,.94);
      border:1px solid #f5d547;border-radius:12px;padding:14px 18px;max-width:min(420px,86vw);text-align:center;
      font:12px/1.6 ui-monospace,monospace;color:#f4efe4;opacity:0;transition:.3s;pointer-events:none}
  #nt.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
  #nt .big{font:800 20px/1.2 ui-monospace,monospace;color:#f5d547;letter-spacing:.5px}
  @media (max-width:760px){
    #nl{left:10px;right:10px;bottom:8px;width:auto}
  }
  #nt button{margin-top:10px;background:#151b26;color:#5fd0cf;border:1px solid #2f3a4d;border-radius:8px;
             padding:7px 12px;font:700 10px/1 ui-monospace,monospace;cursor:pointer;letter-spacing:1px}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'nl';
  panel.innerHTML = '<h4>NEAR Testnet Leaderboard</h4><div id="nl-body">…</div>'
    + `<div class="addr">${CONTRACT}</div>`;
  document.body.appendChild(panel);

  const toast = document.createElement('div');
  toast.id = 'nt';
  document.body.appendChild(toast);

  let rows = null;

  async function fetchTop(n = 5) {
    const body = JSON.stringify({
      jsonrpc: '2.0', id: 'qday', method: 'query',
      params: {
        request_type: 'call_function', finality: 'final',
        account_id: CONTRACT, method_name: 'top',
        args_base64: btoa(JSON.stringify({ n })),
      },
    });
    const res = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    const j = await res.json();
    if (!j.result) throw new Error('rpc');
    return JSON.parse(new TextDecoder().decode(new Uint8Array(j.result.result)));
  }

  function render() {
    const body = document.getElementById('nl-body');
    if (!body) return;
    if (!rows) { body.innerHTML = '<div style="color:#6b7076">loading…</div>'; return; }
    if (!rows.length) { body.innerHTML = '<div style="color:#6b7076">no runs yet — be the first</div>'; return; }
    body.innerHTML = rows.map((r, i) => {
      const name = String(r.name || r.account || '?').slice(0, 16);
      const pad = String(r.score).padStart(5, '0');
      return `<div class="row"><span class="${i === 0 ? 'me' : ''}">${i + 1}. ${name}</span>`
        + `<b>${pad}${r.boss_down ? ' ★' : ''}</b></div>`;
    }).join('');
  }

  async function refresh() {
    try { rows = await fetchTop(5); } catch (e) { rows = null; }
    render();
  }

  // the menu is re-rendered by the game, so follow it instead of assuming it stays
  function syncVisibility() {
    const menu = document.getElementById('mainMenu');
    const shown = menu && getComputedStyle(menu).opacity !== '0'
      && menu.getBoundingClientRect().width > 0
      && getComputedStyle(menu).display !== 'none';
    panel.classList.toggle('on', !!shown);
  }
  new MutationObserver(syncVisibility).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  setInterval(syncVisibility, 600);

  // ---- catch a finished run: the game writes its best score to localStorage at that moment
  let lastBest = 0;
  try { lastBest = +localStorage.getItem('qday-hi') || 0; } catch (e) {}
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    realSet.call(this, k, v);
    if (k === 'qday-hi') {
      const score = +v || 0;
      if (score > 0) offerSubmit(score);
    }
  };

  function offerSubmit(score) {
    const cmd = `near call ${CONTRACT} submit '{"name":"YOU","score":${score},"wave":5,"boss_down":true}' --accountId YOUR.testnet`;
    toast.innerHTML = `<div class="big">RUN ENDED · ${score}</div>`
      + `<div style="color:#8b929a;margin-top:4px">post it on NEAR testnet so it shows on the board</div>`
      + `<button id="nt-copy">COPY SUBMIT COMMAND</button>`;
    toast.classList.add('on');
    const btn = document.getElementById('nt-copy');
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(cmd); btn.textContent = 'COPIED'; }
      catch (e) { btn.textContent = cmd.slice(0, 42) + '…'; }
      setTimeout(() => toast.classList.remove('on'), 2200);
    };
    setTimeout(() => toast.classList.remove('on'), 12000);
  }

  // copy button inside the panel, for the last known score
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy';
  copyBtn.textContent = 'COPY SUBMIT COMMAND';
  copyBtn.onclick = () => {
    let hi = 0;
    try { hi = +localStorage.getItem('qday-hi') || 0; } catch (e) {}
    const cmd = `near call ${CONTRACT} submit '{"name":"YOU","score":${hi},"wave":5,"boss_down":true}' --accountId YOUR.testnet`;
    navigator.clipboard.writeText(cmd).then(() => {
      copyBtn.textContent = 'COPIED';
      setTimeout(() => { copyBtn.textContent = 'COPY SUBMIT COMMAND'; }, 1500);
    });
  };
  panel.appendChild(copyBtn);

  refresh();
  setInterval(refresh, 45000);
})();
