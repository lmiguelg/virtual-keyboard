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

type TemplateStructure = {
  charSlots?: number
  startActions?: ActionsTypes[]
  endActions?: ActionsTypes[]
}[]

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

const handleCharsTemplate = (chars, pages, template: TemplateStructure) => {
  const pageCharacters = pages[chars] ?? []
  let characterIndex = 0

  const MAX_CHARS_PER_ROW = Math.max(
    ...template.map(
      ({ startActions = [], endActions = [], charSlots = 0 }) =>
        charSlots +
        [...startActions, ...endActions].reduce(
          (sum, action) => sum + (ActionsTypesSize[action] || 0),
          0,
        ),
    ),
  )

  return template.map(templateRow => {
    const keys: string[] = []

    if (templateRow.startActions) {
      let newStartAction = templateRow.startActions

      if (pages.length === 1) {
        newStartAction = templateRow.startActions.filter(
          item => item !== ActionsTypes.NextPage,
        )
      }
      keys.push(...newStartAction)
    }

    const slots = templateRow.charSlots ?? 0
    for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
      const character = pageCharacters[characterIndex]
      characterIndex += 1
      if (character) {
        keys.push(character)
      }
    }

    if (templateRow.endActions) {
      let newEndAction = templateRow.endActions
      if (pages.length === 1) {
        newEndAction = templateRow.endActions.filter(
          item => item !== ActionsTypes.NextPage,
        )
      }
      keys.push(...newEndAction)
    }

    if (keys.length === 0) {
      return null
    }

    const currentSizeRow = keys.reduce(
      (sum, char) => sum + (ActionsTypesSize[char] || 1),
      0,
    )
    if (currentSizeRow < MAX_CHARS_PER_ROW) {
      keys.push(
        ...Array(MAX_CHARS_PER_ROW - currentSizeRow).fill(
          ActionsTypes.EmptyChar,
        ),
      )
    }
    console.log(keys)
    return keys
  })
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
  console.log({ type })
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

  const handleKeyPress = (char: string) => {
    const cursorPosition =
      typeof inputRef.current?.selectionStart === 'number'
        ? inputRef.current?.selectionStart
        : null

    if (char === ActionsTypes.CapsLock) {
      setCapsLockOn(!capsLockOn)
    } else if (char === ActionsTypes.NextPage) {
      if (specialCharsPagination + 1 === numberPages) {
        setSpecialCharsPagination(0)
        return
      }
      setSpecialCharsPagination(specialCharsPagination + 1)
    } else if (char === numericSpecialChar || char === ActionsTypes.Alpha) {
      setNumericSpecial(!numericSpecial)
      setSpecialCharsPagination(0)
    } else if (char === ActionsTypes.Backspace) {
      if (cursorPosition !== 0) {
        const newValue = inputRef.current?.value.split('')
        // removes the character in the position of the cursor
        newValue?.splice(
          cursorPosition === null ? newValue.length - 1 : cursorPosition - 1,
          1,
        )
        onKeyPress(newValue?.join('') || '')
      }
    } else {
      const finalChar = capsLockOn ? char.toUpperCase() : char.toLowerCase()
      const newValue = inputRef.current?.value.split('') || []

      // adds the character in the position of the cursor
      newValue.splice(
        cursorPosition === null ? newValue.length - 1 : cursorPosition,
        0,
        finalChar,
      )
      onKeyPress(newValue.join(''))
    }
  }

  const wrapChar = (char: string) => {
    if (char === ActionsTypes.Backspace) {
      return <Icon name="OutlineKeyboardBackspace" width={24} />
    }
    if (char === ActionsTypes.CapsLock) {
      return <Icon name={capsLockOn ? 'Uppercase' : 'Lowercase'} width={24} />
    }
    if (char === numericSpecialChar || char === ActionsTypes.Alpha) {
      return char
    }
    if (char === ActionsTypes.NextPage) {
      return `${specialCharsPagination + 1}/${numberPages}`
    }
    // prevent upperCase specialCharacters like Á à ñ Ñ, etc
    if (capsLockOn && char.match(/[a-z]/)) {
      return char.toUpperCase()
    }
    return char
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
    if (char === ActionsTypes.CapsLock)
      return handleCalcSize(
        ActionsTypes.CapsLock,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    if (char === ActionsTypes.NextPage)
      return handleCalcSize(
        ActionsTypes.NextPage,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    if (char === ActionsTypes.Backspace)
      return handleCalcSize(
        ActionsTypes.Backspace,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    if (char === ActionsTypes.AlphaNumericSpecial)
      return handleCalcSize(
        ActionsTypes.AlphaNumericSpecial,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    if (char === ActionsTypes.Alpha)
      return handleCalcSize(
        ActionsTypes.Alpha,
        defaultViewWidth,
        defaultViewMinWidth,
      )
    return {
      maxWidth: `${defaultViewWidth}px`,
      minWidth: `${defaultViewMinWidth}px`,
    }
  }

  const charsTemplate = handleCharsTemplate(
    specialCharsPagination,
    keyboardStructure,
    structure?.template,
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