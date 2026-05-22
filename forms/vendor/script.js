const formatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

let config = null;

// --- Pricing Option Helper ---
const pricingOption = (e) => {
  const id = e.target.id;

  if (id === "studentGroup") {
    $("#staffContactField").show();
    $(".ui.form.application").form("add rule", "staffContact", {
      rules: [
        {
          type: "empty",
          prompt: "Student Groups must enter a Staff Contact",
        },
      ],
    });
  } else {
    $("#staffContactField").hide();
    $(".ui.form.application").form("remove rule", "staffContact");
  }

  calculateTotal();
};

// --- Calculate Total ---
function calculateTotal() {
  let total = 0;
  const boothPricing = document.querySelectorAll('[name="boothPricing"]');
  const powerNeeded = document.querySelectorAll('[name="powerNeeded"]:checked');
  const tableOptions = document.querySelectorAll(
    '[name="tableOption"]:checked',
  );

  boothPricing.forEach((radioButton) => {
    if (radioButton.checked) {
      total += parseFloat(radioButton.getAttribute("data-amount")) || 0;
    }
  });
  powerNeeded.forEach((checkbox) => {
    total += parseFloat(checkbox.getAttribute("data-amount")) || 0;
  });
  tableOptions.forEach((option) => {
    total += parseFloat(option.getAttribute("data-amount")) || 0;
  });

  $("#total").text(formatter.format(total)).attr("data-amount", total);
}

// --- Radio Defaults ---
function setRadioButtonDefaults() {
  const earlyBirdRadio = $("#earlyBird");
  const regularRadio = $("#regular");
  const studentRadio = $("#studentGroup");
  const submit = $("#submit-application");

  const currentDate = new Date();
  const earlyBirdEndDate = parseEndOfDay(config?.earlyBirdDeadline);
  const regularEndDate = parseEndOfDay(config?.regularDeadline);

  earlyBirdRadio.prop("disabled", false);
  regularRadio.prop("disabled", false);
  studentRadio.prop("disabled", false);
  submit.prop("disabled", false);

  if (earlyBirdEndDate && currentDate <= earlyBirdEndDate) {
    earlyBirdRadio.prop("checked", true).prop("disabled", false);
    regularRadio.prop("disabled", true);
  } else if (regularEndDate && currentDate <= regularEndDate) {
    regularRadio.prop("checked", true).prop("disabled", false);
    earlyBirdRadio.prop("disabled", true);
  } else {
    earlyBirdRadio.prop("disabled", true);
    regularRadio.prop("disabled", true);
    studentRadio.prop("disabled", true);
    submit.prop("disabled", true);
  }
}

