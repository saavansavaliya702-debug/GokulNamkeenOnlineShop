import { useNavigate } from "react-router-dom";
import "../Css/NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const goBack = () => window.history.back();

  return (
    <div className="nf-page">
      {/* Animated aurora background */}
      <div className="nf-aurora" aria-hidden="true">
        <span className="nf-blob nf-blob-1" />
        <span className="nf-blob nf-blob-2" />
        <span className="nf-blob nf-blob-3" />
      </div>

      {/* Grain overlay */}
      <div className="nf-grain" aria-hidden="true" />

      <main className="nf-main">
        <div className="nf-card">
          <span className="nf-pill">Error · 404</span>

          <h1 className="nf-error-code" aria-hidden="true">
            4
            <span className="nf-zero">
              <span className="nf-zero-inner" />
            </span>
            4
          </h1>

          <h2 className="nf-title">Page not found</h2>

          <p className="nf-desc">
            The page you're looking for doesn't exist. It might have been
            moved or deleted. Let's get you back to where you need to be.
          </p>

          <div className="nf-buttons">
            <button className="nf-btn nf-btn-primary" onClick={goHome}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              Go to Home
            </button>

            <button className="nf-btn nf-btn-ghost" onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </main>

      <footer className="nf-footer">
        <span className="nf-footer-dot" />
        Error Code 404 · Page Not Found
      </footer>
    </div>
  );
}