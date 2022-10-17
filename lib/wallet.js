'use strict';

const cfg = require('./config');
const {WalletClient} = require('hs-client');

exports.walletClient = (options) => {
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
    limit: config.uint('limit', 1 << 30)
  });

  return client;
};

