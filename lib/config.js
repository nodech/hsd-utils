'use strict';

const Config = require('bcfg');
const hsd = require('hsd');
const Network = hsd.Network;

exports.NODE_PORTS = {
  main: Network.get('main').rpcPort,
  testnet: Network.get('testnet').rpcPort,
  regtest: Network.get('regtest').rpcPort,
  simnet: Network.get('simnet').rpcPort
};

exports.WALLET_PORTS = {
  main: Network.get('main').walletPort,
  testnet: Network.get('testnet').walletPort,
  regtest: Network.get('regtest').walletPort,
  simnet: Network.get('simnet').walletPort
};

exports.parse = (options) => {
  const config = new Config('hsd', {
    suffix: 'network',
    fallback: 'main',
    alias: {
      'n': 'network',
      'u': 'url',
      'uri': 'url',
      'k': 'api-key',
      's': 'ssl',
      'h': 'httphost',
      'p': 'httpport'
    }
  });

  config.load({
    argv: true,
    env: true
  });

  if (options)
    config.inject(options);

  return config;
};

exports.configToENV = (config) => {
  const prefix = 'HSD_';
  const env = {};

  const all = {
    ...config.options,
    ...config.data,
    ...config.env,
    ...config.args
  };

  for (const [key, value] of Object.entries(all)) {
    if (typeof value !== 'number' && typeof value !== 'string')
      continue;

    env[prefix + key.toUpperCase()] = value;
  }

  return env;
};
