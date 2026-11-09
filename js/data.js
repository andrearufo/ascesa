// Ascesa — dati di gioco (risorse, ere, lavori, edifici, tecnologie)
import { t, lang, localize } from './i18n.js';

export const ERAS = [
  null,
  { name: 'Preistoria', years: [-40000, -3500], sky: ['#f4a259', '#5b8e7d'], ground: '#6b8f3e' },
  { name: 'Età Antica', years: [-3500, 500], sky: ['#f6c177', '#4a7fa7'], ground: '#8a9a3e' },
  { name: 'Medioevo', years: [500, 1450], sky: ['#c9d6df', '#52616b'], ground: '#5f7a3a' },
  { name: 'Rinascimento', years: [1450, 1760], sky: ['#ffd6a5', '#5c80bc'], ground: '#77a04a' },
  { name: 'Era Industriale', years: [1760, 1914], sky: ['#c7b198', '#596e79'], ground: '#5d5c45' },
  { name: 'Era Atomica', years: [1914, 1990], sky: ['#a8dadc', '#457b9d'], ground: '#6d7a5a' },
  { name: "Era dell'Informazione", years: [1990, 2080], sky: ['#9bf6ff', '#3a0ca3'], ground: '#4a5560' },
  { name: 'Era Iper-tecnologica', years: [2080, 2400], sky: ['#f72585', '#10002b'], ground: '#2b2d42' },
];

export const RES = {
  food: { name: 'Cibo', icon: '🍖', cap: 200, key: 'C' },
  wood: { name: 'Legno', icon: '🪵', cap: 150, key: 'L' },
  stone: { name: 'Pietra', icon: '🪨', cap: 100, key: 'P' },
  metal: { name: 'Metallo', icon: '⚙️', cap: 200, key: 'M' },
  gold: { name: 'Oro', icon: '💰', cap: 100, key: 'O' },
  knowledge: { name: 'Conoscenza', icon: '📜', cap: Infinity, key: 'K' },
  exotic: { name: 'Materia esotica', icon: '✨', cap: Infinity },
};

// use (edifici): risorse consumate al secondo; se finiscono l'edificio rende in proporzione.
// out: produzione per lavoratore al secondo. slots: i posti sono forniti dagli edifici.
// power: i lavoratori rallentano se manca energia.
export const JOBS = {
  forager: { name: 'Raccoglitore', icon: '🫐', out: { food: 1 }, desc: 'Caccia e raccoglie cibo.' },
  woodcutter: { name: 'Taglialegna', icon: '🪓', out: { wood: 0.7 }, desc: 'Abbatte alberi.' },
  quarrier: { name: 'Cavatore', icon: '⛏️', out: { stone: 0.5 }, req: 'stone_tools', desc: 'Estrae pietra.' },
  sage: { name: 'Saggio', icon: '🧙', out: { knowledge: 0.3 }, desc: 'Osserva il mondo e tramanda il sapere.' },
  soldier: { name: 'Soldato', icon: '🛡️', out: {}, def: 1, req: 'spears', desc: 'Difende dalle razzie. +1 difesa (moltiplicata dalle tecnologie).' },
  farmer: { name: 'Contadino', icon: '👨‍🌾', out: { food: 3 }, req: 'agriculture', slots: true, desc: 'Coltiva i campi. Richiede Fattorie.' },
  miner: { name: 'Minatore', icon: '⚒️', out: { metal: 0.6 }, req: 'bronze', slots: true, desc: 'Estrae metallo. Richiede Miniere.' },
  scholar: { name: 'Studioso', icon: '📖', out: { knowledge: 2 }, req: 'writing', slots: true, desc: 'Produce conoscenza. Richiede Biblioteche, Monasteri o Università.' },
  merchant: { name: 'Mercante', icon: '🪙', out: { gold: 0.8 }, req: 'currency', slots: true, desc: 'Commercia oro. Richiede Mercati o Banche.' },
  priest: { name: 'Sacerdote', icon: '🙏', out: { knowledge: 0.2 }, stab: 0.6, req: 'priesthood', slots: true, desc: 'Aumenta la stabilità. Richiede Templi.' },
  worker: { name: 'Operaio', icon: '👷', out: { metal: 2, wood: 1, stone: 1 }, req: 'steam', slots: true, power: true, desc: 'Lavora in fabbrica. Richiede Fabbriche ed energia.' },
  scientist: { name: 'Scienziato', icon: '🔬', out: { knowledge: 6.25 }, req: 'computers', slots: true, power: true, desc: 'Ricerca avanzata. Richiede Laboratori ed energia.' },
  technician: { name: 'Tecnico IA', icon: '🤖', out: { knowledge: 37.5 }, req: 'internet', slots: true, power: true, desc: 'Addestra intelligenze artificiali. Richiede Data center.' },
  engineer: { name: 'Ingegnere quantistico', icon: '🧬', out: { exotic: 0.005 }, req: 'quantum', slots: true, power: true, desc: 'Sintetizza materia esotica. Richiede Fabbriche quantistiche.' },
};

