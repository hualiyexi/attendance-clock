/** @hualiyexi/attendance-clock — Client half: minimal clock-in/out chip + progress ring right of the context ring. */
window.__ModuleLoader__.load({
  id: '@hualiyexi/attendance-clock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'attendanceClock';
    // 打卡规则：工作日 08:30 前打卡上班，17:30 下班。
    const START_H = 8;
    const START_M = 30;
    const END_H = 17;
    const END_M = 30;
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
      morning: '上班打卡',
      evening: '下班',
      done: '已下班',
      absent: '缺卡',
      rest: '休',
      tipPre: '上班打卡截止 08:30，点击打卡',
      tipLate: '已过 08:30，点击补卡',
      tipAbsent: '今天没有打卡记录',
      tipRest: '休息日',
      notify5: '上班打卡截止还剩 5 分钟，快打卡！',
      notify1: '上班打卡截止还剩 1 分钟，快打卡！',
      notifyLate: '已过 08:30，今天还没打卡',
    };
    const EN_DICT = {
      morning: 'Clock in',
      evening: 'Out',
      done: 'Done',
      absent: 'Missed',
      rest: 'Off',
      tipPre: 'Clock-in deadline 08:30 — click to clock in',
      tipLate: 'Past 08:30 — click for a late clock-in',
      tipAbsent: 'No clock-in record today',
      tipRest: 'Day off',
      notify5: 'Clock-in closes in 5 minutes!',
      notify1: 'Clock-in closes in 1 minute!',
      notifyLate: 'Past 08:30 — no clock-in yet today',
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
      '.dsw-att-pulse{animation:dsw-att-pulse 1s ease-in-out infinite}',
      '.dsw-att-btn{cursor:pointer}',
      '.dsw-att-btn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsw-att-btn:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
    ].join('\n');

    const S = {
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
    };

    function pad(n) { return String(n).padStart(2, '0'); }
    function fmtDuration(ms) {
      const total = Math.max(0, Math.round(ms / 1000));
      const hh = Math.floor(total / 3600);
      const mm = Math.floor((total % 3600) / 60);
      const ss = total % 60;
      return hh + ':' + pad(mm) + ':' + pad(ss);
    }
    function fmtHM(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function atTime(d, hour, min) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, min, 0, 0).getTime();
    }
    function toneOf(ms) {
      if (ms <= SOON_MS) return 'error';
      if (ms <= RING_MS) return 'warn';
      return 'brand';
    }
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }

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

    /** 当天状态机：rest | pre(未打卡,8:30 前) | late(未打卡,已过 8:30) | working(已打卡) | done(已打卡且过 17:30) | absent(没打卡且过 17:30) */
    function statusOf(now, clockInMs) {
      const day = now.getDay();
      if (day === 0 || day === 6) return { kind: 'rest' };
      const start = atTime(now, START_H, START_M);
      const end = atTime(now, END_H, END_M);
      const ts = now.getTime();
      if (clockInMs) {
        if (ts >= end) return { kind: 'done', progress: 1 };
        // 进度分母：从 min(打卡时刻, 08:30) 起算 —— 早打卡起点更早，晚打卡也按 08:30 算总时长
        const spanStart = Math.min(clockInMs, start);
        const span = Math.max(1, end - spanStart);
        return { kind: 'working', remain: end - ts, progress: clamp01((ts - spanStart) / span), clockInMs: clockInMs };
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

    function makeTranslate(ctx) {
      let translate = null;
      try { translate = ctx.locale.bind(NS); } catch (err) { translate = null; }
      return function (key) {
        if (translate) {
          try {
            const v = translate(key);
            if (typeof v === 'string') return v;
          } catch (err) { /* fall through */ }
        }
        return ZH_DICT[key] || key;
      };
    }

    function makeChip(ctx) {
      function ClockChip() {
        const [now, setNow] = React.useState(function () { return new Date(); });
        const [clockIn, setClockIn] = React.useState(function () { return readClockIn(new Date()); });
        const firedRef = React.useRef({ day: null, r5: false, r1: false, late: false });

        React.useEffect(function () {
          const id = setInterval(function () {
            const t = new Date();
            const f = firedRef.current;
            if (f.day !== dayKey(t)) {
              f.day = dayKey(t);
              f.r5 = false; f.r1 = false; f.late = false;
              setClockIn(readClockIn(t));
            }
            setNow(t);
          }, 1000);
          return function () { clearInterval(id); };
        }, []);

        const t = makeTranslate(ctx);
        const st = statusOf(now, clockIn);
        const f = firedRef.current;
        const todayKey = dayKey(now);
        if (f.day !== todayKey) { f.day = todayKey; }

        // 截止前 5 分钟 / 1 分钟醒目提醒；过期未打卡补发一条。
        if (st.kind === 'pre') {
          if (st.remain <= RING_MS && !f.r5) {
            f.r5 = true;
            fireNotification(t('notify5'));
          }
          if (st.remain <= SOON_MS && !f.r1) {
            f.r1 = true;
            fireNotification(t('notify1'));
          }
        } else if (st.kind === 'late' && !f.late) {
          f.late = true;
          fireNotification(t('notifyLate'));
        }

        const clickable = st.kind === 'pre' || st.kind === 'late';
        function clockInNow() {
          const t2 = new Date();
          storeClockIn(t2, t2.getTime());
          setClockIn(t2.getTime());
          requestNotifPermission();
        }

        let tip = '';
        let kids = [];
        if (st.kind === 'rest') {
          tip = t('tipRest');
          kids = [dotEl(TONE_COLOR.idle, false), h('span', { key: 'l', style: S.label }, t('rest'))];
        } else if (st.kind === 'pre' || st.kind === 'late') {
          const urgent = st.kind === 'late' || st.remain <= RING_MS;
          const tone = st.kind === 'late' ? 'error' : toneOf(st.remain);
          tip = st.kind === 'late' ? t('tipLate') : t('tipPre');
          const pulse = st.kind === 'late' || st.remain <= SOON_MS;
          kids = [
            dotEl(TONE_COLOR[tone], pulse),
            h('span', { key: 'l', className: pulse ? 'dsw-att-pulse' : undefined, style: Object.assign({}, S.label, { color: urgent ? TONE_COLOR.error : undefined }) }, t('morning')),
            h('strong', {
              key: 'c', className: pulse ? 'dsw-att-pulse' : undefined,
              style: Object.assign({}, S.count, { color: TONE_COLOR[tone], marginRight: 0 }),
            }, fmtDuration(st.remain)),
          ];
        } else if (st.kind === 'working') {
          tip = fmtHM(new Date(st.clockInMs)) + ' ➜ ' + pad(END_H) + ':' + pad(END_M);
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { opacity: 0.72 }) }, t('evening')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: 'var(--dsw-alias-label-secondary)', opacity: 0.8, marginRight: 0 }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, 'var(--dsw-alias-label-secondary)'),
          ];
        } else if (st.kind === 'done') {
          tip = pad(END_H) + ':' + pad(END_M) + ' ✔';
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.success }) }, t('done')),
            ringSvg(1, TONE_COLOR.success),
          ];
        } else { // absent
          tip = t('tipAbsent');
          kids = [dotEl(TONE_COLOR.error, false), h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.error }) }, t('absent'))];
        }

        const rootProps = {
          className: clickable ? 'dsw-att-btn' : undefined,
          style: clickable ? Object.assign({}, S.chip, S.chipBtn) : S.chip,
          title: tip,
          'aria-label': tip,
        };
        if (clickable) {
          rootProps.role = 'button';
          rootProps.tabIndex = 0;
          rootProps.onClick = clockInNow;
          rootProps.onKeyDown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clockInNow(); }
          };
        }
        return h('span', rootProps, h('style', null, CSS), kids);
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
