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
  HOUSING_BASIC: {
    id: 'HOUSING_BASIC',
    iconPath: '/categories/basichouse',
    displayName: 'Basic Housing',
    baseColor: 'rgb(84, 194, 51)',
    subCategories: new Map(),
  },
  HOUSING_FANCY: {
    id: 'HOUSING_FANCY',
    iconPath: '/categories/nicehouse',
    displayName: 'Fancy Housing',
    baseColor: 'rgb(84, 194, 51)',
    subCategories: new Map(),
  },
  BEAUTY: {
    id: 'BEAUTY',
    iconPath: '/categories/beauty',
    displayName: 'Beautification',
    baseColor: 'rgb(225, 215, 0)',
    subCategories: new Map(),
  },
  ROAD: {
    id: 'ROAD',
    iconPath: '/categories/road',
    displayName: 'Road',
    baseColor: 'rgb(255, 194, 144)',
    subCategories: new Map(),
  },
  GOVT: {
    id: 'GOVT',
    iconPath: '/categories/govt',
    displayName: 'Municipal Buildings',
    baseColor: 'rgb(209, 209, 209)',
    subCategories: new Map(),
  },
  FUN: {
    id: 'FUN',
    iconPath: '/categories/fun',
    displayName: 'Entertainment',
    baseColor: 'rgb(224, 142, 187)',
    subCategories: new Map(),
  },
  HEALTH: {
    id: 'HEALTH',
    iconPath: '/categories/health',
    displayName: 'Health and Sanitation',
    baseColor: 'rgb(32, 68, 146)',
    subCategories: new Map(),
  },
  FOOD: {
    id: 'FOOD',
    iconPath: '/categories/ibex',
    displayName: 'Food and Farming',
    baseColor: 'rgb(173, 65, 33)',
    subCategories: new Map(),
  },
  STORAGE: {
    id: 'STORAGE',
    iconPath: '/categories/vase',
    displayName: 'Storage and Distribution',
    baseColor: 'rgb(245, 226, 180)',
    subCategories: new Map(),
  },
  INDUSTRY: {
    id: 'INDUSTRY',
    iconPath: '/categories/industry',
    displayName: 'Industrial Buildings',
    baseColor: 'rgb(189, 97, 57)',
    subCategories: new Map(),
  },
  RELIGION_EDUCATION: {
    id: 'RELIGION_EDUCATION',
    iconPath: '/categories/relication',
    displayName: 'Religion & Education',
    baseColor: 'rgb(2, 92, 14)',
    subCategories: new Map(),
  },
  MILITARY: {
    id: 'MILITARY',
    iconPath: '/categories/military',
    displayName: 'Military Structures',
    baseColor: 'rgb(126, 13, 13)',
    subCategories: new Map(),
  },
};

populateCategories();
