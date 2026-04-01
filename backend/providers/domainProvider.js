/**
 * Abstract base class for domain availability providers
 */
class DomainProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Check if a domain is available
   * @param {string} domain - Full domain name (e.g., "example.com")
   * @returns {Promise<{domain, available, confidence, provider, error}>}
   *   domain: the domain checked
   *   available: boolean (true if available)
   *   confidence: 0-1 (how confident is this result)
   *   provider: name of provider that returned this
   *   error: null if success, error message if failed
   */
  async checkAvailability(domain) {
    throw new Error('checkAvailability() must be implemented by subclass');
  }

  /**
   * Get the registration price for a domain
   * @param {string} domain - Full domain name
   * @returns {Promise<{domain, price, currency, provider, error}>}
   */
  async getPrice(domain) {
    throw new Error('getPrice() must be implemented by subclass');
  }

  /**
   * Check if this provider is enabled/available
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Safely call checkAvailability with error handling
   */
  async checkAvailabilitySafe(domain) {
    try {
      const result = await this.checkAvailability(domain);
      return {
        ...result,
        provider: this.name,
        error: null,
      };
    } catch (err) {
      return {
        domain,
        available: null,
        confidence: 0,
        provider: this.name,
        error: err.message,
      };
    }
  }

  /**
   * Safely call getPrice with error handling
   */
  async getPriceSafe(domain) {
    try {
      const result = await this.getPrice(domain);
      return {
        ...result,
        provider: this.name,
        error: null,
      };
    } catch (err) {
      return {
        domain,
        price: null,
        provider: this.name,
        error: err.message,
      };
    }
  }
}

module.exports = DomainProvider;
