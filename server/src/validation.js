'use strict';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

// Single source of truth for allowed status transitions.
const TRANSITIONS = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
};

const ORDER_NO_RE = /^WO-\d{4}-\d{4}$/;
const STYLE_CODE_MAX = 20;
const QTY_MIN = 1;
const QTY_MAX = 100000;

/**
 * Validate a POST /work-orders body.
 * @returns {{ valid: boolean, errors: string[], value?: {order_no,style_code,qty} }}
 */
function validateCreate(body) {
  const errors = [];
  const data = body && typeof body === 'object' ? body : {};
  const { order_no, style_code, qty } = data;

  if (typeof order_no !== 'string' || !ORDER_NO_RE.test(order_no)) {
    errors.push('order_no is required and must match WO-YYYY-NNNN');
  }

  if (typeof style_code !== 'string' || style_code.trim() === '') {
    errors.push('style_code is required and must be a non-empty string');
  } else if (style_code.length > STYLE_CODE_MAX) {
    errors.push(`style_code must be at most ${STYLE_CODE_MAX} characters`);
  }

  if (!Number.isInteger(qty) || qty < QTY_MIN || qty > QTY_MAX) {
    errors.push(`qty is required and must be an integer between ${QTY_MIN} and ${QTY_MAX}`);
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, errors: [], value: { order_no, style_code, qty } };
}

/** Is the given value one of the known statuses? */
function isValidStatus(status) {
  return STATUSES.includes(status);
}

/** Is moving from `current` to `next` an allowed transition? */
function isValidTransition(current, next) {
  return Array.isArray(TRANSITIONS[current]) && TRANSITIONS[current].includes(next);
}

module.exports = {
  STATUSES,
  TRANSITIONS,
  ORDER_NO_RE,
  STYLE_CODE_MAX,
  QTY_MIN,
  QTY_MAX,
  validateCreate,
  isValidStatus,
  isValidTransition,
};
