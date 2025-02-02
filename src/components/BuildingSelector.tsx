import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import { BUILDING_BLUEPRINTS } from '../definitions/buildingBlueprints';
import { BUILDING_CATEGORIES } from '../definitions/buildingCategories';

interface BuildingSelectorProps {
  setSelectedBlueprintKey: (blueprintId: string) => void;
}

const BuildingSelector = ({
  setSelectedBlueprintKey,
}: BuildingSelectorProps) => {
  const getBlueprintsForCategory = (category: string) => {
    return Object.entries(BUILDING_BLUEPRINTS).filter(
      ([_, blueprint]) => blueprint.category === category
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(BUILDING_CATEGORIES).map((key) => {
        const category = BUILDING_CATEGORIES[key];
        return (
          <Menu
            key={category.displayName}
            menuButton={
              <MenuButton className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded">
                {category.symbol}
              </MenuButton>
            }
          >
            {getBlueprintsForCategory(key).map(([id, blueprint]) => (
              <MenuItem key={id} onClick={() => setSelectedBlueprintKey(id)}>
                {blueprint.name}
              </MenuItem>
            ))}
          </Menu>
        );
      })}
    </div>
  );
};

export default BuildingSelector;
