import styles from '../styles/sharedButton.module.css';
import React from 'react';


const SharedButton = ({ children, onClick }) => (
  <button className={styles.sharedBtn} onClick={onClick}>
    {children}
  </button>
);

export default SharedButton;