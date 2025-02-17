import Subcategory from './Subcategory';

export interface BuildingCategory {
  displayName: string;
  symbol: string;
  baseColor: string;
  subCategories: Map<string, Subcategory>;
}
