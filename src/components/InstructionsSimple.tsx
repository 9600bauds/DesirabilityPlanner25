import React from 'react';
import InstructionIcon from './InstructionIcon'; // Or your chosen name
import './HelpModal.css';

const SimpleInstructions: React.FC = () => {
  //prettier-ignore
  return (
    <>
      <div className="instruction-item">
        <InstructionIcon
          iconName="categories/relication"
          altText="Building Category Icon"
          classes="large"
        />
        <p>
          Select buildings by clicking the <b>category buttons</b> at the bottom right.<br/>
          Then, place them by clicking on the grid.
        </p>
      </div>

      <hr></hr>

      <div className="instruction-item">
        <InstructionIcon
          iconName="pan"
          altText="Pan Mode Icon"
          classes="large"
        />
        <p>
          To move around, click <b>Pan Mode</b> at the top (shortcut: <b>Spacebar</b>), then click-drag on the grid.
        </p>
      </div>

      <hr></hr>

      <div className="instruction-item">
        <InstructionIcon
          iconName="eraser"
          altText="Eraser Mode Icon"
          classes="large"
        />
        <p>
          To delete buildings, click <b>Eraser Mode</b> at the top (shortcut: <b>E</b>), then click-drag on the grid.
        </p>
      </div>

      <hr></hr>

      <div className="instruction-item">
        <InstructionIcon iconName="help" altText="Help Icon" classes="large" />
        <p>
          View the full instructions by clicking <b>Help</b>.
        </p>
      </div>
    </>
  );
};

export default SimpleInstructions;
