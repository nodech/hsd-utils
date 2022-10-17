'use strict';

const Config = require('bcfg');
const hsd = require('hsd');
const Network = hsd.Network;

let CONFIGS = null;

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

exports.parseConfig = (options) => {
  if (CONFIGS)
    return CONFIGS;

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

  CONFIGS = config;
  return config;
};
