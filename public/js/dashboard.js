(function () {
  "use strict";

  const STATUS_LABEL = {
    not_started: "Not started",
    request_sent: "Request sent",
    pending: "Pending",
    verified_removed: "Verified removed",
    reappeared: "Reappeared",
  };
  const STATUS_COLOR = {
    not_started: "text-steel",
    request_sent: "text-bone",
    pending: "text-bone",
    verified_removed: "text-verified",
    reappeared: "text-signal",
  };
  const STATUS_DOT = {
    not_started: "bg-steel",
    request_sent: "bg-bone",
    pending: "bg-bone",
    verified_removed: "bg-verified",
    reappeared: "bg-signal",
  };
  const METHOD_LABEL = {
    form: "Web form",
    email: "Email",
    call: "Phone call",
    drop: "State platform (DROP)",
  };

  let cases = [];
  let currentFilter = "all";
  let activeBrokerId = null;

  // ---------- Breach check ----------
  const breachForm = document.getElementById("breach-form");
  const breachSubmit = document.getElementById("breach-submit");
  const breachResult = document.getElementById("breach-result");
  const breachError = document.getElementById("breach-error");

  breachForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("breach-email").value.trim();
    breachError.classList.add("hidden");
    breachResult.classList.add("hidden");
    breachSubmit.disabled = true;
    breachSubmit.textContent = "Checking…";

    try {
      const res = await fetch("/api/breach-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Check failed.");

      renderBreachResult(data);
    } catch (err) {
      breachError.textContent = "⚠ " + err.message;
      breachError.classList.remove("hidden");
    } finally {
      breachSubmit.disabled = false;
      breachSubmit.textContent = "Run check →";
    }
  });

  function renderBreachResult(data) {
    breachResult.classList.remove("hidden");
    if (!data.breached) {
      breachResult.innerHTML = `
        <div class="flex items-center gap-2.5 font-mono text-sm text-verified mt-2">
          <span class="w-1.5 h-1.5 rounded-full bg-verified"></span>
          No known breaches found for this email.
        </div>`;
      return;
    }

    const rows = data.breaches
      .map(
        (b) => `
        <div class="flex justify-between items-start gap-3 py-2.5 border-b border-line text-sm">
          <div>
            <div class="text-bone font-medium">${escapeHtml(b.name)}</div>
            <div class="text-steel text-xs mt-0.5">${escapeHtml((b.dataClasses || []).join(", "))}</div>
          </div>
          <div class="font-mono text-xs text-steel whitespace-nowrap">${escapeHtml(b.breachDate || "")}</div>
        </div>`
      )
      .join("");

    breachResult.innerHTML = `
      <div class="flex items-center gap-2.5 font-mono text-sm text-signal mt-2 mb-3">
        <span class="w-1.5 h-1.5 rounded-full bg-signal"></span>
        Found in ${data.breaches.length} known breach${data.breaches.length === 1 ? "" : "es"}.
      </div>
      <div class="mt-1">${rows}</div>`;
  }

  // ---------- Profile identifiers ----------
  const identifierList = document.getElementById("identifiers-list");
  const identifierForm = document.getElementById("identifier-form");

  async function loadIdentifiers() {
    const res = await fetch("/api/profile/identifiers");
    const rows = await res.json();
    if (!rows.length) {
      identifierList.innerHTML = `<p class="text-sm text-steel font-mono">No identifiers added yet.</p>`;
      return;
    }
    identifierList.innerHTML = rows
      .map(
        (r) => `
        <div class="flex items-center justify-between gap-3 bg-void-soft border border-line px-4 py-2.5">
          <div class="flex items-center gap-3">
            <span class="tag-mono text-steel">${r.type}</span>
            <span class="text-sm text-bone">${escapeHtml(r.value)}</span>
          </div>
          <button data-id="${r.id}" class="remove-identifier text-steel hover:text-signal text-lg leading-none">×</button>
        </div>`
      )
      .join("");

    identifierList.querySelectorAll(".remove-identifier").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await fetch("/api/profile/identifiers/" + btn.dataset.id, { method: "DELETE" });
        loadIdentifiers();
      });
    });
  }

  identifierForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("identifier-type").value;
    const value = document.getElementById("identifier-value").value.trim();
    if (!value) return;
    await fetch("/api/profile/identifiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value }),
    });
    document.getElementById("identifier-value").value = "";
    loadIdentifiers();
  });

  // ---------- Broker case files ----------
  const brokerList = document.getElementById("broker-list");
  const filterBtns = document.querySelectorAll(".filter-btn");

  async function loadCases() {
    const res = await fetch("/api/cases");
    cases = await res.json();
    renderStats();
    renderBrokerList();
  }

  function renderStats() {
    const total = cases.length;
    const removed = cases.filter((c) => c.status === "verified_removed").length;
    const pending = cases.filter((c) => c.status === "pending" || c.status === "request_sent").length;
    const notStarted = cases.filter((c) => !c.status || c.status === "not_started").length;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-removed").textContent = removed;
    document.getElementById("stat-pending").textContent = pending;
    document.getElementById("stat-not-started").textContent = notStarted;
  }

  function renderBrokerList() {
    const filtered = cases.filter((c) => {
      const status = c.status || "not_started";
      if (currentFilter === "all") return true;
      return status === currentFilter;
    });

    if (!filtered.length) {
      brokerList.innerHTML = `<p class="text-sm text-steel font-mono py-6">No brokers match this filter.</p>`;
      return;
    }

    brokerList.innerHTML = filtered
      .map((c) => {
        const status = c.status || "not_started";
        return `
        <div class="case-row card flex items-center justify-between gap-4 p-4 sm:p-5 cursor-pointer hover:border-line-strong transition-colors" data-broker-id="${c.broker_id}">
          <div class="flex items-center gap-3 sm:gap-4 min-w-0">
            <span class="w-2 h-2 rounded-full ${STATUS_DOT[status]} flex-none"></span>
            <div class="min-w-0">
              <div class="text-bone font-medium text-sm sm:text-base truncate">${escapeHtml(c.name)}</div>
              <div class="text-steel text-xs font-mono truncate">${escapeHtml(c.category)} · ${METHOD_LABEL[c.opt_out_method] || c.opt_out_method}</div>
            </div>
          </div>
          <span class="status-pill ${STATUS_COLOR[status]} bg-void-soft flex-none">${STATUS_LABEL[status]}</span>
        </div>`;
      })
      .join("");

    brokerList.querySelectorAll(".case-row").forEach((row) => {
      row.addEventListener("click", () => openModal(Number(row.dataset.brokerId)));
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach((b) => {
        b.classList.remove("bg-bone", "text-void");
        b.classList.add("text-bone-dim");
      });
      btn.classList.add("bg-bone", "text-void");
      btn.classList.remove("text-bone-dim");
      renderBrokerList();
    });
  });

  // ---------- Modal ----------
  const modal = document.getElementById("case-modal");
  const modalClose = document.getElementById("modal-close");

  async function openModal(brokerId) {
    const c = cases.find((x) => x.broker_id === brokerId);
    if (!c) return;
    activeBrokerId = brokerId;

    document.getElementById("modal-category").textContent = c.category.toUpperCase();
    document.getElementById("modal-name").textContent = c.name;
    document.getElementById("modal-method").textContent =
      (METHOD_LABEL[c.opt_out_method] || c.opt_out_method) +
      (c.opt_out_email ? ` — ${c.opt_out_email}` : "");
    document.getElementById("modal-notes").textContent = c.process_notes || "—";
    document.getElementById("modal-response").textContent = c.avg_response_days
      ? `~${c.avg_response_days} days`
      : "Varies";
    document.getElementById("modal-reappears").textContent = c.reappears_days
      ? `~${c.reappears_days} days`
      : "N/A (state platform)";
    document.getElementById("modal-status").value = c.status || "not_started";
    document.getElementById("modal-source").textContent = c.source_url
      ? "Source: " + c.source_url
      : "";

    const visitLink = document.getElementById("modal-visit-link");
    visitLink.href = c.opt_out_url || "#";
    visitLink.classList.toggle("hidden", !c.opt_out_url);

    const sendBtn = document.getElementById("modal-send-email");
    sendBtn.classList.toggle("hidden", c.opt_out_method !== "email");

    // Fetch generated request text
    const textArea = document.getElementById("modal-request-text");
    textArea.value = "Loading…";
    try {
      const res = await fetch(`/api/cases/${brokerId}/request-text`);
      const data = await res.json();
      textArea.value = data.text || "Could not generate request text.";
    } catch {
      textArea.value = "Could not generate request text.";
    }

    modal.classList.remove("hidden");
  }

  modalClose.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  document.getElementById("modal-status").addEventListener("change", async (e) => {
    if (!activeBrokerId) return;
    await fetch(`/api/cases/${activeBrokerId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.target.value }),
    });
    loadCases();
  });

  document.getElementById("modal-copy").addEventListener("click", () => {
    const textArea = document.getElementById("modal-request-text");
    textArea.select();
    document.execCommand("copy");
  });

  document.getElementById("modal-send-email").addEventListener("click", async (e) => {
    if (!activeBrokerId) return;
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const res = await fetch(`/api/cases/${activeBrokerId}/send-email`, { method: "POST" });
      const data = await res.json();
      btn.textContent = data.sent ? "Sent ✓" : "Couldn't send — see reason below";
      if (!data.sent) {
        alert(data.reason || "Email could not be sent.");
      }
      loadCases();
    } finally {
      btn.disabled = false;
      setTimeout(() => (btn.textContent = "Send email now"), 2500);
    }
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  loadIdentifiers();
  loadCases();
})();
