import React from 'react';
import Subcategory from '../interfaces/Subcategory';
import { InteractionType } from '../types/InteractionState';
import ScalingButton from './ScalingButton';
import { ALL_CATEGORIES } from '../data/CATEGORIES';
import CategoryMenu from './CategoryMenu';

interface SidebarProps {
  onRotateClick: () => void;
  onPanClick: () => void;
  onEraserClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  onUndoClick: () => void;
  onRedoClick: () => void;
  onRotateBlueprintClick: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canRotateBlueprint: boolean;
  selectSubcategory: (subcat: Subcategory) => void;
  selectedSubcategory: Subcategory | null;
  currentInteractionType: InteractionType;
}

const Sidebar: React.FC<SidebarProps> = ({
  onRotateClick,
  onPanClick,
  onEraserClick,
  onZoomInClick,
  onZoomOutClick,
  onUndoClick,
  onRedoClick,
  onRotateBlueprintClick,
  canUndo,
  canRedo,
  canRotateBlueprint,
  selectSubcategory,
  selectedSubcategory,
  currentInteractionType,
}) => {
  return (
    <div id="sidebar-container">
      <div id="top-controls">
        <ScalingButton
          id="undo"
          onClick={onUndoClick}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        />
        <ScalingButton
          id="redo"
          onClick={onRedoClick}
          disabled={!canRedo}
          title="Redo (Ctrl+Y, Ctrl+Shift+Z)"
        />
        <ScalingButton
          id="pan"
          onClick={onPanClick}
          title="Pan Tool"
          isActive={currentInteractionType === 'panning'}
        />
        <ScalingButton
          id="eraser"
          onClick={onEraserClick}
          title="Eraser Tool"
          isActive={currentInteractionType === 'erasing'}
        />
        <ScalingButton id="zoomout" onClick={onZoomOutClick} title="Zoom Out" />
        <ScalingButton id="zoomin" onClick={onZoomInClick} title="Zoom In" />
        <ScalingButton id="north" onClick={onRotateClick} title="Align North" />
        <ScalingButton
          id="rotate"
          onClick={onRotateBlueprintClick}
          disabled={!canRotateBlueprint}
          title="Rotate Blueprint (R) (also toggles between venue variants and 1x1/2x2 houses)"
        />
      </div>

      <div id="bottom-controls">
        {Object.values(ALL_CATEGORIES).map((category) => (
          <CategoryMenu
            key={category.id}
            selectSubcategory={selectSubcategory}
            category={category}
            selectedSubcategory={selectedSubcategory}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
