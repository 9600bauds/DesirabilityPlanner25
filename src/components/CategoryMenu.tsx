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
  const subcategories = [...category.subCategories];

  const buttonProps = {
    id: category.id,
    iconPath: category.iconPath,
    title: category.displayName,
    isActive: subcategories.some(
      ([_key, subcat]) => subcat === selectedSubcategory
    ),
  };

  if (subcategories.length === 1) {
    const onlySubcategory = subcategories[0][1];
    return (
      <ScalingButton
        {...buttonProps}
        onClick={() => selectSubcategory(onlySubcategory)}
      />
    );
  }

  return (
    <Menu
      key={category.id}
      overflow="auto"
      portal={true}
      direction="left"
      menuButton={<ScalingButton {...buttonProps} />}
    >
      {subcategories.map(([key, subcat]) => (
        <MenuItem
          key={key}
          className={
            subcat === selectedSubcategory ? 'selectedSubcategory' : ''
          }
          onClick={() => selectSubcategory(subcat)}
        >
          {subcat.displayName}
        </MenuItem>
      ))}
    </Menu>
  );
};
export default CategoryMenu;
