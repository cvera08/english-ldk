/*
 * AUDIO — reads English words aloud with the browser's built-in
 * speechSynthesis, so a pre-reader can play the "listen and choose"
 * questions without anyone in the room. No audio files, same "generate
 * it, don't ship it" approach as memory-ldk's WebAudio blips.
 */

const AUDIO = (() => {

    const supported = 'speechSynthesis' in window;
    let englishVoice = null;

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

    return { supported, speak };
})();
