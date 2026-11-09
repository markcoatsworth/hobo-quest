// Action-based input: the game asks about actions ("confirm", "up"), never
// about raw keys or buttons. Keyboard and every connected gamepad feed the
// same actions. This mirrors how the GameMaker build should be structured
// (and what Steam Input expects), so the scheme ports over as-is.

// Keyboard bindings use KeyboardEvent.code, so they follow physical key
// position regardless of layout (WASD works on AZERTY).
const KEY_BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'NumpadEnter', 'Space'],
  back: ['Escape', 'Backspace'],
  pause: ['Escape', 'KeyP'],
  sprint: ['ShiftLeft', 'ShiftRight'],
};

// "standard" mapping indices (https://w3c.github.io/gamepad/#remapping),
// same layout as GameMaker's gp_* constants:
// 0 A/Cross (gp_face1), 1 B/Circle (gp_face2), 2 X/Square (gp_face3),
// 7 right trigger (gp_shoulderrb), 9 Start/Options (gp_start),
// 12-15 D-pad up/down/left/right (gp_padu/padd/padl/padr).
const PAD_BINDINGS = {
  up: [12],
  down: [13],
  left: [14],
  right: [15],
  confirm: [0],
  back: [1],
  pause: [9],
  sprint: [2, 7],
};

// Analog movement: below this the stick counts as centred.
const STICK_DEADZONE = 0.2;

// Left stick also acts as a D-pad for menus. Hysteresis stops a stick resting near
// the threshold from flickering the direction on and off.
const STICK_PRESS = 0.5;
const STICK_RELEASE = 0.3;

// Held-direction auto-repeat for menu navigation.
const REPEAT_DELAY = 0.4;
const REPEAT_RATE = 0.11;

const ACTIONS = Object.keys(KEY_BINDINGS);
const PREVENT_DEFAULT = new Set(Object.values(KEY_BINDINGS).flat());

export class Input {
  constructor(target = window) {
    this.keysDown = new Set();
    // Keys pressed since the last update. Kept separately so a key tapped
    // and released between two frames still registers as a press.
    this.keysTapped = new Set();
    this.stickDir = { up: false, down: false, left: false, right: false };
    this.stick = { x: 0, y: 0 }; // analog left stick, deadzone applied
    this.state = Object.fromEntries(ACTIONS.map((a) => [a, { down: false, pressed: false, repeated: false, held: 0, repeatAt: 0 }]));
    // Which device the player last touched, for button prompts.
    this.lastDevice = 'keyboard';
    this.listeners = new Set();

    target.addEventListener('keydown', (e) => {
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
      if (e.repeat) return; // we do our own repeat
      this.keysDown.add(e.code);
      this.keysTapped.add(e.code);
      this.lastDevice = 'keyboard';
    });
    target.addEventListener('keyup', (e) => this.keysDown.delete(e.code));
    // Keys released while the window is unfocused never send keyup.
    target.addEventListener('blur', () => this.keysDown.clear());

    target.addEventListener('gamepadconnected', (e) => this.emit('connected', e.gamepad));
    target.addEventListener('gamepaddisconnected', (e) => this.emit('disconnected', e.gamepad));
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(type, pad) {
    for (const fn of this.listeners) fn(type, pad);
  }

  /** Call once per frame, before the scene reads input. */
  update(dt) {
    const padDown = this.pollGamepads();

    for (const action of ACTIONS) {
      const s = this.state[action];
      // A keydown event since last frame is always a fresh press (we drop
      // OS auto-repeat events), even if the key is already up again.
      const tapped = KEY_BINDINGS[action].some((c) => this.keysTapped.has(c));
      const down = tapped || KEY_BINDINGS[action].some((c) => this.keysDown.has(c)) || padDown.has(action);
      s.pressed = tapped || (down && !s.down);
      s.down = down;
      s.held = down ? s.held + dt : 0;
      s.repeated = false;
      if (s.pressed) {
        s.repeated = true;
        s.repeatAt = REPEAT_DELAY;
      } else if (down) {
        s.repeatAt -= dt;
        if (s.repeatAt <= 0) {
          s.repeatAt += REPEAT_RATE;
          s.repeated = true;
        }
      }
    }
    this.keysTapped.clear();
  }

  pollGamepads() {
    const active = new Set();
    this.stick.x = this.stick.y = 0;
    // Browsers stop updating pads for background tabs; don't act on stale state.
    if (document.hidden || !navigator.getGamepads) return active;

    for (const pad of navigator.getGamepads()) {
      if (!pad || !pad.connected) continue;
      let touched = false;

      for (const [action, buttons] of Object.entries(PAD_BINDINGS)) {
        // Non-"standard" pads (cheap generics, some Linux drivers) still put
        // the face buttons at 0/1 nearly always; their D-pad indices vary,
        // so for those we rely on the stick/axes below.
        if (pad.mapping !== 'standard' && buttons[0] >= 12) continue;
        if (buttons.some((i) => pad.buttons[i]?.pressed)) {
          active.add(action);
          touched = true;
        }
      }

      const x = pad.axes[0] ?? 0;
      const y = pad.axes[1] ?? 0;
      // Radial deadzone, rescaled so movement ramps up from zero at its edge.
      const mag = Math.hypot(x, y);
      if (mag > STICK_DEADZONE && mag > Math.hypot(this.stick.x, this.stick.y)) {
        const k = Math.min(1, (mag - STICK_DEADZONE) / (1 - STICK_DEADZONE)) / mag;
        this.stick.x = x * k;
        this.stick.y = y * k;
      }
      const dirs = { left: -x, right: x, up: -y, down: y };
      for (const [dir, v] of Object.entries(dirs)) {
        const on = this.stickDir[dir] ? v > STICK_RELEASE : v > STICK_PRESS;
        this.stickDir[dir] = on;
        if (on) {
          active.add(dir);
          touched = true;
        }
      }

      if (touched) this.lastDevice = 'gamepad';
    }
    return active;
  }

  /** True on the single frame the action went down. */
  pressed(action) {
    return this.state[action].pressed;
  }

  /** True while held. */
  down(action) {
    return this.state[action].down;
  }

  /**
   * Movement as a vector of length 0–1: the analog stick when it's off
   * centre, otherwise the digital directions (keys, D-pad), normalised.
   */
  move() {
    const { x, y } = this.stick;
    if (x || y) return { x, y };
    const dx = (this.state.right.down ? 1 : 0) - (this.state.left.down ? 1 : 0);
    const dy = (this.state.down.down ? 1 : 0) - (this.state.up.down ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  /**
   * Like pressed(), but fires again every so often while held —
   * for scrolling through menus.
   */
  repeat(action) {
    return this.state[action].repeated;
  }

  /** Short rumble on supporting browsers (Chromium); silently a no-op elsewhere. */
  rumble(duration = 60, strong = 0.2, weak = 0.4) {
    if (this.lastDevice !== 'gamepad' || !navigator.getGamepads) return;
    for (const pad of navigator.getGamepads()) {
      pad?.vibrationActuator?.playEffect?.('dual-rumble', {
        duration,
        strongMagnitude: strong,
        weakMagnitude: weak,
      }).catch(() => {});
    }
  }
}
