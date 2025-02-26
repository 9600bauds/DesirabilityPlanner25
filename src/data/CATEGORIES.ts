import { BuildingCategory } from '../interfaces/BuildingCategory';
import Subcategory from '../interfaces/Subcategory';
import BuildingBlueprint from '../types/BuildingBlueprint';
import { NEW_BLUEPRINTS } from './BLUEPRINTS';

export function populateCategories(
  BLUEPRINTS: Record<string, BuildingBlueprint>
): Record<string, BuildingCategory> {
  for (const categoryKey in NEW_CATEGORIES) {
    const thisCategory: BuildingCategory = NEW_CATEGORIES[categoryKey];

    const blueprintsInThisCategory = Object.entries(NEW_BLUEPRINTS).filter(
      ([_key, newBp]) => newBp.category === categoryKey
    );

    for (const [key, newBpData] of blueprintsInThisCategory) {
      if (newBpData.hidden) {
        continue;
      }
      const theBlueprint = BLUEPRINTS[key];
      if (!theBlueprint) {
        throw new Error(
          `newBlueprint with key ${key} did not correspond to any blueprint!`
        );
      }
      const splitKey = key.split('_')[0];
      if (!thisCategory.subCategories.has(splitKey)) {
        const newSub: Subcategory = {
          displayName: splitKey,
          blueprints: [theBlueprint],
        };
        thisCategory.subCategories.set(splitKey, newSub);
      } else {
        thisCategory.subCategories.get(splitKey)?.blueprints.push(theBlueprint);
      }
    }
  }
  return NEW_CATEGORIES;
}

export const NEW_CATEGORIES: Record<string, BuildingCategory> = {
  HOUSE: {
    displayName: 'Housing',
    symbol: '🏠',
    baseColor: 'rgb(84, 194, 51)',
    subCategories: new Map(),
  },
  BEAUTY: {
    displayName: 'Beautification',
    symbol: '🌼',
    baseColor: 'rgb(225, 215, 0)',
    subCategories: new Map(),
  },
  FOOD: {
    displayName: 'Food and Farming',
    symbol: '🐐',
    baseColor: 'rgb(173, 65, 33)',
    subCategories: new Map(),
  },
  FUN: {
    displayName: 'Entertainment',
    symbol: '🎶',
    baseColor: 'rgb(224, 142, 187)',
    subCategories: new Map(),
  },
  HEALTH: {
    displayName: 'Health and Sanitation',
    symbol: '⛲',
    baseColor: 'rgb(32, 68, 146)',
    subCategories: new Map(),
  },
  INDUSTRY: {
    displayName: 'Industrial Buildings',
    symbol: '🧱',
    baseColor: 'rgb(189, 97, 57)',
    subCategories: new Map(),
  },
  RELIGION: {
    displayName: 'Religion',
    symbol: '👁️',
    baseColor: 'rgb(149, 44, 170)',
    subCategories: new Map(),
  },
  GOVT: {
    displayName: 'Municipal Buildings',
    symbol: '🏛️',
    baseColor: 'rgb(209, 209, 209)',
    subCategories: new Map(),
  },
  STORAGE: {
    displayName: 'Storage and Distribution',
    symbol: '🏺',
    baseColor: 'rgb(245, 226, 180)',
    subCategories: new Map(),
  },
  EDUCATION: {
    displayName: 'Education',
    symbol: '🪶',
    baseColor: 'rgb(2, 92, 14)',
    subCategories: new Map(),
  },
  MILITARY: {
    displayName: 'Military Structures',
    symbol: '⛵',
    baseColor: 'rgb(126, 13, 13)',
    subCategories: new Map(),
  },
};
