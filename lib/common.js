'use strict';

const path = require('path');

const common = exports;

common.ROOT = path.dirname(__dirname);
common.BIN = path.join(common.ROOT, 'bin');

common.dumpDir = (root, id) => {
  return path.join(root, 'dumps', `w-${id}`);
};

common.namesDumpDir = (root, id) => {
  return common.dumpDir(root, id);
};

common.namesDumpFile = (root, id) => {
  return path.join(common.namesDumpDir(root, id), 'names.json');
};

common.coinsDumpDir = (root, id) => {
  return common.dumpDir(root, id);
};

common.coinsDumpFile = (root, id, account) => {
  if (!account || account === '-1')
    return path.join(common.coinsDumpDir(root, id), 'coins.json');

  return path.join(common.coinsDumpDir(root, id), `coins-${account}.json`);
};

common.chainCoinsDumpFile = (root, id, account) => {
  if (!account || account === '-1')
    return path.join(common.coinsDumpDir(root, id), 'chain-coins.json');

  return path.join(
    common.coinsDumpDir(root, id),
    `chain-coins-${account}.json`
  );
};

common.blocktimesFile = root => path.join(root, 'blocktimes.json');

// executables
common.execs = {
  dump: path.join(common.BIN, 'dump'),
  dumpBlockTimes: path.join(common.BIN, 'dump-blocktimes')
};
