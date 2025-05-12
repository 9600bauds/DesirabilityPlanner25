import React from 'react';
import Subcategory from '../interfaces/Subcategory';
import { InteractionType } from '../types/InteractionState';
import ScalingButton from './ScalingButton';
import { ALL_CATEGORIES } from '../data/CATEGORIES';
import CategoryMenu from './CategoryMenu';
import './Sidebar.css';

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
  canZoomIn: boolean;
  canZoomOut: boolean;
  isGridRotated: boolean;
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
  canZoomIn,
  canZoomOut,
  isGridRotated,
  canRotateBlueprint,
  selectSubcategory,
  selectedSubcategory,
  currentInteractionType,
}) => {
  return (
    <div id="sidebar-container">
      <div id="top-controls" className="button-grid">
        <ScalingButton id="north" onClick={onRotateClick} title="Align North" />
        <ScalingButton
          id="rotate"
          onClick={onRotateBlueprintClick}
          disabled={!canRotateBlueprint}
          title="Rotate Blueprint (R) (also toggles between venue variants and 1x1/2x2 houses)"
        />
        <ScalingButton id="help" title="Help (todo!)" />
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
      </div>
      <hr className="sidebar-horizontal-separator" />
      <div id="bar-controls" className="button-grid">
        <ScalingButton
          id="zoomout"
          onClick={onZoomOutClick}
          disabled={!canZoomOut}
          title="Zoom Out"
        />
        <ScalingButton
          id="zoomin"
          onClick={onZoomInClick}
          disabled={!canZoomIn}
          title="Zoom In"
        />
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
      </div>
      <hr className="sidebar-horizontal-separator" />
      <div id="bottom-controls" className="button-grid">
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
