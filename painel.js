/* Painel do OBVA-Capanema: gráficos desenhados com HTML e CSS, sem bibliotecas nem rede. */
(function () {
  'use strict';
  var N = 23, L = 6;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dados (primeira rodada) ---------- */
  var D = {
    kpiC: [
      { n: 83, s: '%', t: 'compram nas lojas físicas de Capanema' },
      { n: 87, s: '%', t: 'dizem que o preço é o que mais pesa na escolha da loja' },
      { n: 57, s: '%', t: 'já deixaram de comprar ou adiaram por falta de parcelamento ou crédito' },
      { n: 52, s: '%', t: 'pretendem reformar ou construir nos próximos 12 meses' },
      { n: 65, s: '%', t: 'sentiram os preços subirem nos últimos 6 meses' }
    ],
    pagto: [['Pix', 14], ['Cartão de crédito', 12], ['Dinheiro', 11], ['Cartão de débito', 3], ['Crediário/caderneta', 3]],
    canais: [['Instagram / Facebook', 16], ['WhatsApp', 11], ['Boca a boca', 10], ['Ponto físico', 8], ['Sites', 3], ['Rádio local', 2], ['Panfletos/faixas', 2], ['TikTok', 1]],
    gasto: [['Não comprou', 13], ['R$ 101 a R$ 500', 7], ['R$ 501 a R$ 1.000', 2], ['Acima de R$ 2.000', 1]],
    aval: [
      ['Atendimento', [3, 1, 10, 8, 1]],
      ['Condições de pagamento', [3, 0, 14, 5, 1]],
      ['Variedade de produtos', [3, 4, 11, 5, 0]],
      ['Prazo e custo de entrega', [4, 4, 8, 6, 1]],
      ['Preços', [2, 2, 17, 2, 0]]
    ],
    niveis: ['Muito insatisfeito', 'Insatisfeito', 'Neutro', 'Satisfeito', 'Muito satisfeito'],
    kpiL: [
      { n: 5, s: ' de 6', t: 'lojas apontam o custo das mercadorias como a maior dificuldade' },
      { n: 5, s: ' de 6', t: 'dizem que o período de chuvas reduz as vendas' },
      { n: 4, s: ' de 6', t: 'citam junho como um dos meses mais fortes' },
      { n: 5, s: ' de 6', t: 'esperam vendas melhores nos próximos 6 meses' }
    ],
    dores: [['Custo das mercadorias', 5], ['Concorrência (Belém, grandes redes, internet)', 4], ['Impostos e burocracia', 3], ['Inadimplência', 1]],
    vcanais: [['Redes sociais', 5], ['WhatsApp / WhatsApp Business', 4], ['Indicação / boca a boca', 3], ['Venda presencial / prospecção', 3], ['Loja virtual própria', 3], ['Marketplaces', 2], ['Tráfego pago', 1]],
    vpagto: [['Cartão de débito', 6], ['Pix', 5], ['Dinheiro', 5], ['Crédito à vista', 5], ['Crédito parcelado', 5], ['Crediário próprio', 1], ['Boleto', 1]],
    meses: [['Janeiro', 3, 0], ['Março', 0, 3], ['Junho', 4, 0], ['Agosto', 2, 3], ['Setembro', 2, 0], ['Dezembro', 2, 4]]
  };

  /* ---------- utilidades ---------- */
  var unit = '%';               // '%' ou 'n' (só nos gráficos dos consumidores)
  var updaters = [];            // funções que redesenham os números ao trocar a unidade
  var reg = {};                 // gráficos registrados, para os atalhos dos cartões
  var coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pct(v, base) { return Math.round(v / base * 100); }
  function card(title, sub) {
    var c = el('article', 'card d-card');
    c.appendChild(el('h3', null, title));
    if (sub) c.appendChild(el('p', 'd-sub', sub));
    return c;
  }
  function grow(fill, w) {
    if (calm) { fill.style.width = w + '%'; return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = w + '%'; }); });
  }
  function plural(n, s, p) { return n + ' ' + (n === 1 ? s : p); }

  /* ---------- dica flutuante (mouse, toque e teclado) ---------- */
  var tip = el('div', 'd-tip'); tip.setAttribute('role', 'presentation');
  var tipT = el('strong'), tipB = el('span');
  tip.appendChild(tipT); tip.appendChild(tipB); document.body.appendChild(tip);
  var tipTimer = 0;
  function placeTip(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var left = Math.min(Math.max(8, x - w / 2), vw - w - 8);
    var top = y - h - 14; if (top < 8) top = Math.min(y + 18, vh - h - 8);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function showTip(title, body, x, y, autoHide) {
    tipT.textContent = title; tipB.textContent = body;
    tip.classList.add('on'); placeTip(x, y);
    clearTimeout(tipTimer);
    if (autoHide) tipTimer = setTimeout(hideTip, autoHide);
  }
  function hideTip() { tip.classList.remove('on'); clearTimeout(tipTimer); }
  function anchor(node) { var r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top + Math.min(r.height / 2, 24)]; }
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest || !e.target.closest('[data-tip]')) hideTip(); });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* liga dica + destaque + fixação a um elemento
     cfg: {box, node, title, body(), detail(), mark} */
  function wire(cfg) {
    var n = cfg.node, box = cfg.box;
    n.setAttribute('data-tip', '1'); n.tabIndex = 0; n.setAttribute('role', 'button');
    n.setAttribute('aria-pressed', 'false');
    function on() { box.classList.add('focus'); n.classList.add('act'); }
    function off() { if (box._pin !== n) { n.classList.remove('act'); if (!box._pin) box.classList.remove('focus'); } }
    n.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { on(); showTip(cfg.title, cfg.body(), e.clientX, e.clientY); } });
    n.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') placeTip(e.clientX, e.clientY); });
    n.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { off(); hideTip(); } });
    n.addEventListener('focus', function () { on(); var p = anchor(n); showTip(cfg.title, cfg.body(), p[0], p[1]); });
    n.addEventListener('blur', function () { off(); hideTip(); });
    n.addEventListener('click', function (e) {
      var was = box._pin === n;
      if (box._pin) { box._pin.classList.remove('act'); box._pin.setAttribute('aria-pressed', 'false'); }
      box._pin = null; box.classList.remove('focus');
      if (!was) {
        box._pin = n; n.classList.add('act'); n.setAttribute('aria-pressed', 'true'); box.classList.add('focus');
        if (cfg.detail) cfg.detail(cfg.detailText());
        if (e.pointerType === 'touch' || coarse || e.detail === 0) { var p = anchor(n); showTip(cfg.title, cfg.body(), p[0], p[1], 2600); }
      } else { if (cfg.detail) cfg.detail(null); hideTip(); }
    });
    n.addEventListener('keydown', function (e) { if (e.key === ' ') { e.preventDefault(); n.click(); } });
    n._pinTo = function () { if (box._pin !== n) n.click(); };
  }

  function detailBox(card, hint) {
    var d = el('p', 'd-detail', hint);
    d.setAttribute('aria-live', 'polite');
    d._hint = hint;
    card.appendChild(d);
    return function (t) { d.textContent = t || d._hint; d.classList.toggle('on', !!t); };
  }

  /* barras horizontais: items = [[rótulo, valor]], base = total, kind: 'p' (pessoas) ou 'l' (lojas) */
  function bars(items, base, kind, color, key, parentCard) {
    var box = el('div', 'd-bars'), rows = [];
    var setDetail = detailBox(parentCard, coarse ? 'Toque numa barra para ver os detalhes.' : 'Passe o mouse ou clique numa barra para ver os detalhes.');
    var order = items.map(function (it, i) { return [it[1], i]; }).sort(function (a, b) { return b[0] - a[0]; });
    var rank = {}; order.forEach(function (o, r) { rank[o[1]] = r + 1; });
    items.forEach(function (it, i) {
      var row = el('div', 'd-row');
      row.appendChild(el('span', 'd-lab', it[0]));
      var tr = el('span', 'd-track'), fl = el('span', 'd-fill' + (color ? ' ' + color : ''));
      tr.appendChild(fl); row.appendChild(tr);
      var val = el('b', 'd-val'); row.appendChild(val);
      function txt() { return (kind === 'p' && unit === '%') ? pct(it[1], base) + '%' : it[1] + ' de ' + base; }
      function long() {
        var who = kind === 'p' ? plural(it[1], 'pessoa', 'pessoas') : plural(it[1], 'loja', 'lojas');
        return it[1] + ' de ' + base + ' ' + (kind === 'p' ? 'pessoas' : 'lojas') + (kind === 'p' ? ' (' + pct(it[1], base) + '%)' : '') + ' · ' + rank[i] + 'º de ' + items.length;
      }
      function paint() { val.textContent = txt(); row.setAttribute('aria-label', it[0] + ': ' + txt()); }
      paint(); if (kind === 'p') updaters.push(paint);
      box.appendChild(row); rows.push(row);
      grow(fl, it[1] / base * 100);
      wire({ box: box, node: row, title: it[0], body: long, detail: setDetail, detailText: function () { return it[0] + ': ' + long() + '.'; } });
    });
    if (key) reg[key] = { card: parentCard, rows: rows };
    return box;
  }
  function cardBars(title, sub, items, base, kind, color, key) {
    var c = card(title, sub);
    c.appendChild(bars(items, base, kind, color, key, c));
    c.appendChild(c.querySelector('.d-detail'));
    if (key) reg[key].card = c;
    return c;
  }

  /* cartões de número: clique leva ao gráfico relacionado */
  function kpis(list, links) {
    var g = el('div', 'd-kpis');
    list.forEach(function (k, i) {
      var c = el('div', 'card stat d-kpi');
      var n = el('div', 'n', k.n + k.s);
      n.setAttribute('data-n', k.n); n.setAttribute('data-s', k.s);
      c.appendChild(n); c.appendChild(el('p', null, k.t));
      var lk = links && links[i];
      if (lk) {
        c.classList.add('go'); c.tabIndex = 0; c.setAttribute('role', 'button');
        c.setAttribute('aria-label', k.n + k.s + ' ' + k.t + '. Ver no gráfico.');
        c.appendChild(el('span', 'd-go', 'Ver no gráfico ↓'));
        function go() { goTo(lk[0], lk[1]); }
        c.addEventListener('click', go);
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      }
      g.appendChild(c);
    });
    return g;
  }
  function goTo(key, idx) {
    var r = reg[key]; if (!r) return;
    r.card.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    r.card.classList.remove('flash'); void r.card.offsetWidth; r.card.classList.add('flash');
    setTimeout(function () { r.card.classList.remove('flash'); }, 1800);
    var row = r.rows[idx];
    if (row) setTimeout(function () { row._pinTo(); }, calm ? 0 : 450);
  }
  function count(n) {
    if (calm) return;
    var to = +n.getAttribute('data-n'), s = n.getAttribute('data-s'), t0 = null;
    n.textContent = '0' + s;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min((t - t0) / 1200, 1), e = 1 - Math.pow(1 - k, 3);
      n.textContent = Math.round(to * e) + s;
      if (k < 1) requestAnimationFrame(step); else n.textContent = to + s;
    }
    requestAnimationFrame(step);
  }

  /* alternador de unidade: porcentagem x pessoas */
  function unitToggle() {
    var w = el('div', 'd-unit'); w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Mostrar valores em');
    w.appendChild(el('span', null, 'Mostrar valores em:'));
    [['%', 'Porcentagem'], ['n', 'Pessoas']].forEach(function (o) {
      var b = el('button', 'd-u', o[1]); b.type = 'button'; b.setAttribute('aria-pressed', o[0] === unit ? 'true' : 'false');
      b.addEventListener('click', function () {
        unit = o[0];
        w.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        updaters.forEach(function (f) { f(); });
      });
      w.appendChild(b);
    });
    return w;
  }

  /* satisfação: barras empilhadas 100% + saldo, legenda filtra os níveis */
  function satisf() {
    var c = card('Como o consumidor avalia o comércio local', 'Percentual de respostas em cada nível. À direita, o saldo: satisfeitos menos insatisfeitos.');
    var box = el('div', 'd-stacks'), rows = [];
    var setDetail;
    var leg = el('div', 'd-leg'); leg.setAttribute('role', 'group'); leg.setAttribute('aria-label', 'Filtrar por nível de satisfação');
    D.niveis.forEach(function (nm, i) {
      var b = el('button', 'd-leg-i'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('i', 's' + (i + 1))); b.appendChild(document.createTextNode(nm));
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !leg._pin) box.setAttribute('data-lf', i + 1); });
      b.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !leg._pin) box.removeAttribute('data-lf'); });
      b.addEventListener('click', function () {
        var was = leg._pin === b;
        leg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        leg._pin = null; box.removeAttribute('data-lf');
        if (!was) { leg._pin = b; b.setAttribute('aria-pressed', 'true'); box.setAttribute('data-lf', i + 1); }
      });
      leg.appendChild(b);
    });
    c.appendChild(leg);
    D.aval.forEach(function (a, ri) {
      var v = a[1], saldo = Math.round((v[3] + v[4] - v[0] - v[1]) / N * 100);
      var row = el('div', 'd-srow');
      row.appendChild(el('span', 'd-lab', a[0]));
      var bar = el('span', 'd-stack'), segs = [];
      v.forEach(function (x, i) {
        if (!x) return;
        var seg = el('span', 'sg s' + (i + 1)); seg.style.flexGrow = x; seg._i = i;
        seg.setAttribute('data-tip', '1');
        function body() { return plural(x, 'pessoa', 'pessoas') + ' (' + pct(x, N) + '%)'; }
        seg.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showTip(a[0] + ' · ' + D.niveis[i], body(), e.clientX, e.clientY); });
        seg.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') placeTip(e.clientX, e.clientY); });
        seg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTip(); });
        seg.addEventListener('click', function (e) { e.stopPropagation(); if (e.pointerType === 'touch' || coarse) { var p = anchor(seg); showTip(a[0] + ' · ' + D.niveis[i], body(), p[0], p[1], 2600); } });
        function paintSeg() { seg.textContent = pct(x, N) >= 9 ? (unit === '%' ? pct(x, N) + '%' : String(x)) : ''; }
        paintSeg(); updaters.push(paintSeg);
        bar.appendChild(seg);
      });
      row.appendChild(bar);
      row.appendChild(el('b', 'd-saldo ' + (saldo >= 0 ? 'pos' : 'neg'), (saldo > 0 ? '+' : '') + saldo));
      row.setAttribute('aria-label', a[0] + ': ' + D.niveis.map(function (nm, i) { return nm + ' ' + pct(v[i], N) + '%'; }).join(', ') + '. Saldo ' + (saldo > 0 ? '+' : '') + saldo + ' pontos.');
      box.appendChild(row); rows.push(row);
      row._cfg = { satisf: pct(v[3] + v[4], N), neut: pct(v[2], N), insat: pct(v[0] + v[1], N), saldo: saldo, nome: a[0] };
    });
    c.appendChild(box);
    setDetail = detailBox(c, coarse ? 'Toque numa barra para ver o resumo do item. Toque na legenda para filtrar um nível.' : 'Clique numa linha para ver o resumo. Passe o mouse ou clique na legenda para filtrar um nível.');
    rows.forEach(function (row) {
      var g = row._cfg;
      wire({ box: box, node: row, title: g.nome, body: function () { return g.satisf + '% satisfeitos · ' + g.neut + '% neutros · ' + g.insat + '% insatisfeitos'; },
        detail: setDetail, detailText: function () { return g.nome + ': ' + g.satisf + '% satisfeitos, ' + g.neut + '% neutros e ' + g.insat + '% insatisfeitos. Saldo de ' + (g.saldo > 0 ? '+' : '') + g.saldo + ' pontos (' + (g.saldo > 0 ? 'mais elogios que queixas' : g.saldo < 0 ? 'mais queixas que elogios' : 'empate') + ').'; } });
    });
    reg.aval = { card: c, rows: rows };
    return c;
  }

  function meses() {
    var c = card('Meses fortes e fracos', 'Quantas das 6 lojas citaram cada mês.');
    var leg = el('div', 'd-leg');
    [['forte', 'Citado como forte'], ['fraco', 'Citado como fraco']].forEach(function (x) {
      var li = el('span', 'd-leg-i'); li.appendChild(el('i', x[0])); li.appendChild(document.createTextNode(x[1])); leg.appendChild(li);
    });
    c.appendChild(leg);
    var box = el('div', 'd-bars'), rows = [];
    var setDetail = detailBox(c, coarse ? 'Toque num mês para ver o detalhe.' : 'Passe o mouse ou clique num mês para ver o detalhe.');
    D.meses.forEach(function (m) {
      var row = el('div', 'd-row d-row2');
      row.setAttribute('aria-label', m[0] + ': forte em ' + m[1] + ' de 6 lojas, fraco em ' + m[2] + ' de 6');
      row.appendChild(el('span', 'd-lab', m[0]));
      var pair = el('span', 'd-pair');
      [[m[1], 'forte'], [m[2], 'fraco']].forEach(function (x) {
        var tr = el('span', 'd-track'), fl = el('span', 'd-fill ' + x[1]); tr.appendChild(fl); pair.appendChild(tr); grow(fl, x[0] / L * 100);
      });
      row.appendChild(pair);
      row.appendChild(el('b', 'd-val', m[1] + ' · ' + m[2]));
      box.appendChild(row); rows.push(row);
      function body() { return 'Forte em ' + m[1] + ' de ' + L + ' lojas · fraco em ' + m[2] + ' de ' + L; }
      wire({ box: box, node: row, title: m[0], body: body, detail: setDetail,
        detailText: function () { return m[0] + ': ' + body().toLowerCase().replace(/^forte/, 'forte') + '. ' + (m[1] > m[2] ? 'Mês de venda forte.' : m[2] > m[1] ? 'Mês de venda fraca.' : 'Sem tendência clara.'); } });
    });
    c.appendChild(box);
    c.appendChild(c.querySelector('.d-detail'));
    reg.meses = { card: c, rows: rows };
    return c;
  }

  function note(title, items) {
    var c = el('aside', 'card d-note');
    c.appendChild(el('h3', null, title));
    var ul = el('ul');
    items.forEach(function (t) { ul.appendChild(el('li', null, t)); });
    c.appendChild(ul);
    return c;
  }
  function grid(cols) { var g = el('div', 'd-grid'); cols.forEach(function (c) { g.appendChild(c); }); return g; }

  /* ---------- painéis ---------- */
  function buildConsumidor(root) {
    var pag = cardBars('Como o consumidor paga', 'Cada pessoa pôde marcar mais de uma forma.', D.pagto, N, 'p', '', 'pagto');
    var can = cardBars('Onde descobre ofertas', 'Canais citados pelos consumidores.', D.canais, N, 'p', 'amber', 'canais');
    var gas = cardBars('Quanto gastou em materiais nos últimos 12 meses', 'Metade das pessoas não comprou no período.', D.gasto, N, 'p', '', 'gasto');
    var sat = satisf();
    root.appendChild(kpis(D.kpiC, [['canais', 3], ['aval', 4], ['aval', 1], null, ['aval', 4]]));
    root.appendChild(el('p', 'fine', 'Base: ' + N + ' consumidores; 91% têm de 18 a 24 anos. Toque ou clique nos cartões e nos gráficos para explorar.'));
    root.appendChild(unitToggle());
    root.appendChild(grid([pag, can]));
    root.appendChild(sat);
    root.appendChild(grid([gas, note('O que isso quer dizer para quem compra', [
      'Compare o preço total com e sem parcelamento: 57% já adiaram compras por falta de crédito.',
      'O Pix é a forma mais usada (61%); pergunte se há desconto à vista.',
      'Instagram e WhatsApp concentram as ofertas: vale seguir as lojas que você já conhece.',
      'Em reformas pequenas, pesquise em mais de uma loja antes de fechar.'
    ])]));
  }
  function buildLojista(root) {
    var dor = cardBars('Maiores dificuldades', 'Quantas das 6 lojas citaram cada uma.', D.dores, L, 'l', '', 'dores');
    var can = cardBars('Como vende e divulga', 'Canais usados pelas lojas.', D.vcanais, L, 'l', 'amber', 'vcanais');
    var mes = meses();
    var pg = cardBars('Meios de pagamento aceitos', 'Todas as lojas aceitam débito; o crediário próprio é raro.', D.vpagto, L, 'l', '', 'vpagto');
    root.appendChild(kpis(D.kpiL, [['dores', 0], null, ['meses', 2], null]));
    root.appendChild(el('p', 'fine', 'Base: ' + L + ' lojas (construção e acabamento, armarinho e utilidades). Amostra pequena: use como pista, não como retrato de todo o comércio.'));
    root.appendChild(grid([dor, can]));
    root.appendChild(grid([mes, pg]));
    root.appendChild(note('O que isso quer dizer para quem vende', [
      'Junho é forte para 4 de 6 lojas: planeje estoque e crédito antes.',
      'Dezembro e março aparecem como meses fracos: vale pensar em promoções e em compras de menor valor.',
      'Para 57% dos consumidores, o parcelamento é o que decide: deixe as condições visíveis nas redes e no balcão.',
      'Os consumidores descobrem ofertas no Instagram e no WhatsApp, os mesmos canais que 5 e 4 das 6 lojas já usam.',
      'Na época das chuvas as vendas caem para 5 de 6 lojas: ofereça itens de reparo e cobertura antes da estação.'
    ]));
  }

  var roots = { consumidor: document.getElementById('p-consumidor'), lojista: document.getElementById('p-lojista') };
  var built = {};
  function show(which) {
    ['consumidor', 'lojista'].forEach(function (k) {
      var on = k === which;
      roots[k].hidden = !on;
      var t = document.getElementById('tab-' + k);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    if (!built[which]) {
      built[which] = true;
      (which === 'consumidor' ? buildConsumidor : buildLojista)(roots[which]);
    }
    roots[which].querySelectorAll('.d-kpi .n').forEach(count);
    try { history.replaceState(null, '', '#' + which); } catch (e) {}
  }
  ['consumidor', 'lojista'].forEach(function (k) {
    var t = document.getElementById('tab-' + k);
    t.addEventListener('click', function () { show(k); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var o = k === 'consumidor' ? 'lojista' : 'consumidor';
        show(o); document.getElementById('tab-' + o).focus();
      }
    });
  });
  (function () {
    var x0 = null, y0 = 0, cur = function () { return roots.lojista.hidden ? 'consumidor' : 'lojista'; };
    document.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 === null) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 90 && Math.abs(dy) < 40) { var c = cur(); if (dx < 0 && c === 'consumidor') show('lojista'); else if (dx > 0 && c === 'lojista') show('consumidor'); }
    }, { passive: true });
  })();
  show(location.hash === '#lojista' ? 'lojista' : 'consumidor');
})();
