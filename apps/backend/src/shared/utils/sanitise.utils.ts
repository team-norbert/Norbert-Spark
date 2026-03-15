import DOMPurify from 'isomorphic-dompurify'

export class Sanitise {
  static sanitiseText(text: string): string {
    return DOMPurify.sanitize(text) as string
  }
}
