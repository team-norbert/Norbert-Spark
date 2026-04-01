import { describe, expect, it } from 'vitest'

import { HEART_OF_DARKNESS_MAPPINGS } from '../../../src/application/services/domain-keyword-mapping.config.js'

describe('HEART_OF_DARKNESS_MAPPINGS', () => {
  it('should have domain set to heart-of-darkness', () => {
    expect(HEART_OF_DARKNESS_MAPPINGS.domain).toBe('heart-of-darkness')
  })

  it('should have exactly 7 rules', () => {
    expect(HEART_OF_DARKNESS_MAPPINGS.rules).toHaveLength(7)
  })

  it('should have a non-empty rules array', () => {
    expect(HEART_OF_DARKNESS_MAPPINGS.rules.length).toBeGreaterThan(0)
  })

  describe('river rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('river'))!

    it('should have triggers containing river', () => {
      expect(rule().triggers).toContain('river')
    })

    it('should have exactly 1 trigger', () => {
      expect(rule().triggers).toHaveLength(1)
    })

    it('should have keywords containing thames', () => {
      expect(rule().keywords).toContain('thames')
    })

    it('should have keywords containing congo', () => {
      expect(rule().keywords).toContain('congo')
    })

    it('should have keywords containing river', () => {
      expect(rule().keywords).toContain('river')
    })

    it('should have keywords containing water', () => {
      expect(rule().keywords).toContain('water')
    })

    it('should have exactly 4 keywords', () => {
      expect(rule().keywords).toHaveLength(4)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('position/hired rule', () => {
    const rule = () =>
      HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('position'))!

    it('should have triggers containing position', () => {
      expect(rule().triggers).toContain('position')
    })

    it('should have triggers containing hired', () => {
      expect(rule().triggers).toContain('hired')
    })

    it('should have exactly 2 triggers', () => {
      expect(rule().triggers).toHaveLength(2)
    })

    it('should have keywords containing captain', () => {
      expect(rule().keywords).toContain('captain')
    })

    it('should have keywords containing steamboat', () => {
      expect(rule().keywords).toContain('steamboat')
    })

    it('should have keywords containing command', () => {
      expect(rule().keywords).toContain('command')
    })

    it('should have keywords containing skipper', () => {
      expect(rule().keywords).toContain('skipper')
    })

    it('should have keywords containing appointed', () => {
      expect(rule().keywords).toContain('appointed')
    })

    it('should have exactly 5 keywords', () => {
      expect(rule().keywords).toHaveLength(5)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('kurtz rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('kurtz'))!

    it('should have triggers containing kurtz', () => {
      expect(rule().triggers).toContain('kurtz')
    })

    it('should have exactly 1 trigger', () => {
      expect(rule().triggers).toHaveLength(1)
    })

    it('should have keywords containing kurtz', () => {
      expect(rule().keywords).toContain('kurtz')
    })

    it('should have keywords containing ivory', () => {
      expect(rule().keywords).toContain('ivory')
    })

    it('should have keywords containing station', () => {
      expect(rule().keywords).toContain('station')
    })

    it('should have keywords containing agent', () => {
      expect(rule().keywords).toContain('agent')
    })

    it('should have exactly 4 keywords', () => {
      expect(rule().keywords).toHaveLength(4)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('death/words rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('death'))!

    it('should have triggers containing death', () => {
      expect(rule().triggers).toContain('death')
    })

    it('should have triggers containing words', () => {
      expect(rule().triggers).toContain('words')
    })

    it('should have exactly 2 triggers', () => {
      expect(rule().triggers).toHaveLength(2)
    })

    it('should have keywords containing horror', () => {
      expect(rule().keywords).toContain('horror')
    })

    it('should have keywords containing died', () => {
      expect(rule().keywords).toContain('died')
    })

    it('should have keywords containing death', () => {
      expect(rule().keywords).toContain('death')
    })

    it('should have keywords containing last', () => {
      expect(rule().keywords).toContain('last')
    })

    it('should have keywords containing whispered', () => {
      expect(rule().keywords).toContain('whispered')
    })

    it('should have exactly 5 keywords', () => {
      expect(rule().keywords).toHaveLength(5)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('attack rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('attack'))!

    it('should have triggers containing attack', () => {
      expect(rule().triggers).toContain('attack')
    })

    it('should have exactly 1 trigger', () => {
      expect(rule().triggers).toHaveLength(1)
    })

    it('should have keywords containing arrows', () => {
      expect(rule().keywords).toContain('arrows')
    })

    it('should have keywords containing natives', () => {
      expect(rule().keywords).toContain('natives')
    })

    it('should have keywords containing spears', () => {
      expect(rule().keywords).toContain('spears')
    })

    it('should have keywords containing attack', () => {
      expect(rule().keywords).toContain('attack')
    })

    it('should have keywords containing savages', () => {
      expect(rule().keywords).toContain('savages')
    })

    it('should have exactly 5 keywords', () => {
      expect(rule().keywords).toHaveLength(5)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('repair/steamboat rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('repair'))!

    it('should have triggers containing repair', () => {
      expect(rule().triggers).toContain('repair')
    })

    it('should have triggers containing steamboat', () => {
      expect(rule().triggers).toContain('steamboat')
    })

    it('should have exactly 2 triggers', () => {
      expect(rule().triggers).toHaveLength(2)
    })

    it('should have keywords containing rivets', () => {
      expect(rule().keywords).toContain('rivets')
    })

    it('should have keywords containing repair', () => {
      expect(rule().keywords).toContain('repair')
    })

    it('should have keywords containing boiler', () => {
      expect(rule().keywords).toContain('boiler')
    })

    it('should have keywords containing steam', () => {
      expect(rule().keywords).toContain('steam')
    })

    it('should have keywords containing wreck', () => {
      expect(rule().keywords).toContain('wreck')
    })

    it('should have exactly 5 keywords', () => {
      expect(rule().keywords).toHaveLength(5)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })

  describe('poles/station rule', () => {
    const rule = () => HEART_OF_DARKNESS_MAPPINGS.rules.find((r) => r.triggers.includes('poles'))!

    it('should have triggers containing poles', () => {
      expect(rule().triggers).toContain('poles')
    })

    it('should have triggers containing station', () => {
      expect(rule().triggers).toContain('station')
    })

    it('should have exactly 2 triggers', () => {
      expect(rule().triggers).toHaveLength(2)
    })

    it('should have keywords containing heads', () => {
      expect(rule().keywords).toContain('heads')
    })

    it('should have keywords containing skulls', () => {
      expect(rule().keywords).toContain('skulls')
    })

    it('should have keywords containing poles', () => {
      expect(rule().keywords).toContain('poles')
    })

    it('should have keywords containing ornamental', () => {
      expect(rule().keywords).toContain('ornamental')
    })

    it('should have exactly 4 keywords', () => {
      expect(rule().keywords).toHaveLength(4)
    })

    it('should have non-empty triggers array', () => {
      expect(rule().triggers.length).toBeGreaterThan(0)
    })

    it('should have non-empty keywords array', () => {
      expect(rule().keywords.length).toBeGreaterThan(0)
    })
  })
})
