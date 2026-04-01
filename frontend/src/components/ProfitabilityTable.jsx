import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, PlusCircle } from 'lucide-react';

function formatCurrency(value) {
  if (value == null) return '—';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function RoiBadge({ roi }) {
  const num = parseFloat(roi);
  if (isNaN(num)) return <span className="text-gray-500">—</span>;

  let colorClass;
  if (num > 200) colorClass = 'text-[#00d4aa]';
  else if (num >= 50) colorClass = 'text-yellow-400';
  else colorClass = 'text-[#ff4757]';

  return <span className={`font-medium ${colorClass}`}>{roi}</span>;
}

function AvailabilityBadge({ available }) {
  if (available) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20">
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20">
      Taken
    </span>
  );
}

const COLUMNS = [
  { key: 'domain', label: 'Domain', sortable: true },
  { key: 'available', label: 'Available', sortable: false },
  { key: 'regCost', label: 'Reg Cost', sortable: false },
  { key: 'estValue', label: 'Est. Value', sortable: true },
  { key: 'roi', label: 'ROI', sortable: false },
  { key: 'action', label: 'Action', sortable: false },
];

function SortIcon({ column, sortKey, sortDir }) {
  if (column !== sortKey) return <ChevronsUpDown size={12} className="ml-1 opacity-40 inline" />;
  if (sortDir === 'asc') return <ChevronUp size={12} className="ml-1 text-[#6c63ff] inline" />;
  return <ChevronDown size={12} className="ml-1 text-[#6c63ff] inline" />;
}

export function ProfitabilityTable({ results = [], selectedDomains, onSelectionChange }) {
  const [sortKey, setSortKey] = useState('estValue');
  const [sortDir, setSortDir] = useState('desc');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filtered = useMemo(() => {
    return showOnlyAvailable ? results.filter((r) => r.available) : results;
  }, [results, showOnlyAvailable]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'estValue' || sortKey === 'regCost') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal ?? '').toLowerCase();
        bVal = String(bVal ?? '').toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Empty state
  if (!results || results.length === 0) {
    return (
      <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-10 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#0f0f1a] flex items-center justify-center">
          <ChevronsUpDown size={22} className="text-gray-600" />
        </div>
        <p className="text-gray-500 text-sm text-center">
          Run an analysis to see domain opportunities
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-[#2a2a4e] flex items-center justify-between flex-wrap gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            className="w-4 h-4 accent-[#6c63ff] cursor-pointer"
          />
          <span className="text-gray-300 text-sm">Show Only Available</span>
        </label>
        <span className="text-xs text-gray-500">
          Showing{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#6c63ff]/10 text-[#6c63ff] font-medium border border-[#6c63ff]/20">
            {sorted.length}
          </span>{' '}
          of <span className="text-gray-400 font-medium">{results.length}</span> domains
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f0f1a]">
              {/* Checkbox column */}
              <th className="px-4 py-3 w-10" />
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-4 py-3 text-left text-gray-400 uppercase text-xs tracking-wider whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                  }`}
                >
                  {col.label}
                  {col.sortable && (
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const isSelected = selectedDomains?.has(row.domain);
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={row.domain}
                  className={`border-t border-[#2a2a4e] transition-colors hover:bg-[#6c63ff]/5 ${
                    isEven ? 'bg-[#1a1a2e]' : 'bg-[#161625]'
                  }`}
                >
                  {/* Row checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!isSelected}
                      onChange={(e) => onSelectionChange?.(row.domain, e.target.checked)}
                      className="w-4 h-4 accent-[#6c63ff] cursor-pointer"
                    />
                  </td>

                  {/* Domain */}
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                    {row.domain}
                  </td>

                  {/* Available */}
                  <td className="px-4 py-3">
                    <AvailabilityBadge available={row.available} />
                  </td>

                  {/* Reg Cost */}
                  <td className="px-4 py-3 text-gray-300">
                    {formatCurrency(row.regCost)}
                  </td>

                  {/* Est. Value */}
                  <td className="px-4 py-3 text-gray-300 font-medium">
                    {formatCurrency(row.estValue)}
                  </td>

                  {/* ROI */}
                  <td className="px-4 py-3">
                    <RoiBadge roi={row.roi} />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectionChange?.(row.domain, true)}
                      disabled={!!isSelected}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[#6c63ff]/10 text-[#6c63ff] border border-[#6c63ff]/20 hover:bg-[#6c63ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <PlusCircle size={12} />
                      Add
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfitabilityTable;
