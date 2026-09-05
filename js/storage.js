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

    return { getBest, saveBest };
})();
