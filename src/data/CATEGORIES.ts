import { Category } from '../interfaces/Category';
import Subcategory from '../interfaces/Subcategory';
import { ALL_BLUEPRINTS } from './BLUEPRINTS';

export function populateCategories() {
  for (const categoryKey in ALL_CATEGORIES) {
    const thisCategory: Category = ALL_CATEGORIES[categoryKey];

    const blueprintsInThisCategory = Object.entries(ALL_BLUEPRINTS).filter(
      ([_key, newBp]) => newBp.category === categoryKey
    );

    for (const [key, blueprint] of blueprintsInThisCategory) {
      if (blueprint.hidden) {
        continue;
      }
      const splitKey = key.split('_')[0];
      if (!thisCategory.subCategories.has(splitKey)) {
        const newSub: Subcategory = {
          displayName: splitKey,
          blueprints: [blueprint],
        };
        thisCategory.subCategories.set(splitKey, newSub);
      } else {
        thisCategory.subCategories.get(splitKey)?.blueprints.push(blueprint);
      }
    }
  }
}

export const ALL_CATEGORIES: Record<string, Category> = {
  HOUSE: {
    id: 'HOUSE',
    iconPath: 'HOUSE',
    displayName: 'Housing',
    symbol: '🏠',
    baseColor: 'rgb(84, 194, 51)',
    subCategories: new Map(),
  },
  BEAUTY: {
    id: 'BEAUTY',
    iconPath: 'BEAUTY',
    displayName: 'Beautification',
    symbol: '🌼',
    baseColor: 'rgb(225, 215, 0)',
    subCategories: new Map(),
  },
  FOOD: {
    id: 'FOOD',
    iconPath: 'FOOD',
    displayName: 'Food and Farming',
    symbol: '🐐',
    baseColor: 'rgb(173, 65, 33)',
    subCategories: new Map(),
  },
  FUN: {
    id: 'FUN',
    iconPath: 'FUN',
    displayName: 'Entertainment',
    symbol: '🎶',
    baseColor: 'rgb(224, 142, 187)',
    subCategories: new Map(),
  },
  HEALTH: {
    id: 'HEALTH',
    iconPath: 'HEALTH',
    displayName: 'Health and Sanitation',
    symbol: '⛲',
    baseColor: 'rgb(32, 68, 146)',
    subCategories: new Map(),
  },
  INDUSTRY: {
    id: 'INDUSTRY',
    iconPath: 'INDUSTRY',
    displayName: 'Industrial Buildings',
    symbol: '🧱',
    baseColor: 'rgb(189, 97, 57)',
    subCategories: new Map(),
  },
  RELIGION: {
    id: 'RELIGION',
    iconPath: 'RELIGION',
    displayName: 'Religion',
    symbol: '👁️',
    baseColor: 'rgb(149, 44, 170)',
    subCategories: new Map(),
  },
  GOVT: {
    id: 'GOVT',
    iconPath: 'GOVT',
    displayName: 'Municipal Buildings',
    symbol: '🏛️',
    baseColor: 'rgb(209, 209, 209)',
    subCategories: new Map(),
  },
  STORAGE: {
    id: 'STORAGE',
    iconPath: 'STORAGE',
    displayName: 'Storage and Distribution',
    symbol: '🏺',
    baseColor: 'rgb(245, 226, 180)',
    subCategories: new Map(),
  },
  EDUCATION: {
    id: 'EDUCATION',
    iconPath: 'EDUCATION',
    displayName: 'Education',
    symbol: '🪶',
    baseColor: 'rgb(2, 92, 14)',
    subCategories: new Map(),
  },
  MILITARY: {
    id: 'MILITARY',
    iconPath: 'MILITARY',
    displayName: 'Military Structures',
    symbol: '⛵',
    baseColor: 'rgb(126, 13, 13)',
    subCategories: new Map(),
  },
};

populateCategories();
