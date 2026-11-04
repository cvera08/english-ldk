// Sanity checks, no browser and nothing to install: node tests/check.js
//
// Loads the app's plain scripts into one vm context, then checks the word bank
// and builds hundreds of sessions per mode asserting every question is well formed.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = process.argv[2] || path.join(__dirname, '..');
const files = ['js/icons.js', 'js/content.js', 'js/engine.js', 'js/storage.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n')
    + '\n;globalThis.__x = { ICONS, CONTENT, ENGINE, STORAGE };';

// a stand-in for the browser's localStorage, so storage.js can be exercised
// (including "private mode", where every access throws)
function fakeStorage(){
    const data = {};
    const api = {
        broken: false,
        data,
        getItem: k => { if(api.broken) throw new Error('denied'); return k in data ? data[k] : null; },
        setItem: (k, v) => { if(api.broken) throw new Error('denied'); data[k] = String(v); },
        removeItem: k => { if(api.broken) throw new Error('denied'); delete data[k]; },
    };
    return api;
}
const ls = fakeStorage();
const ctx = vm.createContext({ console, localStorage: ls });
vm.runInContext(code, ctx);
const { ICONS, CONTENT, ENGINE, STORAGE } = ctx.__x;

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
        const ens = new Set(), pics = new Map();
        for(const w of t.words){
            check(w.en && w.es, `${t.id}: word missing en/es: ${JSON.stringify(w.en)}`);
            check(w.icon && w.icon.length >= 5, `${t.id}/${w.en}: empty icon`);
            check(!/<text[^>]*>[a-z]{3,}/i.test(w.icon), `${t.id}/${w.en}: icon contains English-looking text`);
            check(!ens.has(w.en), `${t.id}: duplicate word ${w.en}`);
            ens.add(w.en);
            check(!pics.has(w.icon), `${t.id}: ${w.en} and ${pics.get(w.icon)} share the same picture`);
            pics.set(w.icon, w.en);
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

/* ---------------------------------------------------------------- stages */

section('stages');
{
    const waves = CONTENT.waves();
    check(waves.length >= 1, 'there is at least one wave');
    check(waves.every((w, i) => Number.isInteger(w) && (i === 0 || w > waves[i - 1])), `waves are integers in ascending order: ${waves}`);
    check(waves[0] >= CONTENT.DEFAULT_WAVE, 'no word is older than the default wave');
    check(CONTENT.latestWave() === waves[waves.length - 1], 'latestWave is the last wave');
    check(CONTENT.hasStages() === (waves.length > 1), 'hasStages means more than one wave');

    // every word belongs to exactly one wave
    const total = CONTENT.allWords().length;
    const sum = waves.reduce((n, w) => n + CONTENT.wordsOfWave(w).length, 0);
    check(sum === total, `waves partition the bank (${sum} vs ${total})`);
    check(waves.every(w => CONTENT.wordsOfWave(w).length > 0), 'no empty wave');

    // stages are numbered 1..n, uniquely named, each with a picture
    const stages = waves.map(w => CONTENT.stage(w));
    check(stages.every((st, i) => st.number === i + 1 && st.name === `Etapa ${i + 1}`), 'stages are numbered 1..n in order');
    check(new Set(stages.map(st => st.emoji)).size === stages.length, 'each stage has its own emoji');
    check(stages.every(st => st.emoji && st.emoji.length), 'every stage has an emoji');

    // "lo nuevo" is the newest stage, and only when there is more than one
    const latest = CONTENT.wordsOfWave(CONTENT.latestWave()).map(w => w.en + w.icon).sort().join();
    check(!CONTENT.hasStages() || CONTENT.newWords().map(w => w.en + w.icon).sort().join() === latest, 'newWords is the latest wave');
    check(CONTENT.hasStages() || CONTENT.newWords().length === 0, 'no "lo nuevo" while there is a single wave');

    for(const t of CONTENT.TOPICS){
        check(waves.includes(CONTENT.introWave(t)), `${t.id}: introWave is a real wave`);
    }
    console.log(`  waves ${waves} -> ` + stages.map(st => `${st.emoji} ${st.name} (${CONTENT.wordsOfWave(st.wave).length})`).join(', '));
}

/* ---------------------------------------------------------------- storage */

section('storage (best scores + what costs her)');
{
    const reset = () => { ls.broken = false; Object.keys(ls.data).forEach(k => delete ls.data[k]); };

    reset();
    check(STORAGE.getBest('family') === null, 'no record yet -> null');
    check(STORAGE.saveBest('family', 2, 8, 12) === true, 'first score is a new best');
    check(STORAGE.saveBest('family', 1, 3, 12) === false, 'a worse score does not replace it');
    check(JSON.stringify(STORAGE.getBest('family')) === '{"stars":2,"correct":8,"total":12}', 'the better score is kept');
    check(STORAGE.saveBest('family', 2, 9, 12) === true, 'same stars, more correct, is a new best');
    check(STORAGE.saveBest('family', 3, 11, 12) === true && STORAGE.getBest('family').correct === 11, 'more stars is a new best');
    check(STORAGE.getBest('other') === null, 'records are per key');

    // wave records: the keys must not change between releases or her phone loses them
    STORAGE.saveBest('new-w4', 3, 12, 12);
    check(STORAGE.getBest('new-w4').correct === 12, 'stage record under its key');
    check('english-ldk-best-scores' in ls.data, 'best scores live under the key the live app already uses');

    // what costs her: missed, and not yet 2 first-try hits in a row since
    reset();
    STORAGE.recordWord('dog', false);
    check(STORAGE.weakWords().join() === 'dog', 'a miss puts the word on the list');
    STORAGE.recordWord('dog', true);
    check(STORAGE.weakWords().join() === 'dog', 'one hit is not enough to leave it');
    STORAGE.recordWord('dog', true);
    check(STORAGE.weakWords().length === 0, 'two hits in a row take it off');
    STORAGE.recordWord('dog', false);
    check(STORAGE.weakWords().join() === 'dog', 'it comes back if she misses it again');
    STORAGE.recordWord('dog', true); STORAGE.recordWord('dog', false); STORAGE.recordWord('dog', true);
    check(STORAGE.weakWords().join() === 'dog', 'a miss resets the streak');
    STORAGE.recordWord('cat', true);
    check(!STORAGE.weakWords().includes('cat'), 'a word she never missed is never on the list');
    check('english-ldk-word-stats' in ls.data, 'word memory lives under the key the live app already uses');

    // reset wipes both
    STORAGE.saveBest('family', 3, 12, 12);
    STORAGE.resetAll();
    check(STORAGE.getBest('family') === null && STORAGE.weakWords().length === 0, 'resetAll clears scores and word memory');

    // damaged or unavailable storage must never break the app
    ls.data['english-ldk-best-scores'] = '{not json';
    ls.data['english-ldk-word-stats'] = '[[[';
    let threw = false;
    try{ STORAGE.getBest('x'); STORAGE.weakWords(); STORAGE.recordWord('a', false); STORAGE.saveBest('x', 1, 1, 1); }catch(e){ threw = true; }
    check(!threw, 'corrupt stored data is ignored, not thrown');
    ls.broken = true;
    threw = false;
    try{ STORAGE.getBest('x'); STORAGE.saveBest('x', 1, 1, 1); STORAGE.recordWord('a', false); STORAGE.weakWords(); STORAGE.resetAll(); }catch(e){ threw = true; }
    check(!threw, 'storage that throws (private mode) is ignored, not thrown');
    reset();
}

/* ---------------------------------------------------------------- page wiring */

section('page wiring (index.html <-> ui.js)');
{
    const read = f => fs.readFileSync(path.join(root, f), 'utf8');
    const html = read('index.html'), ui = read('js/ui.js');

    // every file the page loads exists, and the scripts load in dependency order
    const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1].split('?')[0]).filter(r => !/^(https?:|data:)/.test(r));
    for(const r of refs) check(fs.existsSync(path.join(root, r)), `index.html references a missing file: ${r}`);
    const order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    const idx = f => order.indexOf(f);
    check(idx('js/icons.js') < idx('js/content.js'), 'icons.js loads before content.js (content calls ICONS)');
    for(const dep of ['js/content.js', 'js/engine.js', 'js/audio.js', 'js/storage.js', 'js/confetti.js']){
        check(idx(dep) >= 0 && idx(dep) < idx('js/ui.js'), `${dep} loads before ui.js`);
    }
    check(idx('js/main.js') === order.length - 1, 'main.js loads last');

    // every id the JS touches is in the page; every element it caches exists
    // ids the JS itself writes into question markup (e.g. the 🔊 button) count too
    const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g), ...ui.matchAll(/\bid="([^"$]+)"/g)].map(m => m[1]));
    const cached = [...ui.slice(ui.indexOf('function cacheEls'), ui.indexOf('function pick')).matchAll(/'([\w-]+)'/g)].map(m => m[1]);
    for(const id of cached) check(htmlIds.has(id), `ui.js caches #${id} but index.html has no such id`);
    const direct = [...ui.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
    for(const id of direct) check(htmlIds.has(id), `ui.js reads #${id} but index.html has no such id`);
    const used = new Set([...ui.matchAll(/\bels\.([A-Za-z]\w*)/g)].map(m => m[1]));
    for(const name of used) check(cached.includes(name), `ui.js uses els.${name} but never caches it`);
    console.log(`  ${refs.length} files, ${cached.length} cached elements, ${direct.length} direct lookups: all present`);

    // the build number: shown on screen, and stamped on every asset URL so a
    // browser can never pair a new index.html with a cached old script
    check(/^\d+\.\d+$/.test(CONTENT.BUILD), `BUILD looks like 5.0 (got ${CONTENT.BUILD})`);
    check(CONTENT.RELEASED && CONTENT.VERSION === `v${CONTENT.BUILD} · ${CONTENT.RELEASED}`, `VERSION is built from BUILD and RELEASED (${CONTENT.VERSION})`);
    const assets = [...html.matchAll(/<(?:script src|link rel="stylesheet" href)="([^"]+)"/g)].map(m => m[1]);
    check(assets.length >= 9, `found the page's scripts and stylesheet (${assets.length})`);
    for(const a of assets){
        check(a.endsWith(`?v=${CONTENT.BUILD}`), `${a} should end in ?v=${CONTENT.BUILD} — bump the ?v= in index.html together with BUILD`);
    }
}

/* ---------------------------------------------------------------- sessions */

section('sessions');
const modes = [...CONTENT.TOPICS.map(t => t.id), 'all', ...CONTENT.waves().map(w => `wave:${w}`), 'weak-like'];
const wordsFor = (m) => m === 'all' ? CONTENT.allWords()
    : m.startsWith('wave:') ? CONTENT.wordsOfWave(Number(m.slice(5)))
    : m === 'weak-like' ? CONTENT.allWords().filter((w, i) => i % 11 === 0)    // a scattered handful, like "lo que más le cuesta"
    : CONTENT.wordsOf(CONTENT.topicById(m));
// the app borrows wrong answers from the whole bank when the set is small
const poolFor = (m, words) => (m === 'weak-like' || words.length < 8) ? CONTENT.allWords() : undefined;

const typeCount = {};
const seenSentences = new Set();
for(const m of modes){
    const words = wordsFor(m);
    for(let i = 0; i < 60; i++){
        const session = ENGINE.buildSession({ words, count: 16, pool: poolFor(m, words) });
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
