import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import {
  BUILDING_BLUEPRINTS,
  BuildingBlueprint,
} from '../interfaces/BuildingBlueprint';
import { BUILDING_CATEGORIES } from '../interfaces/BuildingCategory';

interface BuildingSelectorProps {
  setSelectedBlueprints: (blueprints: BuildingBlueprint[]) => void;
}

type menuOptionMap = Map<string, BuildingBlueprint[]>;

const BuildingSelector = ({ setSelectedBlueprints }: BuildingSelectorProps) => {
  //
  const getOptionArraysForCategory = (category: string): menuOptionMap => {
    const options: menuOptionMap = new Map<string, BuildingBlueprint[]>();

    const blueprintsInThisCategory = Object.entries(BUILDING_BLUEPRINTS).filter(
      ([_, blueprint]) => blueprint.category === category
    );
    for (const [menuName, blueprint] of blueprintsInThisCategory) {
      const splitMenuName = menuName.split('_')[0];
      const arr: BuildingBlueprint[] = options.get(splitMenuName) ?? [];
      arr.push(blueprint);
      options.set(splitMenuName, arr);
    }
    return options;
  };

  const optionsToButtons = (key: string) => {
    return Array.from(getOptionArraysForCategory(key).entries()).map(
      ([menuName, blueprints]) => (
        <MenuItem
          key={menuName}
          onClick={() => setSelectedBlueprints(blueprints)}
        >
          {menuName}
        </MenuItem>
      )
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
            {optionsToButtons(key)}
          </Menu>
        );
      })}
    </div>
  );
};

export default BuildingSelector;
