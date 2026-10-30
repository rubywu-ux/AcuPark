import { useId } from "react";

/**
 * Dubs the Husky, drawn as layered vector parts (body, tail, head, ears, eyes, jaw) so the
 * splash can animate him loosely: tail wags, head wobbles, ears flick and the jaw opens to bark.
 * Animation classes (.db-*) live in globals.css.
 */
// Matte retro palette pulled toward the app's tokens (ink #211F27, brand #502E83, gold #FFC700),
// softened so it reads like a printed vinyl sticker rather than glossy vector art.
const INK = "#211f27";
const DARK = "#3b3742";
const GREY = "#8c8794";
const FUR = "#f6efe1";
const MUSTARD = "#f0bf3e";
const PURPLE = "#502e83";
const PAPER = "#fbf6ea";
const PINK = "#e7a7a4";

export default function DubsBark({ size = 220 }: { size?: number }) {
  const sticker = useId();
  const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 200 230"
      className="db-root overflow-visible"
      aria-hidden
    >
      <defs>
        {/* Die-cut sticker: a paper border grown from Dubs's silhouette, a flat offset shadow
            (no blur) and a fine matte grain over everything. */}
        <filter id={sticker} filterUnits="userSpaceOnUse" x="-20" y="-30" width="240" height="295" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="5" />
          {/* Blur then re-sharpen the alpha so the die-cut edge has soft, rounded corners */}
          <feGaussianBlur stdDeviation="2.5" />
          <feComponentTransfer result="cut">
            <feFuncA type="linear" slope="6" intercept="-1.6" />
          </feComponentTransfer>
          <feFlood floodColor={PAPER} />
          <feComposite in2="cut" operator="in" result="border" />
          <feOffset in="cut" dx="0" dy="5" result="drop" />
          <feFlood floodColor="#1c0c38" floodOpacity="0.45" />
          <feComposite in2="drop" operator="in" result="shadow" />
          <feMerge result="art">
            <feMergeNode in="shadow" />
            <feMergeNode in="border" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" values="0 0 0 0 0.13  0 0 0 0 0.1  0 0 0 0 0.16  0 0 0 0.14 0" />
          <feComposite in2="cut" operator="in" result="grain" />
          <feMerge>
            <feMergeNode in="art" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${sticker})`}>
        {/* Tail — a fluffy plume curling up behind the right haunch; wags from its base */}
        <g className="db-tail">
          <path
            d="M146 216 C170 220 190 206 194 184 C197 166 190 150 178 146 C170 144 166 152 172 158 C180 166 180 186 166 196 C160 200 152 202 146 202 Z"
            fill={DARK}
          />
          <path d="M178 146 C190 150 197 166 194 184 C188 176 182 166 172 158 C166 152 170 144 178 146 Z" fill={FUR} />
          <path
            d="M146 216 C170 220 190 206 194 184 C197 166 190 150 178 146 C170 144 166 152 172 158 C180 166 180 186 166 196 C160 200 152 202 146 202"
            fill="none"
            {...line}
          />
        </g>

        <g className="db-body">
          {/* Sitting body: narrow shoulders; the lower sides run down inside the haunches */}
          <path d="M60 138 C50 156 46 176 46 196 L46 222 L154 222 L154 196 C154 176 150 156 140 138 Z" fill={DARK} />
          <path d="M60 138 C50 156 46 176 46 196 L46 222 L154 222 L154 196 C154 176 150 156 140 138" fill="none" {...line} />

          {/* Haunches: round grey thighs tucking behind the front legs, with two fur clumps sweeping down the outer edge */}
          <path d="M67.9 191.1 C65 188.5 60 186.5 54 187 C46 187.5 40.5 190.5 38 196 L41 197 C37 199.5 34.5 202.5 33.5 206.5 L36.4 207 C34.2 210.5 34.5 215.5 36 218 C37 220 38 221 40 222 L74 222 C78 212 76 198 67.9 191.1 Z" fill={GREY} {...line} />
          <path d="M132.1 191.1 C135 188.5 140 186.5 146 187 C154 187.5 159.5 190.5 162 196 L159 197 C163 199.5 165.5 202.5 166.5 206.5 L163.6 207 C165.8 210.5 165.5 215.5 164 218 C163 220 162 221 160 222 L126 222 C122 212 124 198 132.1 191.1 Z" fill={GREY} {...line} />
          {/* A fine strand of fur texture inside each haunch, following its curve */}
          <path d="M47 194 C44.5 197 43.5 200.5 44 204 M153 194 C155.5 197 156.5 200.5 156 204" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />

          {/* White chest flowing down into the front legs, which sit in front of the haunches */}
          <path d="M74 138 C66 160 66 192 72 222 L128 222 C134 192 134 160 126 138 Z" fill={FUR} />
          <path d="M67.9 191.1 C68.3 199.2 69.8 210.8 72 222 M132.1 191.1 C131.7 199.2 130.2 210.8 128 222" fill="none" {...line} />

          {/* Front legs: one line splits the pair */}
          <path d="M100 180 V216" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />

          {/* Back feet resting forward under the haunches */}
          <path d="M40 222 C40 213 66 213 66 222 C66 228 40 228 40 222 Z" fill={FUR} {...line} />
          <path d="M134 222 C134 213 160 213 160 222 C160 228 134 228 134 222 Z" fill={FUR} {...line} />
          <path d="M49 226.5 v-4 M57 226.5 v-4 M143 226.5 v-4 M151 226.5 v-4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />

          {/* Front paws, wider than the legs */}
          <path d="M70 221 C70 209 100 208 100 221 C100 229 70 229 70 221 Z" fill={FUR} {...line} />
          <path d="M100 221 C100 208 130 209 130 221 C130 229 100 229 100 221 Z" fill={FUR} {...line} />
          <path d="M80 227 v-4.5 M89 227 v-4.5 M111 227 v-4.5 M120 227 v-4.5" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          {/* Bandana */}
          <path d="M58 126 C78 136 122 136 142 126 L100 182 Z" fill={MUSTARD} {...line} />
          <text x="100" y="156" textAnchor="middle" fontSize="24" fontWeight="900" fill={PURPLE} fontFamily="Georgia, serif">
            W
          </text>
        </g>

        <g className="db-head">
          {/* Ears */}
          <g className="db-ear-l">
            <path d="M48 70 L50 4 L92 38 Z" fill={DARK} {...line} />
            <path d="M57 56 L58 20 L81 40 Z" fill={PINK} />
          </g>
          <g className="db-ear-r">
            <path d="M152 70 L150 4 L108 38 Z" fill={DARK} {...line} />
            <path d="M143 56 L142 20 L119 40 Z" fill={PINK} />
          </g>

          {/* Head and the malamute mask */}
          <path
            d="M100 24 C128 24 148 38 154 60 L166 66 L157 74 L168 84 L156 90 L165 101 L150 104 C141 122 122 134 100 134 C78 134 59 122 50 104 L35 101 L44 90 L32 84 L43 74 L34 66 L46 60 C52 38 72 24 100 24 Z"
            fill={DARK}
            {...line}
          />
          <path
            d="M100 62 C90 62 84 55 75 55 C60 57 52 72 54 86 L48 92 L57 96 L53 104 L62 104 C70 120 84 129 100 130 C116 129 130 120 138 104 L147 104 L143 96 L152 92 L146 86 C148 72 140 57 125 55 C116 55 110 62 100 62 Z"
            fill={FUR}
          />
          <path d="M93 40 C96 52 96 64 100 76 C104 64 104 52 107 40 C102 37 98 37 93 40 Z" fill={DARK} />
          <ellipse cx="79" cy="59" rx="7" ry="4" fill={FUR} />
          <ellipse cx="121" cy="59" rx="7" ry="4" fill={FUR} />
          {/* Cheek fluff */}
          <path d="M64 112 L70 108 L72 115 M136 112 L130 108 L128 115" fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />

          {/* Eyes */}
          <g className="db-eyes">
            {/* Simple cute eyes: solid black ovals with one white sparkle */}
            <ellipse cx="81" cy="75" rx="6.6" ry="7.8" fill={INK} />
            <ellipse cx="119" cy="75" rx="6.6" ry="7.8" fill={INK} />
            <circle cx="83.3" cy="72" r="2.4" fill="#fff" />
            <circle cx="121.3" cy="72" r="2.4" fill="#fff" />
          </g>

          {/* Mouth: the dark inside and tongue show as the jaw drops */}
          <g className="db-mouth">
            <path d="M85 103 C87 122 113 122 115 103 Z" fill="#5c1f2c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d="M91 114 C93 121 107 121 109 114 C105 110 95 110 91 114 Z" fill="#e8798a" />
          </g>
          <g className="db-jaw">
            <path d="M85 103 C87 115 113 115 115 103 C109 109 91 109 85 103 Z" fill={FUR} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          </g>

          {/* Upper muzzle, nose and lip */}
          <path d="M75 92 C75 79 125 79 125 92 C125 103 113 107 100 107 C87 107 75 103 75 92 Z" fill={FUR} />
          <path d="M85 103 C92 107 98 105 100 100 C102 105 108 107 115 103" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M100 94 V100" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M89 86 C89 79 111 79 111 86 C111 93 104 96.5 100 96.5 C96 96.5 89 93 89 86 Z" fill={INK} />
        </g>
      </g>
    </svg>
  );
}
