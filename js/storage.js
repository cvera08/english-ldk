/*
 * STORAGE — tiny localStorage wrapper for best scores, wrapped in
 * try/catch so private browsing (which throws on write) never breaks
 * the quiz — same guard memory-ldk's storage.js uses.
 */

const STORAGE = (() => {

    const KEY = 'english-ldk-best-scores';

    function readAll(){
        try{
            return JSON.parse(localStorage.getItem(KEY)) || {};
        }catch(e){
            return {};
        }
    }

    function writeAll(data){
        try{
            localStorage.setItem(KEY, JSON.stringify(data));
        }catch(e){
            /* ignore — private mode or storage disabled */
        }
    }

    function getBest(topicId){
        return readAll()[topicId] || null;
    }

    function saveBest(topicId, stars, correct, total){
        const data = readAll();
        const current = data[topicId];

        if(!current || stars > current.stars ||
           (stars === current.stars && correct > current.correct)){
            data[topicId] = { stars, correct, total };
            writeAll(data);
            return true; // it's a new best
        }
        return false;
    }

    /* ---------- per-word memory: what she keeps getting wrong ----------
       { "<word>": { m: first-try misses so far, s: first-try hits in a row } }
       A word "costs her" while it has been missed and hasn't yet been got
       right twice in a row first try — then it graduates off the list, and
       comes back if she misses it again. */

    const STATS_KEY = 'english-ldk-word-stats';

    function readStats(){
        try{
            return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
        }catch(e){
            return {};
        }
    }

    function recordWord(word, firstTry){
        const all = readStats();
        const current = all[word] || { m: 0, s: 0 };
        if(firstTry){
            current.s += 1;
        }else{
            current.m += 1;
            current.s = 0;
        }
        all[word] = current;
        try{
            localStorage.setItem(STATS_KEY, JSON.stringify(all));
        }catch(e){
            /* ignore — private mode or storage disabled */
        }
    }

    function weakWords(){
        const all = readStats();
        return Object.keys(all).filter(word => all[word].m > 0 && all[word].s < 2);
    }

    function resetAll(){
        try{
            localStorage.removeItem(KEY);
            localStorage.removeItem(STATS_KEY);
        }catch(e){
            /* ignore — private mode or storage disabled */
        }
    }

    return { getBest, saveBest, resetAll, recordWord, weakWords };
})();
