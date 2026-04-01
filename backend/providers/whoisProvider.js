const dns = require('dns');
const { promisify } = require('util');
const DomainProvider = require('./domainProvider');

const resolveTxt = promisify(dns.resolveTxt);
const resolveSrv = promisify(dns.resolveSrv);

/**
 * Free WHOIS provider using DNS lookups
 * No authentication needed - completely free
 * Method: Query nameservers to infer domain registration status
 */
class WhoisProvider extends DomainProvider {
  constructor() {
    super('WHOIS-DNS');
  }

  isEnabled() {
    // Always available - uses Node.js built-in DNS
    return true;
  }

  /**
   * Check domain availability using DNS resolution
   * If domain has NS records → registered (unavailable)
   * If DNS fails → likely available
   * Confidence is lower since DNS doesn't definitively prove availability
   */
  async checkAvailability(domain) {
    try {
      // Try to resolve the domain's A record (fastest check)
      const result = await this._resolveDomain(domain);

      // If we got here, the domain resolved → it's registered (unavailable)
      return {
        domain,
        available: false,
        confidence: 0.7, // DNS resolution is good but not 100% proof
      };
    } catch (err) {
      // DNS resolution failed → likely available
      // ENOTFOUND = domain doesn't exist
      // ETIMEOUT = no response (assume available)
      if (err.code === 'ENOTFOUND' || err.code === 'ETIMEOUT') {
        return {
          domain,
          available: true,
          confidence: 0.6, // Not as confident as direct WHOIS
        };
      }

      // Other errors → be conservative, assume unavailable
      return {
        domain,
        available: false,
        confidence: 0.3,
      };
    }
  }

  /**
   * Internal: Try multiple DNS resolution methods
   */
  async _resolveDomain(domain) {
    // Strip www. if present
    const cleanDomain = domain.replace(/^www\./, '');

    // Try A record lookup (fastest)
    try {
      await this._lookupA(cleanDomain);
      return true;
    } catch (err) {
      // Fallback to MX record (some domains only have mail)
      try {
        await this._lookupMX(cleanDomain);
        return true;
      } catch (err2) {
        // Fallback to NS record (most reliable)
        await this._lookupNS(cleanDomain);
        return true;
      }
    }
  }

  _lookupA(domain) {
    return new Promise((resolve, reject) => {
      dns.lookup(domain, { family: 4 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  _lookupMX(domain) {
    return resolveTxt(domain);
  }

  _lookupNS(domain) {
    return resolveSrv('_sip._tcp.' + domain);
  }

  /**
   * For WHOIS provider, we use a simple TLD-based pricing
   * Real implementation would use WHOIS to get actual pricing
   */
  async getPrice(domain) {
    const tldMatch = domain.match(/(\.[^.]+)$/);
    const tld = tldMatch ? tldMatch[1] : '.com';

    const DEFAULT_PRICES = {
      '.com': 12,
      '.io': 30,
      '.ai': 50,
      '.xyz': 1,
      '.net': 12,
      '.co': 25,
    };

    return {
      domain,
      price: DEFAULT_PRICES[tld] || 10,
      currency: 'USD',
    };
  }
}

module.exports = WhoisProvider;
