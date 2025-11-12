import { useEffect, useMemo, useState } from 'react';
import './App.css';

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'special', 'backspace'],
];

const SPECIAL_CHARACTERS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  '@',
  '#',
  '$',
  '%',
  '&',
  '*',
  '(',
  ')',
  '-',
  '+',
  '/',
  '=',
  '_',
  '\\',
  '"',
  '\'',
  ':',
  ';',
  '!',
  '?',
  '.',
  ',',
  '~',
  '`',
  '^',
  '|',
  '<',
  '>',
  '{',
  '}',
  '[',
  ']',
];

const SPECIAL_CHARS_PER_ROW = 10;
const SPECIAL_ROWS_PER_PAGE = 3;
const SPECIAL_CHARS_PER_PAGE = SPECIAL_CHARS_PER_ROW * SPECIAL_ROWS_PER_PAGE;

const chunk = (array, size) => {
  const result = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }

  return result;
};

function VirtualKeyboard({ onChange }) {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isSpecialMode, setIsSpecialMode] = useState(false);
  const [specialPage, setSpecialPage] = useState(0);

  const specialPages = useMemo(() => {
    const pages = chunk(SPECIAL_CHARACTERS, SPECIAL_CHARS_PER_PAGE);
    return pages.length > 0 ? pages : [[]];
  }, []);

  useEffect(() => {
    setSpecialPage((currentPage) => {
      const maxIndex = Math.max(0, specialPages.length - 1);
      return Math.min(currentPage, maxIndex);
    });
  }, [specialPages.length]);

  const handleCharacterInput = (character) => {
    if (!character) {
      return;
    }

    onChange((previous) => `${previous}${character}`);

    if (isShiftActive && !isSpecialMode) {
      setIsShiftActive(false);
    }
  };

  const handleBackspace = () => {
    onChange((previous) => previous.slice(0, -1));
  };

  const handleKeyPress = (key) => {
    switch (key) {
      case 'shift':
        setIsShiftActive((current) => !current);
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'special':
        setIsSpecialMode(true);
        setIsShiftActive(false);
        setSpecialPage(0);
        break;
      case 'abc':
        setIsSpecialMode(false);
        setSpecialPage(0);
        break;
      case 'page':
        setSpecialPage((current) => {
          const totalPages = specialPages.length;
          if (totalPages <= 1) {
            return 0;
          }

          return (current + 1) % totalPages;
        });
        break;
      default: {
        if (typeof key === 'string' && key.length > 0) {
          const character = isShiftActive && !isSpecialMode ? key.toUpperCase() : key;
          handleCharacterInput(character);
        }
        break;
      }
    }
  };

  const getKeyLabel = (key) => {
    const baseLabels = {
      shift: '⇧',
      backspace: '⌫',
      special: '?123',
      abc: 'ABC',
      page: `${specialPage + 1}/${specialPages.length}`,
    };

    if (baseLabels[key]) {
      return baseLabels[key];
    }

    if (typeof key === 'string' && key.length === 1 && !isSpecialMode) {
      return isShiftActive ? key.toUpperCase() : key;
    }

    return key;
  };

  const getKeyClassName = (key) => {
    const classes = ['key'];

    if (key === 'special' || key === 'abc' || key === 'shift' || key === 'page') {
      classes.push('key--modifier');
    }

    if (key === 'backspace') {
      classes.push('key--action');
    }

    if (key === 'shift' && isShiftActive) {
      classes.push('key--active');
    }

    return classes.join(' ');
  };

  const renderKey = (key) => (
    <button
      key={key}
      type="button"
      className={getKeyClassName(key)}
      onClick={() => handleKeyPress(key)}
    >
      {getKeyLabel(key)}
    </button>
  );

  const renderLetterRows = () =>
    LETTER_ROWS.map((row, index) => (
      <div key={`letter-row-${index}`} className="keyboard-row">
        {row.map((key) => {
          if (key.length === 1) {
            const display = isShiftActive ? key.toUpperCase() : key;
            return (
              <button
                key={key}
                type="button"
                className="key"
                onClick={() => handleKeyPress(key)}
              >
                {display}
              </button>
            );
          }

          return renderKey(key);
        })}
      </div>
    ));

  const renderSpecialRows = () => {
    const page = specialPages[specialPage] ?? [];
    const pageRows = chunk(page, SPECIAL_CHARS_PER_ROW);

    while (pageRows.length < SPECIAL_ROWS_PER_PAGE) {
      pageRows.push([]);
    }

    if (pageRows.length > 0) {
      const lastIndex = pageRows.length - 1;
      pageRows[lastIndex] = [...pageRows[lastIndex], 'backspace'];
    }

    return (
      <>
        {pageRows.map((row, index) => (
          <div key={`special-row-${index}`} className="keyboard-row">
            {row.map((key) => renderKey(key))}
          </div>
        ))}
        <div className="keyboard-row">
          {renderKey('abc')}
          {renderKey('page')}
        </div>
      </>
    );
  };

  return (
    <div className="keyboard" aria-label="Virtual keyboard">
      {isSpecialMode ? renderSpecialRows() : renderLetterRows()}
    </div>
  );
}

export default VirtualKeyboard;
