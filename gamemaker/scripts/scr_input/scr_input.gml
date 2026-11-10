// Use the first connected controller. On Windows, Xbox pads use slots 0-3.
function input_pad() {
    for (var i = 0; i < gamepad_get_device_count(); i++) {
        if (gamepad_is_connected(i)) return i;
    }
    return -1;
}

// True only on the frame an action is first pressed.
function input_pressed(_action) {
    var _p = input_pad();
    var _pad = function(_p, _btn) { return _p >= 0 && gamepad_button_check_pressed(_p, _btn); };
    switch (_action) {
        case "up":      return keyboard_check_pressed(vk_up)   || keyboard_check_pressed(ord("W")) || _pad(_p, gp_padu) || input_stick_pressed(_p, -1);
        case "down":    return keyboard_check_pressed(vk_down) || keyboard_check_pressed(ord("S")) || _pad(_p, gp_padd) || input_stick_pressed(_p, 1);
        case "confirm": return keyboard_check_pressed(vk_enter) || keyboard_check_pressed(vk_space) || _pad(_p, gp_face1);
        case "back":    return keyboard_check_pressed(vk_escape) || keyboard_check_pressed(vk_backspace) || _pad(_p, gp_face2);
    }
    return false;
}

// Treats the left stick like a d-pad for menus. Each push counts once,
// and the stick has to come back toward the centre before it counts again.
function input_stick_pressed(_p, _dir) {
    static held = 0;
    static last_frame = -1;
    static fired = 0;
    if (last_frame != current_time) {           // update once per frame
        last_frame = current_time;
        var _y = (_p >= 0) ? gamepad_axis_value(_p, gp_axislv) : 0;
        var _now = (_y > 0.5) ? 1 : (_y < -0.5 ? -1 : (abs(_y) < 0.3 ? 0 : held));
        fired = (_now != 0 && _now != held) ? _now : 0;
        held = _now;
    }
    return fired == _dir;
}