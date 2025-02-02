// src/components/Sidebar.tsx
import React from 'react';
import BuildingSelector from './BuildingSelector';
import { BUILDING_BLUEPRINTS } from '../definitions/buildingBlueprints';

interface SidebarProps {
  onRotateClick: () => void;
  onPanClick: () => void;
  onZoomInClick: () => void;
  onZoomOutClick: () => void;
  onDefaultActionClick: () => void;
  setSelectedBlueprintKey: (
    blueprintKey: keyof typeof BUILDING_BLUEPRINTS
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onRotateClick,
  onPanClick,
  onZoomInClick,
  onZoomOutClick,
  onDefaultActionClick,
  setSelectedBlueprintKey,
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
      <button
        id="default-action-btn"
        className="btn btn-secondary sidebar-button"
        onClick={onDefaultActionClick}
      >
        Default Action
      </button>
      <BuildingSelector setSelectedBlueprintKey={setSelectedBlueprintKey} />
    </div>
  );
};

export default Sidebar;
