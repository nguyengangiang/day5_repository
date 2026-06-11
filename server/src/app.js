'use strict';

const path = require('path');
const express = require('express');

/**
 * Build the Express app. Exported without calling listen() so tests can drive
 * it in-process with supertest.
 *
 * @param {import('better-sqlite3').Database} db An open DB from createDb().
 * @returns {import('express').Express}
 */
function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Endpoints are mounted in later commits (POST/GET/PATCH /work-orders).

  // Serve the built React client if it exists (for the demo).
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));

  return app;
}

module.exports = { createApp };
