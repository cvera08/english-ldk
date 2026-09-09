/*
 * AUDIO — two things:
 *
 *  1. speechSynthesis, to read English words aloud so a pre-reader can
 *     play the "listen and choose" questions without anyone in the room.
 *  2. tiny WebAudio blips for right/wrong/complete, in the same spirit
 *     (and with similar tones) as memory-ldk's audio.js — gentle, no
 *     files, nothing to download or break offline.
 */

const AUDIO = (() => {

    /* ---------------- speech ---------------- */

    const supported = 'speechSynthesis' in window;
    let englishVoice = null;
    let unlocked = false;

    function pickVoice(){
        const voices = window.speechSynthesis.getVoices();
        englishVoice =
            voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang && v.lang.startsWith('en')) ||
            null;
    }

    if(supported){
        pickVoice();
        // most browsers load voices asynchronously
        window.speechSynthesis.onvoiceschanged = pickVoice;
    }

    function speak(text){
        if(!supported || !text) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
        if(englishVoice) utterance.voice = englishVoice;

        window.speechSynthesis.speak(utterance);
    }

    // Safari on iOS only reliably lets speechSynthesis speak from code
    // that runs synchronously inside a real tap — a question's auto-play,
    // which fires from a setTimeout, can silently do nothing on an
    // untouched page. Call this once, straight from the first tap
    // anywhere in the app (see ui.js), to open the gate early.
    function unlock(){
        if(unlocked || !supported) return;
        unlocked = true;
        const primer = new SpeechSynthesisUtterance('');
        primer.volume = 0;
        window.speechSynthesis.speak(primer);
    }

    /* ---------------- WebAudio blips ---------------- */

    let ctx = null;

    function context(){
        if(ctx) return ctx;
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if(!Ctor) return null;
        try{ ctx = new Ctor(); }catch(e){ ctx = null; }
        return ctx;
    }

    function tone(freq, start, duration, type, gain){
        const ac = context();
        if(!ac) return;
        const t0 = ac.currentTime + start;
        const osc = ac.createOscillator();
        const amp = ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        amp.gain.setValueAtTime(0.0001, t0);
        amp.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.015);
        amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(amp).connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    function play(notes){
        const ac = context();
        if(!ac) return;
        if(ac.state === 'suspended') ac.resume();
        notes.forEach(n => tone(n[0], n[1], n[2], n[3], n[4]));
    }

    function correct(){
        play([[660, 0, 0.10, 'sine', 0.10], [880, 0.08, 0.14, 'sine', 0.09]]);
    }

    function wrong(){
        play([[300, 0, 0.12, 'sine', 0.06], [230, 0.09, 0.14, 'sine', 0.05]]);
    }

    function complete(){
        play([
            [523, 0.00, 0.14, 'sine', 0.10],
            [659, 0.12, 0.14, 'sine', 0.10],
            [784, 0.24, 0.14, 'sine', 0.10],
            [1047, 0.36, 0.36, 'sine', 0.11],
        ]);
    }

    return { supported, speak, unlock, correct, wrong, complete };
})();
