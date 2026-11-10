if (input_pressed("up"))   index = (index - 1 + array_length(options)) mod array_length(options);
if (input_pressed("down")) index = (index + 1) mod array_length(options);
if (input_pressed("confirm")) {
    switch (index) {
        case 0: room_goto(rm_town); break;
        case 1: room_goto(rm_yard); break;
        case 2: game_end(); break;
    }
}