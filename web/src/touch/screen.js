// The game always plays in landscape. When the phone is held upright (or
// its rotation lock keeps the browser upright), the whole picture is drawn
// a quarter-turn clockwise, so turning the phone anticlockwise (top to the
// left) shows it the right way up. Taps are turned back the same way.
//
// "Screen" here means the landscape screen the game sees: when turned, its
// width is the phone's height and the other way round. Everything is in CSS
// pixels unless it says otherwise.

export class TouchScreen {
  /** Is the picture being drawn turned (the browser is upright)? */
  get turned() {
    return window.innerHeight > window.innerWidth;
  }

  /** The landscape screen's size. */
  size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return this.turned ? { w: h, h: w } : { w, h };
  }

  /** A point on the glass (clientX/Y) as a point on the landscape screen. */
  fromClient(x, y) {
    return this.turned ? { x: y, y: window.innerWidth - x } : { x, y };
  }

  /**
   * Set ctx up to draw on the landscape screen, `unit` canvas pixels to a
   * unit (1: device pixels, as the game draws; devicePixelRatio: CSS pixels).
   */
  turn(ctx, unit = 1) {
    if (this.turned) ctx.setTransform(0, unit, -unit, 0, ctx.canvas.width, 0);
    else ctx.setTransform(unit, 0, 0, unit, 0, 0);
  }

  /** Safe-area insets measured on the glass, turned to match the landscape screen. */
  insets(glass) {
    return this.turned ? { t: glass.r, r: glass.b, b: glass.l, l: glass.t } : glass;
  }
}
