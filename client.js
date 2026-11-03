/** @hualiyexi/attendance-clock — Client half: clock-in/lunch/clock-out countdown chip, hover settings card, lunch-break mode. */
window.__ModuleLoader__.load({
  id: '@hualiyexi/attendance-clock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'attendanceClock';
    // 默认打卡规则：工作日 08:30 前打卡上班，17:30 下班；可在悬浮设置卡中修改。
    const DEFAULT_SETTINGS = {
      startM: 8 * 60 + 30,   // 上班打卡截止（分钟数 0..1439）
      endM: 17 * 60 + 30,    // 下班时间
      lunchOn: false,        // 午休模式开关
      lunchStartM: 12 * 60,  // 午休开始
      lunchEndM: 13 * 60 + 30, // 午休结束
    };
    const RING_MS = 5 * 60 * 1000; // 截止前 5 分钟开始醒目提醒
    const SOON_MS = 1 * 60 * 1000; // 截止前 1 分钟二次提醒

    const TONE_COLOR = {
      brand: 'var(--dsw-alias-brand-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
    };

    const ZH_DICT = {
      morning: '上班倒计时',
      evening: '下班倒计时',
      lunch: '午休倒计时',
      done: '已下班',
      absent: '缺卡',
      rest: '休',
      tipPre: '上班打卡截止 {t}，还剩 {d}，点击打卡',
      tipLate: '已过 {t}，点击补卡',
      tipAbsent: '今天没有打卡记录',
      tipRest: '休息日',
      notify5: '上班打卡截止 {t}，还剩 5 分钟，快打卡！',
      notify1: '上班打卡截止 {t}，还剩 1 分钟，快打卡！',
      notifyLate: '已过 {t}，今天还没打卡',
      notifyLunchEnd: '午休将于 {t} 结束，准备上班！',
      panelTitle: '打卡设置',
      fieldStart: '上班时间',
      fieldEnd: '下班时间',
      fieldLunchStart: '午休开始',
      fieldLunchEnd: '午休结束',
      lunchMode: '午休模式',
      panelHint: '时间修改立即生效，保存在本机浏览器；下班需晚于上班，午休结束需晚于午休开始。',
      close: '关闭',
    };
    const EN_DICT = {
      morning: 'Clock-in countdown',
      evening: 'Clock-out countdown',
      lunch: 'Lunch countdown',
      done: 'Off work',
      absent: 'Missed',
      rest: 'Off',
      tipPre: 'Clock-in deadline {t} — {d} left, click to clock in',
      tipLate: 'Past {t} — click for a late clock-in',
      tipAbsent: 'No clock-in record today',
      tipRest: 'Day off',
      notify5: 'Clock-in closes at {t} — 5 minutes left!',
      notify1: 'Clock-in closes at {t} — 1 minute left!',
      notifyLate: 'Past {t} — no clock-in yet today',
      notifyLunchEnd: 'Lunch ends at {t} — back to work soon!',
      panelTitle: 'Attendance settings',
      fieldStart: 'Clock-in time',
      fieldEnd: 'Clock-out time',
      fieldLunchStart: 'Lunch start',
      fieldLunchEnd: 'Lunch end',
      lunchMode: 'Lunch mode',
      panelHint: 'Changes apply immediately and stay in this browser. Clock-out must be after clock-in; lunch end after lunch start.',
      close: 'Close',
    };
    const DICTS = {
      'zh-CN': ZH_DICT,
      zh: ZH_DICT,
      'zh-Hans': ZH_DICT,
      en: EN_DICT,
      'en-US': EN_DICT,
    };

    const CSS = [
      '@keyframes dsw-att-pulse{0%,100%{opacity:1}50%{opacity:.3}}',
      '@keyframes dsw-att-pop{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}',
      '.dsw-att-pulse{animation:dsw-att-pulse 1s ease-in-out infinite}',
      '.dsw-att-btn{cursor:pointer}',
      '.dsw-att-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsw-att-btn:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
      '.dsw-att-panel{animation:dsw-att-pop .12s ease-out}',
      '.dsw-att-head{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.dsw-att-title{font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsw-att-x{cursor:pointer;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1;padding:2px 5px;border-radius:4px}',
      '.dsw-att-x:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.dsw-att-hr{border:none;border-top:1px solid var(--dsw-alias-border-l1);margin:10px 0 2px}',
      '.dsw-att-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px}',
      '.dsw-att-lab{color:var(--dsw-alias-label-primary)}',
      '.dsw-att-input{font-size:12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:1px 4px;height:22px;outline:none}',
      '.dsw-att-input:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.dsw-att-hint{margin-top:10px;color:var(--dsw-alias-label-secondary);opacity:.8}',
      '.dsw-att-toggle{position:relative;width:28px;height:16px;border-radius:999px;background:var(--dsw-alias-label-secondary);opacity:.4;cursor:pointer;flex:none;transition:background .15s,opacity .15s}',
      '.dsw-att-toggle.on{background:var(--dsw-alias-brand-primary);opacity:1}',
      '.dsw-att-toggle:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
      '.dsw-att-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-overlay);transition:left .15s}',
      '.dsw-att-toggle.on .dsw-att-knob{left:14px}',
    ].join('\n');

    const S = {
      wrap: { position: 'relative', display: 'inline-flex', flex: 'none' },
      chip: {
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: 0,
        margin: 0,
        borderRadius: 999,
        fontSize: 12,
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-secondary)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        flex: 'none',
        background: 'transparent',
        border: 'none',
      },
      chipBtn: { padding: '0 6px' },
      dot: { width: 6, height: 6, borderRadius: '50%', marginRight: 6, flexShrink: 0 },
      label: { marginRight: 5 },
      count: { fontWeight: 600, marginRight: 6 },
      ring: { display: 'block', flexShrink: 0, marginLeft: 7, marginTop: 1 },
      panel: {
        position: 'absolute',
        right: 0,
        bottom: 'calc(100% + 10px)',
        minWidth: 264,
        padding: '10px 12px 11px',
        background: 'var(--dsw-alias-bg-overlay)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 10,
        boxShadow: '0 6px 24px rgba(0,0,0,.22)',
        zIndex: 1000,
        fontSize: 12,
        lineHeight: '20px',
        color: 'var(--dsw-alias-label-primary)',
        textAlign: 'left',
        whiteSpace: 'normal',
      },
      inputTime: { width: 74 },
      inputSel: { width: 56 },
    };

    function pad(n) { return String(n).padStart(2, '0'); }
    function fmtDuration(ms) {
      const total = Math.max(0, Math.round(ms / 1000));
      const hh = Math.floor(total / 3600);
      const mm = Math.floor((total % 3600) / 60);
      const ss = total % 60;
      return hh + ':' + pad(mm) + ':' + pad(ss);
    }
    function fmtM(minutes) { return pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60); }
    function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function atTime(d, minutes) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60, 0, 0).getTime();
    }
    function toneOf(ms) {
      if (ms <= SOON_MS) return 'error';
      if (ms <= RING_MS) return 'warn';
      return 'brand';
    }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function isMin(v) { return typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1439 && v === Math.floor(v); }

    const HAS_TIME_INPUT = typeof document !== 'undefined' && (function () {
      try {
        const probe = document.createElement('input');
        probe.type = 'time';
        return probe.type === 'time';
      } catch (err) { return false; }
    })();

    // ---- 设置：localStorage 持久化 ----
    const SS_KEY = 'dsw-att.settings';
    function loadSettings() {
      const s = Object.assign({}, DEFAULT_SETTINGS);
      try {
        const raw = localStorage.getItem(SS_KEY);
        if (raw) {
          const o = JSON.parse(raw);
          if (o && typeof o === 'object') {
            if (isMin(o.startM)) s.startM = o.startM;
            if (isMin(o.endM)) s.endM = o.endM;
            if (typeof o.lunchOn === 'boolean') s.lunchOn = o.lunchOn;
            if (isMin(o.lunchStartM)) s.lunchStartM = o.lunchStartM;
            if (isMin(o.lunchEndM)) s.lunchEndM = o.lunchEndM;
          }
        }
      } catch (err) { /* 损坏即回落默认 */ }
      if (s.endM <= s.startM) { s.startM = DEFAULT_SETTINGS.startM; s.endM = DEFAULT_SETTINGS.endM; }
      if (s.lunchEndM <= s.lunchStartM) { s.lunchStartM = DEFAULT_SETTINGS.lunchStartM; s.lunchEndM = DEFAULT_SETTINGS.lunchEndM; }
      return s;
    }
    function saveSettings(s) {
      try { localStorage.setItem(SS_KEY, JSON.stringify(s)); } catch (err) { /* private mode etc. */ }
    }

    function readClockIn(d) {
      try {
        const v = localStorage.getItem('dsw-att.' + dayKey(d));
        return v ? Number(v) : null;
      } catch (err) { return null; }
    }
    function storeClockIn(d, ms) {
      try { localStorage.setItem('dsw-att.' + dayKey(d), String(ms)); } catch (err) { /* private mode etc. */ }
    }

    function requestNotifPermission() {
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          Notification.requestPermission(function () {});
        }
      } catch (err) { /* unsupported */ }
    }
    function fireNotification(title) {
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification(title, { tag: 'dsw-attendance', silent: false });
          n.onclick = function () { try { window.focus(); } catch (err) { /* ignore */ } };
          setTimeout(function () { try { n.close(); } catch (err) { /* ignore */ } }, 10000);
        }
      } catch (err) { /* unsupported */ }
    }

    /**
     * 当天状态机（时间全部来自设置）：
     * rest | pre(未打卡,上班前) | late(未打卡,已过上班) | working(已打卡)
     *   working 含午休模式下的 working_am(午休前) / lunch(午休中) / working_pm(午休后)
     *   done(已打卡且过下班) | absent(没打卡且过下班)
     * 午休仅在 午休结束 > 午休开始 时生效；跨出上下班区间的午休自动不参与分相位。
     */
    function statusOf(now, s, clockInMs) {
      const day = now.getDay();
      if (day === 0 || day === 6) return { kind: 'rest' };
      const ts = now.getTime();
      const start = atTime(now, s.startM);
      const end = atTime(now, s.endM);
      const lunchValid = s.lunchOn && s.lunchEndM > s.lunchStartM;
      const lStart = lunchValid ? atTime(now, s.lunchStartM) : 0;
      const lEnd = lunchValid ? atTime(now, s.lunchEndM) : 0;

      if (clockInMs) {
        if (ts >= end) return { kind: 'done', progress: 1 };
        // 进度分母：从 min(打卡时刻, 上班) 起算；开启午休时扣除午休时长，
        // 下午阶段进度分子同步扣除，保证下班时圆环恰好走满。
        const breakMs = lunchValid ? Math.max(0, lEnd - lStart) : 0;
        const spanStart = Math.min(clockInMs, start);
        const subtract = lunchValid && ts >= lEnd ? breakMs : 0;
        const span = Math.max(1, end - spanStart - breakMs);
        const progress = clamp01((ts - spanStart - subtract) / span);
        if (lunchValid && ts >= lStart && ts < lEnd) {
          return { kind: 'lunch', remain: lEnd - ts, progress: progress, clockInMs: clockInMs, lunchValid: lunchValid };
        }
        return {
          kind: 'working',
          // 下午阶段剩余时间就是真实的墙钟差（午休已经流逝，不再扣）；只有进度分子扣午休。
          remain: end - ts,
          progress: progress,
          clockInMs: clockInMs,
          lunchValid: lunchValid,
        };
      }
      if (ts < start) return { kind: 'pre', remain: start - ts };
      if (ts < end) return { kind: 'late', remain: 0 };
      return { kind: 'absent' };
    }

    function ringSvg(progress, color) {
      const r = 5;
      const c = 2 * Math.PI * r;
      const p = clamp01(progress);
      return h('svg', {
        width: 13, height: 13, viewBox: '0 0 16 16', style: S.ring, 'aria-hidden': true,
      },
        // 未激活轨道：中性灰降低不透明度，避免过暗
        h('circle', { cx: 8, cy: 8, r: r, fill: 'none', stroke: 'var(--dsw-alias-label-secondary)', 'stroke-width': 2.5, opacity: 0.28 }),
        // 激活弧：柔和的中性灰，透明度压低避免刺眼
        h('circle', {
          cx: 8, cy: 8, r: r, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round',
          opacity: 0.62,
          'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - p),
          transform: 'rotate(-90 8 8)',
          style: { transition: 'stroke-dashoffset 1s linear' },
        }),
      );
    }
    function dotEl(color, pulse) {
      return h('span', {
        className: pulse ? 'dsw-att-pulse' : undefined,
        style: Object.assign({}, S.dot, { background: color }),
      });
    }

    /** 设置卡中的时间输入：优先原生 type=time（Chromium 78+ 支持），旧浏览器回落为 时/分 下拉。 */
    function TimeField(props) {
      const hh = Math.floor(props.minutes / 60);
      const mm = props.minutes % 60;
      if (HAS_TIME_INPUT) {
        return h('input', {
          type: 'time',
          className: 'dsw-att-input',
          style: S.inputTime,
          value: fmtM(props.minutes),
          step: 60,
          'aria-label': props.label,
          onChange: function (e) {
            const m = /^(\d{1,2}):(\d{2})$/.exec(e.target.value);
            if (m) props.onChange(Number(m[1]) * 60 + Number(m[2]));
          },
        });
      }
      const hours = [];
      const minutes = [];
      for (let i = 0; i < 24; i++) hours.push(h('option', { key: 'h' + i, value: String(i) }, pad(i)));
      for (let i = 0; i < 60; i++) minutes.push(h('option', { key: 'm' + i, value: String(i) }, pad(i)));
      return h('span', { style: { display: 'inline-flex', gap: 4 } },
        h('select', {
          className: 'dsw-att-input', style: S.inputSel, value: String(hh), 'aria-label': props.label,
          onChange: function (e) { props.onChange(Number(e.target.value) * 60 + mm); },
        }, hours),
        h('select', {
          className: 'dsw-att-input', style: S.inputSel,
          value: String(mm),
          onChange: function (e) { props.onChange(hh * 60 + Number(e.target.value)); },
        }, minutes),
      );
    }

    function makeTranslate(ctx) {
      let translate = null;
      try { translate = ctx.locale.bind(NS); } catch (err) { translate = null; }
      return function (key, vars) {
        let v = null;
        if (translate) {
          try {
            const r = translate(key);
            if (typeof r === 'string') v = r;
          } catch (err) { /* fall through */ }
        }
        if (v == null) v = ZH_DICT[key] || key;
        if (vars) {
          Object.keys(vars).forEach(function (k) {
            v = v.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
          });
        }
        return v;
      };
    }

    function makeChip(ctx) {
      function ClockChip() {
        const [now, setNow] = React.useState(function () { return new Date(); });
        const [clockIn, setClockIn] = React.useState(function () { return readClockIn(new Date()); });
        const [settings, setSettings] = React.useState(loadSettings);
        const [open, setOpen] = React.useState(false);
        const wrapRef = React.useRef(null);
        const openRef = React.useRef(false);
        const timersRef = React.useRef({ openT: null, closeT: null, fired: { day: null, r5: false, r1: false, lw: false, late: false } });

        React.useEffect(function () { openRef.current = open; }, [open]);

        React.useEffect(function () {
          const id = setInterval(function () {
            const t = new Date();
            const f = timersRef.current.fired;
            if (f.day !== dayKey(t)) {
              f.day = dayKey(t);
              f.r5 = false; f.r1 = false; f.lw = false; f.late = false;
              setClockIn(readClockIn(t));
            }
            setNow(t);
          }, 1000);
          return function () {
            clearInterval(id);
            clearTimeout(timersRef.current.openT);
            clearTimeout(timersRef.current.closeT);
          };
        }, []);

        // 点击设置卡以外区域时关闭
        React.useEffect(function () {
          if (!open) return undefined;
          function onDoc(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
          }
          document.addEventListener('mousedown', onDoc, true);
          return function () { document.removeEventListener('mousedown', onDoc, true); };
        }, [open]);

        const t = makeTranslate(ctx);
        const st = statusOf(now, settings, clockIn);
        const f = timersRef.current.fired;
        const todayKey = dayKey(now);
        if (f.day !== todayKey) { f.day = todayKey; }
        const startHM = fmtM(settings.startM);
        const endHM = fmtM(settings.endM);
        const lunchStartHM = fmtM(settings.lunchStartM);
        const lunchEndHM = fmtM(settings.lunchEndM);

        // 截止前 5 分钟 / 1 分钟醒目提醒；过期未打卡、午休将结束各补一条。
        if (st.kind === 'pre') {
          if (st.remain <= RING_MS && !f.r5) {
            f.r5 = true;
            fireNotification(t('notify5', { t: startHM }));
          }
          if (st.remain <= SOON_MS && !f.r1) {
            f.r1 = true;
            fireNotification(t('notify1', { t: startHM }));
          }
        } else if (st.kind === 'late' && !f.late) {
          f.late = true;
          fireNotification(t('notifyLate', { t: startHM }));
        } else if (st.kind === 'lunch' && st.remain <= RING_MS && !f.lw) {
          f.lw = true;
          fireNotification(t('notifyLunchEnd', { t: lunchEndHM }));
        }

        const clickable = st.kind === 'pre' || st.kind === 'late';
        function clockInNow() {
          const t2 = new Date();
          storeClockIn(t2, t2.getTime());
          setClockIn(t2.getTime());
          requestNotifPermission();
        }

        // ---- 悬浮设置卡 ----
        function hoverOpen() {
          clearTimeout(timersRef.current.closeT);
          clearTimeout(timersRef.current.openT);
          timersRef.current.openT = setTimeout(function () { setOpen(true); }, 150);
        }
        function hoverClose(delay) {
          clearTimeout(timersRef.current.openT);
          clearTimeout(timersRef.current.closeT);
          timersRef.current.closeT = setTimeout(function check() {
            // 面板内仍有聚焦字段（含原生时间选择器的弹层）时保持打开
            if (wrapRef.current && wrapRef.current.contains(document.activeElement)) {
              timersRef.current.closeT = setTimeout(check, 200);
            } else {
              setOpen(false);
            }
          }, delay);
        }
        function update(patch) {
          setSettings(function (prev) {
            const next = Object.assign({}, prev, patch);
            saveSettings(next);
            return next;
          });
        }

        let panel = null;
        if (open) {
          panel = h('span', {
            className: 'dsw-att-panel',
            style: S.panel,
            title: '',
            onMouseEnter: function () { clearTimeout(timersRef.current.closeT); },
            onMouseLeave: function () { hoverClose(250); },
            onKeyDown: function (e) { if (e.key === 'Escape') setOpen(false); },
          },
            h('span', { className: 'dsw-att-head' },
              h('span', { className: 'dsw-att-title' }, t('panelTitle')),
              h('button', {
                className: 'dsw-att-x', type: 'button', 'aria-label': t('close'), title: '',
                onClick: function () { setOpen(false); },
              }, '✕'),
            ),
            h('span', { className: 'dsw-att-row' },
              h('span', { className: 'dsw-att-lab' }, t('fieldStart')),
              h(TimeField, {
                minutes: settings.startM, label: t('fieldStart'),
                onChange: function (v) { if (v < settings.endM) update({ startM: v }); },
              }),
            ),
            h('span', { className: 'dsw-att-row' },
              h('span', { className: 'dsw-att-lab' }, t('fieldEnd')),
              h(TimeField, {
                minutes: settings.endM, label: t('fieldEnd'),
                onChange: function (v) { if (v > settings.startM) update({ endM: v }); },
              }),
            ),
            h('hr', { className: 'dsw-att-hr' }),
            h('span', { className: 'dsw-att-row' },
              h('span', { className: 'dsw-att-lab' }, t('lunchMode')),
              h('span', {
                className: 'dsw-att-toggle' + (settings.lunchOn ? ' on' : ''),
                role: 'switch',
                'aria-checked': settings.lunchOn,
                tabIndex: 0,
                title: '',
                onClick: function () { update({ lunchOn: !settings.lunchOn }); },
                onKeyDown: function (e) {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ lunchOn: !settings.lunchOn }); }
                },
              }, h('span', { className: 'dsw-att-knob' })),
            ),
            settings.lunchOn ? [
              h('span', { className: 'dsw-att-row', key: 'ls' },
                h('span', { className: 'dsw-att-lab' }, t('fieldLunchStart')),
                h(TimeField, {
                  minutes: settings.lunchStartM, label: t('fieldLunchStart'),
                  onChange: function (v) { if (v < settings.lunchEndM) update({ lunchStartM: v }); },
                }),
              ),
              h('span', { className: 'dsw-att-row', key: 'le' },
                h('span', { className: 'dsw-att-lab' }, t('fieldLunchEnd')),
                h(TimeField, {
                  minutes: settings.lunchEndM, label: t('fieldLunchEnd'),
                  onChange: function (v) { if (v > settings.lunchStartM) update({ lunchEndM: v }); },
                }),
              ),
            ] : null,
            h('span', { className: 'dsw-att-hint', style: { display: 'block' } }, t('panelHint')),
          );
        }

        let tip = '';
        let kids = [];
        if (st.kind === 'rest') {
          tip = t('tipRest');
          kids = [dotEl(TONE_COLOR.idle, false), h('span', { key: 'l', style: S.label }, t('rest'))];
        } else if (st.kind === 'pre' || st.kind === 'late') {
          const urgent = st.kind === 'late' || st.remain <= RING_MS;
          const tone = st.kind === 'late' ? 'error' : toneOf(st.remain);
          tip = st.kind === 'late'
            ? t('tipLate', { t: startHM })
            : t('tipPre', { t: startHM, d: fmtDuration(st.remain) });
          const pulse = st.kind === 'late' || st.remain <= SOON_MS;
          kids = [
            dotEl(TONE_COLOR[tone], pulse),
            h('span', { key: 'l', className: pulse ? 'dsw-att-pulse' : undefined, style: Object.assign({}, S.label, { color: urgent ? TONE_COLOR.error : undefined }) }, t('morning')),
            h('strong', {
              key: 'c', className: pulse ? 'dsw-att-pulse' : undefined,
              style: Object.assign({}, S.count, { color: TONE_COLOR[tone], marginRight: 0 }),
            }, fmtDuration(st.remain)),
          ];
        } else if (st.kind === 'lunch') {
          tip = lunchStartHM + ' ➜ ' + endHM;
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { opacity: 0.72 }) }, t('lunch')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: 'var(--dsw-alias-label-secondary)', opacity: 0.8, marginRight: 0 }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, 'var(--dsw-alias-label-secondary)'),
          ];
        } else if (st.kind === 'working') {
          const ci = new Date(st.clockInMs);
          tip = pad(ci.getHours()) + ':' + pad(ci.getMinutes())
            + (st.lunchValid ? ' ➜ ' + lunchStartHM + ' ➜ ' + lunchEndHM : '')
            + ' ➜ ' + endHM;
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { opacity: 0.72 }) }, t('evening')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: 'var(--dsw-alias-label-secondary)', opacity: 0.8, marginRight: 0 }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, 'var(--dsw-alias-label-secondary)'),
          ];
        } else if (st.kind === 'done') {
          tip = endHM + ' ✔';
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.success }) }, t('done')),
            ringSvg(1, TONE_COLOR.success),
          ];
        } else { // absent
          tip = t('tipAbsent');
          kids = [dotEl(TONE_COLOR.error, false), h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.error }) }, t('absent'))];
        }

        const chipProps = {
          className: clickable ? 'dsw-att-btn' : undefined,
          style: clickable ? Object.assign({}, S.chip, S.chipBtn) : S.chip,
          title: tip,
          'aria-label': tip,
        };
        if (clickable) {
          chipProps.role = 'button';
          chipProps.tabIndex = 0;
          chipProps.onClick = function () {
            // 设置卡打开期间点击不触发打卡，避免调时间时误打卡
            if (openRef.current) return;
            clockInNow();
          };
          chipProps.onKeyDown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!openRef.current) clockInNow(); }
          };
        }

        return h('span', {
          ref: wrapRef,
          style: S.wrap,
          onMouseEnter: hoverOpen,
          onMouseLeave: function () { hoverClose(200); },
        },
          h('span', chipProps, h('style', null, CSS), kids),
          panel,
        );
      }
      return ClockChip;
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const disposers = [];
        Object.keys(DICTS).forEach(function (localeId) {
          disposers.push(ctx.locale.register(NS, localeId, DICTS[localeId]));
        });
        ctx.effect(function () {
          return function cleanup() {
            disposers.forEach(function (dispose) { dispose(); });
          };
        });
        ctx.slots.inject('conversation.composer.dock', function () {
          return ctx.slots.register({
            name: 'conversation.composer.dock',
            id: 'attendance-clock',
            order: 9999, // 排到所有内置条目（含上下文圆环）之后（行内更靠右）
            label: '打卡倒计时',
          }, makeChip(ctx));
        });
      },
    };
  },
});
