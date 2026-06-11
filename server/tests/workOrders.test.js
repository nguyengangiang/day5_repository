'use strict';

const request = require('supertest');
const { createDb } = require('../src/db');
const { createApp } = require('../src/app');

let db;
let app;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp(db);
});

afterEach(() => {
  if (db) db.close();
});

// --- helpers ---------------------------------------------------------------

const validBody = (overrides = {}) => ({
  order_no: 'WO-2026-0001',
  style_code: 'ST-100',
  qty: 500,
  ...overrides,
});

/** Create a work order and return its row. Fails the test if not 201. */
async function createOrder(overrides = {}) {
  const res = await request(app).post('/work-orders').send(validBody(overrides));
  expect(res.status).toBe(201);
  return res.body;
}

/** Move a freshly-created order to the given target status. */
async function createOrderInStatus(status, overrides = {}) {
  const row = await createOrder(overrides);
  if (status === 'PENDING') return row;

  let res = await request(app)
    .patch(`/work-orders/${row.id}/status`)
    .send({ status: 'IN_PROGRESS' });
  expect(res.status).toBe(200);
  if (status === 'IN_PROGRESS') return res.body;

  res = await request(app)
    .patch(`/work-orders/${row.id}/status`)
    .send({ status: 'COMPLETED' });
  expect(res.status).toBe(200);
  return res.body;
}

// --- POST /work-orders -----------------------------------------------------

describe('POST /work-orders', () => {
  it('returns 201 with the created row, default status PENDING and timestamps', async () => {
    const res = await request(app).post('/work-orders').send(validBody());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      order_no: 'WO-2026-0001',
      style_code: 'ST-100',
      qty: 500,
      status: 'PENDING',
    });
    expect(typeof res.body.id).toBe('number');
    expect(res.body.created_at).toBeTruthy();
    expect(res.body.updated_at).toBeTruthy();
  });

  describe('order_no validation -> 400', () => {
    it('400 when order_no is missing', async () => {
      const body = validBody();
      delete body.order_no;
      const res = await request(app).post('/work-orders').send(body);
      expect(res.status).toBe(400);
    });

    it.each([
      ['too short: WO-1', 'WO-1'],
      ['wrong prefix: ST-100', 'ST-100'],
      ['too many digits: WO-2026-12345', 'WO-2026-12345'],
      ['lowercase: wo-2026-0001', 'wo-2026-0001'],
    ])('400 when order_no is %s', async (_label, order_no) => {
      const res = await request(app).post('/work-orders').send(validBody({ order_no }));
      expect(res.status).toBe(400);
    });
  });

  describe('style_code validation -> 400', () => {
    it('400 when style_code is missing', async () => {
      const body = validBody();
      delete body.style_code;
      const res = await request(app).post('/work-orders').send(body);
      expect(res.status).toBe(400);
    });

    it('400 when style_code is an empty string', async () => {
      const res = await request(app).post('/work-orders').send(validBody({ style_code: '' }));
      expect(res.status).toBe(400);
    });

    it('400 when style_code is whitespace-only', async () => {
      const res = await request(app).post('/work-orders').send(validBody({ style_code: '   ' }));
      expect(res.status).toBe(400);
    });

    it('400 when style_code is longer than 20 chars', async () => {
      const res = await request(app)
        .post('/work-orders')
        .send(validBody({ style_code: 'A'.repeat(21) }));
      expect(res.status).toBe(400);
    });
  });

  describe('qty validation -> 400', () => {
    it('400 when qty is missing', async () => {
      const body = validBody();
      delete body.qty;
      const res = await request(app).post('/work-orders').send(body);
      expect(res.status).toBe(400);
    });

    it.each([
      ['non-integer 1.5', 1.5],
      ['zero', 0],
      ['negative', -5],
      ['above max (100001)', 100001],
    ])('400 when qty is %s', async (_label, qty) => {
      const res = await request(app).post('/work-orders').send(validBody({ qty }));
      expect(res.status).toBe(400);
    });

    it('400 when qty is a numeric string "5"', async () => {
      const res = await request(app).post('/work-orders').send(validBody({ qty: '5' }));
      expect(res.status).toBe(400);
    });
  });

  describe('boundary values that must pass -> 201', () => {
    it('201 when qty is 1', async () => {
      const res = await request(app)
        .post('/work-orders')
        .send(validBody({ order_no: 'WO-2026-1001', qty: 1 }));
      expect(res.status).toBe(201);
      expect(res.body.qty).toBe(1);
    });

    it('201 when qty is 100000', async () => {
      const res = await request(app)
        .post('/work-orders')
        .send(validBody({ order_no: 'WO-2026-1002', qty: 100000 }));
      expect(res.status).toBe(201);
      expect(res.body.qty).toBe(100000);
    });

    it('201 when style_code is exactly 20 chars', async () => {
      const style_code = 'A'.repeat(20);
      const res = await request(app)
        .post('/work-orders')
        .send(validBody({ order_no: 'WO-2026-1003', style_code }));
      expect(res.status).toBe(201);
      expect(res.body.style_code).toBe(style_code);
    });
  });

  it('returns 409 on a duplicate order_no', async () => {
    await createOrder({ order_no: 'WO-2026-0009' });
    const res = await request(app)
      .post('/work-orders')
      .send(validBody({ order_no: 'WO-2026-0009' }));
    expect(res.status).toBe(409);
  });
});

