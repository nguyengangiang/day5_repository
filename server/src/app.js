'use strict';

const path = require('path');
const express = require('express');
const { isValidStatus, validateCreate } = require('./validation');
const {
  createWorkOrders,
  DuplicateOrderError,
  InvalidTransitionError,
} = require('./workOrders');

/**
 * Build the Express app. Exported without calling listen() so tests can drive
 * it in-process with supertest.
 *
 * @param {import('node:sqlite').DatabaseSync} db An open DB from createDb().
 * @returns {import('express').Express}
 */
function createApp(db) {
  const app = express();
  app.use(express.json());

  const workOrders = createWorkOrders(db);

  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  // List, optionally filtered by status.
  app.get('/work-orders', (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({ error: 'invalid status filter' });
    }
    return res.status(200).json(workOrders.list(status));
  });

  // Create a work order.
  app.post('/work-orders', (req, res) => {
    const result = validateCreate(req.body);
    if (!result.valid) {
      return res.status(400).json({ error: 'validation failed', details: result.errors });
    }
    try {
      const row = workOrders.create(result.value);
      return res.status(201).json(row);
    } catch (err) {
      if (err instanceof DuplicateOrderError) {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }
  });

  // Toggle status along the allowed transition path.
  app.patch('/work-orders/:id/status', (req, res) => {
    const { status } = req.body || {};
    if (!isValidStatus(status)) {
      return res.status(400).json({ error: 'invalid status value' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    try {
      const row = workOrders.updateStatus(id, status);
      if (!row) return res.status(404).json({ error: 'work order not found' });
      return res.status(200).json(row);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  });

  // Serve the built React client if it exists (for the demo).
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));

  return app;
}

module.exports = { createApp };
