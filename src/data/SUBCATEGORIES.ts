/*import { NewCategory } from '../interfaces/BuildingCategory';
import Subcategory from '../interfaces/Subcategory';
import BLUEPRINTS, { NEW_BLUEPRINTS } from './BLUEPRINTS';

const getOptionArraysForCategory = (category: string): menuOptionMap => {
  const options: menuOptionMap = new Record<string, NewBlueprint[]>();

  const blueprintsInThisCategory = Object.entries(NEW_BLUEPRINTS).filter(
    ([_key, newBp]) => newBp.category === category
  );
  for (const [key, _newBp] of blueprintsInThisCategory) {
    const BuildingBlueprint = BLUEPRINTS[key];
    const splitMenuName = key.split('_')[0];
    if(options.get(splitMenuName))
    const arr: NewBlueprint[] = options.get(splitMenuName) ?? [];
    arr.push(blueprint);
    options.set(splitMenuName, arr);
  }
  return options;
};

function instantiateSubcategories(
  alreadyDefinedSubcategories: Record<string, Subcategory>,
  CATEGORIES: Record<string, NewCategory>
): Record<NewCategory, Subcategory[]> {

  for(const key in CATEGORIES){
    const 
  }
  const blueprintsInThisCategory = Object.entries(NEW_BLUEPRINTS).filter(
    ([_key, newBp]) => newBp.category === category
  );

  const blueprints: Record<string, BuildingBlueprint> = {};
  for (const [key, newBpData] of Object.entries(NEW_BLUEPRINTS)) {
    let createdBlueprint: BuildingBlueprint;
    if (
      'desirabilityToEvolve' in newBpData ||
      'desirabilityToDevolve' in newBpData
    ) {
      createdBlueprint = new HouseBlueprint(newBpData);
    } else {
      createdBlueprint = new BasicBlueprint(newBpData);
    }
    blueprints[key] = createdBlueprint;
  }

  return blueprints;
}
*/
