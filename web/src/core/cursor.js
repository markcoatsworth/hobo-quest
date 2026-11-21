// The mouse cursor: a pointing hand over anything that can be clicked, the
// arrow everywhere else. Each frame starts with the arrow (cursor_reset, in
// main.js); anything clickable under the mouse asks for the hand
// (cursor_point) while it updates; main.js then sets the canvas's CSS cursor
// once. A GameMaker port does the same with window_set_cursor.

let pointing = false;

/** Back to the arrow, at the start of a frame. */
export function cursor_reset() {
  pointing = false;
}

/** The mouse is over something clickable. */
export function cursor_point() {
  pointing = true;
}

/** The CSS cursor for this frame. */
export function cursor_css() {
  return pointing ? 'pointer' : '';
}
