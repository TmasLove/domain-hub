/**
 * Simple in-memory TTL cache
 */
class Cache {
  constructor(ttl = 5 * 60 * 1000) {
    this.ttl = ttl; // Time to live in milliseconds
    this.store = new Map();
  }

  /**
   * Get value from cache
   * Returns null if expired or not found
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get number of valid entries
   */
  size() {
    let count = 0;
    for (const [, entry] of this.store) {
      if (Date.now() <= entry.expiresAt) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

module.exports = Cache;
