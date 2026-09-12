/* ============================================================
   DATA.JS — Definições estáticas do jogo (chakras, espíritos,
   raridades e sombras). Nenhum estado de jogador vive aqui.
   ============================================================ */

const CHAKRAS = [
  { id: 'raiz',         nome: 'Raiz',          elemento: 'Terra',    cor: '#e74c3c' },
  { id: 'sacral',       nome: 'Sacral',        elemento: 'Água',     cor: '#e67e22' },
  { id: 'plexo',        nome: 'Plexo Solar',   elemento: 'Fogo',     cor: '#f1c40f' },
  { id: 'coracao',      nome: 'Coração',       elemento: 'Ar',       cor: '#2ecc71' },
  { id: 'garganta',     nome: 'Garganta',      elemento: 'Som',      cor: '#3498db' },
  { id: 'terceiroOlho', nome: 'Terceiro Olho', elemento: 'Intuição', cor: '#6c5ce7' },
  { id: 'coroa',        nome: 'Coroa',         elemento: 'Luz',      cor: '#c9a4ff' },
];

// Ciclo elemental: cada chakra é forte contra o seguinte e fraco contra o anterior.
function vantagemElemental(idxAtacante, idxDefensor) {
  const seguinte = (idxAtacante + 1) % CHAKRAS.length;
  const anterior = (idxAtacante + CHAKRAS.length - 1) % CHAKRAS.length;
  if (idxDefensor === seguinte) return 1.25;
  if (idxDefensor === anterior) return 0.8;
  return 1.0;
}

const RARIDADES = [
  { id: 'comum',    nome: 'Comum',    mult: 1.0, peso: 60, cor: '#b2bec3' },
  { id: 'raro',     nome: 'Raro',     mult: 1.3, peso: 30, cor: '#74b9ff' },
  { id: 'epico',    nome: 'Épico',    mult: 1.7, peso: 8,  cor: '#a29bfe' },
  { id: 'lendario', nome: 'Lendário', mult: 2.3, peso: 2,  cor: '#ffd54f' },
];

// Cada linha tem 3 estágios de evolução (nome + emoji), como uma jornada de crescimento.
const LINHAS_ESPIRITO = [
  {
    id: 'raiz', chakraId: 'raiz',
    nomes: ['Semente da Raiz', 'Guardião da Raiz', 'Ancião da Terra'],
    emojis: ['🌰', '🦡', '🐻'],
    base: { hp: 32, atk: 9, def: 9, spd: 6 },
  },
  {
    id: 'sacral', chakraId: 'sacral',
    nomes: ['Girino Lunar', 'Nadador das Marés', 'Leviatã Sereno'],
    emojis: ['🐟', '🐢', '🐋'],
    base: { hp: 28, atk: 10, def: 7, spd: 8 },
  },
  {
    id: 'plexo', chakraId: 'plexo',
    nomes: ['Chama Nascente', 'Leão Solar', 'Fênix Radiante'],
    emojis: ['🕯️', '🦁', '🔥'],
    base: { hp: 26, atk: 13, def: 6, spd: 9 },
  },
  {
    id: 'coracao', chakraId: 'coracao',
    nomes: ['Broto do Afeto', 'Borboleta do Coração', 'Pomba da Paz'],
    emojis: ['🌱', '🦋', '🕊️'],
    base: { hp: 30, atk: 8, def: 10, spd: 9 },
  },
  {
    id: 'garganta', chakraId: 'garganta',
    nomes: ['Pintainho da Voz', 'Papagaio Ressonante', 'Cisne da Verdade'],
    emojis: ['🐣', '🦜', '🦢'],
    base: { hp: 27, atk: 10, def: 8, spd: 10 },
  },
  {
    id: 'terceiroOlho', chakraId: 'terceiroOlho',
    nomes: ['Lagarta Onírica', 'Coruja Vidente', 'Unicórnio da Intuição'],
    emojis: ['🐛', '🦉', '🦄'],
    base: { hp: 25, atk: 11, def: 7, spd: 11 },
  },
  {
    id: 'coroa', chakraId: 'coroa',
    nomes: ['Faísca Celeste', 'Fada da Luz', 'Serafim Dourado'],
    emojis: ['✨', '🧚', '😇'],
    base: { hp: 24, atk: 12, def: 7, spd: 12 },
  },
];

// Sombras: personificações de emoções/obstáculos internos — antagonistas não-violentos,
// representando aquilo que o jogador "transmuta" em vez de "destrói".
const SOMBRAS_TEMA = [
  { nome: 'Sombra da Insegurança', emoji: '🌫️' },
  { nome: 'Sombra do Apego',       emoji: '🕸️' },
  { nome: 'Sombra da Raiva',       emoji: '🥀' },
  { nome: 'Sombra da Ilusão',      emoji: '👥' },
  { nome: 'Sombra do Silêncio',    emoji: '🌒' },
  { nome: 'Sombra da Dúvida',      emoji: '🕳️' },
  { nome: 'Sombra do Ego',         emoji: '🖤' },
];
const SOMBRA_CHEFE = { nome: 'Grande Sombra', emoji: '🌑' };

function linhaPorId(id) {
  return LINHAS_ESPIRITO.find(l => l.id === id);
}
function chakraPorId(id) {
  return CHAKRAS.find(c => c.id === id);
}
function chakraIndex(id) {
  return CHAKRAS.findIndex(c => c.id === id);
}
function raridadePorId(id) {
  return RARIDADES.find(r => r.id === id);
}

function sortearRaridade() {
  const total = RARIDADES.reduce((s, r) => s + r.peso, 0);
  let roll = Math.random() * total;
  for (const r of RARIDADES) {
    if (roll < r.peso) return r.id;
    roll -= r.peso;
  }
  return RARIDADES[0].id;
}
