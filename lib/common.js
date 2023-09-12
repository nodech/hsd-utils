'use strict';

const paths = require('./paths');
const {readJSON} = require('./util');

const common = exports;

let _blockTimes = null;

common.getBlockTimeByHeight = async (root, height) => {
  if (!_blockTimes)
    _blockTimes = await readJSON(paths.blocktimesFile(root));

  return _blockTimes[height];
};
