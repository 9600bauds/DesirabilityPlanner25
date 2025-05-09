import Subcategory from './Subcategory';

export interface Category {
  id: string;
  displayName: string;
  symbol: string;
  baseColor: string;
  subCategories: Map<string, Subcategory>;
}
