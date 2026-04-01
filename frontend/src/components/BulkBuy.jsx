import { useState } from "react";
import axios from "axios";
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
} from "lucide-react";

// ─── Step constants ────────────────────────────────────────────────────────────
const STEP_REVIEW = "review";
const STEP_PROCESSING = "processing";
const STEP_SUCCESS = "success";
const STEP_ERROR = "error";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4e]">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// ─── Step 1 — Review Order ─────────────────────────────────────────────────────
function StepReview({ selectedDomains, domainResults, totalCost, onConfirm, onCancel }) {
  const selectedList = domainResults.filter((d) => selectedDomains.has(d.domain));

  return (
    <>
      <ModalHeader title="Review Order" onClose={onCancel} />

      <div className="px-6 py-4">
        <p className="text-sm text-gray-400 mb-4">
          You are about to register{" "}
          <span className="text-white font-semibold">{selectedDomains.size}</span>{" "}
          domain{selectedDomains.size !== 1 ? "s" : ""} via Namecheap.
        </p>

        {/* Domain table */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a4e] mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f0f1a] text-gray-400 uppercase text-xs tracking-wider">
                <th className="text-left px-4 py-2">Domain</th>
                <th className="text-right px-4 py-2">Reg Cost</th>
              </tr>
            </thead>
            <tbody>
              {selectedList.map((d, i) => (
                <tr
                  key={d.domain}
                  className={`border-t border-[#2a2a4e] ${
                    i % 2 === 0 ? "bg-[#1a1a2e]" : "bg-[#16162a]"
                  }`}
                >
                  <td className="px-4 py-2 text-white font-mono text-xs">{d.domain}</td>
                  <td className="px-4 py-2 text-right text-[#6c63ff] font-semibold">
                    {formatUSD(d.regCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0f0f1a] border-t-2 border-[#6c63ff]/40">
                <td className="px-4 py-3 text-gray-300 font-semibold uppercase text-xs tracking-wider">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-white font-bold text-base">
                  {formatUSD(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Registration fees are charged immediately. Renewals are billed annually.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a4e] text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#6c63ff] hover:bg-[#5a52e0] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#6c63ff]/20"
          >
            Confirm &amp; Register
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Step 2 — Processing ───────────────────────────────────────────────────────
function StepProcessing() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[#6c63ff]/20 border-t-[#6c63ff] animate-spin" />
        <Loader2 className="absolute inset-0 m-auto text-[#6c63ff] opacity-0" size={24} />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-base mb-1">Registering domains…</p>
        <p className="text-gray-400 text-sm">Communicating with Namecheap API, please wait.</p>
      </div>
    </div>
  );
}

// ─── Step 3 — Success ─────────────────────────────────────────────────────────
function StepSuccess({ registeredDomains, onAddToMyDomains, onRegisterMore }) {
  return (
    <>
      <ModalHeader title="Registration Complete" onClose={onRegisterMore} />

      <div className="px-6 py-6">
        {/* Success icon + headline */}
        <div className="flex flex-col items-center mb-6">
          <CheckCircle2
            size={56}
            className="text-[#00d4aa] mb-3 animate-bounce"
            strokeWidth={1.5}
          />
          <p className="text-white font-bold text-xl">
            {registeredDomains.length} domain
            {registeredDomains.length !== 1 ? "s" : ""} registered!
          </p>
          <p className="text-gray-400 text-sm mt-1">All registrations were successful.</p>
        </div>

        {/* Registered domains list */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a4e] mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f0f1a] text-gray-400 uppercase text-xs tracking-wider">
                <th className="text-left px-4 py-2">Domain</th>
                <th className="text-right px-4 py-2">Expires</th>
              </tr>
            </thead>
            <tbody>
              {registeredDomains.map((d, i) => (
                <tr
                  key={d.domain}
                  className={`border-t border-[#2a2a4e] ${
                    i % 2 === 0 ? "bg-[#1a1a2e]" : "bg-[#16162a]"
                  }`}
                >
                  <td className="px-4 py-2 text-white font-mono text-xs">{d.domain}</td>
                  <td className="px-4 py-2 text-right text-[#00d4aa] text-xs">
                    {d.expiryDate ?? "1 year"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRegisterMore}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2a2a4e] text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium"
          >
            <RotateCcw size={14} />
            Register More
          </button>
          <button
            onClick={onAddToMyDomains}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00d4aa] hover:bg-[#00bfa0] text-[#0f0f1a] font-semibold text-sm transition-colors shadow-lg shadow-[#00d4aa]/20"
          >
            <PlusCircle size={14} />
            Add to My Domains
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Error state ───────────────────────────────────────────────────────────────
function StepError({ message, onRetry, onCancel }) {
  return (
    <>
      <ModalHeader title="Registration Failed" onClose={onCancel} />

      <div className="flex flex-col items-center px-6 py-10 gap-4">
        <XCircle size={52} className="text-[#ff4757]" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-white font-semibold text-base mb-1">Something went wrong</p>
          <p className="text-gray-400 text-sm max-w-xs">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </div>

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a4e] text-gray-300 hover:text-white hover:border-gray-500 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#ff4757] hover:bg-[#e03040] text-white font-semibold text-sm transition-colors"
          >
            <AlertTriangle size={14} />
            Try Again
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Summary Bar ───────────────────────────────────────────────────────────────
function SummaryBar({ count, totalCost, onClearSelection, onOpenCheckout }) {
  return (
    <div
      className="
        relative flex items-center justify-between gap-4
        px-5 py-4 rounded-2xl
        bg-[#1a1a2e]
        before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-r before:from-[#6c63ff]/30 before:via-[#00d4aa]/20 before:to-[#6c63ff]/30
        before:blur-sm before:-z-10
        border border-[#6c63ff]/40
        shadow-lg shadow-[#6c63ff]/10
      "
    >
      {/* Left: count + clear */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <ShoppingCart size={18} className="text-[#6c63ff]" />
          <span className="text-white font-semibold">
            {count} domain{count !== 1 ? "s" : ""} selected
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-xs text-gray-400 hover:text-[#ff4757] underline underline-offset-2 transition-colors whitespace-nowrap"
        >
          Clear selection
        </button>
      </div>

      {/* Right: total + action */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider leading-none mb-0.5">
            Total cost
          </p>
          <p className="text-white font-bold">{formatUSD(totalCost)}</p>
        </div>
        <button
          onClick={onOpenCheckout}
          disabled={count === 0}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#6c63ff] hover:bg-[#5a52e0]
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-semibold text-sm
            transition-colors shadow-lg shadow-[#6c63ff]/25
            whitespace-nowrap
          "
        >
          Bulk Register
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function BulkBuy({ selectedDomains, domainResults, onRegistered, onClearSelection }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(STEP_REVIEW);
  const [registeredDomains, setRegisteredDomains] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Derived totals
  const selectedList = (domainResults ?? []).filter((d) => selectedDomains?.has(d.domain));
  const totalCost = selectedList.reduce((sum, d) => sum + (d.regCost ?? 0), 0);
  const count = selectedDomains?.size ?? 0;

  // ── Open/close helpers ──
  function openCheckout() {
    setStep(STEP_REVIEW);
    setRegisteredDomains([]);
    setErrorMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (step === STEP_PROCESSING) return; // prevent dismiss during in-flight request
    setModalOpen(false);
  }

  // ── API call ──
  async function handleConfirm() {
    setStep(STEP_PROCESSING);
    try {
      const domains = [...(selectedDomains ?? [])];
      const { data } = await axios.post("/api/domains/register", { domains });
      // Expect data to be: { registeredDomains: [{ domain, expiryDate }] }
      const registered = data?.registered ?? domains.map((d) => ({ domain: d }));
      setRegisteredDomains(registered);
      setStep(STEP_SUCCESS);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "An unexpected error occurred.";
      setErrorMessage(msg);
      setStep(STEP_ERROR);
    }
  }

  // ── Post-success ──
  function handleAddToMyDomains() {
    onRegistered?.(registeredDomains);
    onClearSelection?.();
    setModalOpen(false);
  }

  function handleRegisterMore() {
    setModalOpen(false);
    onClearSelection?.();
  }

  // ── Retry ──
  function handleRetry() {
    setStep(STEP_REVIEW);
    setErrorMessage("");
  }

  // Don't render anything if nothing is selected
  if (!count) return null;

  return (
    <>
      {/* Summary bar — always visible when count > 0 */}
      <SummaryBar
        count={count}
        totalCost={totalCost}
        onClearSelection={() => onClearSelection?.()}
        onOpenCheckout={openCheckout}
      />

      {/* Modal */}
      {modalOpen && (
        <ModalOverlay onClose={closeModal}>
          {step === STEP_REVIEW && (
            <StepReview
              selectedDomains={selectedDomains}
              domainResults={domainResults}
              totalCost={totalCost}
              onConfirm={handleConfirm}
              onCancel={closeModal}
            />
          )}

          {step === STEP_PROCESSING && <StepProcessing />}

          {step === STEP_SUCCESS && (
            <StepSuccess
              registeredDomains={registeredDomains}
              onAddToMyDomains={handleAddToMyDomains}
              onRegisterMore={handleRegisterMore}
            />
          )}

          {step === STEP_ERROR && (
            <StepError
              message={errorMessage}
              onRetry={handleRetry}
              onCancel={closeModal}
            />
          )}
        </ModalOverlay>
      )}
    </>
  );
}
