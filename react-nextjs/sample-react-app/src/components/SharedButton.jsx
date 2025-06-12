import React from 'react';
import '../styles/sharedButton.css';

const SharedButton = ({ children, onClick }) => (
  <button className="shared-btn" onClick={onClick}>
    {children}
  </button>
);

export default SharedButton;