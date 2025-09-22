// ---- helpers ----
const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

// Build a compact items list for mobile (only show qty > 0)
function buildPreorderItemsList(row) {
  const items = [
    ["Poinsettia", row.poinsettia],
    ["8” Centrepiece", row.centrepiece],
    ["Wreath", row.wreath],
    ["Candy Cane", row.candyCane],
    ["Butter Chicken", row.butterChicken],
    ["Butter Chickpea", row.butterChickpea],
  ];
  return (
    items
      .filter(([, qty]) => (qty || 0) > 0)
      .map(
        ([name, qty]) =>
          `<div class="item"><div class="content">${name} × ${qty}</div></div>`
      )
      .join("") || `<div class="item"><div class="content">No items</div></div>`
  );
}

// -------- Preorders --------
async function loadPreorders() {
  const res = await fetch("/api/data/preorder");
  const data = await res.json();

  // desktop table
  const tbody = $("#preorder-body").empty();
  let grandTotal = 0,
    collected = 0;
  const totals = {
    poinsettia: 0,
    centrepiece: 0,
    wreath: 0,
    candyCane: 0,
    butterChicken: 0,
    butterChickpea: 0,
  };

  // --- mobile cards (compact) ---
  const mlist = $("#preorder-list").empty();

  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    grandTotal += total;
    if (row.paymentReceived) collected += total;
    Object.keys(totals).forEach((k) => (totals[k] += row[k] || 0));

    const totalClass = row.paymentReceived ? "green-text" : "red-text";

    mlist.append(`
        <div class="column">
            <div class="ui card" data-index="${index}">
                <div class="content">
                    <div class="header">
                        ${row.parentName || ""} <span class="small-text">(${row.childInfo || ""})</span>
                    </div>
                </div>
                <div class="content">
                    <div class="meta compact-list">
                        ${row.email ? `<p><strong>Email:</strong> ${row.email}</p>` : ""}
                        ${row.phone ? `<p><strong>Phone:</strong> ${row.phone}</p>` : ""}
                        ${row.etransferName ? `<p><strong>E-transfer:</strong> ${row.etransferName}</p>` : ""}
                    </div>
                    <div class="description">
                        <strong>Items:</strong>
                        <div class="ui list">${buildPreorderItemsList(row)}</div>
                    </div>
                </div>
                <div class="extra content">
                    <span class="${row.paymentReceived ? "green-text" : "red-text"}">
                        ${fmt(total)}
                    </span>
                    <div class="ui right floated checkbox">
                        <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
                        <label>Paid</label>
                    </div>
                </div>
            </div>
        </div>
    `);
  });

  const uncollected = grandTotal - collected;

  $("#preorder-mobile-summary").html(`
      <div class="ui list mobile-summary">
        <div class="item"><span>Collected</span> <strong class="green-text">${fmt(collected)}</strong></div>
        <div class="item"><span>Uncollected</span> <strong class="red-text">${fmt(uncollected)}</strong></div>
        <div class="item"><span>Grand Total</span> <strong>${fmt(grandTotal)}</strong></div>
      </div>
    `);

  // activate Semantic checkboxes (both desktop and mobile)
  $(".ui.checkbox").checkbox();
}

// -------- Vendors --------
async function loadVendors() {
  const res = await fetch("/api/data/vendor");
  const data = await res.json();

  // desktop table
  const tbody = $("#vendor-body").empty();
  let grandTotal = 0,
    collected = 0;

  // mobile cards
  const vlist = $("#vendor-list").empty();
  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    grandTotal += total;
    if (row.paymentReceived) collected += total;

    const totalClass = row.paymentReceived ? "green-text" : "red-text";

    vlist.append(`
        <div class="column">
            <div class="ui card" data-index="${index}">
                <div class="content">
                    <div class="header">
                         <div class="header">
                            ${row.businessName ? `${row.businessName}` : ""}
                        </div>
                    </div>
                </div>
                <div class="content">
                    <div class="meta compact-list">
                        ${row.fullName ? `<p><strong>Name:</strong> ${row.fullName}</p>` : ""}
                        ${row.email ? `<p><strong>Email:</strong> ${row.email}</p>` : ""}
                        ${row.phone ? `<p><strong>Phone:</strong> ${row.phone}</p>` : ""}
                        ${row.tableOption === "extraTable" ? `<p><strong>Extra table:</strong> Yes</p>` : `<p><strong>Extra table:</strong> No</p>`}
                        ${row.powerNeeded === "on" ? `<p><strong>Power needed:</strong> Yes</p>` : `<p><strong>Power needed:</strong> No</p>`}
                        ${row.staffContact ? `<p><strong>Staff contact:</strong> ${row.staffContact}</p>` : ""}
                    </div>
                </div>
                <div class="extra content">
                    <span class="${row.paymentReceived ? "green-text" : "red-text"}">
                        ${fmt(total)}
                    </span>
                    <div class="ui right floated checkbox">
                        <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
                        <label>Paid</label>
                    </div>
                </div>
            </div>
        </div>
      `);
  });

  const uncollected = grandTotal - collected;

  $("#vendor-mobile-summary").html(`
      <div class="ui list mobile-summary">
        <div class="item"><span>Collected</span> <strong class="green-text">${fmt(collected)}</strong></div>
        <div class="item"><span>Uncollected</span> <strong class="red-text">${fmt(uncollected)}</strong></div>
        <div class="item"><span>Grand Total</span> <strong>${fmt(grandTotal)}</strong></div>
      </div>
    `);

  $(".ui.checkbox").checkbox();
}

// ---- event handlers for toggles (desktop + mobile) ----
$("#preorder-body, #preorder-list").on(
  "change",
  ".payment-toggle",
  async function () {
    const index = $(this).closest("[data-index]").data("index");
    const checked = $(this).is(":checked");
    await fetch(`/api/data/preorder/${index}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentReceived: checked }),
    });
  }
);

$("#vendor-body, #vendor-list").on(
  "change",
  ".payment-toggle",
  async function () {
    const index = $(this).closest("[data-index]").data("index");
    const checked = $(this).is(":checked");
    await fetch(`/api/data/vendor/${index}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentReceived: checked }),
    });
  }
);

// ---- SSE: reload both (keeps inactive tab fresh too) ----
const evtSource = new EventSource("/events");
evtSource.onmessage = (e) => {
  if (e.data === "update") {
    loadPreorders();
    loadVendors();
  }
};
evtSource.onerror = (err) => console.error("SSE error:", err);

// ---- init ----
$(function () {
  $(".menu .item").tab(); // Semantic tabs
  loadPreorders();
  loadVendors();
});
