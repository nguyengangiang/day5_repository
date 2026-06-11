'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schema', 'option-b.sql');

/**
 * Open a SQLite database and apply the work_orders schema.
 *
 * Uses Node's built-in `node:sqlite` (DatabaseSync) — same synchronous,
 * prepared-statement API style as better-sqlite3, but with no native build step.
 *
 * @param {string} [filename] Path to the DB file. Defaults to data.db at the
 *   repo root. Pass ':memory:' for an isolated in-memory DB (used by tests).
 * @returns {import('node:sqlite').DatabaseSync}
 */
function createDb(filename = path.join(__dirname, '..', '..', 'data.db')) {
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys = ON');
  if (filename !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL');
  }

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  return db;
}

module.exports = { createDb, SCHEMA_PATH };
