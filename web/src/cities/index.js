// Every stop on the journey, each hand-built in its own folder:
//
//   src/cities/<id>/index.js   the city's definition (below)
//   public/cities/<id>/        art, music etc. for it, when there is some
//
// Nothing about a city is generated: its town, its people and its rail yard
// are all written out in its module, so each one can be shaped by hand.
//
// A city module's default export:
//
// {
//   id, name,
//   at: [x, y],          position on the source rail map (source-image pixels)
//   blurb,               one or two lines shown on the map
//
//   town: {
//     width,             length of the main street in px (the screen is 1280)
//     start,             where you walk in
//     sky,               'day' | 'dusk' | 'night' | 'haze' | 'desert'
//     far: [...],        background silhouettes: { shape: 'block' | 'tower' |
//                        'spire' | 'dome' | 'stack' | 'mountain' | 'tank', x, w, h }
//     buildings: [...],  street frontage, left to right:
//                        { x, w, h, wall, roof?: 'flat' | 'gable' | 'false-front',
//                          sign?, place?: <place id> }
//     places: { id: { name, kind, blurb, stock?, game? } }
//                        kind: 'store' | 'diner' | 'mission' | 'lodging' |
//                        'landmark' | 'game'. stock: [[item, price]]; game: the
//                        mini-game it will host.
//     npcs: [...],       { id, name, x, look: { coat, pants, hat, skin }, lines: [...] }
//     lamps: [x, ...],   street lamps
//     yardSign,          x of the way to the rail yard (omit where there's no yard)
//     draw?: { far?(ctx, view), street?(ctx, view) }
//                        optional custom drawing on top of the generic layers,
//                        for whatever a city needs that the data can't say.
//                        view = { camX, W, H, base, t }
//   },
//
//   yard: {              the rail yard you leave from (omit at the last stop)
//     departs,           seconds until the freight pulls out
//     player,            your starting height (y) at the west fence
//     tracks: [...],     sidings, west to east:
//                        { x, cars: 'BB.TBB' }   parked: one letter per car
//                        length from the north fence, '.' an empty space
//                        { x, moving: 'EBB', speed, dir: 1 | -1, at }
//                        a cut being shunted: engine first, dir 1 = south,
//                        at = where its lead end starts (y)
//                        Car letters: B boxcar, b brown boxcar, R reefer,
//                        T tank, G gondola, E switch engine.
//     train: { cars?, open },  the departing freight: letters from the engine
//                        back, and which car (index) has its door open
//     bulls: [...],      { x, y, dir }: each walks the aisle at x
//   },
// }

import nyc from './nyc/index.js';
import cle from './cle/index.js';
import chi from './chi/index.js';
import kc from './kc/index.js';
import phl from './phl/index.js';
import dc from './dc/index.js';
import nas from './nas/index.js';
import clk from './clk/index.js';
import dal from './dal/index.js';
import elp from './elp/index.js';
import phx from './phx/index.js';
import la from './la/index.js';

export const CITIES = Object.fromEntries([nyc, cle, chi, kc, phl, dc, nas, clk, dal, elp, phx, la].map((c) => [c.id, c]));
