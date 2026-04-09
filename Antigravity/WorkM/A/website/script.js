/* ═══════════════════════════════════════════════
   WorkM Homepage – Visitor-Facing Script
   관리자 패널 localStorage 설정을 읽어 홈페이지 렌더링
   다크/라이트 모드 동시 지원
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════
     설정 로드 유틸
  ══════════════════════════ */
  function getLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback || null;
      return JSON.parse(raw);
    } catch (e) { return fallback || null; }
  }

  function getLSRaw(key) {
    return localStorage.getItem(key) || '';
  }

  /* ══════════════════════════
     테마 관리 (다크/라이트)
  ══════════════════════════ */
  function initTheme() {
    // 우선순위: 1) 홈페이지 전용 설정 → 2) 관리자패널 테마 → 3) OS 선호 → 4) light
    var saved = getLSRaw('hp_website_theme');
    if (!saved) {
      var adminTheme = getLSRaw('ws_theme');
      if (adminTheme === 'dark') saved = 'dark';
      else if (adminTheme === 'light') saved = 'light';
    }
    if (!saved) {
      saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('hpThemeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('hp_website_theme', next); } catch (e) { }
  }

  /* ══════════════════════════
     1. 리벳 바 (공지)
  ══════════════════════════ */
  function renderRivet() {
    var el = document.getElementById('hpRivet');
    if (!el) return;
    var data = getLS('hp_rivet');
    if (!data || !data.tags || !data.tags.length) {
      el.style.display = 'none';
      updateLayout();
      return;
    }
    el.style.display = 'flex';
    el.style.background = data.bgColor || '#1e40af';
    el.style.color = data.fontColor || '#ffffff';
    el.style.fontSize = (data.fontSize || 13) + 'px';
    el.style.textAlign = data.align || 'center';
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[data.align] || 'center';

    var html = '<div class="rivet-content">';
    data.tags.forEach(function (tag, i) {
      if (i > 0) html += '<span class="rivet-dot"></span>';
      html += '<span style="white-space:pre">' + escHtml(tag) + '</span>';
    });
    html += '</div>';
    el.innerHTML = html;
    updateLayout();
  }

  /* ══════════════════════════
     2. 헤더 (로고 + 메인메뉴)
  ══════════════════════════ */
  function renderHeader() {
    var headerEl = document.getElementById('hpHeader');
    var navEl = document.getElementById('hpNav');
    var logoEl = document.getElementById('hpLogo');
    if (!headerEl) return;

    /* ── 로고 ── */
    var logoH = getLSRaw('hp_logo_top_h') || getLSRaw('hp_logo_hp_logo_top_h');
    var logoV = getLSRaw('hp_logo_top_v') || getLSRaw('hp_logo_hp_logo_top_v');
    var logoSrc = logoH || logoV;
    if (logoEl) {
      if (logoSrc) {
        logoEl.innerHTML = '<img src="' + logoSrc + '" alt="Logo">';
      } else {
        logoEl.innerHTML = '<span class="logo-text">WorkM</span>';
      }
    }

    /* ── 메뉴 항목 & 스타일 ── */
    var menuData = getLS('hp_mainmenu');
    var menuSettings = getLS('hp_menu_settings');
    var menus = [];
    var settings = {
      bg: '#ffffff', fc: '#1a1a2e', fs: 15, fw: 600, h: 64, gap: 28,
      align: 'center', opacity: 100
    };

    if (menuData) {
      if (Array.isArray(menuData.menus) && menuData.menus.length) {
        menus = menuData.menus.map(function (m) { return typeof m === 'string' ? m : (m.name || m.label || ''); }).filter(Boolean);
      }
      if (menuData.settings) {
        Object.keys(menuData.settings).forEach(function (k) { settings[k] = menuData.settings[k]; });
      }
    }

    if (menuSettings) {
      Object.keys(menuSettings).forEach(function (k) { settings[k] = menuSettings[k]; });
    }

    if (!menus.length) {
      var items2 = getLS('hp_menu_items');
      if (Array.isArray(items2) && items2.length) {
        menus = items2.map(function (m) { return typeof m === 'string' ? m : (m.name || ''); }).filter(Boolean);
      }
    }
    if (!menus.length) menus = ['홈', '회사소개', '서비스', '포트폴리오', '공지사항', '문의하기'];

    // 헤더 스타일
    var opacityVal = parseInt(settings.opacity, 10);
    if (isNaN(opacityVal)) opacityVal = 100;
    var bgColor = settings.bg || '#ffffff';
    if (opacityVal < 100) {
      var rgb = hexToRgb(bgColor);
      if (rgb) bgColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (opacityVal / 100).toFixed(2) + ')';
    }

    headerEl.style.background = bgColor;
    headerEl.style.minHeight = (settings.h || 64) + 'px';

    // 투명도에 비례해 blur 조절 (투명할수록 blur 감소 → 뒤 이미지 선명)
    var blurPx = Math.round((opacityVal / 100) * 14);
    headerEl.style.backdropFilter = 'blur(' + blurPx + 'px)';
    headerEl.style.webkitBackdropFilter = 'blur(' + blurPx + 'px)';

    var jc = settings.align || 'center';
    if (jc === 'left') jc = 'flex-start';
    else if (jc === 'right') jc = 'flex-end';
    else if (jc === 'space') jc = 'space-between';

    // 메뉴 상세 데이터 (클릭 시 URL 이동 + 서브메뉴)
    var menuDetails = getLS('hp_menu_details', {});

    /* ── 솔루션 목록 (관리자 패널과 동기화) ── */
    var _solutionItems = [
      { id: 'terms', label: '이용약관' },
      { id: 'privacy', label: '개인정보 취급방침' },
      { id: 'board', label: '게시판' },
      { id: 'biz', label: '거래처관리' },
      { id: 'content', label: '컨텐츠관리' },
      { id: 'faq', label: '자주묻는질문' },
      { id: 'notice', label: '공지사항' },
      { id: 'contact', label: '문의하기' },
      { id: 'gallery', label: '미디어 자료' },
      { id: 'about', label: '소개페이지' }
    ];

    function getSolutionLabel(id) {
      for (var i = 0; i < _solutionItems.length; i++) {
        if (_solutionItems[i].id === id) return _solutionItems[i].label;
      }
      return id || '솔루션';
    }

    /* ── 서브메뉴 항목 추출 헬퍼 (sets 구조 + rows 구조 둘 다 지원) ── */
    function getSubItems(detail, menuIdx) {
      var items = [];
      // 1) sets 구조: [{name, rows, type, solution}, ...]
      if (Array.isArray(detail.sets) && detail.sets.length) {
        detail.sets.forEach(function (s, si) {
          if (s.type === 'solution' && s.solution) {
            var solLabel = s.name || getSolutionLabel(s.solution);
            items.push({
              name: solLabel,
              url: '#submenu-' + menuIdx + '-' + si,
              blank: false,
              isSolution: true,
              solutionId: s.solution
            });
          } else {
            // 이미지형: 서브메뉴 페이지로 라우팅 (이미지가 있으면 페이지 표시, 없으면 URL 동작)
            var hasImages = s.rows && s.rows.length > 0 && s.rows.some(function (r) { return r.imgH || r.imgV; });
            var subUrl = hasImages
              ? '#submenu-' + menuIdx + '-' + si
              : (s.rows && s.rows[0] && s.rows[0].url) || '#';
            items.push({
              name: s.name || '서브메뉴',
              url: subUrl,
              blank: (!hasImages && s.rows && s.rows[0] && s.rows[0].blank) || false
            });
          }
        });
      }
      // 2) rows 구조: [{desc, url, blank, imgH, imgV}, ...]
      else if (Array.isArray(detail.rows) && detail.rows.length) {
        detail.rows.forEach(function (r) {
          items.push({ name: r.desc || r.name || (r.url || '서브메뉴'), url: r.url || '#', blank: r.blank || false });
        });
      }
      return items;
    }

    /* ── 메가메뉴 전체 데이터 준비 ── */
    var megaData = [];
    var hasMega = false;
    menus.forEach(function (name, i) {
      var detail = menuDetails[i] || {};
      var subs = getSubItems(detail, i);
      megaData.push({ name: name, detail: detail, subs: subs });
      if (subs.length > 0) hasMega = true;
    });

    if (navEl) {
      navEl.style.justifyContent = jc;
      navEl.style.gap = (settings.gap || 28) + 'px';
      navEl.innerHTML = '';

      menus.forEach(function (name, i) {
        var detail = menuDetails[i] || {};
        var href = detail.url || '#';

        var a = document.createElement('a');
        a.href = escAttr(href);
        if (detail.blank) a.target = '_blank';
        a.style.cssText = 'font-size:' + (settings.fs || 15) + 'px;color:' + (settings.fc || '#1a1a2e') + ';position:relative;font-weight:' + (settings.fw || 600) + ';padding:6px 2px;transition:opacity .2s';
        a.textContent = name;
        a.setAttribute('data-menu-idx', i);
        navEl.appendChild(a);
      });

      /* ── 풀 너비 메가메뉴 패널 (헤더 아래에 고정) ── */
      if (hasMega) {
        var megaPanel = document.getElementById('hpMegaMenu');
        if (!megaPanel) {
          megaPanel = document.createElement('div');
          megaPanel.id = 'hpMegaMenu';
          megaPanel.className = 'hp-mega-menu';
          document.body.appendChild(megaPanel);
        }

        // 메가메뉴 배경 = 헤더 배경색과 동일
        megaPanel.style.cssText = 'position:fixed;left:0;width:100%;background:' + bgColor + ';backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:89;opacity:0;visibility:hidden;transition:opacity .25s ease,transform .25s ease;transform:translateY(-8px);pointer-events:none;border-top:1px solid rgba(128,128,128,.1);box-shadow:0 12px 40px rgba(0,0,0,.2)';

        // top 위치 계산 (리벳 높이 + 헤더 높이)
        var rivetEl = document.getElementById('hpRivet');
        var rivetH = (rivetEl && rivetEl.style.display !== 'none') ? (rivetEl.offsetHeight || 0) : 0;
        megaPanel.style.top = (rivetH + (parseInt(settings.h) || 64)) + 'px';

        // 메가메뉴 컨텐츠 컨테이너
        var megaInner = document.createElement('div');
        megaInner.style.cssText = 'position:relative;padding:14px 0 18px;min-height:20px';

        var maxBottom = 0;

        megaData.forEach(function (md, idx) {
          if (md.subs.length === 0) return;

          var col = document.createElement('div');
          col.setAttribute('data-col-idx', idx);
          col.style.cssText = 'position:absolute;top:14px;left:0;text-align:left';

          md.subs.forEach(function (sub) {
            var subLink = document.createElement('a');
            subLink.href = escAttr(sub.url);
            if (sub.blank) subLink.target = '_blank';
            subLink.style.cssText = 'display:block;padding:5px 0;font-size:' + Math.max(parseInt(settings.fs || 15) - 2, 12) + 'px;color:' + (settings.fc || '#1a1a2e') + ';font-weight:400;opacity:.7;transition:opacity .15s,padding-left .15s;text-decoration:none;white-space:nowrap';
            subLink.textContent = sub.name;
            subLink.onmouseover = function () { this.style.opacity = '1'; this.style.paddingLeft = '6px'; };
            subLink.onmouseout = function () { this.style.opacity = '.7'; this.style.paddingLeft = '0'; };
            col.appendChild(subLink);
          });

          megaInner.appendChild(col);
          maxBottom = Math.max(maxBottom, md.subs.length);
        });

        megaInner.style.minHeight = (maxBottom * 30 + 32) + 'px';
        megaPanel.innerHTML = '';
        megaPanel.appendChild(megaInner);

        /* ── 컬럼 위치 재계산 (열릴 때마다 최신 좌표) ── */
        function updateMegaPositions() {
          var cols = megaInner.querySelectorAll('[data-col-idx]');
          var currentNavLinks = navEl.querySelectorAll('a');
          cols.forEach(function (c) {
            var ci = parseInt(c.getAttribute('data-col-idx'));
            var nl = currentNavLinks[ci];
            if (nl) {
              var r = nl.getBoundingClientRect();
              // 메인메뉴 텍스트 시작점과 정확히 맞춤
              c.style.left = r.left + 'px';
            }
          });
        }

        /* 메뉴 호버 시 메가메뉴 표시 */
        var megaTimer = null;

        function showMega() {
          clearTimeout(megaTimer);
          updateMegaPositions();
          megaPanel.style.opacity = '1';
          megaPanel.style.visibility = 'visible';
          megaPanel.style.transform = 'translateY(0)';
          megaPanel.style.pointerEvents = 'auto';
        }

        function hideMega() {
          megaTimer = setTimeout(function () {
            megaPanel.style.opacity = '0';
            megaPanel.style.visibility = 'hidden';
            megaPanel.style.transform = 'translateY(-8px)';
            megaPanel.style.pointerEvents = 'none';
          }, 150);
        }

        // 메뉴 링크 호버
        navEl.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('mouseenter', showMega);
          a.addEventListener('mouseleave', hideMega);
        });

        // 메가메뉴 패널 호버
        megaPanel.addEventListener('mouseenter', showMega);
        megaPanel.addEventListener('mouseleave', hideMega);
      }
    }

    // 모바일 메뉴 (서브메뉴 포함)
    var drawer = document.getElementById('hpMobileDrawer');
    if (drawer) {
      drawer.innerHTML = '';
      menus.forEach(function (name, i) {
        var detail = menuDetails[i] || {};
        var href = detail.url || '#';
        var subs = getSubItems(detail, i);

        var mainLink = document.createElement('a');
        mainLink.href = escAttr(href);
        if (detail.blank) mainLink.target = '_blank';
        mainLink.textContent = name;
        drawer.appendChild(mainLink);

        /* 서브메뉴 표시 */
        if (subs.length > 0) {
          subs.forEach(function (sub) {
            var subLink = document.createElement('a');
            subLink.href = escAttr(sub.url);
            if (sub.blank) subLink.target = '_blank';
            subLink.style.cssText = 'padding-left:24px;font-size:14px;font-weight:400;opacity:.7';
            subLink.textContent = sub.name;
            drawer.appendChild(subLink);
          });
        }
      });
    }

    var mobileBtn = document.getElementById('hpMobileBtn');
    if (mobileBtn) mobileBtn.style.color = settings.fc || '#1a1a2e';

    updateLayout();
  }

  /* ══════════════════════════
     3. 메인 컨텐츠
  ══════════════════════════ */
  function renderMainContent() {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;

    var mcData = getLS('hp_mc_data', []);
    if (!mcData || !mcData.length) {
      wrap.innerHTML = renderHero();
      setTimeout(observeNewElements, 50);
      return;
    }

    var html = '';
    mcData.forEach(function (line) {
      if ((line.type || 'image') === 'image') {
        html += renderImageLine(line);
      } else {
        html += renderSolutionLine(line);
      }
    });

    if (!html.trim()) {
      html = renderHero();
    }

    wrap.innerHTML = html;
    setTimeout(function () { observeNewElements(); initIcons(); }, 50);
  }

  function renderHero() {
    var hqInfo = getLS('ws_hq_info');
    var companyName = (hqInfo && hqInfo.name) ? hqInfo.name : 'WorkM';
    return '<div class="hp-hero">' +
      '<div class="hp-hero-content fade-in-up">' +
      '<h1>' + escHtml(companyName) + '</h1>' +
      '<p>고객과 함께 성장하는 최고의 파트너</p>' +
      '</div></div>';
  }

  function renderImageLine(line) {
    if (!line.items || !line.items.length) return '';
    var count = line.items.length;
    var colClass = 'cols-' + Math.min(count, 4);

    var html = '<div class="hp-content-line fade-in-up">' +
      '<div class="line-grid ' + colClass + '">';

    line.items.forEach(function (item) {
      var imgSrc = item.imgH || item.imgV || '';
      if (!imgSrc) return;

      html += '<div class="hp-content-item">';
      if (item.url) html += '<a href="' + escAttr(item.url) + '" target="_blank">';
      html += '<img src="' + escAttr(imgSrc) + '" alt="' + escAttr(item.desc || '') + '" loading="lazy">';
      if (item.desc) {
        html += '<div class="item-overlay"><div class="item-desc">' + escHtml(item.desc) + '</div></div>';
      }
      if (item.url) html += '</a>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function renderSolutionLine(line) {
    var sol = line.solution || '';
    if (!sol) return '';

    return '<div class="hp-solution-line fade-in-up">' +
      '<div class="solution-title">' + escHtml(sol) + '</div>' +
      '<div class="hp-solution-grid">' +
      '<div class="hp-solution-card">' +
      '<div class="sol-icon"><i data-lucide="check-circle"></i></div>' +
      '<div class="sol-name">' + escHtml(sol) + '</div></div>' +
      '</div></div>';
  }

  /* ══════════════════════════
     4. 푸터 영역
  ══════════════════════════ */
  function renderFooter() {
    renderFooterLogo();
    renderFooterMenu();
    renderFooterText();
    renderCopyright();
  }

  function renderFooterLogo() {
    var el = document.getElementById('hpFooterLogo');
    if (!el) return;
    var data = getLS('hp_footer_logobox');
    var bg = '#1a1a2e', h = 120, op = 100;
    if (data) {
      bg = data.bgColor || bg;
      h = data.height || h;
      op = data.opacity || op;
    }
    el.style.background = bg;
    el.style.minHeight = h + 'px';
    el.style.opacity = (parseInt(op) / 100).toFixed(2);

    var botH = getLSRaw('hp_logo_bot_h') || getLSRaw('hp_logo_hp_logo_bot_h');
    var botV = getLSRaw('hp_logo_bot_v') || getLSRaw('hp_logo_hp_logo_bot_v');

    var inner = '';
    if (botH) inner += '<img src="' + botH + '" alt="Logo" style="max-height:' + Math.round(h * 0.6) + 'px">';
    if (botV) inner += '<img src="' + botV + '" alt="Logo" style="max-height:' + Math.round(h * 0.7) + 'px">';
    if (!inner) {
      inner = '<span style="font-size:28px;font-weight:900;color:rgba(255,255,255,0.2);letter-spacing:2px">WORKM</span>';
    }
    el.innerHTML = inner;
  }

  function renderFooterMenu() {
    var el = document.getElementById('hpFooterMenu');
    if (!el) return;
    var data = getLS('hp_footer_menu');
    if (!data || !data.menus || !data.menus.length) { el.style.display = 'none'; return; }

    el.style.display = 'flex';
    el.style.background = data.bgColor || '#0f172a';
    el.style.minHeight = (data.height || 56) + 'px';
    el.style.opacity = (parseInt(data.opacity || 100) / 100).toFixed(2);

    var jc = { left: 'flex-start', center: 'center', right: 'flex-end' }[data.align] || 'center';
    el.style.justifyContent = jc;
    el.style.gap = (data.gap || 24) + 'px';

    el.innerHTML = data.menus.map(function (name) {
      return '<a href="#" style="font-size:' + (data.fontSize || 13) + 'px;color:' + (data.fontColor || '#94a3b8') + '">' + escHtml(name) + '</a>';
    }).join('');
  }

  function renderFooterText() {
    var el = document.getElementById('hpFooterText');
    if (!el) return;
    var data = getLS('hp_footer_text');
    var d = { bgColor: '#0a0a1a', fontColor: '#64748b', fontSize: 12, height: 80, opacity: 100, align: 'center', text: '' };
    if (data) Object.keys(data).forEach(function (k) { d[k] = data[k]; });

    el.style.background = d.bgColor;
    el.style.minHeight = d.height + 'px';
    el.style.opacity = (parseInt(d.opacity) / 100).toFixed(2);
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[d.align] || 'center';

    var content = el.querySelector('.hp-footer-text-content');
    if (content) {
      content.style.fontSize = d.fontSize + 'px';
      content.style.color = d.fontColor;
      content.style.textAlign = d.align || 'center';

      var text = d.text || '';
      if (!text.trim()) {
        var hq = getLS('ws_hq_info');
        if (hq) {
          var parts = [];
          if (hq.name) parts.push(hq.name);
          if (hq.address) parts.push('주소: ' + hq.address);
          if (hq.phone) parts.push('TEL: ' + hq.phone);
          if (hq.fax) parts.push('FAX: ' + hq.fax);
          if (hq.email) parts.push('E-mail: ' + hq.email);
          text = parts.join('  |  ');
        } else {
          text = '© ' + new Date().getFullYear() + ' 워크엠. All rights reserved.';
        }
      }
      content.textContent = text;
    }
  }

  function renderCopyright() {
    var el = document.getElementById('hpCopyright');
    if (!el) return;
    var data = getLS('hp_copyright');
    var d = { bgColor: '#050510', fontColor: '#475569', fontSize: 11, height: 48, opacity: 100, align: 'center', text: '' };
    if (data) Object.keys(data).forEach(function (k) { d[k] = data[k]; });

    el.style.background = d.bgColor;
    el.style.minHeight = d.height + 'px';
    el.style.opacity = (parseInt(d.opacity) / 100).toFixed(2);
    el.style.justifyContent = { left: 'flex-start', center: 'center', right: 'flex-end' }[d.align] || 'center';

    var content = el.querySelector('.hp-copyright-content');
    if (content) {
      content.style.fontSize = d.fontSize + 'px';
      content.style.color = d.fontColor;
      content.style.textAlign = d.align || 'center';
      content.textContent = d.text || '© ' + new Date().getFullYear() + ' 워크엠(WorkM). All rights reserved.';
    }
  }

  /* ══════════════════════════
     레이아웃 업데이트 (리벳+헤더 위치 계산)
     헤더 배경 투명도 < 100%이면 메인컨텐츠가 헤더 뒤로 비침
  ══════════════════════════ */
  function updateLayout() {
    var rivetEl = document.getElementById('hpRivet');
    var headerEl = document.getElementById('hpHeader');
    var mainEl = document.getElementById('hpMainContent');
    if (!headerEl) return;

    // 리벳 높이 계산 (리벳 표시 여부)
    var rivetH = 0;
    if (rivetEl && rivetEl.style.display !== 'none') {
      rivetH = rivetEl.offsetHeight || 0;
    }

    // 헤더 top 위치 = 리벳 높이 아래
    headerEl.style.top = rivetH + 'px';

    // 메인 컨텐츠: 항상 페이지 최상단부터 (헤더 뒤로 비침)
    // 투명도가 있으면 컨텐츠가 보이고, 불투명이면 가려짐
    if (mainEl) {
      mainEl.style.marginTop = '0';
    }
  }

  /* ══════════════════════════
     유틸리티
  ══════════════════════════ */
  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hexToRgb(hex) {
    if (!hex || hex.charAt(0) !== '#') return null;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return isNaN(r) ? null : { r: r, g: g, b: b };
  }

  /* ══════════════════════════
     모바일 메뉴
  ══════════════════════════ */
  function initMobileMenu() {
    var btn = document.getElementById('hpMobileBtn');
    var drawer = document.getElementById('hpMobileDrawer');
    var overlay = document.getElementById('hpMobileOverlay');
    if (!btn || !drawer) return;

    function toggle() {
      var isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        btn.classList.remove('active');
        if (overlay) { overlay.classList.remove('show'); setTimeout(function () { overlay.style.display = 'none'; }, 300); }
      } else {
        drawer.classList.add('open');
        btn.classList.add('active');
        if (overlay) { overlay.style.display = 'block'; setTimeout(function () { overlay.classList.add('show'); }, 10); }
      }
    }

    btn.addEventListener('click', toggle);
    if (overlay) overlay.addEventListener('click', toggle);
  }

  /* ══════════════════════════
     스크롤 효과
  ══════════════════════════ */
  function initScrollEffects() {
    var header = document.getElementById('hpHeader');

    window.addEventListener('scroll', function () {
      if (header) {
        if (window.scrollY > 20) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      }
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.fade-in-up').forEach(function (el) {
        observer.observe(el);
      });

      window._hpObserver = observer;
    }
  }

  function observeNewElements() {
    if (!window._hpObserver) return;
    document.querySelectorAll('.fade-in-up:not(.visible)').forEach(function (el) {
      window._hpObserver.observe(el);
    });
  }

  /* ══════════════════════════
     로딩 / 아이콘
  ══════════════════════════ */
  function hideLoading() {
    var loader = document.getElementById('hpLoading');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(function () { loader.remove(); }, 500);
    }
  }

  function initIcons() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }

  /* ══════════════════════════
     솔루션 페이지 렌더링
  ══════════════════════════ */
  var _solutionItemsForPage = [
    { id: 'terms',     label: '이용약관',        icon: 'scroll-text',     desc: '서비스 이용에 관한 약관 정보를 확인하세요.' },
    { id: 'privacy',   label: '개인정보 취급방침', icon: 'shield-check',    desc: '개인정보 보호 및 처리에 관한 방침입니다.' },
    { id: 'content',   label: '컨텐츠관리',       icon: 'layout-panel-left', desc: '다양한 컨텐츠를 관리하고 배포합니다.' },
    { id: 'gallery',   label: '미디어 자료',          icon: 'image',           desc: '사진과 미디어 자료를 감상하세요.' },
    { id: 'board',     label: '게시판',           icon: 'message-square',  desc: '커뮤니티 게시판에서 소통하세요.' },
    { id: 'notice',    label: '공지사항',          icon: 'bell',            desc: '최신 공지사항과 업데이트 소식입니다.' },
    { id: 'news',      label: '뉴스',             icon: 'newspaper',       desc: '최신 뉴스와 소식을 확인하세요.' },
    { id: 'qna',       label: 'Q&A',              icon: 'help-circle',     desc: '궁금한 사항을 질문하고 답변을 받으세요.' },
    { id: 'faq',       label: 'FAQ',              icon: 'clipboard-list',  desc: '자주 묻는 질문과 답변을 확인하세요.' },
    { id: 'franchise', label: '가맹점 신청',       icon: 'store',           desc: '가맹점 신청 및 문의를 접수합니다.' }
  ];

  function getSolPageInfo(id) {
    for (var i = 0; i < _solutionItemsForPage.length; i++) {
      if (_solutionItemsForPage[i].id === id) return _solutionItemsForPage[i];
    }
    return { id: id, label: id, icon: 'layout', desc: '' };
  }

  /* ── 게시판 카테고리 매핑 ── */
  var _boardCatMap = {
    board:     { label: '게시판',      icon: 'message-square', color: '#6366f1', cat: null       },
    notice:    { label: '공지사항',    icon: 'bell',           color: '#ef4444', cat: 'notice'   },
    news:      { label: '뉴스',        icon: 'newspaper',      color: '#4f6ef7', cat: 'news'     },
    qna:       { label: 'Q&A',         icon: 'help-circle',    color: '#8b5cf6', cat: 'qna'      },
    faq:       { label: 'FAQ',         icon: 'clipboard-list', color: '#06b6d4', cat: 'faq'      },
    franchise: { label: '가맹점 신청', icon: 'store',          color: '#ec4899', cat: 'franchise'}
  };

  function renderBoardPage(solutionId) {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var bInfo = _boardCatMap[solutionId];
    var catFilter = bInfo.cat;
    var items = [];
    try { items = JSON.parse(localStorage.getItem('board_items') || 'null') || []; }
    catch(e) { items = []; }
    if (catFilter) items = items.filter(function(i){ return i.cat === catFilter; });

    /* ── CSS 주입 (중복 방지) ── */
    if (document.getElementById('hp-board-style')) {
      document.getElementById('hp-board-style').remove();
    }
    var st = document.createElement('style');
    st.id = 'hp-board-style';
    st.textContent =
      '.hp-bd-page{max-width:960px;margin:0 auto;padding:80px 20px 48px}' +
      '.hp-bd-title-box{display:flex;align-items:center;gap:14px;margin-bottom:32px;' +
      '  padding:22px 28px;border-radius:18px;box-shadow:0 6px 28px rgba(0,0,0,.3)}' +
      '.hp-bd-title-icon{width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,.18);' +
      '  display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
      '.hp-bd-title-icon svg,.hp-bd-title-icon i{width:26px;height:26px;color:#fff}' +
      '.hp-bd-h1{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.4px}' +
      '.hp-bd-sub{font-size:12px;color:rgba(255,255,255,.7);margin:0}' +
      '.hp-bd-wrap{border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;' +
      '  background:rgba(20,22,30,.85);backdrop-filter:blur(8px);box-shadow:0 4px 24px rgba(0,0,0,.35)}' +
      '.hp-bd-col-hdr{display:grid;grid-template-columns:54px 1fr 72px 96px 54px 28px;' +
      '  padding:10px 20px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.08);' +
      '  font-size:11px;font-weight:700;color:rgba(255,255,255,.45);letter-spacing:.5px}' +
      '.hp-bd-row{border-bottom:1px solid rgba(255,255,255,.05)}' +
      '.hp-bd-row:last-child{border-bottom:none}' +
      '.hp-bd-hdr{display:grid;grid-template-columns:54px 1fr 72px 96px 54px 28px;' +
      '  padding:14px 20px;align-items:center;cursor:pointer;transition:background .15s;user-select:none}' +
      '.hp-bd-hdr:hover{background:rgba(255,255,255,.04)}' +
      '.hp-bd-hdr.hp-open{background:rgba(99,102,241,.1)}' +
      '.hp-bd-num{font-size:13px;font-weight:800;text-align:center}' +
      '.hp-bd-ttl{font-size:14px;font-weight:600;color:rgba(255,255,255,.9);overflow:hidden;' +
      '  text-overflow:ellipsis;white-space:nowrap;padding-right:12px}' +
      '.hp-bd-mt{text-align:center;font-size:12px;color:rgba(255,255,255,.4);white-space:nowrap}' +
      '.hp-bd-chev{transition:transform .25s;color:rgba(255,255,255,.25);font-size:12px;text-align:center;line-height:1}' +
      '.hp-bd-hdr.hp-open .hp-bd-chev{transform:rotate(180deg);color:#818cf8}' +
      '.hp-bd-body{max-height:0;overflow:hidden;transition:max-height .32s cubic-bezier(.4,0,.2,1),opacity .22s;' +
      '  opacity:0;background:rgba(99,102,241,.06)}' +
      '.hp-bd-body.hp-open{max-height:700px;opacity:1;border-top:1px solid rgba(99,102,241,.18)}' +
      '.hp-bd-inner{padding:20px 24px 24px}' +
      '.hp-bd-label{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px}' +
      '.hp-bd-content-title{font-size:16px;font-weight:800;color:rgba(255,255,255,.92);' +
      '  margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.08);line-height:1.4}' +
      '.hp-bd-content-body{margin:0;font-size:14px;color:rgba(255,255,255,.7);line-height:1.95;white-space:pre-wrap}' +
      '.hp-bd-footer{margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);' +
      '  display:flex;gap:18px;font-size:12px;color:rgba(255,255,255,.35)}' +
      '.hp-bd-empty{text-align:center;padding:80px 20px;color:rgba(255,255,255,.3)}';
    document.head.appendChild(st);

    /* ── 타이틀 배경 그라디언트 ── */
    var grad = 'linear-gradient(120deg,' + bInfo.color + 'ee 0%,' + bInfo.color + '77 100%)';
    var html = '<div class="hp-bd-page">';

    html +=
      '<div class="hp-bd-title-box" style="background:' + grad + '">' +
      '<div class="hp-bd-title-icon">' +
      '<i data-lucide="' + bInfo.icon + '"></i>' +
      '</div>' +
      '<div>' +
      '<h1 class="hp-bd-h1">' + escHtml(bInfo.label) + '</h1>' +
      '<p class="hp-bd-sub">총 ' + items.length + '건</p>' +
      '</div></div>';

    if (!items.length) {
      html +=
        '<div class="hp-bd-empty">' +
        '<i data-lucide="' + bInfo.icon + '" style="width:52px;height:52px;opacity:.15;display:block;margin:0 auto 16px"></i>' +
        '<p style="font-size:15px;font-weight:600">등록된 ' + escHtml(bInfo.label) + ' 게시글이 없습니다.</p>' +
        '</div>';
    } else {
      html += '<div class="hp-bd-wrap">';
      html +=
        '<div class="hp-bd-col-hdr">' +
        '<span style="text-align:center">번호</span>' +
        '<span>제목</span>' +
        '<span style="text-align:center">작성자</span>' +
        '<span style="text-align:center">날짜</span>' +
        '<span style="text-align:center">조회</span>' +
        '<span></span>' +
        '</div>';

      items.forEach(function(it, idx) {
        /* 역순 번호: 가장 위 항목이 가장 큰 번호 */
        var num = items.length - idx;
        html +=
          '<div class="hp-bd-row">' +
          '<div class="hp-bd-hdr">' +
          '<span class="hp-bd-num" style="color:' + bInfo.color + '">' + num + '</span>' +
          '<span class="hp-bd-ttl">' + escHtml(it.title) + '</span>' +
          '<span class="hp-bd-mt">' + escHtml(it.author || '-') + '</span>' +
          '<span class="hp-bd-mt">' + escHtml(it.regDate || '') + '</span>' +
          '<span class="hp-bd-mt">' + (it.views || 0) + '</span>' +
          '<span class="hp-bd-chev">&#9660;</span>' +
          '</div>' +
          '<div class="hp-bd-body">' +
          '<div class="hp-bd-inner">' +
          '<div class="hp-bd-label" style="color:' + bInfo.color + '">' + escHtml(bInfo.label) + '</div>' +
          '<div class="hp-bd-content-title">' + escHtml(it.title) + '</div>' +
          '<p class="hp-bd-content-body">' + escHtml(it.content || '내용이 없습니다.') + '</p>' +
          '<div class="hp-bd-footer">' +
          '<span>&#9998; ' + escHtml(it.author || '-') + '</span>' +
          '<span>&#128197; ' + escHtml(it.regDate || '') + '</span>' +
          '<span>&#128065; ' + (it.views || 0) + '</span>' +
          '</div></div></div>' +
          '</div>';
      });

      html += '</div>'; /* .hp-bd-wrap */
    }
    html += '</div>'; /* .hp-bd-page */

    wrap.innerHTML = html;

    /* ── 아코디언 이벤트: innerHTML 후 addEventListener 연결 ── */
    wrap.querySelectorAll('.hp-bd-hdr').forEach(function(hdr) {
      hdr.addEventListener('click', function() {
        var body = hdr.nextElementSibling;
        var isOpen = body.classList.contains('hp-open');
        wrap.querySelectorAll('.hp-bd-body').forEach(function(b) { b.classList.remove('hp-open'); });
        wrap.querySelectorAll('.hp-bd-hdr').forEach(function(h) { h.classList.remove('hp-open'); });
        if (!isOpen) {
          body.classList.add('hp-open');
          hdr.classList.add('hp-open');
        }
      });
    });

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }

  function _getBoardSample() { return []; }


  function renderGalleryPage() {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;

    /* med_items 로드 */
    var items = [];
    try { items = JSON.parse(localStorage.getItem('med_items') || 'null') || []; }
    catch(e) { items = []; }

    /* CSS 주입 */
    if (document.getElementById('hp-gallery-style')) document.getElementById('hp-gallery-style').remove();
    var st = document.createElement('style');
    st.id = 'hp-gallery-style';
    st.textContent =
      '.hp-gal-page{max-width:1200px;margin:0 auto;padding:80px 20px 48px}' +
      '.hp-gal-title-box{display:flex;align-items:center;gap:14px;margin-bottom:36px;' +
      '  padding:22px 28px;border-radius:18px;background:linear-gradient(120deg,#7c3aedcc,#4f46e588);' +
      '  box-shadow:0 6px 28px rgba(79,70,229,.4)}' +
      '.hp-gal-h1{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.4px}' +
      '.hp-gal-sub{font-size:12px;color:rgba(255,255,255,.7);margin:0}' +
      '.hp-gal-grid{columns:3;column-gap:14px}' +
      '@media(max-width:800px){.hp-gal-grid{columns:2}}' +
      '@media(max-width:500px){.hp-gal-grid{columns:1}}' +
      '.hp-gal-item{break-inside:avoid;margin-bottom:14px;border-radius:12px;overflow:hidden;' +
      '  position:relative;cursor:pointer;background:#1e2033;' +
      '  box-shadow:0 2px 10px rgba(0,0,0,.4);transition:transform .2s,box-shadow .2s}' +
      '.hp-gal-item:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.5)}' +
      '.hp-gal-item img{width:100%;display:block;object-fit:cover}' +
      '.hp-gal-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 55%);' +
      '  opacity:0;transition:opacity .22s;display:flex;flex-direction:column;justify-content:flex-end;padding:14px}' +
      '.hp-gal-item:hover .hp-gal-overlay{opacity:1}' +
      '.hp-gal-ttl{font-size:13px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.3}' +
      '.hp-gal-tags{display:flex;flex-wrap:wrap;gap:4px}' +
      '.hp-gal-tag{font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.8)}' +
      '.hp-gal-lb{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);' +
      '  display:flex;align-items:center;justify-content:center;animation:lbFadeIn .15s ease}' +
      '@keyframes lbFadeIn{from{opacity:0}to{opacity:1}}' +
      '.hp-gal-lb-inner{max-width:90vw;max-height:90vh;position:relative}' +
      '.hp-gal-lb-inner img{max-width:90vw;max-height:80vh;border-radius:12px;box-shadow:0 8px 48px rgba(0,0,0,.6)}' +
      '.hp-gal-lb-close{position:absolute;top:-16px;right:-16px;width:36px;height:36px;border-radius:50%;' +
      '  background:#fff2;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:36px;text-align:center}' +
      '.hp-gal-lb-info{margin-top:14px;text-align:center;color:rgba(255,255,255,.8);font-size:14px;font-weight:600}' +
      '.hp-gal-empty{text-align:center;padding:80px 20px;color:rgba(255,255,255,.3)}' +
      '.hp-gal-search-wrap{margin-bottom:24px;position:relative}' +
      '.hp-gal-search{width:100%;padding:12px 16px 12px 42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);' +
      '  background:rgba(255,255,255,.06);color:#fff;font-size:14px;outline:none;transition:border .2s,background .2s}' +
      '.hp-gal-search:focus{border-color:rgba(124,58,237,.6);background:rgba(124,58,237,.08)}' +
      '.hp-gal-search::placeholder{color:rgba(255,255,255,.3)}' +
      '.hp-gal-search-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);' +
      '  width:17px;height:17px;color:rgba(255,255,255,.3);pointer-events:none}';
    document.head.appendChild(st);

    var html = '<div class="hp-gal-page">';
    html +=
      '<div class="hp-gal-title-box">' +
      '<div style="width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,.18);' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
      '<i data-lucide="image" style="width:26px;height:26px;color:#fff"></i></div>' +
      '<div>' +
      '<h1 class="hp-gal-h1">미디어 자료</h1>' +
      '<p class="hp-gal-sub">총 ' + items.length + '건</p>' +
      '</div></div>';

    /* 검색창 */
    html += '<div class="hp-gal-search-wrap">' +
      '<svg class="hp-gal-search-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input class="hp-gal-search" id="galSearchInp" type="text" placeholder="제목 또는 태그 검색...">' +
      '</div>';

    if (!items.length) {
      html += '<div class="hp-gal-empty"><p style="font-size:15px;font-weight:600">등록된 미디어 자료가 없습니다.</p></div>';
    } else {
      html += '<div class="hp-gal-grid">';
      items.forEach(function(it, idx) {
        var tags = (it.tags || []).map(function(t) {
          return '<span class="hp-gal-tag">' + escHtml(t) + '</span>';
        }).join('');
        html +=
          '<div class="hp-gal-item" data-gal-idx="' + idx + '">' +
          (it.dataUrl
            ? '<img src="' + it.dataUrl + '" alt="' + escHtml(it.title) + '" loading="lazy">'
            : '<div style="padding-top:62%;background:#2a2d4a"></div>') +
          '<div class="hp-gal-overlay">' +
          '<div class="hp-gal-ttl">' + escHtml(it.title) + '</div>' +
          '<div class="hp-gal-tags">' + tags + '</div>' +
          '</div></div>';
      });
      html += '</div>';
    }
    html += '</div>';

    wrap.innerHTML = html;

    /* 검색 이벤트 */
    var searchInp = wrap.querySelector('#galSearchInp');
    if (searchInp) {
      searchInp.addEventListener('input', function() {
        var q = this.value.toLowerCase().trim();
        wrap.querySelectorAll('.hp-gal-item').forEach(function(el) {
          var idx2 = parseInt(el.dataset.galIdx);
          var it2 = items[idx2];
          var match = !q ||
            (it2.title || '').toLowerCase().includes(q) ||
            (it2.tags || []).some(function(t){ return t.toLowerCase().includes(q); }) ||
            (it2.desc || '').toLowerCase().includes(q);
          el.style.display = match ? '' : 'none';
        });
      });
    }

    /* 라이트박스 이벤트 */
    wrap.querySelectorAll('.hp-gal-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.dataset.galIdx);
        var it = items[idx];
        if (!it || !it.dataUrl) return;
        var lb = document.createElement('div');
        lb.className = 'hp-gal-lb';
        lb.innerHTML =
          '<div class="hp-gal-lb-inner">' +
          '<button class="hp-gal-lb-close">✕</button>' +
          '<img src="' + it.dataUrl + '" alt="' + escHtml(it.title) + '">' +
          '<div class="hp-gal-lb-info">' + escHtml(it.title) + '</div>' +
          '</div>';
        document.body.appendChild(lb);
        lb.querySelector('.hp-gal-lb-close').addEventListener('click', function() { lb.remove(); });
        lb.addEventListener('click', function(e) { if (e.target === lb) lb.remove(); });
      });
    });

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function() { observeNewElements(); initIcons(); }, 50);
  }

  function renderSolutionPage(solutionId) {
    /* 게시판 관련 솔루션이면 게시판 뷰로 분기 */
    if (_boardCatMap[solutionId]) { renderBoardPage(solutionId); return; }
    /* 미디어 자료 솔루션 */
    if (solutionId === 'gallery') { renderGalleryPage(); return; }


    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var sol = getSolPageInfo(solutionId);
    var html = '<div class="hp-solution-page fade-in-up">' +
      '<div class="hp-solution-page-inner">' +
      '<div class="hp-sol-header">' +
      '<div class="hp-sol-icon-wrap"><i data-lucide="' + sol.icon + '"></i></div>' +
      '<h1>' + escHtml(sol.label) + '</h1>' +
      '<p>' + escHtml(sol.desc) + '</p>' +
      '</div><div class="hp-sol-body"><div class="hp-sol-placeholder">' +
      '<i data-lucide="' + sol.icon + '" style="width:48px;height:48px;opacity:.2"></i>' +
      '<p>이 영역에 <strong>' + escHtml(sol.label) + '</strong> 컨텐츠가 표시됩니다.</p>' +
      '</div></div></div></div>';
    wrap.innerHTML = html;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { observeNewElements(); initIcons(); }, 50);
  }


  function renderSubmenuPage(menuIdx, setIdx) {
    var wrap = document.getElementById('hpMainContent');
    if (!wrap) return;
    var menuDetails = getLS('hp_menu_details', {});
    var detail = menuDetails[menuIdx];
    if (!detail || !Array.isArray(detail.sets) || !detail.sets[setIdx]) { renderMainContent(); return; }
    var set = detail.sets[setIdx];
    var subMenuName = set.name || '서브메뉴 ' + (parseInt(setIdx) + 1);
    if (set.type === 'solution' && set.solution) { renderSolutionPage(set.solution); return; }
    var rows = set.rows || [];
    var imgItems = rows.filter(function (r) { return r.imgH || r.imgV; });
    if (!imgItems.length) { renderMainContent(); return; }
    var colCount = Math.min(imgItems.length, 4);
    var html = '<div class="hp-content-line"><div class="line-grid cols-' + colCount + '">';
    imgItems.forEach(function (item) {
      var imgSrc = item.imgH || item.imgV || '';
      var linkUrl = item.url || '';
      var isBlank = item.blank || false;
      html += '<div class="hp-content-item">';
      if (linkUrl) html += '<a href="' + escAttr(linkUrl) + '"' + (isBlank ? ' target="_blank" rel="noopener"' : '') + '>';
      html += '<img src="' + escAttr(imgSrc) + '" alt="' + escAttr(item.desc || subMenuName) + '" loading="lazy">';
      if (item.desc) html += '<div class="item-overlay"><div class="item-desc">' + escHtml(item.desc) + '</div></div>';
      if (linkUrl) html += '</a>';
      html += '</div>';
    });
    html += '</div></div>';
    wrap.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function () { observeNewElements(); initIcons(); }, 50);
  }
  /* 해시 라우팅: #solution-{id} / #submenu-{menuIdx}-{setIdx} 감지 */
  function handleHashRoute() {
    var hash = window.location.hash || '';
    // #submenu-X-Y 라우팅 (이미지형/솔루션형 서브메뉴)
    if (hash.indexOf('#submenu-') === 0) {
      var parts = hash.replace('#submenu-', '').split('-');
      var mi = parseInt(parts[0]);
      var si = parseInt(parts[1]);
      if (!isNaN(mi) && !isNaN(si)) {
        renderSubmenuPage(mi, si);
        return true;
      }
    }
    // #solution-{id} 라우팅 (기존 솔루션 페이지)
    if (hash.indexOf('#solution-') === 0) {
      var solutionId = hash.replace('#solution-', '');
      if (solutionId) {
        renderSolutionPage(solutionId);
        return true;
      }
    }
    return false;
  }

  /* ══════════════════════════
     초기화
  ══════════════════════════ */
  function init() {
    initTheme();
    renderRivet();
    renderHeader();

    // 해시 라우팅: 솔루션 페이지가 있으면 솔루션 표시, 없으면 메인 컨텐츠
    if (!handleHashRoute()) {
      renderMainContent();
    }

    renderFooter();
    initMobileMenu();

    setTimeout(initIcons, 50);
    setTimeout(function () {
      initScrollEffects();
      observeNewElements();
    }, 100);
    setTimeout(hideLoading, 300);
  }

  /* 해시 변경 감지 (뒤로가기 / 메뉴 클릭 시) */
  window.addEventListener('hashchange', function () {
    if (!handleHashRoute()) {
      renderMainContent();
    }
    setTimeout(function () { initIcons(); observeNewElements(); }, 100);
  });

  /* ── DOM Ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── 테마 토글 버튼 이벤트 ── */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('hpThemeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });

  /* ── 관리자 패널에서 설정 변경 시 자동 반영 ── */
  window.addEventListener('storage', function (e) {
    var hpKeys = ['hp_rivet', 'hp_mainmenu', 'hp_menu_settings', 'hp_menu_items',
      'hp_mc_data', 'hp_footer_logobox', 'hp_footer_menu', 'hp_footer_text',
      'hp_copyright', 'hp_logo_top_h', 'hp_logo_top_v', 'hp_logo_bot_h', 'hp_logo_bot_v',
      'hp_menu_details', 'ws_theme', 'ws_hq_info'];
    if (hpKeys.indexOf(e.key) !== -1) {
      init();
    }
  });

})();
