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

  var coarsePointer = false;
  var hasTouch = false;
  try {
    coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  } catch (e) {}
  try {
    hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  } catch (e) {}
  var finePointer = !reduceMotion && !coarsePointer && !hasTouch;

  // Theme toggle (initial theme is set inline in <head> to avoid a flash)
  var toggle = document.querySelector('.theme-toggle');
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    if (toggle) toggle.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef6f0' : '#07130d');
  }
  if (toggle) {
    setTheme(root.getAttribute('data-theme') || 'dark');
    toggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  }

  // Hero entrance (presence, once) — gated until intro finishes
  var heroEnters = document.querySelectorAll('.hero-enter');
  var heroShown = false;
  function showHeroEnters() {
    if (heroShown) return;
    heroShown = true;
    heroEnters.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Big intro overlay
  var intro = document.getElementById('site-intro');
  function finishIntro() {
    root.classList.remove('intro-pending', 'intro-playing', 'intro-exit');
    root.classList.add('intro-done');
    showHeroEnters();
  }

  function playIntro() {
    if (!intro || reduceMotion || revealAll || root.classList.contains('intro-done')) {
      finishIntro();
      return;
    }
    root.classList.remove('intro-done');
    root.classList.add('intro-pending', 'intro-playing');
    // Hold the brand beat, then exit
    window.setTimeout(function () {
      root.classList.add('intro-exit');
      window.setTimeout(finishIntro, 820);
    }, 2100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playIntro);
  } else {
    playIntro();
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

  // Scroll reveal + staggered children via --i
  var revealEls = document.querySelectorAll('.reveal');

  function revealNow(el) {
    el.classList.add('in');
  }

  function applyStagger(sel) {
    var group = document.querySelector(sel);
    if (!group) return;
    var items = group.querySelectorAll(':scope > .reveal');
    items.forEach(function (el, i) {
      el.style.setProperty('--i', String(i));
    });
  }

  if (reduceMotion || revealAll || !('IntersectionObserver' in window)) {
    revealEls.forEach(revealNow);
  } else {
    ['.work-list', '.skills', '.edu-grid', '.timeline', '.stats', '.stats-strip'].forEach(applyStagger);

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

  // Active nav link + sliding mint indicator
  var links = document.querySelectorAll('.nav-links a');
  var navWrap = document.querySelector('.nav-links-wrap');
  var indicator = document.querySelector('.nav-indicator');

  function moveIndicator(active) {
    if (!indicator || !navWrap || !active) return;
    var wrapRect = navWrap.getBoundingClientRect();
    var r = active.getBoundingClientRect();
    if (!wrapRect.width || !r.width) return;
    var x = r.left - wrapRect.left;
    indicator.style.width = r.width + 'px';
    indicator.style.transform = 'translate(' + x.toFixed(1) + 'px, -50%)';
    indicator.classList.add('is-ready');
  }

  function setActiveNav(id) {
    var match = null;
    links.forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('active', on);
      if (on) match = l;
    });
    if (match) moveIndicator(match);
  }

  if ('IntersectionObserver' in window && links.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.id === 'top') {
          links.forEach(function (l) { l.classList.remove('active'); });
          if (indicator) {
            indicator.classList.remove('is-ready');
            indicator.style.width = '0px';
          }
          return;
        }
        setActiveNav(e.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { so.observe(s); });
  }

  window.addEventListener('resize', function () {
    var active = document.querySelector('.nav-links a.active');
    if (active) moveIndicator(active);
  });

  // Project filters — work-list rows
  var filters = document.querySelectorAll('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('#projects .work-item').forEach(function (item) {
        var cats = (item.getAttribute('data-cats') || '').split(' ').filter(Boolean);
        var show = f === 'all' || cats.indexOf(f) !== -1;
        // Empty cats (JKS) only show on "all"
        if (f !== 'all' && !cats.length) show = false;
        item.hidden = !show;
        if (show && item.classList.contains('reveal') && !item.classList.contains('in')) {
          var rect = item.getBoundingClientRect();
          var inView = rect.top < (window.innerHeight || 0) && rect.bottom > 0;
          if (inView || reduceMotion || revealAll) revealNow(item);
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
  if (heroShots && finePointer) {
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

  // Soft magnetic primary CTAs — capped pull, desktop only
  if (finePointer) {
    var MAG = 7;
    document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var x = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAG;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 2 * MAG;
        if (x > MAG) x = MAG;
        if (x < -MAG) x = -MAG;
        if (y > MAG) y = MAG;
        if (y < -MAG) y = -MAG;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + (y - 2).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // ===== Work list: cursor-follow float preview + case-page links =====
  var workStage = document.querySelector('.work-stage');
  var workList = document.getElementById('work-list');
  var workFloat = document.getElementById('work-float');
  var workFloatImg = workFloat ? workFloat.querySelector('img') : null;

  if (workStage && !finePointer) {
    workStage.classList.add('is-touch');
  }

  // Floating preview (desktop fine pointer only) — View label + image; click opens case page
  if (workStage && workList && workFloat && workFloatImg && finePointer) {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var floatOn = false;
    var rafId = 0;
    var LERP = 0.16;
    var activeHref = '';

    function setFloatPos(x, y) {
      var pad = 28;
      var fw = workFloat.offsetWidth || 240;
      var fh = workFloat.offsetHeight || 400;
      var maxX = (window.innerWidth || 0) - fw / 2 - pad;
      var minX = fw / 2 + pad;
      var maxY = (window.innerHeight || 0) - fh / 2 - pad;
      var minY = fh / 2 + pad;
      if (x > maxX) x = maxX;
      if (x < minX) x = minX;
      if (y > maxY) y = maxY;
      if (y < minY) y = minY;
      workFloat.style.left = x + 'px';
      workFloat.style.top = y + 'px';
    }

    function tick() {
      curX += (targetX - curX) * LERP;
      curY += (targetY - curY) * LERP;
      setFloatPos(curX, curY);
      if (floatOn || Math.abs(targetX - curX) > 0.4 || Math.abs(targetY - curY) > 0.4) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
        setFloatPos(targetX, targetY);
      }
    }

    function ensureTick() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function showFloat(item, e) {
      var shot = item.getAttribute('data-shot');
      var href = item.getAttribute('data-href') || (item.querySelector('.work-row') || {}).getAttribute('href') || '';
      if (!shot) {
        hideFloat();
        return;
      }
      if (workFloatImg.getAttribute('src') !== shot) {
        workFloatImg.setAttribute('src', shot);
      }
      activeHref = href;
      if (href) {
        workFloat.setAttribute('href', href);
        workFloat.setAttribute('aria-label', 'View project');
        workFloat.removeAttribute('tabindex');
      }
      workStage.classList.add('is-hovering');
      document.querySelectorAll('.work-item.is-active').forEach(function (el) {
        el.classList.remove('is-active');
      });
      item.classList.add('is-active');
      // Bias preview slightly right/up so the title stays readable; label sits above the frame
      targetX = e.clientX + 80;
      targetY = e.clientY - 8;
      if (!floatOn) {
        curX = targetX;
        curY = targetY;
        setFloatPos(curX, curY);
        floatOn = true;
        workFloat.classList.add('is-on');
        workFloat.setAttribute('aria-hidden', 'false');
      }
      ensureTick();
    }

    function hideFloat() {
      floatOn = false;
      activeHref = '';
      workFloat.classList.remove('is-on');
      workFloat.setAttribute('aria-hidden', 'true');
      workFloat.setAttribute('tabindex', '-1');
      workFloat.setAttribute('href', '#');
      workStage.classList.remove('is-hovering');
      document.querySelectorAll('.work-item.is-active').forEach(function (el) {
        el.classList.remove('is-active');
      });
    }

    workList.querySelectorAll('.work-item').forEach(function (item) {
      var row = item.querySelector('.work-row');
      if (!row) return;
      row.addEventListener('mouseenter', function (e) {
        showFloat(item, e);
      });
      row.addEventListener('mousemove', function (e) {
        if (!item.getAttribute('data-shot')) return;
        targetX = e.clientX + 80;
        targetY = e.clientY - 8;
        ensureTick();
      });
      row.addEventListener('mouseleave', function (e) {
        var to = e.relatedTarget;
        if (to && (workList.contains(to) || workFloat.contains(to))) return;
        hideFloat();
      });
    });

    workFloat.addEventListener('mouseenter', function () {
      /* keep float visible while pointer is over View / image */
    });
    workFloat.addEventListener('mouseleave', function (e) {
      var to = e.relatedTarget;
      if (to && workList.contains(to)) return;
      hideFloat();
    });

    workList.addEventListener('mouseleave', function (e) {
      var to = e.relatedTarget;
      if (to && workFloat.contains(to)) return;
      hideFloat();
    });
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
