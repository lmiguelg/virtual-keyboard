import { useState } from 'react';
import './App.css';

function App() {
  const [value, setValue] = useState('');

  return (
    <div className="app">
      <h1>Virtual Keyboard</h1>
      <label className="input-label" htmlFor="keyboard-input">
        Type something:
      </label>
      <input
        id="keyboard-input"
        className="keyboard-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Start typing here..."
      />
      <p className="input-preview">
        {value ? `You typed: ${value}` : 'Your text will appear here.'}
      </p>
    </div>
  );
}

export default App;
