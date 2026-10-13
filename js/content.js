/*
 * CONTENT — every topic and word the quiz can ask about.
 *
 * This is the only file you should need to touch to add a new exam's
 * vocabulary later: append a topic object (or push words into an
 * existing one) and the menu, the "Repaso general" mix, the four
 * question types and the score screen all pick it up automatically.
 *
 * Each word is: { en, es, icon, phrase?, speakAs?, noSpeech?, since? }
 *   en        - the English word the quiz teaches and tests spelling against
 *   es        - the Spanish translation (used for the topic grid, not shown per-question)
 *   icon      - HTML string for the picture: ICONS.emoji('🚗') or ICONS.custom.xxx()
 *   phrase    - optional full sentence spoken instead of `en` (e.g. "I can jump")
 *   speakAs   - optional respelling used only for text-to-speech, when the
 *               real spelling throws the browser's pronunciation off
 *   noSpeech  - true if the browser's voice mangles this word badly enough
 *               that it shouldn't be spoken at all — it's skipped for the
 *               listen-only question type and never gets a 🔊 button
 *               (e.g. "cupboard": no respelling we tried sounded right)
 *
 * Waves: exams are cumulative, so everything lives in one bank, and each
 * topic (or a single word) can carry `since: N` — the wave it was added in.
 * Anything without it is wave 3, i.e. everything up to the third exam. The
 * highest wave present is "lo nuevo": it gets its own quiz mode, a NUEVO chip
 * on its topics, and a "+N nuevas" chip on older topics that grew. To add the
 * next batch, give the new topics/words `since: 5` — nothing else to touch.
 *
 * Sources: colegio de Marilé, setiembre 2026 — "INGLES L 2" (examen oficial)
 * y "REPASO PRIMERO" (repaso armado por la mamá); octubre 2026 — fotos del
 * cuaderno de mamá y de los tests fotocopiables del libro "GO! International 1"
 * (Richmond/Santillana) — all pictures here are our own drawings or emoji,
 * not the publisher's illustrations (the site is public).
 */