// Edifici. mult = crescita costo; housing/caps/slots/prod/energy(+/-)/pol/ai/stab/def
export const BUILDINGS = {
  // --- Era 1
  hut: { name: 'Capanna', icon: '🛖', cost: { wood: 12 }, mult: 1.12, housing: 2, sprite: 'hut' },
  stockpile: { name: 'Deposito', icon: '📦', cost: { wood: 30 }, mult: 1.2, caps: { food: 150, wood: 120, stone: 100 }, sprite: 'pile' },
  firepit: { name: 'Focolare', icon: '🔥', req: 'fire', cost: { wood: 25, stone: 10 }, use: { wood: 0.1 }, mult: 1.3, stab: 2, sprite: 'fire' },
  cave_painting: { name: 'Pitture rupestri', icon: '🎨', req: 'rituals', cost: { stone: 40, wood: 20 }, mult: 1.25, prod: { knowledge: 0.25 }, stab: 1, sprite: 'rock' },
  palisade: { name: 'Palizzata', icon: '🚧', req: 'spears', cost: { wood: 60 }, mult: 1.2, def: 4, sprite: 'fence' },
  // --- Era 2
  house: { name: 'Casa', icon: '🏠', req: 'masonry', cost: { wood: 50, stone: 70 }, mult: 1.13, housing: 5, sprite: 'house' },
  farm: { name: 'Fattoria', icon: '🌾', req: 'agriculture', cost: { wood: 60, stone: 20 }, slots: { farmer: 4 }, sprite: 'field' },
  granary: { name: 'Granaio', icon: '🏺', req: 'pottery', cost: { wood: 80, stone: 60 }, mult: 1.2, caps: { food: 600 }, sprite: 'granary' },
  warehouse: { name: 'Magazzino', icon: '🏚️', req: 'masonry', cost: { wood: 150, stone: 120 }, mult: 1.2, caps: { wood: 400, stone: 400, metal: 400 }, sprite: 'shed' },
  mine: { name: 'Miniera', icon: '⛰️', req: 'bronze', cost: { wood: 120, stone: 100 }, slots: { miner: 4 }, sprite: 'mine' },
  market: { name: 'Mercato', icon: '🏪', req: 'currency', cost: { wood: 200, stone: 150, metal: 40 }, slots: { merchant: 3 }, caps: { gold: 300 }, sprite: 'market' },
  library: { name: 'Biblioteca', icon: '📚', req: 'writing', cost: { wood: 150, stone: 250 }, slots: { scholar: 3 }, sprite: 'library' },
  temple: { name: 'Tempio', icon: '🏛️', req: 'priesthood', cost: { stone: 300, gold: 40 }, slots: { priest: 2 }, stab: 2, sprite: 'temple' },
  barracks: { name: 'Caserma', icon: '⚔️', req: 'bronze_weapons', cost: { stone: 200, metal: 60 }, def: 15, sprite: 'barracks' },
  walls: { name: 'Mura', icon: '🧱', req: 'fortification', cost: { stone: 600 }, mult: 1.25, def: 50, sprite: 'wall' },
  forge: { name: 'Fucina', icon: '🔨', req: 'iron', cost: { stone: 500, metal: 150 }, use: { wood: 1 }, mult: 1.18, prod: { metal: 1.5 }, sprite: 'forge' },
  // --- Era 3
  storehouse: { name: 'Grande magazzino', icon: '🏬', req: 'engineering', cost: { wood: 2000, stone: 2500 }, mult: 1.2, caps: { food: 4000, wood: 5000, stone: 5000, metal: 5000, gold: 1500 }, sprite: 'shed' },
  aqueduct: { name: 'Acquedotto', icon: '🌉', req: 'engineering', cost: { stone: 2500, metal: 300 }, housing: 20, stab: 1, sprite: 'aqueduct' },
  windmill: { name: 'Mulino a vento', icon: '🌬️', req: 'mills', cost: { wood: 2000, stone: 1000 }, prod: { food: 25 }, sprite: 'windmill' },
  monastery: { name: 'Monastero', icon: '⛪', req: 'theology', cost: { stone: 2000, gold: 300 }, slots: { scholar: 3 }, prod: { knowledge: 3 }, stab: 1, sprite: 'church' },
  castle: { name: 'Castello', icon: '🏰', req: 'chivalry', cost: { stone: 6000, metal: 800, gold: 400 }, use: { gold: 1 }, def: 300, housing: 10, sprite: 'castle' },
  guildhall: { name: 'Sede delle corporazioni', icon: '🏦', req: 'guilds', cost: { stone: 3000, gold: 800 }, slots: { merchant: 4 }, caps: { gold: 2000 }, sprite: 'hall' },
  // --- Era 4
  townhouse: { name: 'Palazzo', icon: '🏘️', req: 'architecture', cost: { stone: 15000, wood: 8000 }, housing: 50, sprite: 'palazzo' },
  emporium: { name: 'Emporio', icon: '🏪', req: 'banking', cost: { stone: 20000, gold: 3000 }, mult: 1.2, caps: { food: 50000, wood: 50000, stone: 50000, metal: 50000, gold: 25000 }, sprite: 'shed' },
  bank: { name: 'Banca', icon: '🏦', req: 'banking', cost: { stone: 15000, gold: 5000 }, slots: { merchant: 6 }, caps: { gold: 20000 }, sprite: 'bank' },
  university: { name: 'Università', icon: '🎓', req: 'humanism', cost: { stone: 20000, gold: 4000 }, slots: { scholar: 6 }, sprite: 'university' },
  printing_press: { name: 'Tipografia', icon: '🖨️', req: 'printing', cost: { stone: 10000, metal: 3000 }, use: { wood: 5 }, prod: { knowledge: 30 }, sprite: 'workshop' },
  harbor: { name: 'Porto', icon: '⚓', req: 'navigation', cost: { wood: 30000, stone: 20000 }, use: { wood: 10 }, prod: { gold: 15, food: 30 }, sprite: 'harbor' },
  theater: { name: 'Teatro', icon: '🎭', req: 'arts', cost: { stone: 20000, gold: 8000 }, use: { gold: 10 }, stab: 3, mult: 1.25, sprite: 'theater' },
  star_fort: { name: 'Fortezza a stella', icon: '🏯', req: 'gunpowder', cost: { stone: 40000, metal: 15000 }, use: { gold: 20 }, def: 6000, sprite: 'castle' },
  // --- Era 5
  tenement: { name: 'Casermone operaio', icon: '🏢', req: 'urbanization', cost: { stone: 80000, metal: 50000 }, housing: 150, stab: -0.5, sprite: 'block' },
  factory: { name: 'Fabbrica', icon: '🏭', req: 'steam', cost: { wood: 60000, metal: 40000 }, slots: { worker: 100 }, mult: 1.1, energy: -5, pol: 0.0005, sprite: 'factory' },
  coal_plant: { name: 'Centrale a carbone', icon: '🏗️', req: 'steam', cost: { stone: 50000, metal: 30000 }, use: { wood: 120 }, energy: 25, pol: 0.002, sprite: 'plant' },
  silo: { name: 'Deposito industriale', icon: '🛢️', req: 'steel', cost: { metal: 50000, wood: 50000 }, mult: 1.2, caps: { food: 1e6, wood: 1e6, stone: 1e6, metal: 1e6, gold: 5e5 }, sprite: 'tank' },
  steel_mill: { name: 'Acciaieria', icon: '🔩', req: 'steel', cost: { metal: 120000, stone: 100000 }, use: { wood: 250 }, prod: { metal: 400 }, energy: -10, pol: 0.0015, sprite: 'factory' },
  railway: { name: 'Ferrovia', icon: '🚂', req: 'railways', cost: { metal: 150000, wood: 100000 }, use: { wood: 60 }, prod: { gold: 80 }, sprite: 'rail' },
  institute: { name: 'Istituto di ricerca', icon: '🏫', req: 'electricity', cost: { metal: 200000, gold: 80000 }, prod: { knowledge: 500 }, energy: -10, sprite: 'university' },
  hospital: { name: 'Ospedale', icon: '🏥', req: 'vaccination', cost: { metal: 100000, gold: 50000 }, use: { gold: 50 }, stab: 2, sprite: 'hospital' },
  park: { name: 'Parco', icon: '🌳', req: 'conservation', cost: { gold: 80000 }, pol: -0.004, stab: 1.5, sprite: 'park' },
  // --- Era 6
  apartment: { name: 'Condominio', icon: '🏬', req: 'mass_production', cost: { metal: 1e6, gold: 250000, stone: 2e5 }, housing: 400, energy: -5, sprite: 'tower' },
  logistics: { name: 'Centro logistico', icon: '📦', req: 'mass_production', cost: { metal: 1.5e6, gold: 5e5, wood: 2e5 }, mult: 1.2, caps: { food: 3e7, wood: 3e7, stone: 3e7, metal: 3e7, gold: 2e7 }, energy: -5, sprite: 'shed' },
  oil_plant: { name: 'Centrale petrolifera', icon: '🛢️', req: 'en_fossil', cost: { metal: 1e6 }, use: { gold: 150 }, energy: 150, pol: 0.004, sprite: 'plant' },
  nuclear_plant: { name: 'Centrale nucleare', icon: '☢️', req: 'en_nuclear', cost: { metal: 2.5e6, gold: 1e6, stone: 3e5 }, use: { metal: 3000 }, energy: 600, pol: 0.0002, sprite: 'nuke' },
  solar_farm: { name: 'Parco solare', icon: '🔆', req: 'en_renew', cost: { metal: 1.5e6, gold: 750000, stone: 2e5 }, energy: 200, sprite: 'solar' },
  lab: { name: 'Laboratorio', icon: '🧪', req: 'computers', cost: { metal: 1.5e6, gold: 750000, wood: 2e5 }, slots: { scientist: 80 }, mult: 1.1, energy: -30, sprite: 'lab' },
  airbase: { name: 'Base aerea', icon: '✈️', req: 'aviation', cost: { metal: 2e6, stone: 3e5 }, use: { gold: 1000 }, def: 2e5, energy: -20, sprite: 'airbase' },
  mall: { name: 'Centro commerciale', icon: '🛍️', req: 'consumerism', cost: { metal: 1.5e6, gold: 500000, stone: 2e5, wood: 2e5 }, use: { metal: 500 }, prod: { gold: 2000 }, stab: 1.5, energy: -25, pol: 0.001, sprite: 'mall' },
  filter: { name: 'Depuratore', icon: '💧', req: 'ecology', cost: { metal: 1e6, gold: 500000 }, pol: -0.02, energy: -20, sprite: 'tank' },
  // --- Era 7
  skyscraper: { name: 'Grattacielo', icon: '🏙️', req: 'era7', cost: { metal: 1.6e7, gold: 4e6, stone: 2e6, wood: 1e6 }, housing: 2000, energy: -50, sprite: 'skyscraper' },
  hub: { name: 'Hub automatizzato', icon: '🗄️', req: 'robotics', cost: { metal: 2e7, gold: 1e7, stone: 2e6 }, mult: 1.2, caps: { food: 3e9, wood: 3e9, stone: 3e9, metal: 3e9, gold: 2e9 }, energy: -50, sprite: 'shed' },
  datacenter: { name: 'Data center', icon: '🖥️', req: 'internet', cost: { metal: 1.2e7, gold: 6e6, stone: 1e6 }, use: { gold: 2000 }, slots: { technician: 100 }, mult: 1.1, energy: -200, ai: 0.004, sprite: 'datacenter' },
  fusion_plant: { name: 'Reattore a fusione', icon: '🌞', req: 'fusion', cost: { metal: 4e7, gold: 1e7, stone: 4e6 }, energy: 5000, sprite: 'fusion' },
  alignment_inst: { name: 'Istituto di allineamento', icon: '🧭', req: 'alignment', cost: { metal: 1e7, gold: 1e7, wood: 1e6 }, ai: -0.012, sprite: 'lab' },
  carbon_capture: { name: 'Cattura del carbonio', icon: '🌀', req: 'geoeng', cost: { metal: 2e7 }, pol: -0.15, energy: -300, sprite: 'tank' },
  spaceport: { name: 'Spazioporto', icon: '🚀', req: 'space_mining', cost: { metal: 6e7, gold: 2e7, stone: 6e6, wood: 2e6 }, use: { stone: 3000, wood: 1500 }, prod: { metal: 1.5e5, gold: 3e4 }, energy: -400, sprite: 'rocket' },
  // --- Era 8
  arcology: { name: 'Arcologia', icon: '🔺', req: 'nanotech', cost: { metal: 5e8, gold: 1e8, stone: 4e7, wood: 1e7 }, housing: 15000, stab: 2, energy: -500, sprite: 'arcology' },
  vault: { name: 'Deposito quantico', icon: '🧊', req: 'nanotech', cost: { metal: 2e8, gold: 1e8, stone: 2e7 }, mult: 1.2, caps: { food: 1e11, wood: 1e11, stone: 1e11, metal: 1e11, gold: 1e11 }, energy: -500, sprite: 'shed' },
  quantum_fab: { name: 'Fabbrica quantistica', icon: '⚛️', req: 'quantum', cost: { metal: 1.2e8, gold: 4e7, stone: 1e7 }, use: { metal: 100000 }, slots: { engineer: 100 }, mult: 1.1, energy: -2000, sprite: 'quantum' },
  planet_shield: { name: 'Scudo planetario', icon: '🛡️', req: 'planetary_defense', cost: { metal: 2e8, exotic: 150 }, max: 1, energy: -5000, sprite: 'shield' },
  // --- Megaprogetti (5 fasi, completarli vince la partita)
  dyson: { name: 'Sfera di Dyson', icon: '☀️', req: 'dest_dyson', cost: { metal: 1e8, exotic: 300, knowledge: 5e8 }, mult: 1.5, max: 5, mega: true, sprite: 'dyson',
    desc: 'Avvolgi il Sole in uno sciame di collettori: la civiltà diventa di Tipo II.' },
  ark: { name: 'Arca Stellare', icon: '🛸', req: 'dest_ark', cost: { metal: 8e7, food: 1e7, exotic: 400, gold: 4e7 }, mult: 1.5, max: 5, mega: true, sprite: 'ark',
    desc: 'Una nave-mondo che porterà la civiltà verso un nuovo sistema stellare.' },
  upload: { name: 'Ascensione Digitale', icon: '🌌', req: 'dest_upload', cost: { knowledge: 1e9, exotic: 500, gold: 5e7 }, mult: 1.5, max: 5, mega: true, sprite: 'upload',
    desc: 'Trasferisci le coscienze in un substrato computazionale eterno. Richiede Rischio IA sotto il 40%.' },
};

