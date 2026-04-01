import { useState } from 'react';
import axios from 'axios';
import { Loader2, Search } from 'lucide-react';

const TLDS = ['.com', '.io', '.ai', '.xyz', '.net', '.co'];

export function DomainGenerator({ onResults }) {
  const [keywords, setKeywords] = useState('');
  const [selectedTlds, setSelectedTlds] = useState(new Set(TLDS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function toggleTld(tld) {
    setSelectedTlds((prev) => {
      const next = new Set(prev);
      if (next.has(tld)) {
        next.delete(tld);
      } else {
        next.add(tld);
      }
      return next;
    });
  }

  async function handleAnalyze() {
    const kwList = keywords
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);

    if (kwList.length === 0) {
      setError('Please enter at least one keyword.');
      return;
    }

    if (selectedTlds.size === 0) {
      setError('Please select at least one TLD.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data } = await axios.post('/api/domains/check', {
        keywords: kwList,
        tlds: Array.from(selectedTlds),
      });
      onResults(data.results);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch domain data. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search size={18} className="text-[#6c63ff]" />
        <h2 className="text-white font-semibold text-lg">Domain Analyzer</h2>
      </div>

      {/* Keywords textarea */}
      <div className="space-y-1.5">
        <label className="text-gray-400 text-xs uppercase tracking-wider">
          Keywords
        </label>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter keywords, one per line..."
          style={{ minHeight: '120px' }}
          className="w-full bg-[#0f0f1a] border border-[#2a2a4e] text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:border-[#6c63ff] transition-colors"
        />
      </div>

      {/* TLD toggles */}
      <div className="space-y-2">
        <label className="text-gray-400 text-xs uppercase tracking-wider">
          TLDs
        </label>
        <div className="flex flex-wrap gap-2">
          {TLDS.map((tld) => {
            const active = selectedTlds.has(tld);
            return (
              <button
                key={tld}
                type="button"
                onClick={() => toggleTld(tld)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                    : 'bg-transparent border-[#2a2a4e] text-gray-400 hover:border-[#6c63ff] hover:text-white'
                }`}
              >
                {tld}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 text-[#ff4757] text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#6c63ff] to-[#a855f7] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Scanning domains...
          </>
        ) : (
          'Analyze Domains'
        )}
      </button>
    </div>
  );
}

export default DomainGenerator;
