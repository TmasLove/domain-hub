const DomainProvider = require('./domainProvider');

/**
 * Mock provider - returns demo data
 * Used when no real providers are available
 */
class MockProvider extends DomainProvider {
  constructor() {
    super('Mock');
  }

  isEnabled() {
    return true; // Always available as fallback
  }

  /**
   * Return mock availability (70% available)
   */
  async checkAvailability(domain) {
    // Pseudo-random but deterministic based on domain
    const hash = this._simpleHash(domain);
    const available = hash % 10 < 7; // 70% available

    return {
      domain,
      available,
      confidence: 0.3, // Low confidence - it's mock data
    };
  }

  /**
   * Return mock price based on TLD
   */
  async getPrice(domain) {
    const tldMatch = domain.match(/(\.[^.]+)$/);
    const tld = tldMatch ? tldMatch[1] : '.com';

    const TLD_COSTS = {
      '.com': 12,
      '.io': 30,
      '.ai': 50,
      '.xyz': 1,
      '.net': 12,
      '.co': 25,
    };

    return {
      domain,
      price: TLD_COSTS[tld] || 10,
      currency: 'USD',
    };
  }

  /**
   * Simple hash function for deterministic results
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = MockProvider;
