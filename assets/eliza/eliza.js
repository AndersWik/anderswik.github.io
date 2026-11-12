// ELIZA - a JavaScript reimplementation of Joseph Weizenbaum's program
// (MIT, 1964-1966). It follows the algorithm in his 1966 CACM paper:
//
//  1. The input is scanned left to right. Each word that has an entry in the
//     script may be replaced by its substitute (I -> YOU, MY -> YOUR, ...),
//     and if the entry has rules it goes on the "keystack", highest rank first.
//  2. A comma, period or BUT ends the sentence if a keyword has been found;
//     otherwise the text before it is thrown away and scanning continues.
//  3. The top keyword's decomposition rules are tried in order. The first one
//     that matches selects a reassembly rule; reassembly rules are used in
//     rotation, so ELIZA does not repeat itself immediately.
//  4. If the keyword is the MEMORY keyword (MY), a transformed copy of the
//     input is also saved. When later input contains no keyword, ELIZA may
//     bring it back ("EARLIER YOU SAID YOUR ...").
//  5. With no keyword at all, the NONE rules are used.
//
// The engine knows nothing about psychotherapy: all of that is in the script
// (see doctor.js), which is passed to the constructor as text.

(function (global) {
  'use strict';

  // ---- Script parser -------------------------------------------------------

  function tokenize(text) {
    return text.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').split(/\s+/).filter(Boolean);
  }

  function readLists(text) {
    const tokens = tokenize(text);
    let pos = 0;
    function read() {
      const token = tokens[pos++];
      if (token === ')') throw new Error('ELIZA script: unexpected ")"');
      if (token !== '(') return token;
      const list = [];
      while (tokens[pos] !== ')') {
        if (pos >= tokens.length) throw new Error('ELIZA script: missing ")"');
        list.push(read());
      }
      pos++;
      return list;
    }
    const items = [];
    while (pos < tokens.length) items.push(read());
    return items;
  }

  // (=KEY) or (= KEY) -> "KEY"
  function linkTarget(list) {
    if (!Array.isArray(list) || typeof list[0] !== 'string' || list[0][0] !== '=') return null;
    return list[0] === '=' ? list[1] : list[0].slice(1);
  }

  function parsePattern(list) {
    return list.map(function (el) {
      if (Array.isArray(el)) {
        const words = el.join(' ');
        if (words[0] === '*') return { alternatives: words.slice(1).split(' ').filter(Boolean) };
        if (words[0] === '/') return { tags: words.slice(1).split(' ').filter(Boolean) };
        throw new Error('ELIZA script: bad pattern element (' + words + ')');
      }
      if (el === '0') return { any: true };
      if (/^\d+$/.test(el)) return { count: Number(el) };
      return { word: el };
    });
  }

  function parseEntry(e) {
    const entry = { word: e[0], substitute: null, rank: 0, tags: [], rules: [] };
    let i = 1;
    if (e[i] === '=') { entry.substitute = e[i + 1]; i += 2; }
    if (/^\d+$/.test(e[i])) { entry.rank = Number(e[i]); i++; }
    if (e[i] === 'DLIST') {
      entry.tags = e[i + 1].join(' ').replace(/\//g, ' ').split(' ').filter(Boolean);
      i += 2;
    }
    for (; i < e.length; i++) {
      const rule = e[i];
      // A bare (=KEY) at rule level means "for anything else, use KEY's rules".
      const decomposition = linkTarget(rule) ? ['0'] : rule[0];
      const reassembly = linkTarget(rule) ? [rule] : rule.slice(1);
      entry.rules.push({ pattern: parsePattern(decomposition), reassembly: reassembly, next: 0 });
    }
    return entry;
  }

  // (MEMORY MY (0 YOUR 0 = LETS DISCUSS FURTHER WHY YOUR 3) ...)
  function parseMemory(e) {
    return {
      keyword: e[1],
      rules: e.slice(2).map(function (rule) {
        const eq = rule.indexOf('=');
        return { pattern: parsePattern(rule.slice(0, eq)), reassembly: rule.slice(eq + 1) };
      })
    };
  }

  function parseScript(text) {
    const items = readLists(text.toUpperCase());
    const script = { greeting: items[0].join(' '), entries: {}, memory: null };
    for (let i = 1; i < items.length; i++) {
      const e = items[i];
      if (!Array.isArray(e) || e.length === 0) continue; // START and the closing ()
      if (e[0] === 'MEMORY') script.memory = parseMemory(e);
      else script.entries[e[0]] = parseEntry(e);
    }
    if (!script.entries.NONE) throw new Error('ELIZA script: no NONE entry');
    return script;
  }

  // ---- Pattern matching ----------------------------------------------------

  // Returns one array of words per pattern element, or null if no match.
  function match(pattern, words, tagsOf) {
    const parts = [];
    function step(p, w) {
      if (p === pattern.length) return w === words.length;
      const el = pattern[p];
      if (el.any) {
        for (let n = 0; w + n <= words.length; n++) {
          parts[p] = words.slice(w, w + n);
          if (step(p + 1, w + n)) return true;
        }
        return false;
      }
      if (el.count) {
        if (w + el.count > words.length) return false;
        parts[p] = words.slice(w, w + el.count);
        return step(p + 1, w + el.count);
      }
      if (w >= words.length) return false;
      const word = words[w];
      const ok = el.word ? word === el.word
        : el.alternatives ? el.alternatives.indexOf(word) >= 0
        : el.tags.some(function (t) { return tagsOf(word).indexOf(t) >= 0; });
      if (!ok) return false;
      parts[p] = [word];
      return step(p + 1, w + 1);
    }
    return step(0, 0) ? parts : null;
  }

  function reassemble(template, parts) {
    const out = [];
    template.forEach(function (atom) {
      if (/^\d+$/.test(atom)) out.push.apply(out, parts[Number(atom) - 1] || []);
      else out.push(atom);
    });
    return out;
  }

  function hash(word) {
    let h = 0;
    for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) >>> 0;
    return h;
  }

  // ---- The program ---------------------------------------------------------

  function Eliza(scriptText) {
    this.script = parseScript(scriptText);
    this.memory = [];
    this.limit = 1;
  }

  Eliza.prototype.greeting = function () {
    return this.script.greeting;
  };

  Eliza.prototype.tagsOf = function (word) {
    const entry = this.script.entries[word];
    return entry ? entry.tags : [];
  };

  Eliza.prototype.respond = function (input) {
    const entries = this.script.entries;
    this.limit = this.limit % 4 + 1;

    const tokens = input.toUpperCase()
      .replace(/[‘’]/g, "'")
      .replace(/[,]/g, ' , ')
      .replace(/[.?!;:]/g, ' . ')
      .replace(/[^A-Z0-9',. ]/g, ' ')
      .split(/\s+/).filter(Boolean);

    // Scan for keywords and make substitutions.
    const keystack = [];
    let words = [];
    for (const token of tokens) {
      if (token === ',' || token === '.' || token === 'BUT') {
        if (keystack.length) break;
        words = [];
        continue;
      }
      const entry = entries[token];
      if (entry && entry.rules.length) {
        if (!keystack.length || entry.rank > keystack[0].rank) keystack.unshift(entry);
        else keystack.push(entry);
      }
      words.push(entry && entry.substitute ? entry.substitute : token);
    }

    if (keystack.length && this.script.memory && keystack[0].word === this.script.memory.keyword) {
      this.remember(words);
    }

    let entry = keystack.shift();
    for (let guard = 0; entry && guard < 100; guard++) {
      const result = this.transform(entry, words);
      if (result.reply) return result.reply;
      if (result.pre) words = result.pre;
      entry = result.link ? entries[result.link] : keystack.shift();
    }
    return this.noKeyword(words);
  };

  // Apply one keyword's rules. Returns {reply}, {link}, {link, pre} or {} for NEWKEY.
  Eliza.prototype.transform = function (entry, words) {
    const tagsOf = this.tagsOf.bind(this);
    for (const rule of entry.rules) {
      const parts = match(rule.pattern, words, tagsOf);
      if (!parts) continue;
      const template = rule.reassembly[rule.next];
      rule.next = (rule.next + 1) % rule.reassembly.length;

      const link = linkTarget(template);
      if (link) return { link: link };
      if (template.length === 1 && template[0] === 'NEWKEY') return {};
      if (template[0] === 'PRE') return { pre: reassemble(template[1], parts), link: linkTarget(template[2]) };
      return { reply: format(reassemble(template, parts)) };
    }
    return {};
  };

  Eliza.prototype.remember = function (words) {
    const rules = this.script.memory.rules;
    const rule = rules[hash(words[words.length - 1] || '') % rules.length];
    const parts = match(rule.pattern, words, this.tagsOf.bind(this));
    if (parts) this.memory.push(format(reassemble(rule.reassembly, parts)));
  };

  Eliza.prototype.noKeyword = function (words) {
    if (this.limit === 4 && this.memory.length) return this.memory.shift();
    return this.transform(this.script.entries.NONE, words).reply;
  };

  function format(words) {
    return words.join(' ').replace(/ ,/g, ',').replace(/ \./g, '.');
  }

  Eliza.parseScript = parseScript;
  global.Eliza = Eliza;
  if (typeof module !== 'undefined') module.exports = Eliza;
})(typeof window !== 'undefined' ? window : globalThis);
