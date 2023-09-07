'use strict';

const assert = require('bsert');

const ansi =  {
  ESC: '\u001b[',

  // ESC [
  CSI: '\u009b',

  // ESC P
  DCS: '\u0090',

  // ESC ]
  OSC: '\u009d'
};

ansi.cursor = {
  up: n => `${ansi.ESC}${n}A`,
  down: n => `${ansi.ESC}${n}B`,
  right: n => `${ansi.ESC}${n}C`,
  left: n => `${ansi.ESC}${n}D`,
  hide: `${ansi.ESC}?25l`,
  show: `${ansi.ESC}?25h`,
  sol: '\r'
};

ansi.erase = {
  line: `${ansi.ESC}2K`,
  eol: `${ansi.ESC}0K`,
  up: `${ansi.ESC}1J`,
  screen: `${ansi.ESC}2J`
};

// from: https://github.com/chalk/ansi-regex/
// eslint-ignore-next-function
function ansiRegex() {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|'
    + '[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
  ].join('|');

  return new RegExp(pattern, 'g');
}

ansi.stripAnsi = function stripAnsi(string) {
  return string.replace(ansiRegex(), '');
};

const FG_COLORS = {
  BLACK: 30,
  RED: 31,
  GREEN: 32,
  YELLOW: 33,
  BLUE: 34,
  MAGENTA: 35,
  CYAN: 36,
  WHITE: 37,

  // Bright color
  BLACK_BRIGHT: 90,
  GRAY: 90, // Alias of `BLACK_BRIGHT`
  GREY: 90, // Alias of `BLACK_BRIGHT`
  RED_BRIGHT: 91,
  GREEN_BRIGHT: 92,
  YELLOW_BRIGHT: 93,
  BLUE_BRIGHT: 94,
  MAGENTA_BRIGHT: 95,
  CYAN_BRIGHT: 96,
  WHITE_BRIGHT: 97
};

const FG_COLORS_BY_NO = swapKeyVal(FG_COLORS);

const BG_COLORS = {
  BLACK: 40,
  RED: 41,
  GREEN: 42,
  YELLOW: 43,
  BLUE: 44,
  MAGENTA: 45,
  CYAN: 46,
  WHITE: 47,

  // Bright color
  BLACK_BRIGHT: 100,
  GRAY: 100, // Alias of `BLACK_BRIGHT`
  GREY: 100, // Alias of `BLACK_BRIGHT`
  RED_BRIGHT: 101,
  GREEN_BRIGHT: 102,
  YELLOW_BRIGHT: 103,
  BLUE_BRIGHT: 104,
  MAGENTA_BRIGHT: 105,
  CYAN_BRIGHT: 106,
  WHITE_BRIGHT: 107
};

const BG_COLORS_BY_NO = swapKeyVal(BG_COLORS);

const colors = {
  FG: FG_COLORS,
  BG: BG_COLORS,
  FG_BY_NO: FG_COLORS_BY_NO,
  BG_BY_NO: BG_COLORS_BY_NO
};

colors.textColor = (color, text) => {
  if (!process.stdout.isTTY)
    return text;

  assert(colors.FG_BY_NO[color] != null, 'Invalid color');
  return `${ansi.ESC}${color}m${text}${ansi.ESC}0m`;
};

colors.bgColor = (color, text) => {
  if (!process.stdout.isTTY)
    return text;

  assert(colors.BG_BY_NO[color] != null, 'Invalid color');
  return `${ansi.ESC}${color}m${text}${ansi.ESC}0m`;
};

colors.startColor = (color) => {
  if (!process.stdout.isTTY)
    return '';

  if (typeof color === 'object')
    return `${ansi.ESC}${color.fg};${color.bg}m`;

  return `${ansi.ESC}${color}m`;
};

colors.endColor = () => {
  if (!process.stdout.isTTY)
    return '';

  return `${ansi.ESC}0m`;
};

colors.redText = text => colors.textColor(FG_COLORS.RED, text);
colors.greenText = text => colors.textColor(FG_COLORS.GREEN, text);
colors.yellowText = text => colors.textColor(FG_COLORS.YELLOW, text);

const symbols = {
  pipe: '|',
  bar: '▇'
};

const widgets = {};

