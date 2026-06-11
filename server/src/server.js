'use strict';

const { createDb } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

const db = createDb();
const app = createApp(db);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Work Order API listening on http://localhost:${PORT}`);
});
