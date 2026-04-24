/* eslint-disable @typescript-eslint/no-explicit-any */
import Phaser from 'phaser';
import { CrewmateColors, RGBMaskPipeline } from './RGBShader';
import type { PlayerData } from '../components/meetings/MeetingModal';
import Memory from '../data/memory';
import * as EasyStar from 'easystarjs';

interface TYPEtask {
  name: string;
  timeRange: number[];
}
const SPEED = 200;
const TILE_SIZE = 30;
const ALL_TASKS: TYPEtask[] = [
  { name: 'cardTask', timeRange: [10, 15] },
  { name: 'eleTask', timeRange: [15, 25] },
  { name: 'reactorTask', timeRange: [20, 30] },
  { name: 'navTask', timeRange: [15, 20] },
  { name: 'chairTask', timeRange: [30, 45] },
];
const emergency_button_loc = { x: 2100, y: 500 };

// ─── Color hex map for HUD (matches CrewmateColors presets) ───────────────────
const COLOR_HEX: Record<string, string> = {
  red: '#ff5544',
  yellow: '#ffee00',
  pink: '#ff88cc',
  blue: '#4488ff',
  black: '#9999bb',
  white: '#eeeeee',
  green: '#44ff88',
  purple: '#aa44ff',
  lime: '#88ff44',
  teal: '#44ccbb',
  coral: '#ff7755',
  brown: '#cc8844',
  maroon: '#882222',
  rose: '#ffaabb',
  banana: '#ffe866',
  cyan: '#44ffee',
};
export default class BasicScene extends Phaser.Scene {
  minimapContainer!: any;
  minimap!: any;
  playerDot!: any;
  mainMapWidth!: number;
  mainMapHeight!: number;
  LightCanvas!: any;
  LightContext!: any;
  LightTexture!: any;
  LocationZones: { name: string; rect: Phaser.Geom.Rectangle }[] = [];
  easystar!: any;
  grids: number[][] = [];

  player!: any;
  dummies!: any;
  playerRole: 'impostor' | 'crewmate' = 'crewmate';
  dummyRoles = ['crewmate', 'crewmate', 'crewmate', 'crewmate'];

  walkSound!: any;

  taskGroup!: Phaser.Physics.Arcade.StaticGroup;
  emergencyGroup!: Phaser.Physics.Arcade.StaticGroup;
  ventGroup!: Phaser.Physics.Arcade.StaticGroup;

  killZone!: Phaser.GameObjects.Zone;
  playerInteractZone!: Phaser.GameObjects.Zone;
  visibleZones!: Phaser.Physics.Arcade.Group;
  dummiesInteractZones!: Phaser.Physics.Arcade.Group;
  personalZones!: Phaser.Physics.Arcade.Group;

  isIdle: boolean = true;
  isMeetingCalled: boolean = false;
  isSabotaged: boolean = false;
  reportTarget: boolean = false;
  currentTask: string | null = null;
  targetVent: string | null = null;
  nextSabotageTime: number = 0;
  currentTarget: any = null;
  isDummyImpostor: boolean = false;
  currVentPos: number[] = [];

  totalNoOfTasks: number = 4 * 5;
  progressBarBg!: Phaser.GameObjects.Rectangle;
  progressBarFill!: Phaser.GameObjects.Rectangle;

  taskListGroup!: Phaser.GameObjects.Group;
  uiGroup!: Phaser.GameObjects.Group;
  cursors!: any;
  wasd!: any;
  darkness!: any;
  flashlight!: any;

  // ─── NEW: Alert & Ship Report State ────────────────────────────────────────
  shipReportLog: {
    time: number;
    name: string;
    colorHex: string;
    action: string;
    role: string;
  }[] = [];
  lastShipReportRefresh: number = 0;

  constructor() {
    super({ key: 'BasicScene' });
  }

  getColorHex(sprite: any): string {
    const colorName = sprite?.getData?.('colorName') || '';
    return COLOR_HEX[colorName] || '#aaaacc';
  }

