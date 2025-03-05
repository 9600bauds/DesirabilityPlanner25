import Blueprint from '../types/Blueprint';
import { Tile } from '../utils/geometry';

export const ALL_BLUEPRINTS: Record<string, Blueprint> = {
  Academy: {
    label: 'Academy',
    height: 4,
    width: 4,
    cost: [200, 800, 1000, 1200, 1500],
    employeesRequired: 20,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'MILITARY',
  },
  Apothecary: {
    label: 'Apothecary',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employeesRequired: 5,
    desireBox: { baseDesirability: 1, stepDist: 1, stepVal: -1, maxRange: 1 },
    category: 'HEALTH',
  },
  Architect: {
    label: 'Architect',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employeesRequired: 5,
    // No desirability effect!
    category: 'GOVT',
  },
  Bazaar: {
    label: 'Bazaar',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employeesRequired: 5,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'STORAGE',
  },
  Brewery: {
    label: 'Brewery',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employeesRequired: 12,
    desireBox: { baseDesirability: -5, stepDist: 1, stepVal: 1, maxRange: 5 },
    category: 'INDUSTRY',
  },
  Brickworks: {
    label: 'Brickworks',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  'Cattle Ranch': {
    label: 'Cattle Ranch',
    height: 3,
    width: 3,
    cost: [15, 60, 75, 90, 112],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'FOOD',
  },
  'Chariot Maker': {
    label: 'Chariot Maker',
    height: 4,
    width: 4,
    cost: [50, 200, 250, 300, 375],
    employeesRequired: 30,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'MILITARY',
  },
  'Clay Pit': {
    label: 'Clay Pit',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employeesRequired: 8,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'INDUSTRY',
  },
  Conservatory: {
    label: 'Conservatory',
    height: 3,
    width: 3,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 8,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'FUN',
  },
  Courthouse: {
    label: 'Courthouse',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 10,
    desireBox: { baseDesirability: 8, stepDist: 2, stepVal: -2, maxRange: 3 },
    category: 'GOVT',
  },
  'Dance School': {
    label: 'Dance School',
    height: 4,
    width: 4,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 10,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'FUN',
  },
  Dentist: {
    label: 'Dentist',
    height: 1,
    width: 1,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 2,
    desireBox: { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    category: 'HEALTH',
  },
  Dock: {
    label: 'Dock',
    height: 3,
    width: 3,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 12,
    desireBox: { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    category: 'STORAGE',
  },
  'Ferry Terminal': {
    label: 'Ferry Terminal',
    height: 2,
    width: 2,
    cost: [8, 32, 40, 48, 60],
    employeesRequired: 5,
    desireBox: { baseDesirability: -5, stepDist: 2, stepVal: 2, maxRange: 4 },
    category: 'GOVT',
  },
  'Festival Pavilion': {
    label: 'Festival Pavilion',
    height: 5,
    width: 5,
    cost: [100, 400, 500, 600, 750],
    employeesRequired: 0,
    desireBox: { baseDesirability: 16, stepDist: 2, stepVal: -3, maxRange: 5 },
    category: 'RELIGION',
  },
  Firehouse: {
    label: 'Fire House',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employeesRequired: 6,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'GOVT',
  },
  'Fishing Wharf': {
    label: 'Fishing Wharf',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employeesRequired: 6,
    desireBox: { baseDesirability: -8, stepDist: 2, stepVal: 2, maxRange: 4 },
    category: 'FOOD',
  },
  Garden: {
    label: 'Garden',
    height: 1,
    width: 1,
    cost: [3, 10, 12, 14, 18],
    employeesRequired: 0,
    desireBox: { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    category: 'BEAUTY',
  },
  Gatehouse_1: {
    label: 'Gatehouse',
    height: 2,
    width: 5,
    cost: [80, 320, 400, 480, 600],
    employeesRequired: 0,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'MILITARY',
  },
  Gatehouse_2: {
    label: 'Gatehouse',
    height: 5,
    width: 2,
    cost: [80, 320, 400, 480, 600],
    employeesRequired: 0,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'MILITARY',
  },
  Granary: {
    label: 'Granary',
    height: 4,
    width: 4,
    cost: [50, 200, 250, 300, 375],
    employeesRequired: 12,
    desireBox: { baseDesirability: -8, stepDist: 1, stepVal: 2, maxRange: 4 },
    category: 'STORAGE',
  },
  'Hunting Lodge': {
    label: 'Hunting Lodge',
    height: 2,
    width: 2,
    cost: [5, 20, 25, 30, 37],
    employeesRequired: 6,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 2, maxRange: 4 },
    category: 'FOOD',
  },
  Jeweler: {
    label: 'Jeweler',
    height: 2,
    width: 2,
    cost: [18, 75, 90, 110, 135],
    employeesRequired: 12,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'INDUSTRY',
  },
  'Juggler School': {
    label: 'Juggler School',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 5,
    desireBox: { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    category: 'FUN',
  },
  'Lamp Maker': {
    label: 'Lamp Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  Library: {
    label: 'Library',
    height: 3,
    width: 3,
    cost: [90, 360, 450, 540, 675],
    employeesRequired: 30,
    desireBox: { baseDesirability: 8, stepDist: 2, stepVal: -2, maxRange: 6 },
    category: 'EDUCATION',
  },
  'Mansion, Personal': {
    label: 'Personal Mansion',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 0,
    desireBox: { baseDesirability: 12, stepDist: 2, stepVal: -2, maxRange: 4 },
    category: 'GOVT',
  },
  'Mansion, Family': {
    label: 'Family Mansion',
    height: 4,
    width: 4,
    cost: [80, 320, 400, 480, 600],
    employeesRequired: 0,
    desireBox: { baseDesirability: 20, stepDist: 2, stepVal: -3, maxRange: 5 },
    category: 'GOVT',
  },
  'Mansion, Dynasty': {
    label: 'Dynasty Mansion',
    height: 5,
    width: 5,
    cost: [140, 560, 700, 840, 1050],
    employeesRequired: 0,
    desireBox: { baseDesirability: 28, stepDist: 2, stepVal: -4, maxRange: 6 },
    category: 'GOVT',
  },
  'Mine, Copper': {
    label: 'Copper Mine',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 10,
    desireBox: { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    category: 'INDUSTRY',
  },
  'Mine, Gemstone': {
    label: 'Gemstone Mine',
    height: 2,
    width: 2,
    cost: [80, 320, 400, 480, 600],
    employeesRequired: 8,
    desireBox: { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    category: 'INDUSTRY',
  },
  'Mine, Gold': {
    label: 'Gold Mine',
    height: 2,
    width: 2,
    cost: [50, 200, 250, 300, 375],
    employeesRequired: 12,
    desireBox: { baseDesirability: -16, stepDist: 2, stepVal: 3, maxRange: 6 },
    category: 'INDUSTRY',
  },
  'Monument Construction_Bricklayer': {
    label: "Bricklayer's Guild",
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 10,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  'Monument Construction_Carpenter': {
    label: "Carpenter's Guild",
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 8,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  'Monument Construction_Stonemason': {
    label: "Stonemason's Guild",
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 12,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  'Monument Construction_Artisan': {
    label: "Artisan's Guild",
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 20,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  Mortuary: {
    label: 'Mortuary',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 8,
    desireBox: { baseDesirability: -3, stepDist: 2, stepVal: 1, maxRange: 2 },
    category: 'HEALTH',
  },
  'Paint Maker': {
    label: 'Paint Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  'Palace, Village': {
    label: 'Village Palace',
    height: 4,
    width: 4,
    cost: [180, 720, 900, 1080, 1350],
    employeesRequired: 20,
    desireBox: { baseDesirability: 20, stepDist: 2, stepVal: -4, maxRange: 4 },
    category: 'GOVT',
  },
  'Palace, Town': {
    label: 'Town Palace',
    height: 5,
    width: 5,
    cost: [200, 800, 1000, 1200, 1500],
    employeesRequired: 25,
    desireBox: { baseDesirability: 22, stepDist: 2, stepVal: -5, maxRange: 5 },
    category: 'GOVT',
  },
  'Palace, City': {
    label: 'City Palace',
    height: 6,
    width: 6,
    cost: [240, 950, 1200, 1440, 1800],
    employeesRequired: 30,
    desireBox: { baseDesirability: 24, stepDist: 2, stepVal: -6, maxRange: 6 },
    category: 'GOVT',
  },
  'Papyrus Maker': {
    label: 'Papyrus Maker',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  Physician: {
    label: 'Physician',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 8,
    desireBox: { baseDesirability: 2, stepDist: 1, stepVal: -1, maxRange: 2 },
    category: 'HEALTH',
  },
  Plaza: {
    label: 'Plaza',
    height: 1,
    width: 1,
    cost: [3, 12, 15, 18, 22],
    employeesRequired: 0,
    desireBox: { baseDesirability: 4, stepDist: 1, stepVal: -2, maxRange: 2 },
    category: 'BEAUTY',
  },
  'Police Station': {
    label: 'Police Station',
    height: 1,
    width: 1,
    cost: [6, 24, 30, 36, 45],
    employeesRequired: 6,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'GOVT',
  },
  Potter: {
    label: 'Potter',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employeesRequired: 12,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'INDUSTRY',
  },
  Quarry_Granite: {
    label: 'Granite Quarry',
    height: 2,
    width: 2,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 12,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'INDUSTRY',
  },
  Quarry_Limestone: {
    label: 'Limestone Quarry',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employeesRequired: 12,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'INDUSTRY',
  },
  'Quarry_Plain Stone': {
    label: 'Plain Stone Quarry',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employeesRequired: 12,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'INDUSTRY',
  },
  Quarry_Sandstone: {
    label: 'Sandstone Quarry',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 12,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'INDUSTRY',
  },
  Recruiter: {
    label: 'Recruiter',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 10,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'MILITARY',
  },
  'Reed Gatherer': {
    label: 'Reed Gatherer',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 8,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'INDUSTRY',
  },
  Road: {
    label: 'Road',
    height: 1,
    width: 1,
    cost: [1, 3, 4, 5, 6],
    employeesRequired: 0,
  },
  Roadblock: {
    label: 'Roadblock',
    height: 1,
    width: 1,
    cost: [1, 4, 4, 5, 6],
    employeesRequired: 0,
    category: 'GOVT',
  },
  'Scribe School': {
    label: 'Scribe School',
    height: 2,
    width: 2,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 10,
    desireBox: { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    category: 'EDUCATION',
  },
  'Senet House': {
    label: 'Senet House',
    height: 4,
    width: 4,
    cost: [300, 1200, 1500, 1800, 2250],
    employeesRequired: 25,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 2, maxRange: 3 },
    category: 'FUN',
  },
  Shipwright: {
    label: 'Shipwright',
    height: 3,
    width: 3,
    cost: [70, 280, 350, 420, 525],
    employeesRequired: 20,
    desireBox: { baseDesirability: -12, stepDist: 2, stepVal: 2, maxRange: 6 },
    category: 'INDUSTRY',
  },
  Shrine: {
    label: 'Shrine',
    height: 1,
    width: 1,
    cost: [20, 80, 100, 120, 150],
    employeesRequired: 0,
    desireBox: { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    category: 'RELIGION',
  },
  'Statue, Small': {
    label: 'Statue',
    height: 1,
    width: 1,
    cost: [3, 10, 12, 14, 18],
    employeesRequired: 0,
    desireBox: { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    category: 'BEAUTY',
  },
  'Statue, Medium': {
    label: 'Statue',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employeesRequired: 0,
    desireBox: { baseDesirability: 10, stepDist: 1, stepVal: -2, maxRange: 4 },
    category: 'BEAUTY',
  },
  'Statue, Large': {
    label: 'Statue',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 0,
    desireBox: { baseDesirability: 14, stepDist: 2, stepVal: -2, maxRange: 5 },
    category: 'BEAUTY',
  },
  'Tax Collector': {
    label: 'Tax Collector',
    height: 2,
    width: 2,
    cost: [15, 60, 75, 90, 112],
    employeesRequired: 6,
    desireBox: { baseDesirability: 3, stepDist: 1, stepVal: -1, maxRange: 3 },
    category: 'GOVT',
  },
  Temple: {
    label: 'Temple',
    height: 3,
    width: 3,
    cost: [30, 120, 150, 180, 225],
    employeesRequired: 8,
    desireBox: { baseDesirability: 6, stepDist: 2, stepVal: -2, maxRange: 6 },
    category: 'RELIGION',
  },
  Tower: {
    label: 'Tower',
    height: 2,
    width: 2,
    cost: [70, 270, 350, 420, 525],
    employeesRequired: 6,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 1, maxRange: 6 },
    category: 'MILITARY',
  },
  'Transport Wharf': {
    label: 'Transport Wharf',
    height: 2,
    width: 2,
    cost: [40, 160, 200, 240, 300],
    employeesRequired: 5,
    desireBox: { baseDesirability: -2, stepDist: 1, stepVal: 1, maxRange: 2 },
    category: 'MILITARY',
  },
  Wall: {
    label: 'Wall',
    height: 1,
    width: 1,
    cost: [7, 28, 35, 42, 52],
    employeesRequired: 0,
    category: 'MILITARY',
  },
  'Warship Wharf': {
    label: 'Warship Wharf',
    height: 3,
    width: 3,
    cost: [120, 480, 600, 720, 900],
    employeesRequired: 15,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 4 },
    category: 'MILITARY',
  },
  'Water Lift': {
    label: 'Water Lift',
    height: 2,
    width: 2,
    cost: [6, 24, 30, 36, 45],
    employeesRequired: 5,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'FOOD',
  },
  'Water Supply': {
    label: 'Water Supply',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 5,
    desireBox: { baseDesirability: 4, stepDist: 1, stepVal: -1, maxRange: 4 },
    category: 'HEALTH',
  },
  Weaponsmith: {
    label: 'Weaponsmith',
    height: 2,
    width: 2,
    cost: [24, 100, 120, 145, 180],
    employeesRequired: 12,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'MILITARY',
  },
  Weaver: {
    label: 'Weaver',
    height: 2,
    width: 2,
    cost: [16, 64, 80, 96, 120],
    employeesRequired: 12,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'INDUSTRY',
  },
  Well: {
    label: 'Well',
    height: 1,
    width: 1,
    cost: [1, 4, 5, 6, 7],
    employeesRequired: 0,
    desireBox: { baseDesirability: 1, stepDist: 1, stepVal: -1, maxRange: 1 },
    category: 'HEALTH',
  },
  'Wood Cutter': {
    label: 'Wood Cutter',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 8,
    desireBox: { baseDesirability: -4, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'INDUSTRY',
  },
  'Work Camp': {
    label: 'Work Camp',
    height: 2,
    width: 2,
    cost: [12, 48, 60, 72, 90],
    employeesRequired: 20,
    desireBox: { baseDesirability: -3, stepDist: 1, stepVal: 1, maxRange: 3 },
    category: 'FOOD',
  },
  Zoo: {
    label: 'Zoo',
    height: 6,
    width: 6,
    cost: [500, 1500, 2000, 2200, 2600],
    employeesRequired: 30,
    desireBox: { baseDesirability: -6, stepDist: 1, stepVal: 2, maxRange: 3 },
    category: 'FUN',
  },
  'Storage Yard': {
    label: 'Storage Yard',
    height: 3,
    width: 3,
    cost: [14, 56, 70, 84, 105],
    employeesRequired: 6,
    //No desirebox of its own!
    children: [
      { childKey: 'Storage Yard Hut', relativeOrigin: new Tile(0, 0) },
    ],
    category: 'STORAGE',
  },
  'Storage Yard Hut': {
    hidden: true,
    fillColor: 'rgb(219, 206, 194)',
    height: 1,
    width: 1,
    desireBox: { baseDesirability: -5, stepDist: 2, stepVal: 2, maxRange: 3 },
    category: 'STORAGE',
  },
  'Temple Complex_1': {
    label: 'Temple Complex',
    height: 7,
    width: 13,
    cost: [400, 1600, 2000, 2400, 3000],
    employeesRequired: 50,
    children: [
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(0, 2) },
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(3, 2) },
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(6, 2) },
    ],
    category: 'RELIGION',
  },
  'Temple Complex_2': {
    label: 'Temple Complex',
    height: 13,
    width: 7,
    cost: [400, 1600, 2000, 2400, 3000],
    employeesRequired: 50,
    children: [
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(2, 0) },
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(2, 3) },
      { childKey: 'Temple Complex Altar', relativeOrigin: new Tile(2, 6) },
    ],
    category: 'RELIGION',
  },
  'Temple Complex Altar': {
    hidden: true,
    invisible: true,
    height: 3,
    width: 3,
    desireBox: { baseDesirability: 20, stepDist: 2, stepVal: -4, maxRange: 6 },
    category: 'RELIGION',
  },
  Fort: {
    label: 'Fort',
    height: 3,
    width: 3,
    cost: [200, 800, 1000, 1200, 1500],
    desireBox: { baseDesirability: -20, stepDist: 2, stepVal: 2, maxRange: 6 },
    children: [{ childKey: 'Fort Yard', relativeOrigin: new Tile(3, -1) }],
    category: 'MILITARY',
  },
  'Fort Yard': {
    hidden: true,
    height: 4,
    width: 4,
    desireBox: { baseDesirability: -20, stepDist: 2, stepVal: 2, maxRange: 6 },
    category: 'MILITARY',
  },
  /* 

  Houses begin here

  */
  'Crude Hut_2x2': {
    label: 'Crude Hut',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -98,
    desirabilityToDevolve: -99,
    category: 'HOUSE',
  },
  'Crude Hut_1x1': {
    label: 'Crude Hut',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -98,
    desirabilityToDevolve: -99,
    category: 'HOUSE',
  },
  'Sturdy Hut_2x2': {
    label: 'Sturdy Hut',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -10,
    desirabilityToDevolve: -12,
    category: 'HOUSE',
  },
  'Sturdy Hut_1x1': {
    label: 'Sturdy Hut',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -10,
    desirabilityToDevolve: -12,
    category: 'HOUSE',
  },
  'Meager Shanty_2x2': {
    label: 'Meager Shanty',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -5,
    desirabilityToDevolve: -7,
    category: 'HOUSE',
  },
  'Meager Shanty_1x1': {
    label: 'Meager Shanty',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: -5,
    desirabilityToDevolve: -7,
    category: 'HOUSE',
  },
  'Common Shanty_2x2': {
    label: 'Common Shanty',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 0,
    desirabilityToDevolve: -2,
    category: 'HOUSE',
  },
  'Common Shanty_1x1': {
    label: 'Common Shanty',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 0,
    desirabilityToDevolve: -2,
    category: 'HOUSE',
  },
  'Rough Cottage_2x2': {
    label: 'Rough Cottage',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 4,
    desirabilityToDevolve: 2,
    category: 'HOUSE',
  },
  'Rough Cottage_1x1': {
    label: 'Rough Cottage',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 4,
    desirabilityToDevolve: 2,
    category: 'HOUSE',
  },
  'Ordinary Cottage_2x2': {
    label: 'Ordinary Cottage',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 9,
    desirabilityToDevolve: 7,
    category: 'HOUSE',
  },

  'Ordinary Cottage_1x1': {
    label: 'Ordinary Cottage',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -2,
      stepDist: 1,
      stepVal: 1,
      maxRange: 2,
    },
    desirabilityToEvolve: 9,
    desirabilityToDevolve: 7,
    category: 'HOUSE',
  },
  'Modest Homestead_2x2': {
    label: 'Modest Homestead',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -1,
      stepDist: 1,
      stepVal: 1,
      maxRange: 1,
    },
    desirabilityToEvolve: 13,
    desirabilityToDevolve: 11,
    category: 'HOUSE',
  },

  'Modest Homestead_1x1': {
    label: 'Modest Homestead',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -1,
      stepDist: 1,
      stepVal: 1,
      maxRange: 1,
    },
    desirabilityToEvolve: 13,
    desirabilityToDevolve: 11,
    category: 'HOUSE',
  },
  'Spacious Homestead_2x2': {
    label: 'Spacious Homestead',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: -1,
      stepDist: 1,
      stepVal: 1,
      maxRange: 1,
    },
    desirabilityToEvolve: 17,
    desirabilityToDevolve: 15,
    category: 'HOUSE',
  },

  'Spacious Homestead_1x1': {
    label: 'Spacious Homestead',
    height: 1,
    width: 1,
    desireBox: {
      baseDesirability: -1,
      stepDist: 1,
      stepVal: 1,
      maxRange: 1,
    },
    desirabilityToEvolve: 17,
    desirabilityToDevolve: 15,
    category: 'HOUSE',
  },
  'Modest Apartment_2x2': {
    label: 'Modest Apartment',
    height: 2,
    width: 2,
    desirabilityToEvolve: 21,
    desirabilityToDevolve: 19,
    category: 'HOUSE',
  },
  'Modest Apartment_1x1': {
    label: 'Modest Apartment',
    height: 1,
    width: 1,
    desirabilityToEvolve: 21,
    desirabilityToDevolve: 19,
    category: 'HOUSE',
  },
  'Spacious Apartment_2x2': {
    label: 'Spacious Apartment',
    height: 2,
    width: 2,
    desirabilityToEvolve: 26,
    desirabilityToDevolve: 23,
    category: 'HOUSE',
  },
  'Spacious Apartment_1x1': {
    label: 'Spacious Apartment',
    height: 1,
    width: 1,
    desirabilityToEvolve: 26,
    desirabilityToDevolve: 23,
    category: 'HOUSE',
  },
  'Common Residence': {
    label: 'Common Residence',
    height: 2,
    width: 2,
    desirabilityToEvolve: 33,
    desirabilityToDevolve: 30,
    category: 'HOUSE',
  },
  'Spacious Residence': {
    label: 'Spacious Residence',
    height: 2,
    width: 2,
    desirabilityToEvolve: 41,
    desirabilityToDevolve: 37,
    category: 'HOUSE',
  },
  'Elegant Residence': {
    label: 'Elegant Residence',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: 1,
      stepDist: 2,
      stepVal: 0,
      maxRange: 2,
    },
    desirabilityToEvolve: 50,
    desirabilityToDevolve: 45,
    category: 'HOUSE',
  },
  'Fancy Residence': {
    label: 'Fancy Residence',
    height: 2,
    width: 2,
    desireBox: {
      baseDesirability: 2,
      stepDist: 1,
      stepVal: 0,
      maxRange: 2,
    },
    desirabilityToEvolve: 55,
    desirabilityToDevolve: 50,
    category: 'HOUSE',
  },
  'Common Manor': {
    label: 'Common Manor',
    height: 3,
    width: 3,
    desireBox: {
      baseDesirability: 3,
      stepDist: 1,
      stepVal: -1,
      maxRange: 3,
    },
    desirabilityToEvolve: 60,
    desirabilityToDevolve: 52,
    category: 'HOUSE',
  },
  'Spacious Manor': {
    label: 'Spacious Manor',
    height: 3,
    width: 3,
    desireBox: {
      baseDesirability: 3,
      stepDist: 1,
      stepVal: -1,
      maxRange: 3,
    },
    desirabilityToEvolve: 65,
    desirabilityToDevolve: 55,
    category: 'HOUSE',
  },
  'Elegant Manor': {
    label: 'Elegant Manor',
    height: 3,
    width: 3,
    desireBox: {
      baseDesirability: 4,
      stepDist: 2,
      stepVal: -1,
      maxRange: 6,
    },
    desirabilityToEvolve: 70,
    desirabilityToDevolve: 62,
    category: 'HOUSE',
  },
  'Stately Manor': {
    label: 'Stately Manor',
    height: 3,
    width: 3,
    desireBox: {
      baseDesirability: 4,
      stepDist: 2,
      stepVal: -1,
      maxRange: 6,
    },
    desirabilityToEvolve: 76,
    desirabilityToDevolve: 70,
    category: 'HOUSE',
  },
  'Modest Estate': {
    label: 'Modest Estate',
    height: 4,
    width: 4,
    desireBox: {
      baseDesirability: 5,
      stepDist: 2,
      stepVal: -1,
      maxRange: 6,
    },
    desirabilityToEvolve: 82,
    desirabilityToDevolve: 72,
    category: 'HOUSE',
  },
  'Palatial Estate': {
    label: 'Palatial Estate',
    height: 4,
    width: 4,
    desireBox: {
      baseDesirability: 5,
      stepDist: 2,
      stepVal: -1,
      maxRange: 6,
    },
    desirabilityToEvolve: 92,
    desirabilityToDevolve: 87,
    category: 'HOUSE',
  },
};

/*
'Bandstand': {
label: 'Bandstand',
      height: 3,
      width: 3,
      cost: [30, 130, 150, 180, 225],
      employeesRequired: 12,
      desireBoxes: [
        { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x },
      ],
    },
'Booth': {
label: 'Booth',
    height: 2,
    width: 2,
    cost: [10, 40, 50, 60, 75],
    employeesRequired: 8,
desireBox: { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x }
  },
'Pavilion': {
label: 'Pavilion',
    height: 4,
    width: 4,
    cost: [100, 400, 500, 600, 750],
    employeesRequired: 20,
desireBox: { baseDesirability: x, stepDist: x, stepVal: x, maxRange: x }
  },
  */
