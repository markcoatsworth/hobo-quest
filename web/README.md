# Hobo Quest — web prototype

Browser prototype for trying out ideas before building them in GameMaker (`../gamemaker`).
Vanilla JS + Vite, drawing to a single canvas at a fixed 1280×720 that scales to the window.

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run check    # sanity-check the rail network and the yards' trains
npm run music    # convert the songs in ../source/music to MP3s in public/music (needs ffmpeg)
npm run map      # rebuild public/map/*.png from ../source/usa-rail-network-2010.png
```

## The game so far

Title → opening cutscene → the family home → New York → yard → ride → map → (town) → yard → … → Los Angeles.

- **Opening** (`src/cutscenes/opening/`): plays on New Game. Up the Hudson from New York City,
  a sheriff drives a teenager home from jail, let out early because their father has died.
  Short conversations in the car alternate with the Depression-era valley going by (a shut
  mill, a foreclosed farm, a breadline, the river road, a freight with riders on top), about
  two and a half minutes in all. The drawing is in `art.js`, the dialogue in `index.js`. Confirm moves the dialogue
  on, Back skips it. It ends with you standing in the farmyard, playable, as the sheriff drives
  off.
- **Map** (`src/scenes/map.js`): the rail network, where you are, the trail you've ridden, and
  the freights leaving this city's yard. There's no route to choose: where you go next depends
  on which train you catch in the yard. The journey saves in every city; Continue resumes it.
  Each location decides whether the map offers its yard directly (`yard.fromMap`): New York
  and Chicago make you walk through the city to the yard sign; smaller places let you go
  straight to the yard.
- **Ride** (`src/scenes/travel.js`): Oregon Trail-style travel screen. The freight runs west
  through scenery that changes by region (per line in `src/rail/network.json`), with day and night,
  weather, and a status panel: date (from April 4, 1932), weather, next stop, miles. Hold confirm
  to hurry. Quitting mid-ride resumes at the start of that ride.
- **Areas** (`src/scenes/area.js`): every place you walk around side-on, indoors or out: each
  location's main street (`town`) and its other areas. Talk to people, look at things (props),
  step into places (stores, diners, missions, landmarks, future mini-games), take exits to
  other areas (a door, a road), and take the rail yard sign. New York's family home
  (`src/locations/new_york/family_home/`) is a farmyard with a walkable house inside and the
  road to the city at the far end. It draws itself with the opening cutscene's own art
  (`src/art/hudson.js`, shared by both), so the cutscene's last frame and the farmyard's first
  are the same picture: the sheriff drives off and you're already playing.
- **Yard** (`src/scenes/yard.js`): cross the sidings from the west fence to the open boxcar on the
  departing freight (east track) before it pulls out. A yard lists every freight that leaves it;
  for now one runs a day, taking turns (so in New York, missing the Philadelphia freight gets
  you the Cleveland one tomorrow). Several trains at once come later. Bulls patrol with
  lanterns: stay out of the light, use parked cars as cover. Shunting cars knock you down.
  Getting caught or missing the train costs a day and you try again.
- **Locations** (`src/locations/<id>/index.js`): one hand-written module per stop holding
  everything about it: map position, blurb, its areas (street layout, buildings, signs, places
  with their stock, people and their lines, things to look at, exits, skyline, lamps) and the
  rail yard (exact tracks, cars, shunting
  cuts, bulls, departure timer). Nothing about a stop is generated; edit the module to change it.
  The full format is documented at the top of `src/locations/index.js`. A city can also supply its
  own drawing code (`town.draw`), as New York does for the Third Avenue El. Put a city's art and
  audio in `public/locations/<id>/` when it has some.
- **Rail network** (`src/rail/network.json`): every line between two cities, one way only (no
  going back), with its track on
  the map, days, miles and the regions the ride passes through. Plain JSON so the GameMaker
  build can load the same file. Read through the functions in `src/systems/rail.js`.
- **Music** (`src/music/index.js`, played by `src/core/music.js`): each region has its own
  shuffled playlist, keyed by city (New York: "Breadline Blues" and "How Can a Poor Man Stand
  Such Times and Live?"; Philadelphia: "Forked Deer"). You hear the playlist of the latest city
  on your trail that has one, so cities without their own keep the last one's, and a ride keeps
  the music of the city you left until you arrive. Arriving somewhere with its own playlist
  fades the old song out. The title is silent; New Game starts the opening's song, "No
  Depression in Heaven", which is in no playlist: it plays to its end, even after the
  cutscene, then the playlist takes over. Browsers hold back sound until the first key press
  or click, so a player using only a controller may not hear it until then.
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
| mute    | M                   | (in Settings)           |

Pause opens the same menu everywhere you can pause (areas, the map, the yard, the ride):
Resume, Settings, and the scene's own choices (Back to the Map, Quit to Title). Settings
(music volume, mute, controller rumble, full screen) is also on the title screen and, for
mouse players, behind the gear in the top-right corner beside a mute button. Those two
buttons only show while the mouse is in use. Settings save in the browser, apart from the
journey (`src/core/settings.js`).

Screens keep their status (place, date) at the top left; the top right is for the buttons.

Browsers hide a controller from the page until a button is pressed while it's focused.
Button prompts follow whichever device was used last. The mouse also works on menus.

## Layout

- `src/main.js`: boot, game loop, scaling, mouse
- `src/core/`: input, menu widget, button prompts, title backdrop, saves, settings, music, RNG
- `src/ui/`: the pause menu, the Settings panel, the corner buttons
- `src/scenes/`: title, map, town, yard, ride, cutscene and placeholder screens
- `src/locations/`: one folder per stop, with subfolders for bigger areas (`new_york/family_home/`)
- `src/characters/`: one folder per major character (the player and possible party members)
- `src/cutscenes/`: one folder per cutscene (opening, happy and sad endings), played by
  `src/scenes/cutscene.js`; any video files go in `public/cutscenes/<id>/`
- `src/art/`: drawing shared between cutscenes and areas (`hudson.js`: the Hudson Valley)
- `src/rail/`: the rail network (JSON)
- `src/music/`: the track list; the files themselves are in `public/music/` (`npm run music`)
- `src/systems/`: game rules as plain functions on the journey, named GameMaker-style
  (`rail_lines_from`, ...) so they port line for line
- `scripts/build-map.mjs`: extracts the land silhouette and rail lines from the source map
