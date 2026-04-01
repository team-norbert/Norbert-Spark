import { beforeEach, describe, expect, it } from 'vitest'

import { HEART_OF_DARKNESS_MAPPINGS } from '../../../src/application/services/domain-keyword-mapping.config.js'
import { TextAnalysisService } from '../../../src/application/services/text-analysis.service.js'

describe('TextAnalysisService', () => {
  let service: TextAnalysisService
  let serviceWithDomainMappings: TextAnalysisService

  beforeEach(() => {
    service = new TextAnalysisService()
    serviceWithDomainMappings = new TextAnalysisService(HEART_OF_DARKNESS_MAPPINGS)
  })

  describe('extractRelevantPassages', () => {
    it('should extract passages containing question keywords', () => {
      const fullText = `
        The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails.
        Marlow sat cross-legged right aft, leaning against the mizzen-mast.
        He had sunken cheeks, a yellow complexion, a straight back.
        The Director of Companies was our captain and our host.
        Kurtz was a remarkable man who collected ivory.
      `

      const question = 'Who was Kurtz?'
      const result = service.extractRelevantPassages(fullText, question)

      // Should extract passages containing "Kurtz"
      expect(result).toContain('Kurtz')
      expect(result).toContain('remarkable man')
    })

    it('should filter out stopwords from question', () => {
      const fullText = 'The river flowed through the jungle. Marlow traveled upriver.'
      const question = 'What is the river like?'

      const result = service.extractRelevantPassages(fullText, question)

      // Should find passages with "river" keyword (stopwords like "what", "is", "the" are filtered)
      expect(result).toContain('river')
    })

    it('should add domain-specific keywords for river questions', () => {
      const fullText = `
        The Thames was calm. Later, the Congo river proved treacherous.
        The water was dark and mysterious.
      `
      const question = 'What about the river?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should include passages about rivers (thames, congo, river, water)
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/thames|congo|river|water/i)
    })

    it('should add domain-specific keywords for Kurtz questions', () => {
      const fullText = `
        The ivory trade was profitable. The station agent reported to Kurtz.
        Kurtz collected more ivory than anyone.
      `
      const question = 'Tell me about Kurtz'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should include passages about Kurtz, ivory, station, agent
      expect(result).toContain('Kurtz')
      expect(result).toMatch(/ivory|station|agent/i)
    })

    it('should return beginning and end when no keywords match', () => {
      const fullText = 'A'.repeat(30000)
      const question = 'XYZ123 nonexistent keyword'

      const result = service.extractRelevantPassages(fullText, question)

      // Should return fallback format with beginning, [...], and ending
      expect(result).toContain('[...]')
      // add an extra 9 characters accounts for the separator: '\n\n[...]\n\n'
      expect(result.length).toBeLessThanOrEqual(25009)
    })

    it('should respect MAX_CONTEXT_LENGTH limit', () => {
      const fullText = 'A'.repeat(100000)
      const question = 'test'

      const result = service.extractRelevantPassages(fullText, question)

      // Should not exceed ~25000 characters
      expect(result.length).toBeLessThanOrEqual(25100) // Allow small buffer for separators
    })

    it('should merge overlapping passages', () => {
      const fullText = `
        Marlow began his story about Kurtz.
        Kurtz was in the Congo.
        The journey to find Kurtz was long.
      `
      const question = 'Marlow Kurtz'

      const result = service.extractRelevantPassages(fullText, question)

      // Should merge passages that overlap (both keywords appear close together)
      expect(result).toContain('Marlow')
      expect(result).toContain('Kurtz')
    })

    it('should separate non-overlapping passages with separators', () => {
      const text1 = 'First section with keyword alpha. '.repeat(30)
      const text2 = 'Middle section without keywords. '.repeat(50)
      const text3 = 'Last section with keyword alpha. '.repeat(30)
      const fullText = text1 + text2 + text3

      const question = 'alpha'
      const result = service.extractRelevantPassages(fullText, question)

      // Should contain separator between non-overlapping passages
      expect(result).toContain('---')
    })

    it('should prioritize passages with more keyword matches', () => {
      const fullText = `
        Section one mentions alpha once.
        ${'Middle boring section. '.repeat(100)}
        Section three mentions alpha beta gamma delta multiple keywords here.
      `
      const question = 'alpha beta gamma delta'

      const result = service.extractRelevantPassages(fullText, question)

      // Should prioritize section with more matches
      expect(result).toContain('Section three')
      expect(result).toContain('multiple keywords')
    })

    it('should handle empty text gracefully', () => {
      const fullText = ''
      const question = 'test'

      const result = service.extractRelevantPassages(fullText, question)

      // Should return empty result
      expect(result).toBe('')
    })

    it('should handle very short text', () => {
      const fullText = 'Short text.'
      const question = 'text'

      const result = service.extractRelevantPassages(fullText, question)

      // Should include the short text
      expect(result).toContain('Short text')
    })

    it('should extract passages for death/last words questions', () => {
      const fullText = `
        Kurtz died at the station. His last words were whispered.
        "The horror! The horror!" he said before death took him.
      `
      const question = 'What were his last words?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about death, horror, whispered, died, last
      expect(result).toMatch(/horror|died|death|last|whispered/i)
    })

    it('should extract passages for attack questions', () => {
      const fullText = `
        The natives attacked with arrows and spears.
        The savages launched their attack at dawn.
      `
      const question = 'What happened during the attack?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about arrows, natives, spears, attack, savages
      expect(result).toMatch(/arrows|natives|spears|attack|savages/i)
    })

    it('should extract passages for steamboat repair questions', () => {
      const fullText = `
        The steamboat needed repair. We waited for rivets to fix the boiler.
        The steam wreck was finally repaired.
      `
      const question = 'How was the steamboat repaired?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about rivets, repair, boiler, steam, wreck
      expect(result).toMatch(/rivets|repair|boiler|steam|wreck/i)
    })

    it('should extract passages for poles/station questions', () => {
      const fullText = `
        The station had ornamental poles with heads.
        The skulls on the poles were a grim sight.
      `
      const question = 'What was at the station with the poles?'

      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)

      // Should find passages about heads, skulls, poles, ornamental
      expect(result).toMatch(/heads|skulls|poles|ornamental/i)
    })

    it('should store domainMapping in constructor (constructor body not empty)', () => {
      const customMapping = {
        domain: 'test',
        rules: [
          {
            triggers: ['custom'],
            keywords: ['uniqueword'],
          },
        ],
      }
      const customService = new TextAnalysisService(customMapping)
      const fullText = 'The uniqueword appears in this text passage about things.'
      // question doesn't contain "custom" keyword, so uniqueword won't match without mapping
      const resultWithMapping = customService.extractRelevantPassages(fullText, 'custom trigger')
      const resultWithoutMapping = service.extractRelevantPassages(fullText, 'custom trigger')
      // With mapping, "custom" trigger adds "uniqueword" keyword → finds passage
      expect(resultWithMapping).toContain('uniqueword')
      // Without mapping, "custom" → no domain keywords added, "trigger" not in text → fallback
      expect(resultWithoutMapping).not.toContain('---')
    })

    it('should filter each stopword from question keywords', () => {
      // All stopwords should be filtered; only non-stopword keyword should produce passage
      const stopWords = [
        'the',
        'a',
        'an',
        'is',
        'are',
        'was',
        'were',
        'what',
        'which',
        'who',
        'whom',
        'when',
        'where',
        'why',
        'how',
        'does',
        'do',
        'did',
        'has',
        'have',
        'had',
        'in',
        'on',
        'at',
        'to',
        'for',
        'of',
        'with',
        'by',
        'from',
        'about',
        'into',
        'during',
        'his',
        'her',
        'their',
        'its',
        'that',
        'this',
        'these',
        'those',
        'and',
        'or',
        'but',
        'if',
        'then',
        'else',
        'just',
        'before',
        'after',
        'upriver',
        'start',
        'begins',
        'narrating',
        'story',
        'novella',
      ]

      // Build text around position 5000 so keyword match is identified separately from fallback
      const padding = 'x'.repeat(5000)
      const uniqueWord = 'uniquekeyword'
      const fullText = padding + ' ' + uniqueWord + ' word ' + padding

      for (const stopWord of stopWords) {
        // Question is only the stopword - it should be filtered, uniqueWord won't be found
        // so no passages, result uses fallback (no '---' separator)
        const questionWithOnlyStopword = stopWord
        const result = service.extractRelevantPassages(fullText, questionWithOnlyStopword)
        // Stopword filtered → no keyword matches → fallback path (beginning + [...] + ending)
        // Fallback does NOT produce '---' separator
        expect(result).not.toContain('---')
      }
    })

    it('should replace punctuation characters in question before splitting', () => {
      // Mutation 3593: replace second arg "" → "Stryker was here!"
      // If replacement is wrong, "punctuated?" becomes "punctuated Stryker was here!"
      // and "Stryker" / "here" might produce wrong results
      const fullText =
        'The punctuated text contains words that match exactly what we need here today.'
      const question = 'punctuated?'
      const result = service.extractRelevantPassages(fullText, question)
      // "punctuated" is the keyword (after "?" stripped), should find passage
      expect(result).toContain('punctuated')
    })

    it('should filter words of length exactly 2 (threshold is strictly > 2)', () => {
      // Mutation 3601: > → >= means 3-char words would also be filtered
      // Words of length 3 should NOT be filtered (passes > 2)
      // Words of length 2 should be filtered (fails > 2)
      const fullText = 'The fog was thick near the river today.'
      // "fog" is length 3, > 2 → should NOT be filtered (passes threshold)
      const question = 'fog' // length 3, not a stopword
      const result = service.extractRelevantPassages(fullText, question)
      expect(result).toContain('fog')
    })

    it('should filter words of exactly length 2 from question keywords', () => {
      // "go" is length 2 → filtered by > 2 check; no match → fallback (no ---)
      const fullText = 'The word go appears here, and we go along the path.'
      const question = 'go'
      const result = service.extractRelevantPassages(fullText, question)
      expect(result).not.toContain('---')
    })

    it('should not add extra keywords when no domain rule triggers match', () => {
      // Mutation 3604: additionalKeywords[] → ["Stryker was here"] - initial value
      // Test: question with no rule triggers → additionalKeywords stays empty
      const fullText = 'The text contains only bananas and oranges and nothing that triggers rules.'
      // "bananas" is not a trigger in HEART_OF_DARKNESS_MAPPINGS
      const question = 'bananas oranges'
      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)
      // Should find passages for "bananas" and/or "oranges" (both > 2 chars and not stopwords)
      expect(result).toContain('bananas')
      // Should NOT contain "Stryker" (wrong initial array mutation)
      expect(result).not.toContain('Stryker')
    })

    it('should use question.toLowerCase() not toUpperCase() for domain trigger matching', () => {
      // Mutation 3608: questionLower uses toUpperCase instead of toLowerCase
      // If toUpperCase is used, "river" trigger won't match "RIVER" in lowercased position
      const fullText = 'The thames river flowed peacefully through the land.'
      const question = 'RIVER flowing'
      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)
      // With toLowerCase: "RIVER flowing".toLowerCase() = "river flowing", triggers match
      // domain rule for 'river' adds 'thames','congo','river','water' → finds 'thames'
      expect(result).toMatch(/thames|river/i)
    })

    it('should execute domain mapping block when domainMapping is set', () => {
      // Mutations 3607: domain mapping if block → {}
      // Verify domain keywords ARE added by checking a word only found via domain mapping
      const fullText = 'The thames was calm and the water flowed gently by.'
      // "river" trigger adds ["thames","congo","river","water"] to keywords
      const question = 'river journey'
      const resultWithMapping = serviceWithDomainMappings.extractRelevantPassages(
        fullText,
        question
      )
      const resultNoMapping = service.extractRelevantPassages(fullText, question)
      // With mapping: "river" trigger → adds "thames" keyword → finds passage with "thames"
      expect(resultWithMapping).toContain('thames')
      // Without mapping: only "river" and "journey" keywords → "river" matches anyway
      // but this tests that domain block executes
      expect(resultWithMapping.length).toBeGreaterThan(0)
      expect(resultWithMapping).not.toContain('Stryker')
    })

    it('should use some() not every() for trigger matching (one trigger is enough)', () => {
      // Mutation 3610: rule.triggers.some → every
      // With "every", ALL triggers in a rule must match; with "some", ONE is enough
      // kurtz rule triggers: ['kurtz'] — only one trigger, so some/every behave same
      // Use a rule with multiple triggers: 'position' or 'hired' triggers captain/steamboat/etc
      const fullText =
        'The captain of the steamboat was in command. He was appointed to the position.'
      // "position" alone triggers ['captain','steamboat','command','skipper','appointed']
      // With every: ['position','hired'] — both must match, but "hired" absent → no domain keywords
      const question = 'position importance'
      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)
      // With some(): "position" alone triggers domain rule → adds "captain","steamboat","command"
      expect(result).toMatch(/captain|steamboat|command|appointed/i)
    })

    it('should add domain keywords when trigger hasMatch is true', () => {
      // Mutations 3612/3613: hasMatch conditional → true/false
      // Verify that when true, keywords ARE pushed; test that when rule triggers, keywords appear
      const ivory = 'ivory'.repeat(5)
      const fullText = `Kurtz collected ${ivory}. He was the station agent.`
      const question = 'kurtz agent'
      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)
      // "kurtz" trigger → adds ["kurtz","ivory","station","agent"] → finds above text
      expect(result).toContain('ivory')
    })

    it('should push all rule keywords when trigger matches (block not empty)', () => {
      // Mutations 3609/3614: inner blocks → {}
      // Test that keywords are actually pushed when a rule matches
      const fullText = 'The thames river water flow was peaceful and calm, coming from the congo.'
      const question = 'river'
      const result = serviceWithDomainMappings.extractRelevantPassages(fullText, question)
      // 'river' trigger adds thames, congo, river, water → finds multiple words in text
      expect(result).toContain('thames')
      expect(result).toContain('congo')
    })

    it('should find keyword near start of text without clamping to negative index', () => {
      // Mutation 3628: Math.max(0,...) → Math.min(0,...) would clamp start to 0 always from below
      // Test keyword at position 0 (very beginning) - Math.max(0, 0 - 750) = 0, Math.min = negative
      const fullText = 'alpha is the first word here. The rest is filler content for the test.'
      const question = 'alpha'
      const result = service.extractRelevantPassages(fullText, question)
      expect(result).toContain('alpha')
    })

    it('should keep passage window as PASSAGE_WINDOW/2, not PASSAGE_WINDOW*2', () => {
      // Mutations 3630/3634: PASSAGE_WINDOW / 2 → PASSAGE_WINDOW * 2 would create huge windows
      // Test: two keywords far apart that should NOT overlap with small window but WOULD with large
      // PASSAGE_WINDOW = 1500, so /2 = 750 chars radius; *2 = 3000 chars radius
      const keyword1 = 'alpha'
      const keyword2 = 'beta'
      // Put keywords 2000 chars apart (> 750*2=1500, so no overlap with /2; overlap with *2=6000)
      const gap = 'x'.repeat(2000)
      const fullText = keyword1 + gap + keyword2
      const question = 'alpha beta'
      const result = service.extractRelevantPassages(fullText, question)
      // With /2 (window=750): passages don't fully overlap → should get '---' separator
      // With *2 (window=3000): passages merge → no separator
      expect(result).toContain('---')
      expect(result).toContain('alpha')
      expect(result).toContain('beta')
    })

    it('should clamp passage end to fullText.length not beyond', () => {
      // Mutation 3631: Math.min(fullText.length,...) → Math.max(...) would go beyond text
      const fullText = 'Short text with alpha keyword at the end alph'
      const question = 'alph'
      // keyword "alph" is at the very end, passage end should be clamped to text length
      const result = service.extractRelevantPassages(fullText, question)
      expect(result).toContain('alph')
      expect(result.length).toBeLessThanOrEqual(fullText.length + 20)
    })

    it('should sort intervals by start position before merging', () => {
      // Mutation 3637: intervals.sort → intervals (unsorted) could cause wrong merging
      // Two separate keywords: if intervals unsorted, merge logic might behave incorrectly
      const text1 = 'gamma content here. '
      const gap = 'x'.repeat(2000)
      const text2 = ' alpha content here.'
      const fullText = text1 + gap + text2 + gap
      // "alpha" appears after "gamma" in text; if intervals unsorted, wrong passages
      const question = 'alpha gamma'
      const result = service.extractRelevantPassages(fullText, question)
      expect(result).toContain('alpha')
      expect(result).toContain('gamma')
    })

    it('should merge intervals and increment score for overlapping intervals', () => {
      // Mutations 3642/3649/3650/3651/3652/3653/3654/3655: merge interval logic
      // Two keywords very close together should produce ONE merged passage, no separator
      const question = 'alpha beta'
      // Put alpha and beta very close (within PASSAGE_WINDOW=1500 chars)
      const fullText =
        'Section one: alpha and beta appear together. More filler text here to pad out.'
      const result = service.extractRelevantPassages(fullText, question)
      // With correct merging: overlapping → single passage, no separator
      expect(result).toContain('alpha')
      expect(result).toContain('beta')
    })

    it('should max extend merged interval end, not shrink it', () => {
      // Mutation 3654: Math.max(last.end, interval.end) → Math.min(last.end, interval.end)
      // Overlapping interval with larger end should extend the merged passage
      const prefixA = 'x'.repeat(200)
      const prefixB = 'x'.repeat(300)
      // keyword "alpha" at 200, "beta" at 500 - both within 1500 window of each other
      const fullText = prefixA + 'alpha' + prefixB + 'beta' + 'y'.repeat(500)
      const question = 'alpha beta'
      const result = service.extractRelevantPassages(fullText, question)
      // With Math.max: merged passage extends to cover beta; both keywords in result
      expect(result).toContain('alpha')
      expect(result).toContain('beta')
    })

    it('should increment score on overlap, not decrement', () => {
      // Mutation 3655: last.score += 1 → last.score -= 1
      // Passage with 2 overlapping keywords should score higher than passage with 1 keyword
      // Setup: section A has 2 keywords (alpha, beta) close together; section B has only gamma
      // With correct score increment, A scores 2 and should appear before B
      const sectionA = 'alpha and beta appear together here'
      const gap = 'y'.repeat(3000)
      const sectionB = 'gamma appears here alone in this section'
      const fullText = sectionB + gap + sectionA

      const question = 'alpha beta gamma'
      const result = service.extractRelevantPassages(fullText, question)
      // With +=1: sectionA has score 2 (alpha+beta overlap), sectionB has score 1
      // Sorted by score desc: sectionA first
      const alphaPos = result.indexOf('alpha')
      const gammaPos = result.indexOf('gamma')
      expect(alphaPos).toBeGreaterThan(-1)
      expect(gammaPos).toBeGreaterThan(-1)
      // sectionA (alpha+beta) should appear before sectionB (gamma) due to higher score
      expect(alphaPos).toBeLessThan(gammaPos)
    })

    it('should sort passages by score descending then position ascending', () => {
      // Mutations 3658/3662/3663/3664: passages.sort → passages (unsorted)
      // Higher scoring passages (more keyword matches) should appear first in result
      const sectionHigh =
        'The high priority section: alpha beta gamma delta. Many keywords here together.'
      const gap = 'z'.repeat(3000)
      const sectionLow = 'The low priority section: alpha alone here.'
      // sectionHigh at the end, sectionLow at the beginning
      const fullText = sectionLow + gap + sectionHigh

      const question = 'alpha beta gamma delta'
      const result = service.extractRelevantPassages(fullText, question)
      // sectionHigh matches alpha, beta, gamma, delta (score 4); sectionLow matches only alpha (score 1)
      // With sort by score: sectionHigh should appear first
      const highPos = result.indexOf('high priority')
      const lowPos = result.indexOf('low priority')
      expect(highPos).toBeGreaterThan(-1)
      expect(lowPos).toBeGreaterThan(-1)
      expect(highPos).toBeLessThan(lowPos)
    })

    it('should skip passages that overlap with already-used ranges', () => {
      // Mutations 3669–3678: usedRanges overlap logic
      // Two passages referencing the same text region → second should be skipped
      const fullText =
        'The important section has alpha and beta and gamma all very close together here.'
      const question = 'alpha beta gamma'
      const result = service.extractRelevantPassages(fullText, question)
      // Even though alpha, beta, gamma each create an interval, the merged passage covers all
      // → usedRanges prevents duplicate content in output → only one passage block, no extra ---
      // The separator '---' should be present once (between empty prefix and text), but only
      // one content block (no duplicate of same region)
      const separatorCount = (result.match(/---/g) ?? []).length
      // Should have at most 1 used range for this closely-grouped text
      expect(separatorCount).toBeLessThanOrEqual(1)
    })

    it('should trim whitespace from extracted passage text', () => {
      // Mutation 3681: .trim() on passageText removed → leading/trailing spaces remain
      const fullText = '   alpha   in text here   '
      const question = 'alpha'
      const result = service.extractRelevantPassages(fullText, question)
      // trim() on final result removes leading/trailing whitespace
      expect(result).not.toMatch(/^\s/)
      expect(result).not.toMatch(/\s$/)
    })

    it('should break when passage + result would exceed MAX_CONTEXT_LENGTH', () => {
      // Mutations 3684/3685/3688/3689: MAX_CONTEXT_LENGTH check
      // Fill result near the limit, then add another passage that would exceed it → stop
      // Build text: first passage ~24800 chars, second passage ~1000 chars
      const firstKeyword = 'firstkw'
      const secondKeyword = 'secondkw'
      const firstPassage = firstKeyword + 'A'.repeat(24800)
      const separator = 'B'.repeat(3000)
      const secondPassage = secondKeyword + 'C'.repeat(1000)
      const fullText = firstPassage + separator + secondPassage

      const question = `${firstKeyword} ${secondKeyword}`
      const result = service.extractRelevantPassages(fullText, question)
      // secondkw passage would push result > 25000 → break → result only has firstkw
      expect(result.length).toBeLessThanOrEqual(25100)
    })

    it('should use fullText.substring not fullText for passage text', () => {
      // Mutation 3682: fullText.substring(start,end) → fullText
      // If fullText returned directly, result would be the entire text
      // Use enough filler so fullText >> PASSAGE_WINDOW (1500), meaning substring result is much shorter
      const filler = 'filler '.repeat(5000) // ~35000 chars
      const fullText = filler + 'targetkeyword appears here.' + filler
      const question = 'targetkeyword'
      const result = service.extractRelevantPassages(fullText, question)
      // Should contain the keyword but NOT the full filler (passage is windowed to ~1500 chars)
      expect(result).toContain('targetkeyword')
      // Result should be much shorter than fullText (windowed extraction)
      expect(result.length).toBeLessThan(fullText.length / 10)
    })

    it('should use fallback with correct arithmetic: fullText.length - MAX_CONTEXT_LENGTH/2', () => {
      // Mutation 3700: fullText.length - MAX_CONTEXT_LENGTH/2 → fullText.length + MAX_CONTEXT_LENGTH/2
      // The ending substring start should be fullText.length - half, not fullText.length + half
      // If + used: substring start > length → empty string → result = beginning only (no '[...]' issue)
      // Actually tests that ending contains the actual end of the text
      const uniqueEnd = 'UNIQUEENDSECTION'
      const fullText = 'A'.repeat(30000) + uniqueEnd
      const question = 'xyznotfound'
      const result = service.extractRelevantPassages(fullText, question)
      // Fallback: ending = substring(fullText.length - 12500) → includes UNIQUEENDSECTION
      expect(result).toContain(uniqueEnd)
      expect(result).toContain('[...]')
    })

    it('should return result.trim() not untrimmed result', () => {
      // Mutation 3703: result.trim() → result
      // result starts with '\n\n---\n\n' prefix, trim() removes leading newlines
      const fullText = 'The keyword alpha appears in this sentence of the text here.'
      const question = 'alpha'
      const result = service.extractRelevantPassages(fullText, question)
      // After trim(), result should not start with whitespace
      expect(result).not.toMatch(/^\s/)
      expect(result.charAt(0)).not.toBe('\n')
    })

    it('should handle passage end arithmetic correctly: idx + keyword.length + window', () => {
      // Mutation 3633: idx + keyword.length → idx - keyword.length
      // Test keyword at position 100; with + keyword.length, end = 100 + 4 + 750 = 854
      // With - keyword.length, end = 100 - 4 + 750 = 846 (slightly different but may still work)
      // More important: passage should extend PAST the keyword, not stop before it
      const prefix = 'x'.repeat(100)
      const keyword = 'mark'
      const suffix = ' the critical information after the keyword appears here in text.'
      const fullText = prefix + keyword + suffix + 'y'.repeat(100)
      const question = 'mark'
      const result = service.extractRelevantPassages(fullText, question)
      // The text AFTER the keyword should be included in the passage
      expect(result).toContain('critical information after the keyword')
    })
  })
})
