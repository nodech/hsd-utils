'use strict';

const assert = require('bsert');
const fs = require('bfile');
const nutil = require('util');
const cp = require('child_process');
const exec = nutil.promisify(cp.exec);

const NEW_LINE = 0x0a;
const OPEN_SQ_BRACKET = 0x5b;
const CLOSE_SQ_BRACKET = 0x5d;
const COMMA = 0x2c;

const util = exports;

/*
 * Just simple enough encoder so we don't
 * have to implement json stream encode/decoder.
 *
 * Endpoints which return this much data, need to be
 * deprecated.
 */

util.encodeJSONarr = (arr, lines) => {
  if (!lines)
    return JSON.stringify(arr);

  assert(Array.isArray(arr), 'encodeJSONarr only works only on arrays.');
  const chunks = [
    Buffer.from('[\n')
  ];

  for (const el of arr) {
    const encoded = Buffer.from(JSON.stringify(el) + ',\n', 'utf8');
    chunks.push(encoded);
  }

  if (chunks.length === 1) {
    chunks.push(Buffer.from(']'));
  } else {
    const lastChunk = chunks[chunks.length - 1];
    lastChunk[lastChunk.length - 2] = NEW_LINE;
    lastChunk[lastChunk.length - 1] = CLOSE_SQ_BRACKET;
  }

  return Buffer.concat(chunks);
};

util.decodeJSONarr = (arrbuf, lines) => {
  if (!lines)
    return JSON.parse(arrbuf);

  assert(Buffer.isBuffer(arrbuf), 'decodeJSONarr only works on buffers');

  if (arrbuf[0] !== OPEN_SQ_BRACKET || arrbuf[1] !== NEW_LINE)
    throw new Error('Incorrect encoding.');

  const result = [];
  let last = 2;
  let i = 2;

  if (arrbuf.length === 3)
    last = 1;

  for (; i < arrbuf.length - 1; i++) {
    if (arrbuf[i] !== NEW_LINE)
      continue;

    if (arrbuf[i - 1] !== COMMA) {
      const buf = arrbuf.slice(last, i);
      result.push(JSON.parse(buf.toString('utf8')));
      last = i;
      break;
    }

    const buf = arrbuf.slice(last, i - 1);
    result.push(JSON.parse(buf.toString('utf8')));
    last = i;
  }

  if (arrbuf[last] !== NEW_LINE || arrbuf[last + 1] !== CLOSE_SQ_BRACKET)
    throw new Error('Incorrect encoding.');

  return result;
};

util.writeJSON = (file, arr, lines) => {
  return fs.writeFile(file, util.encodeJSONarr(arr, lines));
};

util.readJSON = async (file, lines) => {
  return util.decodeJSONarr(await fs.readFile(file), lines);
};

util.exec = async (command, options) => {
  if (Array.isArray(command))
    command = command.join(' ');

  try {
    const {stdout, stderr} = await exec(command, options);

    if (options && options.logger)
      console.error(stderr);

    return stdout;
  } catch (e) {
    throw new Error(`${command} failed. \n${e.stderr}.`);
  }
};

util.spawn = async (command, args, options) => {
  const cmd = cp.spawn(command, args, options);

  cmd.stdout.pipe(process.stdout, { end: false });
  cmd.stderr.pipe(process.stderr, { end: false });

  const handleError = (err) => {
    console.error(err);
    console.error('Unhandler error from cmd.');
    process.exit(3);
  };

  cmd.on('error', handleError);

  const cleanup = () => {
    cmd.stdout.unpipe(process.stdout);
    cmd.stdout.unpipe(process.stderr);

    cmd.removeListener('error', handleError);
  };

  return new Promise((resolve, reject) => {
    cmd.once('close', (code) => {
      if (code !== 0) {
        cleanup();
        reject(new Error(`Command ${command} failed.`));
        return;
      }

      cleanup();
      resolve();
    });
  });
};

/**
 * Returns directory size in KB.
 * @param {String} path
 * @returns {Promise<Number>}
 */

util.du = async (path) => {
  assert(await fs.exists(path), `"${path}" does not exist.`);

  const out = await util.exec(['du --block-size=1024 -s', path]);

  return parseInt(out, 10);
};

util.logPercent = (n, total, step) => {
  if (n % step === 0) {
    const perc = (n * 100 / total).toFixed(2);
    return perc;
  }

  return null;
};

util.sizeUnits = (sizeKB) => {
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  const base = 1024;

  let value = sizeKB;
  let unitIndex = 0;

  while (value >= base && unitIndex < units.length - 1) {
    value /= base;
    unitIndex++;
  }

  const roundedValue = value.toFixed(2);

  return `${roundedValue} ${units[unitIndex]}`;
};

util.timeUnits = (time) => {
  const units = ['s', 'm', 'h'];
  const base = 60;

  let value = time;
  let unitIndex = 0;

  while (value >= base && unitIndex < units.length - 1) {
    value /= base;
    unitIndex++;
  }

  const roundedValue = value.toFixed(2);

  return `${roundedValue} ${units[unitIndex]}`;
};

util.amount = (doos) => {
  return `${(doos / 1e6).toFixed(6)} HNS`;
};

util.splitArray = (arr, size) => {
  const res = [];

  for (let i = 0; i < arr.length; i += size)
    res.push(arr.slice(i, i + size));

  return res;
};
