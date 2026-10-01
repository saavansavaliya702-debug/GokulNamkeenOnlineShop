import { Link } from "react-router-dom";

const BackButton = ({
  to,
  onClick,
  className = "",
}) => {
  const content = (
    <>
      <span className="site-back-button-icon" aria-hidden="true">
        ←
      </span>
      <span>Back</span>
    </>
  );
  const classes = `site-back-button ${className}`.trim();

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={classes}>
      {content}
    </Link>
  );
};

export default BackButton;
