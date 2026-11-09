// Nashville: a river town of churches, printing houses and radio fiddlers.

export default {
  id: 'nas',
  name: 'Nashville',
  at: [765, 492],
  blurb: 'A fiddle somewhere up the street. A cop on every corner near the yards.',

  town: {
    width: 2200,
    start: 160,
    sky: 'day',
    far: [
      { shape: 'mountain', x: 0, w: 600, h: 120 },
      { shape: 'dome', x: 320, w: 160, h: 200 }, // capitol on the hill
      { shape: 'mountain', x: 520, w: 700, h: 100 },
      { shape: 'tower', x: 760, w: 70, h: 230 },
      { shape: 'spire', x: 1000, w: 40, h: 240 },
      { shape: 'mountain', x: 1100, w: 800, h: 130 },
      { shape: 'block', x: 1300, w: 180, h: 150 },
    ],
    buildings: [
      { x: 0, w: 200, h: 180, wall: '#9a7a5a' },
      { x: 210, w: 260, h: 220, wall: '#a4523a', sign: 'Barn Dance Hall', place: 'hall', roof: 'gable' },
      { x: 480, w: 200, h: 200, wall: '#7a6250' },
      { x: 690, w: 220, h: 180, wall: '#b49a74', sign: 'General Store', place: 'store', roof: 'false-front' },
      { x: 920, w: 230, h: 260, wall: '#e2dac6', sign: 'Church', place: 'church', roof: 'gable' },
      { x: 1160, w: 220, h: 190, wall: '#8a6a52', sign: 'Meat & Three', place: 'cafe' },
      { x: 1390, w: 260, h: 210, wall: '#6a5444' },
      { x: 1660, w: 540, h: 190, wall: '#7a6450' },
    ],
    places: {
      hall: {
        name: 'Barn Dance Hall',
        kind: 'game',
        blurb: 'Saturday nights the radio station broadcasts from here: fiddles, banjos and a harmonica that can sound like a train.',
        game: 'Fiddle contest',
      },
      store: {
        name: 'General Store',
        kind: 'store',
        blurb: 'Feed sacks, coal oil and a cracker barrel. The owner extends credit to nobody he hasn’t known twenty years.',
        stock: [
          ['Crackers and cheese', '5¢'],
          ['Box of matches', '1¢'],
          ['Tobacco plug', '10¢'],
        ],
      },
      church: {
        name: 'Downtown Church',
        kind: 'mission',
        blurb: 'The ladies’ auxiliary serves cornbread and beans on Wednesdays.',
      },
      cafe: {
        name: 'Meat & Three',
        kind: 'diner',
        blurb: 'Pick a meat and three sides off the steam table.',
        stock: [['Plate with cornbread', '20¢']],
      },
    },
    npcs: [
      {
        id: 'fiddler',
        name: 'Fiddler',
        x: 560,
        look: { coat: '#5a4a3a', pants: '#3a3a4a', hat: 'straw', skin: '#e6c0a0' },
        lines: [
          'Got my break on the radio last spring. Pays in fame, not dollars.',
          'Heading for the Delta? Listen for the blues down there. It’ll put this fiddle to shame.',
        ],
      },
      {
        id: 'preacher',
        name: 'Street Preacher',
        x: 1350,
        look: { coat: '#1e1e22', pants: '#1a1a1e', hat: 'fedora', skin: '#d8ae8a' },
        lines: [
          'The Lord provides, brother, but He helps those who walk to the church on Wednesday.',
          'Mind the yard police. They’ve been fierce since the mill fire.',
        ],
      },
    ],
    lamps: [150, 520, 950, 1390, 1750],
    yardSign: 2100,
  },

  yard: {
    departs: 45,
    player: 230,
    tracks: [
      { x: 190, cars: 'B.BBB.' },
      { x: 405, moving: 'EBB', speed: 80, dir: 1, at: 100 },
      { x: 620, cars: 'GG.BGG' },
      { x: 835, moving: 'EGG', speed: 70, dir: -1, at: 550 },
      { x: 1050, cars: 'BB.BTB' },
    ],
    train: { open: 3 },
    bulls: [{ x: 1106, y: 350, dir: 1 }],
  },
};
