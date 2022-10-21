'use strict';

const assert = require('bsert');

const NEW_LINE = 0x0a;
const OPEN_SQ_BRACKET = 0x5b;
const CLOSE_SQ_BRACKET = 0x5d;
const COMMA = 0x2c;

/*
 * Just simple enough encoder so we don't
 * have to implement json stream encode/decoder.
 *
 * Endpoints which return this much data, need to be
 * deprecated.
 */

exports.encodeJSONarr = (arr, lines) => {
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

  const lastChunk = chunks[chunks.length - 1];
  lastChunk[lastChunk.length - 2] = NEW_LINE;
  lastChunk[lastChunk.length - 1] = CLOSE_SQ_BRACKET;

  return Buffer.concat(chunks);
};

exports.decodeJSONarr = (arrbuf, lines) => {
  if (!lines)
    return JSON.parse(arrbuf);

  assert(Buffer.isBuffer(arrbuf), 'decodeJSONarr only works on buffers');

  if (arrbuf[0] !== OPEN_SQ_BRACKET || arrbuf[1] !== NEW_LINE)
    throw new Error('Incorrect encoding.');

  const result = [];
  let last = 2;
  let i = 2;

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

  if (arrbuf[last] !== NEW_LINE && arrbuf[last + 1] !== CLOSE_SQ_BRACKET)
    throw new Error('Incorrect encoding.');

  return result;
};
