/*!
 * dumps-plugin.js - Add custom dumps endpoint to hsw.
 * Copyright (c) 2022, Nodari Chkuaselidze (MIT License).
 * https://github.com/nodech/hsw-wallet-utils
 */

'use strict';

const assert = require('bsert');
const Validator = require('bval');
const util = require('./util');
const {Rules, Namestate} = require('hsd');
const common = require('hsd/lib/wallet/common');

class Plugin {
  constructor(node) {
    this.node = node;
    this.config = node.config;
    this.wallet = null;
    this.nodeHTTP = null;
    this.walletHTTP = null;
    this.logger = node.logger.context('hsw-wallet-utils-name');

    this.isNode = node.chain ? true : false;
    this.isWalletNode = node.wdb ? true : false;
  }

  init() {
    if (this.isWalletNode)
      throw new Error('Needs wallet in plugin mode.');

    assert(this.isNode);

    if (this.isNode && this.node.get('walletdb'))
      this.wallet = this.node.get('walletdb');

    if (!this.wallet)
      throw new Error('HSD Wallet not found.');

    this.walletHTTP = this.wallet.http;
    this.nodeHTTP = this.node.http;
    this.wdb = this.wallet.wdb;
    this.network = this.node.network;
  }

  async open() {
    // We do this in the open, to make sure wdb was already set up.
    this.init();
    this.initChainRoutes();
    this.initWalletRoutes();
  }

  async close() {
  }

  async getNameByHash(nameHash, height, tipHeight) {
    const db = this.node.chain.db;
    const next = Math.min(
      height + this.network.names.treeInterval,
      tipHeight
    );
    const entry = await db.getEntryByHeight(next);

    if (!entry)
      return null;

    const data = await db.lookup(entry.treeRoot, nameHash);

    if (!data)
      return null;

    const ns = Namestate.decode(data);
    ns.nameHash = nameHash;
    return ns;
  }

  initChainRoutes() {
    this.nodeHTTP.get('/has-dump-plugin', async (req, res) => {
      res.json(200, { has: true });
    });

    this.nodeHTTP.get('/nameinfo/:height/hash/:hash', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const hash = valid.bhash('hash');
      const height = valid.int('height');
      const tipHeight = valid.int('tip', height);

      if (!hash || !height)
        throw new Error('Needs hash and height');

      const ns = await this.getNameByHash(hash, height, tipHeight);

      // We are not interested in expiry checks here, because of the tip.
      // ns.isExpired(checkTip, this.network)
      if (!ns || ns.isExpired(height, this.network))
        return res.json(404);

      return res.json(200, ns.getJSON(tipHeight, this.network.type));
    });

    this.nodeHTTP.get('/nameinfo/:height/name/:name', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const name = valid.str('name');
      const height = valid.int('height');
      const tipHeight = valid.int('tip', height);

      if (!name || !height)
        throw new Error('Needs name and height');

      const hash = Rules.hashName(name);
      const ns = await this.getNameByHash(hash, height, tipHeight);

      // We are not interested in expiry checks here, because of the tip.
      // ns.isExpired(checkTip, this.network)
      if (!ns || ns.isExpired(height, this.network))
        return res.json(404);

      return res.json(200, ns.getJSON(tipHeight, this.network.type));
    });
  }

  initWalletRoutes() {
    this.walletHTTP.get('/has-dump-plugin', async (req, res) => {
      res.json(200, { has: true });
    });

    // ideally we could use buffer stream encoding version of json.
    // but this simple trick should work for this.
    this.walletHTTP.get('/wallet/:id/dump-names', async (req, res) => {
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

    this.walletHTTP.get('/wallet/:id/dump-coins', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const acct = valid.str('account');
      const coins = await req.wallet.getCoins(acct);
      const items = [];

      common.sortCoins(coins);

      for (const coin of coins)
        items.push(coin.getJSON(this.network));

      this.logger.debug(`Dumping ${items.length} coins.`);
      res.buffer(200, util.encodeJSONarr(items, true));
    });

    this.walletHTTP.get('/wallet/:id/owns-name/:name', async (req, res) => {
      const valid = Validator.fromRequest(req);
      const name = valid.str('name');

      assert(name, 'Must pass name.');
      assert(Rules.verifyName(name), 'Must pass valid name.');

      const height = this.wdb.height;
      const network = this.network;
      const wallet = req.wallet;
      const notFound = () => res.json(
        404,
        { message: `${name} not found in wallet ${wallet.id}` }
      );

      const ns = await wallet.getNameStateByName(name);
      if (!ns)
        return notFound();

      const tx = await wallet.getTX(ns.owner.hash);
      if (!tx)
        return notFound();

      const details = await wallet.toDetails(tx);
      const ownerOutput = details.outputs[ns.owner.index];

      if (await wallet.hasAddress(ownerOutput.address)) {
        return res.json(200, ns.getJSON(height, network));
      }

      return notFound();
    });
  }

  static init(node) {
    return new Plugin(node);
  }
}

Plugin.id = 'hsd-dump-utils';

module.exports = Plugin;
