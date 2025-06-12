import styles from '../styles/home.module.css';
import React from 'react';
import Header from './Header.jsx';
import Footer from '../components/Footer';
import SharedButton from './SharedButton.jsx';


const Home = () => (
  <>
    <Header />
    <main>
      <h2>Home Page</h2>
      <p>Welcome to the home page!</p>
      <SharedButton onClick={() => alert('Hello from Home!')}>Click Me</SharedButton>
    </main>
    <Footer />
  </>
);

export default Home;