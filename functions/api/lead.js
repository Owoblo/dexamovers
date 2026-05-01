const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });

function clean(value, limit = 4000) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function validateLead(payload) {
  const errors = [];

  if (!payload.name) errors.push("Name is required.");
  if (!payload.email) errors.push("Email is required.");
  if (!payload.phone && payload.leadType === "Quote Request") errors.push("Phone is required.");
  if (!payload.service && payload.leadType === "Quote Request") errors.push("Service is required.");
  if (payload.website) errors.push("Spam check failed.");

  return errors;
}

function formatLeadText(payload) {
  return [
    `Lead Type: ${payload.leadType || "Website Lead"}`,
    `Form Name: ${payload.formName || "Website Form"}`,
    `Submitted At: ${payload.submittedAt || new Date().toISOString()}`,
    `Name: ${payload.name || "-"}`,
    `Email: ${payload.email || "-"}`,
    `Phone: ${payload.phone || "-"}`,
    `Service: ${payload.service || "-"}`,
    `Move Date: ${payload.moveDate || "-"}`,
    `Move Size: ${payload.moveSize || "-"}`,
    `From City: ${payload.fromCity || "-"}`,
    `To City: ${payload.toCity || "-"}`,
    `Source Page: ${payload.sourcePage || "-"}`,
    "",
    "Details:",
    payload.details || "-"
  ].join("\n");
}

async function storeLead(payload, env) {
  if (!env.DB) {
    return false;
  }

  await env.DB.prepare(
    `
      insert into leads (
        lead_type,
        form_name,
        name,
        email,
        phone,
        service,
        move_date,
        move_size,
        from_city,
        to_city,
        details,
        source_page,
        submitted_at,
        raw_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      payload.leadType || null,
      payload.formName || null,
      payload.name || null,
      payload.email || null,
      payload.phone || null,
      payload.service || null,
      payload.moveDate || null,
      payload.moveSize || null,
      payload.fromCity || null,
      payload.toCity || null,
      payload.details || null,
      payload.sourcePage || null,
      payload.submittedAt || new Date().toISOString(),
      JSON.stringify(payload)
    )
    .run();

  return true;
}

async function sendToWebhook(payload, webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with status ${response.status}.`);
  }

  return true;
}

async function sendViaResend(payload, env) {
  if (!env.RESEND_API_KEY || !env.FORM_TO_EMAIL) {
    return false;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || "DEXA Movers <leads@dexamovers.ca>";
  const text = formatLeadText(payload);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [env.FORM_TO_EMAIL],
      reply_to: payload.email,
      subject: `[DEXA Movers] ${payload.leadType || "Website Lead"} from ${payload.name}`,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend delivery failed: ${errorText}`);
  }

  return true;
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      Allow: "POST, OPTIONS"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentType = request.headers.get("content-type") || "";
  let raw = {};

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    raw = Object.fromEntries(formData.entries());
  } else if (contentType.includes("application/json")) {
    raw = await request.json();
  } else {
    return json({ error: "Unsupported form submission type." }, 415);
  }

  const payload = {
    leadType: clean(raw.leadType, 80) || "Website Lead",
    formName: clean(raw.formName, 80) || "Website Form",
    name: clean(raw.name, 120),
    email: clean(raw.email, 120),
    phone: clean(raw.phone, 40),
    service: clean(raw.service, 120),
    moveDate: clean(raw.moveDate, 40),
    moveSize: clean(raw.moveSize, 80),
    fromCity: clean(raw.fromCity, 120),
    toCity: clean(raw.toCity, 120),
    details: clean(raw.details, 4000),
    sourcePage: clean(raw.sourcePage, 160),
    submittedAt: clean(raw.submittedAt, 40),
    website: clean(raw.website, 40)
  };

  const errors = validateLead(payload);
  if (errors.length > 0) {
    return json({ error: errors[0] }, 400);
  }

  try {
    let stored = false;
    let delivered = false;

    if (env.DB) {
      await storeLead(payload, env);
      stored = true;
    }

    if (env.FORM_WEBHOOK_URL) {
      await sendToWebhook(payload, env.FORM_WEBHOOK_URL);
      delivered = true;
    }

    if (env.RESEND_API_KEY && env.FORM_TO_EMAIL) {
      await sendViaResend(payload, env);
      delivered = true;
    }

    if (!stored && !delivered) {
      return json(
        {
          error:
            "Lead capture is not configured yet. Add a D1 database binding, FORM_WEBHOOK_URL, or RESEND_API_KEY with FORM_TO_EMAIL in Cloudflare."
        },
        500
      );
    }

    return json({
      ok: true,
      message: "Thanks. Your request has been received and we will follow up soon."
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Lead delivery failed."
      },
      502
    );
  }
}
