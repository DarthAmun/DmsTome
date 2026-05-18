export type NameGender = 'male' | 'female' | 'neutral'

interface SyllableTable {
  starts: string[]
  mids: string[]
  ends: Record<NameGender, string[]>
}

interface SurnameTable {
  prefixes: string[]
  suffixes: string[]
}

const TABLES: Record<string, SyllableTable> = {
  elf: {
    starts: ['aer', 'cael', 'elan', 'fal', 'gal', 'ith', 'lir', 'mae', 'naer', 'ryl', 'syl', 'thal', 'vael', 'wyn', 'ara', 'ell', 'sil', 'var', 'zar', 'lia'],
    mids:   ['a', 'ae', 'el', 'ir', 'or', 'yl', 'an', 'en', 'ith'],
    ends: {
      male:    ['las', 'dor', 'rion', 'thas', 'ven', 'rath', 'mir', 'dan', 'ias', 'thor'],
      female:  ['riel', 'wen', 'iel', 'niel', 'ra', 'liel', 'ria', 'nia', 'lia', 'aria'],
      neutral: ['ath', 'an', 'el', 'en', 'il', 'or', 'in'],
    },
  },
  dwarf: {
    starts: ['bor', 'dur', 'grim', 'khaz', 'thor', 'brum', 'dag', 'folk', 'grun', 'helf', 'krag', 'mor', 'orm', 'runn', 'stein', 'torg', 'dwal', 'bofr'],
    mids:   ['a', 'o', 'u', 'al', 'in', 'or', 'um'],
    ends: {
      male:    ['in', 'ak', 'ur', 'ik', 'um', 'orn', 'und', 'gar', 'ri', 'li'],
      female:  ['a', 'ia', 'da', 'ra', 'ina', 'ita', 'ena'],
      neutral: ['in', 'an', 'en', 'or', 'ik', 'un'],
    },
  },
  orc: {
    starts: ['gar', 'groh', 'kaz', 'mog', 'gor', 'bru', 'drak', 'gruk', 'krak', 'lok', 'mur', 'naz', 'rag', 'skul', 'urg', 'zug', 'thr', 'grul', 'brug'],
    mids:   ['a', 'o', 'u', 'ag', 'og', 'ug', 'ah'],
    ends: {
      male:    ['ash', 'uk', 'gar', 'ug', 'ak', 'ong', 'ul', 'ag', 'urk', 'oth'],
      female:  ['a', 'ra', 'sha', 'ka', 'ta', 'na'],
      neutral: ['ak', 'uk', 'og', 'ul', 'an', 'ar'],
    },
  },
  halfling: {
    starts: ['bil', 'ros', 'pip', 'mer', 'sam', 'fod', 'ham', 'ned', 'olo', 'per', 'tod', 'wil', 'cor', 'rob', 'tim'],
    mids:   ['bo', 'lo', 'do', 'ro', 'li', 'di', 'mi'],
    ends: {
      male:    ['bo', 'do', 'go', 'ro', 'wise', 'foot', 'buck', 'kin'],
      female:  ['a', 'ia', 'ra', 'da', 'na', 'bella', 'ina'],
      neutral: ['er', 'on', 'in', 'ey', 'et', 'ley'],
    },
  },
  gnome: {
    starts: ['fiz', 'nim', 'quib', 'bib', 'dim', 'flip', 'glix', 'kink', 'nix', 'pib', 'tib', 'wim', 'zib', 'snib', 'brim'],
    mids:   ['ble', 'dle', 'zle', 'kle', 'gle', 'tle'],
    ends: {
      male:    ['wick', 'bur', 'spark', 'kin', 'bit', 'tick', 'gig'],
      female:  ['a', 'ia', 'ina', 'ella', 'ita', 'ika'],
      neutral: ['er', 'ey', 'et', 'in', 'kin', 'ix'],
    },
  },
  tiefling: {
    starts: ['az', 'cim', 'riv', 'xiv', 'ach', 'ari', 'bel', 'cas', 'dex', 'fex', 'gex', 'hex', 'kel', 'lex', 'mal', 'nyx', 'ryl', 'six', 'vix', 'zel', 'rix'],
    mids:   ['ar', 'el', 'er', 'or', 'ix', 'ex', 'ax', 'im'],
    ends: {
      male:    ['us', 'on', 'ar', 'ek', 'os', 'ath', 'ax', 'ius'],
      female:  ['a', 'ia', 'ra', 'eth', 'ith', 'ix', 'ela', 'ora'],
      neutral: ['er', 'el', 'ex', 'eth', 'or', 'in'],
    },
  },
  dragonborn: {
    starts: ['aar', 'ghesh', 'kren', 'rash', 'shez', 'akra', 'bala', 'dha', 'faer', 'ges', 'mehe', 'nad', 'shed', 'thorn', 'vrinn', 'zeph', 'yrj'],
    mids:   ['ar', 'ash', 'esh', 'ir', 'or', 'ax', 'ex'],
    ends: {
      male:    ['thar', 'gar', 'esh', 'rix', 'var', 'ix', 'rax'],
      female:  ['a', 'ia', 'ra', 'ala', 'ara', 'esa', 'ixa'],
      neutral: ['ar', 'ash', 'or', 'en', 'el', 'ex'],
    },
  },
  human: {
    starts: ['ald', 'ber', 'cal', 'dal', 'fen', 'gar', 'har', 'jor', 'kar', 'lan', 'mar', 'nor', 'per', 'rad', 'sig', 'tor', 'ulf', 'var', 'wen', 'ash', 'bren', 'dun', 'eld', 'ger', 'helm', 'kas', 'leo', 'nath', 'orik', 'seth'],
    mids:   ['al', 'ar', 'en', 'er', 'in', 'or', 'un', 'ic', 'el', 'ot'],
    ends: {
      male:    ['ric', 'ard', 'bert', 'mund', 'win', 'olf', 'helm', 'bald', 'man', 'ton', 'row'],
      female:  ['a', 'ia', 'ild', 'wyn', 'na', 'sa', 'ra', 'da', 'ela', 'ina'],
      neutral: ['en', 'on', 'in', 'an', 'ey', 'ton', 'ley'],
    },
  },
}

