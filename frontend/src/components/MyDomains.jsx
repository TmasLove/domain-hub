import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  ExternalLink,
  AlertTriangle,
  Edit2,
  Trash2,
  FolderOpen,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date();

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  return Math.floor((target - TODAY) / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function fmtPrice(price) {
  return `$${Number(price).toLocaleString("en-US")}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-4 flex flex-col gap-1 min-w-[140px]">
      <span className="text-gray-400 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-white text-2xl font-bold">{value}</span>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function MyDomains({ newDomains = [] }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // per-row UI state
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // filter / sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("domain-az");

  // ── fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data } = await axios.get("/api/domains/my-domains");
        setDomains(data.domains ?? data);
      } catch (err) {
        setError("Failed to load domains.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── merge newDomains prop (avoid duplicates) ────────────────────────────────
  useEffect(() => {
    if (!newDomains || newDomains.length === 0) return;
    setDomains((prev) => {
      const existing = new Set(prev.map((d) => d.domain));
      const fresh = newDomains.filter((d) => !existing.has(d.domain));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [newDomains]);

  // ── stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalDomains = domains.length;
    const forSale = domains.filter((d) => d.status === "For Sale").length;
    const totalInvested = domains.reduce((sum, d) => sum + Number(d.purchasePrice || 0), 0);
    const expiringSoon = domains.filter((d) => {
      const days = daysUntil(d.expiryDate);
      return days >= 0 && days <= 90;
    }).length;
    return { totalDomains, forSale, totalInvested, expiringSoon };
  }, [domains]);

  // ── filtered + sorted list ──────────────────────────────────────────────────
  const visible = useMemo(() => {
    let list = [...domains];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => d.domain.toLowerCase().includes(q));
    }

    if (statusFilter !== "All") {
      list = list.filter((d) => d.status === statusFilter);
    }

    if (sortBy === "domain-az") {
      list.sort((a, b) => a.domain.localeCompare(b.domain));
    } else if (sortBy === "expiry-soonest") {
      list.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => Number(b.purchasePrice) - Number(a.purchasePrice));
    }

    return list;
  }, [domains, search, statusFilter, sortBy]);

  // ── row action handlers ─────────────────────────────────────────────────────
  function handleStatusChange(domain, newStatus) {
    setDomains((prev) =>
      prev.map((d) => (d.domain === domain ? { ...d, status: newStatus } : d))
    );
  }

  function handleDelete(domain) {
    setDomains((prev) => prev.filter((d) => d.domain !== domain));
    setDeletingId(null);
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white p-6 font-sans">
      {/* heading */}
      <h1 className="text-2xl font-bold mb-6 tracking-tight">My Domains</h1>

      {/* ── stats row ── */}
      <div className="flex flex-wrap gap-4 mb-8">
        <StatCard label="Total Domains" value={stats.totalDomains} />
        <StatCard label="For Sale" value={stats.forSale} />
        <StatCard label="Total Invested" value={fmtPrice(stats.totalInvested)} />
        <StatCard label="Expiring Soon" value={stats.expiringSoon} />
      </div>

      {/* ── search / filter bar ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search domains…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2a2a4e] text-white text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:border-[#6c63ff] transition-colors w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2a2a4e] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#6c63ff] transition-colors"
        >
          <option>All</option>
          <option>For Sale</option>
          <option>Parked</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2a2a4e] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#6c63ff] transition-colors"
        >
          <option value="domain-az">Domain (A–Z)</option>
          <option value="expiry-soonest">Expiry (Soonest)</option>
          <option value="price-high">Price (High–Low)</option>
        </select>
      </div>

      {/* ── loading / error ── */}
      {loading && (
        <p className="text-gray-400 text-sm">Loading your domains…</p>
      )}
      {error && (
        <p className="text-[#ff4757] text-sm">{error}</p>
      )}

      {/* ── empty state ── */}
      {!loading && !error && domains.length === 0 && (
        <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl p-12 flex flex-col items-center gap-4 text-gray-400">
          <FolderOpen size={48} strokeWidth={1.5} />
          <p className="text-base">No domains in your portfolio yet</p>
        </div>
      )}

      {/* ── table ── */}
      {!loading && !error && domains.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#2a2a4e]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#0f0f1a] text-gray-400 uppercase text-xs">
                <th className="text-left px-5 py-3 font-medium tracking-wider">Domain</th>
                <th className="text-left px-5 py-3 font-medium tracking-wider">Purchase Price</th>
                <th className="text-left px-5 py-3 font-medium tracking-wider">Expiry Date</th>
                <th className="text-left px-5 py-3 font-medium tracking-wider">Status</th>
                <th className="text-left px-5 py-3 font-medium tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    No domains match your filters.
                  </td>
                </tr>
              ) : (
                visible.map((d, idx) => {
                  const days = daysUntil(d.expiryDate);
                  const expiringSoon30 = days >= 0 && days <= 30;
                  const rowBg = idx % 2 === 0 ? "bg-[#1a1a2e]" : "bg-[#161625]";
                  const isEditing = editingId === d.domain;
                  const isDeleting = deletingId === d.domain;

                  return (
                    <tr key={d.domain} className={`${rowBg} border-t border-[#2a2a4e] hover:brightness-110 transition-all`}>
                      {/* Domain */}
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium text-white">
                          {d.domain}
                          <button
                            aria-label="Open domain"
                            className="text-gray-500 hover:text-[#6c63ff] transition-colors"
                          >
                            <ExternalLink size={13} />
                          </button>
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="px-5 py-3 text-gray-200">
                        {fmtPrice(d.purchasePrice)}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-5 py-3">
                        {expiringSoon30 ? (
                          <span className="flex items-center gap-1 text-[#ff4757] font-medium">
                            <AlertTriangle size={13} />
                            {fmtDate(d.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-gray-200">{fmtDate(d.expiryDate)}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        {d.status === "For Sale" ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#6c63ff]/20 text-[#6c63ff] border border-[#6c63ff]/30">
                            For Sale
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700/40 text-gray-400 border border-gray-600/30">
                            Parked
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {/* Edit toggle */}
                          {isEditing ? (
                            <select
                              autoFocus
                              defaultValue={d.status}
                              onBlur={(e) => {
                                handleStatusChange(d.domain, e.target.value);
                                setEditingId(null);
                              }}
                              onChange={(e) => {
                                handleStatusChange(d.domain, e.target.value);
                                setEditingId(null);
                              }}
                              className="bg-[#0f0f1a] border border-[#6c63ff] text-white text-xs rounded px-2 py-1 focus:outline-none"
                            >
                              <option>Parked</option>
                              <option>For Sale</option>
                            </select>
                          ) : (
                            <button
                              onClick={() => {
                                setDeletingId(null);
                                setEditingId(d.domain);
                              }}
                              aria-label="Edit status"
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#6c63ff] hover:bg-[#6c63ff]/10 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {/* Delete toggle */}
                          {isDeleting ? (
                            <span className="flex items-center gap-1 text-xs">
                              <span className="text-gray-300">Delete?</span>
                              <button
                                onClick={() => handleDelete(d.domain)}
                                className="px-1.5 py-0.5 rounded bg-[#ff4757] text-white font-semibold hover:bg-[#ff6b78] transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-1.5 py-0.5 rounded bg-[#2a2a4e] text-gray-300 hover:bg-[#3a3a5e] transition-colors"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setDeletingId(d.domain);
                              }}
                              aria-label="Delete domain"
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#ff4757] hover:bg-[#ff4757]/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