// --- Handle Success ---
function handleSuccess(response) {
  $("#submit-application").removeClass("loading");

  console.log("Server response:", response);

  if (response.success === true) {
    $(".ui.form.application").form("reset");
    calculateTotal();
    $("#reciept_total").text(formatter.format(response.applicationData.total));

    $(".ui.modal")
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
$("#submit-application").click(async function (e) {
  e.preventDefault();
  const $form = $(".ui.form.application");

  $("#submit-error").addClass("hidden");
  $form.form("validate form");

  if ($form.form("is valid")) {
    $("#submit-application").addClass("loading");

    const formValues = $form.form("get values");
    let appInfo = {
      fullName: `${formValues.firstName} ${formValues.lastName}`,
      businessName: formValues.businessName,
      boothDescription: formValues.foodProducts,
      email: formValues.email,
      phone: formValues.phone,
      tableOption: formValues.tableOption,
      powerNeeded: formValues.powerNeeded,
      staffContact: formValues.staffContact,
      total: $("#total").attr("data-amount"),
    };

    try {
      const res = await fetch("/submit/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appInfo),
      });
      const result = await res.json();
      handleSuccess(result);
    } catch (err) {
      console.error("Submission error:", err);
      $("#submit-error").removeClass("hidden");
    } finally {
      $("#submit-application").removeClass("loading");
    }
  }
});

$(document).ready(async function () {
  // Load config.json dynamically
  try {
    const res = await fetch("config.json");
    config = await res.json();
  } catch (err) {
    console.error("Failed to load config.json", err);
    return;
  }

  applyConfig(config);

  // --- Init ---
  $(".ui.checkbox").checkbox();
  setRadioButtonDefaults();
  calculateTotal();

  // Extend form validation
  $.fn.form.settings.rules.phone = function (value) {
    return /^[0-9]{10}$/.test(value);
  };

  $(".ui.form.application").form({
    fields: {
      firstName: {
        rules: [{ type: "empty", prompt: "Please enter a First Name" }],
      },
      lastName: {
        rules: [{ type: "empty", prompt: "Please enter a Last Name" }],
      },
      businessName: {
        rules: [{ type: "empty", prompt: "Please enter your Business Name" }],
      },
      email: {
        rules: [{ type: "email", prompt: "Please enter a valid e-mail" }],
      },
      phone: {
        rules: [
          { type: "empty", prompt: "Please enter your phone number" },
          {
            type: "phone",
            prompt: "Please enter a valid phone number (10 digits)",
          },
        ],
      },
      disclaimer: {
        rules: [
          { type: "checked", prompt: "You must agree to the disclaimer" },
        ],
      },
    },
    onFailure: function (formErrors) {
      $("#errorMessage")
        .html(
          "<ul class='list'><li>" + formErrors.join("</li><li>") + "</li></ul>",
        )
        .show();
      return false;
    },
  });

  // Attach pricingOption to radio buttons
  $("[name='boothPricing']").on("change", pricingOption);
});

function parseEndOfDay(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T23:59:59`);
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function setAmount(selector, value) {
  $(selector).attr("data-amount", value);
}

function setText(selector, value) {
  if (value !== undefined && value !== null && value !== "") {
    $(selector).text(value);
  }
}

function applyConfig(cfg) {
  const prices = cfg.prices || {};

  setText("#form-title", cfg.title);
  setText("#eventDateText", formatDateLong(cfg.eventDate));
  setText("#eventLocationText", cfg.location);
  setText("#setupTimeText", cfg.setupTime);
  setText("#eventTimeText", cfg.eventTime);
  setText("#earlyBirdDeadline", formatDateLong(cfg.earlyBirdDeadline));
  setText("#applicationDeadline", formatDateLong(cfg.regularDeadline));

  const earlyBird = prices.earlyBird ?? 100;
  const regular = prices.regular ?? 125;
  const student = prices.student ?? 50;
  const extraTable = prices.extraTable ?? 50;
  const tableSpace = prices.tableSpace ?? 50;
  const power = prices.power ?? 10;

  setAmount("#earlyBird", earlyBird);
  setAmount("#regular", regular);
  setAmount("#studentGroup", student);
  setAmount("#extraTable", extraTable);
  setAmount("#spaceForTable", tableSpace);
  setAmount("[name='powerNeeded']", power);

  setText("#earlyBirdFeeText", formatter.format(earlyBird));
  setText("#regularFeeText", formatter.format(regular));
  setText("#extraTableFeeText", formatter.format(extraTable));
  setText("#powerFeeText", formatter.format(power));

  setText("#earlyBirdPriceLabel", formatter.format(earlyBird));
  setText("#regularPriceLabel", formatter.format(regular));
  setText("#studentPriceLabel", formatter.format(student));
  setText("#extraTablePriceLabel", formatter.format(extraTable));
  setText("#tableSpacePriceLabel", formatter.format(tableSpace));
  setText("#powerPriceLabel", formatter.format(power));

  if (cfg.etransferEmail) {
    setText("#etransferEmailText", cfg.etransferEmail);
    setText("#etransferEmailLink", cfg.etransferEmail);
    $("#etransferEmailLink").attr("href", `mailto:${cfg.etransferEmail}`);
  }
  setText("#etransferMemoText", cfg.etransferMemo);
}