widgets.barline = (options) => {
  const out = options.out || process.stdout;
  let width = options.width || 60;
  const total = options.total || 100;
  const items = options.items || [];
  const colorList = options.colors || [];
  const defaultBGColor = options.defaultBGColor || colors.BG.GRAY;
  const defaultText = options.defaultText || '';
  const subtractText = options.subtractText ?? true;
  const prefixColor = options.prefixColor || colors.FG.WHITE;
  const prefix = options.prefix || '';
  const suffixColor = options.suffixColor || colors.FG.WHITE;
  const suffix = options.suffix || '';
  const fill = options.fill ?? false;
  const nl = options.nl ?? true;

  let colorIndex = 0;

  const nextColor = () => {
    const color = colorList[colorIndex];
    colorIndex = (colorIndex + 1) % colorList.length;
    return {
      bg: color.bg,
      fg: color.fg
    };
  };

  assert(colors.BG_BY_NO[defaultBGColor], 'Invalid defaultBGColor');

  if (subtractText) {
    width -= prefix.length;
    width -= suffix.length;
  }

  const remainders = [];

  let totalCols = 0;
  let totalCount = 0;
  const pcItems = items.map((item) => {
    const percent = item.value / total;
    const cols = Math.floor(width * percent);
    const remainder = (width * percent) - cols;

    totalCount += item.value;
    totalCols += cols;

    const result = {
      percent: percent,
      cols: cols,
      text: item.text || ''
    };

    remainders.push({ remainder, result });
    return result;
  });

  assert(totalCount <= total, 'Total items is greater than total');

  if (fill) {
    remainders.sort((a, b) => {
      return b.remainder - a.remainder;
    });

    for (let i = 0; i < width - totalCols; i++) {
      if (!remainders[i])
        break;

      remainders[i].result.cols++;
    }
  }

  out.write(colors.textColor(prefixColor, prefix));

  let left = width;

  for (const item of pcItems) {
    const {bg, fg} = nextColor();
    // assert.
    colors.bgColor(bg);
    colors.textColor(fg);
    out.write(colors.startColor({ bg, fg }));

    for (let i = 0; i < item.cols; i++) {
      out.write(item.text[i] || ' ');
    }

    left -= item.cols;
    out.write(colors.endColor());
  }

  out.write(colors.startColor(defaultBGColor));

  for (let i = 0; i < left; i++) {
    out.write(defaultText[i] || ' ');
  }

  out.write(colors.endColor());
  out.write(colors.textColor(suffixColor, suffix));

  if (nl)
    out.write('\n');
};

widgets.block = (options) => {
  const out = options.out || process.stdout;
  const width = options.width || 60;
  const bgColor = options.bgColor || BG_COLORS.GRAY;
  const textColor = options.textColor || FG_COLORS.BLACK;
  const text = options.text || '';
  const nl = options.nl ?? true;

  out.write(colors.startColor({
    bg: bgColor,
    fg: textColor
  }));

  for (let i = 0; i < width; i++)
    out.write(text[i] || ' ');

  out.write(colors.endColor());

  if (nl)
    out.write('\n');
};

widgets.table = (options) => {
  const out = options.out || process.stdout;
  const width = options.width || 60;
  const headers = options.headers || [];
  const rows = options.rows || [];

  const results = [];
  const remainders = [];

  const center = (text, width) => {
    const len = text.length;
    const left = Math.floor((width - len) / 2);
    const right = width - len - left;

    return ' '.repeat(left) + text + ' '.repeat(right);
  };

  let totalCols = 0;
  for (const header of headers) {
    const percent = header.pc / 100;
    const cols = Math.floor(width * percent);
    const remainder = (width * percent) - cols;

    const result = {
      text: header.text,
      cols
    };

    remainders.push({ remainder, result });
    results.push(result);
    totalCols += cols;
  }

  remainders.sort((a, b) => {
    return b.remainder - a.remainder;
  });

  for (let i = 0; i < width - totalCols; i++) {
    if (!remainders[i])
      break;

    remainders[i].result.cols++;
  }

  for (const result of results) {
    const len = result.text.length;

    if (len > result.cols)
      result.text = result.text.slice(0, result.cols);

    out.write(center(result.text, result.cols));
  }

  for (const row of rows) {
    out.write('\n');

    for (const result of results) {
      const len = row[result.text].length;

      if (len > result.cols)
        row[result.text] = row[result.text].slice(0, result.cols);

      out.write(center(row[result.text], result.cols));
    }
  }

  out.write('\n');
};

widgets.overlapBox = (options) => {
  const out = options.out || process.stdout;
  const width = options.width || 60;
  const boxPercent = options.boxPercent || 0.5;
  const boxColor = options.boxColor || BG_COLORS.GRAY;
  const textColor = options.textColor || FG_COLORS.BLACK;
  const defaultTextColor = options.defaultTextColor || FG_COLORS.WHITE;
  const text = options.text || '';
  const nl = options.nl ?? true;

  const boxWidth = Math.floor(width * boxPercent);

  out.write(colors.startColor({
    bg: boxColor,
    fg: textColor
  }));

  for (let i = 0; i < boxWidth; i++)
    out.write(text[i] || ' ');

  out.write(colors.endColor());
  out.write(colors.startColor(defaultTextColor));

  for (let i = 0; i < width - boxWidth; i++)
    out.write(text[i + boxWidth] || ' ');

  if (nl)
    out.write('\n');
};

function swapKeyVal(object) {
  const result = {};

  for (const key of Object.keys(object))
    result[object[key]] = key;

  return result;
}

exports.widgets = widgets;
exports.ansi = ansi;
exports.color = colors;
exports.symbol = symbols;
