import { describe, expect, it } from 'vitest'

import { SEO } from '../../../src/shared/utils/SEO.util.js'

describe('SEO', () => {
  describe('removeUnnecessaryWords', () => {
    it('should remove articles (a, an, the)', () => {
      const result = SEO.removeUnnecessaryWords('A Guide to the Best Practices')

      expect(result).toBe('guide best practices')
    })

    it('should remove conjunctions (and, or, but)', () => {
      const result = SEO.removeUnnecessaryWords('Dogs and Cats or Birds but not Fish')

      expect(result).toBe('dogs cats birds not fish')
    })

    it('should remove prepositions (of, in, on, at, to, from)', () => {
      const result = SEO.removeUnnecessaryWords('Tips of Success in Business on the Web')

      expect(result).toBe('tips success business web')
    })

    it('should remove pronouns (I, me, we, you, they)', () => {
      const result = SEO.removeUnnecessaryWords('I think we should help them with their project')

      expect(result).toBe('think should help project')
    })

    it('should remove auxiliary and linking verbs (is, are, was, were, have, has)', () => {
      const result = SEO.removeUnnecessaryWords('This is what we have been doing')

      expect(result).toBe('what doing')
    })

    it('should remove low-value modifiers (very, really, quite, just)', () => {
      const result = SEO.removeUnnecessaryWords('Very Good Really Great Just Perfect')

      expect(result).toBe('good great perfect')
    })

    it('should remove common fillers (this, that, these, those)', () => {
      const result = SEO.removeUnnecessaryWords('This is that thing with those items')

      expect(result).toBe('thing items')
    })

    it('should handle title with mixed case', () => {
      const result = SEO.removeUnnecessaryWords('The BEST Guide For YOUR Success')

      expect(result).toBe('best guide success')
    })

    it('should preserve important words', () => {
      const result = SEO.removeUnnecessaryWords('Python Programming Tutorial')

      expect(result).toBe('python programming tutorial')
    })

    it('should handle empty string', () => {
      const result = SEO.removeUnnecessaryWords('')

      expect(result).toBe('')
    })

    it('should handle string with only unnecessary words', () => {
      const result = SEO.removeUnnecessaryWords('a the and or but')

      expect(result).toBe('')
    })

    it('should handle multiple spaces between words', () => {
      const result = SEO.removeUnnecessaryWords('The  Quick   Brown    Fox')

      expect(result).toBe('quick brown fox')
    })

    it('should handle leading and trailing spaces', () => {
      const result = SEO.removeUnnecessaryWords('  Best Practices Guide  ')

      expect(result).toBe(' best practices guide ')
    })

    it('should handle single word input', () => {
      const result = SEO.removeUnnecessaryWords('Tutorial')

      expect(result).toBe('tutorial')
    })

    it('should remove unnecessary single word', () => {
      const result = SEO.removeUnnecessaryWords('the')

      expect(result).toBe('')
    })

    it('should handle complex real-world title', () => {
      const result = SEO.removeUnnecessaryWords(
        'A Complete Guide to the Best SEO Practices for Your Website'
      )

      expect(result).toBe('complete guide best seo practices website')
    })

    it('should remove words case-insensitively', () => {
      const result = SEO.removeUnnecessaryWords('THE Guide AND the Tutorial')

      expect(result).toBe('guide tutorial')
    })

    it('should handle numbers in title', () => {
      const result = SEO.removeUnnecessaryWords('Top 10 Tips for the Best Results')

      expect(result).toBe('top 10 tips best results')
    })

    it('should handle hyphenated words', () => {
      const result = SEO.removeUnnecessaryWords('State-of-the-Art Technology')

      expect(result).toBe('state-of-the-art technology')
    })

    it('should preserve technical terms', () => {
      const result = SEO.removeUnnecessaryWords('JavaScript and TypeScript Tutorial')

      expect(result).toBe('javascript typescript tutorial')
    })
  })

  describe('generateSeoFriendlyTitle', () => {
    it('should generate slug with hyphens between words', () => {
      const result = SEO.generateSeoFriendlyTitle('The Best Guide to SEO')

      expect(result).toBe('best-guide-seo')
    })

    it('should handle multiple spaces and create single hyphens', () => {
      const result = SEO.generateSeoFriendlyTitle('Top   10    Tips')

      expect(result).toBe('top-10-tips')
    })

    it('should remove unnecessary words and join with hyphens', () => {
      const result = SEO.generateSeoFriendlyTitle('A Complete Guide to the Best Practices')

      expect(result).toBe('complete-guide-best-practices')
    })

    it('should handle empty string', () => {
      const result = SEO.generateSeoFriendlyTitle('')

      expect(result).toBe('')
    })

    it('should handle string with only unnecessary words', () => {
      const result = SEO.generateSeoFriendlyTitle('a the and or')

      expect(result).toBe('')
    })

    it('should convert to lowercase and use hyphens', () => {
      const result = SEO.generateSeoFriendlyTitle('JavaScript Tutorial For Beginners')

      expect(result).toBe('javascript-tutorial-beginners')
    })

    it('should handle leading and trailing spaces', () => {
      const result = SEO.generateSeoFriendlyTitle('  Best Practices  ')

      expect(result).toBe('best-practices')
    })

    it('should handle complex real-world title', () => {
      const result = SEO.generateSeoFriendlyTitle(
        'How to Build a React Application in 2024'
      )

      expect(result).toBe('build-react-application-2024')
    })

    it('should handle single word', () => {
      const result = SEO.generateSeoFriendlyTitle('Tutorial')

      expect(result).toBe('tutorial')
    })

    it('should handle numbers and special characters', () => {
      const result = SEO.generateSeoFriendlyTitle('Top 5 Tips for Success')

      expect(result).toBe('top-5-tips-success')
    })
  })
})
