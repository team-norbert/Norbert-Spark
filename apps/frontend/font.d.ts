declare module 'next/font/google' {
  import type {
    CssVariable,
    Display,
    NextFont,
    NextFontWithVariable,
  } from 'next/dist/compiled/@next/font/dist/types'

  export function Roboto_Mono<T extends CssVariable | undefined = undefined>(options?: {
    weight?:
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | 'variable'
      | Array<'100' | '200' | '300' | '400' | '500' | '600' | '700'>
    style?: 'normal' | 'italic' | Array<'normal' | 'italic'>
    display?: Display
    variable?: T
    preload?: boolean
    fallback?: string[]
    adjustFontFallback?: boolean
    subsets?: Array<'cyrillic' | 'cyrillic-ext' | 'greek' | 'latin' | 'latin-ext' | 'vietnamese'>
  }): T extends undefined ? NextFont : NextFontWithVariable
}
