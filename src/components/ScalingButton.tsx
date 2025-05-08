interface ScalingButtonProps {
  id: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

const ScalingButton = ({
  id,
  title,
  onClick,
  disabled = false,
  isActive = false,
}: ScalingButtonProps) => {
  const activeClass = isActive ? 'btn-success' : 'btn-outline-secondary';

  return (
    <button
      key={id}
      id={id}
      className={`btn ${activeClass} d-flex align-items-center justify-content-center grid-button`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <img
        src={`/DesirabilityPlanner25/icons/${id}.png`}
        className="button-icon"
      />
    </button>
  );
};

export default ScalingButton;
