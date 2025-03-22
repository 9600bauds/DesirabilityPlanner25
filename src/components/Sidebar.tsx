// src/components/Sidebar.tsx
import React from 'react';
import BuildingSelector from './BuildingSelector';
import Subcategory from '../interfaces/Subcategory';
import { InteractionType } from '../types/InteractionState';

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
    <div
      id="sidebar"
      className="bg-light d-flex flex-column justify-content-center align-items-center"
    >
      <button
        id="undo-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onUndoClick}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <i className="material-icons">undo</i>
      </button>
      <button
        id="redo-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onRedoClick}
        disabled={!canRedo}
        title="Redo (Ctrl+Y, Ctrl+Shift+Z)"
      >
        <i className="material-icons">redo</i>
      </button>

      <button
        id="rotate-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onRotateClick}
        title="Align North"
      >
        <i className="material-icons">explore</i>
      </button>
      <button
        id="pan-btn"
        className={`btn ${currentInteractionType === 'panning' ? 'btn-success' : 'btn-primary'} rounded-circle mb-2`}
        onClick={onPanClick}
        title="Pan Tool"
      >
        <i className="material-icons">pan_tool</i>
      </button>
      <button
        id="eraser-btn"
        className={`btn ${currentInteractionType === 'erasing' ? 'btn-success' : 'btn-primary'} rounded-circle mb-2`}
        onClick={onEraserClick}
        title="Eraser Tool"
      >
        <i className="material-symbols-outlined">ink_eraser</i>
      </button>
      <button
        id="zoomin-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onZoomInClick}
        title="Zoom In"
      >
        <i className="material-icons">zoom_in</i>
      </button>
      <button
        id="zoomout-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onZoomOutClick}
        title="Zoom Out"
      >
        <i className="material-icons">zoom_out</i>
      </button>
      <button
        id="rotate-bp-btn"
        className="btn btn-primary rounded-circle mb-2"
        onClick={onRotateBlueprintClick}
        disabled={!canRotateBlueprint}
        title="Rotate Blueprint (R) (also toggles between venue variants and 1x1/2x2 houses)"
      >
        <i className="material-icons">rotate_right</i>
      </button>

      <BuildingSelector
        selectSubcategory={selectSubcategory}
        selectedSubcategory={selectedSubcategory}
      />
    </div>
  );
};

export default Sidebar;
