'use strict';

const cfg = require('./config');
const {NodeClient} = require('hs-client');

exports.client = (options) => {
  const config = cfg.parse(options);
  const network = config.str('network', 'main');
  const client = new NodeClient({
    url: config.str('url'),
    apiKey: config.str('api-key'),
    ssl: config.bool('ssl'),
    host: config.str('http-host'),
    port: config.uint('http-port') || cfg.NODE_PORTS[network],
    timeout: config.uint('timeout', 0),
    limit: config.uint('limit', 10 * (1 << 30)) // 10 Gigs
  });

  return client;
};

exports.getNameByHash = (client, hash, height, tip) => {
  return client.get(`/nameinfo/${height}/hash/${hash}`, { tip });
};

exports.getNameByName = (client, name, height, tip) => {
  return client.get(`/nameinfo/${height}/name/${name}`, { tip });
};

exports.hasDumpPlugin = async (client) => {
  const res = await client.get('/has-dump-plugin');

  if (!res)
    return false;

  return res.has;
};
