# Hobo Quest — web prototype

Browser prototype for trying out ideas before building them in GameMaker (`../gamemaker`).
Vanilla JS + Vite, drawing to a single canvas at a fixed 1280×720 that scales to the window.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run map      # rebuild public/map/*.png from ../source/usa-rail-network-2010.png
```

## The game so far

Title → map → (town) → yard → ride → map → … → Los Angeles.

- **Map** (`src/scenes/map.js`): in New York, pick the Northern Line (New York, Cleveland,
  Chicago, Kansas City, Los Angeles) or the Southern Line (New York, Philadelphia, Washington,
  Nashville, Clarksdale, Dallas, El Paso, Phoenix, Los Angeles). The journey saves at every stop;
  Continue resumes it.
- **Ride** (`src/scenes/travel.js`): Oregon Trail-style travel screen. The freight runs west
  through scenery that changes by region (per-leg list in `routes.js`), with day and night,
  weather, and a status panel: date (from April 4, 1932), weather, next stop, miles. Hold confirm
  to hurry. Quitting mid-ride resumes at the start of that ride.
- **Town** (`src/scenes/town.js`): at every stop, including New York before you pick a line and
  Los Angeles at the end, walk the main street side-on. Talk to people, step into places (stores,
  diners, missions, landmarks, future mini-games), and take the rail yard sign at the far end.
- **Yard** (`src/scenes/yard.js`): cross the sidings from the west fence to the open boxcar on the
  departing freight (east track) before it pulls out. Bulls patrol with lanterns: stay out of the
  light, use parked cars as cover. Shunting cars knock you down. Getting caught or missing the
  train costs a day and you try again.
- **Cities** (`src/cities/<id>/index.js`): one hand-written module per stop holding everything
  about it: map position, blurb, the town (street layout, buildings, signs, places with their
  stock, people and their lines, skyline, lamps) and the rail yard (exact tracks, cars, shunting
  cuts, bulls, departure timer). Nothing about a stop is generated; edit the module to change it.
  The full format is documented at the top of `src/cities/index.js`. A city can also supply its
  own drawing code (`town.draw`), as New York does for the Third Avenue El. Put a city's art and
  audio in `public/cities/<id>/` when it has some.
- **Routes** (`src/data/routes.js`): the two lines, leg waypoints on the map, miles, days, and the
  regions the ride passes through. The ride's scenery and weather are generated from these.

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
- `src/scenes/`: title, map, yard, and placeholder screens
- `src/cities/`: one folder per stop
- `src/data/`: routes
- `scripts/build-map.mjs`: extracts the land silhouette and rail lines from the source map
