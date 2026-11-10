draw_set_halign(fa_center);
for (var i = 0; i < array_length(options); i++) {
    draw_set_colour(i == index ? c_yellow : c_white);
    draw_text(640, 300 + i * 50, options[i]);
}
draw_set_halign(fa_left);