// Tecnologie. fx: jm (molt. lavoro), rm (molt. risorsa, "all"), stab, housing, cap, def, pol, ai, growth, click, clickPct, loot, foodCons, energy, shield[]
// group: scelta esclusiva. advance: avanza di era.
export const TECHS = {
  // ===== ERA 1
  fire: { era: 1, name: 'Fuoco', cost: { knowledge: 12, wood: 10 }, fx: { rm: { food: 1.1 }, stab: 3 }, desc: 'Cibo cotto e notti più sicure. Sblocca il Focolare.' },
  stone_tools: { era: 1, name: 'Utensili di pietra', cost: { knowledge: 20 }, fx: { jm: { woodcutter: 1.25 } }, desc: 'Sblocca i Cavatori e la raccolta di pietra.' },
  language: { era: 1, name: 'Linguaggio', cost: { knowledge: 40 }, fx: { jm: { sage: 1.5 }, clickPct: 0.02 }, desc: 'Le idee si tramandano.' },
  spears: { era: 1, name: 'Lance', cost: { knowledge: 50, stone: 20 }, req: ['stone_tools'], fx: { jm: { forager: 1.25 }, def: 1.5 }, desc: 'Sblocca i Soldati e la Palizzata.' },
  clothing: { era: 1, name: 'Vestiti di pelle', cost: { knowledge: 60 }, req: ['fire'], fx: { growth: 1.25, stab: 3 }, desc: 'Si sopravvive agli inverni.' },
  rituals: { era: 1, name: 'Rituali', cost: { knowledge: 80 }, req: ['language'], fx: { stab: 3 }, desc: 'Sblocca le Pitture rupestri.' },
  tracking: { era: 1, name: 'Tracciamento', cost: { knowledge: 100 }, req: ['spears'], fx: { jm: { forager: 1.3 }, click: 2 }, desc: 'Cacce più fruttuose; click più potenti.' },
  smoking: { era: 1, name: 'Affumicatura', cost: { knowledge: 90 }, req: ['fire'], fx: { rm: { food: 1.15 }, foodCons: 0.9 }, desc: 'Il cibo si conserva più a lungo.' },
  path_hunters: { era: 1, group: 'tribe', name: 'Via dei Cacciatori', cost: { knowledge: 150 }, req: ['rituals', 'tracking'], fx: { jm: { forager: 1.5 }, def: 2, loot: 2 }, desc: 'Una tribù di guerrieri: più cibo e difesa.' },
  path_shamans: { era: 1, group: 'tribe', name: 'Via degli Sciamani', cost: { knowledge: 150 }, req: ['rituals', 'tracking'], fx: { rm: { knowledge: 1.3 }, stab: 5 }, desc: 'Una tribù mistica: più conoscenza e stabilità.' },
  path_builders: { era: 1, group: 'tribe', name: 'Via dei Costruttori', cost: { knowledge: 150 }, req: ['rituals', 'tracking'], fx: { housing: 1.3, jm: { woodcutter: 1.4, quarrier: 1.4 } }, desc: 'Una tribù di artigiani: più alloggi e materiali.' },
  era2: { era: 1, advance: 2, name: "Verso l'Età Antica", cost: { knowledge: 450, wood: 200, stone: 150 }, req: ['group:tribe', 'clothing', 'smoking'], desc: 'Nascono i primi villaggi stabili.' },

  // ===== ERA 2
  agriculture: { era: 2, name: 'Agricoltura', cost: { knowledge: 250 }, fx: {}, desc: 'Sblocca Fattorie e Contadini.' },
  pottery: { era: 2, name: 'Ceramica', cost: { knowledge: 300 }, fx: { foodCons: 0.9 }, desc: 'Sblocca il Granaio.' },
  masonry: { era: 2, name: 'Lavorazione della pietra', cost: { knowledge: 350 }, fx: { jm: { quarrier: 1.5 } }, desc: 'Sblocca Case e Magazzini.' },
  bronze: { era: 2, name: 'Bronzo', cost: { knowledge: 500, stone: 200 }, req: ['masonry'], fx: {}, desc: 'Sblocca Miniere, Minatori e il Metallo.' },
  writing: { era: 2, name: 'Scrittura', cost: { knowledge: 600 }, req: ['pottery'], fx: { clickPct: 0.02 }, desc: 'Sblocca Biblioteche e Studiosi.' },
  wheel: { era: 2, name: 'Ruota', cost: { knowledge: 700 }, req: ['masonry'], fx: { jm: { woodcutter: 1.25, quarrier: 1.25, farmer: 1.25 } }, desc: 'Trasporti più rapidi.' },
  currency: { era: 2, name: 'Moneta', cost: { knowledge: 800, metal: 50 }, req: ['bronze', 'writing'], fx: {}, desc: "Sblocca Mercati, Mercanti e l'Oro." },
  bronze_weapons: { era: 2, name: 'Armi di bronzo', cost: { knowledge: 900, metal: 100 }, req: ['bronze'], fx: { def: 2 }, desc: 'Sblocca la Caserma.' },
  irrigation: { era: 2, name: 'Irrigazione', cost: { knowledge: 1000 }, req: ['agriculture', 'wheel'], fx: { jm: { farmer: 1.5 } }, desc: 'Campi più fertili.' },
  priesthood: { era: 2, name: 'Sacerdozio', cost: { knowledge: 1200 }, req: ['writing'], fx: {}, desc: 'Sblocca Templi e Sacerdoti.' },
  mathematics: { era: 2, name: 'Matematica', cost: { knowledge: 1500 }, req: ['writing'], fx: { rm: { knowledge: 1.25 } }, desc: 'Il pensiero astratto accelera la ricerca.' },
  fortification: { era: 2, name: 'Fortificazioni', cost: { knowledge: 1500, stone: 500 }, req: ['masonry'], fx: {}, desc: 'Sblocca le Mura.' },
  iron: { era: 2, name: 'Ferro', cost: { knowledge: 2000, metal: 300 }, req: ['bronze_weapons'], fx: { jm: { miner: 1.5 }, def: 2 }, desc: 'Sblocca la Fucina.' },
  gov_theocracy: { era: 2, group: 'gov', name: 'Teocrazia', cost: { knowledge: 2500, gold: 100 }, req: ['currency', 'priesthood'], fx: { stab: 12, jm: { priest: 2 }, rm: { knowledge: 0.9 } }, desc: 'Il potere agli dèi: grande stabilità.' },
  gov_republic: { era: 2, group: 'gov', name: 'Repubblica', cost: { knowledge: 2500, gold: 100 }, req: ['currency', 'priesthood'], fx: { rm: { knowledge: 1.3, gold: 1.3 }, stab: -3 }, desc: 'Il potere ai cittadini: più sapere e commercio.' },
  gov_empire: { era: 2, group: 'gov', name: 'Impero', cost: { knowledge: 2500, gold: 100 }, req: ['currency', 'priesthood'], fx: { def: 2, rm: { metal: 1.25 }, loot: 3, stab: -2 }, desc: 'Il potere alla spada: difesa e bottini.' },
  philosophy: { era: 2, name: 'Filosofia', cost: { knowledge: 3000 }, req: ['mathematics'], fx: { jm: { scholar: 1.5 }, stab: 2 }, desc: 'Gli studiosi diventano più produttivi.' },
  era3: { era: 2, advance: 3, name: 'Verso il Medioevo', cost: { knowledge: 5000, gold: 500, metal: 800 }, req: ['group:gov', 'iron', 'philosophy', 'irrigation'], desc: 'Regni e feudi sorgono sulle rovine degli imperi.' },

  // ===== ERA 3
  heavy_plough: { era: 3, name: 'Aratro pesante', cost: { knowledge: 6000 }, fx: { jm: { farmer: 1.5 } }, desc: 'Le terre del nord diventano coltivabili.' },
  engineering: { era: 3, name: 'Ingegneria', cost: { knowledge: 7000, stone: 2000 }, fx: { jm: { quarrier: 1.5 } }, desc: 'Sblocca Acquedotti e Grandi magazzini.' },
  theology: { era: 3, name: 'Teologia', cost: { knowledge: 8000 }, fx: {}, desc: 'Sblocca i Monasteri.' },
  mills: { era: 3, name: 'Mulini', cost: { knowledge: 9000 }, req: ['heavy_plough'], fx: {}, desc: 'Sblocca il Mulino a vento.' },
  metallurgy: { era: 3, name: 'Metallurgia', cost: { knowledge: 10000, metal: 1000 }, req: ['engineering'], fx: { jm: { miner: 1.5 }, rm: { metal: 1.2 } }, desc: 'Leghe migliori.' },
  chivalry: { era: 3, name: 'Cavalleria', cost: { knowledge: 12000, metal: 1500 }, req: ['metallurgy'], fx: { def: 2 }, desc: 'Sblocca il Castello.' },
  guilds: { era: 3, name: 'Corporazioni', cost: { knowledge: 14000, gold: 1000 }, fx: { jm: { merchant: 1.5, woodcutter: 1.3, quarrier: 1.3 } }, desc: 'Sblocca la Sede delle corporazioni.' },
  hygiene: { era: 3, name: 'Igiene', cost: { knowledge: 15000 }, req: ['engineering'], fx: { growth: 1.2, stab: 2, shield: ['plague'] }, desc: 'Protegge dalle epidemie medievali.' },
  astronomy: { era: 3, name: 'Astronomia', cost: { knowledge: 18000 }, req: ['theology'], fx: { rm: { knowledge: 1.3 }, clickPct: 0.02 }, desc: 'Lo sguardo verso il cielo.' },
  eco_feudal: { era: 3, group: 'eco', name: 'Feudalesimo', cost: { knowledge: 20000 }, req: ['guilds'], fx: { rm: { food: 1.5, gold: 0.9 }, def: 1.5, stab: 5 }, desc: 'Signori e vassalli: ordine e cibo.' },
  eco_merchant: { era: 3, group: 'eco', name: 'Mercantilismo', cost: { knowledge: 20000 }, req: ['guilds'], fx: { rm: { gold: 1.75 }, jm: { merchant: 1.3 } }, desc: 'Le rotte commerciali arricchiscono la nazione.' },
  era4: { era: 3, advance: 4, name: 'Verso il Rinascimento', cost: { knowledge: 35000, gold: 3000, metal: 3000, stone: 5000 }, req: ['group:eco', 'astronomy', 'hygiene', 'chivalry', 'mills'], desc: "L'uomo torna al centro dell'universo." },

  // ===== ERA 4
  printing: { era: 4, name: 'Stampa', cost: { knowledge: 120000 }, fx: { rm: { knowledge: 1.25 } }, desc: 'Sblocca la Tipografia.' },
  humanism: { era: 4, name: 'Umanesimo', cost: { knowledge: 135000 }, fx: { stab: 2 }, desc: "Sblocca l'Università." },
  banking: { era: 4, name: 'Banche', cost: { knowledge: 135000, gold: 5000 }, fx: { rm: { gold: 1.25 } }, desc: "Sblocca Banche ed Empori." },
  navigation: { era: 4, name: 'Navigazione', cost: { knowledge: 150000, wood: 12000 }, fx: { jm: { woodcutter: 1.5 } }, desc: 'Sblocca il Porto.' },
  architecture: { era: 4, name: 'Architettura', cost: { knowledge: 165000, stone: 12000 }, fx: { housing: 1.15 }, desc: 'Sblocca i Palazzi.' },
  gunpowder: { era: 4, name: 'Polvere da sparo', cost: { knowledge: 180000, metal: 8000 }, fx: { def: 3 }, desc: 'Sblocca la Fortezza a stella.' },
  arts: { era: 4, name: 'Arti e mecenatismo', cost: { knowledge: 180000, gold: 8000 }, req: ['humanism'], fx: { stab: 3 }, desc: 'Sblocca il Teatro.' },
  medicine: { era: 4, name: 'Medicina', cost: { knowledge: 210000 }, req: ['humanism'], fx: { growth: 1.3, stab: 2 }, desc: 'Vite più lunghe e sane.' },
  scientific_method: { era: 4, name: 'Metodo scientifico', cost: { knowledge: 240000 }, req: ['printing'], fx: { jm: { scholar: 2 }, clickPct: 0.02 }, desc: 'Ipotesi, esperimento, verifica.' },
  exploration: { era: 4, name: 'Esplorazione', cost: { knowledge: 270000 }, req: ['navigation'], fx: { rm: { gold: 1.5, food: 1.2, wood: 1.3 } }, desc: 'Nuove terre, nuove ricchezze.' },
  physics: { era: 4, name: 'Fisica classica', cost: { knowledge: 300000 }, req: ['scientific_method'], fx: { rm: { knowledge: 1.3 }, jm: { quarrier: 1.3, miner: 1.3 } }, desc: 'Le leggi del moto.' },
  era5: { era: 4, advance: 5, name: 'Verso la Rivoluzione industriale', cost: { knowledge: 600000, gold: 30000, metal: 30000, wood: 30000 }, req: ['physics', 'banking', 'gunpowder', 'architecture', 'exploration'], desc: 'Il vapore cambia ogni cosa.' },

  // ===== ERA 5
  steam: { era: 5, name: 'Macchina a vapore', cost: { knowledge: 1e6 }, fx: {}, desc: "Sblocca Fabbriche, Operai, Centrali a carbone e l'Energia." },
  urbanization: { era: 5, name: 'Urbanizzazione', cost: { knowledge: 1.2e6 }, fx: { housing: 1.25 }, desc: 'Sblocca il Casermone operaio.' },
  steel: { era: 5, name: 'Acciaio', cost: { knowledge: 1.2e6, metal: 50000 }, req: ['steam'], fx: { def: 1.5 }, desc: 'Sblocca Acciaierie e Depositi industriali.' },
  railways: { era: 5, name: 'Ferrovie', cost: { knowledge: 1.4e6 }, req: ['steel'], fx: { jm: { worker: 1.25 } }, desc: 'Sblocca la Ferrovia.' },
  vaccination: { era: 5, name: 'Vaccinazione', cost: { knowledge: 1.6e6 }, fx: { growth: 1.3, shield: ['epidemic'] }, desc: "Sblocca l'Ospedale. Protegge dalle epidemie." },
  rifles: { era: 5, name: 'Fucili', cost: { knowledge: 1.8e6, metal: 100000 }, req: ['steel'], fx: { def: 3 }, desc: 'Eserciti moderni.' },
  chemistry: { era: 5, name: 'Chimica', cost: { knowledge: 2e6 }, fx: { jm: { farmer: 2 }, pol: 1.1 }, desc: 'Fertilizzanti: raccolti doppi, un po\' più di inquinamento.' },
  conservation: { era: 5, name: 'Conservazionismo', cost: { knowledge: 2.4e6 }, fx: { pol: 0.85 }, desc: 'Sblocca i Parchi.' },
  electricity: { era: 5, name: 'Elettricità', cost: { knowledge: 2.8e6 }, req: ['steam'], fx: { energy: 1.5, jm: { worker: 1.5 } }, desc: "Sblocca l'Istituto di ricerca." },
  lab_unions: { era: 5, group: 'labor', name: 'Diritti dei lavoratori', cost: { knowledge: 3.2e6 }, req: ['urbanization'], fx: { stab: 10, jm: { worker: 0.9 }, shield: ['strike'] }, desc: 'Sindacati e tutele: stabilità.' },
  lab_laissez: { era: 5, group: 'labor', name: 'Laissez-faire', cost: { knowledge: 3.2e6 }, req: ['urbanization'], fx: { jm: { worker: 1.5 }, rm: { gold: 1.3 }, stab: -6 }, desc: 'Mercato senza freni: produzione e malcontento.' },
  era6: { era: 5, advance: 6, name: "Verso l'Era Atomica", cost: { knowledge: 8e6, metal: 2e5, gold: 2e5 }, req: ['group:labor', 'electricity', 'rifles', 'railways', 'chemistry'], desc: "Guerre mondiali, atomo e cieli solcati da aerei." },

  // ===== ERA 6
  en_fossil: { era: 6, group: 'energy', name: 'Petrolio', cost: { knowledge: 1.2e7 }, fx: { pol: 1.3 }, desc: 'Energia economica e sporca. Sblocca la Centrale petrolifera.' },
  en_nuclear: { era: 6, group: 'energy', name: 'Fissione nucleare', cost: { knowledge: 1.2e7 }, fx: {}, desc: 'Enorme energia pulita, ma con rischio di incidenti. Sblocca la Centrale nucleare.' },
  en_renew: { era: 6, group: 'energy', name: 'Rinnovabili', cost: { knowledge: 1.2e7 }, fx: { pol: 0.8 }, desc: 'Energia pulita ma costosa. Sblocca il Parco solare.' },
  mass_production: { era: 6, name: 'Produzione di massa', cost: { knowledge: 1.2e7 }, fx: { jm: { worker: 2 } }, desc: 'Sblocca Condomini e Centri logistici.' },
  antibiotics: { era: 6, name: 'Antibiotici', cost: { knowledge: 1.2e7 }, fx: { growth: 1.3, stab: 3 }, desc: 'Le infezioni non fanno più paura.' },
  aviation: { era: 6, name: 'Aviazione', cost: { knowledge: 1.4e7 }, fx: { def: 4 }, desc: 'Sblocca la Base aerea.' },
  computers: { era: 6, name: 'Calcolatori', cost: { knowledge: 1.6e7 }, fx: { rm: { knowledge: 1.25 } }, desc: 'Sblocca Laboratori e Scienziati.' },
  consumerism: { era: 6, name: 'Consumismo', cost: { knowledge: 1.6e7 }, req: ['mass_production'], fx: { rm: { gold: 1.3 }, pol: 1.1 }, desc: 'Sblocca il Centro commerciale.' },
  ecology: { era: 6, name: 'Ecologia', cost: { knowledge: 2e7 }, fx: { pol: 0.85 }, desc: 'Sblocca il Depuratore.' },
  diplomacy: { era: 6, name: 'Diplomazia internazionale', cost: { knowledge: 2.4e7 }, fx: { stab: 5, shield: ['nuclear'] }, desc: 'Le Nazioni Unite rendono le crisi nucleari meno costose.' },
  id_capital: { era: 6, group: 'ideology', name: 'Capitalismo', cost: { knowledge: 3.2e7 }, req: ['mass_production', 'computers'], fx: { rm: { gold: 1.5 }, jm: { worker: 1.3 }, pol: 1.15, stab: -3 }, desc: 'Crescita a ogni costo.' },
  id_social: { era: 6, group: 'ideology', name: 'Stato sociale', cost: { knowledge: 3.2e7 }, req: ['mass_production', 'computers'], fx: { stab: 12, housing: 1.2, rm: { gold: 0.85 } }, desc: 'Nessuno resta indietro.' },
  id_techno: { era: 6, group: 'ideology', name: 'Tecnocrazia', cost: { knowledge: 3.2e7 }, req: ['mass_production', 'computers'], fx: { rm: { knowledge: 1.5 }, jm: { scientist: 1.3 } }, desc: 'Governano gli esperti.' },
  space_age: { era: 6, name: 'Corsa allo spazio', cost: { knowledge: 4e7, metal: 5e6 }, req: ['aviation', 'computers'], fx: { rm: { knowledge: 1.2 }, clickPct: 0.02 }, desc: 'Un piccolo passo per un uomo…' },
  era7: { era: 6, advance: 7, name: "Verso l'Era dell'Informazione", cost: { knowledge: 8e7, metal: 4e6, gold: 1e6 }, req: ['group:energy', 'group:ideology', 'space_age', 'ecology', 'antibiotics'], desc: 'Il mondo si connette.' },

  // ===== ERA 7
  internet: { era: 7, name: 'Internet', cost: { knowledge: 9e7 }, fx: {}, desc: 'Sblocca Data center e Tecnici IA. Attenzione al Rischio IA!' },
  genetics: { era: 7, name: 'Genetica', cost: { knowledge: 1.05e8 }, fx: { rm: { food: 2 }, growth: 1.3 }, desc: 'Colture e corpi riprogettati.' },
  robotics: { era: 7, name: 'Robotica', cost: { knowledge: 1.2e8 }, fx: { jm: { worker: 3, miner: 3, farmer: 2 } }, desc: 'Sblocca gli Hub automatizzati.' },
  drones: { era: 7, name: 'Droni', cost: { knowledge: 1.35e8 }, req: ['robotics'], fx: { def: 5 }, desc: 'Guerra automatizzata.' },
  ml: { era: 7, name: 'Apprendimento automatico', cost: { knowledge: 1.5e8 }, req: ['internet'], fx: { jm: { technician: 2 }, ai: 1.5 }, desc: 'Le macchine imparano. Il Rischio IA cresce più in fretta.' },
  alignment: { era: 7, name: "Allineamento dell'IA", cost: { knowledge: 1.65e8 }, req: ['ml'], fx: { ai: 0.7 }, desc: "Sblocca l'Istituto di allineamento." },
  fusion: { era: 7, name: 'Fusione nucleare', cost: { knowledge: 1.8e8 }, req: ['internet'], fx: {}, desc: 'Sblocca il Reattore a fusione.' },
  geoeng: { era: 7, name: 'Geoingegneria', cost: { knowledge: 1.8e8 }, fx: { pol: 0.8 }, desc: 'Sblocca la Cattura del carbonio.' },
  space_mining: { era: 7, name: 'Estrazione spaziale', cost: { knowledge: 2.4e8 }, req: ['fusion'], fx: {}, desc: 'Sblocca lo Spazioporto.' },
  ai_accel: { era: 7, group: 'ai', name: 'Accelerazionismo', cost: { knowledge: 3e8 }, req: ['ml'], fx: { rm: { knowledge: 2 }, ai: 2 }, desc: 'Massima velocità, massimo rischio.' },
  ai_safe: { era: 7, group: 'ai', name: 'Governance prudente', cost: { knowledge: 3e8 }, req: ['ml'], fx: { ai: 0.4, rm: { knowledge: 1.2 }, stab: 5 }, desc: 'Regole e controlli sulle IA.' },
  ai_trans: { era: 7, group: 'ai', name: 'Transumanesimo', cost: { knowledge: 3e8 }, req: ['ml'], fx: { rm: { all: 1.3 }, stab: -5, growth: 0.8 }, desc: "Fondere uomo e macchina." },
  era8: { era: 7, advance: 8, name: "Verso l'Era Iper-tecnologica", cost: { knowledge: 9e8, metal: 1e8, gold: 5e7 }, req: ['group:ai', 'space_mining', 'alignment', 'genetics', 'drones', 'geoeng'], desc: 'Oltre i limiti del pianeta.' },

  // ===== ERA 8
  nanotech: { era: 8, name: 'Nanotecnologia', cost: { knowledge: 1.2e9 }, fx: { def: 5 }, desc: 'Sblocca Arcologie e Depositi quantici.' },
  quantum: { era: 8, name: 'Calcolo quantistico', cost: { knowledge: 1.5e9 }, fx: { rm: { knowledge: 1.5 } }, desc: 'Sblocca Fabbriche quantistiche e Materia esotica.' },
  planetary_defense: { era: 8, name: 'Difesa planetaria', cost: { knowledge: 1.8e9 }, req: ['quantum'], fx: { shield: ['asteroid'] }, desc: 'Sblocca lo Scudo planetario.' },
  exotic_physics: { era: 8, name: 'Fisica esotica', cost: { knowledge: 2.4e9 }, req: ['quantum'], fx: { jm: { engineer: 2 } }, desc: 'Raddoppia la materia esotica.' },
  post_scarcity: { era: 8, name: 'Post-scarsità', cost: { knowledge: 3e9 }, req: ['nanotech'], fx: { rm: { all: 1.5 }, stab: 10 }, desc: 'Il lavoro diventa una scelta.' },
  dest_dyson: { era: 8, group: 'destiny', name: 'Destino: Tipo II', cost: { knowledge: 4.5e9 }, req: ['nanotech', 'quantum'], fx: { energy: 2, rm: { metal: 1.5 } }, desc: 'Sblocca il megaprogetto Sfera di Dyson.' },
  dest_ark: { era: 8, group: 'destiny', name: 'Destino: le Stelle', cost: { knowledge: 4.5e9 }, req: ['nanotech', 'quantum'], fx: { rm: { metal: 1.5, food: 1.5 } }, desc: "Sblocca il megaprogetto Arca Stellare." },
  dest_upload: { era: 8, group: 'destiny', name: 'Destino: Singolarità', cost: { knowledge: 4.5e9 }, req: ['nanotech', 'quantum'], fx: { rm: { knowledge: 1.5 }, ai: 1.2 }, desc: "Sblocca il megaprogetto Ascensione Digitale." },
};

