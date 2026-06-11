'use strict';

const { isValidTransition } = require('./validation');

/** Thrown when order_no violates the UNIQUE constraint. Mapped to HTTP 409. */
class DuplicateOrderError extends Error {
  constructor(orderNo) {
    super(`order_no already exists: ${orderNo}`);
    this.name = 'DuplicateOrderError';
    this.orderNo = orderNo;
  }
}

/** Thrown on an illegal status transition. Mapped to HTTP 400. */
class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`invalid transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function isUniqueViolation(err) {
  return err && /UNIQUE constraint failed/i.test(err.message || '');
}

/** Data-access + business logic over a single SQLite connection. */
function createWorkOrders(db) {
  const insertStmt = db.prepare(
    'INSERT INTO work_orders (order_no, style_code, qty) VALUES (?, ?, ?)'
  );
  const getByIdStmt = db.prepare('SELECT * FROM work_orders WHERE id = ?');
  const listAllStmt = db.prepare(
    'SELECT * FROM work_orders ORDER BY id'
  );
  const listByStatusStmt = db.prepare(
    'SELECT * FROM work_orders WHERE status = ? ORDER BY id'
  );
  const updateStatusStmt = db.prepare(
    `UPDATE work_orders SET status = ?, updated_at = ${NOW} WHERE id = ?`
  );

  return {
    /**
     * Insert a work order (status defaults to PENDING).
     * @throws {DuplicateOrderError} if order_no already exists.
     */
    create({ order_no, style_code, qty }) {
      let info;
      try {
        info = insertStmt.run(order_no, style_code, qty);
      } catch (err) {
        if (isUniqueViolation(err)) throw new DuplicateOrderError(order_no);
        throw err;
      }
      return getByIdStmt.get(Number(info.lastInsertRowid));
    },

    /** List all work orders, or only those with the given status. */
    list(status) {
      return status ? listByStatusStmt.all(status) : listAllStmt.all();
    },

    /** Fetch one work order by id, or undefined. */
    getById(id) {
      return getByIdStmt.get(id);
    },

    /**
     * Apply a status transition.
     * @returns the updated row, or null if the id does not exist.
     * @throws {InvalidTransitionError} if the transition is not allowed.
     */
    updateStatus(id, nextStatus) {
      const current = getByIdStmt.get(id);
      if (!current) return null;
      if (!isValidTransition(current.status, nextStatus)) {
        throw new InvalidTransitionError(current.status, nextStatus);
      }
      updateStatusStmt.run(nextStatus, id);
      return getByIdStmt.get(id);
    },
  };
}

module.exports = { createWorkOrders, DuplicateOrderError, InvalidTransitionError };
