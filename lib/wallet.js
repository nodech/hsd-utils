'use strict';

const assert = require('bsert');
const brq = require('brq');
const Path = require('path').posix;
const cfg = require('./config');
const {WalletClient} = require('hs-client');

exports.client = (options) => {
  const config = cfg.parseConfig(options);
  const network = config.str('network', 'main');
  const client = new WalletClient({
    url: config.str('url'),
    apiKey: config.str('api-key'),
    ssl: config.bool('ssl'),
    host: config.str('http-host'),
    port: config.uint('http-port') || cfg.WALLET_PORTS[network],
    timeout: config.uint('timeout', 0),
    token: config.str('token', ''),
    limit: config.uint('limit', 5 (1 << 30)) // 10 Gigs
  });

  return client;
};

exports.request = async (client, method, endpoint, params) => {
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
