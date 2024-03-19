'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirm = () => {
    if (!userName) {
      setErrorMessage('Please enter your name to proceed.');
      return;
    }
  
    if (typeof window !== 'undefined') { // Check for window object
      const localStorageUser = localStorage.getItem("userName");
  
      if (userName === localStorageUser) {
        localStorage.clear();
        localStorage.setItem('userName', userName);
      }
    }
  
    router.push('/binance');
    setErrorMessage('');
  };
  

  return (
    <div className="coin-selection-container">
      <h2>Write your name to store data locally</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <label>
        User Name:
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className='border'
        />
      </label>
      <button onClick={handleConfirm}>Go to Dashboard</button>
    </div>
  );
}