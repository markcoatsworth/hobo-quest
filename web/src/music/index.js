// The game's music. Originals live in source/music/; `npm run music` converts
// each track listed here to an MP3 in public/music/ for the game.
//
// TRACKS: every song.
//   id: {
//     title, artist,
//     source,            file name in source/music/
//     file,              where the game loads it from, under public/
//   }
//
// PLAYLISTS: the music for each region of the country, keyed by the id of
// the city it belongs to (src/locations/). While you're in that city, its
// playlist shuffles (never the same song twice in a row unless it's the
// only one). Riding a freight, you hear the playlist of the city you left
// until you arrive. A city with no playlist of its own keeps the music of
// the last city on your trail that had one.
//
// A track in no playlist only plays when asked for by name, as a cutscene's
// `music`. It plays to its end, wherever the player goes meanwhile, then
// the playlist for wherever they are picks up.

export const TRACKS = {
  // New York
  no_depression_in_heaven: {
    title: 'No Depression in Heaven',
    artist: 'The New Lost City Ramblers',
    source: 'new-lost-city-ramblers-no-depression-in-heaven.flac',
    file: 'music/no_depression_in_heaven.mp3',
  },
  breadline_blues: {
    title: 'Breadline Blues',
    artist: 'The New Lost City Ramblers',
    source: 'new-lost-city-ramblers-breadline-blues.flac',
    file: 'music/breadline_blues.mp3',
  },
  how_can_a_poor_man: {
    title: 'How Can a Poor Man Stand Such Times and Live?',
    artist: 'The New Lost City Ramblers',
    source: 'new-lost-city-ramblers-how-can-a-poor-man-stand-such-times-and-live.flac',
    file: 'music/how_can_a_poor_man.mp3',
  },

  // Philadelphia
  forked_deer: {
    title: 'Forked Deer',
    artist: 'The New Lost City Ramblers',
    source: 'new-lost-city-ramblers-forked-deer.flac',
    file: 'music/forked_deer.mp3',
  },
};

export const PLAYLISTS = {
  // "No Depression in Heaven" is the opening cutscene's song and isn't in
  // any playlist.
  new_york: ['breadline_blues', 'how_can_a_poor_man'],
  philadelphia: ['forked_deer'],
};
