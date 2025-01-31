import { BuildingPreset } from '../classes/Building';

export const BUILDING_PRESETS: Record<string, BuildingPreset> = {
  ACADEMY: {
    name: 'Academy',
    height: 4,
    width: 4,
    cost: [200, 800, 1000, 1200, 1500],
    employees: 20,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  APOTHECARY: {
    name: 'Apothecary',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employees: 5,
    desireBoxes: [
      { baseDesirability: 1, stepDist: 1, stepVal: -1, maxRange: 1 },
    ],
  },
  ARCHITECT: {
    name: 'Architect’s Post',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employees: 5,
    desireBoxes: [
      // Intentionally left blank! No desirability effect!
    ],
  },
  BAZAAR: {
    name: 'Bazaar',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employees: 5,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  BREWERY: {
    name: 'Brewery',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -5, stepDist: 1, stepVal: 1, maxRange: 5 },
    ],
  },
  BRICKWORKS: {
    name: 'Brickworks',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  CATTLERANCH: {
    name: 'Cattle Ranch',
    height: 3,
    width: 3,
    cost: [15, 60, 75, 90, 112],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  CHARIOTMAKER: {
    name: 'Chariot Maker',
    height: 4,
    width: 4,
    cost: [50, 200, 250, 300, 375],
    employees: 30,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  CLAYPIT: {
    name: 'Clay Pit',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  CONSERVATORY: {
    name: 'Conservatory',
    height: 3,
    width: 3,
    cost: [20, 80, 100, 120, 150],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  COURTHOUSE: {
    name: 'Courthouse',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employees: 10,
    desireBoxes: [
      { baseDesirability: 8, stepDist: 2, stepVal: -2, maxRange: 3 },
    ],
  },
  DANCESCHOOL: {
    name: 'Dance School',
    height: 4,
    width: 4,
    cost: [30, 120, 150, 180, 225],
    employees: 10,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  DENTIST: {
    name: 'Dentist',
    height: 1,
    width: 1,
    cost: [10, 40, 50, 60, 75],
    employees: 2,
    desireBoxes: [
      { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    ],
  },
  DOCK: {
    name: 'Dock',
    height: 3,
    width: 3,
    cost: [20, 80, 100, 120, 150],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    ],
  },
  FERRYTERMINAL: {
    name: 'Ferry Terminal',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employees: 5,
    desireBoxes: [
      { baseDesirability: -5, stepDist: 2, stepVal: 2, maxRange: 4 },
    ],
  },
  FESTIVALPAVILION: {
    name: 'Festival Pavilion',
    height: 5,
    width: 5,
    cost: [100, 400, 500, 600, 750],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 16, stepDist: 2, stepVal: -3, maxRange: 5 },
    ],
  },
  FIREHOUSE: {
    name: 'Firehouse',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employees: 6,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  FISHINGWHARF: {
    name: 'Fishing Wharf',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employees: 6,
    desireBoxes: [
      { baseDesirability: -8, stepDist: 2, stepVal: 2, maxRange: 4 },
    ],
  },
  FORT: {
    name: 'Fort',
    height: 4,
    width: 7,
    cost: [200, 800, 1000, 1200, 1500],
    employees: 0,
    desireBoxes: [
      { baseDesirability: -20, stepDist: 2, stepVal: 2, maxRange: 6 },
    ],
  },
  GARDEN: {
    name: 'Garden',
    height: 1,
    width: 1,
    cost: [3, 10, 12, 14, 18],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    ],
  },
  GATEHOUSE: {
    name: 'Gatehouse',
    height: 2,
    width: 5,
    cost: [80, 320, 400, 480, 600],
    employees: 0,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  GRANARY: {
    name: 'Granary',
    height: 4,
    width: 4,
    cost: [50, 200, 250, 300, 375],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -8, stepDist: 1, stepVal: 2, maxRange: 4 },
    ],
  },
  ARTISAN: {
    name: 'Guild, Artisans',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employees: 20,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  BRICKLAYER: {
    name: 'Guild, Bricklayers',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 10,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  CARPENTER: {
    name: 'Guild, Carpenters',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  STONEMASON: {
    name: 'Guild, Stonemasons',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  HUNTINGLODGE: {
    name: 'Hunting Lodge',
    height: 2,
    width: 2,
    cost: [5, 20, 25, 30, 37],
    employees: 6,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 2, maxRange: 4 },
    ],
  },
  JEWELER: {
    name: 'Jeweler',
    height: 2,
    width: 2,
    cost: [18, 75, 90, 110, 135],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  JUGGLERSCHOOL: {
    name: 'Juggler School',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 5,
    desireBoxes: [
      { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    ],
  },
  LAMPMAKER: {
    name: 'Lamp Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  LIBRARY: {
    name: 'Library',
    height: 3,
    width: 3,
    cost: [90, 360, 450, 540, 675],
    employees: 30,
    desireBoxes: [
      { baseDesirability: 8, stepDist: 2, stepVal: -2, maxRange: 6 },
    ],
  },
  MANSIONSMALL: {
    name: 'Mansion, Personal',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 12, stepDist: 2, stepVal: -2, maxRange: 4 },
    ],
  },
  MANSIONMEDIUM: {
    name: 'Mansion, Family',
    height: 4,
    width: 4,
    cost: [80, 320, 400, 480, 600],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 20, stepDist: 2, stepVal: -3, maxRange: 5 },
    ],
  },
  MANSIONLARGE: {
    name: 'Mansion, Dynasty',
    height: 5,
    width: 5,
    cost: [140, 560, 700, 840, 1050],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 28, stepDist: 2, stepVal: -4, maxRange: 6 },
    ],
  },
  COPPERMINE: {
    name: 'Mine, Copper',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employees: 10,
    desireBoxes: [
      { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    ],
  },
  GEMSTONEMINE: {
    name: 'Mine, Gemstone',
    height: 2,
    width: 2,
    cost: [80, 320, 400, 480, 600],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    ],
  },
  GOLDMINE: {
    name: 'Mine, Gold',
    height: 2,
    width: 2,
    cost: [50, 200, 250, 300, 375],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -16, stepDist: 2, stepVal: 3, maxRange: 6 },
    ],
  },
  MORTUARY: {
    name: 'Mortuary',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 2, stepVal: 1, maxRange: 2 },
    ],
  },
  PAINTMAKER: {
    name: 'Paint Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  PALACESMALL: {
    name: 'Palace, Village',
    height: 4,
    width: 4,
    cost: [180, 720, 900, 1080, 1350],
    employees: 20,
    desireBoxes: [
      { baseDesirability: 20, stepDist: 2, stepVal: -4, maxRange: 4 },
    ],
  },
  PALACEMEDIUM: {
    name: 'Palace, Town',
    height: 5,
    width: 5,
    cost: [200, 800, 1000, 1200, 1500],
    employees: 25,
    desireBoxes: [
      { baseDesirability: 22, stepDist: 2, stepVal: -5, maxRange: 5 },
    ],
  },
  PALACEBIG: {
    name: 'Palace, City',
    height: 6,
    width: 6,
    cost: [240, 950, 1200, 1440, 1800],
    employees: 30,
    desireBoxes: [
      { baseDesirability: 24, stepDist: 2, stepVal: -6, maxRange: 6 },
    ],
  },
  PAPYRUSMAKER: {
    name: 'Papyrus Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  PHYSICIAN: {
    name: 'Physician',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 8,
    desireBoxes: [
      { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    ],
  },
  PLAZA: {
    name: 'Plaza',
    height: 1,
    width: 1,
    cost: [3, 12, 15, 18, 22],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 4, stepDist: 1, stepVal: -2, maxRange: 2 },
    ],
  },
  POLICESTATION: {
    name: 'Police Station',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employees: 6,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  POTTER: {
    name: 'Potter',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  GRANITE: {
    name: 'Quarry, Granite',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  LIMESTONE: {
    name: 'Quarry, Limestone',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  PLAINSTONE: {
    name: 'Quarry, Plain Stone',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  SANDSTONE: {
    name: 'Quarry, Sandstone',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  RECRUITER: {
    name: 'Recruiter',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employees: 10,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  REEDGATHERER: {
    name: 'Reed Gatherer',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  ROAD: {
    name: 'Road',
    height: 1,
    width: 1,
    cost: [1, 3, 4, 5, 6],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 0, stepDist: 0, stepVal: 0, maxRange: 0 },
    ],
  },
  ROADBLOCK: {
    name: 'Roadblock',
    height: 1,
    width: 1,
    cost: [1, 4, 4, 5, 6],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 0, stepDist: 0, stepVal: 0, maxRange: 0 },
    ],
  },
  SCRIBESCHOOL: {
    name: 'Scribe School',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employees: 10,
    desireBoxes: [
      { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    ],
  },
  SENETHOUSE: {
    name: 'Senet House',
    height: 4,
    width: 4,
    cost: [300, 1200, 1500, 1800, 2250],
    employees: 25,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 2, maxRange: 3 },
    ],
  },
  SHIPWRIGHT: {
    name: 'Shipwright',
    height: 3,
    width: 3,
    cost: [70, 280, 350, 420, 525],
    employees: 20,
    desireBoxes: [
      { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    ],
  },
  SHRINE: {
    name: 'Shrine',
    height: 1,
    width: 1,
    cost: [20, 80, 100, 120, 150],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    ],
  },
  STATUESMALL: {
    name: 'Statue, Small',
    height: 1,
    width: 1,
    cost: [3, 10, 12, 14, 18],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    ],
  },
  STATUEMEDIUM: {
    name: 'Statue, Medium',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 10, stepDist: 1, stepVal: -2, maxRange: 4 },
    ],
  },
  STATUELARGE: {
    name: 'Statue, Large',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 14, stepDist: 2, stepVal: -2, maxRange: 5 },
    ],
  },
  TAXCOLLECTOR: {
    name: 'Tax Collector',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employees: 6,
    desireBoxes: [
      { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    ],
  },
  TEMPLE: {
    name: 'Temple',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employees: 8,
    desireBoxes: [
      { baseDesirability: 6, stepDist: 2, stepVal: -2, maxRange: 6 },
    ],
  },
  TOWER: {
    name: 'Tower',
    height: 2,
    width: 2,
    cost: [70, 270, 350, 420, 525],
    employees: 6,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    ],
  },
  TRANSPORTWHARF: {
    name: 'Transport Wharf',
    height: 2,
    width: 2,
    cost: [40, 160, 200, 240, 300],
    employees: 5,
    desireBoxes: [
      { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    ],
  },
  WALL: {
    name: 'Wall',
    height: 1,
    width: 1,
    cost: [7, 28, 35, 42, 52],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 0, stepDist: 0, stepVal: 0, maxRange: 0 },
    ],
  },
  WARSHIPWHARF: {
    name: 'Warship Wharf',
    height: 3,
    width: 3,
    cost: [120, 480, 600, 720, 900],
    employees: 15,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    ],
  },
  WATERLIFT: {
    name: 'Water Lift',
    height: 2,
    width: 2,
    cost: [6, 24, 30, 36, 45],
    employees: 5,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  WATERSUPPLY: {
    name: 'Water Supply',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 5,
    desireBoxes: [
      { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    ],
  },
  WEAPONSMITH: {
    name: 'Weaponsmith',
    height: 2,
    width: 2,
    cost: [24, 100, 120, 145, 180],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  WEAVER: {
    name: 'Weaver',
    height: 2,
    width: 2,
    cost: [16, 64, 80, 96, 120],
    employees: 12,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  WELL: {
    name: 'Well',
    height: 1,
    width: 1,
    cost: [1, 4, 5, 6, 7],
    employees: 0,
    desireBoxes: [
      { baseDesirability: 1, stepDist: 1, stepVal: -1, maxRange: 1 },
    ],
  },
  WOODCUTTER: {
    name: 'Wood Cutter',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 8,
    desireBoxes: [
      { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  WORKCAMP: {
    name: 'Work Camp',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employees: 20,
    desireBoxes: [
      { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    ],
  },
  ZOO: {
    name: 'Zoo',
    height: 6,
    width: 6,
    cost: [500, 1500, 2000, 2200, 2600],
    employees: 30,
    desireBoxes: [
      { baseDesirability: -6, stepDist: 1, stepVal: 2, maxRange: 3 },
    ],
  },
} as const;

/*
  BANDSTAND: {
    
    name: 'Bandstand',
    height: 3,
    width: 3,
    cost: [30, 130, 150, 180, 225],
    employees: 12,
    desireBoxes: [
      { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
    ],
  },
    BOOTH: {
    
    name: 'Booth',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employees: 8,
    desireBoxes: [
      { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
    ],
  },
    PAVILION: {
    
    name: 'Pavilion',
    height: 4,
    width: 4,
    cost: [100, 400, 500, 600, 750],
    employees: 20,
    desireBoxes: [
      { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
    ],
  },
    STORAGEYARD: {
    
    name: 'Storage Yard',
    height: 3,
    width: 3,
    cost: [14, 56, 70, 84, 105],
    employees: 6,
    desireBoxes: [
      { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
    ],
  },
    TEMPLECOMPLEX: {
    
    name: 'Temple Complex',
    height: 7,
    width: 1,
    cost: [400, 1600, 2000, 2400, 3000],
    employees: 50,
    desireBoxes: [
      { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
    ],
  },
  */
