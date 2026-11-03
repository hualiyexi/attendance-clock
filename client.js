/** @hualiyexi/attendance-clock — Client half: phase-aware countdowns, daily overview, clock-in/out, lunch mode, overtime and reminders. */
window.__ModuleLoader__.load({
  id: '@hualiyexi/attendance-clock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'attendanceClock';
    // 默认打卡规则：工作日 08:30 前打卡上班，17:30 下班；点击芯片打开面板修改。
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
      clockInAction: '上班打卡',
      makeUpAction: '补卡',
      tipPre: '上班打卡截止 {t}，还剩 {d}',
      tipLate: '上班已过 {t}，逾期 {d}',
      tipAbsent: '今天没有上班打卡记录',
      tipRest: '今日休息',
      tipBeforeLunch: '午休将于 {t} 开始',
      tipLunch: '午休将于 {t} 结束',
      tipWorking: '已打卡 {inTime}，预计下班 {outTime}',
      tipOvertime: '已到下班时间 {t}，加班 {d}；点击芯片打开打卡面板',
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
      clockOutAgain: '重新下班打卡',
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
      panelHint: '修改立即生效并保存在本机浏览器；下班需晚于上班，午休结束需晚于午休开始。下班可重复打卡，以最后一次为准。',
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
      clockInAction: 'Clock in',
      makeUpAction: 'Make up clock-in',
      tipPre: 'Clock-in deadline {t} — {d} left',
      tipLate: 'Clock-in was {t}, overdue by {d}',
      tipAbsent: 'No clock-in today',
      tipRest: 'Off today',
      tipBeforeLunch: 'Lunch starts at {t}',
      tipLunch: 'Lunch ends at {t}',
      tipWorking: 'Clocked in at {inTime}; scheduled out at {outTime}',
      tipOvertime: 'Scheduled out at {t}; overtime {d}. Click the chip to open the clock-out panel',
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
      clockOutAgain: 'Clock out again',
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
      panelHint: 'Changes apply immediately and stay in this browser. Clock-out must be after clock-in; lunch end after lunch start. You can clock out again; the latest time wins.',
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
      '.dsw-att-pulse{animation:dsw-att-pulse 1s ease-in-out infinite}',
      // 与 ContextMeter.trigger 相同：字体、间距、圆角、悬浮和展开底色。
      '.dsw-att-btn{border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-tertiary);font-family:inherit;font-size:var(--dsh-content-font-size-secondary,13px);font-variant-numeric:tabular-nums;line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px));white-space:nowrap;cursor:pointer;background:0 0;border:1px solid transparent;flex:none;align-items:center;gap:6px;padding:0 7px;display:inline-flex}',
      '.dsw-att-btn:hover,.dsw-att-btn[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.dsw-att-btn:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:1px}',
      '.dsw-att-head{display:flex;align-items:center;justify-content:space-between;gap:6px}',
      '.dsw-att-title{font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.dsw-att-hr{border:none;border-top:1px solid var(--dsw-alias-border-l1);margin:10px 0 2px}',
      '.dsw-att-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px}',
      '.dsw-att-lab{color:var(--dsw-alias-label-primary)}',
      '.dsw-att-input{font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover);border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);padding:1px 4px;height:24px;outline:none}',
      '.dsw-att-input:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.dsw-att-hint{margin-top:10px;color:var(--dsw-alias-label-secondary);opacity:.8}',
      '.dsw-att-toggle{position:relative;width:28px;height:16px;border-radius:999px;background:var(--dsw-alias-label-secondary);opacity:.4;cursor:pointer;flex:none;transition:background .15s,opacity .15s}',
      '.dsw-att-toggle.on{background:var(--dsw-alias-brand-primary);opacity:1}',
      '.dsw-att-toggle:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
      '.dsw-att-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-overlay);transition:left .15s}',
      '.dsw-att-toggle.on .dsw-att-knob{left:14px}',
      '.dsw-att-overview{display:block;margin-top:6px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}',
      '.dsw-att-overview-line{display:block;margin-top:2px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      '.dsw-att-section{display:block;margin-top:8px;font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.dsw-att-checkout{cursor:pointer;width:100%;height:28px;margin-top:10px;border:0;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit}',
      '.dsw-att-checkout:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.dsw-att-checkout:focus-visible{outline:1px solid var(--dsw-alias-brand-primary)}',
      '.dsw-att-more{margin-top:10px;padding-top:6px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.dsw-att-summary{cursor:pointer;color:var(--dsw-alias-label-secondary);outline:none}',
      '.dsw-att-summary:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);border-radius:3px}',
      '@media (prefers-reduced-motion: reduce){.dsw-att-pulse{animation:none}.dsw-att-knob{transition:none}}',
    ].join('\n');

    const S = {
      // 宿主 ContextMeter 是插槽外的固定兄弟节点；CSS order 让芯片在 Flex 视觉顺序中保持最右。
      wrap: { position: 'relative', display: 'inline-flex', flex: 'none', order: 9999 },
      chip: {
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 7px', margin: 0,
        borderRadius: 'var(--dsw-radius-sm)', fontFamily: 'inherit',
        fontSize: 'var(--dsh-content-font-size-secondary,13px)',
        lineHeight: 'calc(20px + var(--dsh-content-font-delta-secondary,0px))',
        color: 'var(--dsw-alias-label-tertiary)', fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flex: 'none', background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
      },
      dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
      label: {},
      count: { fontWeight: 400 },
      ring: { display: 'block', flexShrink: 0 },
      // 与 ContextMeter.panel 相同：固定定位、菜单材质、264px、8px 锚点间距。
      panel: {
        position: 'fixed', zIndex: 1100, boxSizing: 'border-box', width: 264,
        maxWidth: 'calc(100vw - 24px)', maxHeight: '70vh', overflowY: 'auto',
        borderRadius: 'var(--dsw-radius-lg)', background: 'var(--dsw-specific-menu)',
        backdropFilter: 'var(--dsw-menu-backdrop-filter)',
        '--dsw-elevation-stroke-color': 'var(--dsw-alias-border-l1)',
        boxShadow: 'var(--dsw-elevation-prominent)', color: 'var(--dsw-alias-label-secondary)',
        cursor: 'default', border: 0, padding: 12, fontSize: 12, lineHeight: '20px',
        fontFamily: 'inherit', textAlign: 'left', whiteSpace: 'normal',
      },
      tooltip: {
        position: 'fixed', zIndex: 1200, boxSizing: 'border-box', maxWidth: 280,
        borderRadius: 'var(--dsw-radius-sm)', background: 'var(--dsw-specific-menu)',
        backdropFilter: 'var(--dsw-menu-backdrop-filter)',
        '--dsw-elevation-stroke-color': 'var(--dsw-alias-border-l1)',
        boxShadow: 'var(--dsw-elevation-prominent)', color: 'var(--dsw-alias-label-secondary)',
        padding: '4px 8px', fontSize: 12, lineHeight: '18px', fontFamily: 'inherit',
        pointerEvents: 'none', whiteSpace: 'normal',
      },
      inputTime: { width: 82 },
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

    // 与 ContextMeter 相同的 14px / viewBox 14 / 2px 圆环；仅状态色由考勤语义提供。
    function ringSvg(progress, color) {
      const r = 5.5;
      const c = 2 * Math.PI * r;
      const p = clamp01(progress);
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 14 14', style: S.ring, 'aria-hidden': true,
      },
        h('circle', { cx: 7, cy: 7, r: r, fill: 'none', stroke: 'var(--dsw-alias-border-l3)', 'stroke-width': 2 }),
        h('circle', {
          cx: 7, cy: 7, r: r, fill: 'none', stroke: color || 'var(--dsw-alias-label-tertiary)',
          'stroke-width': 2, 'stroke-linecap': 'round',
          'stroke-dasharray': (c * p) + ' ' + c,
          transform: 'rotate(-90 7 7)',
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

    // ContextMeter 同款顶部锚定：gap 8、viewport margin 12；空间不足时转到下方。
    function useFloatingPosition(open, anchorRef, floatingRef, align) {
      const [position, setPosition] = React.useState(null);
      React.useLayoutEffect(function () {
        if (!open) { setPosition(null); return undefined; }
        function update() {
          const anchor = anchorRef.current;
          const floating = floatingRef.current;
          if (!anchor || !floating) return;
          const a = anchor.getBoundingClientRect();
          const f = floating.getBoundingClientRect();
          const margin = 12;
          const gap = 8;
          const desiredLeft = align === 'center' ? a.left + a.width / 2 - f.width / 2 : a.right - f.width;
          const left = Math.max(margin, Math.min(window.innerWidth - f.width - margin, desiredLeft));
          let top = a.top - f.height - gap;
          if (top < margin) top = a.bottom + gap;
          top = Math.max(margin, Math.min(window.innerHeight - f.height - margin, top));
          setPosition({ left: Math.round(left), top: Math.round(top) });
        }
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
        if (observer && anchorRef.current) observer.observe(anchorRef.current);
        if (observer && floatingRef.current) observer.observe(floatingRef.current);
        return function () {
          window.removeEventListener('resize', update);
          window.removeEventListener('scroll', update, true);
          if (observer) observer.disconnect();
        };
      }, [open, align, anchorRef, floatingRef]);
      return position;
    }

    function makeChip(ctx) {
      function ClockChip() {
        const [now, setNow] = React.useState(function () { return new Date(); });
        const [clockIn, setClockIn] = React.useState(function () { return readClockIn(new Date()); });
        const [clockOut, setClockOut] = React.useState(function () { return readClockOut(new Date()); });
        const [settings, setSettings] = React.useState(loadSettings);
        const [open, setOpen] = React.useState(false);
        const [tooltipOpen, setTooltipOpen] = React.useState(false);
        const wrapRef = React.useRef(null);
        const triggerRef = React.useRef(null);
        const panelRef = React.useRef(null);
        const tooltipRef = React.useRef(null);
        const timersRef = React.useRef({ tooltipT: null, fired: { day: null, r5: false, r1: false, lw: false, ls: false, co: false, late: false } });

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
            clearTimeout(timersRef.current.tooltipT);
          };
        }, []);

        // 与 ContextMeter 一致：外部 pointer 关闭，Escape 关闭并归还焦点。
        React.useEffect(function () {
          if (!open) return undefined;
          function onPointerDown(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
          }
          function onKeyDown(e) {
            if (e.key === 'Escape') {
              setOpen(false);
              if (triggerRef.current) triggerRef.current.focus();
            }
          }
          document.addEventListener('pointerdown', onPointerDown, true);
          document.addEventListener('keydown', onKeyDown);
          return function () {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown);
          };
        }, [open]);
        React.useEffect(function () {
          if (!open) return;
          clearTimeout(timersRef.current.tooltipT);
          setTooltipOpen(false);
        }, [open]);

        const panelPosition = useFloatingPosition(open, wrapRef, panelRef, 'end');
        const tooltipPosition = useFloatingPosition(tooltipOpen && !open, wrapRef, tooltipRef, 'center');
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

        function clockInNow() {
          if (clockIn) return;
          const t2 = new Date();
          storeClockIn(t2, t2.getTime());
          setClockIn(t2.getTime());
          requestNotifPermission();
        }
        // 重复下班打卡覆盖同一日记录，工时和加班随最后一次时间重算。
        function clockOutNow() {
          if (!clockIn) return;
          const t2 = new Date();
          storeClockOut(t2, t2.getTime());
          setClockOut(t2.getTime());
        }

        // 悬浮只显示 Tooltip（200ms），不再自动展开设置。
        function showTooltip() {
          if (open) return;
          clearTimeout(timersRef.current.tooltipT);
          timersRef.current.tooltipT = setTimeout(function () { setTooltipOpen(true); }, 200);
        }
        function hideTooltip() {
          clearTimeout(timersRef.current.tooltipT);
          setTooltipOpen(false);
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
          panel = h('div', {
            ref: panelRef,
            className: 'dsw-att-panel',
            style: Object.assign({}, S.panel, panelPosition || { visibility: 'hidden', left: 0, top: 0 }),
            role: 'dialog',
            'aria-label': t('settingsTitle'),
          },
            h('div', { className: 'dsw-att-head' },
              h('span', { className: 'dsw-att-title' }, t('panelTitle')),
            ),
            h('span', { className: 'dsw-att-overview' }, overview),
            clockOut ? h('span', { className: 'dsw-att-overview-line' }, outOverview) : null,
            h('span', { className: 'dsw-att-overview-line' },
              t('scheduleStart', { t: startHM }) + ' · ' + t('scheduleEnd', { t: endHM }),
            ),
            settings.lunchOn ? h('span', { className: 'dsw-att-overview-line' },
              t('scheduleLunch', { a: lunchStartHM, b: lunchEndHM }),
            ) : null,
            !clockIn && st.kind !== 'rest' ? h('button', {
              className: 'dsw-att-checkout', type: 'button', onClick: clockInNow,
            }, t(st.kind === 'pre' ? 'clockInAction' : 'makeUpAction')) : null,
            clockIn && st.kind !== 'rest' ? h('button', {
              className: 'dsw-att-checkout', type: 'button', onClick: clockOutNow,
            }, t(clockOut ? 'clockOutAgain' : 'clockOutAction')) : null,
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
            h('span', { key: 'l', style: S.label }, t(before ? 'beforeLunch' : 'lunch')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: 'var(--dsw-alias-label-tertiary)' }),
            }, fmtDuration(st.remain)),
            ringSvg(st.progress, 'var(--dsw-alias-label-tertiary)'),
          ];
        } else if (st.kind === 'working') {
          const activeColor = st.nearEnd ? TONE_COLOR.brand : 'var(--dsw-alias-label-tertiary)';
          tip = t('tipWorking', { inTime: fmtTimeMs(st.clockInMs), outTime: endHM });
          kids = [
            h('span', { key: 'l', style: S.label }, t('evening')),
            h('strong', {
              key: 'c',
              style: Object.assign({}, S.count, { color: activeColor }),
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
            h('span', { key: 'l', style: Object.assign({}, S.label, { color: TONE_COLOR.error }) }, t('absent')),
          ];
        }

        const chipProps = {
          ref: triggerRef,
          className: 'dsw-att-btn',
          type: 'button',
          style: S.chip,
          'aria-label': tip,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          onClick: function () { hideTooltip(); setOpen(!open); },
          onMouseEnter: showTooltip,
          onMouseLeave: hideTooltip,
          onFocus: showTooltip,
          onBlur: hideTooltip,
        };

        if (st.kind === 'rest' && settings.hideRest) return null;
        return h('span', { ref: wrapRef, style: S.wrap },
          h('style', null, CSS),
          h('button', chipProps, kids),
          tooltipOpen && !open ? h('span', {
            ref: tooltipRef,
            role: 'tooltip',
            style: Object.assign({}, S.tooltip, tooltipPosition || { visibility: 'hidden', left: 0, top: 0 }),
          }, tip) : null,
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
