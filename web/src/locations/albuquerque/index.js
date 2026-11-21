// Albuquerque, 1932: a railroad town under the Sandia Mountains. The
// railroad's machine shops, a railroad hotel with its lunchroom, a picture
// palace built like a pueblo, sanatoriums full of people come for the dry
// air, and the old adobe church on the plaza.

export default {
  id: 'albuquerque',
  name: 'Albuquerque',
  at: [350, 519],
  blurb: 'Adobe and railroad shops under the Sandia Mountains. Dry air, cold nights, and a long way still to go.',

  town: {
    width: 2200,
    start: 160,
    sky: 'desert',
    far: [
      { shape: 'mountain', x: -60, w: 1100, h: 270 }, // the Sandias, east of town
      { shape: 'block', x: 300, w: 120, h: 120 },
      { shape: 'block', x: 700, w: 160, h: 140 },
      { shape: 'mountain', x: 950, w: 900, h: 220 },
      { shape: 'tank', x: 1250, w: 80, h: 150 }, // the railroad's water tank
    ],
    buildings: [
      { x: 0, w: 220, h: 150, wall: '#c9a57e' },
      { x: 230, w: 320, h: 200, wall: '#b8875c', sign: 'Railroad Shops', place: 'shops' },
      { x: 560, w: 210, h: 160, wall: '#d6b48c', sign: 'Lunchroom', place: 'lunchroom', roof: 'false-front' },
      { x: 780, w: 260, h: 190, wall: '#a8643e', sign: 'Picture Show', place: 'show' },
      { x: 1050, w: 230, h: 150, wall: '#c49a6c', sign: 'Trading Post', place: 'trading', roof: 'false-front' },
      { x: 1290, w: 300, h: 220, wall: '#d8c8a8', sign: 'Sanatorium', place: 'sanatorium', roof: 'gable' },
      { x: 1600, w: 220, h: 170, wall: '#c09468', sign: 'Old Plaza Church', place: 'church', roof: 'gable' },
      { x: 1830, w: 370, h: 160, wall: '#b88e66' },
    ],
    places: {
      shops: {
        name: 'Railroad Shops',
        kind: 'landmark',
        blurb: 'Acres of machine shops where the railroad mends its engines. A thousand men worked here once. Now it’s three days a week, and the gateman knows every face.',
      },
      lunchroom: {
        name: 'Railroad Hotel Lunchroom',
        kind: 'diner',
        blurb: 'White aprons, polished counters, and prices meant for passengers off the limited.',
        stock: [
          ['Coffee and a doughnut', '10¢'],
          ['Blue plate special', '35¢'],
        ],
      },
      show: {
        name: 'Picture Show',
        kind: 'landmark',
        blurb: 'A picture palace built like a pueblo, thunderbirds painted on the walls. A dime gets two features and a newsreel, and a warm seat for three hours.',
      },
      trading: {
        name: 'Trading Post',
        kind: 'store',
        blurb: 'Navajo blankets, silver bracelets and postcards for the tourists off the passenger trains. Not much for anyone off a freight.',
        stock: [
          ['Postcard', '1¢'],
          ['Piñon nuts, a bag', '5¢'],
          ['Canteen', '25¢'],
        ],
      },
      sanatorium: {
        name: 'Sanatorium',
        kind: 'landmark',
        blurb: 'Folks come from all over with the lungers’ cough, for the dry air. Some get better. The rest are buried up on the hill.',
      },
      church: {
        name: 'The Old Plaza Church',
        kind: 'mission',
        blurb: 'The adobe church on the old plaza, older than the railroad by a long way. The padre hands out tortillas after mass.',
      },
    },
    npcs: [
      {
        id: 'machinist',
        name: 'Shop Machinist',
        x: 680,
        look: { coat: '#4a4a52', pants: '#3a3a44', hat: 'cap', skin: '#c8946a' },
        lines: [
          'Fixed engines for the railroad twenty years. Now it’s three days a week, if they call you at all.',
          'Westbound freights change crews here. The bulls are thick around the shops, so go wide.',
        ],
      },
      {
        id: 'lunger',
        name: 'Health Seeker',
        x: 1560,
        look: { coat: '#6a6a6a', pants: '#3a3a3a', hat: 'fedora', skin: '#e6c8b0' },
        lines: [
          'Came out from Chicago for my lungs. The doctor said dry air or a pine box.',
          'The line west climbs up into the pines at Flagstaff. Colder up there than you’d believe.',
        ],
      },
    ],
    lamps: [225, 775, 1285, 1825],
    yardSign: 2100,
  },

  yard: {
    player: 300,
    office: { x: 512, y: 220 }, // the yard office, its board in the window
    tracks: [
      { x: 190, cars: 'B.BBRB' },
      { x: 405, moving: 'EBB', speed: 85, dir: -1, at: 500 },
      { x: 620 }, // kept clear for a departing freight
      { x: 835, cars: 'RB.BTB' },
      { x: 1050, cars: 'BB.GBB' },
    ],
    trains: [
      { to: 'flagstaff', number: '3760', open: 3, departs: 50 },
      { to: 'el_paso', track: 3, number: '2412', open: 4, departs: 75, card: 2 },
    ],
    bulls: [
      { x: 1106, y: 280, dir: 1 },
      { x: 727, y: 460, dir: -1 },
    ],
  },
};
