'use strict';

const path = require('path');

const paths = exports;

paths.ROOT = path.dirname(__dirname);
paths.BIN = path.join(paths.ROOT, 'bin');

paths.dumpDir = (root, id) => {
  return path.join(root, 'dumps', `w-${id}`);
};

paths.namesDumpDir = (root, id) => {
  return paths.dumpDir(root, id);
};

paths.namesDumpFile = (root, id) => {
  return path.join(paths.namesDumpDir(root, id), 'names.json');
};

paths.coinsDumpDir = (root, id) => {
  return paths.dumpDir(root, id);
};

paths.coinsDumpFile = (root, id, account) => {
  if (!account || account === '-1')
    return path.join(paths.coinsDumpDir(root, id), 'coins.json');

  return path.join(paths.coinsDumpDir(root, id), `coins-${account}.json`);
};

paths.chainCoinsDumpFile = (root, id, account) => {
  if (!account || account === '-1')
    return path.join(paths.coinsDumpDir(root, id), 'chain-coins.json');

  return path.join(
    paths.coinsDumpDir(root, id),
    `chain-coins-${account}.json`
  );
};

paths.blocktimesFile = root => path.join(root, 'blocktimes.json');

// executables
paths.execs = {
  dump: path.join(paths.BIN, 'dump', 'dump'),
  dumpBlockTimes: path.join(paths.BIN, 'dump', 'dump-blocktimes')
};

paths.checkRevealsByCoinsDirs = (root, id) => {
  const dataDir = path.join(root, `check-reveals-${id}`);
  const fileCoins = paths.coinsDumpFile(root, id);

  return {
    dataDir,
    coins: fileCoins,
    filter: {
      expired: path.join(dataDir, '1-filter-expired.json'),
      needsRedeem: path.join(dataDir, '1-filter-needs-redeem.json'),
      needsRegister: path.join(dataDir, '1-filter-needs-register.json'),
      stillRevealing: path.join(dataDir, '1-filter-still-revealing.json'),
      unknown: path.join(dataDir, '1-filter-unknown.json')
    },
    status: {
      agedRedeems: path.join(dataDir, 'status-aged-redeems.json'),
      agedRegisters: path.join(dataDir, 'status-aged-registers.json')
    }
  };
};

paths.checkBidsByCoinsDirs = (root, id) => {
  const dataDir = path.join(root, `check-bids-${id}`);
  const fileCoins = paths.coinsDumpFile(root, id);

  return {
    dataDir,
    coins: fileCoins,

    filter: {
      lost: path.join(dataDir, '1-filter-lost-utxos.json'),
      needsReveal: path.join(dataDir, '1-filter-needs-reveal.json')
    },
    sort: {
      lostByHeight: path.join(dataDir, '2-lost-by-height.json'),
      revealByHrsLeft: path.join(dataDir, '2-reveal-by-hrs-left.json')
    },
    status: {
      revealRequests: path.join(dataDir, 'status-requests.json'),
      lostWithTime: path.join(dataDir, 'status-lost.json')
    }
  };
};

paths.checkExpiresByCoinsDirs = (root, id) => {
  const dataDir = path.join(root, `check-expires-${id}`);
  const fileCoins = paths.coinsDumpFile(root, id);

  return {
    dataDir,
    coins: fileCoins,
    filter: {
      expirable: path.join(dataDir, '1-filter-expirable.json')
    },
    sort: {
      expired: path.join(dataDir, '2-expired.json'),
      expiring: path.join(dataDir, '2-expiring.json'),
      details: path.join(dataDir, '2-details.json')
    },
    status: {
      renew: path.join(dataDir, 'status-renew.json'),
      transfer: path.join(dataDir, 'status-transfer.json'),
      reveal: path.join(dataDir, 'status-reveal.json')
    }
  };
};

paths.checkClaimsByCoinsDirs = (root, id) => {
  const dataDir = path.join(root, `check-claim-${id}`);
  const fileCoins = paths.coinsDumpFile(root, id);

  return {
    dataDir,
    coins: fileCoins,
    filter: {
      expirable: path.join(dataDir, '1-filter-expirable.json')
    },
    sort: {
      expiring: path.join(dataDir, '2-expiring.json')
    },
    status: {
      nameExpireBlocks: path.join(dataDir, 'status-expire-blocks.json')
    }
  };
};