// --- GET /work-orders ------------------------------------------------------

describe('GET /work-orders', () => {
  it('returns 200 with an array of all rows', async () => {
    await createOrder({ order_no: 'WO-2026-0001' });
    await createOrder({ order_no: 'WO-2026-0002' });

    const res = await request(app).get('/work-orders');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('returns 200 with an empty array when there are no rows', async () => {
    const res = await request(app).get('/work-orders');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  describe('?status filter', () => {
    beforeEach(async () => {
      // One PENDING, one IN_PROGRESS, one COMPLETED.
      await createOrderInStatus('PENDING', { order_no: 'WO-2026-0101' });
      await createOrderInStatus('IN_PROGRESS', { order_no: 'WO-2026-0102' });
      await createOrderInStatus('COMPLETED', { order_no: 'WO-2026-0103' });
    });

    it.each(['PENDING', 'IN_PROGRESS', 'COMPLETED'])(
      '200 filtering to status=%s returns only that status',
      async (status) => {
        const res = await request(app).get('/work-orders').query({ status });
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body.every((r) => r.status === status)).toBe(true);
      }
    );

    it('400 when status filter is an invalid value (BOGUS)', async () => {
      const res = await request(app).get('/work-orders').query({ status: 'BOGUS' });
      expect(res.status).toBe(400);
    });
  });
});

// --- PATCH /work-orders/:id/status -----------------------------------------

describe('PATCH /work-orders/:id/status', () => {
  it('200 on PENDING -> IN_PROGRESS, then IN_PROGRESS -> COMPLETED', async () => {
    const row = await createOrder();

    const r1 = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(r1.status).toBe(200);
    expect(r1.body.status).toBe('IN_PROGRESS');

    const r2 = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'COMPLETED' });
    expect(r2.status).toBe(200);
    expect(r2.body.status).toBe('COMPLETED');
  });

  it('updates updated_at on a valid transition', async () => {
    const row = await createOrder();
    const r1 = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(r1.status).toBe(200);
    // updated_at should not be earlier than created_at after a transition.
    expect(r1.body.updated_at >= row.created_at).toBe(true);
  });

  it('400 on illegal skip PENDING -> COMPLETED', async () => {
    const row = await createOrderInStatus('PENDING');
    const res = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(400);
  });

  it('400 on backward IN_PROGRESS -> PENDING', async () => {
    const row = await createOrderInStatus('IN_PROGRESS', { order_no: 'WO-2026-0201' });
    const res = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'PENDING' });
    expect(res.status).toBe(400);
  });

  it('400 on backward COMPLETED -> IN_PROGRESS', async () => {
    const row = await createOrderInStatus('COMPLETED', { order_no: 'WO-2026-0202' });
    const res = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(400);
  });

  it('400 on a bad status value (FOO)', async () => {
    const row = await createOrder();
    const res = await request(app)
      .patch(`/work-orders/${row.id}/status`)
      .send({ status: 'FOO' });
    expect(res.status).toBe(400);
  });

  it('400 when status is missing from the body', async () => {
    const row = await createOrder();
    const res = await request(app).patch(`/work-orders/${row.id}/status`).send({});
    expect(res.status).toBe(400);
  });

  it('404 for an unknown id (99999)', async () => {
    const res = await request(app)
      .patch('/work-orders/99999/status')
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(404);
  });
});
