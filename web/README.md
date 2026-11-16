# Hobo Quest — web prototype

Browser prototype for trying out ideas before building them in GameMaker (`../gamemaker`).
Vanilla JS + Vite, drawing to a single canvas at a fixed 1280×720 that scales to the window.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run check    # sanity-check the rail network and the yards' trains
npm run map      # rebuild public/map/*.png from ../source/usa-rail-network-2010.png
```

## The game so far

Title → map → (town) → yard → ride → map → … → Los Angeles.

- **Map** (`src/scenes/map.js`): the rail network, where you are, the trail you've ridden, and
  the freights leaving this city's yard. There's no route to choose: where you go next depends
  on which train you catch in the yard. The journey saves in every city; Continue resumes it.
- **Ride** (`src/scenes/travel.js`): Oregon Trail-style travel screen. The freight runs west
  through scenery that changes by region (per line in `src/rail/network.json`), with day and night,
  weather, and a status panel: date (from April 4, 1932), weather, next stop, miles. Hold confirm
  to hurry. Quitting mid-ride resumes at the start of that ride.
- **Town** (`src/scenes/town.js`): in every city, including Los Angeles at the end, walk the
  main street side-on. Talk to people, step into places (stores, diners, missions, landmarks,
  future mini-games), and take the rail yard sign at the far end.
- **Yard** (`src/scenes/yard.js`): cross the sidings from the west fence to the open boxcar on the
  departing freight (east track) before it pulls out. A yard lists every freight that leaves it;
  for now one runs a day, taking turns (so in New York, missing the Philadelphia freight gets
  you the Cleveland one tomorrow). Several trains at once come later. Bulls patrol with
  lanterns: stay out of the light, use parked cars as cover. Shunting cars knock you down.
  Getting caught or missing the train costs a day and you try again.
- **Cities** (`src/cities/<id>/index.js`): one hand-written module per stop holding everything
  about it: map position, blurb, the town (street layout, buildings, signs, places with their
  stock, people and their lines, skyline, lamps) and the rail yard (exact tracks, cars, shunting
  cuts, bulls, departure timer). Nothing about a stop is generated; edit the module to change it.
  The full format is documented at the top of `src/cities/index.js`. A city can also supply its
  own drawing code (`town.draw`), as New York does for the Third Avenue El. Put a city's art and
  audio in `public/cities/<id>/` when it has some.
- **Rail network** (`src/rail/network.json`): every line between two cities, one way only (no
  going back), with its track on
  the map, days, miles and the regions the ride passes through. Plain JSON so the GameMaker
  build can load the same file. Read through the functions in `src/systems/rail.js`.
- **Saves** (`src/core/save.js`): the journey is plain data (where you are, the trail, day,
  arrests...) with a version number; older saves are upgraded on load. GameMaker will use the
  same shape.

## Controls

Everything is driven by named actions (`src/core/input.js`), fed by both keyboard and gamepad:

| Action  | Keyboard            | Gamepad (Xbox layout)   |
| ------- | ------------------- | ----------------------- |
| move    | Arrows, WASD        | D-pad, left stick       |
| confirm | Enter, Space        | A                       |
| back    | Esc, Backspace      | B                       |
| sprint  | Shift               | X, right trigger        |
| pause   | Esc, P              | Start / Menu            |

Browsers hide a controller from the page until a button is pressed while it's focused.
Button prompts follow whichever device was used last. The mouse also works on menus.

## Layout

- `src/main.js`: boot, game loop, scaling, mouse
- `src/core/`: input, menu widget, button prompts, title backdrop, saves, RNG
- `src/scenes/`: title, map, town, yard, ride, cutscene and placeholder screens
- `src/cities/`: one folder per stop
- `src/characters/`: one folder per major character (the player and possible party members)
- `src/cutscenes/`: one folder per cutscene (opening, happy and sad endings), played by
  `src/scenes/cutscene.js`; any video files go in `public/cutscenes/<id>/`
- `src/rail/`: the rail network (JSON)
- `src/systems/`: game rules as plain functions on the journey, named GameMaker-style
  (`rail_lines_from`, ...) so they port line for line
- `scripts/build-map.mjs`: extracts the land silhouette and rail lines from the source map
