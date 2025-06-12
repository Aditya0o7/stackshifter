import styles from '../styles/about.module.css';
import React from 'react';
import Header from './Header.jsx';
import Footer from '../components/Footer';
import SharedButton from './SharedButton.jsx';


const About = () => (
  <>
    <Header />
    <main>
      <h2>About Page</h2>
      <p>This is the about page.</p>
      <SharedButton onClick={() => alert('Hello from About!')}>Say Hi</SharedButton>
    </main>
    <Footer />
  </>
);

export default About;