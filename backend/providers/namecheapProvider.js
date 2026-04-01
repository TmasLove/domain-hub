const axios = require('axios');
const DomainProvider = require('./domainProvider');

/**
 * Namecheap API provider for real domain checking and registration
 * Docs: https://www.namecheap.com/support/api/
 */
class NamecheapProvider extends DomainProvider {
  constructor() {
    super('Namecheap');
    this.apiKey = process.env.NAMECHEAP_API_KEY;
    this.userName = process.env.NAMECHEAP_USER;
    this.apiUrl = 'https://api.namecheap.com/xml.response';
  }

  isEnabled() {
    return !!(this.apiKey && this.userName);
  }

  /**
   * Check domain availability via Namecheap API
   */
  async checkAvailability(domain) {
    if (!this.isEnabled()) {
      throw new Error('Namecheap API credentials not configured');
    }

    try {
      const params = {
        ApiUser: this.userName,
        ApiKey: this.apiKey,
        UserName: this.userName,
        Command: 'namecheap.domains.check',
        DomainList: domain,
        ClientIp: '127.0.0.1', // Required by Namecheap
      };

      const response = await axios.get(this.apiUrl, { params, timeout: 10000 });

      // Parse XML response (Namecheap returns XML)
      // Format: <DomainCheckResult Domain="..." Available="True|False" ... />
      const xmlText = response.data;
      const availableMatch = xmlText.match(/Available="(True|False)"/i);

      if (!availableMatch) {
        throw new Error('Could not parse Namecheap response');
      }

      const available = availableMatch[1].toLowerCase() === 'true';

      return {
        domain,
        available,
        confidence: 0.95, // Namecheap is authoritative
      };
    } catch (err) {
      if (err.response?.status === 400) {
        // Invalid domain format
        return { domain, available: false, confidence: 0.8 };
      }
      throw new Error(`Namecheap API error: ${err.message}`);
    }
  }

  /**
   * Get domain price from Namecheap
   */
  async getPrice(domain) {
    if (!this.isEnabled()) {
      throw new Error('Namecheap API credentials not configured');
    }

    try {
      // Extract TLD
      const tldMatch = domain.match(/(\.[^.]+)$/);
      const tld = tldMatch ? tldMatch[1] : '.com';

      const params = {
        ApiUser: this.userName,
        ApiKey: this.apiKey,
        UserName: this.userName,
        Command: 'namecheap.domains.getTldList',
        ClientIp: '127.0.0.1',
      };

      const response = await axios.get(this.apiUrl, { params, timeout: 10000 });

      // Parse XML for pricing info
      // This is simplified - real implementation would parse full pricing
      const xmlText = response.data;
      const priceMatch = xmlText.match(new RegExp(`<Tld name="${tld.replace('.', '')}"[^>]*>.*?<Registration>([\\d.]+)<`, 'i'));

      if (priceMatch) {
        return {
          domain,
          price: parseFloat(priceMatch[1]),
          currency: 'USD',
        };
      }

      // Fallback to standard TLD costs if parsing fails
      const DEFAULT_PRICES = {
        '.com': 8.88,
        '.io': 48.00,
        '.ai': 60.00,
        '.xyz': 1.00,
        '.net': 8.88,
        '.co': 19.95,
      };

      return {
        domain,
        price: DEFAULT_PRICES[tld] || 10,
        currency: 'USD',
      };
    } catch (err) {
      throw new Error(`Namecheap price lookup failed: ${err.message}`);
    }
  }
}

module.exports = NamecheapProvider;
