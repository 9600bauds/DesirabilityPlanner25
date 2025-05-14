import React from 'react';
import './HelpModal.css';

interface InstructionIconProps {
  iconName: string;
  altText: string;
  classes?: string;
}

const InstructionIcon: React.FC<InstructionIconProps> = ({
  iconName,
  altText,
  classes,
}) => {
  return (
    <img
      src={`${import.meta.env.BASE_URL}/icons/${iconName}.png`}
      alt={altText}
      className={`instruction-icon ${classes}`}
    />
  );
};

export default InstructionIcon;
