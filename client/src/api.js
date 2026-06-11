// Thin fetch wrappers around the Work Order API. Paths are relative so the
// Vite dev proxy (and Express in production) route them to the server.

const BASE = '/work-orders';

async function parse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.error || `request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = body.details;
    throw err;
  }
  return body;
}

/** GET /work-orders, optionally filtered by status ('ALL' means no filter). */
export function listWorkOrders(status) {
  const qs = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  return fetch(`${BASE}${qs}`).then(parse);
}

/** POST /work-orders */
export function createWorkOrder({ order_no, style_code, qty }) {
  return fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_no, style_code, qty }),
  }).then(parse);
}

/** PATCH /work-orders/:id/status */
export function updateStatus(id, status) {
  return fetch(`${BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(parse);
}
