require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// TLD registration costs
const TLD_COSTS = {
  '.com': 12,
  '.io': 30,
  '.ai': 50,
  '.xyz': 1,
  '.net': 12,
  '.co': 25,
};

// Trending tech term multipliers
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

// POST /api/domains/check
app.post('/api/domains/check', (req, res) => {
  try {
    const { keywords, tlds } = req.body;

    if (!Array.isArray(keywords) || !Array.isArray(tlds)) {
      return res.status(400).json({ error: 'keywords and tlds must be arrays' });
    }

    const results = [];

    for (const keyword of keywords) {
      for (const tld of tlds) {
        const normalizedTld = tld.startsWith('.') ? tld : `.${tld}`;
        const domain = `${keyword}${normalizedTld}`;
        const available = Math.random() < 0.7;
        const regCost = getRegCost(normalizedTld);
        const estValue = calculateEstValue(keyword, normalizedTld);
        const roi = `${((estValue - regCost) / regCost * 100).toFixed(1)}%`;

        results.push({
          domain,
          tld: normalizedTld,
          available,
          regCost,
          estValue,
          roi,
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('Error in /api/domains/check:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/domains/register
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

// GET /api/domains/my-domains
app.get('/api/domains/my-domains', (req, res) => {
  try {
    const domains = [
      { domain: 'aitools.io', purchasePrice: 30, expiryDate: '2026-08-15', status: 'For Sale' },
      { domain: 'web3hub.com', purchasePrice: 12, expiryDate: '2025-12-01', status: 'Parked' },
      { domain: 'saaslab.ai', purchasePrice: 50, expiryDate: '2027-03-20', status: 'For Sale' },
      { domain: 'devcloud.xyz', purchasePrice: 1, expiryDate: '2026-01-10', status: 'Parked' },
      { domain: 'gptapi.co', purchasePrice: 25, expiryDate: '2026-06-30', status: 'For Sale' },
    ];

    res.json({ domains });
  } catch (err) {
    console.error('Error in /api/domains/my-domains:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Domain Suite API running on http://localhost:${PORT}`);
});
