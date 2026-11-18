(function(){
  'use strict';
  var C = window.CONFIG || {};

  // aceita só https:// e, quando pedido, só hosts permitidos (alinhado à CSP do index.html)
  function safeUrl(u, hosts){
    try{
      var x = new URL(String(u));
      if(x.protocol !== 'https:') return '';
      if(hosts && hosts.indexOf(x.hostname) === -1) return '';
      return x.href;
    }catch(e){ return ''; }
  }
  function safeEmail(e){ return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(e||'')) ? String(e) : ''; }

  // botões que dependem de link (formulários, boletim, e-mail)
  document.querySelectorAll('[data-cfg]').forEach(function(a){
    var k = a.getAttribute('data-cfg'), v;
    v = (k === 'email') ? safeEmail(C.email) : safeUrl(C[k]);
    if(v){
      if(k === 'email'){ a.href = 'mailto:' + v + '?subject=' + encodeURIComponent(a.getAttribute('data-subject') || ''); }
      else { a.href = v; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    } else {
      a.className = a.className + ' disabled';
      a.removeAttribute('href');
      a.textContent = a.getAttribute('data-soon');
      a.setAttribute('aria-disabled', 'true');
    }
  });

  // painel incorporado (opcional)
  var painel = safeUrl(C.painelUrl, ['lookerstudio.google.com', 'app.powerbi.com']);
  var frame = document.querySelector('[data-cfg-src]');
  if(frame && painel){
    frame.src = painel;
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    document.getElementById('painel').hidden = false;
  }

  // rodapé
  var fe = document.getElementById('f-email'), fi = document.getElementById('f-insta');
  var em = safeEmail(C.email), ig = safeUrl(C.instagram);
  if(em){ fe.href = 'mailto:' + em; fe.textContent = em; fe.hidden = false; } else if(fe.nextElementSibling){ fe.nextElementSibling.remove(); }
  if(ig){ fi.href = ig; fi.target = '_blank'; fi.rel = 'noopener noreferrer'; fi.hidden = false; }

  // rolagem suave (e foco para teclado/leitor de tela)
  document.querySelectorAll('[data-go]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var el = document.getElementById(a.getAttribute('data-go'));
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // aparecer ao rolar + animar barras
  var fills = document.querySelectorAll('.fill');
  function grow(){ fills.forEach(function(f){ f.style.width = f.getAttribute('data-w') + '%'; }); }
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('.reveal').forEach(function(r){ r.classList.add('in'); });
    grow(); return;
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(en.isIntersecting){
        en.target.classList.add('in');
        if(en.target.querySelector('.fill')) grow();
        io.unobserve(en.target);
      }
    });
  }, {threshold:.15});
  document.querySelectorAll('.reveal').forEach(function(r){ io.observe(r); });
})();
