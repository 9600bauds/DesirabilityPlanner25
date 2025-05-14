import './ToastNotification.css';

interface ToastProps {
  message: string;
  hasCaps: boolean;
}

const NotificationCap = ({ color }: { color: string }) => {
  return (
    <div className="notification-cap side-shadows">
      <div className={`cap-filling ${color} side-shadows`}></div>
    </div>
  );
};

const ToastNotification: React.FC<ToastProps> = ({ message, hasCaps }) => {
  return (
    <div className="notification">
      {hasCaps && (
        <div className="notification-cap-container">
          <NotificationCap color="blue" />
          <NotificationCap color="red" />
          <NotificationCap color="blue" />
        </div>
      )}
      <span className="notification-text">{message}</span>
      {hasCaps && (
        <div className="notification-cap-container">
          <NotificationCap color="blue" />
          <NotificationCap color="red" />
          <NotificationCap color="blue" />
        </div>
      )}
    </div>
  );
};

ToastNotification.displayName = 'ToastNotification';

export default ToastNotification;
