import React, { FC, useMemo, useState } from 'react'
import { SensitiveFieldTemplates } from '@ebanka/store/generated/models/sensitive-field-templates'
import { SensitiveInputTypeEnum } from '@ebanka/store/generated/models/sensitive-input-type-enum'
import { createStyles, useTheme, withStyles } from '..'
import { useLocation } from '../../providers/navigation'
import ButtonMui from '../Button/Button'
import Icon from '../Icon/Icon'

enum ActionsTypes {
  Backspace = 'Backspace',
  CapsLock = 'CAPS',
  AlphaNumericSpecial = '?123',
  AlphaNumeric = '123',
  AlphaSpecial = '#+=',
  Alpha = 'ABC',
  NextPage = 'NextPage',
  EmptyChar = 'EmptyChar',
}

const GAP_SIZE_IN_PX = 5

const ActionsTypesSize = {
  [ActionsTypes.Backspace]: 2,
  [ActionsTypes.CapsLock]: 3,
  [ActionsTypes.Alpha]: 2,
  [ActionsTypes.AlphaNumeric]: 2,
  [ActionsTypes.AlphaSpecial]: 2,
  [ActionsTypes.AlphaNumericSpecial]: 2,
  [ActionsTypes.NextPage]: 2,
} as const

type TemplateRow = {
  charSlots?: number
  startActions?: ActionsTypes[]
  endActions?: ActionsTypes[]
}

type TemplateStructure = TemplateRow[]

const QWERTY_CHARS = 'qwertyuiopasdfghjklzxcvbnm'
const NUMBER_CHARS = '1234567890'
const SPECIAL_CHARS =
  '~!@#$%^&*()_+-={}[]|:;<>,.?€£¥¢¬§©®™±÷×µ¶·¸¹²³¼½¾«»ªº¿¡¦¯°–—‘’“”…•†‡′″‹›‒‚‛≠≤≥≈∞∂∑∏∫√∆∇∩∪Ωπθλσ'

const SPECIAL_CHARACTERS_TEMPLATE = (
  action?: ActionsTypes,
): TemplateStructure => [
  {
    charSlots: 10,
    endActions: [ActionsTypes.Backspace],
  },
  { charSlots: 12 },
  { startActions: [ActionsTypes.NextPage], charSlots: 10 },
  {
    startActions: action ? [action] : [],
  },
]

const CHARS_PER_PAGE = (template: TemplateStructure) =>
  template.reduce((total, row) => total + (row.charSlots || 0), 0)

const QUERTY_CHARACTERS_TEMPLATE = (
  action?: ActionsTypes,
): TemplateStructure => [
  {
    charSlots: 10,
    endActions: [ActionsTypes.Backspace],
  },
  {
    startActions: [ActionsTypes.CapsLock],
    charSlots: 9,
  },
  {
    charSlots: 7,
    startActions: action ? [action] : [],
  },
]

