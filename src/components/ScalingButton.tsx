import { forwardRef } from 'react';

interface ScalingButtonProps {
  id: string;
  iconPath?: string; // If not defined, uses id instead
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
      iconPath,
      title,
      onClick,
      onKeyDown,
      disabled = false,
      isActive = false,
      ...rest
    }, // Destructured props
    buttonRef // The forwarded ref itself
  ) => {
    const baseClass = 'btn border-0'; // Need to wrestle borders away from Bootstrap like this
    const activeClass = isActive ? 'selected' : '';
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
          src={`${import.meta.env.BASE_URL}/icons/${iconPath || id}.png`}
          alt={title}
          className="button-icon"
        />
      </button>
    );
  }
);

ScalingButton.displayName = 'ScalingButton';

export default ScalingButton;
