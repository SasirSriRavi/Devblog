import React from 'react';
function Loader({ label = 'Loading...' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true"></span>
      <span>{label}</span>
    </div>
  )
}

export default Loader
