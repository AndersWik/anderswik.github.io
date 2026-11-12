/*
 * ELIZA - a JavaScript version of Joseph Weizenbaum's program (MIT, 1966).
 * It follows the algorithm in his paper in Communications of the ACM:
 *
 *  1. The input is read word by word. A word that is in the script may be
 *     swapped for another (I -> YOU, MY -> YOUR), and if it is a keyword it
 *     goes on the "keystack", the most important (highest rank) first.
 *  2. A comma, period or BUT ends the sentence if a keyword has been found.
 *     If not, the words before it are thrown away and reading goes on.
 *  3. The rules of the top keyword are tried in order. The first pattern
 *     that matches picks an answer. The answers are used in turn, so ELIZA
 *     doesn't say the same thing twice in a row.
 *  4. When the top keyword is MY, a changed copy of the input is also saved.
 *     Later, when an input has no keyword, ELIZA may bring it back:
 *     "EARLIER YOU SAID YOUR ...".
 *  5. With no keyword at all, the NONE rules are used.
 *
 * The program knows nothing about therapy. All of that is in the script
 * (doctor.js), which is given to the constructor as text.
 */

// --- Reading the script ---------------------------------------------------
//
// The script is written as nested lists in brackets, like Lisp:
//   (SORRY ((0) (PLEASE DON'T APOLOGIZE) (APOLOGIES ARE NOT NECESSARY)))
// readLists() turns that text into JavaScript arrays:
//   ["SORRY", [["0"], ["PLEASE", "DON'T", "APOLOGIZE"], [...]]]

function readLists(text) {
    // Put spaces around brackets so they become words of their own.
    const tokens = text.replace(/\(/g, " ( ").replace(/\)/g, " ) ").split(/\s+/).filter(Boolean);
    let pos = 0;

    // Read one word, or one whole (...) list with everything inside it.
    // It calls itself for lists inside lists: that is called recursion.
    function readOne() {
        const token = tokens[pos];
        pos++;

        if (token === ")") {
            throw new Error('ELIZA script: unexpected ")"');
        }
        if (token !== "(") {
            return token;
        }
        const list = [];
        while (tokens[pos] !== ")") {
            if (pos >= tokens.length) {
                throw new Error('ELIZA script: missing ")"');
            }
            list.push(readOne());
        }
        pos++; // skip the ")"
        return list;
    }

    const items = [];
    while (pos < tokens.length) {
        items.push(readOne());
    }
    return items;
}

// (=KEY) or (= KEY) means "use the rules of KEY". Returns "KEY", or null.
function linkTarget(list) {
    if (!Array.isArray(list) || typeof list[0] !== "string" || list[0][0] !== "=") {
        return null;
    }
    return list[0] === "=" ? list[1] : list[0].slice(1);
}

// A pattern like (0 YOU (* WANT NEED) 0) becomes a list of parts:
//   0        { any: true }                    any number of words
//   2        { count: 2 }                     exactly 2 words
//   YOU      { word: "YOU" }                  this word
//   (* A B)  { alternatives: ["A", "B"] }     one of these words
//   (/FAM)   { tags: ["FAM"] }                a word tagged FAM, like MOTHER
function parsePattern(list) {
    return list.map(function (part) {
        if (Array.isArray(part)) {
            const words = part.join(" ");
            if (words[0] === "*") {
                return { alternatives: words.slice(1).split(" ").filter(Boolean) };
            }
            if (words[0] === "/") {
                return { tags: words.slice(1).split(" ").filter(Boolean) };
            }
            throw new Error("ELIZA script: bad pattern (" + words + ")");
        }
        if (part === "0") {
            return { any: true };
        }
        if (/^\d+$/.test(part)) {
            return { count: Number(part) };
        }
        return { word: part };
    });
}

