import { useState } from 'react';
import VirtualKeyboard from './VirtualKeyboard';
import './App.css';

function App() {
  const [value, setValue] = useState('');

  return (
    <div className="app">
      <h1>Virtual Keyboard</h1>
      <label className="input-label" htmlFor="keyboard-input">
        Type something:
      </label>
      <textarea
        id="keyboard-input"
        className="keyboard-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Start typing here..."
        rows={3}
      />
      <VirtualKeyboard onChange={setValue} />
      <p className="input-preview">
        {value ? `You typed: ${value}` : 'Your text will appear here.'}
      </p>
    </div>
  );
}

export default App;
