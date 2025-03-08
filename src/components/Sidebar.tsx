// src/components/Sidebar.tsx
import React from 'react';
import BuildingSelector from './BuildingSelector';
import Subcategory from '../interfaces/Subcategory';

interface SidebarProps {
  onRotateClick: () => void;
  onPanClick: () => void;
  onEraserClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  selectSubcategory: (subcat: Subcategory) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onRotateClick,
  onPanClick,
  onEraserClick,
  onZoomInClick,
  onZoomOutClick,
  selectSubcategory,
}) => {
  return (
    <div
      id="sidebar"
      className="bg-light d-flex flex-column justify-content-center align-items-center"
    >
      <button
        id="rotate-btn"
        className="btn btn-primary rounded-circle"
        onClick={onRotateClick}
      >
        <i className="material-icons">rotate_right</i>
      </button>
      <button
        id="pan-btn"
        className="btn btn-primary rounded-circle"
        onClick={onPanClick}
      >
        <i className="material-icons">pan_tool</i>
      </button>
      <button
        id="pan-btn"
        className="btn btn-primary rounded-circle"
        onClick={onEraserClick}
      >
        <i className="material-symbols-outlined">ink_eraser</i>
      </button>
      <button
        id="zoomin-btn"
        className="btn btn-primary rounded-circle"
        onClick={onZoomInClick}
      >
        <i className="material-icons">zoom_in</i>
      </button>
      <button
        id="zoomout-btn"
        className="btn btn-primary rounded-circle"
        onClick={onZoomOutClick}
      >
        <i className="material-icons">zoom_out</i>
      </button>
      <BuildingSelector selectSubcategory={selectSubcategory} />
    </div>
  );
};

export default Sidebar;
