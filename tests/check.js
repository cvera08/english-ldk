// Quick sanity check: loads the app's plain scripts into one vm context and
// builds lots of sessions per topic, asserting the questions are well-formed.
// Run from the repo root: node tests/check.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, '..');
const files = ['js/icons.js', 'js/content.js', 'js/engine.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
    + '\n;globalThis.__x = { ICONS, CONTENT, ENGINE };';
const ctx = vm.createContext({ console });
vm.runInContext(code, ctx);
const { CONTENT, ENGINE } = ctx.__x;

let problems = 0;
const fail = (m) => { problems++; console.log('  ✗', m); };

const ids = new Set();
for(const t of CONTENT.TOPICS){
    if(ids.has(t.id)) fail('duplicate topic id ' + t.id);
    ids.add(t.id);
    const ens = new Set();
    for(const w of t.words){
        if(!w.en || !w.es) fail(`${t.id}: word missing en/es: ${JSON.stringify(w.en)}`);
        if(!w.icon || w.icon.length < 5) fail(`${t.id}/${w.en}: empty icon`);
        if(/<text[^>]*>[a-z]{3,}/i.test(w.icon)) fail(`${t.id}/${w.en}: icon contains English-looking text`);
        if(ens.has(w.en)) fail(`${t.id}: duplicate word ${w.en}`);
        ens.add(w.en);
    }
}

const modes = [...CONTENT.TOPICS.map(t => t.id), 'all', 'new'];
const wordsFor = (m) => m === 'all' ? CONTENT.allWords()
    : m === 'new' ? CONTENT.newWords()
    : CONTENT.wordsOf(CONTENT.topicById(m));

const typeCount = {};
const seenSentences = new Set();
for(const m of modes){
    const words = wordsFor(m);
    if(m === 'new' && words.length === 0){ console.log('new: (no new words)'); continue; }
    for(let i = 0; i < 60; i++){
        const session = ENGINE.buildSession({ words, count: 16, pool: m === 'new' ? CONTENT.allWords() : undefined });
        for(const q of session){
            typeCount[q.type] = (typeCount[q.type] || 0) + 1;
            const n = q.options ? q.options.length : 0;
            const correct = q.options ? q.options.filter(o => o.isCorrect).length : 0;
            if(q.options && correct !== 1) fail(`${m}/${q.word.en}/${q.type}: ${correct} correct options`);
            if(q.options && n < 2) fail(`${m}/${q.word.en}/${q.type}: only ${n} options`);
            if(q.type === 'count_objects'){
                if(q.n !== q.word.count) fail(`${m}/${q.word.en}: counts ${q.n} items but word is ${q.word.count}`);
                if(q.options.length !== 3) fail(`${m}/${q.word.en}: count question has ${q.options.length} options`);
            }
            if(q.type === 'is_it' || q.type === 'this_is'){
                const said = q.claimed.en === q.word.en;
                const right = q.options.find(o => o.isCorrect);
                const expectYes = q.type === 'is_it' ? right.text === 'Yes, it is' : right.mark === 'check';
                if(said !== expectYes) fail(`${m}/${q.word.en}: sentence "${q.sentence}" marked ${expectYes ? 'true' : 'false'} wrongly`);
                if(!q.claimed.frame) fail(`${m}/${q.word.en}: claims a non-frame word ${q.claimed.en}`);
                if(/\ban (uniform|ruler|book)|\ba (apple|eraser|orange|elephant)/i.test(q.sentence)) fail(`bad article: ${q.sentence}`);
                seenSentences.add(q.sentence);
            }
            if(q.type === 'do_you_have'){
                const inPanel = q.panel.some(w => w.en === q.claimed.en);
                const yes = q.options.find(o => o.isCorrect).text === 'Yes, I do';
                if(inPanel !== yes) fail(`${m}/${q.word.en}: panel/answer mismatch`);
                if(q.panel.length !== 3 || new Set(q.panel.map(w => w.en)).size !== 3) fail(`${m}: bad panel ${q.panel.map(w=>w.en)}`);
            }
            if(q.options){
                const keys = q.options.map(o => o.text ?? o.en ?? o.mark);
                if(new Set(keys).size !== keys.length) fail(`${m}/${q.word.en}/${q.type}: duplicate option ${keys}`);
            }
        }
    }
    console.log(`${m}: ${words.length} words ok`);
}
console.log('question types seen:', typeCount);
console.log('sample sentences:', [...seenSentences].sort().filter((x,i)=>i%9===0).slice(0,14));
console.log('latest wave:', CONTENT.latestWave ? CONTENT.latestWave() : 'n/a',
            '| new words:', CONTENT.newWords ? CONTENT.newWords().length : 'n/a',
            '| total words:', CONTENT.allWords().length);
console.log(problems ? `\n${problems} PROBLEM(S)` : '\nall good');
process.exit(problems ? 1 : 0);
