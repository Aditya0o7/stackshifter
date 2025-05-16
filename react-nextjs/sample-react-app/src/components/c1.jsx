import React from 'react';

const C1 = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome to Component C1</h1>
      <p style={styles.paragraph}>
        This is a sample React component. You can use this as a starting point for your project.
      </p>
      <button style={styles.button} onClick={() => alert('Button clicked!')}>
        Click Me
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f4f4f9',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  heading: {
    color: '#4caf50',
    fontSize: '2rem',
    marginBottom: '10px',
  },
  paragraph: {
    color: '#333',
    fontSize: '1rem',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default C1;