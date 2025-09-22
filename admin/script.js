// -------- Preorders --------
async function loadPreorders() {
  const res = await fetch("/api/data/preorder");
  const data = await res.json();
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

    // accumulate items
    Object.keys(totals).forEach((k) => (totals[k] += row[k] || 0));

    tbody.append(`
      <tr data-index="${index}">
        <td style="text-align:center">
          <div class="ui checkbox">
            <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
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
        <td class="${row.paymentReceived ? "green-text" : "red-text"}">$${total.toFixed(2)}</td>
      </tr>
    `);
  });

  const uncollected = grandTotal - collected;

  $("#preorder-foot").html(`
    <tr><th colspan="6" style="text-align:right">Totals:</th>
        <th>${totals.poinsettia}</th>
        <th>${totals.centrepiece}</th>
        <th>${totals.wreath}</th>
        <th>${totals.candyCane}</th>
        <th>${totals.butterChicken}</th>
        <th>${totals.butterChickpea}</th>
        <th>$${grandTotal.toFixed(2)}</th></tr>
    <tr><th colspan="12" style="text-align:right">Collected:</th>
        <th class="green-text">$${collected.toFixed(2)}</th></tr>
    <tr><th colspan="12" style="text-align:right">Uncollected:</th>
        <th class="red-text">$${uncollected.toFixed(2)}</th></tr>
  `);

  $(".ui.checkbox").checkbox();
}

// -------- Vendors --------
async function loadVendors() {
  const res = await fetch("/api/data/vendor");
  const data = await res.json();
  const tbody = $("#vendor-body").empty();

  let grandTotal = 0,
    collected = 0;

  data.forEach((row, index) => {
    const total = parseFloat(row.total || 0);
    grandTotal += total;
    if (row.paymentReceived) collected += total;

    tbody.append(`
      <tr data-index="${index}">
        <td style="text-align:center">
          <div class="ui checkbox">
            <input type="checkbox" class="payment-toggle" ${row.paymentReceived ? "checked" : ""}>
          </div>
        </td>
        <td>${row.fullName || ""}</td>
        <td>${row.businessName || ""}</td>
        <td>${row.email || ""}</td>
        <td>${row.phone || ""}</td>
        <td>${row.tableOption === "extraTable" ? "Yes" : "No"}</td>
        <td>${row.powerNeeded === "on" ? "Yes" : "No"}</td>
        <td>${row.staffContact || ""}</td>
        <td class="${row.paymentReceived ? "green-text" : "red-text"}">$${total.toFixed(2)}</td>
      </tr>
    `);
  });

  const uncollected = grandTotal - collected;

  $("#vendor-foot").html(`
    <tr><th colspan="8" style="text-align:right">Grand Total:</th>
        <th>$${grandTotal.toFixed(2)}</th></tr>
    <tr><th colspan="8" style="text-align:right">Collected:</th>
        <th class="green-text">$${collected.toFixed(2)}</th></tr>
    <tr><th colspan="8" style="text-align:right">Uncollected:</th>
        <th class="red-text">$${uncollected.toFixed(2)}</th></tr>
  `);

  $(".ui.checkbox").checkbox();
}

// Vendor payment toggle
$("#vendor-body").on("change", ".payment-toggle", async function () {
  const row = $(this).closest("tr");
  const index = row.data("index");
  const checked = $(this).is(":checked");

  await fetch(`/api/data/vendor/${index}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentReceived: checked }),
  });
});

// Preorder payment toggle
$("#preorder-body").on("change", ".payment-toggle", async function () {
  const row = $(this).closest("tr");
  const index = row.data("index");
  const checked = $(this).is(":checked");

  await fetch(`/api/data/preorder/${index}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentReceived: checked }),
  });
});

$(document).ready(function () {
  // enable tabs
  $(".menu .item").tab();

  // initial load
  loadPreorders();
  loadVendors();
});

const evtSource = new EventSource("/events");

evtSource.onmessage = function (e) {
  if (e.data === "update") {
    const activeTab = $(".menu .item.active").data("tab");

    if (activeTab === "preorder") {
      loadPreorders();
    } else if (activeTab === "vendor") {
      loadVendors();
    }
  }
};

evtSource.onerror = function (err) {
  console.error("❌ SSE error:", err);
};
