const NamecheapProvider = require('./namecheapProvider');
const WhoisProvider = require('./whoisProvider');
const MockProvider = require('./mockProvider');
const Cache = require('../cache');

/**
 * Orchestrates multiple domain providers with fallback logic
 * Tries providers in order until one succeeds
 */
class ProviderManager {
  constructor() {
    this.providers = [];
    this.cache = new Cache(5 * 60 * 1000); // 5 minute TTL
    this.logger = console; // Can be replaced with a proper logger

    this._initializeProviders();
  }

  /**
   * Initialize all providers in priority order
   */
  _initializeProviders() {
    // Order matters: first enabled provider wins
    this.providers = [
      new NamecheapProvider(),   // Priority 1: Real API
      new WhoisProvider(),        // Priority 2: Free DNS lookup
      new MockProvider(),         // Priority 3: Demo fallback
    ];

    const enabledProviders = this.providers
      .filter((p) => p.isEnabled())
      .map((p) => p.name);

    this.logger.log(`[ProviderManager] Initialized with providers: ${enabledProviders.join(', ')}`);
  }

  /**
   * Check availability for multiple domains
   * Returns results with provider source
   */
  async checkMultiple(domains) {
    const results = [];

    for (const domain of domains) {
      const result = await this.checkOne(domain);
      results.push(result);
    }

    return results;
  }

  /**
   * Check a single domain using provider fallback
   */
  async checkOne(domain) {
    // Check cache first
    const cached = this.cache.get(`check:${domain}`);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Try each provider in order until one succeeds
    for (const provider of this.providers) {
      if (!provider.isEnabled()) {
        this.logger.debug(`[${provider.name}] Skipped (disabled)`);
        continue;
      }

      try {
        const result = await provider.checkAvailabilitySafe(domain);

        if (result.error) {
          this.logger.warn(`[${provider.name}] Error: ${result.error}`);
          continue; // Try next provider
        }

        // Success - cache and return
        this.cache.set(`check:${domain}`, result);
        this.logger.debug(`[${provider.name}] Success for ${domain} (available: ${result.available})`);
        return { ...result, fromCache: false };
      } catch (err) {
        this.logger.warn(`[${provider.name}] Exception: ${err.message}`);
        continue; // Try next provider
      }
    }

    // Should never reach here (MockProvider always succeeds)
    throw new Error('No providers available to check domain');
  }

  /**
   * Get price for a domain
   */
  async getPrice(domain) {
    const cacheKey = `price:${domain}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Try each provider until one succeeds
    for (const provider of this.providers) {
      if (!provider.isEnabled()) continue;

      try {
        const result = await provider.getPriceSafe(domain);

        if (!result.error) {
          this.cache.set(cacheKey, result);
          return result;
        }
      } catch (err) {
        // Continue to next provider
      }
    }

    throw new Error('Could not get price for domain');
  }

  /**
   * Get information about enabled providers
   */
  getStatus() {
    return {
      providers: this.providers.map((p) => ({
        name: p.name,
        enabled: p.isEnabled(),
      })),
      cacheSize: this.cache.size(),
      cacheTTL: '5 minutes',
    };
  }

  /**
   * Clear all cached results
   */
  clearCache() {
    this.cache.clear();
    this.logger.log('[ProviderManager] Cache cleared');
  }
}

module.exports = ProviderManager;
