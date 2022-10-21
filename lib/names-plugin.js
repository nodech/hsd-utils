/*!
 * names-plugin.js - Add custom name dump endpoint to hsw.
 * Copyright (c) 2022, Nodari Chkuaselidze (MIT License).
 * https://github.com/nodech/hsw-wallet-utils
 */

'use strict';

const Validator = require('bval');
const util = require('./util');

class Plugin {
  constructor(node) {
    this.node = node;
    this.config = node.config;
    this.wallet = null;
    this.http = null;

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

      res.buffer(200, util.encodeJSONarr(items, true));
    });
  }

  static init(node) {
    return new Plugin(node);
  }
}

Plugin.id = 'hsw-wallet-utils-names';

module.exports = Plugin;
