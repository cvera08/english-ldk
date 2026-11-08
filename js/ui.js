/*
 * UI — the only file that touches the DOM. Wires CONTENT + ENGINE +
 * AUDIO + STORAGE + CONFETTI to the three screens in index.html.
 */

const UI = (() => {

    const els = {};
    const state = {
        session: [],
        index: 0,
        correctFirstTry: 0,
        attemptedWrong: false,
        topicId: null,
        topicLabel: '',
        questionCount: 12,
        missed: [],       // exercises ({ word, type }) gotten wrong at least once this session — offered as a review round after
        isReview: false,  // true while playing that review round: doesn't touch best-score storage
    };

    const INSTRUCTIONS = {
        image_to_word:   '¿Cómo se dice en inglés?',
        word_to_image:   'Tocá el dibujo correcto',
        audio_to_image:  'Escuchá y tocá el dibujo correcto',
        spelling_choice: '¿Cómo se escribe en inglés?',
        count_objects:   'Contá y elegí el número',
        is_it:           'Mirá el dibujo y contestá',
        this_is:         '¿Es verdad? Tocá ✔ o ✘',
        do_you_have:     'Mirá lo que tiene y contestá',
    };

    // types that never make a sound on their own; once she answers, the
    // word is spoken as active-listening reinforcement
    const SILENT_TYPES = ['image_to_word', 'spelling_choice', 'count_objects'];

    // types whose answers are written words, not pictures
    const TEXT_ANSWER_TYPES = ['image_to_word', 'spelling_choice', 'count_objects', 'is_it', 'do_you_have'];

    const RIGHT_MESSAGES = ['¡Muy bien! ✅', '¡Genial! 🌟', '¡Exacto! 🎉', '¡Perfecto! 💫', '¡Así se hace! 👏'];
    const RETRY_MESSAGES = ['¡Casi! Probá de nuevo 💪', 'No es esa, ¡intentá otra! 🤔', 'Cerca... ¡una más! 🌈'];

    function cacheEls(){
        [
            'screen-home', 'screen-quiz', 'screen-end',
            'topicGrid', 'countOptions', 'btnRepaso', 'btnNew', 'newBadge', 'newSub', 'sheetRow', 'btnWeak', 'weakSub', 'stageRow', 'btnBack',
            'quizProgressText', 'quizProgressFill',
            'quizInstruction', 'quizPrompt', 'quizOptions', 'quizFeedback',
            'endStars', 'endTitle', 'endScore', 'endBest', 'btnPracticeMissed',
            'btnRetry', 'btnMenu', 'confetti', 'btnResetScores',
            'btnViewScores', 'scoresBackdrop', 'scoresList', 'btnCloseScores', 'btnUpdate',
        ].forEach(id => els[id] = document.getElementById(id));
    }

    function pick(list){
        return list[Math.floor(Math.random() * list.length)];
    }

    function renderStars(count, total = 3){
        let html = '';
        for(let i = 0; i < total; i++){
            html += `<span class="${i < count ? 'star-filled' : 'star-empty'}">★</span>`;
        }
        return html;
    }

    // the small corner badge on a card: stars for an at-a-glance read, plus
    // the exact fraction underneath — stars alone can't tell you 11/12
    // apart from 12/12, and that's exactly what you'd want to know to push
    // for the perfect score, not just "a good score"
    function scoreBadgeHTML(best){
        if(!best) return '';
        return `
            <div class="card-badge-stars">${renderStars(best.stars)}</div>
            <div class="card-badge-frac">${best.correct}/${best.total}</div>`;
    }

    // A stage is played under the id "wave:N" (N = the `since` number it
    // stands for). "Lo nuevo" is just the newest stage, so it needs no id of
    // its own and keeps working when the next batch makes a newer one.
    const waveId = (wave) => `wave:${wave}`;
    const isWaveId = (id) => id.startsWith('wave:');
    const waveOf = (id) => Number(id.slice(5));

    // A sheet from school is played under "sheet:<its id>".
    const sheetId = (sheet) => `sheet:${sheet.id}`;
    const isSheetId = (id) => id.startsWith('sheet:');
    const sheetOf = (id) => CONTENT.sheetById(id.slice(6));

    // The record key of a stage is the one "Lo nuevo" already used for it
    // ("new-w4"), so a best score saved before stages existed is still there.
    // A sheet's is "sheet-<id>": no topic or stage uses that.
    function scoreKey(id){
        if(isSheetId(id)) return `sheet-${id.slice(6)}`;
        return isWaveId(id) ? `new-w${waveOf(id)}` : id;
    }

    function wordsFor(id){
        if(id === 'all') return CONTENT.allWords();
        if(id === 'weak') return weakWordObjects();
        if(isWaveId(id)) return CONTENT.wordsOfWave(waveOf(id));
        if(isSheetId(id)) return CONTENT.wordsOfSheet(sheetOf(id));
        return CONTENT.wordsOf(CONTENT.topicById(id));
    }

    // the words she keeps missing, as full word objects (anything no longer
    // in the content is ignored)
    function weakWordObjects(){
        const weak = new Set(STORAGE.weakWords());
        return CONTENT.allWords().filter(w => weak.has(w.en));
    }

    // The weak list as exercises: each word paired with the format she last
    // missed it in (a random eligible one when none was kept, or it no longer
    // applies), worst first. `limit` keeps the worst few.
    function weakItems(limit){
        const bank = CONTENT.allWords();
        const types = allowedTypes();
        const items = [];
        for(const entry of STORAGE.weakEntries()){
            for(const word of bank.filter(w => w.en === entry.word)){   // a homonym brings both pictures
                const eligible = ENGINE.eligibleTypes(word, types);
                if(!eligible.length) continue;
                const type = entry.type && eligible.includes(entry.type) ? entry.type : pick(eligible);
                items.push({ word, type });
            }
        }
        return limit ? items.slice(0, limit) : items;
    }

    function labelFor(id){
        if(id === 'all') return 'Repaso general';
        if(id === 'weak') return 'Lo que más le cuesta';
        if(isWaveId(id)){
            const stage = CONTENT.stage(waveOf(id));
            return `${stage.emoji} ${stage.name}`;
        }
        if(isSheetId(id)){
            const sheet = sheetOf(id);
            return `${sheet.icon} ${sheet.name}`;
        }
        return CONTENT.topicById(id).name.es;
    }

    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

    /* ---------------- home screen ---------------- */

    function topicCardHTML(topic){
        const best = STORAGE.getBest(topic.id);
        const words = CONTENT.wordsOf(topic);
        const latest = CONTENT.latestWave();
        const newCount = latest > CONTENT.DEFAULT_WAVE
            ? words.filter(w => w.since === latest).length
            : 0;

        let chip = '';
        if(newCount === words.length){
            chip = `<span class="chip-new">NUEVO</span>`;
        }else if(newCount > 0){
            chip = `<span class="chip-new">+${newCount} nueva${newCount > 1 ? 's' : ''}</span>`;
        }

        return `
            <button class="card topic-card" data-topic="${topic.id}">
                ${chip}
                <div class="card-badge">${scoreBadgeHTML(best)}</div>
                <span class="card-icon">${topic.icon}</span>
                <span class="card-title">${topic.name.es}</span>
                <span class="card-sub">${topic.name.en} · ${words.length} palabras</span>
            </button>`;
    }

    // Topics are grouped by the stage they first appeared in, newest first,
    // each under its plant. (A topic keeps its home stage even when a later
    // stage adds words to it — that shows up as its "+N nuevas" chip.) With a
    // single stage there is nothing to tell apart and it's the plain list.
    function renderTopicGrid(){
        const groups = new Map();
        for(const topic of CONTENT.TOPICS){
            const wave = CONTENT.introWave(topic);
            if(!groups.has(wave)) groups.set(wave, []);
            groups.get(wave).push(topic);
        }
        const grid = (list) => `<div class="topic-grid">${list.map(topicCardHTML).join('')}</div>`;
        const waves = [...groups.keys()].sort((a, b) => b - a);

        els.topicGrid.innerHTML = waves.length > 1
            ? waves.map(wave => {
                const stage = CONTENT.stage(wave);
                return `<h3 class="group-title">${stage.emoji} ${stage.name}</h3>${grid(groups.get(wave))}`;
            }).join('')
            : grid(CONTENT.TOPICS);

        els.topicGrid.querySelectorAll('[data-topic]').forEach(btn => {
            btn.addEventListener('click', () => startQuiz(btn.dataset.topic));
        });
    }

    function renderRepasoBadge(){
        const best = STORAGE.getBest('all');
        document.getElementById('repasoBadge').innerHTML = scoreBadgeHTML(best);
    }

    // The big "Lo nuevo" card is the newest stage, and only exists once there
    // is more than one. Its subtitle says which stage that is.
    function renderNewCard(){
        const words = CONTENT.newWords();
        els.btnNew.classList.toggle('hidden', words.length === 0);
        if(words.length === 0) return;

        const latest = CONTENT.latestWave();
        const stage = CONTENT.stage(latest);
        els.newSub.textContent = `${stage.emoji} ${stage.name} · ${plural(words.length, 'palabra nueva', 'palabras nuevas')}`;
        els.newBadge.innerHTML = scoreBadgeHTML(STORAGE.getBest(scoreKey(waveId(latest))));
    }

    // One card per school sheet, between "Lo nuevo" and the weak list. The
    // words are the sheet's alone: what the app teaches beyond it stays in
    // "Repaso general" and the topics.
    function renderSheetCards(){
        els.sheetRow.innerHTML = CONTENT.SHEETS.map(sheet => {
            const count = CONTENT.wordsOfSheet(sheet).length;
            return `
            <button class="card card-featured card-sheet" data-sheet="${sheet.id}">
                <div class="card-badge">${scoreBadgeHTML(STORAGE.getBest(scoreKey(sheetId(sheet))))}</div>
                <span class="card-icon">${sheet.icon}</span>
                <span class="card-title">${sheet.name}</span>
                <span class="card-sub">${plural(count, 'palabra', 'palabras')} de la hoja del cole</span>
            </button>`;
        }).join('');
        els.sheetRow.querySelectorAll('[data-sheet]').forEach(btn => {
            btn.addEventListener('click', () => startQuiz(`sheet:${btn.dataset.sheet}`));
        });
    }

    function stageCardHTML(wave){
        const stage = CONTENT.stage(wave);
        const count = CONTENT.wordsOfWave(wave).length;
        return `
            <button class="card stage-card" data-wave="${wave}">
                <div class="card-badge">${scoreBadgeHTML(STORAGE.getBest(scoreKey(waveId(wave))))}</div>
                <span class="card-icon">${stage.emoji}</span>
                <span class="card-title">${stage.name}</span>
                <span class="card-sub">${plural(count, 'palabra', 'palabras')}</span>
            </button>`;
    }

    // every stage but the newest (that one is the "Lo nuevo" card), newest first
    function renderStageRow(){
        const older = CONTENT.waves().slice(0, -1).reverse();
        if(!CONTENT.hasStages() || older.length === 0){
            els.stageRow.innerHTML = '';
            return;
        }
        els.stageRow.innerHTML = `
            <h3 class="group-title">🕒 Por etapas</h3>
            <div class="stage-grid">${older.map(stageCardHTML).join('')}</div>`;
        els.stageRow.querySelectorAll('[data-wave]').forEach(btn => {
            btn.addEventListener('click', () => startQuiz(waveId(Number(btn.dataset.wave))));
        });
    }

    // only offered once a few words are on the list — fewer would just
    // repeat the same two or three over and over
    const MIN_WEAK_WORDS = 3;

    function renderWeakCard(){
        const count = weakWordObjects().length;
        els.btnWeak.classList.toggle('hidden', count < MIN_WEAK_WORDS);
        if(count < MIN_WEAK_WORDS) return;
        els.weakSub.textContent = `${count} palabras para reforzar`;
    }

    function renderHome(){
        renderTopicGrid();
        renderRepasoBadge();
        renderNewCard();
        renderSheetCards();
        renderWeakCard();
        renderStageRow();
    }

    /* ---------------- scores modal ---------------- */

    // every "game" that can have a best score: repaso general, each stage
    // (newest first, the newest called "Lo nuevo") and each topic
    function scoreEntries(){
        const stages = CONTENT.hasStages() ? CONTENT.waves().slice().reverse() : [];
        return [
            { id: 'all', icon: '🎯', name: 'Repaso general' },
            ...CONTENT.SHEETS.map(sheet => ({ id: sheetId(sheet), icon: sheet.icon, name: sheet.name })),
            ...stages.map((wave, i) => {
                const stage = CONTENT.stage(wave);
                return { id: waveId(wave), icon: stage.emoji, name: i === 0 ? `Lo nuevo · ${stage.name}` : stage.name };
            }),
            ...CONTENT.TOPICS.map(t => ({ id: t.id, icon: t.icon, name: t.name.es })),
        ];
    }

    function renderScoresList(){
        els.scoresList.innerHTML = scoreEntries().map(entry => {
            const best = STORAGE.getBest(scoreKey(entry.id));
            const value = best
                ? `<span class="score-frac">${best.correct}/${best.total}</span>${renderStars(best.stars)}`
                : `<span class="score-empty">Todavía no jugaste</span>`;
            return `
                <div class="score-row">
                    <span class="score-icon">${entry.icon}</span>
                    <span class="score-name">${entry.name}</span>
                    <span class="score-value">${value}</span>
                </div>`;
        }).join('');
    }

    function openScores(){
        renderScoresList();
        els.scoresBackdrop.classList.remove('hidden');
    }

    function closeScores(){
        els.scoresBackdrop.classList.add('hidden');
        disarmReset(els.btnResetScores);
    }

    function wireScoresModal(){
        els.btnViewScores.addEventListener('click', openScores);
        els.btnCloseScores.addEventListener('click', closeScores);
        els.scoresBackdrop.addEventListener('click', (e) => {
            if(e.target === els.scoresBackdrop) closeScores();
        });
    }

    function wireCountPicker(){
        els.countOptions.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                els.countOptions.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                state.questionCount = Number(btn.dataset.count);
            });
        });
    }

    // two-tap reset (like memory-ldk's "start over"): the first tap arms
    // it and asks to confirm, the second within a few seconds does it —
    // hard to trigger by accident, no browser confirm() popup needed
    let resetArmed = false;
    let resetTimer = null;

    function wireResetScores(){
        const btn = els.btnResetScores;

        btn.addEventListener('click', () => {
            if(!resetArmed){
                resetArmed = true;
                btn.textContent = '¿Seguro? Tocá de nuevo para borrar';
                btn.classList.add('reset-armed');
                clearTimeout(resetTimer);
                resetTimer = setTimeout(() => disarmReset(btn), 3000);
                return;
            }

            STORAGE.resetAll();
            disarmReset(btn);
            renderHome();
            renderScoresList();
        });
    }

    function disarmReset(btn){
        resetArmed = false;
        clearTimeout(resetTimer);
        btn.textContent = '🔄 Reiniciar récords';
        btn.classList.remove('reset-armed');
    }

    /* ---------------- quiz screen ---------------- */

    function allowedTypes(){
        return AUDIO.supported
            ? ENGINE.QUESTION_TYPES
            : ENGINE.QUESTION_TYPES.filter(t => t !== 'audio_to_image');
    }

    function startQuiz(topicId){
        window.speechSynthesis && window.speechSynthesis.cancel();

        const words = wordsFor(topicId);
        if(words.length === 0){   // e.g. the weak list emptied out since the home screen was drawn
            goHome();
            return;
        }

        if(topicId === 'weak'){
            // the worst few, each first in the exact format she missed it in and
            // then in another one: two questions per word, as many words as fit
            state.session = ENGINE.buildReview({
                items: weakItems(Math.floor(state.questionCount / 2)),
                pool: CONTENT.allWords(),
                types: allowedTypes(),
                max: state.questionCount,
            });
        }else{
            state.session = ENGINE.buildSession({
                words,
                count: Math.min(state.questionCount, words.length * 4),
                types: allowedTypes(),
                // a short list (a stage that is only a handful of words)
                // would run out of wrong answers drawn from itself
                pool: words.length < 8 ? CONTENT.allWords() : undefined,
            });
        }
        state.index = 0;
        state.correctFirstTry = 0;
        state.missed = [];
        state.isReview = false;
        state.topicId = topicId;
        state.topicLabel = labelFor(topicId);

        showScreen('quiz');
        renderQuestion();
    }

    // an optional round made only of what she got wrong: first each exercise
    // again exactly as she missed it, then (for a short list) each word once
    // more in another format. Doesn't touch state.topicId, so "Jugar de nuevo"
    // from here still replays the full original topic, not this small pool
    function startReview(){
        if(state.missed.length === 0) return;

        window.speechSynthesis && window.speechSynthesis.cancel();

        state.session = ENGINE.buildReview({
            items: state.missed,
            pool: CONTENT.allWords(),
            types: allowedTypes(),
        });
        state.index = 0;
        state.correctFirstTry = 0;
        state.missed = [];
        state.isReview = true;
        state.topicLabel = 'Repaso de errores';

        showScreen('quiz');
        renderQuestion();
    }

    function currentQuestion(){
        return state.session[state.index];
    }

    function renderQuestion(){
        state.attemptedWrong = false;

        const q = currentQuestion();
        const total = state.session.length;

        els.quizProgressText.textContent = `${state.topicLabel} · Pregunta ${state.index + 1} de ${total}`;
        els.quizProgressFill.style.width = `${(state.index / total) * 100}%`;

        els.quizInstruction.textContent = INSTRUCTIONS[q.type];
        els.quizFeedback.textContent = '';
        els.quizFeedback.className = 'quiz-feedback';

        renderPrompt(q);
        renderOptions(q);
    }

    // what to hand the speech synthesizer — `speakAs` lets a word override
    // the spelling just for pronunciation without changing what's shown or
    // how it's tested for spelling; `noSpeech` opts a word out entirely,
    // for the handful the browser's voice mangles no matter how it's spelled
    function speechFor(word){
        return word.phrase || word.speakAs || word.en;
    }

    function canSpeak(word){
        return AUDIO.supported && !word.noSpeech;
    }

    function renderPrompt(q){
        if(q.type === 'image_to_word' || q.type === 'spelling_choice'){
            els.quizPrompt.innerHTML = `<div class="prompt-icon">${q.word.icon}</div>`;
            return;
        }

        if(q.type === 'count_objects'){
            els.quizPrompt.innerHTML = `
                <div class="count-grid">${Array.from({ length: q.n }, () => `<span>${q.item}</span>`).join('')}</div>`;
            return;
        }

        // is_it / this_is / do_you_have: a picture (or the "I have..." panel),
        // the sentence, and a 🔊 to hear it read aloud (left out when the
        // sentence names a word the voice mangles)
        if(q.type === 'is_it' || q.type === 'this_is' || q.type === 'do_you_have'){
            const speakerBtn = canSpeak(q.claimed)
                ? `<button class="speaker-btn" id="btnSpeak">🔊 Escuchar</button>`
                : '';
            const picture = q.type === 'do_you_have'
                ? `<div class="have-panel">
                       <span class="have-label">I HAVE…</span>
                       <div class="have-icons">${q.panel.map(w => `<span class="have-icon">${w.icon}</span>`).join('')}</div>
                   </div>`
                : `<div class="prompt-icon">${q.word.icon}</div>`;
            els.quizPrompt.innerHTML = `
                ${picture}
                <div class="prompt-sentence">${q.sentence}</div>
                ${speakerBtn}`;
            if(speakerBtn){
                document.getElementById('btnSpeak').addEventListener('click', () => AUDIO.speak(q.sentence));
            }
            return;
        }

        if(q.type === 'word_to_image'){
            const speakerBtn = canSpeak(q.word)
                ? `<button class="speaker-btn" id="btnSpeak">🔊 Escuchar</button>`
                : '';
            els.quizPrompt.innerHTML = `
                <div class="prompt-word">${q.word.en.toUpperCase()}</div>
                ${speakerBtn}`;
            if(speakerBtn){
                document.getElementById('btnSpeak').addEventListener('click', () => {
                    AUDIO.speak(speechFor(q.word));
                });
            }
            return;
        }

        // audio_to_image — the engine never hands this a noSpeech word, but
        // guard anyway so a future content change fails safe, not silent
        els.quizPrompt.innerHTML = `
            <button class="speaker-btn speaker-btn-big" id="btnSpeak">🔊 Escuchar</button>`;
        const speakBtn = document.getElementById('btnSpeak');
        if(canSpeak(q.word)){
            speakBtn.addEventListener('click', () => AUDIO.speak(speechFor(q.word)));
            setTimeout(() => AUDIO.speak(speechFor(q.word)), 300);
        }
    }

    function renderOptions(q){
        const isTextOptions = TEXT_ANSWER_TYPES.includes(q.type);

        els.quizOptions.innerHTML = q.options.map((opt, i) => {
            if(opt.mark){
                const isCheck = opt.mark === 'check';
                return `<button class="option option-mark option-mark-${opt.mark}" data-index="${i}"
                            aria-label="${isCheck ? 'verdadero' : 'falso'}">${isCheck ? '✔' : '✘'}</button>`;
            }
            if(isTextOptions){
                return `<button class="option option-text" data-index="${i}">${opt.text.toUpperCase()}</button>`;
            }
            return `<button class="option option-icon" data-index="${i}">${opt.icon}</button>`;
        }).join('');

        els.quizOptions.querySelectorAll('.option').forEach(btn => {
            btn.addEventListener('click', () => handleAnswer(btn, q));
        });
    }

    function handleAnswer(btn, q){
        if(btn.disabled) return;

        const index = Number(btn.dataset.index);
        const opt = q.options[index];

        if(opt.isCorrect){
            btn.classList.add('option-correct');
            els.quizOptions.querySelectorAll('.option').forEach(b => b.disabled = true);
            AUDIO.correct();

            els.quizFeedback.textContent = pick(RIGHT_MESSAGES);
            els.quizFeedback.className = 'quiz-feedback feedback-good';

            STORAGE.recordWord(q.word.en, !state.attemptedWrong, q.type);

            if(state.attemptedWrong){
                // the same word missed in two formats is two exercises to redo
                const already = state.missed.some(
                    m => m.word.en === q.word.en && m.word.icon === q.word.icon && m.type === q.type
                );
                if(!already) state.missed.push({ word: q.word, type: q.type });
            }else{
                state.correctFirstTry++;
            }

            els.quizProgressFill.style.width = `${((state.index + 1) / state.session.length) * 100}%`;

            // image_to_word and spelling_choice never make a sound on their
            // own — say the word once she's answered, right or wrong along
            // the way, as active-listening reinforcement before moving on.
            // word_to_image and audio_to_image already have their own 🔊.
            const silentType = SILENT_TYPES.includes(q.type);
            if(silentType && canSpeak(q.word)){
                AUDIO.speak(speechFor(q.word));
            }

            setTimeout(advance, silentType ? 1500 : 900);
        }else{
            btn.disabled = true;
            btn.classList.add('option-wrong');
            state.attemptedWrong = true;
            AUDIO.wrong();

            els.quizFeedback.textContent = pick(RETRY_MESSAGES);
            els.quizFeedback.className = 'quiz-feedback feedback-retry';
        }
    }

    function advance(){
        if(state.index + 1 >= state.session.length){
            showEnd();
        }else{
            state.index++;
            renderQuestion();
        }
    }

    /* ---------------- end screen ---------------- */

    function showEnd(){
        const total = state.session.length;
        const stars = ENGINE.starsFor(state.correctFirstTry, total);

        els.endStars.innerHTML = renderStars(stars);

        const titles = {
            3: '¡Genial! 🎉',
            2: '¡Muy bien! 👏',
            1: '¡Bien hecho! 💪',
            0: '¡Seguimos practicando! 🌱',
        };
        els.endTitle.textContent = titles[stars];
        els.endScore.textContent = state.isReview
            ? `Repasaste ${total} pregunta${total === 1 ? '' : 's'} — acertaste ${state.correctFirstTry} a la primera`
            : `Acertaste ${state.correctFirstTry} de ${total} a la primera`;

        // a review round is just practice — it never touches the topic's
        // recorded best score, per Carlos: "que el puntaje quede fijo"
        if(state.isReview || state.topicId === 'weak'){
            els.endBest.textContent = '';
        }else{
            const isNewBest = STORAGE.saveBest(scoreKey(state.topicId), stars, state.correctFirstTry, total);
            const best = STORAGE.getBest(scoreKey(state.topicId));
            els.endBest.textContent = isNewBest
                ? '🏆 ¡Nuevo mejor puntaje!'
                : (best ? `Tu mejor puntaje: ${best.correct}/${best.total} ${'★'.repeat(best.stars)}` : '');
        }

        const missedCount = state.missed.length;
        els.btnPracticeMissed.classList.toggle('hidden', missedCount === 0);
        els.btnPracticeMissed.textContent = `🔁 Practicar lo que fallé (${missedCount})`;

        showScreen('end');
        CONFETTI.burst(els.confetti, 30 + stars * 20);
        AUDIO.complete();
    }

    /* ---------------- screen switching ---------------- */

    function showScreen(name){
        ['home', 'quiz', 'end'].forEach(s => {
            els[`screen-${s}`].classList.toggle('hidden', s !== name);
        });
        els.btnBack.classList.toggle('hidden', name === 'home');
        if(name !== 'end') CONFETTI.clear(els.confetti);
    }

    function goHome(){
        window.speechSynthesis && window.speechSynthesis.cancel();
        renderHome();
        showScreen('home');
    }

    // There is no refresh button in a Home Screen app. Loading the page again
    // under a fresh URL skips the 10-minute file cache, and because every
    // script URL carries the build number, a newer build brings all of its
    // files with it. Saved scores live in localStorage and are untouched.
    function wireUpdate(){
        els.btnUpdate.addEventListener('click', () => {
            if(navigator.onLine === false){
                els.btnUpdate.textContent = 'sin conexión';
                setTimeout(() => { els.btnUpdate.textContent = 'buscar actualización'; }, 2500);
                return;
            }
            els.btnUpdate.textContent = 'buscando…';
            location.replace(`${location.pathname}?r=${Date.now()}`);
        });
    }

    function init(){
        cacheEls();
        document.getElementById('appVersion').textContent = CONTENT.VERSION;
        wireUpdate();
        renderHome();
        wireCountPicker();
        wireResetScores();
        wireScoresModal();

        // iOS Safari needs one real, synchronous tap to open the gate for
        // speechSynthesis — grab the very first tap anywhere, before she's
        // even picked a topic, so later auto-played questions aren't silent
        document.addEventListener('pointerdown', AUDIO.unlock, { once: true });

        els.btnRepaso.addEventListener('click', () => startQuiz('all'));
        els.btnNew.addEventListener('click', () => startQuiz(waveId(CONTENT.latestWave())));
        els.btnWeak.addEventListener('click', () => startQuiz('weak'));
        els.btnBack.addEventListener('click', goHome);
        els.btnMenu.addEventListener('click', goHome);
        els.btnRetry.addEventListener('click', () => startQuiz(state.topicId));
        els.btnPracticeMissed.addEventListener('click', startReview);
    }

    return { init };
})();
