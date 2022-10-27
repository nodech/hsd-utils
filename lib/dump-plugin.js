/*!
 * dumps-plugin.js - Add custom dumps endpoint to hsw.
 * Copyright (c) 2022, Nodari Chkuaselidze (MIT License).
 * https://github.com/nodech/hsw-wallet-utils
 */

'use strict';

const Validator = require('bval');
const util = require('./util');
const common = require('hsd/lib/wallet/common');

class Plugin {
  constructor(node) {
    this.node = node;
    this.config = node.config;
    this.wallet = null;
    this.http = null;
    this.logger = node.logger.context('hsw-wallet-utils-name');

    this.isNode = node.chain ? true : false;
    this.isWalletNode = node.wdb ? true : false;
  }

  init() {
    if (this.isWalletNode)
      this.wallet = this.node;

    if (this.isNode && this.node.get('walletdb'))
      this.wallet = this.node.get('walletdb');

    if (!this.wallet)
      throw new Error('HSD Wallet not found.');

    this.http = this.wallet.http;
    this.wdb = this.wallet.wdb;
    this.network = this.wallet.network;
  }

  async open() {
    // We do this in the open, to make sure wdb was already set up.
    this.init();
    this.initRoutes();
  }

  async close() {
  }

  initRoutes() {
    this.http.get('/has-names-plugin', async (req, res) => {
      res.json(200, { has: true });
    });

    // ideally we could use buffer stream encoding version of json.
    // but this simple trick should work for this.
    this.http.get('/wallet/:id/dump-names', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const own = valid.bool('own', false);

      const height = this.wdb.height;
      const network = this.network;

      const names = await req.wallet.getNames();
      const items = [];

      for (const ns of names) {
        if (own) {
          const {hash, index} = ns.owner;
          const coin = await req.wallet.getCoin(hash, index);

          if (coin)
            items.push(ns.getJSON(height, network));
        } else {
          items.push(ns.getJSON(height, network));
        }
      }

      this.logger.debug(`Dumping ${items.length} names.`);
      res.buffer(200, util.encodeJSONarr(items, true));
    });

    this.http.get('/wallet/:id/dump-coins', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const acct = valid.str('account');
      const coins = await req.wallet.getCoins(acct);
      const result = [];

      common.sortCoins(coins);

      for (const coin of coins)
        result.push(coin.getJSON(this.network));

      this.logger.debug(`Dumping ${result.length} coins.`);
      res.json(200, util.encodeJSONarr(result, true));
    });
  }

  static init(node) {
    return new Plugin(node);
  }
}

Plugin.id = 'hsw-wallet-utils-names';

module.exports = Plugin;