const getAvailableChars = (
  type: SensitiveInputTypeEnum,
  specialCharacters: string,
): {
  qwerty?: { chars: string; template: TemplateStructure }
  numericSpecial?: { chars: string; template: TemplateStructure }
} => {
  const charsByType = {
    [SensitiveInputTypeEnum.Alpha]: {
      qwerty: {
        chars: `${QWERTY_CHARS}`,
        template: QUERTY_CHARACTERS_TEMPLATE(),
      },
    },
    [SensitiveInputTypeEnum.AlphaNumeric]: {
      qwerty: {
        chars: `${QWERTY_CHARS}`,
        template: QUERTY_CHARACTERS_TEMPLATE(ActionsTypes.AlphaNumeric),
      },
      numericSpecial: {
        chars: `${NUMBER_CHARS}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(ActionsTypes.Alpha),
      },
    },
    [SensitiveInputTypeEnum.AlphaNumericSpecial]: {
      qwerty: {
        chars: `${QWERTY_CHARS}`,
        template: QUERTY_CHARACTERS_TEMPLATE(ActionsTypes.AlphaNumericSpecial),
      },
      numericSpecial: {
        chars: `${NUMBER_CHARS}${specialCharacters}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(ActionsTypes.Alpha),
      },
    },
    [SensitiveInputTypeEnum.AlphaSpecial]: {
      qwerty: {
        chars: `${QWERTY_CHARS}`,
        template: QUERTY_CHARACTERS_TEMPLATE(ActionsTypes.AlphaSpecial),
      },
      numericSpecial: {
        chars: `${specialCharacters}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(ActionsTypes.Alpha),
      },
    },
    [SensitiveInputTypeEnum.NumericSpecial]: {
      numericSpecial: {
        chars: `${NUMBER_CHARS}${specialCharacters}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(),
      },
    },
    [SensitiveInputTypeEnum.Numeric]: {
      numericSpecial: {
        chars: `${NUMBER_CHARS}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(),
      },
    },
    [SensitiveInputTypeEnum.Special]: {
      numericSpecial: {
        chars: `${specialCharacters}`,
        template: SPECIAL_CHARACTERS_TEMPLATE(),
      },
    },
  }

  return charsByType[type]
}

const calcPages = (specialCharacters: string, size: number) => {
  const result: string[] = []
  for (let index = 0; index < specialCharacters.length; index += size) {
    result.push(specialCharacters.slice(index, index + size))
  }
  return result
}

const getNextPageAwareActions = (
  actions: ActionsTypes[] = [],
  hasMultiplePages: boolean,
): ActionsTypes[] => {
  if (hasMultiplePages) {
    return actions
  }
  return actions.filter(action => action !== ActionsTypes.NextPage)
}

const getMaxCharsPerRow = (template: TemplateStructure) => {
  if (template.length === 0) {
    return 0
  }

  return Math.max(
    ...template.map(({ startActions = [], endActions = [], charSlots = 0 }) =>
      charSlots +
      [...startActions, ...endActions].reduce(
        (sum, action) => sum + (ActionsTypesSize[action] || 0),
        0,
      ),
    ),
  )
}

const fillRow = (
  row: TemplateRow,
  state: {
    characterIndex: number
    pageCharacters: string
    hasMultiplePages: boolean
    maxCharsPerRow: number
  },
) => {
  const keys: string[] = []

  const startActions = getNextPageAwareActions(
    row.startActions,
    state.hasMultiplePages,
  )
  keys.push(...startActions)

  const slots = row.charSlots ?? 0
  for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
    const character = state.pageCharacters[state.characterIndex]
    state.characterIndex += 1
    if (character) {
      keys.push(character)
    }
  }

  const endActions = getNextPageAwareActions(
    row.endActions,
    state.hasMultiplePages,
  )
  keys.push(...endActions)

  if (keys.length === 0) {
    return null
  }

  const currentRowSize = keys.reduce(
    (sum, char) => sum + (ActionsTypesSize[char] || 1),
    0,
  )

  if (currentRowSize < state.maxCharsPerRow) {
    keys.push(
      ...Array(state.maxCharsPerRow - currentRowSize).fill(
        ActionsTypes.EmptyChar,
      ),
    )
  }

  return keys
}

const buildKeyboardLayout = (
  pageIndex: number,
  pages: string[],
  template: TemplateStructure,
) => {
  const pageCharacters = pages[pageIndex] ?? ''
  const hasMultiplePages = pages.length > 1
  const maxCharsPerRow = getMaxCharsPerRow(template)
  const state = {
    characterIndex: 0,
    pageCharacters,
    hasMultiplePages,
    maxCharsPerRow,
  }

  return template
    .map(row => fillRow(row, state))
    .filter((row): row is string[] => Boolean(row))
}

type VirtualKeyboardProps = {
  onKeyPress: (char: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  type: SensitiveInputTypeEnum
  specialCharacters?: SensitiveFieldTemplates['specialCharacters']
}

const KeyboardButton = withStyles(theme =>
  createStyles({
    root: (props: any) => ({
      padding: theme.spacing(1),
      height: theme.spacing(4),
      textTransform: 'none',
      ...(theme.themeProps?.Login?.form?.transparentKeyboard &&
        props?.isLogin && {
          backgroundColor: 'inherit',
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.grey[400]}`,
          '&:hover': {
            backgroundColor: theme.palette.secondary.light,
          },
        }),
    }),
  }),
)(ButtonMui)

