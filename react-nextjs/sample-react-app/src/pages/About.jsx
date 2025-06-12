import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SharedButton from '../components/SharedButton';
import '../styles/about.css';

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