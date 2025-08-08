'use strict';

const rc = require('bslintrc');

module.exports = [
  rc.configs.recommended,
  rc.configs.bcoin,
  {
    languageOptions: {
      globals: {
        ...rc.globals.node
      },
      ecmaVersion: 'latest'
    }
  },
  {
    files: [
      'bin/coinstates/get-coin-info',
      'bin/dump/dump',
      'bin/dump/dump-blocktimes',
      'bin/dump/dump-coins-low',
      'bin/get-wallets',
      'bin/monitor/check-status',
      'bin/monitor/check-status-render',
      'bin/namestates/chain-check-opens-unowned',
      'bin/namestates/check-bids',
      'bin/namestates/check-claims',
      'bin/namestates/check-crosses',
      'bin/namestates/check-expires',
      'bin/namestates/check-expires',
      'bin/namestates/check-expires-by-namestate',
      'bin/namestates/check-opens-unowned',
      'bin/namestates/check-reveals',
      'bin/namestates/check-reveals-by-namestate',
      'bin/namestates/get-owned-names',
      'bin/tx/fee-stats',
      'bin/wallet-management/check-gaps',
      'bin/wallet-management/check-gaps-low',
      'bin/wallet-management/derive-addr',
      'bin/wallet-management/derive-wallet',
      'bin/wallet-management/dump-blinds-low',
      'bin/wallet-management/import-bids-blinddump',
      'bin/wallet-management/import-bids-dump',
      'bin/wallet-management/wallet-mgr',
      '**/*.js',
      '*.js'
    ],
    languageOptions: {
      sourceType: 'commonjs'
    }
  },
  {
    files: ['test/{,**/}*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...rc.globals.mocha,
        register: 'readable'
      }
    },
    rules: {
      'max-len': 'off',
      'prefer-arrow-callback': 'off',
      'no-return-assign': 'off'
    }
  }
];
