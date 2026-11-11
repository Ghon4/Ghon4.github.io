(function () {
  var root = document.documentElement;
  root.classList.add('js');
  root.classList.remove('no-js');

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var revealAll = false;
  try {
    revealAll = /(?:^|[?&])reveal=all(?:&|$)/.test(window.location.search);
  } catch (e) {}

  // Theme toggle (initial theme is set inline in <head> to avoid a flash)
  var toggle = document.querySelector('.theme-toggle');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    if (toggle) toggle.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f5faf6' : '#07130d');
  }
  if (toggle) {
    setTheme(root.getAttribute('data-theme') || 'dark');
    toggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  }

  // Mobile menu
  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');

  function revealNow(el) {
    el.classList.add('in');
  }

  if (reduceMotion || revealAll || !('IntersectionObserver' in window)) {
    revealEls.forEach(revealNow);
  } else {
    ['.featured', '.projects', '.skills', '.edu-grid', '.timeline', '.stats', '.stats-strip'].forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      var items = group.querySelectorAll(':scope > .reveal');
      items.forEach(function (el, i) {
        el.style.transitionDelay = (i * 80) + 'ms';
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          revealNow(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Active nav link
  if ('IntersectionObserver' in window) {
    var links = document.querySelectorAll('.nav-links a');
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { so.observe(s); });
  }

  // Project filters — keep show/hide in sync with reveal classes
  var filters = document.querySelectorAll('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('#projects .card').forEach(function (card) {
        var cats = (card.getAttribute('data-cats') || '').split(' ');
        var show = f === 'all' || cats.indexOf(f) !== -1;
        var li = card.parentElement;
        li.hidden = !show;
        if (show && li.classList.contains('reveal') && !li.classList.contains('in')) {
          var rect = li.getBoundingClientRect();
          var inView = rect.top < (window.innerHeight || 0) && rect.bottom > 0;
          if (inView || reduceMotion || revealAll) revealNow(li);
        }
      });
    });
  });

  // Stats count-up: 7+, 10+, 1.1M+, 20K+ — always finish on the exact original text
  var STAT_DURATION = 1200;

  function countUp(el) {
    if (el.getAttribute('data-counted') === '1') return;
    el.setAttribute('data-counted', '1');
    var finalText = el.getAttribute('data-final') || (el.textContent || '').trim();
    el.setAttribute('data-final', finalText);
    if (reduceMotion) {
      el.textContent = finalText;
      return;
    }
    var m = finalText.match(/^(\d+(?:\.\d+)?)([A-Za-z]*)(\+?)$/);
    if (!m) {
      el.textContent = finalText;
      return;
    }
    var end = parseFloat(m[1]);
    var suffix = (m[2] || '') + (m[3] || '');
    var decimals = (m[1].split('.')[1] || '').length;
    var startTime = null;

    function format(val, done) {
      if (done) return finalText;
      if (decimals) return val.toFixed(decimals) + suffix;
      return Math.round(val) + suffix;
    }

    el.textContent = format(0, false);

    function frame(now) {
      if (startTime === null) startTime = now;
      var t = Math.min(1, (now - startTime) / STAT_DURATION);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = end * eased;
      if (t >= 1) {
        el.textContent = finalText;
        return;
      }
      el.textContent = format(val, false);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var statNums = document.querySelectorAll('.stats-strip strong, .stat strong');
  if (reduceMotion) {
    statNums.forEach(function (el) {
      el.setAttribute('data-final', (el.textContent || '').trim());
      el.setAttribute('data-counted', '1');
    });
  } else if (revealAll) {
    // Screenshots: show settled final values
    statNums.forEach(function (el) {
      el.setAttribute('data-final', (el.textContent || '').trim());
      el.setAttribute('data-counted', '1');
    });
  } else if ('IntersectionObserver' in window) {
    var statIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          countUp(e.target);
          statIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(function (el) { statIo.observe(el); });
  } else {
    statNums.forEach(countUp);
  }

  // Hero group tilt / parallax — desktop pointer only
  var heroShots = document.querySelector('.hero-shots');
  var coarsePointer = false;
  var hasTouch = false;
  try {
    coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  } catch (e) {}
  try {
    hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  } catch (e) {}

  if (heroShots && !reduceMotion && !coarsePointer && !hasTouch) {
    var MAX_TILT = 6;
    heroShots.addEventListener('mousemove', function (e) {
      var r = heroShots.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      var ry = px * 2 * MAX_TILT;
      var rx = -py * 2 * MAX_TILT;
      if (ry > MAX_TILT) ry = MAX_TILT;
      if (ry < -MAX_TILT) ry = -MAX_TILT;
      if (rx > MAX_TILT) rx = MAX_TILT;
      if (rx < -MAX_TILT) rx = -MAX_TILT;
      heroShots.classList.add('tilting');
      heroShots.style.transform = 'perspective(900px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
    });
    heroShots.addEventListener('mouseleave', function () {
      heroShots.classList.remove('tilting');
      heroShots.style.transform = '';
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
