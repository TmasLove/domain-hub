import { useState } from 'react';
import { Globe } from 'lucide-react';
import { DomainGenerator } from './components/DomainGenerator';
import { ProfitabilityTable } from './components/ProfitabilityTable';
import { BulkBuy } from './components/BulkBuy';
import { MyDomains } from './components/MyDomains';

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [domainResults, setDomainResults] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState(new Set());
  const [registeredDomains, setRegisteredDomains] = useState([]);

  function handleResults(results) {
    setDomainResults(results);
    setSelectedDomains(new Set());
  }

  function handleSelectionChange(domain, checked) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(domain);
      } else {
        next.delete(domain);
      }
      return next;
    });
  }

  function handleRegistered(domains) {
    setRegisteredDomains((prev) => [...prev, ...domains]);
    setActiveTab('my-domains');
  }

  function handleClearSelection() {
    setSelectedDomains(new Set());
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="bg-[#0f0f1a] border-b border-[#2a2a4e] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Globe className="text-[#6c63ff]" size={28} />
            <div>
              <div className="text-xl font-bold text-white">DomainSuite</div>
              <div className="text-xs text-gray-500">Domain Flipping &amp; Management</div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-end gap-6">
            <button
              onClick={() => setActiveTab('discover')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'text-white border-b-2 border-[#6c63ff]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('my-domains')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'my-domains'
                  ? 'text-white border-b-2 border-[#6c63ff]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              My Domains
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activeTab === 'discover' && (
          <>
            {/* Hero area */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a3e] via-[#16163a] to-[#0f0f1a] border border-[#2a2a4e] px-8 py-10">
              <h1 className="text-3xl font-bold text-white mb-2">
                Find your next profitable domain
              </h1>
              <p className="text-gray-400 text-sm">
                Generate AI-powered domain ideas, analyze profitability, and register in bulk — all in one place.
              </p>
            </div>

            {/* Domain generator */}
            <DomainGenerator onResults={handleResults} />

            {/* Bulk buy summary bar — only shown when there is a selection */}
            {selectedDomains.size > 0 && (
              <BulkBuy
                selectedDomains={selectedDomains}
                domainResults={domainResults}
                onRegistered={handleRegistered}
                onClearSelection={handleClearSelection}
              />
            )}

            {/* Results table */}
            <ProfitabilityTable
              results={domainResults}
              selectedDomains={selectedDomains}
              onSelectionChange={handleSelectionChange}
            />
          </>
        )}

        {activeTab === 'my-domains' && (
          <MyDomains newDomains={registeredDomains} />
        )}
      </main>
    </div>
  );
}
