import { describe, expect, it } from 'vitest'

import { Sanitise } from '../../../src/shared/utils/sanitise.utils.js'

describe('Sanitise', () => {
  describe('sanitiseText()', () => {
    // ─── Safe inputs — returned unchanged ──────────────────────────────────

    it('should return plain text unchanged', () => {
      expect(Sanitise.sanitiseText('Hello, world!')).toBe('Hello, world!')
    })

    it('should return an empty string unchanged', () => {
      expect(Sanitise.sanitiseText('')).toBe('')
    })

    it('should return a string with only whitespace unchanged', () => {
      expect(Sanitise.sanitiseText('   ')).toBe('   ')
    })

    it('should return safe inline HTML elements unchanged', () => {
      // DOMPurify permits common inline elements like <b>, <em>, <strong>
      expect(Sanitise.sanitiseText('<b>bold</b>')).toBe('<b>bold</b>')
      expect(Sanitise.sanitiseText('<em>italic</em>')).toBe('<em>italic</em>')
      expect(Sanitise.sanitiseText('<strong>strong</strong>')).toBe('<strong>strong</strong>')
    })

    it('should return a URL-like string unchanged', () => {
      expect(Sanitise.sanitiseText('https://example.com/path?q=1&r=2')).toBe(
        'https://example.com/path?q=1&r=2'
      )
    })

    it('should return numeric strings unchanged', () => {
      expect(Sanitise.sanitiseText('12345')).toBe('12345')
    })

    it('should return multiline text unchanged', () => {
      const text = 'Line one\nLine two\nLine three'
      expect(Sanitise.sanitiseText(text)).toBe(text)
    })

    // ─── XSS — script tags stripped ────────────────────────────────────────

    it('should strip a basic <script> tag and its content', () => {
      const result = Sanitise.sanitiseText('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should strip a <script> tag with a src attribute', () => {
      const result = Sanitise.sanitiseText('<script src="https://evil.com/xss.js"></script>')
      expect(result).not.toContain('<script')
      expect(result).not.toContain('evil.com')
    })

    it('should strip an uppercase <SCRIPT> tag', () => {
      const result = Sanitise.sanitiseText('<SCRIPT>alert("xss")</SCRIPT>')
      expect(result).not.toContain('<SCRIPT>')
      expect(result).not.toContain('<script>')
    })

    it('should strip a mixed-case <Script> tag', () => {
      const result = Sanitise.sanitiseText('<Script>alert(1)</Script>')
      expect(result).not.toContain('<Script>')
      expect(result).not.toContain('alert')
    })

    // ─── XSS — dangerous event handlers stripped ───────────────────────────

    it('should strip an onerror event handler from an <img> tag', () => {
      const result = Sanitise.sanitiseText('<img src=x onerror="alert(1)">')
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
    })

    it('should strip an onclick event handler from an anchor tag', () => {
      const result = Sanitise.sanitiseText('<a href="#" onclick="steal()">click</a>')
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('steal()')
    })

    it('should strip an onload event handler from a <body> tag', () => {
      const result = Sanitise.sanitiseText('<body onload="malicious()">')
      expect(result).not.toContain('onload')
    })

    // ─── XSS — javascript: protocol stripped ───────────────────────────────

    it('should strip a javascript: href', () => {
      const result = Sanitise.sanitiseText('<a href="javascript:alert(1)">click</a>')
      expect(result).not.toContain('javascript:')
    })

    it('should strip a javascript: href in uppercase', () => {
      const result = Sanitise.sanitiseText('<a href="JAVASCRIPT:alert(1)">click</a>')
      expect(result).not.toContain('JAVASCRIPT:')
      expect(result).not.toContain('javascript:')
    })

    // ─── Dangerous tags removed ─────────────────────────────────────────────

    it('should remove <iframe> tags entirely', () => {
      const result = Sanitise.sanitiseText('<iframe src="https://evil.com"></iframe>')
      expect(result).not.toContain('<iframe')
      expect(result).not.toContain('evil.com')
    })

    it('should remove <object> tags', () => {
      const result = Sanitise.sanitiseText('<object data="malware.swf"></object>')
      expect(result).not.toContain('<object')
    })

    it('should remove <embed> tags', () => {
      const result = Sanitise.sanitiseText('<embed src="exploit.swf">')
      expect(result).not.toContain('<embed')
    })

    it('should preserve <form> tags — DOMPurify allows them by default', () => {
      // DOMPurify does not block <form> in its default config; the tag is
      // considered safe HTML. The action attribute is also preserved.
      const result = Sanitise.sanitiseText('<form action="https://evil.com"><input></form>')
      expect(result).toContain('<form')
      expect(result).toContain('<input')
    })

    it('should remove <base> tags', () => {
      const result = Sanitise.sanitiseText('<base href="https://evil.com">')
      expect(result).not.toContain('<base')
    })

    // ─── Mixed content — dangerous parts stripped, safe parts kept ─────────

    it('should strip only the dangerous portion and keep surrounding text', () => {
      const result = Sanitise.sanitiseText('Hello <script>alert(1)</script> World')
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should strip a nested XSS attempt and preserve outer text', () => {
      const result = Sanitise.sanitiseText(
        'Safe text <img src=x onerror="alert(1)"> more safe text'
      )
      expect(result).not.toContain('onerror')
      expect(result).toContain('more safe text')
    })

    it('should handle multiple XSS vectors in a single string', () => {
      const result = Sanitise.sanitiseText(
        '<script>bad()</script><iframe src="evil.com"></iframe><img onerror="x">'
      )
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<iframe')
      expect(result).not.toContain('onerror')
    })

    // ─── Edge cases ─────────────────────────────────────────────────────────

    it('should handle a string with only HTML entities', () => {
      const result = Sanitise.sanitiseText('&lt;script&gt;')
      // Encoded entities are safe text — should be preserved or decoded safely
      expect(typeof result).toBe('string')
      expect(result).not.toContain('<script>')
    })

    it('should handle very long input without throwing', () => {
      const longText = 'a'.repeat(100_000)
      expect(() => Sanitise.sanitiseText(longText)).not.toThrow()
      expect(Sanitise.sanitiseText(longText)).toBe(longText)
    })

    it('should handle Unicode text without throwing', () => {
      const unicode = '日本語テスト 🎉 Ünïcödé'
      expect(Sanitise.sanitiseText(unicode)).toBe(unicode)
    })

    it('should handle a string with newlines and tabs without altering them', () => {
      const text = 'line1\nline2\ttabbed'
      expect(Sanitise.sanitiseText(text)).toBe(text)
    })

    it('should be callable multiple times without side effects', () => {
      const input = '<b>safe</b> <script>bad()</script>'
      const first = Sanitise.sanitiseText(input)
      const second = Sanitise.sanitiseText(input)
      expect(first).toBe(second)
    })
  })
})
