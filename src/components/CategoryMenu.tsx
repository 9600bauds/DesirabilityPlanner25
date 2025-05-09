import { Menu, MenuItem } from '@szhsin/react-menu';
import { Category } from '../interfaces/Category';
import '@szhsin/react-menu/dist/index.css';
import Subcategory from '../interfaces/Subcategory';
import ScalingButton from './ScalingButton';

interface CategoryMenuProps {
  selectSubcategory: (subcat: Subcategory) => void;
  category: Category;
  selectedSubcategory: Subcategory | null;
}

const CategoryMenu = ({
  selectSubcategory,
  category,
  selectedSubcategory,
}: CategoryMenuProps) => {
  const menuItems: React.ReactNode[] = []; // Create an empty array

  category.subCategories.forEach((subcat: Subcategory, key: string) => {
    const className =
      selectedSubcategory === subcat ? 'selectedSubcategory' : '';
    menuItems.push(
      <MenuItem
        key={key}
        className={className}
        onClick={() => selectSubcategory(subcat)}
      >
        {subcat.displayName}
      </MenuItem>
    );
  });

  return (
    <Menu
      key={category.id}
      overflow="auto"
      menuButton={
        <ScalingButton
          id={category.id}
          iconPath={category.iconPath}
          title={category.displayName}
        />
      }
    >
      {menuItems}
    </Menu>
  );
};
export default CategoryMenu;
