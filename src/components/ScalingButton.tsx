import { forwardRef } from 'react';

interface ScalingButtonProps {
  id: string;
  title: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  isActive?: boolean;
}

const ScalingButton = forwardRef<HTMLButtonElement, ScalingButtonProps>(
  (
    {
      id,
      title,
      onClick,
      onKeyDown,
      disabled = false,
      isActive = false,
      ...rest
    }, // Destructured props
    buttonRef // The forwarded ref itself
  ) => {
    const baseClass = 'btn';
    const activeClass = isActive ? 'btn-success' : 'btn-outline-secondary';
    const layoutClasses =
      'd-flex align-items-center justify-content-center grid-button';

    return (
      <button
        ref={buttonRef}
        id={id}
        className={`${baseClass} ${activeClass} ${layoutClasses}`}
        onClick={onClick}
        onKeyDown={onKeyDown}
        disabled={disabled}
        title={title}
        {...rest}
      >
        <img
          src={`/DesirabilityPlanner25/icons/${id}.png`}
          alt={title}
          className="button-icon"
        />
      </button>
    );
  }
);

ScalingButton.displayName = 'ScalingButton';

export default ScalingButton;
