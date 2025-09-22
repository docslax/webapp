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

  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    grandTotal += total;
    if (row.paymentReceived) collected += total;
    Object.keys(totals).forEach((k) => (totals[k] += row[k] || 0));

    const totalClass = row.paymentReceived ? "green-text" : "red-text";

    tbody.append(`
        <tr data-index="${index}">
          <td style="text-align:center">
            <div class="ui checkbox">
              <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
              <label></label>
            </div>
          </td>
          <td>${row.parentName || ""}</td>
          <td>${row.childInfo || ""}</td>
          <td>${row.phone || ""}</td>
          <td>${row.email || ""}</td>
          <td>${row.etransferName || ""}</td>
          <td>${row.poinsettia || 0}</td>
          <td>${row.centrepiece || 0}</td>
          <td>${row.wreath || 0}</td>
          <td>${row.candyCane || 0}</td>
          <td>${row.butterChicken || 0}</td>
          <td>${row.butterChickpea || 0}</td>
          <td class="${totalClass}">${fmt(total)}</td>
        </tr>
      `);
  });

  const uncollected = grandTotal - collected;
  $("#preorder-foot").html(`
      <tr>
        <th colspan="6" style="text-align:right">Totals:</th>
        <th>${totals.poinsettia}</th>
        <th>${totals.centrepiece}</th>
        <th>${totals.wreath}</th>
        <th>${totals.candyCane}</th>
        <th>${totals.butterChicken}</th>
        <th>${totals.butterChickpea}</th>
        <th>${fmt(grandTotal)}</th>
      </tr>
      <tr>
        <th colspan="12" style="text-align:right;">Collected:</th>
        <th class="green-text">${fmt(collected)}</th>
      </tr>
      <tr>
        <th colspan="12" style="text-align:right;">Uncollected:</th>
        <th class="red-text">${fmt(uncollected)}</th>
      </tr>
    `);

  // mobile cards
  const mlist = $("#preorder-list").empty();
  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    mlist.append(`
        <div class="item" data-index="${index}">
          <div class="ui segment mobile-card">
            <div class="ui grid">
              <div class="ten wide column">
                <div class="header">${row.parentName || ""}</div>
                <div class="meta">${row.childInfo || ""}</div>
                <div class="meta">${row.email || ""}${row.phone ? " • " + row.phone : ""}</div>
              </div>
              <div class="six wide column right aligned ${row.paymentReceived ? "green-text" : "red-text"}">
                ${fmt(total)}
              </div>
            </div>
            <div class="ui relaxed list">
              ${buildPreorderItemsList(row)}
            </div>
            <div class="extra">
              <div class="ui checkbox">
                <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
                <label>Payment received</label>
              </div>
            </div>
          </div>
        </div>
      `);
  });

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

  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    grandTotal += total;
    if (row.paymentReceived) collected += total;

    const totalClass = row.paymentReceived ? "green-text" : "red-text";

    tbody.append(`
        <tr data-index="${index}">
          <td style="text-align:center">
            <div class="ui checkbox">
              <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
              <label></label>
            </div>
          </td>
          <td>${row.fullName || ""}</td>
          <td>${row.businessName || ""}</td>
          <td>${row.email || ""}</td>
          <td>${row.phone || ""}</td>
          <td>${row.tableOption === "extraTable" ? "Yes" : "No"}</td>
          <td>${row.powerNeeded === "on" ? "Yes" : "No"}</td>
          <td>${row.staffContact || ""}</td>
          <td class="${totalClass}">${fmt(total)}</td>
        </tr>
      `);
  });

  const uncollected = grandTotal - collected;
  $("#vendor-foot").html(`
      <tr><th colspan="8" style="text-align:right">Grand Total:</th><th>${fmt(grandTotal)}</th></tr>
      <tr><th colspan="8" style="text-align:right">Collected:</th><th class="green-text">${fmt(collected)}</th></tr>
      <tr><th colspan="8" style="text-align:right">Uncollected:</th><th class="red-text">${fmt(uncollected)}</th></tr>
    `);

  // mobile cards
  const vlist = $("#vendor-list").empty();
  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    vlist.append(`
        <div class="item" data-index="${index}">
          <div class="ui segment mobile-card">
            <div class="ui grid">
              <div class="ten wide column">
                <div class="header">${row.fullName || ""}</div>
                <div class="meta">${row.businessName || ""}</div>
                <div class="meta">${row.email || ""}${row.phone ? " • " + row.phone : ""}</div>
                <div class="meta">
                  ${row.tableOption === "extraTable" ? "Extra table • " : ""}
                  ${row.powerNeeded === "on" ? "Power" : ""}
                </div>
              </div>
              <div class="six wide column right aligned ${row.paymentReceived ? "green-text" : "red-text"}">
                ${fmt(total)}
              </div>
            </div>
            <div class="extra">
              <div class="ui checkbox">
                <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
                <label>Payment received</label>
              </div>
            </div>
          </div>
        </div>
      `);
  });

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
