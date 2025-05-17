import { Category } from '../interfaces/Category';
import Subcategory from '../interfaces/Subcategory';
import { ALL_BLUEPRINTS } from './BLUEPRINTS';
import colors from '../utils/colors';

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
    baseColor: colors.housing,
    subCategories: new Map(),
  },
  HOUSING_FANCY: {
    id: 'HOUSING_FANCY',
    iconPath: '/categories/nicehouse',
    displayName: 'Fancy Housing',
    baseColor: colors.housing,
    subCategories: new Map(),
  },
  BEAUTY: {
    id: 'BEAUTY',
    iconPath: '/categories/beauty',
    displayName: 'Beautification',
    baseColor: colors.beauty_inert,
    subCategories: new Map(),
  },
  ROAD: {
    id: 'ROAD',
    iconPath: '/categories/road',
    displayName: 'Road',
    baseColor: colors.road,
    subCategories: new Map(),
  },
  GOVT: {
    id: 'GOVT',
    iconPath: '/categories/govt',
    displayName: 'Municipal Buildings',
    baseColor: colors.walker_essential,
    subCategories: new Map(),
  },
  FUN: {
    id: 'FUN',
    iconPath: '/categories/fun',
    displayName: 'Entertainment',
    baseColor: colors.walker_midtier,
    subCategories: new Map(),
  },
  HEALTH: {
    id: 'HEALTH',
    iconPath: '/categories/health',
    displayName: 'Health and Sanitation',
    baseColor: colors.walker_basic,
    subCategories: new Map(),
  },
  FOOD: {
    id: 'FOOD',
    iconPath: '/categories/ibex',
    displayName: 'Food and Farming',
    baseColor: colors.storageBase,
    subCategories: new Map(),
  },
  STORAGE: {
    id: 'STORAGE',
    iconPath: '/categories/vase',
    displayName: 'Storage and Distribution',
    baseColor: colors.storageBase,
    subCategories: new Map(),
  },
  INDUSTRY: {
    id: 'INDUSTRY',
    iconPath: '/categories/industry',
    displayName: 'Industrial Buildings',
    baseColor: colors.industryBase,
    subCategories: new Map(),
  },
  RELIGION_EDUCATION: {
    id: 'RELIGION_EDUCATION',
    iconPath: '/categories/relication',
    displayName: 'Religion & Education',
    baseColor: colors.walker_fancy,
    subCategories: new Map(),
  },
  MILITARY: {
    id: 'MILITARY',
    iconPath: '/categories/military',
    displayName: 'Military Structures',
    baseColor: colors.industryBase,
    subCategories: new Map(),
  },
};

populateCategories();
