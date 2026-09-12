/* ============================================================
   BATTLE.JS — Geração de estágios ("Caminho da Luz") e motor de
   combate por turnos (automático, com uma Bênção manual por combate).
   ============================================================ */

const Battle = {
  atual: null, // combate em curso

  gerarEstagio(n) {
    const chakraIdx = (n - 1) % CHAKRAS.length;
    const tier = Math.floor((n - 1) / CHAKRAS.length);
    const chakra = CHAKRAS[chakraIdx];
    const ondas = [];
    for (let w = 0; w < 3; w++) {
      const ehChefe = w === 2;
      const tema = ehChefe ? SOMBRA_CHEFE : SOMBRAS_TEMA[(n + w) % SOMBRAS_TEMA.length];
      const escala = 1 + tier * 0.55 + n * 0.06;
      const chefeMult = ehChefe ? 1.45 : 1;
      ondas.push({
        nome: tema.nome,
        emoji: tema.emoji,
        chakraIdx,
        chefe: ehChefe,
        hp: Math.round((22 + n * 5) * escala * chefeMult),
        atk: Math.round((5 + n * 1.4) * escala * (ehChefe ? 1.15 : 1)),
        def: Math.round((3 + n * 0.9) * escala),
        spd: Math.round(6 + n * 0.4),
      });
    }
    return {
      n, chakra, tier,
      ondas,
      recompensa: {
        essencia: 10 + n * 3,
        luz: 6 + Math.round(n * 1.5),
        karma: 1,
      },
    };
  },

  // Cria combatentes do jogador a partir da party atual
  montarPartyBatalha() {
    return State.data.party.map(instId => {
      const inst = State.data.espiritos.find(e => e.instId === instId);
      if (!inst) return null;
      const linha = linhaPorId(inst.linhaId);
      const stats = State.espiritoStats(inst);
      return {
        instId: inst.instId,
        nome: linha.nomes[stats.estagio],
        emoji: linha.emojis[stats.estagio],
        chakraIdx: chakraIndex(linha.chakraId),
        hpMax: stats.hp,
        hp: stats.hp,
        atk: stats.atk,
        def: stats.def,
        spd: stats.spd,
      };
    }).filter(Boolean);
  },

  iniciar(n) {
    const estagio = this.gerarEstagio(n);
    this.atual = {
      estagio,
      ondaIdx: 0,
      jogador: this.montarPartyBatalha(),
      inimigos: this.instanciarOnda(estagio.ondas[0]),
      log: [],
      terminado: false,
      vitoria: null,
      bencaoUsada: false,
    };
    this.registrar(`A jornada no reino de ${estagio.chakra.nome} começa…`);
    this.registrar(`Surge: ${this.atual.inimigos.map(i => i.nome).join(', ')}`);
    return this.atual;
  },

  instanciarOnda(onda) {
    return [{
      nome: onda.nome, emoji: onda.emoji, chakraIdx: onda.chakraIdx, chefe: onda.chefe,
      hpMax: onda.hp, hp: onda.hp, atk: onda.atk, def: onda.def, spd: onda.spd,
    }];
  },

  registrar(msg) {
    this.atual.log.push(msg);
    if (this.atual.log.length > 40) this.atual.log.shift();
  },

  vivo(c) { return c.hp > 0; },

  // Avança um round completo (todos os combatentes vivos agem, ordenados por velocidade)
  avancarRound() {
    const b = this.atual;
    if (!b || b.terminado) return b;

    const combatentes = [
      ...b.jogador.map(c => ({ c, lado: 'jogador' })),
      ...b.inimigos.map(c => ({ c, lado: 'inimigo' })),
    ].filter(x => this.vivo(x.c));
    combatentes.sort((a, z) => z.c.spd - a.c.spd);

    for (const { c, lado } of combatentes) {
      if (!this.vivo(c)) continue;
      if (b.terminado) break;
      const alvos = lado === 'jogador' ? b.inimigos : b.jogador;
      const vivos = alvos.filter(a => this.vivo(a));
      if (vivos.length === 0) continue;
      const alvo = lado === 'jogador' ? vivos[0] : vivos[Math.floor(Math.random() * vivos.length)];
      const vantagem = vantagemElemental(c.chakraIdx, alvo.chakraIdx);
      const variação = 0.9 + Math.random() * 0.2;
      const dano = Math.max(1, Math.round((c.atk - alvo.def * 0.5) * vantagem * variação));
      alvo.hp = Math.max(0, alvo.hp - dano);
      const tagVantagem = vantagem > 1 ? ' (vantagem!)' : vantagem < 1 ? ' (resistido)' : '';
      this.registrar(`${c.emoji} ${c.nome} atinge ${alvo.emoji} ${alvo.nome} em ${dano}${tagVantagem}`);
      if (alvo.hp <= 0) this.registrar(`${alvo.emoji} ${alvo.nome} foi dissolvido em luz.`);
      this.checarFimOnda();
      if (b.terminado) break;
    }
    return b;
  },

  checarFimOnda() {
    const b = this.atual;
    const jogadorVivo = b.jogador.some(c => this.vivo(c));
    const inimigoVivo = b.inimigos.some(c => this.vivo(c));
    if (!jogadorVivo) {
      b.terminado = true;
      b.vitoria = false;
      this.registrar('A sua party precisa de descanso e reflexão…');
      return;
    }
    if (!inimigoVivo) {
      const proximaOnda = b.estagio.ondas[b.ondaIdx + 1];
      if (proximaOnda) {
        b.ondaIdx += 1;
        b.inimigos = this.instanciarOnda(proximaOnda);
        b.bencaoUsada = false;
        this.registrar(`Onda superada! Surge: ${b.inimigos.map(i => i.nome).join(', ')}`);
      } else {
        b.terminado = true;
        b.vitoria = true;
        this.registrar('Estágio concluído! A luz se expande.');
      }
    }
  },

  custoBencao: 20,

  usarBencao() {
    const b = this.atual;
    if (!b || b.terminado || b.bencaoUsada) return false;
    if (State.data.luz < this.custoBencao) return false;
    State.data.luz -= this.custoBencao;
    b.bencaoUsada = true;
    b.jogador.forEach(c => {
      if (this.vivo(c)) c.hp = Math.min(c.hpMax, c.hp + Math.round(c.hpMax * 0.25));
    });
    this.registrar('✨ Uma bênção cura a sua party.');
    return true;
  },

  aplicarRecompensas() {
    const b = this.atual;
    if (!b || !b.vitoria) return null;
    const r = b.estagio.recompensa;
    State.data.essencia += r.essencia;
    State.data.luz += r.luz;
    let karmaGanho = 0;
    if (b.estagio.n > State.data.progresso.maiorEstagio) {
      State.data.progresso.maiorEstagio = b.estagio.n;
      State.data.progresso.estagioAtual = b.estagio.n + 1;
      karmaGanho = r.karma;
      State.data.karma += karmaGanho;
    }
    return { ...r, karma: karmaGanho };
  },
};
