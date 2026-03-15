import DOMPurify from 'isomorphic-dompurify'

export class Sanitise {
  static sanitiseText(text: string) {
    return DOMPurify.sanitize(text)
  }
}
