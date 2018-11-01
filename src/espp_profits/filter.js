/**
 * Demo: http://vpalos.com/sandbox/filter.js/
 *
 * A generic search algorithm designed for filtering (very) large lists of strings; when an input string
 * contains all the parts (words or characters; whitespace is ignored) of the query, spread-out over the text
 * then the string is considered to be a match. It works with the way internet browsers (e.g. Firefox, Google
 * Chrome) filter address-bar suggestions on user input. It is also quite fast; on my i7 laptop, filtering
 *     1) a list of ~23000 items takes around 50ms (yes, milliseconds!);
 *     2) a list of ~1 million text items took under 1 second.
 * It works both in NodeJS as well as in browser environments (so far I only tested FF and GC).
 *
 * It has two functioning modes:
 * 1) word-mode: each (whitespace-separated) word in the input query must be found **whole** in the text:
 *     e.g. "foo bar" will match "123foo456bar789" but not "f oo ba r";
 * 2) charater-mode: the input query is matched per-character (whitespace is completely ignored):
 *     e.g. "foo bar" will match "f o o b a r" and even "-f.oo-ba.r-".
 *
 * Options (values below are the defaults):
 * {
 *     "case": false,               // true: case-sensitive
 *                                  // false: case-insensitive
 *
 *     "mark": true,                // true: returns item numbers + matches with highlighted captures
 *                                  // false: returns item numbers only
 *
 *     "prefix": "<strong>",        // highlight prefix string
 *     "suffix": "</strong>",       // highlight suffix string
 *
 *     "word": true,                // true: whole-word mode
 *                                  // false: character mode
 *
 *     "limit": 0                   // limit results to this amount
 *                                  // 0 means return the whole result (unlimited)
 * }
 *
 * @param {string} query The search query, consisting of space-separated chunks of characters.
 * @param {string|array} items A string or an array of strings to filter; if a string is given then it is
 *                             first split into an array of individual lines of text and then filtered (note
 *                             that).
 * @param {string} prefix String which will come before every highlighted substring (i.e. capture).
 * @param {string} suffix String which will come after every highlighted substring (i.e. capture).
 * @return {object} Returns the following object with matched items information:
 *                  {
 *                      "items": [...],     // array of matched item-numbers
 *                      "marks": [...]      // if mark == true, array of matches with highlighted captures
 *                  }
 */
export default function filter(query, items, options) {
  // option producer
  function option(name, value) {
    options = options || {};
    return typeof options[name] !== 'undefined' ? options[name] : value;
  }

  // prepare options
  var o_case = option('case', false);
  var o_mark = option('mark', true);
  var o_prefix = option('prefix', '<strong>');
  var o_suffix = option('suffix', '</strong>');
  var o_word = option('word', true);
  var o_limit = option('limit', 0);

  // prepare query
  query = o_case ? query : query.toLowerCase();
  query = query.replace(/\s+/g, o_word ? ' ' : '');
  query = query.replace(/(^\s+|\s+$)/g, '');
  query = query.split(o_word ? ' ' : '');
  var ql = query.length;

  // prepare items
  if (typeof items === 'string') {
    items = items.split('\n');
  }

  // prepare results
  var matches = {
    items: [],
    marks: [],
  };

  // search
  for (var ii = 0, il = items.length; ii < il; ii++) {
    // prepare text
    var text = o_case ? items[ii] : items[ii].toLowerCase();
    var mark = '';

    // traverse
    var ti = 0;
    var wi = 0;
    var wl = 0;
    for (var qi = 0; qi < ql; qi++) {
      wl = query[qi].length;
      wi = text.indexOf(query[qi], ti);
      if (wi === -1) {
        break;
      }
      if (o_mark) {
        if (wi > 0) {
          mark += items[ii].slice(ti, wi);
        }
        mark += o_prefix + items[ii].slice(wi, wi + wl) + o_suffix;
      }
      ti = wi + wl;
    }

    // capture
    if (qi === ql) {
      if (o_mark) {
        mark += items[ii].slice(ti);
        matches.marks.push(mark);
      }
      if (matches.items.push(ii) === o_limit && o_limit) {
        break;
      }
    }
  }

  // ready
  return matches;
}
