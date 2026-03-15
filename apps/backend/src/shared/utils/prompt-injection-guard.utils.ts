export type PromptRiskDecision = 'allow' | 'flag' | 'block'

export interface PromptRiskAssessment {
  score: number
  decision: PromptRiskDecision
  reasons: string[]
  normalizedText: string
}

export class PromptInjectionGuard {
  assess(input: string): PromptRiskAssessment {
    const normalized = normalizePrompt(input)

    let score = 0
    const reasons: string[] = []

    const checks: Array<[RegExp, number, string]> = [
      [/\bignore (all|any|previous|prior) instructions?\b/i, 4, 'instruction-override'],
      [/\byou are now\b/i, 3, 'role-reassignment'],
      [/\b(role\s*:\s*system|<system>|\[system\])\b/i, 5, 'system-role-spoofing'],
      [
        /\b(reveal|show|print|dump).{0,40}\b(system prompt|hidden prompt|developer message|internal instructions?)\b/i,
        6,
        'prompt-exfiltration',
      ],
      [/\b(do not mention|without telling me|hidden rules?)\b/i, 2, 'concealment-language'],
      [/\b(base64|decode this|hex decode|rot13)\b/i, 2, 'obfuscation-indicator'],
    ]

    for (const [pattern, points, reason] of checks) {
      if (pattern.test(normalized)) {
        score += points
        reasons.push(reason)
      }
    }

    const decision: PromptRiskDecision = score >= 8 ? 'block' : score >= 4 ? 'flag' : 'allow'

    return {
      score,
      decision,
      reasons,
      normalizedText: normalized,
    }
  }
}

function normalizePrompt(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
