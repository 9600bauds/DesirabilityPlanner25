import Subcategory from './Subcategory';

export interface Category {
  id: string;
  iconPath: string;
  displayName: string;
  baseColor: string;
  subCategories: Map<string, Subcategory>;
}
