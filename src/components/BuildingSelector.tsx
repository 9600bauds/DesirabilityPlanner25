import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import { BuildingCategory } from '../interfaces/BuildingCategory';
import Subcategory from '../interfaces/Subcategory';

interface BuildingSelectorProps {
  populatedCategories: Record<string, BuildingCategory> | null;
  selectSubcategory: (subcat: Subcategory) => void;
}

const BuildingSelector = ({
  populatedCategories,
  selectSubcategory,
}: BuildingSelectorProps) => {
  const optionsToButtons = (category: BuildingCategory) => {
    const menuItems: React.ReactNode[] = []; // Create an empty array

    category.subCategories.forEach((subcat: Subcategory, key: string) => {
      menuItems.push(
        <MenuItem key={key} onClick={() => selectSubcategory(subcat)}>
          {subcat.displayName}
        </MenuItem>
      );
    });

    return menuItems; // Return the array
  };

  if (!populatedCategories) return;
  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(populatedCategories).map((category) => {
        return (
          <Menu
            key={category.displayName}
            menuButton={
              <MenuButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                {category.symbol}
              </MenuButton>
            }
          >
            {optionsToButtons(category)}
          </Menu>
        );
      })}
    </div>
  );
};

export default BuildingSelector;
