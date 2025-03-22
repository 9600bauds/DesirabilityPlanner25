import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import { MenuCategory } from '../interfaces/MenuCategory';
import Subcategory from '../interfaces/Subcategory';
import { ALL_CATEGORIES } from '../data/CATEGORIES';

interface BuildingSelectorProps {
  selectSubcategory: (subcat: Subcategory) => void;
  selectedSubcategory: Subcategory | null;
}

const BuildingSelector = ({
  selectSubcategory,
  selectedSubcategory,
}: BuildingSelectorProps) => {
  const optionsToButtons = (
    category: MenuCategory,
    selectedSubcategory: Subcategory | null
  ) => {
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

    return menuItems; // Return the array
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(ALL_CATEGORIES).map((category) => {
        return (
          <Menu
            key={category.displayName}
            overflow="auto"
            menuButton={
              <MenuButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                {category.symbol}
              </MenuButton>
            }
          >
            {optionsToButtons(category, selectedSubcategory)}
          </Menu>
        );
      })}
    </div>
  );
};

export default BuildingSelector;