const SURNAME_TABLES: Record<string, SurnameTable> = {
  elf: {
    prefixes: ['Aur', 'Cael', 'Dawn', 'Eld', 'Gal', 'Lith', 'Moon', 'Star', 'Syl', 'Wind', 'Wyn', 'Dusk', 'Vael', 'Mist'],
    suffixes: ['bloom', 'bow', 'dawn', 'dusk', 'leaf', 'light', 'moon', 'shade', 'song', 'whisper', 'wind', 'blossom', 'river'],
  },
  dwarf: {
    prefixes: ['Anvil', 'Axe', 'Coal', 'Fire', 'Forge', 'Gold', 'Iron', 'Rock', 'Stone', 'Storm', 'Thunder', 'Deep', 'Flint'],
    suffixes: ['beard', 'brow', 'fist', 'forge', 'hammer', 'helm', 'hide', 'mane', 'shield', 'skin', 'crest', 'mantle'],
  },
  orc: {
    prefixes: ['Ash', 'Blood', 'Bone', 'Dark', 'Dusk', 'Iron', 'Skull', 'Scar', 'Shadow', 'War', 'Rage', 'Grim'],
    suffixes: ['axe', 'blade', 'breaker', 'crusher', 'fang', 'jaw', 'smasher', 'tusk', 'gore', 'render'],
  },
  halfling: {
    prefixes: ['Bright', 'Burrow', 'Clover', 'Good', 'Green', 'Hill', 'Honey', 'Lucky', 'Merry', 'Sweet', 'Bram', 'Cozy'],
    suffixes: ['barrel', 'berry', 'bottom', 'brook', 'bush', 'feet', 'field', 'flower', 'hill', 'home', 'nook', 'door'],
  },
  gnome: {
    prefixes: ['Bright', 'Copper', 'Gear', 'Quick', 'Silver', 'Spark', 'Spring', 'Tick', 'Tink', 'Whirr', 'Fizz', 'Clank'],
    suffixes: ['bolt', 'cog', 'fidget', 'gear', 'jack', 'nick', 'spring', 'tick', 'wick', 'wind', 'gadget', 'crank'],
  },
  tiefling: {
    prefixes: ['Ash', 'Cinder', 'Ember', 'Night', 'Shadow', 'Sorrow', 'Spite', 'Vex', 'Void', 'Woe', 'Dusk', 'Ruin'],
    suffixes: ['bane', 'born', 'burn', 'fall', 'flame', 'heart', 'mark', 'pyre', 'rose', 'thorn', 'brand', 'scar'],
  },
  dragonborn: {
    prefixes: ['Ash', 'Char', 'Cinder', 'Ember', 'Scale', 'Sear', 'Smoke', 'Storm', 'Thunder', 'Vex', 'Blaze', 'Gale'],
    suffixes: ['claw', 'fang', 'fire', 'hide', 'maw', 'scale', 'smoke', 'storm', 'talon', 'wing', 'breath', 'roar'],
  },
  human: {
    prefixes: ['Ash', 'Black', 'Bold', 'Bright', 'Cold', 'Dark', 'Fair', 'Grey', 'Hard', 'High', 'North', 'Red', 'Stone', 'Swift', 'West', 'White', 'Wild'],
    suffixes: ['brook', 'burn', 'dale', 'field', 'ford', 'grove', 'ham', 'haven', 'hill', 'holm', 'moor', 'pool', 'rock', 'thorn', 'vale', 'well', 'wood'],
  },
}

const RACE_KEYWORDS: [string, string][] = [
  ['eladrin',    'elf'],
  ['drow',       'elf'],
  ['elf',        'elf'],
  ['elv',        'elf'],
  ['dwarf',      'dwarf'],
  ['dwarv',      'dwarf'],
  ['hobgoblin',  'orc'],
  ['goblin',     'orc'],
  ['orc',        'orc'],
  ['halfling',   'halfling'],
  ['hobbit',     'halfling'],
  ['gnome',      'gnome'],
  ['tiefling',   'tiefling'],
  ['cambion',    'tiefling'],
  ['dragonborn', 'dragonborn'],
  ['draconic',   'dragonborn'],
  ['kobold',     'dragonborn'],
]

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function matchKey(race: string): string {
  const r = race.toLowerCase()
  for (const [keyword, key] of RACE_KEYWORDS) {
    if (r.includes(keyword)) return key
  }
  return 'human'
}

function buildFirstName(table: SyllableTable, gender: NameGender): string {
  const start = pick(table.starts)
  const mid = Math.random() > 0.55 ? pick(table.mids) : ''
  const end = pick(table.ends[gender])
  return cap(start + mid + end)
}

function buildSurname(table: SurnameTable): string {
  return pick(table.prefixes) + pick(table.suffixes)
}

export function generateFullName(gender: NameGender, race: string): { first: string; last: string } {
  const key = matchKey(race)
  return {
    first: buildFirstName(TABLES[key], gender),
    last:  buildSurname(SURNAME_TABLES[key]),
  }
}
