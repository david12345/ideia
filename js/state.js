/* ============================================================
   STATE.JS — Estado do jogador, persistência (localStorage),
   economia (luz/essência/karma), meditação e invocação.
   ============================================================ */

const SAVE_KEY = 'caminhoDaLuz_save_v1';
const OFFLINE_CAP_SEGUNDOS = 8 * 60 * 60; // ganhos offline limitados a 8h
const MEDITAR_COOLDOWN_MS = 20 * 1000;

const State = {
  data: null,

  novoJogo() {
    return {
      versao: 1,
      criadoEm: Date.now(),
      ultimoTick: Date.now(),
      luz: 60,
      essencia: 20,
      karma: 0,
      streak: { contagem: 0, ultimoDia: null },
      ultimaMeditacao: 0,
      progresso: { estagioAtual: 1, maiorEstagio: 0 },
      party: [],
      proximoIdEspirito: 1,
      espiritos: [],
      settings: { som: true },
    };
  },

  carregar() {
    let bruto = null;
    try { bruto = localStorage.getItem(SAVE_KEY); } catch (e) { /* localStorage indisponível */ }
    if (bruto) {
      try {
        this.data = JSON.parse(bruto);
      } catch (e) {
        this.data = this.novoJogo();
      }
    } else {
      this.data = this.novoJogo();
      this.darEspiritoInicial();
    }
    this.migrar();
    this.aplicarGanhosOffline();
    this.guardar();
  },

  migrar() {
    const d = this.data;
    if (!d.settings) d.settings = { som: true };
    if (!d.progresso) d.progresso = { estagioAtual: 1, maiorEstagio: 0 };
    if (!Array.isArray(d.party)) d.party = [];
    if (!Array.isArray(d.espiritos)) d.espiritos = [];
    if (typeof d.proximoIdEspirito !== 'number') d.proximoIdEspirito = d.espiritos.length + 1;
    if (!d.streak) d.streak = { contagem: 0, ultimoDia: null };
    if (typeof d.ultimaMeditacao !== 'number') d.ultimaMeditacao = 0;
  },

  guardar() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* ignora */ }
  },

  darEspiritoInicial() {
    const linha = LINHAS_ESPIRITO[Math.floor(Math.random() * LINHAS_ESPIRITO.length)];
    const esp = this.criarEspirito(linha.id, 'raro');
    this.data.espiritos.push(esp);
    this.data.party.push(esp.instId);
  },

  criarEspirito(linhaId, raridadeId) {
    const inst = {
      instId: this.data.proximoIdEspirito++,
      linhaId,
      raridadeId,
      nivel: 1,
      exp: 0,
    };
    return inst;
  },

  // --- Economia / tempo -------------------------------------------------

  taxaLuzPorSegundo() {
    const n = this.data.espiritos.length;
    return 0.4 + n * 0.12;
  },

  aplicarGanhosOffline() {
    const agora = Date.now();
    let delta = (agora - this.data.ultimoTick) / 1000;
    if (!isFinite(delta) || delta < 0) delta = 0;
    delta = Math.min(delta, OFFLINE_CAP_SEGUNDOS);
    const ganho = delta * this.taxaLuzPorSegundo();
    this.data.luz += ganho;
    this.data.ultimoTick = agora;
    this.ultimoGanhoOffline = ganho;
    this.atualizarStreak();
  },

  tick(segundos) {
    this.data.luz += segundos * this.taxaLuzPorSegundo();
    this.data.ultimoTick = Date.now();
  },

  atualizarStreak() {
    const hoje = new Date().toISOString().slice(0, 10);
    const s = this.data.streak;
    if (s.ultimoDia === hoje) return;
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.contagem = (s.ultimoDia === ontem) ? s.contagem + 1 : 1;
    s.ultimoDia = hoje;
    const bonusKarma = Math.min(5, s.contagem);
    this.data.karma += bonusKarma;
    this.ultimoBonusStreak = bonusKarma;
  },

  podeMeditar() {
    return Date.now() - this.data.ultimaMeditacao >= MEDITAR_COOLDOWN_MS;
  },

  meditarCooldownRestante() {
    return Math.max(0, MEDITAR_COOLDOWN_MS - (Date.now() - this.data.ultimaMeditacao));
  },

  meditar() {
    if (!this.podeMeditar()) return null;
    this.data.ultimaMeditacao = Date.now();
    const base = 25 + this.data.streak.contagem * 2;
    const variação = base * (0.85 + Math.random() * 0.3);
    const ganho = Math.round(variação);
    this.data.luz += ganho;
    return ganho;
  },

  // --- Espíritos ----------------------------------------------------------

  espiritoStats(inst) {
    const linha = linhaPorId(inst.linhaId);
    const raridade = raridadePorId(inst.raridadeId);
    const estagio = this.estagioEvolucao(inst.nivel);
    const bonusEstagio = 1 + estagio * 0.22;
    const escalaNivel = 1 + (inst.nivel - 1) * 0.12;
    const fator = raridade.mult * bonusEstagio * escalaNivel;
    return {
      hp: Math.round(linha.base.hp * fator),
      atk: Math.round(linha.base.atk * fator),
      def: Math.round(linha.base.def * fator),
      spd: Math.round(linha.base.spd * fator),
      estagio,
    };
  },

  estagioEvolucao(nivel) {
    if (nivel >= 25) return 2;
    if (nivel >= 10) return 1;
    return 0;
  },

  custoEvoluir(nivel) {
    return Math.round(18 * Math.pow(1.16, nivel - 1));
  },

  subirNivel(instId) {
    const inst = this.data.espiritos.find(e => e.instId === instId);
    if (!inst) return { ok: false };
    const custo = this.custoEvoluir(inst.nivel);
    if (this.data.essencia < custo) return { ok: false, faltaEssencia: custo };
    this.data.essencia -= custo;
    inst.nivel += 1;
    return { ok: true, novoNivel: inst.nivel };
  },

  emParty(instId) {
    return this.data.party.includes(instId);
  },

  alternarParty(instId) {
    const idx = this.data.party.indexOf(instId);
    if (idx >= 0) {
      this.data.party.splice(idx, 1);
      return false;
    }
    if (this.data.party.length >= 3) return null; // cheio
    this.data.party.push(instId);
    return true;
  },

  // --- Invocação (gacha) ---------------------------------------------------

  custoInvocacao: 80,

  invocar() {
    if (this.data.luz < this.custoInvocacao) return null;
    this.data.luz -= this.custoInvocacao;
    const linha = LINHAS_ESPIRITO[Math.floor(Math.random() * LINHAS_ESPIRITO.length)];
    const raridadeId = sortearRaridade();
    const inst = this.criarEspirito(linha.id, raridadeId);
    this.data.espiritos.push(inst);
    return inst;
  },
};
