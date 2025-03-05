import Subcategory from './Subcategory';

export interface MenuCategory {
  displayName: string;
  symbol: string;
  baseColor: string;
  subCategories: Map<string, Subcategory>;
}
