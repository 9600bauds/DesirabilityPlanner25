export interface BuildingCategory {
  displayName: string;
  symbol: string;
  baseColor: string;
}

export const BUILDING_CATEGORIES: Record<string, BuildingCategory> = {
  HOUSE: {
    displayName: 'Housing',
    symbol: '🏠',
    baseColor: '#FFD700',
  },
  BEAUTY: {
    displayName: 'Beautification',
    symbol: '🌼',
    baseColor: '#FFD700',
  },
  FOOD: {
    displayName: 'Food and Farming',
    symbol: '🐐',
    baseColor: '#FFD700',
  },
  FUN: {
    displayName: 'Entertainment',
    symbol: '🎶',
    baseColor: '#87CEEB',
  },
  HEALTH: {
    displayName: 'Health and Sanitation',
    symbol: '⛲',
    baseColor: '#8FBC8F',
  },
  INDUSTRY: {
    displayName: 'Industrial Buildings',
    symbol: '🧱',
    baseColor: '#B22222',
  },
  RELIGION: {
    displayName: 'Religion',
    symbol: '👁️',
    baseColor: '#EEE8AA',
  },
  GOVT: {
    displayName: 'Municipal Buildings',
    symbol: '🏛️',
    baseColor: '#A9A9A9',
  },
  STORAGE: {
    displayName: 'Storage and Distribution',
    symbol: '🏺',
    baseColor: '#E2725B',
  },
  EDUCATION: {
    displayName: 'Education',
    symbol: '🪶',
    baseColor: '#F5F5DC',
  },
  MILITARY: {
    displayName: 'Military Structures',
    symbol: '⛵',
    baseColor: '#A0522D',
  },
};