export const GROUPS = {
  tribe: 'Lo spirito della tribù', gov: 'Forma di governo', eco: 'Modello economico',
  labor: 'Questione sociale', energy: 'Fonte energetica', ideology: 'Ideologia',
  ai: "Rapporto con l'IA", destiny: 'Destino della civiltà',
};

export const DIFFICULTY = {
  easy: { name: 'Facile', events: 0.6, severity: 0.6, raid: 0.6, prod: 1.25 },
  normal: { name: 'Normale', events: 1, severity: 1, raid: 1, prod: 1 },
  hard: { name: 'Difficile', events: 1.4, severity: 1.4, raid: 1.5, prod: 0.8 },
};

export const VICTORIES = {
  dyson: { icon: '☀️', title: 'Civiltà di Tipo II', text: "Uno sciame di miliardi di collettori avvolge il Sole. La tua civiltà controlla l'energia di un'intera stella: nulla, nel sistema solare, è più fuori dalla sua portata." },
  ark: { icon: '🛸', title: 'Verso le stelle', text: "L'Arca Stellare lascia l'orbita con a bordo milioni di persone. Tra qualche secolo, un nuovo mondo porterà il nome della tua civiltà." },
  upload: { icon: '🌌', title: 'La Singolarità', text: 'Le coscienze lasciano i corpi e si fondono in un substrato computazionale eterno. La storia, come la conoscevamo, è finita.' },
};

