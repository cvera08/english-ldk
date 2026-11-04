// Sanity checks, no browser and nothing to install: node tests/check.js
//
// Loads the app's plain scripts into one vm context, then checks the word bank
// and builds hundreds of sessions per mode asserting every question is well formed.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, '..');
const files = ['js/icons.js', 'js/content.js', 'js/engine.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
    + '\n;globalThis.__x = { ICONS, CONTENT, ENGINE };';
const ctx = vm.createContext({ console });
vm.runInContext(code, ctx);
const { ICONS, CONTENT, ENGINE } = ctx.__x;

let problems = 0, checks = 0;
const fail = (m) => { problems++; console.log('  ✗', m); };
const check = (cond, m) => { checks++; if(!cond) fail(m); };
const section = (name) => console.log(`\n${name}`);

/* ---------------------------------------------------------------- word bank */

section('word bank');
{
    const ids = new Set();
    for(const t of CONTENT.TOPICS){
        check(!ids.has(t.id), 'duplicate topic id ' + t.id);
        ids.add(t.id);
        const ens = new Set();
        for(const w of t.words){
            check(w.en && w.es, `${t.id}: word missing en/es: ${JSON.stringify(w.en)}`);
            check(w.icon && w.icon.length >= 5, `${t.id}/${w.en}: empty icon`);
            check(!/<text[^>]*>[a-z]{3,}/i.test(w.icon), `${t.id}/${w.en}: icon contains English-looking text`);
            check(!ens.has(w.en), `${t.id}: duplicate word ${w.en}`);
            ens.add(w.en);
        }
    }
    console.log(`  ${CONTENT.TOPICS.length} topics, ${CONTENT.allWords().length} words`);
}

/* ---------------------------------------------------------------- homonyms */

section('homonyms (same spelling, different picture)');
{
    // inject two temporary topics, then remove them: nothing leaks into later checks
    const fishIcon = CONTENT.allWords().find(w => w.en === 'fish').icon;
    const before = CONTENT.allWords().length;
    CONTENT.TOPICS.push(
        { id: '_t1', icon: '1', since: 3, name: { es: 't', en: 't' }, words: [
            { en: 'fish', es: 'pez', icon: fishIcon },                 // same picture again: one word
            { en: 'zzz',  es: 'z',   icon: '<i class="A">zzz-a</i>' },  // homonym, picture A
        ] },
        { id: '_t2', icon: '2', since: 3, name: { es: 't', en: 't' }, words: [
            { en: 'zzz',  es: 'z',   icon: '<i class="B">zzz-b</i>' },  // homonym, picture B
        ] },
    );
    const all = CONTENT.allWords();
    check(all.length === before + 2, `same picture twice is one word, different pictures are two (got +${all.length - before}, want +2)`);
    check(all.filter(w => w.en === 'zzz').length === 2, 'both homonyms survive in the bank');
    check(all.filter(w => w.en === 'fish').length === 1, 'fish (same picture in two topics) is listed once');

    // never ask about one homonym while offering the other as an answer
    const words = all.filter(w => w.en === 'zzz' || ['dog', 'cat', 'cow', 'bed', 'lamp'].includes(w.en));
    let questions = 0;
    for(let i = 0; i < 400; i++){
        for(const q of ENGINE.buildSession({ words, count: 12, pool: all })){
            questions++;
            const ens = q.options.map(o => o.text ?? o.en ?? o.mark);
            check(new Set(ens).size === ens.length, `homonym offered as its own wrong answer: ${ens} (${q.type})`);
            if(q.type === 'word_to_image' || q.type === 'audio_to_image'){
                const own = q.options.filter(o => o.icon === q.word.icon).length;
                check(own === 1, `${q.type}/${q.word.en}: ${own} options show the asked-about picture`);
            }
        }
    }
    console.log(`  ${questions} questions with a homonym in the pool: none ambiguous`);
    CONTENT.TOPICS.pop(); CONTENT.TOPICS.pop();
    check(CONTENT.allWords().length === before, 'temporary topics were removed');
}

/* ---------------------------------------------------------------- sessions */

section('sessions');
const modes = [...CONTENT.TOPICS.map(t => t.id), 'all', 'new'];
const wordsFor = (m) => m === 'all' ? CONTENT.allWords()
    : m === 'new' ? CONTENT.newWords()
    : CONTENT.wordsOf(CONTENT.topicById(m));

const typeCount = {};
const seenSentences = new Set();
for(const m of modes){
    const words = wordsFor(m);
    if(m === 'new' && words.length === 0){ console.log('  new: (no new words)'); continue; }
    for(let i = 0; i < 60; i++){
        const session = ENGINE.buildSession({ words, count: 16, pool: m === 'new' ? CONTENT.allWords() : undefined });
        for(const q of session){
            typeCount[q.type] = (typeCount[q.type] || 0) + 1;
            const n = q.options ? q.options.length : 0;
            const correct = q.options ? q.options.filter(o => o.isCorrect).length : 0;
            check(!q.options || correct === 1, `${m}/${q.word.en}/${q.type}: ${correct} correct options`);
            check(!q.options || n >= 2, `${m}/${q.word.en}/${q.type}: only ${n} options`);
            if(q.type === 'count_objects'){
                check(q.n === q.word.count, `${m}/${q.word.en}: counts ${q.n} items but word is ${q.word.count}`);
                check(q.options.length === 3, `${m}/${q.word.en}: count question has ${q.options.length} options`);
            }
            if(q.type === 'is_it' || q.type === 'this_is'){
                const said = q.claimed.en === q.word.en;
                const right = q.options.find(o => o.isCorrect);
                const expectYes = q.type === 'is_it' ? right.text === 'Yes, it is' : right.mark === 'check';
                check(said === expectYes, `${m}/${q.word.en}: sentence "${q.sentence}" marked ${expectYes ? 'true' : 'false'} wrongly`);
                check(q.claimed.frame, `${m}/${q.word.en}: claims a non-frame word ${q.claimed.en}`);
                check(!/\ban (uniform|ruler|book)|\ba (apple|eraser|orange|elephant)/i.test(q.sentence), `bad article: ${q.sentence}`);
                seenSentences.add(q.sentence);
            }
            if(q.type === 'do_you_have'){
                const inPanel = q.panel.some(w => w.en === q.claimed.en);
                const yes = q.options.find(o => o.isCorrect).text === 'Yes, I do';
                check(inPanel === yes, `${m}/${q.word.en}: panel/answer mismatch`);
                check(q.panel.length === 3 && new Set(q.panel.map(w => w.en)).size === 3, `${m}: bad panel ${q.panel.map(w => w.en)}`);
            }
            if(q.options){
                const keys = q.options.map(o => o.text ?? o.en ?? o.mark);
                check(new Set(keys).size === keys.length, `${m}/${q.word.en}/${q.type}: duplicate option ${keys}`);
            }
        }
    }
    console.log(`  ${m}: ${words.length} words ok`);
}
console.log('  question types seen:', JSON.stringify(typeCount));

console.log(problems ? `\n${problems} PROBLEM(S) in ${checks} checks` : `\nall good (${checks} checks)`);
process.exit(problems ? 1 : 0);
