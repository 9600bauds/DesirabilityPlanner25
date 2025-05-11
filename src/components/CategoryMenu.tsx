import { Menu, MenuItem } from '@szhsin/react-menu';
import { Category } from '../interfaces/Category';
import '@szhsin/react-menu/dist/index.css';
import './CategoryMenu.css';
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
  let isCategorySelected = false;

  const menuItems: React.ReactNode[] = []; // Create an empty array

  category.subCategories.forEach((subcat: Subcategory, key: string) => {
    let className = '';
    if (selectedSubcategory === subcat) {
      isCategorySelected = true;
      className = 'selectedSubcategory';
    }
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
      portal={true}
      direction="left"
      menuButton={
        <ScalingButton
          id={category.id}
          iconPath={category.iconPath}
          title={category.displayName}
          isActive={isCategorySelected}
        />
      }
    >
      {menuItems}
    </Menu>
  );
};
export default CategoryMenu;
