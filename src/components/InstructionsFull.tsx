import React from 'react';
import InstructionIcon from './InstructionIcon';
const FullInstructions: React.FC = () => {
  //prettier-ignore
  return (
    <>
      <h3>Basic Controls</h3>
      <div className="instruction-item">
        <InstructionIcon
          iconName="categories/relication"
          altText="Building Category Icon"
        />
        <p>
          Select buildings by clicking the <b>category buttons</b> at the bottom right.<br/>
          Then, place them by clicking on the grid.
        </p>
      </div>
      <div className="instruction-item">
        <InstructionIcon
          iconName="pan"
          altText="Pan Mode Icon"
        />
        <p>
          To move around, click <b>Pan Mode</b> at the top (shortcut: <b>Spacebar</b>), then click-drag on the grid.
        </p>
      </div>
      <div className="instruction-item">
        <InstructionIcon
          iconName="eraser"
          altText="Eraser Mode Icon"
        />
        <p>
          To delete buildings, click <b>Eraser Mode</b> at the top (shortcut: <b>E</b>), then click-drag on the grid.
        </p>
      </div>

      <h3>Perspective</h3>
      <div className="instruction-item">
        <InstructionIcon
          iconName="grid-rotation"
          altText="Grid Perspective icon"
          classes="large"
        />
        <p>
          By default, this tool uses a top-down grid view, where the northernmost point of a building is the <b>top-left corner.</b><br/>
          The actual game uses an isometric view, where buildings are diamond-shaped and the northernmost point is straight up.<br/>
          Click the <b>Grid Perspective</b> button to switch to a rotated view that closely matches what you would see in-game.
        </p>
      </div>

      <h3>Rotation</h3>
      <div className="instruction-item">
        <InstructionIcon
          iconName="rotate"
          altText="Rotate Building icon"
          classes="large"
        />
        <p>
          The <b>Rotate Building</b> button (shortcut: <b>R</b>) also lets you switch between 1x1 and 2x2 versions of housing, where applicable.<br/>
          It also lets you manually re-orient the Booth, Bandstand and Pavilion. Their placement restrictions, and their interactions with roads, are not simulated in this tool.<br/>
        </p>
      </div>

      <h3>Housing</h3>
      <div className="instruction-item">
        <InstructionIcon
          iconName="categories/basichouse"
          altText="Basic house"
          classes="large"
        />
        <p>
          Here's how to read the desirability tooltips on houses:<br/>
          <ul>
            <li>"##/## to <b>not devolve</b>:" This house will immediately devolve, as the desirability is dragging it down.</li>
            <li>
              "##/## to <b>be stable</b>:" This house is unstable. It will not devolve from desirability alone, but if it devolves from other causes (e.g. temporary lack of food), it will not evolve back to this level.<br/>
              The only way for this type of house to exist is for the desirability to have been higher in the past, and recently fallen.<br/>
              Example: A 2x2 needs 60 desirability to evolve into a 3x3. The desirability may then drop all the way down to 53 without it devolving. But if a 2 second lack of food causes it to shrink, it will need 60 desirability to become a 3x3 again.<br/>
            </li>
            <li>"##/## to <b>evolve</b>:" This house is stable, but needs more desirability to evolve (assuming all other needs are met).</li>
          </ul>
        </p>
      </div>

      <h3>Saving & Sharing Your Plan</h3>
      <p>
        Your current city plan is automatically encoded and saved in the URL of your browser.<br/>
        To save your plan, simply bookmark the current page.<br/>
        To share it, copy the full URL from your browser's address bar and send it to others.
      </p>
    </>
  );
};

export default FullInstructions;
