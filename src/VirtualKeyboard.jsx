import { useEffect, useMemo, useState } from 'react';
import './App.css';

const LETTER_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['special', 'shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
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

const SPECIAL_ROW_TEMPLATE = [
  { charSlots: 10 },
  { charSlots: 10 },
  { charSlots: 10, trailingActions: ['backspace'] },
  { leadingActions: ['abc'], trailingActions: ['page'] },
];

const SPECIAL_CHARS_PER_PAGE = SPECIAL_ROW_TEMPLATE.reduce(
  (total, row) => total + (row.charSlots ?? 0),
  0,
);

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

    if (key === 'special') {
      classes.push('key--special');
    }

    if (key === 'backspace') {
      classes.push('key--action');
    }

    if (key === 'shift' && isShiftActive) {
      classes.push('key--active');
    }

    return classes.join(' ');
  };

  const renderKey = (key, reactKey = key) => (
    <button
      key={reactKey}
      type="button"
      className={getKeyClassName(key)}
      onClick={() => handleKeyPress(key)}
    >
      {getKeyLabel(key)}
    </button>
  );

  const renderLetterRows = () =>
    LETTER_ROWS.map((row, rowIndex) => (
      <div key={`letter-row-${rowIndex}`} className="keyboard-row">
        {row.map((key, keyIndex) =>
          renderKey(key, `letter-${rowIndex}-${keyIndex}-${key}`),
        )}
      </div>
    ));

  const renderSpecialRows = () => {
    const pageCharacters = specialPages[specialPage] ?? [];
    let characterIndex = 0;

    return SPECIAL_ROW_TEMPLATE.map((templateRow, rowIndex) => {
      const keys = [];

      if (templateRow.leadingActions) {
        keys.push(...templateRow.leadingActions);
      }

      const slots = templateRow.charSlots ?? 0;
      for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
        const character = pageCharacters[characterIndex];
        characterIndex += 1;

        if (character) {
          keys.push(character);
        }
      }

      if (templateRow.trailingActions) {
        keys.push(...templateRow.trailingActions);
      }

      if (keys.length === 0) {
        return null;
      }

      return (
        <div key={`special-row-${rowIndex}`} className="keyboard-row">
          {keys.map((key, keyIndex) =>
            renderKey(key, `special-${rowIndex}-${keyIndex}-${key}`),
          )}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="keyboard" aria-label="Virtual keyboard">
      {isSpecialMode ? renderSpecialRows() : renderLetterRows()}
    </div>
  );
}

export default VirtualKeyboard;