const VirtualKeyboard: FC<VirtualKeyboardProps> = ({
  onKeyPress,
  inputRef,
  type,
  specialCharacters = SPECIAL_CHARS,
}) => {
  const theme = useTheme()
  const [specialCharsPagination, setSpecialCharsPagination] = useState(0)
  const keyboardConfig = getAvailableChars(type, specialCharacters)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [numericSpecial, setNumericSpecial] = useState(
    !type.includes(SensitiveInputTypeEnum.Alpha),
  )
  const keyboardType = numericSpecial ? 'numericSpecial' : 'qwerty'
  const structure = keyboardConfig[keyboardType]

  const keyboardStructure = useMemo(() => {
    const pages = calcPages(
      keyboardConfig[keyboardType].chars,
      CHARS_PER_PAGE(keyboardConfig[keyboardType].template),
    )
    return pages.length > 0 ? pages : []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardType])

  // const alphaParameters = {
  //   paginations: 0,
  //   keyboard: keyboardStructure,
  //   template: QUERTY_CHARACTERS_TEMPLATE,
  // } as const

  // const numericSpecialParameters = {
  //   pagination: specialCharsPagination,
  //   keyboard: keyboardStructure,
  //   template: SPECIAL_CHARACTERS_TEMPLATE,
  // } as const

  const numberPages = keyboardStructure.length

  const numericSpecialChar =
    ActionsTypes[
      Object.keys(SensitiveInputTypeEnum).find(
        key => SensitiveInputTypeEnum[key] === type,
      ) as keyof typeof ActionsTypes
    ]
  const { pathname } = useLocation()
  const isLoginPage = pathname === '/login'

  const insertChar = (char: string, cursorPosition: number | null) => {
    const finalChar = capsLockOn ? char.toUpperCase() : char.toLowerCase()
    const newValue = inputRef.current?.value.split('') || []

    newValue.splice(
      cursorPosition === null ? newValue.length - 1 : cursorPosition,
      0,
      finalChar,
    )

    onKeyPress(newValue.join(''))
  }

  const removeChar = (cursorPosition: number | null) => {
    if (cursorPosition === 0) {
      return
    }

    const newValue = inputRef.current?.value.split('')
    newValue?.splice(
      cursorPosition === null ? newValue.length - 1 : cursorPosition - 1,
      1,
    )
    onKeyPress(newValue?.join('') || '')
  }

  const handleKeyPress = (char: string) => {
    const cursorPosition =
      typeof inputRef.current?.selectionStart === 'number'
        ? inputRef.current?.selectionStart
        : null

    switch (char) {
      case ActionsTypes.CapsLock:
        setCapsLockOn(!capsLockOn)
        break
      case ActionsTypes.NextPage: {
        const isLastPage = specialCharsPagination + 1 === numberPages
        setSpecialCharsPagination(isLastPage ? 0 : specialCharsPagination + 1)
        break
      }
      case ActionsTypes.Backspace:
        removeChar(cursorPosition)
        break
      default: {
        const shouldToggleLayout =
          char === numericSpecialChar || char === ActionsTypes.Alpha

        if (shouldToggleLayout) {
          setNumericSpecial(!numericSpecial)
          setSpecialCharsPagination(0)
          break
        }

        insertChar(char, cursorPosition)
      }
    }
  }

  const wrapChar = (char: string) => {
    switch (char) {
      case ActionsTypes.Backspace:
        return <Icon name="OutlineKeyboardBackspace" width={24} />
      case ActionsTypes.CapsLock:
        return <Icon name={capsLockOn ? 'Uppercase' : 'Lowercase'} width={24} />
      case ActionsTypes.NextPage:
        return `${specialCharsPagination + 1}/${numberPages}`
      default:
        if (char === numericSpecialChar || char === ActionsTypes.Alpha) {
          return char
        }

        if (capsLockOn && char.match(/[a-z]/)) {
          return char.toUpperCase()
        }

        return char
    }
  }

  const handleCalcSize = (
    actionButton: ActionsTypes,
    defaultViewWidth: number,
    defaultViewMinWidth: number,
  ) => ({
    maxWidth: `calc(${ActionsTypesSize[actionButton] * defaultViewWidth}px + ${
      (ActionsTypesSize[actionButton] - 1) * GAP_SIZE_IN_PX
    }px)`,
    minWidth: `calc(${
      ActionsTypesSize[actionButton] * defaultViewMinWidth
    }px + ${(ActionsTypesSize[actionButton] - 1) * GAP_SIZE_IN_PX}px)`,
  })

  const handleActionSize = (char: string) => {
    const defaultViewWidth = 40
    const defaultViewMinWidth = 20
    const actionsWithCustomSize: ActionsTypes[] = [
      ActionsTypes.CapsLock,
      ActionsTypes.NextPage,
      ActionsTypes.Backspace,
      ActionsTypes.AlphaNumericSpecial,
      ActionsTypes.Alpha,
    ]

    if (actionsWithCustomSize.includes(char as ActionsTypes)) {
      return handleCalcSize(
        char as ActionsTypes,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    }

    return {
      maxWidth: `${defaultViewWidth}px`,
      minWidth: `${defaultViewMinWidth}px`,
    }
  }

  const charsTemplate = buildKeyboardLayout(
    specialCharsPagination,
    keyboardStructure,
    structure?.template ?? [],
  )

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        paddingTop: theme.spacing(2),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',

          alignItems: 'center',
          width: 'fit-content',
          maxWidth: '100%',
          gap: `${GAP_SIZE_IN_PX}px`,
        }}
      >
        {charsTemplate.map((row, rowKey) =>
          row && row?.length > 0 ? (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={rowKey}
              style={{
                display: 'flex',
                gap: `${GAP_SIZE_IN_PX}px`,
                flexDirection: 'row',
                width: '100%',
              }}
            >
              {row?.map((char, index) => (
                <KeyboardButton
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  variant="contained"
                  onClick={() => handleKeyPress(char)}
                  isLogin={isLoginPage}
                  disabled={char === ActionsTypes.EmptyChar}
                  style={{
                    display: 'flex',
                    minWidth: handleActionSize(char).minWidth,
                    width: handleActionSize(char).maxWidth,
                    maxWidth: handleActionSize(char).maxWidth,
                    whiteSpace: 'nowrap',
                    ...(char === ActionsTypes.EmptyChar && {
                      background: 'transparent',
                      border: 'none',
                    }),
                  }}
                >
                  {char === ActionsTypes.EmptyChar ? (
                    <>&nbsp;</>
                  ) : (
                    wrapChar(char)
                  )}
                </KeyboardButton>
              ))}
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}

export default VirtualKeyboard