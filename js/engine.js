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

    function buildQuestion(word, pool, type, rng = Math.random){

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

    function buildSession({ words, count, rng = Math.random, types = QUESTION_TYPES }){

        if(words.length === 0) return [];

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
            // spelling questions need words long enough to mutate meaningfully
            let type = nextType();
            if(type === 'spelling_choice' && word.en.replace(' ', '').length < 3){
                type = 'image_to_word';
            }
            return buildQuestion(word, words, type, rng);
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
        QUESTION_TYPES,
    };
})();
