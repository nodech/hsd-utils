'use strict';

const paths = require('./paths');
const os = require('os');
const node = require('./node');
const util = require('./util');
const {readJSON} = util;
const cfg = require('./config');
const {Network} = require('hsd');

const common = exports;

let _blockTimes = null;

common.getBlockTimeByHeight = async (root, height) => {
  if (!_blockTimes)
    _blockTimes = await readJSON(paths.blocktimesFile(root));

  return _blockTimes[height];
};

common.setupConfigs = async (help) => {
  const config = cfg.parse();

  const id = config.str(0);

  if (!id) {
    help();
    process.exit(2);
  }

  const client = node.client();
  const network = Network.get(config.get('network', 'main'));

  if (config.bool('help', false))
    help();

  return {
    id,
    config,
    network,
    nodeClient: client
  };
};

common.setupChecker = async (help) => {
  const config = cfg.parse();

  const id = config.str(0);

  if (!id) {
    help();
    process.exit(2);
  }

  const client = node.client();

  const dataRoot = config.str('data-dir', os.tmpdir());
  const network = Network.get(config.get('network', 'main'));

  let tip = config.uint('tip-height', -1);

  if (tip === -1)
    tip = (await client.getInfo()).chain.height;

  const step = config.str(1, 'all');
  const fthrough = config.bool('all', false);

  return {
    config,
    fthrough,
    id,
    network,
    step,
    tip,
    root: dataRoot,
    nodeClient: client
  };
};

common.dumpCoins = async (config, id) => {
  console.log(`Getting wallet coins for ${id}`);

  const env = cfg.configToENV(config);

  await Promise.all([
    util.spawn(paths.execs.dumpBlockTimes, null, { env }),
    util.spawn(paths.execs.dump, ['coins', id], { env })
  ]);
};
