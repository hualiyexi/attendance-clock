/** @hualiyexi/attendance-clock — Client half: phase-aware countdowns, daily overview, clock-in/out, lunch mode, overtime and reminders. */
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
      smartLunch: true,      // 午休前 30 分钟切换到“距午休”
      hideRest: false,       // 休息日隐藏芯片
      notifyLunchStart: false,
      notifyLunchEnd: true,  // 保留旧版默认提醒
      notifyClockOut: false,
    };
    const RING_MS = 5 * 60 * 1000; // 截止前 5 分钟开始醒目提醒
    const SOON_MS = 1 * 60 * 1000; // 截止前 1 分钟二次提醒
    const NEAR_END_MS = 10 * 60 * 1000; // 下班前 10 分钟轻微高亮
    const LUNCH_LEAD_MS = 30 * 60 * 1000; // 午休前 30 分钟智能切换

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
      beforeLunch: '距午休',
      lunch: '午休倒计时',
      late: '上班已逾期',
      overtimePending: '待下班打卡',
      overtime: '加班',
      done: '已下班',
      workHours: '工时 {d}',
      absent: '今日缺卡',
      rest: '今日休息',
      clickClockIn: '点击打卡',
      clickLate: '点击补卡',
      tipPre: '上班打卡截止 {t}，还剩 {d}，点击打卡',
      tipLate: '上班已过 {t}，逾期 {d}；点击补卡',
      tipAbsent: '今天没有上班打卡记录，点击补卡',
      tipRest: '今日休息',
      tipBeforeLunch: '午休将于 {t} 开始',
      tipLunch: '午休将于 {t} 结束',
      tipWorking: '已打卡 {inTime}，预计下班 {outTime}',
      tipOvertime: '已到下班时间 {t}，加班 {d}；在悬浮卡片中下班打卡',
      tipDone: '下班打卡 {t} · 工时 {d}',
      notify5: '上班打卡截止 {t}，还剩 5 分钟，快打卡！',
      notify1: '上班打卡截止 {t}，还剩 1 分钟，快打卡！',
      notifyLate: '已过 {t}，今天还没打卡',
      notifyLunchStart: '午休将于 {t} 开始，准备收尾！',
      notifyLunchEnd: '午休将于 {t} 结束，准备上班！',
      notifyClockOut: '下班倒计时 5 分钟，下班时间 {t}！',
      panelTitle: '今天',
      settingsTitle: '打卡设置',
      fieldStart: '上班时间',
      fieldEnd: '下班时间',
      fieldLunchStart: '午休开始',
      fieldLunchEnd: '午休结束',
      lunchMode: '午休模式',
      clockedAt: '已打卡 {t}',
      notClocked: '尚未上班打卡',
      worked: '已工作 {d}',
      clockOutAt: '下班打卡 {t}',
      clockOutAction: '下班打卡',
      overtimeSummary: '加班 {d}',
      scheduleStart: '上班 {t}',
      scheduleEnd: '下班 {t}',
      scheduleLunch: '午休 {a}–{b}',
      moreOptions: '提醒与显示',
      smartLunch: '午休前智能切换',
      hideRest: '休息日隐藏芯片',
      notifyLunchStartLabel: '午休开始前提醒',
      notifyLunchEndLabel: '午休结束前提醒',
      notifyClockOutLabel: '下班前提醒',
      panelHint: '修改立即生效并保存在本机浏览器；下班需晚于上班，午休结束需晚于午休开始。',
      close: '关闭',
    };
    const EN_DICT = {
      morning: 'Clock-in countdown',
      evening: 'Clock-out countdown',
      beforeLunch: 'Lunch in',
      lunch: 'Lunch countdown',
      late: 'Clock-in overdue',
      overtimePending: 'Clock-out pending',
      overtime: 'Overtime',
      done: 'Off work',
      workHours: '{d} today',
      absent: 'Clock-in missing',
      rest: 'Off today',
      clickClockIn: 'Click to clock in',
      clickLate: 'Click to make up',
      tipPre: 'Clock-in deadline {t} — {d} left, click to clock in',
      tipLate: 'Clock-in was {t}, overdue by {d}; click to make up',
      tipAbsent: 'No clock-in today; click to make up',
      tipRest: 'Off today',
      tipBeforeLunch: 'Lunch starts at {t}',
      tipLunch: 'Lunch ends at {t}',
      tipWorking: 'Clocked in at {inTime}; scheduled out at {outTime}',
      tipOvertime: 'Scheduled out at {t}; overtime {d}. Open the hover card to clock out',
      tipDone: 'Clocked out at {t} · {d} worked',
      notify5: 'Clock-in closes at {t} — 5 minutes left!',
      notify1: 'Clock-in closes at {t} — 1 minute left!',
      notifyLate: 'Past {t} — no clock-in yet today',
      notifyLunchStart: 'Lunch starts at {t} — time to wrap up!',
      notifyLunchEnd: 'Lunch ends at {t} — back to work soon!',
      notifyClockOut: 'Clock-out in 5 minutes, at {t}!',
      panelTitle: 'Today',
      settingsTitle: 'Attendance settings',
      fieldStart: 'Clock-in time',
      fieldEnd: 'Clock-out time',
      fieldLunchStart: 'Lunch start',
      fieldLunchEnd: 'Lunch end',
      lunchMode: 'Lunch mode',
      clockedAt: 'Clocked in {t}',
      notClocked: 'Not clocked in yet',
      worked: '{d} worked',
      clockOutAt: 'Clocked out {t}',
      clockOutAction: 'Clock out',
      overtimeSummary: 'Overtime {d}',
      scheduleStart: 'In {t}',
      scheduleEnd: 'Out {t}',
      scheduleLunch: 'Lunch {a}–{b}',
      moreOptions: 'Reminders and display',
      smartLunch: 'Switch before lunch',
      hideRest: 'Hide on days off',
      notifyLunchStartLabel: 'Before lunch starts',
      notifyLunchEndLabel: 'Before lunch ends',
      notifyClockOutLabel: 'Before clock-out',
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
      '.dsw-att-overview{display:block;margin-top:6px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}',
      '.dsw-att-overview-line{display:block;margin-top:2px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.dsw-att-section{display:block;margin-top:8px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.dsw-att-checkout{cursor:pointer;width:100%;height:26px;margin-top:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit}',
      '.dsw-att-checkout:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.dsw-att-checkout:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
      '.dsw-att-more{margin-top:10px;padding-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsw-att-summary{cursor:pointer;color:var(--dsw-alias-label-secondary);outline:none}',
      '.dsw-att-summary:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);border-radius:3px}',
      '@media (prefers-reduced-motion: reduce){.dsw-att-pulse,.dsw-att-panel{animation:none}.dsw-att-knob{transition:none}}',
    ].join('\n');

    const S = {
      // 宿主 ContextMeter 是插槽外的固定兄弟节点；CSS order 让芯片在 Flex 视觉顺序中保持最右。
      wrap: { position: 'relative', display: 'inline-flex', flex: 'none', order: 9999 },
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
        minWidth: 280,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: '70vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
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
    function fmtWork(ms) {
      const total = Math.max(0, Math.floor(ms / 60000));
      const hh = Math.floor(total / 60);
      const mm = total % 60;
      return hh > 0 ? hh + 'h' + pad(mm) + 'm' : mm + 'm';
    }
    function fmtTimeMs(ms) {
      const d = new Date(ms);
      return pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
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
            ['lunchOn', 'smartLunch', 'hideRest', 'notifyLunchStart', 'notifyLunchEnd', 'notifyClockOut'].forEach(function (key) {
              if (typeof o[key] === 'boolean') s[key] = o[key];
            });
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

    function readStoredMs(key) {
      try {
        const v = localStorage.getItem(key);
        const ms = v ? Number(v) : 0;
        return isFinite(ms) && ms > 0 ? ms : null;
      } catch (err) { return null; }
    }
    function storeMs(key, ms) {
      try { localStorage.setItem(key, String(ms)); } catch (err) { /* private mode etc. */ }
    }
    function readClockIn(d) { return readStoredMs('dsw-att.' + dayKey(d)); }
    function storeClockIn(d, ms) { storeMs('dsw-att.' + dayKey(d), ms); }
    function readClockOut(d) { return readStoredMs('dsw-att.out.' + dayKey(d)); }
    function storeClockOut(d, ms) { storeMs('dsw-att.out.' + dayKey(d), ms); }

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

    function overlapMs(aStart, aEnd, bStart, bEnd) {
      return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
    }
    // 实际工时：从上班打卡到当前/下班打卡，只扣除与打卡区间真实重叠的午休。
    function workMsAt(now, s, clockInMs, untilMs) {
      if (!clockInMs) return 0;
      const finish = Math.max(clockInMs, untilMs || now.getTime());
      let total = finish - clockInMs;
      if (s.lunchOn && s.lunchEndM > s.lunchStartM) {
        total -= overlapMs(clockInMs, finish, atTime(now, s.lunchStartM), atTime(now, s.lunchEndM));
      }
      return Math.max(0, total);
    }

    /**
     * 当天状态机：rest | pre | late | working | preLunch | lunch | overtime | done | absent。
     * done 只表示已实际下班打卡；到点但未下班打卡进入 overtime，持续累计加班。
     * 圆环进度按实际重叠午休扣除，午休中暂停，午休结束不会倒退。
     */
    function statusOf(now, s, clockInMs, clockOutMs) {
      const day = now.getDay();
      if (day === 0 || day === 6) return { kind: 'rest' };
      const ts = now.getTime();
      const start = atTime(now, s.startM);
      const end = atTime(now, s.endM);
      const lunchValid = s.lunchOn && s.lunchEndM > s.lunchStartM;
      const lStart = lunchValid ? atTime(now, s.lunchStartM) : 0;
      const lEnd = lunchValid ? atTime(now, s.lunchEndM) : 0;

      if (clockInMs) {
        const workMs = workMsAt(now, s, clockInMs, clockOutMs || ts);
        const base = {
          clockInMs: clockInMs,
          clockOutMs: clockOutMs || null,
          lunchValid: lunchValid,
          workMs: workMs,
          overtimeMs: Math.max(0, (clockOutMs || ts) - end),
        };
        if (clockOutMs) return Object.assign({ kind: 'done', progress: 1 }, base);

        const spanStart = Math.min(clockInMs, start);
        const progressNow = Math.max(spanStart, Math.min(ts, end));
        const fullBreak = lunchValid ? overlapMs(spanStart, end, lStart, lEnd) : 0;
        const elapsedBreak = lunchValid ? overlapMs(spanStart, progressNow, lStart, lEnd) : 0;
        const span = Math.max(1, end - spanStart - fullBreak);
        const progress = clamp01((progressNow - spanStart - elapsedBreak) / span);
        if (ts >= end) {
          return Object.assign({ kind: 'overtime', remain: 0, overtimeMs: ts - end, progress: 1 }, base);
        }
        if (lunchValid && ts >= lStart && ts < lEnd) {
          return Object.assign({ kind: 'lunch', remain: lEnd - ts, progress: progress }, base);
        }
        if (lunchValid && s.smartLunch && ts < lStart && lStart - ts <= LUNCH_LEAD_MS) {
          return Object.assign({ kind: 'preLunch', remain: lStart - ts, progress: progress }, base);
        }
        return Object.assign({
          kind: 'working',
          remain: end - ts,
          nearEnd: end - ts <= NEAR_END_MS,
          progress: progress,
        }, base);
      }
      if (ts < start) return { kind: 'pre', remain: start - ts };
      if (ts < end) return { kind: 'late', remain: 0, overdueMs: ts - start };
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

    function Toggle(props) {
      return h('span', {
        className: 'dsw-att-toggle' + (props.checked ? ' on' : ''),
        role: 'switch',
        'aria-checked': props.checked,
        'aria-label': props.label,
        tabIndex: 0,
        title: '',
        onClick: function () { props.onChange(!props.checked); },
        onKeyDown: function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onChange(!props.checked); }
        },
      }, h('span', { className: 'dsw-att-knob' }));
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
        const [clockOut, setClockOut] = React.useState(function () { return readClockOut(new Date()); });
        const [settings, setSettings] = React.useState(loadSettings);
        const [open, setOpen] = React.useState(false);
        const wrapRef = React.useRef(null);
        const openRef = React.useRef(false);
        const timersRef = React.useRef({ openT: null, closeT: null, fired: { day: null, r5: false, r1: false, lw: false, ls: false, co: false, late: false } });

        React.useEffect(function () { openRef.current = open; }, [open]);

        React.useEffect(function () {
          const id = setInterval(function () {
            const t = new Date();
            const f = timersRef.current.fired;
            if (f.day !== dayKey(t)) {
              f.day = dayKey(t);
              f.r5 = false; f.r1 = false; f.lw = false; f.ls = false; f.co = false; f.late = false;
              setClockIn(readClockIn(t));
              setClockOut(readClockOut(t));
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
        const st = statusOf(now, settings, clockIn, clockOut);
        const f = timersRef.current.fired;
        const todayKey = dayKey(now);
        if (f.day !== todayKey) { f.day = todayKey; }
        const startHM = fmtM(settings.startM);
        const endHM = fmtM(settings.endM);
        const lunchStartHM = fmtM(settings.lunchStartM);
        const lunchEndHM = fmtM(settings.lunchEndM);

        // 上班提醒保持原有行为；午休和下班提醒由独立开关控制。
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
        }
        const nowMs = now.getTime();
        if (clockIn && !clockOut) {
          const untilLunch = atTime(now, settings.lunchStartM) - nowMs;
          const untilEnd = atTime(now, settings.endM) - nowMs;
          if (settings.notifyLunchStart && st.lunchValid && untilLunch > 0 && untilLunch <= RING_MS && !f.ls) {
            f.ls = true;
            fireNotification(t('notifyLunchStart', { t: lunchStartHM }));
          }
          if (settings.notifyLunchEnd && st.kind === 'lunch' && st.remain > 0 && st.remain <= RING_MS && !f.lw) {
            f.lw = true;
            fireNotification(t('notifyLunchEnd', { t: lunchEndHM }));
          }
          if (settings.notifyClockOut && untilEnd > 0 && untilEnd <= RING_MS && !f.co) {
            f.co = true;
            fireNotification(t('notifyClockOut', { t: endHM }));
          }
        }

        const clickable = st.kind === 'pre' || st.kind === 'late' || st.kind === 'absent';
        function clockInNow() {
          if (clockIn) return;
          const t2 = new Date();
          storeClockIn(t2, t2.getTime());
          setClockIn(t2.getTime());
          requestNotifPermission();
        }
        function clockOutNow() {
          if (!clockIn || clockOut) return;
          const t2 = new Date();
          storeClockOut(t2, t2.getTime());
          setClockOut(t2.getTime());
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
          if (patch.notifyLunchStart === true || patch.notifyLunchEnd === true || patch.notifyClockOut === true) {
            requestNotifPermission();
          }
          setSettings(function (prev) {
            const next = Object.assign({}, prev, patch);
            saveSettings(next);
            return next;
          });
        }
        function toggleRow(settingKey, labelKey, value) {
          const label = t(labelKey);
          return h('span', { className: 'dsw-att-row', key: settingKey },
            h('span', { className: 'dsw-att-lab' }, label),
            h(Toggle, { checked: value, label: label, onChange: function (next) {
              const patch = {}; patch[settingKey] = next; update(patch);
            } }),
          );
        }

        let panel = null;
        if (open) {
          const overview = clockIn
            ? t('clockedAt', { t: fmtTimeMs(clockIn) }) + ' · ' + t('worked', { d: fmtWork(st.workMs || 0) })
            : t('notClocked');
          const outOverview = clockOut
            ? t('clockOutAt', { t: fmtTimeMs(clockOut) }) + (st.overtimeMs > 0 ? ' · ' + t('overtimeSummary', { d: fmtWork(st.overtimeMs) }) : '')
            : '';
          panel = h('span', {
            className: 'dsw-att-panel',
            style: S.panel,
            role: 'dialog',
            'aria-label': t('settingsTitle'),
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
            h('span', { className: 'dsw-att-overview' }, overview),
            clockOut ? h('span', { className: 'dsw-att-overview-line' }, outOverview) : null,
            h('span', { className: 'dsw-att-overview-line' },
              t('scheduleStart', { t: startHM }) + ' · ' + t('scheduleEnd', { t: endHM }),
            ),
            settings.lunchOn ? h('span', { className: 'dsw-att-overview-line' },
              t('scheduleLunch', { a: lunchStartHM, b: lunchEndHM }),
            ) : null,
            clockIn && !clockOut && st.kind !== 'rest' ? h('button', {
              className: 'dsw-att-checkout', type: 'button', onClick: clockOutNow,
            }, t('clockOutAction')) : null,
            h('hr', { className: 'dsw-att-hr' }),
            h('span', { className: 'dsw-att-section' }, t('settingsTitle')),
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
            toggleRow('lunchOn', 'lunchMode', settings.lunchOn),
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
            h('details', { className: 'dsw-att-more' },
              h('summary', { className: 'dsw-att-summary' }, t('moreOptions')),
              settings.lunchOn ? toggleRow('smartLunch', 'smartLunch', settings.smartLunch) : null,
              settings.lunchOn ? toggleRow('notifyLunchStart', 'notifyLunchStartLabel', settings.notifyLunchStart) : null,
              settings.lunchOn ? toggleRow('notifyLunchEnd', 'notifyLunchEndLabel', settings.notifyLunchEnd) : null,
              toggleRow('notifyClockOut', 'notifyClockOutLabel', settings.notifyClockOut),
              toggleRow('hideRest', 'hideRest', settings.hideRest),
            ),
            h('span', { className: 'dsw-att-hint', style: { display: 'block' } }, t('panelHint')),
          );
        }

        let tip = '';
        let kids = [];
        if (st.kind === 'rest') {
          tip = t('tipRest');
          kids = [dotEl(TONE_COLOR.idle, false), h('span', { key: 'l', style: S.label }, t('rest'))];
        } else if (st.kind === 'pre') {
          const tone = toneOf(st.remain);
          const pulse = st.remain <= SOON_MS;
          tip = t('tipPre', { t: startHM, d: fmtDuration(st.remain) });
          kids = [
            dotEl(TONE_COLOR[tone], pulse),
            h('span', { key: 'l', className: pulse ? 'dsw-att-pulse' : undefined, style: Object.assign({}, S.label, { color: st.remain <= RING_MS ? TONE_COLOR[tone] : undefined }) }, t('morning')),
            h('strong', {
              key: 'c', className: pulse ? 'dsw-att-pulse' : undefined,
              style: Object.assign({}, S.count, { color: TONE_COLOR[tone], marginRight: 0 }),
            }, fmtDuration(st.remain)),
          ];
        } else if (st.kind === 'late') {
          tip = t('tipLate', { t: startHM, d: fmtDuration(st.overdueMs) });
          kids = [
            dotEl(TONE_COLOR.error, true),
            h('span', { key: 'l', className: 'dsw-att-pulse', style: Object.assign({}, S.label, { color: TONE_COLOR.error }) }, t('late')),
            h('strong', { key: 'c', className: 'dsw-att-pulse', style: Object.assign({}, S.count, { color: TONE_COLOR.error, marginRight: 0 }) }, fmtDuration(st.overdueMs)),
          ];
        } else if (st.kind === 'preLunch' || st.kind === 'lunch') {
          const before = st.kind === 'preLunch';
          tip = t(before ? 'tipBeforeLunch' : 'tipLunch', { t: before ? lunchStartHM : lunchEndHM });
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { opacity: 0.72 }) }, t(before ? 'beforeLunch' : 'lunch')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: 'var(--dsw-alias-label-secondary)', opacity: 0.8, marginRight: 0 }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, 'var(--dsw-alias-label-secondary)'),
          ];
        } else if (st.kind === 'working') {
          const activeColor = st.nearEnd ? TONE_COLOR.brand : 'var(--dsw-alias-label-secondary)';
          tip = t('tipWorking', { inTime: fmtTimeMs(st.clockInMs), outTime: endHM });
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { opacity: 0.72 }) }, t('evening')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: activeColor, opacity: 0.8, marginRight: 0 }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, activeColor),
          ];
        } else if (st.kind === 'overtime') {
          tip = t('tipOvertime', { t: endHM, d: fmtDuration(st.overtimeMs) });
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.warn }) }, t('overtimePending')),
            h('strong', {
              key: 'c', style: Object.assign({}, S.count, { color: TONE_COLOR.warn, marginRight: 0 }),
            }, t('overtime') + ' ' + fmtDuration(st.overtimeMs)),
            ringSvg(1, TONE_COLOR.warn),
          ];
        } else if (st.kind === 'done') {
          tip = t('tipDone', { t: fmtTimeMs(st.clockOutMs), d: fmtWork(st.workMs) });
          kids = [
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.success }) }, t('done') + ' ·'),
            h('strong', { key: 'c', style: Object.assign({}, S.count, { color: TONE_COLOR.success, marginRight: 0 }) }, t('workHours', { d: fmtWork(st.workMs) })),
            ringSvg(1, TONE_COLOR.success),
          ];
        } else { // absent
          tip = t('tipAbsent');
          kids = [
            dotEl(TONE_COLOR.error, false),
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.error }) }, t('absent') + ' ·'),
            h('span', { key: 'a', style: { color: TONE_COLOR.error, opacity: 0.75 } }, t('clickLate')),
          ];
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

        if (st.kind === 'rest' && settings.hideRest) return null;
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
            order: 9999, // 插槽内部排最后；固定的上下文圆环由 S.wrap.order 越过
            label: '打卡倒计时',
          }, makeChip(ctx));
        });
      },
    };
  },
});
