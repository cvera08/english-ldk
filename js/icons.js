/*
 * ICONS — every picture the quiz can show, as inline SVG/emoji strings.
 * No image files: everything renders from code, so the app stays a
 * handful of text files (same spirit as memory-ldk's emoji cards).
 *
 * ICONS.emoji(char)      -> wraps a plain emoji for consistent sizing
 * ICONS.custom.xxx()     -> hand-drawn flat icon for words with no good emoji
 * ICONS.body(partId)     -> the shared kid-figure diagram with one part
 *                           highlighted (reused by every body/face word —
 *                           draw it once, point at a different spot each time)
 */

const ICONS = {

    emoji(char){
        return `<span class="icon-emoji">${char}</span>`;
    },

    custom: {

        glue(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <rect x="34" y="8" width="32" height="14" rx="4" fill="#e8b34d"/>
                <rect x="40" y="2" width="20" height="10" rx="3" fill="#c98f2e"/>
                <path d="M30 22 h40 l-4 62 a6 6 0 0 1-6 6 H40 a6 6 0 0 1-6-6 Z"
                      fill="#4fc3e0" stroke="#2f96b3" stroke-width="3"/>
                <rect x="38" y="40" width="24" height="30" rx="4" fill="#ffffff" opacity=".85"/>
                <path d="M50 47 v10 M45 52 h10" stroke="#4fc3e0" stroke-width="4" stroke-linecap="round"/>
                <circle cx="50" cy="63" r="4" fill="#4fc3e0"/>
            </svg>`;
        },

        eraser(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <rect x="15" y="35" width="70" height="34" rx="8" fill="#ff8fb3" stroke="#e0577f" stroke-width="3"/>
                <rect x="15" y="35" width="26" height="34" rx="8" fill="#ffd1e0"/>
                <line x1="41" y1="35" x2="41" y2="69" stroke="#e0577f" stroke-width="2"/>
            </svg>`;
        },

        sharpener(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <rect x="20" y="28" width="46" height="44" rx="8" fill="#7fd88f" stroke="#3f9d55" stroke-width="3"/>
                <circle cx="43" cy="50" r="10" fill="#ffffff" stroke="#3f9d55" stroke-width="3"/>
                <path d="M66 36 L88 50 L66 64 Z" fill="#e8b34d" stroke="#c98f2e" stroke-width="3" stroke-linejoin="round"/>
            </svg>`;
        },

        pencilCase(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <path d="M10 42 Q10 30 25 30 H75 Q90 30 90 42 V60 Q90 72 75 72 H25 Q10 72 10 60 Z"
                      fill="#b388ff" stroke="#8a5be0" stroke-width="3"/>
                <path d="M25 30 L35 20 H65 L75 30 Z" fill="#9a6bf0" stroke="#8a5be0" stroke-width="3"/>
                <circle cx="50" cy="51" r="5" fill="#ffe680"/>
            </svg>`;
        },

        uniform(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <path d="M50 12 L34 22 L20 16 L10 34 L22 42 V88 H78 V42 L90 34 L80 16 L66 22 Z"
                      fill="#5b7fdb" stroke="#3955a3" stroke-width="3" stroke-linejoin="round"/>
                <path d="M40 20 L50 40 L60 20" fill="none" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="50" cy="55" r="3" fill="#ffd54f"/>
                <circle cx="50" cy="68" r="3" fill="#ffd54f"/>
            </svg>`;
        },

        table(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <!-- tabletop -->
                <rect x="14" y="32" width="72" height="14" rx="4" fill="#ff9fc0" stroke="#e0577f" stroke-width="3"/>
                <!-- all four legs, straight down -->
                <line x1="24" y1="46" x2="22" y2="88" stroke="#3955a3" stroke-width="8" stroke-linecap="round"/>
                <line x1="76" y1="46" x2="78" y2="88" stroke="#3955a3" stroke-width="8" stroke-linecap="round"/>
                <line x1="38" y1="46" x2="37" y2="80" stroke="#3955a3" stroke-width="6" stroke-linecap="round"/>
                <line x1="62" y1="46" x2="63" y2="80" stroke="#3955a3" stroke-width="6" stroke-linecap="round"/>
            </svg>`;
        },

        cupboard(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <rect x="18" y="8" width="64" height="84" rx="6" fill="#ffd1e0" stroke="#e0577f" stroke-width="3"/>
                <line x1="50" y1="8" x2="50" y2="92" stroke="#e0577f" stroke-width="3"/>
                <circle cx="42" cy="50" r="3.5" fill="#e0577f"/>
                <circle cx="58" cy="50" r="3.5" fill="#e0577f"/>
            </svg>`;
        },

        // "I can jump" — both feet off the ground, arms up
        jump(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <path d="M30 88 q8 5 16 0 M54 88 q8 5 16 0" stroke="#cdd8e6" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="50" cy="22" r="12" fill="#ffd9b3"/>
                <path d="M39 17 Q42 8 50 8 Q58 8 61 17 Q54 12 50 12 Q46 12 39 17 Z" fill="#6b4226"/>
                <rect x="40" y="34" width="20" height="26" rx="9" fill="#7fd0e0"/>
                <line x1="44" y1="38" x2="26" y2="18" stroke="#7fd0e0" stroke-width="8" stroke-linecap="round"/>
                <line x1="56" y1="38" x2="74" y2="18" stroke="#7fd0e0" stroke-width="8" stroke-linecap="round"/>
                <circle cx="24" cy="15" r="6" fill="#ffd9b3"/>
                <circle cx="76" cy="15" r="6" fill="#ffd9b3"/>
                <path d="M42 58 Q34 66 38 76" stroke="#3955a3" stroke-width="9" fill="none" stroke-linecap="round"/>
                <path d="M58 58 Q66 66 62 76" stroke="#3955a3" stroke-width="9" fill="none" stroke-linecap="round"/>
                <ellipse cx="37" cy="79" rx="8" ry="5" fill="#5b7fdb"/>
                <ellipse cx="63" cy="79" rx="8" ry="5" fill="#5b7fdb"/>
            </svg>`;
        },

        // "I can hop" — balanced on one leg, the other bent up, arms out
        hop(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <path d="M24 93 q14 6 28 0" stroke="#cdd8e6" stroke-width="3" fill="none" stroke-linecap="round"/>
                <circle cx="46" cy="20" r="12" fill="#ffd9b3"/>
                <path d="M35 15 Q38 6 46 6 Q54 6 57 15 Q50 10 46 10 Q42 10 35 15 Z" fill="#6b4226"/>
                <rect x="36" y="32" width="20" height="26" rx="9" fill="#7fd0e0"/>
                <line x1="38" y1="38" x2="18" y2="44" stroke="#7fd0e0" stroke-width="8" stroke-linecap="round"/>
                <line x1="54" y1="38" x2="74" y2="32" stroke="#7fd0e0" stroke-width="8" stroke-linecap="round"/>
                <circle cx="16" cy="46" r="6" fill="#ffd9b3"/>
                <circle cx="76" cy="30" r="6" fill="#ffd9b3"/>
                <line x1="42" y1="58" x2="40" y2="86" stroke="#3955a3" stroke-width="9" stroke-linecap="round"/>
                <ellipse cx="38" cy="89" rx="9" ry="5" fill="#5b7fdb"/>
                <path d="M50 58 Q64 62 62 46" stroke="#3955a3" stroke-width="9" fill="none" stroke-linecap="round"/>
                <ellipse cx="63" cy="43" rx="8" ry="5" fill="#5b7fdb"/>
            </svg>`;
        },

        // "I can jump rope" — pigtails, pink shirt, green shorts, navy rope
        // looping overhead and underfoot, matching the girl in the worksheet
        jumpRope(){
            return `
            <svg viewBox="0 0 100 100" class="icon-svg">
                <path d="M22 55 Q15 25 50 12 Q85 25 78 55" fill="none" stroke="#3955a3" stroke-width="4" stroke-linecap="round"/>
                <path d="M22 55 Q50 82 78 55" fill="none" stroke="#3955a3" stroke-width="4" stroke-linecap="round"/>
                <path d="M44 62 Q38 72 42 84" stroke="#ffd9b3" stroke-width="9" fill="none" stroke-linecap="round"/>
                <path d="M56 62 Q62 72 58 84" stroke="#ffd9b3" stroke-width="9" fill="none" stroke-linecap="round"/>
                <ellipse cx="41" cy="86" rx="7" ry="4" fill="#3955a3"/>
                <ellipse cx="59" cy="86" rx="7" ry="4" fill="#3955a3"/>
                <rect x="39" y="56" width="22" height="14" rx="6" fill="#6fc78a"/>
                <rect x="40" y="38" width="20" height="22" rx="8" fill="#ff8fb3"/>
                <line x1="41" y1="42" x2="24" y2="52" stroke="#ff8fb3" stroke-width="7" stroke-linecap="round"/>
                <line x1="59" y1="42" x2="76" y2="52" stroke="#ff8fb3" stroke-width="7" stroke-linecap="round"/>
                <circle cx="22" cy="55" r="5" fill="#ffd9b3"/>
                <circle cx="78" cy="55" r="5" fill="#ffd9b3"/>
                <circle cx="50" cy="27" r="11" fill="#ffd9b3"/>
                <path d="M40 22 Q43 14 50 14 Q57 14 60 22 Q53 18 50 18 Q47 18 40 22 Z" fill="#6b4226"/>
                <circle cx="35" cy="20" r="5" fill="#6b4226"/>
                <circle cx="65" cy="20" r="5" fill="#6b4226"/>
                <circle cx="46" cy="27" r="1.6" fill="#3a2a20"/>
                <circle cx="54" cy="27" r="1.6" fill="#3a2a20"/>
                <path d="M45 31 Q50 34 55 31" fill="none" stroke="#a8462f" stroke-width="2" stroke-linecap="round"/>
            </svg>`;
        },
    },

    /* ---------- shared body / face figure ---------- */

    // A broad body part (the whole leg, the whole foot) gets its outline
    // traced instead of one arbitrary dot — the shape itself carries the
    // meaning, not just its position, the way "both eyes" beat one dot
    // between them. A specific small part (the knee joint, the toe tip)
    // stays a precise point, and sits on the *other* limb so its position
    // can't be memorized against the broad marker's.
    _bodyPoints: {
        head:  { x: 110, y: 48 },  // forehead, just below the hairline
        hair:  { x: 110, y: 22 },  // top of the hair
        eyes:  [{ x: 95, y: 62 }, { x: 125, y: 62 }], // both eyes, not the gap between them
        ears:  { x: 151, y: 66 },
        nose:  { x: 110, y: 71 },
        mouth: { x: 110, y: 84 },
        arm:   { x: 72,  y: 145 },
        hand:  { x: 54,  y: 179 },
        leg:   { region: 'line', x1: 120, y1: 195, x2: 130, y2: 270 }, // whole right leg
        knee:  { x: 95, y: 233 },                                     // just the left knee joint
        foot:  { region: 'ellipse', cx: 82, cy: 284, rx: 20, ry: 11 }, // whole left foot
        toe:   { x: 156, y: 286 },                                    // just the right foot's tip
    },

    body(partId){

        const raw = ICONS._bodyPoints[partId];
        const entries = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

        const marker = entries.map(p => {
            if(p.region === 'line'){
                return `<line class="body-marker-region"
                              x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}"
                              stroke-width="34" />`;
            }
            if(p.region === 'ellipse'){
                return `<ellipse class="body-marker-region"
                                  cx="${p.cx}" cy="${p.cy}" rx="${p.rx + 9}" ry="${p.ry + 9}"
                                  stroke-width="7" />`;
            }
            return `
               <circle class="body-marker-ring" cx="${p.x}" cy="${p.y}" r="20" />
               <circle class="body-marker-dot"  cx="${p.x}" cy="${p.y}" r="8" />`;
        }).join('');

        return `
        <svg viewBox="0 0 220 320" class="icon-svg icon-svg-body">
            <!-- legs -->
            <line x1="100" y1="195" x2="90"  y2="270" stroke="#3955a3" stroke-width="26" stroke-linecap="round"/>
            <line x1="120" y1="195" x2="130" y2="270" stroke="#3955a3" stroke-width="26" stroke-linecap="round"/>
            <!-- feet -->
            <ellipse cx="82"  cy="284" rx="20" ry="11" fill="#5b7fdb"/>
            <ellipse cx="138" cy="284" rx="20" ry="11" fill="#5b7fdb"/>
            <!-- arms -->
            <line x1="95"  y1="120" x2="55"  y2="176" stroke="#7fd0e0" stroke-width="20" stroke-linecap="round"/>
            <line x1="125" y1="120" x2="165" y2="176" stroke="#7fd0e0" stroke-width="20" stroke-linecap="round"/>
            <!-- hands -->
            <circle cx="54"  cy="181" r="14" fill="#ffd9b3"/>
            <circle cx="166" cy="181" r="14" fill="#ffd9b3"/>
            <!-- torso -->
            <rect x="78" y="104" width="64" height="98" rx="28" fill="#7fd0e0"/>
            <!-- ears -->
            <circle cx="69"  cy="66" r="9" fill="#ffd9b3"/>
            <circle cx="151" cy="66" r="9" fill="#ffd9b3"/>
            <!-- head -->
            <circle cx="110" cy="66" r="44" fill="#ffd9b3"/>
            <!-- hair -->
            <path d="M66 55 Q70 14 110 14 Q150 14 154 55 Q140 40 110 40 Q80 40 66 55 Z" fill="#6b4226"/>
            <!-- face -->
            <circle cx="95"  cy="62" r="5" fill="#3a2a20"/>
            <circle cx="125" cy="62" r="5" fill="#3a2a20"/>
            <path d="M108 71 q2 5 4 0" fill="none" stroke="#c98f6e" stroke-width="2" stroke-linecap="round"/>
            <path d="M97 83 Q110 93 123 83" fill="none" stroke="#a8462f" stroke-width="4" stroke-linecap="round"/>
            ${marker}
        </svg>`;
    },
};
