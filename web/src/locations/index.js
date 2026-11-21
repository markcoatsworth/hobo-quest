// Every stop on the journey, each hand-built in its own folder:
//
//   src/locations/<id>/index.js   who and where: id, name, map position,
//                                 blurb; it pulls in the rest
//   src/locations/<id>/town.js    the main street (`town`, below)
//   src/locations/<id>/yard.js    the rail yard (`yard`, below), with any
//                                 behaviour of its own (hooks, below)
//   src/locations/<id>/<area>/    its other areas, when it has some (New
//                                 York's family_home/)
//   public/locations/<id>/        art, music etc. for it, when there is some
//
// <id> is the location's name in snake_case (new_york, el_paso,
// washington_dc), the same for its folder, its `id` field and the rail
// lines in src/rail/network.json.
//
// A location is made of areas: places you walk around side-on, played by
// src/scenes/area.js. Its `town` is the main street; `areas` holds any
// others, indoors or out, joined to each other by exits. Nothing about a
// location is generated: its areas, its people and its rail yard are all
// written out, so each one can be shaped by hand.
//
// Whether the map lets you go straight to the yard, or makes you walk there
// through town, is up to each location (yard.fromMap).
//
// A location module's default export:
//
// {
//   id, name,
//   at: [x, y],          position on the source rail map (source-image pixels)
//   blurb,               one or two lines shown on the map
//
//   areas?: { id: area } other areas, in the same format as `town` (below).
//                        An area with a mapLabel is offered on the map; the
//                        rest are reached through exits.
//
//   town: {              the main street (area id 'town'). An area:
//     name?,             heading while you're here (default: the location's name)
//     mapLabel?,         its option on the map (default for the town:
//                        "Explore <name>"; other areas need one to be listed)
//     width,             length of the main street in px (the screen is 1280)
//     start,             where you walk in
//     sky,               'day' | 'dusk' | 'night' | 'haze' | 'desert' | 'overcast'
//     ground?,           'street' (default) | 'dirt'
//     facing?, camera?,  which way you face on arrival (1 right, -1 left), and
//                        where the view starts (left edge, px)
//     feet?, figureHeight?
//                        where people stand (y) and how tall they are, for
//                        areas that draw their own people
//     interior?: { wall, wainscot, floor, windows: [x], stains: [x] }
//                        indoors: wallpaper and floorboards instead of sky,
//                        skyline and street
//     props: [...],      things you can look at: { kind, x, name, lines: [...] }.
//                        kind: 'door' | 'coat' | 'table' | 'sink' | 'stove' |
//                        'calendar' | 'photo' | 'bed' | 'mailbox' | 'notice' |
//                        'cupboard' (drawn in src/scenes/area.js). Without
//                        lines it's just scenery. With take: <item id> (and
//                        an id), looking all the way through hands Scout the
//                        item; afterwards it shows emptyLines instead.
//     exits: [...],      ways to other areas of this location:
//                        { x, to: <area id>, at: x to arrive at, label,
//                          sign?: text on a fingerpost there }
//     far: [...],        background silhouettes: { shape: 'block' | 'tower' |
//                        'spire' | 'dome' | 'stack' | 'mountain' | 'tank', x, w, h }
//     buildings: [...],  street frontage, left to right:
//                        { x, w, h, wall, roof?: 'flat' | 'gable' | 'false-front',
//                          sign?, place?: <place id>, windows?: false (none),
//                          shop?: false (no shop front on a place) }
//     places: { id: { name, kind, blurb, stock?, game? } }
//                        kind: 'store' | 'diner' | 'mission' | 'lodging' |
//                        'landmark' | 'game' | 'home'. stock: [[item, price]]; game: the
//                        mini-game it will host.
//     npcs: [...],       { id, name, x, look: { coat, pants, hat, skin }, lines: [...] }
//                        Talking to them is a conversation (src/ui/dialog.js,
//                        the same everywhere): a line is a string (the person
//                        speaking) or { by: <character id>, text } for someone
//                        else in it, e.g. Scout answering.
//                        Their headshot shows in the conversation if they're
//                        a character (joins, or character: <id>); anyone else
//                        gets a plain grey head for now.
//                        character?: <character id>: this is that character
//                        (their headshot), without joining
//                        joins?: <character id>: someone who joins the party
//                        when the conversation ends (name and look then
//                        default to their character file's), and isn't
//                        standing here after that. (To meet someone who
//                        can't be missed, use a yard's `meet`.)
//     lamps: [x, ...],   street lamps
//     yardSign,          x of the way to the rail yard (omit where there's no yard)
//     draw?: { far?(ctx, view), street?(ctx, view), backdrop?(ctx, view),
//              person?(ctx, { x, feet, look, facing, step, t, player }), over?(ctx, view) }
//                        custom drawing, for whatever an area needs that the
//                        data can't say. far/street: on top of the generic
//                        layers. backdrop: instead of them (the area draws its
//                        whole world, as the family home does to match the
//                        opening cutscene). person: draws its people. over:
//                        on top of everything but the header and prompts.
//                        view = { camX, W, H, base, t }
//   },
//
//   yard: {              the rail yard you leave from (omit where no freights leave)
//     fromMap?,          false: the map doesn't offer the yard; you have to
//                        walk to the yard sign in town (New York, Chicago)
//     player,            your starting height (y) at the west fence
//     office?: { x, y }, the yard office (the middle of it), with the board
//                        of tonight's departures in its east window. Put it
//                        in an aisle between tracks that no bull walks.
//     tracks: [...],     sidings, west to east, numbered from 1; the main
//                        line along the east fence comes after them:
//                        { x }   kept clear, for a departing freight
//                        { x, cars: 'BB.TBB' }   parked: one letter per car
//                        length from the north fence, '.' an empty space
//                        { x, moving: 'EBB', speed, dir: 1 | -1, at }
//                        a cut being shunted: engine first, dir 1 = south,
//                        at = where its lead end starts (y)
//                        Car letters: B boxcar, b brown boxcar, R reefer,
//                        T tank, G gondola, E switch engine.
//     trains: [...],     the freights leaving tonight, all at once on their own
//                        tracks: { to, track?, number, cars?, open, departs, card? }
//                        to: the city it's bound for, joined to this one by a
//                        line in src/rail/network.json; track: its track number
//                        (default: the main line), a siding kept clear; number:
//                        the engine's number, on its plate and on the office
//                        board; cars: letters from the engine back; open: which
//                        car (index) has its door open; departs: seconds until
//                        it pulls out (each second is a minute on the yard
//                        clock, from 9 p.m.); card: which car has a destination
//                        card tacked on. Only cars 1 to 5 are inside the yard,
//                        so the open door and the card go on those. Nothing on
//                        screen says which train is which until Scout reads a
//                        card, or the board and a plate. All checked by
//                        `npm run check`.
//     bulls: [...],      { x, y, dir }: each walks the aisle at x
//     meet?: { joins, x, y, lines, name?, look? }
//                        someone waiting in the yard to join the party
//                        (joins: their character id). They stop Scout as
//                        Scout comes near and the yard waits while they
//                        talk (lines, as an NPC's); then they join. Put them
//                        by the gate and they can't be missed (Jesse,
//                        Cleveland). Gone once they're in the party.
//
//     Hooks, for what's particular to one yard (all optional). Each gets
//     the yard scene as `yard` (yard.t: seconds in; yard.top / yard.bottom:
//     the fences; yard.player, yard.trains, yard.bulls, yard.notes):
//     setup(yard),       once, on the way in. Push rects onto yard.obstacles
//                        for anything solid: they block walking and sight.
//     update(yard, dt),  every frame
//     draw: { ground(ctx, yard), over(ctx, yard) }
//                        ground: under the cars, over the cinders; over: on
//                        top of everything but the header
//     clues: [...],      more things to read, beside the cards, plates and
//                        board: { x, y, verb, title, lines, learn?, range? },
//                        shown while Scout stands within range.
//                        learn: { track, to } puts that freight's destination
//                        in the notebook (Kansas City's tally board)
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
import oklahoma_city from './oklahoma_city/index.js';
import albuquerque from './albuquerque/index.js';
import flagstaff from './flagstaff/index.js';
import buffalo from './buffalo/index.js';
import toledo from './toledo/index.js';

export const LOCATIONS = Object.fromEntries(
  [new_york, cleveland, chicago, kansas_city, philadelphia, washington_dc, nashville, clarksdale, dallas, el_paso, phoenix, los_angeles, oklahoma_city, albuquerque, flagstaff, buffalo, toledo].map((c) => [c.id, c]),
);
