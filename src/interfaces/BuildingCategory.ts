export interface BuildingCategory {
  displayName: string;
  symbol: string;
  baseColor: string;
}

export const BUILDING_CATEGORIES: Record<string, BuildingCategory> = {
  HOUSE: {
    displayName: 'Housing',
    symbol: '🏠',
    baseColor: 'rgb(84, 194, 51)',
  },
  BEAUTY: {
    displayName: 'Beautification',
    symbol: '🌼',
    baseColor: 'rgb(225, 215, 0)',
  },
  FOOD: {
    displayName: 'Food and Farming',
    symbol: '🐐',
    baseColor: 'rgb(173, 65, 33)',
  },
  FUN: {
    displayName: 'Entertainment',
    symbol: '🎶',
    baseColor: 'rgb(224, 142, 187)',
  },
  HEALTH: {
    displayName: 'Health and Sanitation',
    symbol: '⛲',
    baseColor: 'rgb(32, 68, 146)',
  },
  INDUSTRY: {
    displayName: 'Industrial Buildings',
    symbol: '🧱',
    baseColor: 'rgb(189, 97, 57)',
  },
  RELIGION: {
    displayName: 'Religion',
    symbol: '👁️',
    baseColor: 'rgb(149, 44, 170)',
  },
  GOVT: {
    displayName: 'Municipal Buildings',
    symbol: '🏛️',
    baseColor: 'rgb(209, 209, 209)',
  },
  STORAGE: {
    displayName: 'Storage and Distribution',
    symbol: '🏺',
    baseColor: 'rgb(245, 226, 180)',
  },
  EDUCATION: {
    displayName: 'Education',
    symbol: '🪶',
    baseColor: 'rgb(2, 92, 14)',
  },
  MILITARY: {
    displayName: 'Military Structures',
    symbol: '⛵',
    baseColor: 'rgb(126, 13, 13)',
  },
};
