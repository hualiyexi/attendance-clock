# attendance-clock · 打卡倒计时

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

一个 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai) 插件：在 Web 界面消息输入框底部常驻一行极简打卡状态芯片。

![icon](icon.svg)

## 功能

- **上班打卡倒计时**：工作日上班时间（默认 08:30）截止，未打卡时显示剩余时间，点击芯片即完成打卡（按天记录在浏览器 `localStorage`，重启不丢）
- **醒目提醒**：截止前 5 分钟橙色 + 闪烁并发送浏览器系统通知；前 1 分钟红色急促闪烁 + 二次通知；过点未打卡补发提醒
- **下班倒计时 + 进度圆环**：打卡后显示距下班时间的倒计时。总时长按 `下班 − min(打卡时刻, 上班)` 计算：早打卡起点更早，晚打卡总长不缩水
- **悬浮设置卡片**：鼠标悬浮芯片弹出设置卡，可直接修改上班/下班时间（即时生效，保存在本机浏览器）
- **午休模式**：设置卡内一键开关；开启后可设定午休开始/结束时间，打卡后的倒计时随之分相位——
  - 上午显示「上班倒计时」（下午时段显示「下班倒计时」）
  - 午休期间显示「午休倒计时」（距午休结束），进度圆环暂停推进
  - 进度圆环扣除午休时长，下班时恰好走满；午休结束前 5 分钟发系统提醒
- **状态语义**：已下班（绿 ✔ 满环）/ 缺卡（红）/ 休息日（灰），悬停可看完整规则
- **固定最右侧**：芯片显示在上下文占用圆环和百分比之后；同时兼容宿主插槽排序与底栏 Flex 视觉排序
- **主题自适应**：全部颜色使用 DSH 主题 token（`--dsw-alias-*`），深浅色主题自动适配；界面语言中/英自动切换

## 安装

包为纯 JavaScript、无构建脚本，三种渠道任选其一（对应 DSH《打包与安装插件》规范）：

**① 本地目录 / git 克隆**（改源码即时生效）——在 DSH 会话中让 Agent 执行：

```text
plugin_manager install_bundle → <本仓库克隆路径>
```

**② tarball**（免构建授权，适合分发）：

```sh
pnpm pack                                  # 产出 attendance-clock-x.y.z.tgz
dsh plugin --profile <名称> add ./attendance-clock-x.y.z.tgz
```

**③ GitHub 直装**：

```sh
dsh plugin --profile <名称> add github:hualiyexi/attendance-clock
```

## 兼容性

manifest 声明 `engines.dsh: ">=0.2.0-0 <0.3.0-0"`：适配 DSH `0.2.x` 运行时（预发布版本也参与匹配）。版本不满足时安装/启动会明确拒绝，不会带病加载。

## 配置

所有时间都在**悬浮设置卡片**中调整（鼠标悬浮芯片即弹出）：

| 设置项 | 默认值 | 说明 |
|---|---|---|
| 上班时间 | 08:30 | 上班打卡截止；此前未打卡显示上班倒计时，点击芯片打卡 |
| 下班时间 | 17:30 | 下班时间；须晚于上班时间 |
| 午休模式 | 关 | 开启后打卡时段分为上午/午休/下午三个相位 |
| 午休开始 | 12:00 | 需早于午休结束 |
| 午休结束 | 13:30 | 午休结束前 5 分钟发系统提醒 |

修改立即生效，保存在本机浏览器的 `localStorage`（键 `dsw-att.settings`）。

提醒阈值：`RING_MS`（默认截止前 5 分钟）、`SOON_MS`（前 1 分钟），在 `client.js` 顶部调整。

> 说明：这些是**浏览器端**参数，渲染在 Web 页面的 Client 模块不接收 cordis 行配置，因此没有做成插件 Config 字段——避免提供"可配置但不生效"的假选项；DSH 的配置规范（不同部署不同值的参数应走 Config）适用于 Host 侧插件。

## 目录结构

```text
attendance-clock/
├── package.json        # bundle 清单（dsh.bundle.patch + dsh.client + engines.dsh）
├── cordis.patch.yml    # Loader patch：插入插件行
├── index.js            # Host 半（空实现，渲染在 Client）
├── client.js           # Client 半：芯片组件、状态机、通知、圆环
├── locale/zh.json      # 中文资源（含 Plugin Manager 展示元数据）
├── locale/en.json      # 英文资源
└── icon.svg            # 原创图标
```

## 许可

[MIT](LICENSE)