  setupHtmlOverlays() {
    // Remove stale overlays on scene restart
    ['_ALERT-CONTAINER', '_SHIP-REPORT', '_GAME-OVERLAY-STYLE'].forEach(
      (id) => {
        document.getElementById(id)?.remove();
      },
    );

    // ── Global CSS ────────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.id = '_GAME-OVERLAY-STYLE';
    style.textContent = `
      /* ── ALERT CONTAINER ─────────────────────────────────────────────────── */
      #_ALERT-CONTAINER {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        pointer-events: none;
        width: 460px;
        max-width: 90vw;
      }
      .game-alert {
        width: 100%;
        background: rgba(4, 5, 20, 0.97);
        border: 1px solid rgba(255,255,255,0.08);
        color: #fff;
        padding: 10px 14px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 6px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04);
        letter-spacing: 0.6px;
        text-transform: uppercase;
        opacity: 0;
        transform: translateY(-14px) scale(0.97);
        transition: opacity 0.22s ease, transform 0.22s ease;
      }
      .game-alert.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .game-alert.fading {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      .alert-bar {
        width: 4px;
        align-self: stretch;
        min-height: 32px;
        border-radius: 2px;
        flex-shrink: 0;
      }
 

      /* ── SHIP REPORT PANEL ────────────────────────────────────────────────── */
      #_SHIP-REPORT {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 268px;
        max-height: 330px;
        background: rgba(3, 4, 18, 0.94);
        border: 1px solid rgba(255,55,55,0.45);
        border-radius: 4px;
        z-index: 500;
        font-family: 'Courier New', monospace;
        overflow: hidden;
        box-shadow: 0 0 22px rgba(255,40,40,0.12), 0 6px 24px rgba(0,0,0,0.75);
      }
      #_SHIP-REPORT-HEADER {
        background: rgba(255,40,40,0.12);
        border-bottom: 1px solid rgba(255,55,55,0.35);
        padding: 6px 10px;
        font-size: 10px;
        font-weight: bold;
        color: #ff6666;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 7px;
      }
      .blink-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #ff4444;
        animation: sr-blink 1.1s infinite;
        flex-shrink: 0;
      }
      @keyframes sr-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }

      #_SHIP-REPORT-ENTRIES {
        padding: 5px 8px 8px;
        overflow-y: auto;
        max-height: 295px;
        scrollbar-width: none;
      }
      #_SHIP-REPORT-ENTRIES::-webkit-scrollbar { display: none; }

      .sr-section-header {
        font-size: 8.5px;
        color: rgba(255,255,255,0.3);
        letter-spacing: 1.8px;
        text-transform: uppercase;
        margin: 5px 0 3px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        padding-bottom: 2px;
      }
      .sr-entry {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 2.5px 0;
        font-size: 10.5px;
        color: rgba(255,255,255,0.75);
      }
      .sr-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .sr-name {
        font-weight: bold;
        font-size: 9.5px;
        text-transform: uppercase;
        min-width: 42px;
        color: rgba(255,255,255,0.92);
      }
      .sr-action {
        font-size: 9.5px;
        color: rgba(255,255,255,0.55);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .sr-dead  { color:rgba(255,90,90,0.65) !important; }
      .sr-alert { color:#ffcc00 !important; }

      .sr-log-entry {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 2px 0;
        font-size: 9.5px;
        color: rgba(255,255,255,0.5);
        border-top: 1px solid rgba(255,255,255,0.04);
      }
      .sr-time {
        font-size: 8.5px;
        color: rgba(255,255,255,0.25);
        min-width: 26px;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);

    // ── Alert Container ───────────────────────────────────────────────────────
    const alertContainer = document.createElement('div');
    alertContainer.id = '_ALERT-CONTAINER';
    document.body.appendChild(alertContainer);

    // ── Ship Report Panel ─────────────────────────────────────────────────────
    // const shipReport = document.createElement('div');
    // shipReport.id = '_SHIP-REPORT';
    // shipReport.innerHTML = `
    //   <div id="_SHIP-REPORT-HEADER">
    //     <div class="blink-dot"></div>
    //     SHIP REPORT
    //   </div>
    //   <div id="_SHIP-REPORT-ENTRIES">
    //     <div style="color:rgba(255,255,255,0.25);font-size:9px;padding:10px 2px;text-align:center;letter-spacing:1px;">
    //       INITIALIZING SYSTEMS...
    //     </div>
    //   </div>
    // `;
    // document.body.appendChild(shipReport);

    // ── Console Log Interception ──────────────────────────────────────────────
    // Captures [botName] ACTION-style lines and mirrors them into the Ship Report.
    const origLog = console.log.bind(console);
    console.log = (...args: any[]) => {
      origLog(...args);
      const msg = args.map((a) => String(a)).join(' ');
      const match = msg.match(/^\[([^\]]+)\]\s+(.+)/);
      if (match && this.dummies) {
        const botName = match[1];
        const action = match[2].substring(0, 58);
        const dummy = this.dummies
          .getChildren()
          .find((d: any) => d.name === botName) as any;
        if (!dummy) return;
        const role = dummy.getData('role') || 'unknown';
        const colorHex = this.getColorHex(dummy);
        this.addToShipLog(botName, colorHex, action, role);
      }
    };
  }

  showAlert(message: string, type: string = 'info', duration: number = 4000) {
    const container = document.getElementById('_ALERT-CONTAINER');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `game-alert alert-${type}`;
    el.innerHTML = `<div class="alert-bar"></div><span>${message}</span>`;
    container.appendChild(el);

    // Double rAF trick: forces browser to paint the element before adding class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('visible'));
    });

    setTimeout(() => {
      el.classList.add('fading');
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 280);
    }, duration);
  }

  addToShipLog(name: string, colorHex: string, action: string, role: string) {
    this.shipReportLog.push({
      time: this.time?.now || 0,
      name,
      colorHex,
      action,
      role,
    });
    if (this.shipReportLog.length > 30) this.shipReportLog.shift();
  }
  //NOTE:Ship report is removed for Now
  refreshShipReport() {
    const panel = document.getElementById('_SHIP-REPORT-ENTRIES');
    if (!panel || !this.dummies) return;

    let html = '';

    // ── LIVE STATUS ───────────────────────────────────────────────────────────
    html += `<div class="sr-section-header">◉ Live Status</div>`;

    let anyShown = false;
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      const role = dummy.getData('role');
      const isDead = dummy.getData('isDead');
      const isSwept = dummy.getData('isSwept');
      const colorHex = COLOR_HEX[dummy.getData('colorName') || ''] || '#aaaacc';

      // Impostors see impostors; crewmates see crewmates
      if (this.playerRole === 'impostor' && role !== 'impostor') return;
      if (this.playerRole === 'crewmate' && role !== 'crewmate') return;
      anyShown = true;

      let activity = '';
      let actClass = '';

      if (isDead || isSwept) {
        activity = '☠ eliminated';
        actClass = 'sr-dead';
      } else if (dummy.getData('isPanicking')) {
        activity = '🚨 → Emergency btn!';
        actClass = 'sr-alert';
      } else if (dummy.getData('isFleeing')) {
        activity = '😱 FLEEING threat';
        actClass = 'sr-alert';
      } else if (dummy.getData('isFollowing')) {
        const tgt = dummy.getData('followTarget');
        activity = `🔪 stalking ${tgt?.name || '?'}`;
        actClass = 'sr-alert';
      } else if (dummy.getData('isWorking')) {
        const t = dummy.getData('currentTaskName') || '?';
        activity = role === 'impostor' ? `🎭 faking ${t}` : `🔧 ${t}`;
      } else if (dummy.getData('isTravelling')) {
        const loc = this.getLocation(dummy.x, dummy.y);
        activity = `🚶 ${loc || 'moving'}`;
      } else {
        const loc = this.getLocation(dummy.x, dummy.y);
        activity = `💤 ${loc || 'idle'}`;
      }

      html += `<div class="sr-entry">
        <span class="sr-dot" style="background:${colorHex};box-shadow:0 0 5px ${colorHex}66"></span>
        <span class="sr-name">${dummy.name}</span>
        <span class="sr-action ${actClass}">${activity}</span>
      </div>`;
    });

    if (!anyShown) {
      html += `<div style="color:rgba(255,255,255,0.2);font-size:9px;padding:3px 0">
        ${this.playerRole === 'impostor' ? 'No other impostors alive.' : 'No crewmates alive.'}
      </div>`;
    }

    // ── RECENT LOG ────────────────────────────────────────────────────────────
    html += `<div class="sr-section-header" style="margin-top:7px">◉ Recent Events</div>`;

    const filteredLog = this.shipReportLog
      .filter((e) => {
        if (this.playerRole === 'impostor')
          return e.role === 'impostor' || e.role === 'event';
        return e.role === 'crewmate' || e.role === 'event';
      })
      .slice(-10)
      .reverse();

    if (filteredLog.length === 0) {
      html += `<div style="color:rgba(255,255,255,0.18);font-size:9px;padding:3px 0">No events logged yet.</div>`;
    } else {
      filteredLog.forEach((entry) => {
        const elapsed = Math.max(
          0,
          Math.floor((this.time.now - entry.time) / 1000),
        );
        const timeStr =
          elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m`;
        html += `<div class="sr-log-entry">
          <span class="sr-time">${timeStr}</span>
          <span class="sr-dot" style="background:${entry.colorHex}"></span>
          <span class="sr-name">${entry.name}</span>
          <span class="sr-action">${entry.action}</span>
        </div>`;
      });
    }

    panel.innerHTML = html;
  }

  applyColorPreset(sprite: any, colorName: string) {
    sprite.setData('colorName', colorName);
    const preset = CrewmateColors[colorName] || CrewmateColors['red'];
    const p = Phaser.Display.Color.ValueToColor(preset.primary);
    const s = Phaser.Display.Color.ValueToColor(preset.secondary);

    sprite.setPostPipeline('RGBMask');
    const fx = sprite.getPostPipeline('RGBMask') as any;
    fx.primaryRGB = [p.redGL, p.greenGL, p.blueGL];
    fx.secondaryRGB = [s.redGL, s.greenGL, s.blueGL];
  }

  createButton(
    x: number,
    y: number,
    key: string,
    hotkey: string,
    onClickCallBack: () => void,
  ) {
    const baseScale = 1;
    const btn = this.add
      .image(x, y, key)
      .setScrollFactor(0)
      .setDepth(300)
      .setAlpha(0.3)
      .setInteractive();
    const cdText = this.add
      .text(x, y, '', {
        fontSize: '40px',
        fontStyle: 'Orbitron',
        fontFamily: 'bold',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);
    btn.setData('cdText', cdText);

    btn.on('pointerover', () =>
      this.tweens.add({
        targets: btn,
        scale: baseScale * 1.1,
        duration: 100,
        ease: 'Sine.easeOut',
      }),
    );
    btn.on('pointerout', () => {
      this.tweens.add({
        targets: btn,
        scale: baseScale,
        duration: 100,
        ease: 'Sine.easeOut',
      });
      btn.clearTint();
    });
    btn.on('pointerdown', () => {
      btn.setTint(0x888888);
      this.tweens.add({
        targets: btn,
        scale: baseScale * 0.9,
        duration: 50,
        ease: 'Sine.easeInOut',
      });
      onClickCallBack();
    });
    btn.on('pointerup', () => btn.clearTint());

    this.input.keyboard?.on(`keydown-${hotkey}`, () => {
      if (btn.getData('isActive')) {
        this.tweens.add({
          targets: btn,
          scale: baseScale * 0.8,
          duration: 50,
          yoyo: true,
          ease: 'Sine.easeInOut',
        });
        onClickCallBack();
      }
    });
    return btn;
  }

  setPlayerRole(role: 'crewmate' | 'impostor') {
    this.playerRole = role;
    if (this.uiGroup) this.uiGroup.clear(true, true);
    else this.uiGroup = this.add.group();

    const sw = this.cameras.main.width;
    const sh = this.cameras.main.height;

    const useBtn = this.createButton(
      sw - 220,
      sh - 120,
      'btn_use',
      'SPACE',
      () => this.executeTasks(),
    );
    const reportBtn = this.createButton(
      sw - 380,
      sh - 280,
      'btn_report',
      'R',
      () => this.executeReport(this.player.name),
    );
    this.uiGroup.add(useBtn);
    this.uiGroup.add(reportBtn);

    if (this.playerRole === 'impostor') {
      this.uiGroup.add(
        this.createButton(sw - 530, sh - 130, 'btn_sabotage', 'SPACE', () =>
          this.executeSabotage(this.player),
        ),
      );
      this.uiGroup.add(
        this.createButton(sw - 220, sh - 280, 'btn_kill', 'Q', () =>
          this.executeKill(this.player, this.currentTarget),
        ),
      );
      this.uiGroup.add(
        this.createButton(sw - 380, sh - 130, 'btn_vent', 'SPACE', () =>
          this.executeVent(
            this.player,
            this.currVentPos[0],
            this.currVentPos[1],
            this.targetVent!,
          ),
        ),
      );
    }

    this.progressBarBg = this.add
      .rectangle(sw - 350, 100, 300, 30, 0x444444)
      .setScrollFactor(0)
      .setDepth(900)
      .setStrokeStyle(4, 0xffffff);
    this.progressBarBg = this.add
      .rectangle(sw - 350, 100, 300, 30, 0x000000)
      .setScrollFactor(0)
      .setDepth(1000)
      .setStrokeStyle(4, 0x333333);
    this.progressBarFill = this.add
      .rectangle(sw - 500, 100, 0, 26, 0x00ff00)
      .setScrollFactor(0)
      .setDepth(1001);
    this.renderTaskList();
  }

  executeKill(
    killer: Phaser.Physics.Arcade.Sprite,
    victim: Phaser.Physics.Arcade.Sprite,
  ) {
    const nextKillTime = killer.getData('nextKillTime') || 0;
    const victimRole =
      victim.name === this.player.name
        ? this.playerRole
        : victim.getData('role');
    console.warn(victimRole, victim.name);

    if (
      this.time.now < nextKillTime ||
      victimRole === 'impostor' ||
      !victim ||
      victim.getData('isDead')
    )
      return;

    victim.setData('isDead', true);
    this.reallocateTasks(victim);
    (victim.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    victim.setData('isTravelling', false);
    victim.setData('currentPath', []);
    victim.stop();
    victim.play('die');
    this.sound.play('kill', { volume: 0.5 });
    this.broadcastKill(killer.name, victim.name, victim.x, victim.y);
    killer.setPosition(victim.x, victim.y);
    killer.setData('nextKillTime', this.time.now + 10 * 1000);
    killer.setData('currentTarget', null);
    if (killer.name === this.player.name) {
      this.currentTarget = null;
      //  alert & ship log when player kills
      this.showAlert(
        `You eliminated ${victim.name}. Vent away!`,
        'danger',
        4000,
      );
    }
    //  log the kill for the ship report
    const kRole =
      killer.name === this.player.name
        ? this.playerRole
        : killer.getData('role') || 'impostor';
    this.addToShipLog(
      killer.name,
      this.getColorHex(killer),
      `killed ${victim.name}`,
      kRole,
    );

    this.checkWinCondition();
  }

  executeReport(reportedBy: string) {
    if (!this.reportTarget && !this.isMeetingCalled) return;
    if (this.isSabotaged) {
      this.isSabotaged = false;
      this.toggleLight(true);
      this.sound.stopByKey('sabotage');
      // ← NEW
      this.showAlert('Lights restored — meeting called!', 'success', 2500);
    }
    //  meeting alert
    if (reportedBy === this.player.name) {
      this.showAlert('Emergency Meeting! Called by YOU.', 'warning', 3500);
    } else {
      this.showAlert(
        `Emergency Meeting! ${reportedBy.toUpperCase()} called it.`,
        'warning',
        3500,
      );
    }

    const tableX = 2250,
      tableY = 500;
    const survivors = [this.player];
    this.dummies.getChildren().forEach((d: any) => {
      if (!d.getData('isDead')) survivors.push(d);
    });
    const reporterSprite =
      reportedBy === this.player.name
        ? this.player
        : this.dummies.getChildren().find((d: any) => d.name === reportedBy);
    if (reporterSprite) {
      const reporterZone = reporterSprite.getData('visibleZone');
      const visionRadius = 400;
      if (reporterZone) {
        this.physics.overlap(reporterZone, this.dummies, (_zone, d) => {
          const dummy = d as Phaser.Physics.Arcade.Sprite;
          if (dummy.name === reportedBy || dummy.getData('isDead')) return;
          const dist = Phaser.Math.Distance.Between(
            reporterSprite.x,
            reporterSprite.y,
            dummy.x,
            dummy.y,
          );
          reporterSprite
            .getData('memory')
            .writeBodyProximity(dummy.name, dist, visionRadius);
        });
      }
    }

    this.sound.play('report');
    this.time.delayedCall(5000, () => {
      this.showAlert(
        `Your chat are actively analaysed by the LLMs to decided whether to judge you and decide whether to vote you out , stay on your side or flee away from you, So chat with caution`,
        'warning',
        10000,
      );
    });
    Phaser.Actions.PlaceOnCircle(
      survivors,
      new Phaser.Geom.Circle(tableX, tableY, 180),
    );
    this.broadcastMajorEvent(
      `Emergency Meeting / Dead Body reported by ${reportedBy.toUpperCase()}`,
    );
    this.physics.pause();
    this.scene.pause();
    if ((window as any).triggerMeeting) {
      (window as any).triggerMeeting(this.getPlayerDataForMeeting());
    }
  }

  executeTasks() {
    if (this.currentTask === 'emergency_button') {
      const meetRem = this.player.getData('emergencyMeetingRem');
      if (meetRem > 0) {
        this.player.setData('emergencyMeetingRem', meetRem - 1);
        this.isMeetingCalled = true;
        this.sound.play('emergencyMeeting', { volume: 0.3 });
        setTimeout(() => {
          this.executeReport(this.player.name);
        }, 1500);
      } else {
        this.showAlert(
          'You have only 1 emergency meeting , use it carefully !!',
          'danger',
          2000,
        );
      }
    } else {
      this.physics.pause();
      this.scene.pause();
      if ((window as any).triggerTask) {
        (window as any).triggerTask(this.currentTask);
      }
    }
  }

  executeVent(
    ventingSprite: Phaser.Physics.Arcade.Sprite,
    startX: number,
    startY: number,
    targetVentName: string,
  ) {
    let exitX = 0,
      exitY = 0;
    if (ventingSprite.name === this.player.name) this.isIdle = false;

    const targetVent = this.ventGroup
      .getChildren()
      .find(
        (v: any) => v.getData('currVent') === targetVentName,
      ) as Phaser.GameObjects.Zone;
    if (targetVent) {
      exitX = targetVent.x;
      exitY = targetVent.y;
    } else {
      exitX = 2646;
      exitY = 580;
    }

    ventingSprite.setPosition(startX, startY);
    this.sound.play('vent');
    //  ship log entry for venting
    const vRole =
      ventingSprite.name === this.player.name
        ? this.playerRole
        : ventingSprite.getData('role') || 'impostor';
    this.addToShipLog(
      ventingSprite.name,
      this.getColorHex(ventingSprite),
      `vented → ${targetVentName}`,
      vRole,
    );

    setTimeout(() => {
      ventingSprite.play('vent');
    }, 120);
    this.broadcastVent(ventingSprite.name, startX, startY);

    setTimeout(() => {
      ventingSprite.setPosition(exitX, exitY);
      if (ventingSprite.body) {
        (ventingSprite.body as Phaser.Physics.Arcade.Body).reset(exitX, exitY);
      }
      ventingSprite.setAlpha(1);
      ventingSprite.play('idle', true);
      // ventingSprite.stop();
      // ventingSprite.setTexture('player_walk');
      // ventingSprite.setFrame(12);
      ventingSprite.setData('isGoingToVent', false);
      ventingSprite.setData('isWorking', false);
      ventingSprite.setData('isTravelling', false);
      ventingSprite.setData('nextRoamTime', this.time.now);
      if (ventingSprite.name === this.player.name) {
        this.isIdle = true;
      } else {
        ventingSprite.setData('isCurrentlyVenting', false);
      }
    }, 1000);
  }

  executeSabotage(impostor: Phaser.Physics.Arcade.Sprite) {
    const nextSabotageTime = impostor.getData('nextSabotageTime') || 0;
    if (this.time.now < nextSabotageTime) return;
    this.isSabotaged = true;
    this.toggleLight(false);
    this.sound.play('sabotage', { volume: 0.5, loop: true });
    impostor.setData('nextSabotageTime', this.time.now + 45 * 1000);
    this.broadcastMajorEvent('The lights were sabotaged');

    //  alert and ship log for sabotage
    this.showAlert(
      'LIGHTS SABOTAGED! Restoring in ~10 seconds...',
      'danger',
      10000,
    );
    this.addToShipLog(
      impostor.name,
      this.getColorHex(impostor),
      'sabotaged the lights',
      impostor.getData('role') || 'impostor',
    );

    this.time.delayedCall(10 * 1000, () => {
      this.isSabotaged = false;
      this.toggleLight(true);
      this.sound.stopByKey('sabotage');
      //  lights-restored alert
      this.showAlert('Lights restored!', 'success', 3000);
    });
  }

  toggleLight(isOn: boolean) {
    this.LightContext.clearRect(0, 0, 3000, 3000);
    const hasFullVision = this.playerRole === 'impostor' ? true : isOn;
    const gradient = this.LightContext!.createRadialGradient(
      1500,
      1500,
      50,
      1500,
      1500,
      1500,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(
      !hasFullVision ? 0.02 : 0.3,
      'rgba(255, 255, 255, 0.6)',
    );
    gradient.addColorStop(
      !hasFullVision ? 0.05 : 0.5,
      'rgba(255, 255, 255, 0.05)',
    );
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.LightContext!.fillStyle = gradient;
    this.LightContext!.fillRect(0, 0, 3000, 3000);
    this.LightTexture.refresh();
  }

  broadcastVent(venterName: string, ventX: number, ventY: number) {
    this.visibleZones.getChildren().forEach((z: any) => {
      const zone = z as Phaser.GameObjects.Zone;
      const observerName = zone.getData('visibleZoneOwner');
      const body = zone.body as Phaser.Physics.Arcade.Body;
      if (observerName === venterName) return;

      const isInside =
        ventX >= body.x &&
        ventX <= body.right &&
        ventY >= body.y &&
        ventY <= body.bottom;
      if (isInside) {
        //  alert when player witnesses a vent
        if (
          observerName === this.player.name &&
          !this.player.getData('isDead')
        ) {
          this.showAlert(
            `You saw ${venterName} VENT! Report it!`,
            'warning',
            6000,
          );
        }

        const observerSprite = this.dummies
          .getChildren()
          .find((d: any) => d.name === observerName) as any;
        if (observerSprite) {
          const room = this.getLocation(ventX, ventY);
          if (observerSprite.getData('role') !== 'impostor') {
            const venterSprite =
              venterName === this.player.name
                ? this.player
                : (this.dummies
                    .getChildren()
                    .find(
                      (d: any) => d.name === venterName,
                    ) as Phaser.Physics.Arcade.Sprite);
            this.triggerPanicState(observerSprite, venterSprite);
            observerSprite.setData('venterName', venterName);
          }
          observerSprite
            .getData('memory')
            .writeAllegation(venterName, 'VENTING', room);
        }
      }
    });
  }

  broadcastKill(
    killerName: string,
    victimName: string,
    killX: number,
    killY: number,
  ) {
    this.visibleZones.getChildren().forEach((z: any) => {
      const zone = z as Phaser.GameObjects.Zone;
      const observerName = zone.getData('visibleZoneOwner');
      const body = zone.body as Phaser.Physics.Arcade.Body;

      if (observerName === killerName || observerName === victimName) return;

      const isInside =
        killX >= body.x &&
        killX <= body.right &&
        killY >= body.y &&
        killY <= body.bottom;
      if (isInside) {
        //  alert when player witnesses a kill
        if (
          observerName === this.player.name &&
          !this.player.getData('isDead')
        ) {
          this.showAlert(
            `You saw ${killerName} KILL ${victimName}! Report it!`,
            'danger',
            7000,
          );
        }

        const observerSprite = this.dummies
          .getChildren()
          .find((d: any) => d.name === observerName) as any;
        if (observerSprite && !observerSprite.getData('isDead')) {
          const room = this.getLocation(killX, killY);
          observerSprite
            .getData('memory')
            .writeAllegation(killerName, 'KILLING', room);
          if (observerSprite.getData('role') !== 'impostor') {
            const venterSprite =
              killerName === this.player.name
                ? this.player
                : (this.dummies
                    .getChildren()
                    .find(
                      (d: any) => d.name === killerName,
                    ) as Phaser.Physics.Arcade.Sprite);
            this.triggerPanicState(observerSprite, venterSprite);
            observerSprite.setData('venterName', killerName);
          }
        }
      }
    });
  }
  broadcastMajorEvent(eventName: string) {
    if (!this.player.getData('isDead'))
      this.player.getData('memory')?.writeGlobalEvent(eventName);
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (!dummy.getData('isDead'))
        dummy.getData('memory')?.writeGlobalEvent(eventName);
    });
  }
  easyStarPathTraveller(
    dummy: Phaser.Physics.Arcade.Sprite,
    endX: number,
    endY: number,
  ) {
    if (!this.easystar) return;
    const maxCols = this.grids[0].length - 1;
    const maxRows = this.grids.length - 1;

    let startGridX = Phaser.Math.Clamp(
      Math.floor(dummy.x / TILE_SIZE),
      0,
      maxCols,
    );
    let startGridY = Phaser.Math.Clamp(
      Math.floor(dummy.y / TILE_SIZE),
      0,
      maxRows,
    );
    let endGridX = Phaser.Math.Clamp(Math.floor(endX / TILE_SIZE), 0, maxCols);
    let endGridY = Phaser.Math.Clamp(Math.floor(endY / TILE_SIZE), 0, maxRows);

    // ════════════════════════════════════════════════════════════════════
    // 🛡️ THE FIX: BULLETPROOF START & END NODES
    // ════════════════════════════════════════════════════════════════════
    // If the bot spawned on a wall, snap its starting brain to the floor
    const safeStart = this.findClosestWalkable(startGridX, startGridY);
    startGridX = safeStart.x;
    startGridY = safeStart.y;

    // If the Task Panel is inside a wall, snap their destination to the floor in front of it
    const safeEnd = this.findClosestWalkable(endGridX, endGridY);
    endGridX = safeEnd.x;
    endGridY = safeEnd.y;
    // ════════════════════════════════════════════════════════════════════

    this.easystar.findPath(
      startGridX,
      startGridY,
      endGridX,
      endGridY,
      (path: any) => {
        if (dummy.getData('isDead')) return;
        if (path === null) {
          dummy.setData('currentPath', []);
          dummy.setData('isTravelling', false);
        } else {
          const worldPath = path.map((node: any) => ({
            x: node.x * TILE_SIZE + TILE_SIZE / 2,
            y: node.y * TILE_SIZE + TILE_SIZE / 2,
          }));
          dummy.setData('currentPath', worldPath);
          dummy.setData('isTravelling', true);
        }
      },
    );
    this.easystar.calculate();
  }

  updateTaskProgress() {
    let totalTasks = 0;
    let completedTasks = 0;
    if (this.playerRole === 'crewmate') {
      totalTasks += this.player.getData('todoTasksIndex')?.length || 0;
      completedTasks += this.player.getData('completedTasks')?.length || 0;
    }
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (dummy.getData('role') === 'crewmate') {
        totalTasks += dummy.getData('todoTasksIndex')?.length || 0;
        completedTasks += dummy.getData('currTaskIndex') || 0;
      }
    });
    if (totalTasks === 0) return;
    const percentage = completedTasks / totalTasks;
    const maxBarWidth = 300;

    this.tweens.add({
      targets: this.progressBarFill,
      width: maxBarWidth * percentage,
      duration: 500,
      ease: 'Sine.easeOut',
    });
    if (percentage >= 1) {
      if ((window as any).triggerGameOver) {
        (window as any).triggerGameOver('crewmate');
      }
    }
    this.renderTaskList();
  }

  reallocateTasks(victim: Phaser.Physics.Arcade.Sprite) {
    const victimRole =
      victim === this.player ? this.playerRole : victim.getData('role');
    if (victimRole !== 'crewmate') return;

    let remainingTasks: number[] = [];
    const todo = victim.getData('todoTasksIndex') || [];

    if (victim.name === this.player.name) {
      const completedNames = victim.getData('completedTasks') || [];
      remainingTasks = todo.filter((taskIndex: number) => {
        const taskName = ALL_TASKS[taskIndex].name;
        return !completedNames.includes(taskName);
      });
    } else {
      const curr = victim.getData('currTaskIndex') || 0;
      remainingTasks = todo.slice(curr);
    }

    if (remainingTasks.length === 0) return;

    const aliveWorkers: Phaser.Physics.Arcade.Sprite[] = [];
    if (this.playerRole === 'crewmate' && !this.player.getData('isDead'))
      aliveWorkers.push(this.player);
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (dummy.getData('role') === 'crewmate' && !dummy.getData('isDead'))
        aliveWorkers.push(dummy);
    });

    if (aliveWorkers.length === 0) return;
    const numberOfTasksToKeep = Math.floor(remainingTasks.length / 2);
    const halfRemainingTasks = remainingTasks.slice(0, numberOfTasksToKeep);
    halfRemainingTasks.forEach((taskIndex: number, i: number) => {
      const unluckyWorker = aliveWorkers[i % aliveWorkers.length];
      const theirTasks = unluckyWorker.getData('todoTasksIndex') || [];
      theirTasks.push(taskIndex);
      unluckyWorker.setData('todoTasksIndex', theirTasks);
      unluckyWorker.setData('isAllTaskDone', false);
    });

    victim.setData('todoTasksIndex', []);
    if (victim.name === this.player.name) victim.setData('completedTasks', []);
    else victim.setData('currTaskIndex', 0);
    this.renderTaskList();
  }

  renderTaskList() {
    if (this.taskListGroup) this.taskListGroup.clear(true, true);
    else this.taskListGroup = this.add.group();

    if (this.playerRole === 'impostor' || this.player.getData('isDead')) return;

    const todo = this.player.getData('todoTasksIndex') || [];
    const completed = this.player.getData('completedTasks') || [];

    const startX = this.cameras.main.width - 350;
    let startY = 150;

    todo.forEach((taskIndex: number) => {
      const taskName = ALL_TASKS[taskIndex].name;
      const isCompleted = completed.includes(taskName);
      const textColor = isCompleted ? '#00ff00' : '#ff4444';
      const prefix = isCompleted ? '✓ ' : '☐ ';

      const taskText = this.add
        .text(startX, startY, prefix + taskName, {
          fontSize: '18px',
          fontFamily: 'Orbitron',
          color: textColor,
          fontStyle: 'bold',
        })
        .setScrollFactor(0)
        .setDepth(400);
      if (isCompleted) taskText.setAlpha(0.4);
      this.taskListGroup.add(taskText);
      startY += 25;
    });
  }

  checkWinCondition() {
    let aliveCrew = 0;
    let aliveImpostors = 0;

    // 1. Count the human player exactly once
    if (!this.player.getData('isDead')) {
      if (this.playerRole === 'crewmate') aliveCrew++;
      else if (this.playerRole === 'impostor') aliveImpostors++;
    } else {
      this.player.setVelocity(0); // Keep their corpse still
    }

    // 2. Count the AI bots
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (!dummy.getData('isDead')) {
        if (dummy.getData('role') === 'crewmate') aliveCrew++;
        else if (dummy.getData('role') === 'impostor') aliveImpostors++;
      }
    });

    // 3. TRIGGER VICTORIES (Fixed bracket nesting)
    if (aliveImpostors === 0) {
      console.log('CREWMATES WIN! The Impostor is dead.');
      this.physics.pause();
      if ((window as any).triggerGameOver) {
        (window as any).triggerGameOver('crewmate');
      }
    } else if (aliveCrew === 0) {
      console.log('IMPOSTOR WINS! All crewmates are dead.');
      this.physics.pause();
      if ((window as any).triggerGameOver) {
        (window as any).triggerGameOver('impostor');
      }
    }
    // NEW: Instantly end if the human player dies (so you don't stare at a blank screen)
    else if (this.player.getData('isDead')) {
      console.log('YOU DIED! Game Over.');
      this.physics.pause();
      if ((window as any).triggerGameOver) {
        (window as any).triggerGameOver(
          this.playerRole === 'impostor' ? 'crewmate' : 'impostor',
        );
      }
    }
  }

  processEjection(ejectedId: string | null) {
    if (!ejectedId) return;

    //  ejection alert
    if (ejectedId === this.player.name) {
      this.showAlert('You were ejected into the void!', 'danger', 6000);
    } else {
      this.showAlert(
        ` ${ejectedId.toUpperCase()} was ejected!`,
        'warning',
        5000,
      );
    }

    if (this.player.name === ejectedId) {
      this.player.setData('isDead', true);
      this.player.setVisible(false);
      if (this.player.body) this.player.body.enable = false;
      this.killZone.destroy();
      this.playerInteractZone.destroy();
      this.reallocateTasks(this.player);
    } else {
      const dummy = this.dummies
        .getChildren()
        .find((d: any) => d.name === ejectedId) as Phaser.Physics.Arcade.Sprite;
      if (dummy) {
        dummy.setData('isDead', true);
        dummy.setVisible(false);
        if (dummy.body) dummy.body.enable = false;

        const vz = dummy.getData('visibleZone');
        if (vz) {
          vz.destroy();
          dummy.setData('visibleZone', null);
        }

        const iz = dummy.getData('interactZone');
        if (iz) {
          iz.destroy();
          dummy.setData('interactZone', null);
        }

        const pz = dummy.getData('personalZone');
        if (pz) {
          pz.destroy();
          dummy.setData('personalZone', null);
        }

        dummy.setData('isWorking', false);
        dummy.setData('isTravelling', false);
        dummy.setData('currentPath', []);
        this.reallocateTasks(dummy);
      }
    }
    this.checkWinCondition();
  }

  getPlayerDataForMeeting(): PlayerData[] {
    const data: PlayerData[] = [
      { id: 'chris', color: 'red', isDead: false, isMe: true, votes: 0 },
    ];
    this.dummies.getChildren().forEach((d: any) => {
      data.push({
        id: d.name || 'Bot',
        color: d.getData('colorName') || 'yellow',
        isDead: d.getData('isDead') || false,
        isMe: false,
        votes: 0,
      });
    });
    return data;
  }

  getLocation(x: number, y: number): string {
    const loc = this.LocationZones.find((r) =>
      Phaser.Geom.Rectangle.Contains(r.rect, x, y),
    );
    return loc ? loc.name : 'a hallway';
  }

  getLocationCoordinates(name: string): { x: number; y: number } {
    const foundLocation = this.LocationZones.find((loc) => loc.name === name);
    if (foundLocation)
      return {
        x: foundLocation.rect.x + foundLocation.rect.width / 2,
        y: foundLocation.rect.y + foundLocation.rect.height / 2,
      };
    return { x: 2600, y: 500 };
  }

  getTaskCoordinates(name: string): { x: number; y: number } {
    const foundTask = this.taskGroup
      .getChildren()
      .find((task) => task.name === name);
    if (foundTask) {
      const body = foundTask.body as Phaser.Physics.Arcade.Body;
      return { x: body?.x + body?.halfWidth, y: body?.y + body?.halfHeight };
    }
    return { x: 2600, y: 500 };
  }

  getVentCoordinates(name: string): { x: number; y: number } {
    const foundTask = this.ventGroup
      .getChildren()
      .find((task) => task.name === name);
    if (foundTask) {
      const body = foundTask.body as Phaser.Physics.Arcade.Body;
      return { x: body?.x + body?.halfWidth, y: body?.y + body?.halfHeight };
    }
    return { x: 2600, y: 500 };
  }

  getJitteredDestination(
    baseX: number,
    baseY: number,
    radius: number = 40,
  ): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const jitterX = baseX + Math.cos(angle) * distance;
    const jitterY = baseY + Math.sin(angle) * distance;
    const gridX = Math.floor(jitterX / TILE_SIZE);
    const gridY = Math.floor(jitterY / TILE_SIZE);
    if (
      gridY >= 0 &&
      gridY < this.grids.length &&
      gridX >= 0 &&
      gridX < this.grids[0].length &&
      this.grids[gridY][gridX] === 0
    ) {
      return { x: jitterX, y: jitterY };
    }
    return { x: baseX, y: baseY };
  }

  requestSusVote(dummyName: string, aliveIds: string[]): string {
    const dummy = this.dummies
      .getChildren()
      .find((d: any) => d.name === dummyName) as Phaser.Physics.Arcade.Sprite;
    if (dummy) {
      const memory = dummy.getData('memory') as Memory;
      return memory.getVoteDecision(aliveIds);
    }
    return 'skip';
  }

  requestBotMemory(botName: string): string {
    let mem: string = '';
    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (dummy.name === botName) {
        const memory = dummy.getData('memory');
        if (dummy.getData('role') === 'crewmate') {
          const data = memory.getImpostorData();
          mem = `Alibi to use: ${data.fakeActions.join(', ')} | True location: ${data.realActions.join(', ')}`;
        } else {
          const data = memory.getCrewmateData();
          mem = `My Actions: ${data.myActions.join(', ')} | Observations: ${data.observations.join(', ')} | Hard Evidence: ${data.hardEvidence.join(', ')} | Highly sus on: ${data.highlySusOn}`;
        }
      }
    });
    return mem;
  }
  requestBotRole(botName: string): string {
    const dummy = this.dummies
      .getChildren()
      .find((d: any) => d.name === botName) as Phaser.Physics.Arcade.Sprite;
    if (dummy) {
      return dummy.getData('role');
    }
    return 'crewmate';
  }
  requestSetPlayerRole(playerRole: 'crewmate' | 'impostor'): void {
    // Roll the dice for the human player
    if (playerRole === 'impostor') {
      this.isDummyImpostor = false;
    } else {
      this.isDummyImpostor = true;
      this.dummyRoles = ['impostor', 'crewmate', 'crewmate', 'crewmate']; // The player is innocent, so we hide 1 impostor among the 4 bots
      Phaser.Utils.Array.Shuffle(this.dummyRoles);
    }

    this.setPlayerRole(playerRole);
    let i = 0;
    this.dummies.children.iterate((dummy: any) => {
      dummy.setData('role', this.dummyRoles[i]);
      i++;
    });
  }
  updateBotMemoryFromMeeting(botName: string, shifts: Record<string, number>) {
    const dummy = this.dummies
      .getChildren()
      .find((d: any) => d.name === botName);
    if (dummy) {
      const memory = dummy.getData('memory') as Memory;
      memory.applyMeetingBasedShift(shifts);
    }
  }
  calculateEscapePoint(
    dummy: Phaser.Physics.Arcade.Sprite,
    threat: Phaser.Physics.Arcade.Sprite,
    maxDistance: number,
  ) {
    const angleAway = Phaser.Math.Angle.Between(
      threat.x,
      threat.y,
      dummy.x,
      dummy.y,
    );
    const anglesToTest = [
      0, 0.26, -0.26, 0.52, -0.52, 0.78, -0.78, 1.04, -1.04, 1.57, -1.57,
    ];

    let bestPoint = null;
    let maxClearDist = 0;

    for (const offset of anglesToTest) {
      const testAngle = angleAway + offset;
      let clearDist = 0;
      let lastSafeX = dummy.x;
      let lastSafeY = dummy.y;

      for (let d = TILE_SIZE; d <= maxDistance; d += TILE_SIZE) {
        const testX = dummy.x + Math.cos(testAngle) * d;
        const testY = dummy.y + Math.sin(testAngle) * d;
        const gridX = Math.floor(testX / TILE_SIZE);
        const gridY = Math.floor(testY / TILE_SIZE);
        if (
          gridY < 0 ||
          gridY >= this.grids.length ||
          gridX < 0 ||
          gridX >= this.grids[0].length ||
          this.grids[gridY][gridX] === 1
        ) {
          break;
        }
        clearDist = d;
        lastSafeX = testX;
        lastSafeY = testY;
      }

      if (clearDist > maxClearDist) {
        maxClearDist = clearDist;
        bestPoint = { x: lastSafeX, y: lastSafeY };
      }
      if (maxClearDist >= maxDistance) break;
    }

    if (!bestPoint || maxClearDist < TILE_SIZE * 2) {
      return { x: emergency_button_loc.x, y: emergency_button_loc.y };
    }
    return bestPoint;
  }

  commandBotToSpot(
    dummy: Phaser.Physics.Arcade.Sprite,
    targetX: number,
    targetY: number,
  ) {
    dummy.setData('isTravelling', true);
    this.easyStarPathTraveller(dummy, targetX, targetY);
  }

  commandBotToFollow(
    dummy: Phaser.Physics.Arcade.Sprite,
    target: Phaser.Physics.Arcade.Sprite,
  ) {
    dummy.setData('isFollowing', true);
    dummy.setData('followTarget', target);
    dummy.setData('lastPingTime', 0);
  }
  triggerPanicState(
    dummy: Phaser.Physics.Arcade.Sprite,
    threat: Phaser.Physics.Arcade.Sprite,
  ) {
    dummy.setData('isWorking', false);
    dummy.setData('isGoingToTask', false);
    dummy.setData('isFollowing', false);
    const meetingsLeft = dummy.getData('emergencyMeetingRem');
    if (meetingsLeft > 0) {
      dummy.setData('isPanicking', true);
      dummy.setData('isFleeing', false);
      const jitteredLoc = this.getJitteredDestination(
        emergency_button_loc.x,
        emergency_button_loc.y,
        35,
      );
      this.commandBotToSpot(dummy, jitteredLoc.x, jitteredLoc.y);
    } else {
      dummy.setData('isPanicking', false);
      dummy.setData('isFleeing', true);
      dummy.setData('activeThreat', threat);
      dummy.setData('lastThreatTime', this.time.now);
      dummy.setData('lastFleePing', 0);
      dummy.setData('isTravelling', false);
      dummy.setData('currentPath', []);
    }
  }

  findClosestWalkable(gridX: number, gridY: number): { x: number; y: number } {
    if (this.grids[gridY][gridX] === 0) return { x: gridX, y: gridY };
    const neighbours = [
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: -1, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: -2 },
      { x: 2, y: 0 },
      { x: -2, y: 0 },
    ];
    const maxCols = this.grids[0].length;
    const maxRows = this.grids.length;
    for (let i = 0; i < neighbours.length; i++) {
      const nx = gridX + neighbours[i].x;
      const ny = gridY + neighbours[i].y;
      if (nx >= 0 && nx < maxCols && ny >= 0 && ny < maxRows) {
        if (this.grids[ny][nx] === 0) return { x: nx, y: ny };
      }
    }
    return { x: gridX, y: gridY };
  }

  resumeGameAfterMeeting() {
    this.isMeetingCalled = false;
    this.reportTarget = false;
    this.currentTask = null;

    if (this.player.getData('isDead')) {
      this.player.setData('isSwept', true);
      this.player.setVisible(false);
      if (this.player.body) this.player.body.enable = false;
    }

    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      dummy.setData('isPanicking', false);
      dummy.setData('isTravelling', false);
      dummy.setData('isWorking', false);
      dummy.setData('isGoingToTask', false);
      dummy.setData('isFleeing', false);
      dummy.setData('activeThreat', null);
      dummy.setData('currentPath', []);

      if (dummy.getData('isDead') && !dummy.getData('isSwept')) {
        dummy.setData('isSwept', true);
        dummy.setVisible(false);
        if (dummy.body) dummy.body.enable = false;

        const vz = dummy.getData('visibleZone');
        if (vz) {
          vz.destroy();
          dummy.setData('visibleZone', null);
        }
        const iz = dummy.getData('interactZone');
        if (iz) {
          iz.destroy();
          dummy.setData('interactZone', null);
        }
        const pz = dummy.getData('personalZone');
        if (pz) {
          pz.destroy();
          dummy.setData('personalZone', null);
        }
      }
    });

    if (this.input.keyboard) this.input.keyboard.resetKeys();
    this.scene.resume();
    this.physics.resume();
  }

  completePlayerTask(completedTaskID: string) {
    const completed = this.player.getData('completedTasks') || [];
    if (!completed.includes(completedTaskID)) {
      completed.push(completedTaskID);
      this.player.setData('completedTasks', completed);
      //  task completion alert for player
      this.showAlert(`Task complete: ${completedTaskID}`, 'success', 3000);
      this.addToShipLog(
        'chris',
        '#ff5544',
        `completed ${completedTaskID}`,
        'crewmate',
      );
    }
    this.updateTaskProgress();
    this.currentTask = null;
    this.scene.resume();
    this.physics.resume();
  }

  preload() {
    this.load.image('map_Skeld', '/maps/Skeld_4k.png');
    this.load.image('mini_map', '/maps/mini_map.png');
    this.load.image('btn_use', '/buttons/use.png');
    this.load.image('btn_report', '/buttons/report.png');
    this.load.image('btn_kill', '/buttons/kill.png');
    this.load.image('btn_vent', '/buttons/vent.png');
    this.load.image('btn_sabotage', '/buttons/sabotage.png');
    this.load.spritesheet('player_walk', '/sprites/player_walk.png', {
      frameWidth: 366,
      frameHeight: 320,
      spacing: 5,
    });
    this.load.atlas(
      'player_dead',
      '/sprites/dead/player_dead.png',
      '/sprites/dead/player_dead.json',
    );
    this.load.atlas(
      'player_vent',
      '/sprites/vent/player_vent.png',
      '/sprites/vent/player_vent.json',
    );
    this.load.json('level_design', '/maps/level_design.json');
    this.load.audio('sabotage', '/audio/crisis.mp3');
    this.load.audio('kill', '/audio/kill.mp3');
    this.load.audio('report', '/audio/report.mp3');
    this.load.audio('emergencyMeeting', '/audio/emergencyMeeting.mp3');
    this.load.audio('vent', '/audio/vent.mp3');
    this.load.audio('walk', '/audio/walk.mp3');
  }

  create() {
    // [BRIDGING AREA]
    (window as any).resumePhaserGame = this.resumeGameAfterMeeting.bind(this);
    (window as any).completedPlayerTasks = this.completePlayerTask.bind(this);
    (window as any).processEjection = this.processEjection.bind(this);
    (window as any).requestSusVote = this.requestSusVote.bind(this);
    (window as any).requestBotMemory = this.requestBotMemory.bind(this);
    (window as any).requestBotRole = this.requestBotRole.bind(this);
    (window as any).requestSetPlayerRole = this.requestSetPlayerRole.bind(this);
    (window as any).updateBotMemoryFromMeeting =
      this.updateBotMemoryFromMeeting.bind(this);

    console.log('PHASER JUST ATTACHED THE FUNCTION');
    const map = this.add.image(0, 0, 'map_Skeld').setOrigin(0, 0);
    this.physics.world.setBounds(0, 0, map.width, map.height);
    const mapData = this.cache.json.get('level_design');
    const walls = this.physics.add.staticGroup();
    this.time.delayedCall(100, () => {
      this.updateTaskProgress();
    });
    this.walkSound = this.sound.add('walk', { loop: true });

    this.taskGroup = this.physics.add.staticGroup();
    this.emergencyGroup = this.physics.add.staticGroup();
    this.ventGroup = this.physics.add.staticGroup();

    const collisionLayer = mapData.layers.find(
      (layer: any) => layer.name == 'Collisions',
    );
    const taskLayer = mapData.layers.find(
      (layer: any) => layer.name == 'Tasks',
    );
    const emergencyLayer = mapData.layers.find(
      (layer: any) => layer.name == 'Emergency',
    );
    const ventLayer = mapData.layers.find(
      (layer: any) => layer.name == 'Vents',
    );
    const LocationLayer = mapData.layers.find(
      (layer: any) => layer.name == 'Locations',
    );

    if (collisionLayer && collisionLayer.objects) {
      collisionLayer.objects.forEach((obj: any) => {
        const invisibleWall = this.add.rectangle(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width,
          obj.height,
        );
        this.physics.add.existing(invisibleWall, true);
        invisibleWall.setData('isWall', true);
        walls.add(invisibleWall);
      });
    }

    if (taskLayer && emergencyLayer) {
      taskLayer.objects.forEach((task: any) => {
        const zone = this.add.zone(
          task.x + task.width / 2,
          task.y + task.height / 2,
          task.width,
          task.height,
        );
        zone.name = task.name;
        this.physics.add.existing(zone, true);
        (zone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        zone.setData('taskID', task.name);
        this.taskGroup.add(zone);
      });

      emergencyLayer.objects.forEach((obj: any) => {
        const zone = this.add.zone(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width,
          obj.height,
        );
        this.physics.add.existing(zone, true);
        (zone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        zone.setData('taskID', 'emergency_button');
        this.emergencyGroup.add(zone);
      });
    }

    if (ventLayer) {
      ventLayer.objects.forEach((vent: any) => {
        const zone = this.add.zone(
          vent.x + vent.width / 2,
          vent.y + vent.height / 2,
          vent.width,
          vent.height,
        );
        this.physics.add.existing(zone, true);
        (zone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
        zone.setData(
          'targetVent',
          vent.name.slice(0, 4) + String(Number(vent.name.slice(4)) + 1),
        );
        zone.name = vent.name;
        zone.setData('currVent', vent.name);
        zone.setData('currVentPos', [
          vent.x + vent.width / 2,
          vent.y + vent.height / 2,
        ]);
        this.ventGroup.add(zone);
      });
    }

    if (LocationLayer) {
      LocationLayer.objects.forEach((loc: any) => {
        this.LocationZones.push({
          name: loc.name,
          rect: new Phaser.Geom.Rectangle(loc.x, loc.y, loc.width, loc.height),
        });
      });
    }

    this.mainMapWidth = map.width;
    this.mainMapHeight = map.height;
    this.minimapContainer = this.add
      .container(20, 20)
      .setScrollFactor(0)
      .setDepth(200);
    this.minimap = this.add
      .image(150, 80, 'mini_map')
      .setOrigin(0, 0)
      .setScale(0.1);
    this.minimapContainer.add(this.minimap);
    this.playerDot = this.add.circle(200, 80, 2, 0x00ff00);
    this.minimapContainer.add(this.playerDot);

    this.player = this.physics.add
      .sprite(2460, 480, 'player_walk')
      .setScale(0.3)
      .setCollideWorldBounds(true);
    this.player.body.setSize(20, 20).setOffset(120, 150);
    this.player.name = 'chris';
    this.player.setData('isDead', false);
    this.player.setData('nextKillTime', 15000);
    this.player.setData('currTaskIndex', 0);
    this.player.setData('nextSabotageTime', 30000);
    this.player.setData('memory', new Memory());
    this.player.setData('colorName', 'red'); //  needed for getColorHex
    this.player.setData('emergencyMeetingRem', 1);

    const renderer = this.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    renderer.pipelines.addPostPipeline('RGBMask', RGBMaskPipeline);

    // [DUMMIES]
    this.dummies = this.physics.add.group();
    const dum1 = this.dummies.create(2500, 480, 'player_walk');
    this.applyColorPreset(dum1, 'yellow');
    dum1.name = 'yellow';
    this.isDummyImpostor = true;
    dum1.setData('role', 'crewmate');
    dum1.setData('todoTasksIndex', Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]));
    dum1.setData('isAllTaskDone', false);

    const dum2 = this.dummies.create(2100, 480, 'player_walk');
    this.applyColorPreset(dum2, 'pink');
    dum2.name = 'pink';
    dum2.setData('todoTasksIndex', Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]));
    dum2.setData('isAllTaskDone', false);
    dum2.setData('role', 'crewmate');

    const dum3 = this.dummies.create(2000, 480, 'player_walk');
    this.applyColorPreset(dum3, 'blue');
    dum3.name = 'blue';
    dum3.setData('todoTasksIndex', Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]));
    dum3.setData('isAllTaskDone', false);
    dum3.setData('role', 'crewmate');

    const dum4 = this.dummies.create(2500, 480, 'player_walk');
    this.applyColorPreset(dum4, 'black');
    dum4.name = 'black';
    dum4.setData('todoTasksIndex', Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]));
    dum4.setData('isAllTaskDone', false);
    dum4.setData('role', 'crewmate');
    const allSpawns = [this.player, ...this.dummies.getChildren()];

    Phaser.Actions.PlaceOnCircle(
      allSpawns,
      new Phaser.Geom.Circle(2250, 500, 130),
    );
    this.visibleZones = this.physics.add.group();
    this.dummiesInteractZones = this.physics.add.group();
    this.personalZones = this.physics.add.group();

    this.dummies.children.iterate((dummy: any) => {
      dummy.setData('isDead', false);
      dummy.setData('isFollowing', false);
      dummy.setData('followTarget', []);
      dummy.setData('isWorking', false);
      dummy.setData('emergencyMeetingRem', 1);
      dummy.setData('isGoingToTask', false);
      dummy.setData('completedTasks', []);
      dummy.setData('currTaskIndex', 0);
      dummy.setData('nextKillTime', 15000);
      dummy.setData('nextSabotageTime', 30000);
      dummy.setData('memory', new Memory());
      dummy.setData('isFleeing', false);
      dummy.setData('activeThreat', null);
      dummy.setData('lastThreatTime', 0);
      dummy.setData('lastRadarTick', 0);

      dummy.setScale(0.3).setCollideWorldBounds(true);
      dummy.body.setSize(20, 20).setOffset(120, 150);

      const visibleZone = this.add.zone(dummy.x, dummy.y, 800, 800);
      this.physics.add.existing(visibleZone);
      (visibleZone.body as Phaser.Physics.Arcade.Body).moves = false;
      visibleZone.setData('visibleZoneOwner', dummy.name);
      dummy.setData('visibleZone', visibleZone);
      this.visibleZones.add(visibleZone);

      const dummyInteractZone = this.add.zone(dummy.x, dummy.y, 150, 150);
      this.physics.add.existing(dummyInteractZone);
      (dummyInteractZone.body as Phaser.Physics.Arcade.Body).moves = false;
      dummyInteractZone.setData('interactZoneOwner', dummy.name);
      dummy.setData('interactZone', dummyInteractZone);
      this.dummiesInteractZones.add(dummyInteractZone);

      const personalZone = this.add.zone(dummy.x, dummy.y, 250, 250);
      this.physics.add.existing(personalZone);
      (personalZone.body as Phaser.Physics.Arcade.Body).moves = false;
      personalZone.setData('ownerName', dummy.name);
      dummy.setData('personalZone', personalZone);
      this.personalZones.add(personalZone);
    });

    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.dummies, walls);

    this.time.delayedCall(1000, () => {
      const gridRows = Math.ceil(this.mainMapHeight / TILE_SIZE);
      const gridCols = Math.ceil(this.mainMapWidth / TILE_SIZE);
      for (let row = 0; row < gridRows; row++) {
        const gridRow: number[] = [];
        for (let col = 0; col < gridCols; col++) {
          const tileX = col * TILE_SIZE;
          const tileY = row * TILE_SIZE;
          const samplePoints = [
            { x: tileX + TILE_SIZE * 0.25, y: tileY + TILE_SIZE * 0.25 },
            { x: tileX + TILE_SIZE * 0.75, y: tileY + TILE_SIZE * 0.25 },
            { x: tileX + TILE_SIZE * 0.5, y: tileY + TILE_SIZE * 0.5 },
            { x: tileX + TILE_SIZE * 0.25, y: tileY + TILE_SIZE * 0.75 },
            { x: tileX + TILE_SIZE * 0.75, y: tileY + TILE_SIZE * 0.75 },
          ];
          let wallSamples = 0;
          samplePoints.forEach((point: any) => {
            const bodies = this.physics.overlapRect(
              point.x,
              point.y,
              5 * 0.6,
              5 * 0.6,
              false,
              true,
            );
            bodies.forEach((body: any) => {
              if (body.gameObject && body.gameObject.getData('isWall'))
                wallSamples++;
            });
          });
          gridRow.push(wallSamples >= 2 ? 1 : 0);
        }
        this.grids.push(gridRow);
      }

      this.easystar = new EasyStar.js();
      this.easystar.setGrid(this.grids);
      this.easystar.setAcceptableTiles([0]);
      this.easystar.enableDiagonals();
      this.easystar.disableCornerCutting();
      const moveToLoc1 = this.getLocationCoordinates('admin');
      this.commandBotToSpot(dum1, moveToLoc1.x, moveToLoc1.y);
    });

    this.killZone = this.add.zone(0, 0, 200, 200);
    this.physics.add.existing(this.killZone);
    (this.killZone.body as Phaser.Physics.Arcade.Body).moves = false;

    this.playerInteractZone = this.add.zone(0, 0, 150, 150);
    this.physics.add.existing(this.playerInteractZone);
    (this.playerInteractZone.body as Phaser.Physics.Arcade.Body).moves = false;

    this.player.setData(
      'todoTasksIndex',
      Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]),
    );
    this.player.setData('completedTasks', []);

    this.cameras.main.setBackgroundColor('#000000');
    this.LightCanvas = document.createElement('canvas');
    this.LightCanvas.width = 3000;
    this.LightCanvas.height = 3000;
    this.LightContext = this.LightCanvas.getContext('2d');
    this.LightTexture = this.textures.addCanvas(
      'soft_light_huge',
      this.LightCanvas,
    );
    this.toggleLight(true);

    this.darkness = this.add
      .rectangle(0, 0, map.width, map.height, 0x000000, 1)
      .setOrigin(0, 0)
      .setDepth(100);
    this.flashlight = this.make.image({
      x: 0,
      y: 0,
      key: 'soft_light_huge',
      add: false,
    });
    const mask = new Phaser.Display.Masks.BitmapMask(this, this.flashlight);
    mask.invertAlpha = true;
    this.darkness.setMask(mask);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('W,A,S,D');

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player_walk', {
        start: 0,
        end: 12,
      }),
      frameRate: 25,
      repeat: -1,
    });
    this.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNames('player_dead', {
        prefix: 'Dead',
        start: 1,
        end: 42,
        zeroPad: 4,
        suffix: '.png',
      }),
      frameRate: 25,
      repeat: 0,
    });
    this.anims.create({
      key: 'vent',
      frames: this.anims.generateFrameNames('player_vent', {
        prefix: 'Vent',
        start: 1,
        end: 7,
        zeroPad: 4,
        suffix: '.png',
      }),
      frameRate: 45,
      repeat: 0,
    });
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player_walk', frame: 12 }],
      frameRate: 20,
    });

    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player, true, 0.5, 0.5).setZoom(1.25);

    // ─── NEW: Inject HTML overlays AFTER everything is set up ──────────────
    this.setupHtmlOverlays();

    // ─── NEW: Tutorial alert sequence ─────────────────────────────────────
    this.time.delayedCall(800, () => {
      if (this.playerRole === 'impostor') {
        this.showAlert(
          'You are the IMPOSTOR — kill crewmates to win!',
          'danger',
          6000,
        );
      } else {
        this.showAlert(
          'You are CREWMATE — complete all tasks to win!',
          'info',
          6000,
        );
      }
    });
    this.time.delayedCall(7500, () => {
      this.showAlert(
        'SPACE: Use / Vent  ·  Q: Kill  ·  R: Report body',
        'info',
        5500,
      );
    });
    this.time.delayedCall(6500, () => {
      this.showAlert(
        'If a Crewmate dies , half of his remaining tasks are splitted among the survivors',
        'info',
        5000,
      );
    });
    this.time.delayedCall(4000, () => {
      this.showAlert(
        'You have only 1 emergency meeting , use it carefully !!',
        'info',
        5000,
      );
    });

    this.time.delayedCall(20000, () => {
      if (this.playerRole === 'impostor') {
        this.showAlert(
          'Sabotage first — then strike while vision is limited!',
          'warning',
          5000,
        );
      } else {
        this.showAlert(
          'Stay near others. Press R if you find a dead body!',
          'warning',
          5000,
        );
      }
    });
  }

  update() {
    //  Periodic ship report refresh (every 2 seconds)
    if (this.time.now - this.lastShipReportRefresh > 2000) {
      this.lastShipReportRefresh = this.time.now;
      this.refreshShipReport();
    }

    this.reportTarget = false;
    this.currentTask = null;
    this.currentTarget = null;
    this.targetVent = null;

    if (!this.player.getData('isDead')) {
      this.killZone.setPosition(this.player.x, this.player.y);
      this.playerInteractZone.setPosition(this.player.x, this.player.y);
    }

    if (this.playerInteractZone && this.playerInteractZone.active) {
      if (this.playerRole === 'crewmate') {
        this.physics.overlap(
          this.playerInteractZone,
          this.taskGroup,
          (_zone, target) => {
            if (target instanceof Phaser.GameObjects.GameObject)
              this.currentTask = target.getData('taskID');
          },
        );
      }
      if (this.playerRole === 'impostor') {
        this.physics.overlap(
          this.playerInteractZone,
          this.ventGroup,
          (_zone, vent) => {
            if (vent instanceof Phaser.GameObjects.GameObject) {
              this.targetVent = vent.getData('targetVent');
              this.currVentPos = vent.getData('currVentPos');
            }
          },
        );
      }
      this.physics.overlap(this.playerInteractZone, this.emergencyGroup, () => {
        this.currentTask = 'emergency_button';
      });
    }

    if (this.isDummyImpostor) {
      this.dummies.getChildren().forEach((d: any) => {
        const dummy = d as Phaser.Physics.Arcade.Sprite;
        if (dummy.getData('isDead')) return;
        const dummyInteractZone = dummy.getData('interactZone');
        if (dummyInteractZone && dummyInteractZone.active) {
          this.physics.overlap(
            dummyInteractZone,
            this.ventGroup,
            (_zone, vent) => {
              if (vent instanceof Phaser.GameObjects.GameObject) {
                dummy.setData('targetVent', vent.getData('targetVent'));
                dummy.setData('currVentPos', vent.getData('currVentPos'));
              }
            },
          );
        }
      });
    }

    // TRIPWIRE 1: Dummies looking at OTHER DUMMIES
    this.physics.overlap(this.personalZones, this.dummies, (z, t) => {
      const zone = z as Phaser.GameObjects.Zone;
      const threat = t as Phaser.Physics.Arcade.Sprite;
      const ownerName = zone.getData('ownerName');

      if (ownerName === threat.name || threat.getData('isSwept')) return;

      const dummy = this.dummies
        .getChildren()
        .find((d: any) => d.name === ownerName) as Phaser.Physics.Arcade.Sprite;

      if (
        !dummy ||
        dummy.getData('isDead') ||
        dummy.getData('role') !== 'crewmate'
      )
        return;

      const memory = dummy.getData('memory') as Memory;
      const targetSus = memory.susMatrix[threat.name] || 0;

      if (targetSus >= 40) {
        dummy.setData('activeThreat', threat);
        dummy.setData('lastThreatTime', this.time.now);
      }
    });

    // TRIPWIRE 2: Dummies looking at the HUMAN PLAYER'S ZONE
    this.physics.overlap(
      this.personalZones,
      this.playerInteractZone,
      (_t, z) => {
        const zone = z as Phaser.GameObjects.Zone;
        const ownerName = zone.getData('ownerName');
        const threat = this.player;

        if (threat.getData('isSwept')) return;

        const dummy = this.dummies
          .getChildren()
          .find(
            (d: any) => d.name === ownerName,
          ) as Phaser.Physics.Arcade.Sprite;

        if (
          !dummy ||
          dummy.getData('isDead') ||
          dummy.getData('role') !== 'crewmate'
        )
          return;

        const memory = dummy.getData('memory') as Memory;
        const targetSus = memory.susMatrix[threat.name] || 0;

        if (targetSus >= 40) {
          dummy.setData('activeThreat', threat);
          dummy.setData('lastThreatTime', this.time.now);
        }
      },
    );

    if (this.dummies && this.visibleZones && this.dummiesInteractZones) {
      this.dummies.children.iterate((d: any) => {
        const dummy = d as Phaser.Physics.Arcade.Sprite;

        const visibleZone = dummy.getData('visibleZone');
        if (visibleZone && visibleZone.active) {
          visibleZone.x = dummy.x;
          visibleZone.y = dummy.y;
        }

        const interactZone = dummy.getData('interactZone');
        if (interactZone && interactZone.active) {
          interactZone.x = dummy.x;
          interactZone.y = dummy.y;
        }

        const personalZone = dummy.getData('personalZone');
        if (personalZone && personalZone.active) {
          personalZone.x = dummy.x;
          personalZone.y = dummy.y;
        }

        const prevLoc = dummy.getData('loc') || '';
        const currLoc = this.getLocation(dummy.x, dummy.y);

        if (dummy.getData('role') === 'crewmate' && !dummy.getData('isDead')) {
          if (currLoc != prevLoc) {
            dummy.setData('loc', currLoc);
            dummy.getData('memory').writeMyActivity('walking', currLoc);
          }
        }

        const wasSabotaged = dummy.getData('wasSabotaged') || false;
        if (this.isSabotaged !== wasSabotaged) {
          const newVision =
            this.isSabotaged && dummy.getData('role') !== 'impostor'
              ? 100
              : 800;
          if (visibleZone && visibleZone.active) {
            visibleZone.setSize(newVision, newVision);
            if (visibleZone.body)
              (visibleZone.body as Phaser.Physics.Arcade.Body).setSize(
                newVision,
                newVision,
              );
          }
          dummy.setData('wasSabotaged', this.isSabotaged);
        }
      });

      // VISIBLE ZONE (For Logging and Reporting ONLY)
      this.physics.overlap(
        this.visibleZones,
        [this.dummies, this.player],
        (z, d) => {
          const dummy = d as Phaser.Physics.Arcade.Sprite;
          if (dummy.getData('isSwept')) return;
          const zone = z as Phaser.GameObjects.Zone;
          const zoneOwnerName = zone.getData('visibleZoneOwner');
          const zoneOwner = this.dummies
            .getChildren()
            .find(
              (b: any) => b.name === zoneOwnerName,
            ) as Phaser.Physics.Arcade.Sprite;

          if (!zoneOwner || zoneOwner.getData('isDead')) return;

          const currTime = this.time.now;
          const coolDownTime = 2 * 1000;
          const blinkKey = `lastseenby_${zoneOwnerName}`;
          const lastSeen = dummy.getData(blinkKey) || 0;

          if (zoneOwnerName !== dummy.name) {
            if (dummy.getData('isDead')) {
              if (zoneOwner.getData('role') !== 'impostor') {
                if (
                  Phaser.Math.Distance.Between(
                    zoneOwner.x,
                    zoneOwner.y,
                    dummy.x,
                    dummy.y,
                  ) < 200
                ) {
                  this.commandBotToSpot(zoneOwner, dummy.x, dummy.y);
                  zoneOwner.setData('isWorking', false);
                  console.log(
                    `[${zoneOwnerName}] FOUND A DEAD BODY! REPORTING!`,
                  );
                  this.reportTarget = true;
                  this.executeReport(zoneOwnerName);
                }
              }
            }

            if (currTime - lastSeen > coolDownTime) {
              const loc = this.getLocation(dummy.x, dummy.y);
              zoneOwner
                .getData('memory')
                .writeSight(dummy.name, dummy.getData('isDead'), loc);
              dummy.setData(blinkKey, currTime);

              this.taskGroup.getChildren().forEach((t: any) => {
                const dist = Phaser.Math.Distance.Between(
                  dummy.x,
                  dummy.y,
                  t.x,
                  t.y,
                );
                if (dist < 100 && !dummy.getData('isDead')) {
                  const taskID = t.getData('taskID');
                  const timeAtTask = dummy.getData('timeAtTask') || 0;
                  dummy.setData('timeAtTask', timeAtTask + coolDownTime);
                  zoneOwner
                    .getData('memory')
                    .writeOthersActivity(
                      dummy.name,
                      taskID,
                      dummy.getData('timeAtTask') / 1000,
                    );
                }
              });
            }
          }
        },
      );
    }

    const aliveTargets: any[] = [];
    const deadTargets: any[] = [];

    if (this.killZone && this.killZone.active) {
      this.physics.overlap(this.killZone, this.dummies, (_zone, dumm) => {
        const dummy = dumm as Phaser.Physics.Arcade.Sprite;
        if (dummy.getData('isSwept')) return;
        if (dummy.getData('isDead')) deadTargets.push(dummy);
        else aliveTargets.push(dummy);
      });
    }

    if (aliveTargets.length === 1) this.currentTarget = aliveTargets[0];
    else if (aliveTargets.length > 1) {
      let shortestDist = 150;
      aliveTargets.forEach((dummy) => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          dummy.x,
          dummy.y,
        );
        if (dist < shortestDist) {
          shortestDist = dist;
          this.currentTarget = dummy;
        }
      });
    }

    this.dummies.getChildren().forEach((d: any) => {
      const dummy = d as Phaser.Physics.Arcade.Sprite;
      if (dummy.getData('role') === 'impostor' && !dummy.getData('isDead')) {
        const visibleZone = dummy.getData('visibleZone');
        const nextKillTime = dummy.getData('nextKillTime') || 0;
        const canKill = this.time.now > nextKillTime;

        const peopleInSight: Phaser.Physics.Arcade.Sprite[] = [];
        if (visibleZone && visibleZone.active) {
          this.physics.overlap(
            visibleZone,
            [this.dummies, this.player],
            (_, t) => {
              const targetSprite = t as Phaser.Physics.Arcade.Sprite;
              const targetRole =
                targetSprite.name === this.player.name
                  ? this.playerRole
                  : targetSprite.getData('role');
              if (
                targetSprite.name !== dummy.name &&
                !targetSprite.getData('isDead') &&
                !targetSprite.getData('isSwept') &&
                targetRole !== 'impostor'
              ) {
                peopleInSight.push(targetSprite);
              }
            },
          );
        }

        if (canKill && peopleInSight.length === 1) {
          const victim = peopleInSight[0];
          const victimRole =
            victim.name === this.player.name
              ? this.playerRole
              : victim.getData('role');

          if (victimRole === 'crewmate') {
            const nextSabotageTime = dummy.getData('nextSabotageTime') || 0;
            if (!this.isSabotaged && this.time.now > nextSabotageTime) {
              console.log(
                `[${dummy.name}] INITIATING COMBO: Sabotaging lights!`,
              );
              this.time.delayedCall(5000, () => {
                this.showAlert(
                  `[HELP]:The impostor has performed a sabotage->kill->vent combo `,
                  'warning',
                  10000,
                );
              });
              this.executeSabotage(dummy);
            }

            if (
              !dummy.getData('isFollowing') ||
              dummy.getData('followTarget')?.name !== victim.name
            ) {
              console.log(`[${dummy.name}] stalking ${victim.name}...`);
              this.commandBotToFollow(dummy, victim);
              dummy.setData('isWorking', false);
              dummy.setData('isGoingToTask', false);
            }

            const dist = Phaser.Math.Distance.Between(
              dummy.x,
              dummy.y,
              victim.x,
              victim.y,
            );
            if (dist <= 80) {
              dummy.setData('isFollowing', false);
              dummy.setData('isTravelling', false);
              dummy.setData('currentPath', []);
              if (dummy.body) {
                (dummy.body as Phaser.Physics.Arcade.Body).reset(
                  dummy.x,
                  dummy.y,
                );
              }

              this.executeKill(dummy, victim);

              let closestVent: Phaser.GameObjects.Zone | null = null;
              let minVentDist = 500;
              this.ventGroup.getChildren().forEach((v: any) => {
                const vent = v as Phaser.GameObjects.Zone;
                const ventDist = Phaser.Math.Distance.Between(
                  dummy.x,
                  dummy.y,
                  vent.x,
                  vent.y,
                );
                if (ventDist < minVentDist) {
                  minVentDist = ventDist;
                  closestVent = vent;
                }
              });

              if (closestVent) {
                const safeVent = closestVent as Phaser.GameObjects.Zone;
                const ventX = safeVent.x;
                const ventY = safeVent.y;
                const targetVentName = safeVent.getData('targetVent');
                console.log(`[${dummy.name}] COMBO COMPLETE: Venting away!`);
                this.commandBotToSpot(dummy, ventX, ventY);
                dummy.setData('nextRoamTime', this.time.now + 2000);
                setTimeout(() => {
                  this.executeVent(dummy, ventX, ventY, targetVentName);
                }, 500);
              } else {
                console.log(`[${dummy.name}] No vents! Fleeing into the dark!`);
                const escapeNode = this.calculateEscapePoint(
                  dummy,
                  victim,
                  400,
                );
                this.commandBotToSpot(dummy, escapeNode.x, escapeNode.y);
              }
            }
          }
        } else if (peopleInSight.length > 1) {
          if (dummy.getData('isFollowing')) {
            console.log(
              `[${dummy.name}] aborted the hunt. Too many witnesses!`,
            );
            dummy.setData('isFollowing', false);
            dummy.setData('followTarget', null);
            dummy.setData('isTravelling', false);
            dummy.setData('currentPath', []);
          }
        }
      }
    });

    if (deadTargets.length > 0) this.reportTarget = true;

    if (this.uiGroup) {
      this.uiGroup.getChildren().forEach((btnObj: any) => {
        const btn = btnObj as Phaser.GameObjects.Image;
        const key = btn.texture.key;
        const cdText = btn.getData('cdText') as Phaser.GameObjects.Text;

        let shouldBeActive = false;
        let timeRemaining = 0;
        if (key === 'btn_use') shouldBeActive = !!this.currentTask;
        else if (key === 'btn_kill') {
          timeRemaining = Math.ceil(
            (this.player.getData('nextKillTime') - this.time.now) / 1000,
          );
          shouldBeActive = !!this.currentTarget && timeRemaining <= 0;
        } else if (key === 'btn_report') shouldBeActive = this.reportTarget;
        else if (key === 'btn_vent') {
          if (this.targetVent) shouldBeActive = true;
        } else if (key === 'btn_sabotage') {
          const nextSab = this.player.getData('nextSabotageTime') || 0;
          timeRemaining = Math.ceil((nextSab - this.time.now) / 1000);
          if (!this.targetVent && !this.currentTask)
            shouldBeActive = timeRemaining <= 0;
        }

        if (timeRemaining > 0) {
          btn.setAlpha(0.3).disableInteractive().setData('isActive', false);
          cdText.setText(timeRemaining.toString());
        } else {
          cdText.setText('');
          if (shouldBeActive)
            btn.setAlpha(1).setInteractive().setData('isActive', true);
          else
            btn.setAlpha(0.3).disableInteractive().setData('isActive', false);
        }
      });
    }

    const miniMapWidth = this.minimap.width * this.minimap.scaleX;
    const miniMapHeight = this.minimap.height * this.minimap.scaleY;
    const ratioX = miniMapWidth / this.minimap.width - 0.055;
    const ratioY = miniMapHeight / this.minimap.height - 0.05;
    this.playerDot.x = this.player.x * ratioX + 150;
    this.playerDot.y = this.player.y * ratioY + 80;

    this.flashlight.x = this.player.x;
    this.flashlight.y = this.player.y;

    // PLAYER MOVEMENT
    if (!this.player.getData('isDead')) {
      const speed = SPEED;
      this.player.setVelocity(0);
      let isMoving = false;
      if (!this.isIdle) this.player.setVelocity(0);
      else {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
          this.player.setVelocityX(-speed);
          this.player.setFlipX(true);
          isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
          this.player.setVelocityX(speed);
          this.player.setFlipX(false);
          isMoving = true;
        }
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
          this.player.setVelocityY(-speed);
          isMoving = true;
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
          this.player.setVelocityY(speed);
          isMoving = true;
        }
        if (isMoving) {
          this.player.play('walk', true);
          if (!this.walkSound.isPlaying) this.walkSound.play();
        } else {
          if (this.isIdle) {
            this.player.stop();
            this.player.setTexture('player_walk');
            this.player.setFrame(12);
            if (this.walkSound.isPlaying) this.walkSound.pause();
          }
        }
        this.player.body.velocity.normalize().scale(speed);
      }
    } else {
      this.player.setVelocity(0);
    }

    // DUMMY MOVEMENTS & THE BRAIN
    this.dummies.getChildren().forEach((d: any) => {
      if (!this.easystar) return;
      const dummy = d as Phaser.Physics.Arcade.Sprite;

      if (!dummy.getData('isDead')) {
        const currTime = this.time.now;

        // PANICKING (Button run)
        if (dummy.getData('isPanicking')) {
          if (!this.isMeetingCalled) {
            dummy.setData('isWorking', false);
            dummy.setData('isTravelling', true);
            if (
              Phaser.Math.Distance.Between(
                dummy.x,
                dummy.y,
                emergency_button_loc.x,
                emergency_button_loc.y,
              ) < 50
            ) {
              // 1. Take the bot's token away!
              const currentMeetings = dummy.getData('emergencyMeetingRem');
              dummy.setData('emergencyMeetingRem', currentMeetings - 1);

              // 2. Call the meeting
              this.isMeetingCalled = true;
              this.sound.play('emergencyMeeting', { volume: 0.3 });
              setTimeout(() => {
                this.executeReport(dummy.name);
              }, 1500);
            }
          }
        }
        //  THE BRAIN: SURVIVAL STATE MANAGER
        if (dummy.getData('role') === 'crewmate') {
          const RADAR_TICK_MS = 1500;
          const lastThreatTime = dummy.getData('lastThreatTime') || 0;
          const activeThreat = dummy.getData('activeThreat');

          if (currTime - lastThreatTime < 500 && activeThreat) {
            if (!dummy.getData('isFleeing')) {
              console.log(`[${dummy.name}] PANIC! Entered Survival State!`);
              dummy.setData('isFleeing', true);
              dummy.setData('isWorking', false);
              dummy.setData('isGoingToTask', false);
              dummy.setData('isFollowing', false);
            }

            if (dummy.getData('role') !== 'impostor') {
              const lastRadarTick = dummy.getData('lastRadarTick') || 0;
              if (currTime - lastRadarTick > RADAR_TICK_MS) {
                console.log(`[${dummy.name}] RADAR TICK: Evaluating threat!`);
                dummy.setData('lastRadarTick', currTime);

                const memory = dummy.getData('memory') as Memory;
                const sus = memory.susMatrix[activeThreat.name] || 0;

                if (sus >= 70) {
                  if (
                    !dummy.getData('isPanicking') &&
                    !dummy.getData('isFleeing')
                  ) {
                    this.triggerPanicState(dummy, activeThreat);
                  }
                }
              } else {
                const fleeDistance = 150;
                const escapeNode = this.calculateEscapePoint(
                  dummy,
                  activeThreat,
                  fleeDistance,
                );
                this.commandBotToSpot(dummy, escapeNode.x, escapeNode.y);
              }
            }
          }

          if (dummy.getData('isFleeing')) {
            const threat = dummy.getData('activeThreat');

            if (threat && !threat.getData('isDead')) {
              const currTime = this.time.now;
              const lastFleePing = dummy.getData('lastFleePing') || 0;

              //  Recalculate Whisker Escape Vector every 200ms
              if (currTime - lastFleePing > 200) {
                dummy.setData('lastFleePing', currTime);
                // Fire the whiskers!
                const escapeNode = this.calculateEscapePoint(
                  dummy,
                  threat,
                  250,
                );

                // Use pure physics! If they hit a wall, they slide.
                const panicSpeed = SPEED;
                this.physics.moveTo(
                  dummy,
                  escapeNode.x,
                  escapeNode.y,
                  panicSpeed,
                );
              }

              //  Animate the run
              dummy.play('walk', true);
              if (
                dummy.body &&
                (dummy.body as Phaser.Physics.Arcade.Body).velocity.x < 0
              ) {
                dummy.setFlipX(true);
              } else {
                dummy.setFlipX(false);
              }

              // Have we escaped? (The "All Clear")
              const dist = Phaser.Math.Distance.Between(
                dummy.x,
                dummy.y,
                threat.x,
                threat.y,
              );
              // If threat is 450 pixels away OR 3 seconds have passed, we are safe.
              if (
                dist > 450 ||
                currTime - dummy.getData('lastThreatTime') > RADAR_TICK_MS * 2
              ) {
                console.log(`[${dummy.name}] Escaped! Catching breath.`);
                dummy.setData('isFleeing', false);
                dummy.setData('activeThreat', null);
                if (dummy.body)
                  (dummy.body as Phaser.Physics.Arcade.Body).stop(); // Hit the brakes
              }
            }
          }
        }

        // STALKER FOLLOW LOGIC
        if (dummy.getData('isFollowing') && !dummy.getData('isFleeing')) {
          const target = dummy.getData('followTarget');
          const currTime = this.time.now;
          const lastPingTime = dummy.getData('lastPingTime') || 0;

          // Recalculate the A* path to the target every 250ms.
          // This costs more CPU, but guarantees they navigate corners flawlessly!
          if (currTime - lastPingTime > 250) {
            dummy.setData('lastPingTime', currTime);
            this.commandBotToSpot(dummy, target.x, target.y);
          }
        }

        // DUMMY MOVEMENT EXECUTION
        if (dummy.getData('isTravelling')) {
          const path: { x: number; y: number }[] =
            dummy.getData('currentPath') || [];
          if (path.length > 0) {
            const nextStep = path[0];
            const distance = Phaser.Math.Distance.Between(
              dummy.x,
              dummy.y,
              nextStep.x,
              nextStep.y,
            );
            if (distance < 15) {
              path.shift();
              if (path.length === 0) {
                dummy.body?.reset(nextStep.x, nextStep.y);
                dummy.stop();
                dummy.setTexture('player_walk');
                dummy.setFrame(12);
                dummy.setData('isTravelling', false);

                if (dummy.getData('isGoingToVent')) {
                  dummy.setData('isGoingToVent', false);
                  dummy.setData('isVentingNow', true);
                  const entranceVentName = dummy.getData('entranceVentName');
                  const entranceVent = this.ventGroup
                    .getChildren()
                    .find((v: any) => v.name === entranceVentName);
                  const exitVentName = entranceVent?.getData('targetVent');
                  this.executeVent(dummy, dummy.x, dummy.y, exitVentName);
                }

                if (
                  dummy.getData('isGoingToTask') &&
                  !dummy.getData('isWorking') &&
                  !dummy.getData('isFleeing')
                ) {
                  const todoTasksIndex = dummy.getData('todoTasksIndex');
                  const currTaskIndex = dummy.getData('currTaskIndex');
                  if (todoTasksIndex && currTaskIndex < todoTasksIndex.length) {
                    dummy.setData('isWorking', true);
                    dummy.setData('taskStartedAt', this.time.now);
                    dummy.setData('isGoingToTask', false);
                  }
                }
              }
            } else {
              // PURE A* FOLLOWER: No whiskers, no steering. Just walk directly to the safe grid node.
              const speed = SPEED;
              this.physics.moveTo(dummy, nextStep.x, nextStep.y, speed);

              dummy.play('walk', true);
              if ((dummy.body as Phaser.Physics.Arcade.Body).velocity.x < 0) {
                dummy.setFlipX(true);
              } else if (
                (dummy.body as Phaser.Physics.Arcade.Body).velocity.x > 0
              ) {
                dummy.setFlipX(false);
              }
            }
          }
        }

        // IMPOSTOR WANDER, FAKE TASK & VENT PROTOCOL
        if (
          dummy.getData('role') === 'impostor' &&
          !dummy.getData('isFollowing') &&
          !dummy.getData('isTravelling') &&
          !dummy.getData('isWorking')
        ) {
          const nextRoamTime = dummy.getData('nextRoamTime') || 0;
          if (this.time.now > nextRoamTime) {
            const roamAction = Math.random() < 0.25 ? 'vent' : 'task';
            if (roamAction === 'vent') {
              const randomVent = Phaser.Utils.Array.GetRandom(
                this.ventGroup.getChildren(),
              ) as Phaser.GameObjects.Zone;
              if (randomVent) {
                console.log(
                  `[${dummy.name}] decided to roam via Vent to ${randomVent.name}!`,
                );
                this.time.delayedCall(5000, () => {
                  this.showAlert(
                    `[HELP]: The impostor is venting STAY ALERT!!`,
                    'danger',
                    5000,
                  );
                });
                this.commandBotToSpot(dummy, randomVent.x, randomVent.y);
                dummy.setData('isGoingToVent', true);
                dummy.setData('entranceVentName', randomVent.name);
                dummy.setData(
                  'nextRoamTime',
                  this.time.now + Phaser.Math.Between(1000, 3000),
                );
              }
            } else {
              const fakeTask = Phaser.Utils.Array.GetRandom(ALL_TASKS);
              const coords = this.getTaskCoordinates(fakeTask.name);
              console.log(
                ` [${dummy.name}] prowling to fake ${fakeTask.name}...`,
              );
              const targetNode = this.getJitteredDestination(
                coords.x,
                coords.y,
                45,
              );
              dummy.setData('isGoingToTask', true);
              this.commandBotToSpot(dummy, targetNode.x, targetNode.y);
              dummy.setData('currentTaskName', fakeTask.name);
              const minTime = fakeTask.timeRange[0];
              const maxTime = fakeTask.timeRange[1];
              dummy.setData(
                'taskDuration',
                (Math.floor(Math.random() * (maxTime - minTime)) + minTime) *
                  1000,
              );
              dummy.setData(
                'nextRoamTime',
                this.time.now + Phaser.Math.Between(1000, 3000),
              );
            }
          }
        }

        // CREWMATE TASK QUEUE LOGIC
        if (dummy.getData('role') === 'crewmate') {
          if (
            !dummy.getData('isWorking') &&
            !dummy.getData('isTravelling') &&
            !dummy.getData('isFollowing') &&
            !dummy.getData('isPanicking') &&
            !dummy.getData('isFleeing')
          ) {
            const todoTasksIndex = dummy.getData('todoTasksIndex');
            const currTaskIndex = dummy.getData('currTaskIndex');

            if (todoTasksIndex && currTaskIndex < todoTasksIndex.length) {
              const currTask = ALL_TASKS[todoTasksIndex[currTaskIndex]];
              dummy.setData('currentTaskName', currTask.name);
              const taskCoord = this.getTaskCoordinates(currTask.name);
              const targetNode = this.getJitteredDestination(
                taskCoord.x,
                taskCoord.y,
                45,
              );
              const minTime = currTask.timeRange[0],
                maxTime = currTask.timeRange[1];
              dummy.setData(
                'taskDuration',
                (Math.floor(Math.random() * (maxTime - minTime)) + minTime) *
                  1000,
              );
              dummy.setData('isGoingToTask', true);
              this.commandBotToSpot(dummy, targetNode.x, targetNode.y);
            } else if (
              todoTasksIndex &&
              currTaskIndex >= todoTasksIndex.length
            ) {
              if (!dummy.getData('isAllTaskDone')) {
                console.log(`[${dummy.name}] All tasks are done`);
                dummy.setData('isAllTaskDone', true);
              }
            }
          }
        }

        // UNIVERSAL TASK COMPLETION
        if (dummy.getData('isWorking')) {
          if (!this.easystar) return;
          const currTaskName = dummy.getData('currentTaskName');
          const startedAt = dummy.getData('taskStartedAt') || 0;
          const taskDuration = dummy.getData('taskDuration') || 0;

          if (currTime - startedAt > taskDuration) {
            console.log(`[${dummy.name}] FINISHED ITS TASK`);
            const currLoc = this.getLocation(dummy.x, dummy.y);

            if (dummy.getData('role') === 'impostor') {
              dummy
                .getData('memory')
                .writeFakeActivity(`faking ${currTaskName}`, currLoc);
            } else {
              dummy
                .getData('memory')
                .writeMyActivity(`doing ${currTaskName}`, currLoc);
              //  ship log entry for crewmate task completion
              this.addToShipLog(
                dummy.name,
                this.getColorHex(dummy),
                `finished ${currTaskName} in ${currLoc}`,
                'crewmate',
              );
            }

            dummy.setData('isWorking', false);
            if (dummy.getData('role') === 'crewmate') {
              const currTaskIndex = dummy.getData('currTaskIndex');
              dummy.setData('currTaskIndex', currTaskIndex + 1);
              this.updateTaskProgress();
            }
          }
        }
      }
    });
  }
}

export const configCafe = {
  type: Phaser.AUTO,
  parent: '_GAME-CONTAINER',
  scene: BasicScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: '_GAME-CONTAINER',
    width: '100%',
    height: '100%',
  },
  physics: { default: 'arcade', arcade: { debug: false } },
};
