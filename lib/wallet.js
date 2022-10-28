'use strict';

const assert = require('bsert');
const brq = require('brq');
const Path = require('path').posix;
const cfg = require('./config');
const {WalletClient} = require('hs-client');
const util = require('./util');

const wallet = exports;

wallet.client = (options) => {
  const config = cfg.parse(options);
  const network = config.str('network', 'main');
  const client = new WalletClient({
    url: config.str('url'),
    apiKey: config.str('api-key'),
    ssl: config.bool('ssl'),
    host: config.str('http-host'),
    port: config.uint('http-port') || cfg.WALLET_PORTS[network],
    timeout: config.uint('timeout', 0),
    token: config.str('token', ''),
    limit: config.uint('limit', 10 * (1 << 30)) // 10 Gigs
  });

  return client;
};

wallet.request = async (client, method, endpoint, params) => {
  assert(typeof method === 'string');
  assert(typeof endpoint === 'string');

  let query = null;

  if (params == null)
    params = {};

  assert(params && typeof params === 'object');

  if (this.token)
    params.token = this.token;

  if (method === 'GET') {
    query = params;
    params = null;
  }

  const res = await brq({
    method: method,
    ssl: client.ssl,
    strictSSL: client.strictSSL,
    host: client.host,
    port: client.port,
    path: Path.join(client.path, endpoint),
    username: client.username,
    password: client.password,
    headers: client.headers,
    timeout: client.timeout,
    limit: client.limit,
    query: query,
    pool: true,
    json: params
  });

  if (res.statusCode === 404)
    return null;

  if (res.statusCode === 401)
    throw new Error('Unauthorized (bad API key).');

  if (res.statusCode !== 200)
    throw new Error(`Status code: ${res.statusCode}.`);

  return res;
};

wallet.hasDumpPlugin = async (client) => {
  const res = await client.get('/has-names-plugin');

  if (!res)
    return null;

  return res.has;
};

wallet.dumpOwnNames = (client, id) => {
  return client.get(`/wallet/${id}/name`, { own: true });
};

wallet.dumpOwnNamesPlug = async (client, id) => {
  const res = await wallet.request(
    client,
    'GET',
    `/wallet/${id}/dump-names`,
    { own: true }
  );

  if (!res)
    throw new Error('Could not find plugin endpoint.');

  return util.decodeJSONarr(res.buffer(), true);
};

wallet.dumpCoins = (client, id, account) => {
  return client.get(`/wallet/${id}/coin`, { account });
};

wallet.dumpCoinsPlug = async (client, id, account) => {
  const res = await wallet.request(
    client,
    'GET',
    `/wallet/${id}/dump-coins`,
    { account }
  );

  if (!res)
    throw new Error('Could not find plugin endpoint.');

  return util.decodeJSONarr(res.buffer(), true);
};

wallet.getAuctionInfo = async (client, id, name) => {
  return client.get(`/wallet/${id}/auction/${name}`);
};