// One keyword: (WORD [= SUBSTITUTE] [RANK] [DLIST(/TAGS)] rules...)
function parseEntry(list) {
    const entry = { word: list[0], substitute: null, rank: 0, tags: [], rules: [] };
    let i = 1;

    if (list[i] === "=") {
        entry.substitute = list[i + 1];
        i += 2;
    }
    if (/^\d+$/.test(list[i])) {
        entry.rank = Number(list[i]);
        i++;
    }
    if (list[i] === "DLIST") {
        entry.tags = list[i + 1].join(" ").replace(/\//g, " ").split(" ").filter(Boolean);
        i += 2;
    }

    // Each rule is (pattern answer answer ...). A rule that is only (=KEY)
    // means "for anything else, use KEY's rules".
    for (; i < list.length; i++) {
        const rule = list[i];
        const isLink = linkTarget(rule) !== null;
        entry.rules.push({
            pattern: parsePattern(isLink ? ["0"] : rule[0]),
            answers: isLink ? [rule] : rule.slice(1),
            next: 0  // which answer to use next time
        });
    }
    return entry;
}

// (MEMORY MY (0 YOUR 0 = LETS DISCUSS FURTHER WHY YOUR 3) ...)
function parseMemory(list) {
    return {
        keyword: list[1],
        rules: list.slice(2).map(function (rule) {
            const equals = rule.indexOf("=");
            return {
                pattern: parsePattern(rule.slice(0, equals)),
                answer: rule.slice(equals + 1)
            };
        })
    };
}

function parseScript(text) {
    const items = readLists(text.toUpperCase());
    const script = { greeting: items[0].join(" "), entries: {}, memory: null };

    for (const item of items.slice(1)) {
        // Skip the word START and the empty () at the end.
        if (!Array.isArray(item) || item.length === 0) {
            continue;
        }
        if (item[0] === "MEMORY") {
            script.memory = parseMemory(item);
        } else {
            script.entries[item[0]] = parseEntry(item);
        }
    }
    if (!script.entries.NONE) {
        throw new Error("ELIZA script: no NONE entry");
    }
    return script;
}

// --- Matching -------------------------------------------------------------

// Match words against a pattern. Returns one array of words per pattern
// part, or null if it doesn't match:
//   pattern (0 YOU ARE 0), words I THINK YOU ARE NICE
//   -> [["I", "THINK"], ["YOU"], ["ARE"], ["NICE"]]
function match(pattern, words, tagsOf) {
    const parts = [];

    // Try to match pattern part p and everything after it, starting at
    // word w. A 0 can take any number of words, so we try 0 words, then
    // 1, then 2... until the rest of the pattern also matches.
    function matchFrom(p, w) {
        if (p === pattern.length) {
            return w === words.length; // done only if all words are used
        }
        const part = pattern[p];

        if (part.any) {
            for (let n = 0; w + n <= words.length; n++) {
                parts[p] = words.slice(w, w + n);
                if (matchFrom(p + 1, w + n)) {
                    return true;
                }
            }
            return false;
        }
        if (part.count) {
            if (w + part.count > words.length) {
                return false;
            }
            parts[p] = words.slice(w, w + part.count);
            return matchFrom(p + 1, w + part.count);
        }

        // The other parts match exactly one word.
        const word = words[w];
        if (word === undefined) {
            return false;
        }
        let ok;
        if (part.word) {
            ok = word === part.word;
        } else if (part.alternatives) {
            ok = part.alternatives.includes(word);
        } else {
            ok = part.tags.some(function (tag) {
                return tagsOf(word).includes(tag);
            });
        }
        if (!ok) {
            return false;
        }
        parts[p] = [word];
        return matchFrom(p + 1, w + 1);
    }

    return matchFrom(0, 0) ? parts : null;
}

// Build an answer. Numbers in it are replaced by that part of the match:
//   (WHAT MAKES YOU THINK I AM 4) with part 4 = ["NICE"]
//   -> ["WHAT", "MAKES", "YOU", "THINK", "I", "AM", "NICE"]
function reassemble(answer, parts) {
    const words = [];
    for (const atom of answer) {
        if (/^\d+$/.test(atom)) {
            words.push(...(parts[Number(atom) - 1] || []));
        } else {
            words.push(atom);
        }
    }
    return words;
}

// ["WHY", "SO", ","] -> "WHY SO,"
function format(words) {
    return words.join(" ").replace(/ ,/g, ",").replace(/ \./g, ".");
}

// A number made from a word, always the same for the same word.
// Used to pick a memory rule, like the original did.
function hash(word) {
    let h = 0;
    for (let i = 0; i < word.length; i++) {
        h = (h * 31 + word.charCodeAt(i)) >>> 0; // >>> 0 keeps it a positive 32-bit number
    }
    return h;
}

// --- The program ------------------------------------------------------------

class Eliza {
    constructor(scriptText) {
        this.script = parseScript(scriptText);
        this.memory = [];  // saved sentences to bring back later
        this.limit = 1;    // counts 1-4; memories are only used on 4
    }

    greeting() {
        return this.script.greeting;
    }

    // The tags of a word, e.g. MOTHER -> ["FAMILY"].
    tagsOf(word) {
        const entry = this.script.entries[word];
        return entry ? entry.tags : [];
    }

    respond(input) {
        const entries = this.script.entries;
        this.limit = this.limit % 4 + 1;

        // Upper case, and punctuation as words of their own.
        const tokens = input.toUpperCase()
            .replace(/[‘’]/g, "'")
            .replace(/,/g, " , ")
            .replace(/[.?!;:]/g, " . ")
            .replace(/[^A-Z0-9',. ]/g, " ")
            .split(/\s+/)
            .filter(Boolean);

        // Step 1 and 2: find keywords and swap words.
        const keystack = [];
        let words = [];
        for (const token of tokens) {
            if (token === "," || token === "." || token === "BUT") {
                if (keystack.length > 0) {
                    break;      // we have a keyword: ignore the rest
                }
                words = [];     // no keyword yet: forget this part
                continue;
            }
            const entry = entries[token];
            if (entry && entry.rules.length > 0) {
                if (keystack.length === 0 || entry.rank > keystack[0].rank) {
                    keystack.unshift(entry);  // most important: first
                } else {
                    keystack.push(entry);
                }
            }
            words.push(entry && entry.substitute ? entry.substitute : token);
        }

        // Step 4: remember sentences about MY ...
        const memory = this.script.memory;
        if (keystack.length > 0 && memory && keystack[0].word === memory.keyword) {
            this.remember(words);
        }

        // Step 3: try the keywords until one gives an answer. A rule can
        // also point to another keyword. The guard stops endless loops.
        let entry = keystack.shift();
        for (let guard = 0; entry && guard < 100; guard++) {
            const result = this.transform(entry, words);
            if (result.reply) {
                return result.reply;
            }
            if (result.pre) {
                words = result.pre;
            }
            entry = result.link ? entries[result.link] : keystack.shift();
        }

        // Step 5: no keyword helped.
        if (this.limit === 4 && this.memory.length > 0) {
            return this.memory.shift();
        }
        return this.transform(entries.NONE, words).reply;
    }

    // Try one keyword's rules. Returns one of:
    //   { reply }       an answer
    //   { link }        use another keyword's rules
    //   { pre, link }   change the words, then use another keyword
    //   {}              try the next keyword (NEWKEY, or nothing matched)
    transform(entry, words) {
        const tagsOf = this.tagsOf.bind(this);

        for (const rule of entry.rules) {
            const parts = match(rule.pattern, words, tagsOf);
            if (!parts) {
                continue;
            }
            const answer = rule.answers[rule.next];
            rule.next = (rule.next + 1) % rule.answers.length;

            const link = linkTarget(answer);
            if (link) {
                return { link: link };
            }
            if (answer.length === 1 && answer[0] === "NEWKEY") {
                return {};
            }
            if (answer[0] === "PRE") {
                return { pre: reassemble(answer[1], parts), link: linkTarget(answer[2]) };
            }
            return { reply: format(reassemble(answer, parts)) };
        }
        return {};
    }

    remember(words) {
        const rules = this.script.memory.rules;
        const rule = rules[hash(words[words.length - 1] || "") % rules.length];
        const parts = match(rule.pattern, words, this.tagsOf.bind(this));
        if (parts) {
            this.memory.push(format(reassemble(rule.answer, parts)));
        }
    }
}
