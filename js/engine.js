/*
 * ENGINE — pure quiz logic, no DOM. Given a list of topics it builds a
 * randomized session of tap-only questions of four kinds:
 *
 *   image_to_word   picture shown       -> pick the English word
 *   word_to_image   word shown + 🔊     -> pick the picture
 *   audio_to_image  🔊 only (listen)    -> pick the picture
 *   spelling_choice picture shown       -> pick the correct spelling
 *
 * Kept free of the page (window/document) so it can run in Node for a
 * quick sanity test, the same split memory-ldk uses for its engine.js.
 */

const ENGINE = (() => {

    function shuffle(list, rng = Math.random){
        const arr = [...list];
        for(let i = arr.length - 1; i > 0; i--){
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function sameWord(a, b){
        return a.en === b.en;
    }

    /* pick `count` distractors for `word` out of `pool`, preferring
       words from the same topic so the wrong answers stay plausible */
    function pickDistractors(word, pool, count, rng = Math.random){

        const sameTopic = pool.filter(w => w.topicId === word.topicId && !sameWord(w, word));
        const others     = pool.filter(w => w.topicId !== word.topicId && !sameWord(w, word));

        const candidates = shuffle([...sameTopic, ...others], rng);

        const picked = [];
        for(const candidate of candidates){
            if(picked.length >= count) break;
            if(picked.some(p => sameWord(p, candidate))) continue;
            picked.push(candidate);
        }
        return picked;
    }

    /* a "shuffled bag" so every question type shows up roughly equally
       often instead of clumping together by chance */
    function makeBag(items, rng = Math.random){
        let bag = [];
        return () => {
            if(bag.length === 0) bag = shuffle(items, rng);
            return bag.pop();
        };
    }

    const QUESTION_TYPES = ['image_to_word', 'word_to_image', 'audio_to_image', 'spelling_choice'];

    function corruptSpelling(word, rng = Math.random){

        const tokens = word.split(' ');
        const tokenIndex = tokens.reduce(
            (best, t, i) => t.length > tokens[best].length ? i : best, 0
        );
        const token = tokens[tokenIndex];

        if(token.length < 2){
            return word.split('').reverse().join('');
        }

        const letters = token.split('');
        const op = ['swap', 'drop', 'double'][Math.floor(rng() * 3)];
        const i = Math.floor(rng() * (letters.length - 1));

        let mutated;
        if(op === 'swap'){
            [letters[i], letters[i + 1]] = [letters[i + 1], letters[i]];
            mutated = letters.join('');
        }else if(op === 'drop' && letters.length > 3){
            mutated = letters.filter((_, idx) => idx !== i).join('');
        }else{
            letters.splice(i, 0, letters[i]);
            mutated = letters.join('');
        }

        tokens[tokenIndex] = mutated;
        return tokens.join(' ');
    }

    function spellingDistractors(word, rng = Math.random){
        const results = new Set();
        let guard = 0;

        while(results.size < 2 && guard < 30){
            guard++;
            const candidate = corruptSpelling(word.en, rng);
            if(candidate.toLowerCase() !== word.en.toLowerCase()){
                results.add(candidate);
            }
        }

        // extremely short words can run out of mutations — pad with a
        // harmless fallback so the question always has 3 options
        while(results.size < 2){
            results.add(word.en + results.size);
        }

        return [...results];
    }

    /* ---------- special question types ----------
       The four generic types work for any word. These only make sense for
       some words, so each word is checked against them (specialTypesFor)
       and they're mixed in on top, with SPECIAL_CHANCE per eligible word:

         count_objects   a number word (has `count`): N emoji to count,
                         pick the number word            — "five sharpeners"
         is_it           a picture and "Is it a dog?" — answer Yes, it is /
                         No, it isn't                     — notebook, page 3
         this_is         a picture and "THIS IS AN ERASER." — tap ✔ or ✘
                                                          — book test 4
       is_it and this_is need a countable singular thing (word.frame).
    */

    const SPECIAL_CHANCE = 0.4;
    const COUNT_ITEMS = ['⭐', '🍎', '🎈', '🐟', '⚽', '🍪', '🌸', '🚗'];

    function specialTypesFor(word){
        const types = [];
        if(typeof word.count === 'number') types.push('count_objects');
        if(word.frame === true) types.push('is_it', 'this_is');
        return types;
    }

    function articleFor(word){
        return word.art || (/^[aeiou]/i.test(word.en) ? 'an' : 'a');
    }

    // Shows `word`'s picture next to a sentence that is either true
    // ("Is it a dog?" under a dog) or names a different thing from the same
    // family (under a cat). A tidy yes/no, with the false one a plausible slip.
    function buildStatementQuestion(type, word, pool, rng){
        const others = pool.filter(w => w.frame === true && !sameWord(w, word));
        const isTrue = others.length === 0 || rng() < 0.5;
        const claimed = isTrue ? word : pickDistractors(word, others, 1, rng)[0];

        const sentence = type === 'is_it'
            ? `Is it ${articleFor(claimed)} ${claimed.en}?`
            : `This is ${articleFor(claimed)} ${claimed.en}.`;

        const options = type === 'is_it'
            ? [
                { text: 'Yes, it is',    isCorrect: isTrue },
                { text: "No, it isn't",  isCorrect: !isTrue },
            ]
            : [
                { mark: 'check', isCorrect: isTrue },
                { mark: 'cross', isCorrect: !isTrue },
            ];

        return { type, word, claimed, sentence, options };
    }

    function buildCountQuestion(word, pool, rng){
        const n = word.count;
        const item = COUNT_ITEMS[Math.floor(rng() * COUNT_ITEMS.length)];

        // wrong answers close to the right one, so it takes actual counting
        const near = pool
            .filter(w => typeof w.count === 'number' && w.count !== n)
            .map(w => ({ w, distance: Math.abs(w.count - n) + rng() * 0.9 }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2)
            .map(entry => entry.w);

        const options = shuffle(
            [word, ...near].map(w => ({ text: w.en, isCorrect: sameWord(w, word) })),
            rng
        );
        return { type: 'count_objects', word, item, n, options };
    }

    function buildQuestion(word, pool, type, rng = Math.random){

        if(type === 'count_objects'){
            return buildCountQuestion(word, pool, rng);
        }

        if(type === 'is_it' || type === 'this_is'){
            return buildStatementQuestion(type, word, pool, rng);
        }

        if(type === 'spelling_choice'){
            const wrongSpellings = spellingDistractors(word, rng);
            const options = shuffle(
                [word.en, ...wrongSpellings].map(text => ({ text, isCorrect: text === word.en })),
                rng
            );
            return { type, word, options };
        }

        const distractors = pickDistractors(word, pool, 2, rng);

        if(type === 'image_to_word'){
            const options = shuffle(
                [word, ...distractors].map(w => ({ text: w.en, isCorrect: sameWord(w, word) })),
                rng
            );
            return { type, word, options };
        }

        // word_to_image and audio_to_image both answer with pictures
        const options = shuffle(
            [word, ...distractors].map(w => ({ icon: w.icon, en: w.en, isCorrect: sameWord(w, word) })),
            rng
        );
        return { type, word, options };
    }

    function buildSession({ words, count, rng = Math.random, types = QUESTION_TYPES, pool, special = true }){

        if(words.length === 0) return [];

        // `pool` supplies wrong-answer candidates and defaults to `words`;
        // pass a bigger pool explicitly for a small session (e.g. a
        // few missed words) so distractors don't run out
        pool = pool || words;

        // sample without replacement, looping the (reshuffled) pool if
        // more questions were requested than there are words
        const picks = [];
        while(picks.length < count){
            const batch = shuffle(words, rng);
            for(const w of batch){
                if(picks.length >= count) break;
                const prev = picks[picks.length - 1];
                if(prev && sameWord(prev, w) && batch.length > 1) continue;
                picks.push(w);
            }
        }

        const nextType = makeBag(types, rng);

        return picks.map(word => {
            // words that qualify for a special type get it some of the time
            const specials = special ? specialTypesFor(word) : [];
            if(specials.length && rng() < SPECIAL_CHANCE){
                const type = specials[Math.floor(rng() * specials.length)];
                return buildQuestion(word, pool, type, rng);
            }

            let type = nextType();
            // spelling questions need words long enough to mutate meaningfully
            if(type === 'spelling_choice' && word.en.replace(' ', '').length < 3){
                type = 'image_to_word';
            }
            // a word the voice mangles can't carry a listen-only question
            if(type === 'audio_to_image' && word.noSpeech){
                type = 'image_to_word';
            }
            return buildQuestion(word, pool, type, rng);
        });
    }

    function starsFor(correctFirstTry, total){
        if(total === 0) return 0;
        const ratio = correctFirstTry / total;
        if(ratio >= 0.9) return 3;
        if(ratio >= 0.6) return 2;
        return 1;
    }

    return {
        shuffle,
        pickDistractors,
        corruptSpelling,
        buildQuestion,
        buildSession,
        starsFor,
        specialTypesFor,
        QUESTION_TYPES,
    };
})();
