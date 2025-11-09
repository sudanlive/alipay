import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("React index.js executing...");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("React app rendered");