const CONTENT = {

    DEFAULT_WAVE: 3,

    TOPICS: [
        {
            id: 'school',
            icon: '🎒',
            name: { es: 'Útiles y juguetes', en: 'School supplies & toys' },
            words: [
                { en: 'ball',         es: 'pelota',            icon: ICONS.emoji('⚽') },
                { en: 'doll',         es: 'muñeca',            icon: ICONS.emoji('🪆') },
                { en: 'car',          es: 'auto',              icon: ICONS.emoji('🚗') },
                { en: 'teddy bear',   es: 'oso de peluche',    icon: ICONS.emoji('🧸') },
                { en: 'pencil case',  es: 'cartuchera',        icon: ICONS.custom.pencilCase() },
                { en: 'sharpener',    es: 'sacapuntas',        icon: ICONS.custom.sharpener() },
                { en: 'game console', es: 'consola de juegos', icon: ICONS.emoji('🎮') },
                { en: 'scooter',      es: 'monopatín',         icon: ICONS.emoji('🛴') },
                { en: 'backpack',     es: 'mochila',           icon: ICONS.emoji('🎒') },
                { en: 'book',         es: 'libro',             icon: ICONS.emoji('📚') },
                { en: 'crayon',       es: 'crayón',            icon: ICONS.emoji('🖍️') },
                { en: 'glue',         es: 'pegamento',         icon: ICONS.custom.glue() },
                { en: 'train',        es: 'tren',              icon: ICONS.emoji('🚂') },
                { en: 'ruler',        es: 'regla',             icon: ICONS.emoji('📏') },
                { en: 'pencil',       es: 'lápiz',             icon: ICONS.emoji('✏️') },
                { en: 'eraser',       es: 'goma de borrar',    icon: ICONS.custom.eraser() },
                { en: 'pen',          es: 'lapicera',          icon: ICONS.emoji('🖊️') },
                { en: 'robot',        es: 'robot',             icon: ICONS.emoji('🤖') },
                { en: 'plane',        es: 'avión',             icon: ICONS.emoji('✈️') },
            ],
        },
        {
            id: 'classroom',
            icon: '🏫',
            name: { es: 'El salón de clase', en: 'The classroom' },
            words: [
                { en: 'class',    es: 'salón de clase', icon: ICONS.emoji('🏫') },
                { en: 'computer', es: 'computadora',    icon: ICONS.emoji('💻') },
                { en: 'teacher',  es: 'maestra',        icon: ICONS.emoji('👩‍🏫') },
                { en: 'uniform',  es: 'uniforme',       icon: ICONS.custom.uniform() },
            ],
        },
        {
            id: 'furniture',
            icon: '🛋️',
            name: { es: 'Los muebles', en: 'Furniture' },
            words: [
                { en: 'chair',     es: 'silla',    icon: ICONS.emoji('🪑') },
                { en: 'table',     es: 'mesa',     icon: ICONS.custom.table() },
                { en: 'cupboard',  es: 'armario',  icon: ICONS.custom.cupboard(), noSpeech: true },
                { en: 'sofa',      es: 'sofá',     icon: ICONS.emoji('🛋️') },
                { en: 'trash can', es: 'papelera', icon: ICONS.emoji('🗑️') },
            ],
        },
        {
            id: 'family',
            icon: '👪',
            name: { es: 'La familia', en: 'Family' },
            words: [
                { en: 'mom',     es: 'mamá',    icon: ICONS.emoji('👩') },
                { en: 'dad',     es: 'papá',    icon: ICONS.emoji('👨') },
                { en: 'sister',  es: 'hermana', icon: ICONS.emoji('👧') },
                { en: 'brother', es: 'hermano', icon: ICONS.emoji('👦') },
                { en: 'grandma', es: 'abuela',  icon: ICONS.emoji('👵') },
                { en: 'grandpa', es: 'abuelo',  icon: ICONS.emoji('👴') },
            ],
        },
        {
            id: 'emotions',
            icon: '😊',
            name: { es: 'Las emociones', en: 'Emotions' },
            words: [
                { en: 'bored',   es: 'aburrido/a',  icon: ICONS.emoji('🥱') },
                { en: 'happy',   es: 'feliz',        icon: ICONS.emoji('😊') },
                { en: 'hungry',  es: 'con hambre',   icon: ICONS.emoji('🤤') },
                { en: 'scared',  es: 'asustado/a',   icon: ICONS.emoji('😨') },
                { en: 'sad',     es: 'triste',       icon: ICONS.emoji('😢') },
            ],
        },
        {
            id: 'body',
            icon: '🧍',
            name: { es: 'El cuerpo y la cara', en: 'Body & face' },
            words: [
                { en: 'head',  es: 'cabeza',  icon: ICONS.body('head') },
                { en: 'hair',  es: 'pelo',    icon: ICONS.body('hair') },
                { en: 'eyes',  es: 'ojos',    icon: ICONS.body('eyes') },
                { en: 'ears',  es: 'orejas',  icon: ICONS.body('ears') },
                { en: 'nose',  es: 'nariz',   icon: ICONS.body('nose') },
                { en: 'mouth', es: 'boca',    icon: ICONS.body('mouth') },
                { en: 'arm',   es: 'brazo',   icon: ICONS.body('arm') },
                { en: 'hand',  es: 'mano',    icon: ICONS.body('hand') },
                { en: 'leg',   es: 'pierna',  icon: ICONS.body('leg') },
                { en: 'knee',  es: 'rodilla', icon: ICONS.body('knee') },
                { en: 'foot',  es: 'pie',     icon: ICONS.body('foot') },
                { en: 'toe',   es: 'dedo del pie', icon: ICONS.body('toe') },
            ],
        },
        {
            id: 'actions',
            icon: '🏃',
            name: { es: 'Las acciones — "I can..."', en: 'Actions' },
            words: [
                { en: 'run',       es: 'correr',           icon: ICONS.emoji('🏃'), phrase: 'I can run' },
                { en: 'walk',      es: 'caminar',          icon: ICONS.emoji('🚶'), phrase: 'I can walk' },
                { en: 'jump',      es: 'saltar',           icon: ICONS.custom.jump(),     phrase: 'I can jump' },
                { en: 'hop',       es: 'saltar en un pie', icon: ICONS.custom.hop(),      phrase: 'I can hop' },
                { en: 'jump rope', es: 'saltar la soga',   icon: ICONS.custom.jumpRope(), phrase: 'I can jump rope' },
            ],
        },

        /* ---------------- wave 4 (octubre 2026) ---------------- */

        {
            id: 'fruits',
            icon: '🍎',
            since: 4,
            name: { es: 'Las frutas', en: 'Fruits' },
            words: [
                { en: 'apple',      es: 'manzana',  icon: ICONS.emoji('🍎') },
                { en: 'banana',     es: 'banana',   icon: ICONS.emoji('🍌') },
                { en: 'mangoes',    es: 'mango',    icon: ICONS.emoji('🥭') }, // the worksheet says MANGOES, over one mango
                { en: 'orange',     es: 'naranja',  icon: ICONS.emoji('🍊') },
                { en: 'pear',       es: 'pera',     icon: ICONS.emoji('🍐') },
                { en: 'strawberry', es: 'frutilla', icon: ICONS.emoji('🍓') },
            ],
        },
        {
            id: 'food',
            icon: '🍽️',
            since: 4,
            name: { es: 'La comida y las bebidas', en: 'Food & drinks' },
            words: [
                { en: 'cake',    es: 'torta',    icon: ICONS.emoji('🎂') },
                { en: 'cheese',  es: 'queso',    icon: ICONS.emoji('🧀') },
                { en: 'chicken', es: 'pollo',    icon: ICONS.emoji('🍗') },
                { en: 'fish',    es: 'pescado',  icon: ICONS.emoji('🐟') },
                { en: 'fruits',  es: 'frutas',   icon: ICONS.cluster(['🍎', '🍌', '🍇']) },
                { en: 'meat',    es: 'carne',    icon: ICONS.emoji('🥩') },
                { en: 'salad',   es: 'ensalada', icon: ICONS.emoji('🥗') },
                { en: 'soup',    es: 'sopa',     icon: ICONS.emoji('🍲') },
                { en: 'yogurt',  es: 'yogur',    icon: ICONS.custom.yogurt() },
                { en: 'milk',    es: 'leche',    icon: ICONS.custom.milk() },
                { en: 'water',   es: 'agua',     icon: ICONS.custom.water() },
                { en: 'juice',   es: 'jugo',     icon: ICONS.emoji('🧃') },
            ],
        },
        {
            id: 'pets',
            icon: '🐶',
            since: 4,
            name: { es: 'Las mascotas', en: 'Pets' },
            words: [
                { en: 'dog',    es: 'perro',     icon: ICONS.emoji('🐶') },
                { en: 'cat',    es: 'gato',      icon: ICONS.emoji('🐱') },
                { en: 'rabbit', es: 'conejo',    icon: ICONS.emoji('🐰') },
                { en: 'parrot', es: 'loro',      icon: ICONS.emoji('🦜') },
                { en: 'fish',   es: 'pez',       icon: ICONS.emoji('🐟') }, // also in food; Repaso lists it once
                { en: 'spider', es: 'araña',     icon: ICONS.emoji('🕷️') },
                { en: 'mouse',  es: 'ratón',     icon: ICONS.emoji('🐭') },
                { en: 'snake',  es: 'serpiente', icon: ICONS.emoji('🐍') },
            ],
        },
        {
            id: 'house',
            icon: '🏠',
            since: 4,
            name: { es: 'La casa', en: 'House' },
            words: [
                { en: 'bed',      es: 'cama',     icon: ICONS.emoji('🛏️') },
                { en: 'rug',      es: 'alfombra', icon: ICONS.custom.rug() },
                { en: 'lamp',     es: 'lámpara',  icon: ICONS.custom.lamp() },
                { en: 'clock',    es: 'reloj',    icon: ICONS.emoji('⏰') },
                { en: 'mirror',   es: 'espejo',   icon: ICONS.emoji('🪞') },
                { en: 'picture',  es: 'cuadro',   icon: ICONS.emoji('🖼️') },
                { en: 'pajamas',  es: 'pijama',   icon: ICONS.custom.pajamas() },
                { en: 'pillow',   es: 'almohada', icon: ICONS.custom.pillow() },
            ],
        },
        {
            id: 'patterns',
            icon: '🔷',
            since: 4,
            name: { es: 'Lunares, rayas y más', en: 'Patterns' },
            words: [
                { en: 'spots',    es: 'lunares',   icon: ICONS.pattern('spots') },
                { en: 'diamonds', es: 'rombos',    icon: ICONS.pattern('diamonds') },
                { en: 'stripes',  es: 'rayas',     icon: ICONS.pattern('stripes') },
                { en: 'stars',    es: 'estrellas', icon: ICONS.pattern('stars') },
            ],
        },
        {
            id: 'weather',
            icon: '⛅',
            since: 4,
            name: { es: 'El clima', en: 'Weather' },
            words: [
                { en: 'cloudy', es: 'nublado',   icon: ICONS.emoji('☁️') },
                { en: 'sunny',  es: 'soleado',   icon: ICONS.emoji('☀️') },
                { en: 'rainy',  es: 'lluvioso',  icon: ICONS.emoji('🌧️') },
                { en: 'cold',   es: 'frío',      icon: ICONS.emoji('🥶') },
                { en: 'hot',    es: 'caluroso',  icon: ICONS.emoji('🥵') },
            ],
        },
        {
            id: 'seasons',
            icon: '🍂',
            since: 4,
            name: { es: 'Las estaciones', en: 'Seasons' },
            words: [
                { en: 'spring', es: 'primavera', icon: ICONS.emoji('🌸') },
                { en: 'summer', es: 'verano',    icon: ICONS.emoji('🏖️') },
                { en: 'fall',   es: 'otoño',     icon: ICONS.emoji('🍂') },
                { en: 'winter', es: 'invierno',  icon: ICONS.emoji('⛄') },
            ],
        },
    ],

    /* a topic's words, each tagged with its topic id and the wave it came in */
    wordsOf(topic){
        return topic.words.map(word => ({
            ...word,
            topicId: topic.id,
            since: word.since ?? topic.since ?? CONTENT.DEFAULT_WAVE,
        }));
    },

    /* every word from every topic, flattened — used by "Repaso general"
       and by the distractor picker. A word that appears in two topics
       (e.g. fish as food and as a pet) is listed once, first topic wins. */
    allWords(){
        const seen = new Set();
        return CONTENT.TOPICS
            .flatMap(topic => CONTENT.wordsOf(topic))
            .filter(word => {
                if(seen.has(word.en)) return false;
                seen.add(word.en);
                return true;
            });
    },

    latestWave(){
        return Math.max(...CONTENT.allWords().map(w => w.since));
    },

    /* "lo nuevo": every word from the latest wave, wherever it lives */
    newWords(){
        const latest = CONTENT.latestWave();
        if(latest <= CONTENT.DEFAULT_WAVE) return [];
        return CONTENT.allWords().filter(w => w.since === latest);
    },

    topicById(id){
        return CONTENT.TOPICS.find(t => t.id === id);
    },
};