// Traguardi: ognuno dà +2% a tutta la produzione
const r10 = n => (s) => s.stats.maxPop >= n;
export const ACHIEVEMENTS = {
  hut: { name: 'Un tetto sopra la testa', desc: 'Costruisci una Capanna.', cond: s => s.buildings.hut > 0 },
  pop25: { name: 'Villaggio', desc: 'Raggiungi 25 abitanti.', cond: r10(25) },
  pop100: { name: 'Città', desc: 'Raggiungi 100 abitanti.', cond: r10(100) },
  pop1k: { name: 'Metropoli', desc: 'Raggiungi 1.000 abitanti.', cond: r10(1000) },
  pop10k: { name: 'Nazione', desc: 'Raggiungi 10.000 abitanti.', cond: r10(1e4) },
  pop100k: { name: 'Superpotenza', desc: 'Raggiungi 100.000 abitanti.', cond: r10(1e5) },
  pop1m: { name: 'Ecumenopoli', desc: 'Raggiungi 1 milione di abitanti.', cond: r10(1e6) },
  ...Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map(e => ['era' + e, { name: t`Era ${e}`, desc: t`Raggiungi l'era ${e}.`, cond: s => s.era >= e }])),
  click100: { name: 'Mani operose', desc: 'Clicca 100 volte.', cond: s => s.stats.clicks >= 100 },
  click1k: { name: 'Instancabile', desc: 'Clicca 1.000 volte.', cond: s => s.stats.clicks >= 1000 },
  click10k: { name: 'Il dito di Dio', desc: 'Clicca 10.000 volte.', cond: s => s.stats.clicks >= 1e4 },
  raid1: { name: 'Prima vittoria', desc: 'Respingi una razzia.', cond: s => s.stats.raidsWon >= 1 },
  raid10: { name: 'Fortezza', desc: 'Respingi 10 razzie.', cond: s => s.stats.raidsWon >= 10 },
  raid30: { name: 'Inespugnabile', desc: 'Respingi 30 razzie.', cond: s => s.stats.raidsWon >= 30 },
  crisis1: { name: 'Sopravvissuti', desc: 'Supera una crisi.', cond: s => s.stats.crisesWon >= 1 },
  crisis4: { name: 'Resilienza', desc: 'Supera 4 crisi.', cond: s => s.stats.crisesWon >= 4 },
  tech25: { name: 'Curiosità', desc: 'Scopri 25 tecnologie.', cond: s => Object.keys(s.techs).length >= 25 },
  tech60: { name: 'Erudizione', desc: 'Scopri 60 tecnologie.', cond: s => Object.keys(s.techs).length >= 60 },
  stab95: { name: 'Utopia', desc: 'Porta la stabilità al 95%.', cond: s => s.stability >= 95 },
  green: { name: 'Pianeta verde', desc: "Raggiungi l'era 7 con meno del 10% di inquinamento.", cond: s => s.era >= 7 && s.pollution < 10 },
  energy: { name: 'Fame di energia', desc: 'Produci 10.000 di energia.', cond: (s, r) => r.energyProd >= 1e4 },
  exotic: { name: 'Alchimia', desc: 'Accumula 100 di materia esotica.', cond: s => s.res.exotic >= 100 },
  survivor: { name: 'Sull\'orlo del baratro', desc: 'Sopravvivi a una rivolta con la stabilità a zero.', cond: s => s.stats.revoltSurvived >= 1 },
};

[ERAS, RES, JOBS, BUILDINGS, TECHS, DIFFICULTY, VICTORIES].forEach(localize);
for (const k in ACHIEVEMENTS) if (!/^era\d$/.test(k)) localize(ACHIEVEMENTS[k]); // quelli d'era sono già tradotti
for (const k in GROUPS) GROUPS[k] = t(GROUPS[k]);
if (lang === 'en') for (const [k, c] of Object.entries({ food: 'F', wood: 'W', stone: 'S', gold: 'G' })) RES[k].key = c; // tasti per risorsa
