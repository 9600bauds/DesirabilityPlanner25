// src/components/Sidebar.tsx
import React from 'react';
import BuildingSelector from './BuildingSelector';
import Subcategory from '../interfaces/Subcategory';
import { InteractionType } from '../types/InteractionState';
import ScalingButton from './ScalingButton';

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
    <div id="sidebar">
      <div id="top-controls">
        <ScalingButton
          key="undo" // TODO: Can we obviate these for simplicity?
          id="undo"
          onClick={onUndoClick}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        />
        <ScalingButton
          key="redo"
          id="redo"
          onClick={onRedoClick}
          disabled={!canRedo}
          title="Redo (Ctrl+Y, Ctrl+Shift+Z)"
        />
        <ScalingButton
          key="pan"
          id="pan"
          onClick={onPanClick}
          title="Pan Tool"
          isActive={currentInteractionType === 'panning'}
        />
        <ScalingButton
          key="eraser"
          id="eraser"
          onClick={onEraserClick}
          title="Eraser Tool"
          isActive={currentInteractionType === 'erasing'}
        />
        <ScalingButton
          key="zoomout"
          id="zoomout"
          onClick={onZoomOutClick}
          title="Zoom Out"
        />
        <ScalingButton
          key="zoomin"
          id="zoomin"
          onClick={onZoomInClick}
          title="Zoom In"
        />
        <ScalingButton
          key="rotate"
          id="rotate"
          onClick={onRotateClick}
          title="Align North"
        />
        <ScalingButton
          key="rotate"
          id="rotate"
          onClick={onRotateBlueprintClick}
          disabled={!canRotateBlueprint}
          title="Rotate Blueprint (R) (also toggles between venue variants and 1x1/2x2 houses)"
        />
      </div>

      <BuildingSelector
        selectSubcategory={selectSubcategory}
        selectedSubcategory={selectedSubcategory}
      />
    </div>
  );
};

export default Sidebar;
