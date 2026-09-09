/*
 * CONTENT — every topic and word the quiz can ask about.
 *
 * This is the only file you should need to touch to add a new exam's
 * vocabulary later: append a topic object (or push words into an
 * existing one) and the menu, the "Repaso general" mix, the four
 * question types and the score screen all pick it up automatically.
 *
 * Each word is: { en, es, icon, phrase?, speakAs?, noSpeech? }
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
 * Source: colegio de Marilé, setiembre 2026 — "INGLES L 2" (examen oficial)
 * y "REPASO PRIMERO" (repaso armado por la mamá) — temas acumulados de los
 * exámenes 1 y 2 de primero.
 */

const CONTENT = {

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
    ],

    /* every word from every topic, flattened, tagged with its topic id —
       used by the "Repaso general" mode and by the distractor picker */
    allWords(){
        return CONTENT.TOPICS.flatMap(topic =>
            topic.words.map(word => ({ ...word, topicId: topic.id }))
        );
    },

    topicById(id){
        return CONTENT.TOPICS.find(t => t.id === id);
    },
};
