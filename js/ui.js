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
    };

    const INSTRUCTIONS = {
        image_to_word:   '¿Cómo se dice en inglés?',
        word_to_image:   'Tocá el dibujo correcto',
        audio_to_image:  'Escuchá y tocá el dibujo correcto',
        spelling_choice: '¿Cómo se escribe en inglés?',
    };

    const RIGHT_MESSAGES = ['¡Muy bien! ✅', '¡Genial! 🌟', '¡Exacto! 🎉', '¡Perfecto! 💫', '¡Así se hace! 👏'];
    const RETRY_MESSAGES = ['¡Casi! Probá de nuevo 💪', 'No es esa, ¡intentá otra! 🤔', 'Cerca... ¡una más! 🌈'];

    function cacheEls(){
        [
            'screen-home', 'screen-quiz', 'screen-end',
            'topicGrid', 'countOptions', 'btnRepaso', 'btnBack',
            'quizProgressText', 'quizProgressFill',
            'quizInstruction', 'quizPrompt', 'quizOptions', 'quizFeedback',
            'endStars', 'endTitle', 'endScore', 'endBest',
            'btnRetry', 'btnMenu', 'confetti', 'btnResetScores',
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

    /* ---------------- home screen ---------------- */

    function renderTopicGrid(){
        els.topicGrid.innerHTML = CONTENT.TOPICS.map(topic => {
            const best = STORAGE.getBest(topic.id);
            const badge = best ? `<div class="card-badge">${renderStars(best.stars)}</div>` : '';
            return `
                <button class="card topic-card" data-topic="${topic.id}">
                    ${badge}
                    <span class="card-icon">${topic.icon}</span>
                    <span class="card-title">${topic.name.es}</span>
                    <span class="card-sub">${topic.name.en} · ${topic.words.length} palabras</span>
                </button>`;
        }).join('');

        els.topicGrid.querySelectorAll('[data-topic]').forEach(btn => {
            btn.addEventListener('click', () => startQuiz(btn.dataset.topic));
        });
    }

    function renderRepasoBadge(){
        const best = STORAGE.getBest('all');
        const holder = document.getElementById('repasoBadge');
        holder.innerHTML = best ? renderStars(best.stars) : '';
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
            renderTopicGrid();
            renderRepasoBadge();
        });
    }

    function disarmReset(btn){
        resetArmed = false;
        clearTimeout(resetTimer);
        btn.textContent = '🔄 Reiniciar récords';
        btn.classList.remove('reset-armed');
    }

    /* ---------------- quiz screen ---------------- */

    function startQuiz(topicId){
        window.speechSynthesis && window.speechSynthesis.cancel();

        const words = topicId === 'all'
            ? CONTENT.allWords()
            : CONTENT.topicById(topicId).words.map(w => ({ ...w, topicId }));

        const types = AUDIO.supported
            ? ENGINE.QUESTION_TYPES
            : ENGINE.QUESTION_TYPES.filter(t => t !== 'audio_to_image');

        state.session = ENGINE.buildSession({ words, count: Math.min(state.questionCount, words.length * 4), types });
        state.index = 0;
        state.correctFirstTry = 0;
        state.topicId = topicId;
        state.topicLabel = topicId === 'all' ? 'Repaso general' : CONTENT.topicById(topicId).name.es;

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
        const isTextOptions = q.type === 'image_to_word' || q.type === 'spelling_choice';

        els.quizOptions.innerHTML = q.options.map((opt, i) => {
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

            els.quizFeedback.textContent = pick(RIGHT_MESSAGES);
            els.quizFeedback.className = 'quiz-feedback feedback-good';

            if(!state.attemptedWrong) state.correctFirstTry++;

            els.quizProgressFill.style.width = `${((state.index + 1) / state.session.length) * 100}%`;

            // image_to_word and spelling_choice never make a sound on their
            // own — say the word once she's answered, right or wrong along
            // the way, as active-listening reinforcement before moving on.
            // word_to_image and audio_to_image already have their own 🔊.
            const silentType = (q.type === 'image_to_word' || q.type === 'spelling_choice');
            if(silentType && canSpeak(q.word)){
                AUDIO.speak(speechFor(q.word));
            }

            setTimeout(advance, silentType ? 1500 : 900);
        }else{
            btn.disabled = true;
            btn.classList.add('option-wrong');
            state.attemptedWrong = true;

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
        const isNewBest = STORAGE.saveBest(state.topicId, stars, state.correctFirstTry, total);
        const best = STORAGE.getBest(state.topicId);

        els.endStars.innerHTML = renderStars(stars);

        const titles = {
            3: '¡Genial! 🎉',
            2: '¡Muy bien! 👏',
            1: '¡Bien hecho! 💪',
            0: '¡Seguimos practicando! 🌱',
        };
        els.endTitle.textContent = titles[stars];
        els.endScore.textContent = `Acertaste ${state.correctFirstTry} de ${total} a la primera`;

        els.endBest.textContent = isNewBest
            ? '🏆 ¡Nuevo mejor puntaje!'
            : (best ? `Tu mejor puntaje: ${best.correct}/${best.total} ${'★'.repeat(best.stars)}` : '');

        showScreen('end');
        CONFETTI.burst(els.confetti, 30 + stars * 20);
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
        renderTopicGrid();
        renderRepasoBadge();
        showScreen('home');
    }

    function init(){
        cacheEls();
        renderTopicGrid();
        renderRepasoBadge();
        wireCountPicker();
        wireResetScores();

        els.btnRepaso.addEventListener('click', () => startQuiz('all'));
        els.btnBack.addEventListener('click', goHome);
        els.btnMenu.addEventListener('click', goHome);
        els.btnRetry.addEventListener('click', () => startQuiz(state.topicId));
    }

    return { init };
})();
