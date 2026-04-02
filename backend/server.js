require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ProviderManager = require('./providers/providerManager');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize provider manager for domain checking
const providerManager = new ProviderManager();

// TLD registration costs (used by providers as default)
const TLD_COSTS = {
  '.com': 12,
  '.io': 30,
  '.ai': 50,
  '.xyz': 1,
  '.net': 12,
  '.co': 25,
};

// Trending tech term multipliers (for mock provider)
const TECH_TERMS = [
  { terms: ['ai', 'gpt', 'llm'], multiplier: 4 },
  { terms: ['web3', 'nft', 'crypto', 'defi'], multiplier: 3 },
  { terms: ['saas', 'cloud', 'api', 'dev'], multiplier: 2 },
  { terms: ['app', 'hub', 'lab', 'io'], multiplier: 1.5 },
];

function getRegCost(tld) {
  return TLD_COSTS[tld] ?? 10;
}

function getLengthMultiplier(keyword) {
  const len = keyword.length;
  if (len <= 4) return 8;
  if (len <= 6) return 5;
  if (len <= 9) return 3;
  return 1.5;
}

function getTechMultiplier(keyword) {
  const lower = keyword.toLowerCase();
  let multiplier = 1;
  for (const { terms, multiplier: m } of TECH_TERMS) {
    for (const term of terms) {
      if (lower.includes(term)) {
        multiplier = Math.max(multiplier, m);
      }
    }
  }
  return multiplier;
}

function calculateEstValue(keyword, tld) {
  const regCost = getRegCost(tld);
  const base = regCost * 3;
  const lengthMult = getLengthMultiplier(keyword);
  const techMult = getTechMultiplier(keyword);
  return Math.round(base * lengthMult * techMult);
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/domains/check
// Check domain availability using configured providers
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/domains/check', async (req, res) => {
  try {
    const { keywords, tlds } = req.body;

    if (!Array.isArray(keywords) || !Array.isArray(tlds)) {
      return res
        .status(400)
        .json({ error: 'keywords and tlds must be arrays' });
    }

    const results = [];

    // Build list of domains to check
    const domainList = [];
    for (const keyword of keywords) {
      for (const tld of tlds) {
        const normalizedTld = tld.startsWith('.') ? tld : `.${tld}`;
        const domain = `${keyword}${normalizedTld}`;
        domainList.push({
          domain,
          keyword,
          tld: normalizedTld,
        });
      }
    }

    // Check availability using provider manager
    for (const item of domainList) {
      try {
        const providerResult = await providerManager.checkOne(item.domain);
        const priceResult = await providerManager.getPrice(item.domain);

        const regCost = getRegCost(item.tld);
        const estValue = calculateEstValue(item.keyword, item.tld);
        const roi = `${((estValue - regCost) / regCost * 100).toFixed(1)}%`;

        results.push({
          domain: item.domain,
          tld: item.tld,
          available: providerResult.available ?? false,
          regCost,
          estValue,
          roi,
          provider: providerResult.provider,
          confidence: providerResult.confidence,
          fromCache: providerResult.fromCache,
        });
      } catch (err) {
        console.error(`Error checking ${item.domain}:`, err.message);
        // Add error result but continue with other domains
        results.push({
          domain: item.domain,
          tld: item.tld,
          available: false,
          regCost: getRegCost(item.tld),
          estValue: calculateEstValue(item.keyword, item.tld),
          roi: '0%',
          provider: 'Error',
          error: err.message,
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('Error in /api/domains/check:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/domains/register
// Register domains (mock or real via Namecheap if configured)
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/domains/register', (req, res) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains)) {
      return res.status(400).json({ error: 'domains must be an array' });
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiryDateISO = expiryDate.toISOString();

    const registered = domains.map((domain) => {
      const tldMatch = domain.match(/(\.[^.]+)$/);
      const tld = tldMatch ? tldMatch[1] : '.com';
      const purchasePrice = getRegCost(tld);

      return {
        domain,
        status: 'registered',
        expiryDate: expiryDateISO,
        purchasePrice,
      };
    });

    res.json({
      success: true,
      registered,
      failed: [],
    });
  } catch (err) {
    console.error('Error in /api/domains/register:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/domains/my-domains
// Get user's domain portfolio
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/domains/my-domains', (req, res) => {
  try {
    const domains = [
      {
        domain: 'aitools.io',
        purchasePrice: 30,
        expiryDate: '2026-08-15',
        status: 'For Sale',
      },
      {
        domain: 'web3hub.com',
        purchasePrice: 12,
        expiryDate: '2025-12-01',
        status: 'Parked',
      },
      {
        domain: 'saaslab.ai',
        purchasePrice: 50,
        expiryDate: '2027-03-20',
        status: 'For Sale',
      },
      {
        domain: 'devcloud.xyz',
        purchasePrice: 1,
        expiryDate: '2026-01-10',
        status: 'Parked',
      },
      {
        domain: 'gptapi.co',
        purchasePrice: 25,
        expiryDate: '2026-06-30',
        status: 'For Sale',
      },
    ];

    res.json({ domains });
  } catch (err) {
    console.error('Error in /api/domains/my-domains:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/domains/providers
// Get information about active domain checking providers
// ═══════════════════════════════════════════════════════════════════════════
app.get('/api/domains/providers', (req, res) => {
  try {
    const status = providerManager.getStatus();
    res.json(status);
  } catch (err) {
    console.error('Error in /api/domains/providers:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/domains/cache/clear
// Clear all cached domain check results
// ═══════════════════════════════════════════════════════════════════════════
app.post('/api/domains/cache/clear', (req, res) => {
  try {
    providerManager.clearCache();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (err) {
    console.error('Error clearing cache:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Start Server (only when run directly, not as serverless function)
// ═══════════════════════════════════════════════════════════════════════════
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Domain Suite API running on http://localhost:${PORT}`);
    console.log(`📋 Provider status: GET /api/domains/providers`);
    console.log(`🔄 Clear cache: POST /api/domains/cache/clear`);
  });
}

module.exports = app;
