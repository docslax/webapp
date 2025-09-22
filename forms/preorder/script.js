$(document).ready(async function () {
  const formatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  });

  let config;

  // Load config.json dynamically
  try {
    const res = await fetch("config.json");
    config = await res.json();
  } catch (err) {
    console.error("Failed to load config.json", err);
    return;
  }

  // Populate title & info
  $("#form-title").text(config.title);
  $("#form-info").html(`
    <p>Ensure your home is ready for the holidays with poinsettias and wreaths,
      and enjoy Sarab’s famous butter chicken or chickpea meals.</p>
    <p>Payment due by <strong>${formatDateLong(config.paymentDeadline)}</strong>.
      E-transfer to <strong>${config.etransferEmail}</strong> (use memo <em>"${config.etransferMemo}"</em>).</p>
    <p>Pickup: <strong>${formatDateLong(config.pickupDate)}</strong>,
      ${config.pickupTime}, ${config.pickupLocation}.</p>
  `);

  // Build item cards dynamically
  const $items = $("#order-items");
  config.items.forEach((item) => {
    const card = `
      <div class="column">
        <div class="ui card fluid">
          <div class="content">
            <div class="header">${item.name}</div>
            <div class="meta">$${item.price.toFixed(2)} each</div>
            <div class="description">
              <input type="number" min="0" name="${item.id}Qty" value="0" class="fluid" />
            </div>
          </div>
          <div class="extra content">
            Total: <span class="item-total" data-price="${item.price}">$0.00</span>
          </div>
        </div>
      </div>`;

    $items.append(card);
  });

  // --- Calculate totals ---
  function calculateTotals() {
    let grandTotal = 0;
    $("input[type='number']").each(function () {
      const qty = parseInt($(this).val()) || 0;
      const price = parseFloat(
        $(this).closest(".card").find(".item-total").data("price")
      );
      const itemTotal = qty * price;
      $(this)
        .closest(".card")
        .find(".item-total")
        .text(formatter.format(itemTotal));
      grandTotal += itemTotal;
    });
    $("#orderTotal").text(formatter.format(grandTotal));
  }

  $("input[type='number']").on("input change", calculateTotals);

  // --- Handle Success ---
  function handleSuccess(response) {
    $("#submit-preorder").removeClass("loading");

    if (response.success === true) {
      $(".ui.form.preorder").form("reset");
      calculateTotals();
      $(".ui.modal#preorder-confirm")
        .modal({
          blurring: true,
          closable: false,
          centered: false,
        })
        .modal("show");
    } else {
      $("#submit-error").removeClass("hidden");
    }
  }

  // --- Submit Handler ---
  $("#submit-preorder").click(async function (e) {
    e.preventDefault();
    const $form = $(".ui.form.preorder");

    $("#submit-error").addClass("hidden");
    $form.form("validate form");

    if ($form.form("is valid")) {
      $("#submit-preorder").addClass("loading");

      const formValues = $form.form("get values");
      let orderInfo = {
        parentName: formValues.parentName,
        childInfo: formValues.childInfo,
        phone: formValues.phone,
        email: formValues.email,
        etransferName: formValues.etransferName,
        total: $("#orderTotal")
          .text()
          .replace(/[^0-9.]/g, ""),
      };

      // Add each item qty
      config.items.forEach((item) => {
        orderInfo[item.id] = parseInt(formValues[`${item.id}Qty`]) || 0;
      });

      try {
        const res = await fetch("/submit/preorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderInfo),
        });
        const result = await res.json();
        handleSuccess(result);
      } catch (err) {
        console.error("Submission error:", err);
        $("#submit-error").removeClass("hidden");
      } finally {
        $("#submit-preorder").removeClass("loading");
      }
    }
  });

  // --- Init ---
  $(".ui.checkbox").checkbox();

  // custom phone rule (optional but must be valid if filled)
  $.fn.form.settings.rules.phone = function (value) {
    if (!value || value.trim() === "") return true;
    return /^[0-9]{10}$/.test(value);
  };

  $(".ui.form.preorder").form({
    fields: {
      parentName: {
        rules: [{ type: "empty", prompt: "Please enter the Parent’s Name" }],
      },
      childInfo: {
        rules: [
          { type: "empty", prompt: "Please enter the Child’s Name & Grade" },
        ],
      },
      phone: {
        optional: true,
        rules: [
          {
            type: "phone",
            prompt: "Please enter a valid phone number (10 digits)",
          },
        ],
      },
      email: {
        rules: [{ type: "email", prompt: "Please enter a valid email" }],
      },
      etransferName: {
        rules: [
          {
            type: "empty",
            prompt: "Please enter the E-transfer Name or Business",
          },
        ],
      },
      disclaimer: {
        rules: [
          { type: "checked", prompt: "You must agree to confirm preorder" },
        ],
      },
    },
  });

  calculateTotals();

  function formatDateLong(dateStr) {
    const date = new Date(dateStr);

    const month = date.toLocaleString("en-CA", { month: "long" });
    const day = date.getDate();

    // suffix
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";

    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
  }
});
