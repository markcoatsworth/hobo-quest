// Is this a phone or tablet? True when the main pointer is a finger that
// can't hover (CSS media queries `pointer: coarse` and `hover: none`).
// Touchscreen laptops have a mouse or trackpad as their main pointer, so
// they count as desktops. Add ?touch=1 or ?touch=0 to the URL to force it
// either way, e.g. to try the touch controls in a desktop browser with its
// device emulation.
//
// This is the only touch code loaded on a desktop; the rest of src/touch/
// is fetched only when this says yes.

export function isTouchDevice() {
  const force = new URLSearchParams(location.search).get('touch');
  if (force === '1') return true;
  if (force === '0') return false;
  return window.matchMedia?.('(pointer: coarse) and (hover: none)').matches ?? false;
}
