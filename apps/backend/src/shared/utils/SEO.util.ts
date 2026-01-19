export class SEO {
  private static readonly unnecessaryWords = new Set([
      // Articles
      'a', 'an', 'the',

      // Conjunctions
      'and', 'or', 'but', 'nor', 'yet', 'so',

      // Prepositions
      'of', 'in', 'on', 'at', 'to', 'from', 'by', 'for', 'with',
      'about', 'against', 'between', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'over', 'under',
      'within', 'without',

      // Pronouns
      'i', 'me', 'my', 'mine',
      'we', 'us', 'our', 'ours',
      'you', 'your', 'yours',
      'he', 'him', 'his',
      'she', 'her', 'hers',
      'it', 'its',
      'they', 'them', 'their', 'theirs',

      // Auxiliary / linking verbs
      'am', 'is', 'are', 'was', 'were',
      'be', 'been', 'being',
      'have', 'has', 'had',
      'do', 'does', 'did',

      // Low-value modifiers
      'very', 'really', 'quite', 'just', 'only',
      'even', 'almost', 'mostly', 'maybe',

      // Common fillers
      'this', 'that', 'these', 'those',
      'there', 'here', 'when', 'where', 'why', 'how'
    ])

  static removeUnnecessaryWords(title: string): string {
      return title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => !SEO.unnecessaryWords.has(word))
        .join(' ')
    }

  static generateSeoFriendlyTitle(title: string): string {
      const cleanedTitle = SEO.removeUnnecessaryWords(title)
      return cleanedTitle.split(/\s+/).filter(word => word.length > 0).join('-')
  }
}