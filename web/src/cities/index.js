// Every stop on the journey, each hand-built in its own folder:
//
//   src/cities/<id>/index.js   the city's definition (below)
//   public/cities/<id>/        art, music etc. for it, when there is some
//
// <id> is the city's name in snake_case (new_york, el_paso, washington_dc),
// the same for its folder, its `id` field and the rail lines in
// src/rail/network.json.
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
//   yard: {              the rail yard you leave from (omit where no freights leave)
//     player,            your starting height (y) at the west fence
//     tracks: [...],     sidings, west to east:
//                        { x, cars: 'BB.TBB' }   parked: one letter per car
//                        length from the north fence, '.' an empty space
//                        { x, moving: 'EBB', speed, dir: 1 | -1, at }
//                        a cut being shunted: engine first, dir 1 = south,
//                        at = where its lead end starts (y)
//                        Car letters: B boxcar, b brown boxcar, R reefer,
//                        T tank, G gondola, E switch engine.
//     trains: [...],     the departing freights: { to, cars?, open, departs }
//                        to: the city it's bound for, which must be joined to
//                        this one by a line in src/rail/network.json (checked
//                        by `npm run check`); cars: letters from the engine
//                        back; open: which car (index) has its door open;
//                        departs: seconds until it pulls out. For now the yard
//                        runs one a day, taking turns in this order.
//     bulls: [...],      { x, y, dir }: each walks the aisle at x
//   },
// }

import new_york from './new_york/index.js';
import cleveland from './cleveland/index.js';
import chicago from './chicago/index.js';
import kansas_city from './kansas_city/index.js';
import philadelphia from './philadelphia/index.js';
import washington_dc from './washington_dc/index.js';
import nashville from './nashville/index.js';
import clarksdale from './clarksdale/index.js';
import dallas from './dallas/index.js';
import el_paso from './el_paso/index.js';
import phoenix from './phoenix/index.js';
import los_angeles from './los_angeles/index.js';

export const CITIES = Object.fromEntries([new_york, cleveland, chicago, kansas_city, philadelphia, washington_dc, nashville, clarksdale, dallas, el_paso, phoenix, los_angeles].map((c) => [c.id, c]));
