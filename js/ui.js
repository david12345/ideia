/* ============================================================
   UI.JS — Renderização do DOM para todas as views.
   Não contém regras de jogo, apenas leitura de State/Battle.
   ============================================================ */

const UI = {
  els: {},
  instSelecionada: null,

  init() {
    this.els = {
      hudLuz: document.getElementById('hud-luz'),
      hudEssencia: document.getElementById('hud-essencia'),
      hudKarma: document.getElementById('hud-karma'),
      btnMeditar: document.getElementById('btn-meditar'),
      meditarStatus: document.getElementById('meditar-status'),
      streakDias: document.getElementById('streak-dias'),
      resumoProgresso: document.getElementById('resumo-progresso'),
      barraProgresso: document.getElementById('barra-progresso'),
      grelhaEspiritos: document.getElementById('grelha-espiritos'),
      partyResumo: document.getElementById('party-resumo'),
      mapaLista: document.getElementById('mapa-lista'),
      cardMapa: document.getElementById('card-mapa'),
      cardBatalha: document.getElementById('card-batalha'),
      batalhaTitulo: document.getElementById('batalha-titulo'),
      colJogador: document.getElementById('col-jogador'),
      colInimigo: document.getElementById('col-inimigo'),
      logBatalha: document.getElementById('log-batalha'),
      btnRound: document.getElementById('btn-round'),
      btnBencao: document.getElementById('btn-bencao'),
      orbeInvocar: document.getElementById('orbe-invocar'),
      resultadoInvocacao: document.getElementById('resultado-invocacao'),
      custoInvocar: document.getElementById('custo-invocar'),
      overlayEspirito: document.getElementById('overlay-espirito'),
      modalEspirito: document.getElementById('modal-espirito'),
      toastWrap: document.getElementById('toast-wrap'),
    };
  },

  fmt(n) {
    n = Math.floor(n);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  },

  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    this.els.toastWrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },

  renderHud() {
    this.els.hudLuz.textContent = this.fmt(State.data.luz);
    this.els.hudEssencia.textContent = this.fmt(State.data.essencia);
    this.els.hudKarma.textContent = this.fmt(State.data.karma);
    this.els.custoInvocar.textContent = State.custoInvocacao;
  },

  renderInicio() {
    const s = State.data.streak;
    this.els.streakDias.textContent = `${s.contagem} dia${s.contagem === 1 ? '' : 's'}`;
    const n = State.data.progresso.estagioAtual;
    const chakra = CHAKRAS[(n - 1) % CHAKRAS.length];
    this.els.resumoProgresso.textContent = `Estágio ${n} · ${chakra.nome}`;
    const pct = Math.min(100, (State.data.progresso.maiorEstagio % 7) / 7 * 100);
    this.els.barraProgresso.style.width = pct + '%';
    this.atualizarBotaoMeditar();
  },

  atualizarBotaoMeditar() {
    const pode = State.podeMeditar();
    this.els.btnMeditar.disabled = !pode;
    if (pode) {
      this.els.meditarStatus.textContent = '';
      this.els.btnMeditar.textContent = 'Meditar (+Luz)';
    } else {
      const seg = Math.ceil(State.meditarCooldownRestante() / 1000);
      this.els.btnMeditar.textContent = `Aguarde ${seg}s…`;
    }
  },

  espiritoLabel(inst) {
    const linha = linhaPorId(inst.linhaId);
    const stats = State.espiritoStats(inst);
    return { linha, stats, nome: linha.nomes[stats.estagio], emoji: linha.emojis[stats.estagio] };
  },

  renderEspiritos() {
    const grelha = this.els.grelhaEspiritos;
    grelha.innerHTML = '';
    if (State.data.espiritos.length === 0) {
      grelha.innerHTML = '<p class="vazio">Ainda não tem espíritos. Vá a "Invocar" para conhecer o primeiro.</p>';
    }
    State.data.espiritos.forEach(inst => {
      const { stats, nome, emoji } = this.espiritoLabel(inst);
      const raridade = raridadePorId(inst.raridadeId);
      const tile = document.createElement('div');
      tile.className = 'espirito-tile' + (State.emParty(inst.instId) ? ' na-party' : '');
      tile.innerHTML = `
        <span class="raridade-tag" style="background:${raridade.cor}">${raridade.nome[0]}</span>
        <span class="emoji">${emoji}</span>
        <span class="nome">${nome}</span>
        <span class="nivel-tag">Nv. ${inst.nivel}</span>
      `;
      tile.addEventListener('click', () => this.abrirModalEspirito(inst.instId));
      grelha.appendChild(tile);
    });

    const partyNomes = State.data.party.map(id => {
      const inst = State.data.espiritos.find(e => e.instId === id);
      return inst ? this.espiritoLabel(inst).emoji : '?';
    });
    this.els.partyResumo.textContent = partyNomes.length ? partyNomes.join(' ') : 'nenhum espírito selecionado';
  },

  abrirModalEspirito(instId) {
    this.instSelecionada = instId;
    const inst = State.data.espiritos.find(e => e.instId === instId);
    if (!inst) return;
    const { linha, stats, nome, emoji } = this.espiritoLabel(inst);
    const raridade = raridadePorId(inst.raridadeId);
    const chakra = chakraPorId(linha.chakraId);
    const custo = State.custoEvoluir(inst.nivel);
    const naParty = State.emParty(instId);

    this.els.modalEspirito.innerHTML = `
      <div class="modal-topo">
        <div>
          <div style="font-size:2.4rem;">${emoji}</div>
          <div style="font-weight:700;">${nome}</div>
          <div class="sub">${chakra.nome} · <span style="color:${raridade.cor}">${raridade.nome}</span> · Nível ${inst.nivel}</div>
        </div>
        <button class="modal-fechar" id="modal-fechar">✕</button>
      </div>
      <div class="stats-grid">
        <div class="stat">Vida <b>${stats.hp}</b></div>
        <div class="stat">Poder <b>${stats.atk}</b></div>
        <div class="stat">Defesa <b>${stats.def}</b></div>
        <div class="stat">Velocidade <b>${stats.spd}</b></div>
      </div>
      <button class="btn btn-full" id="modal-subir-nivel">Evoluir (custa ${custo} 🔮)</button>
      <button class="btn ${naParty ? 'perigo' : 'secundario'} btn-full" id="modal-toggle-party">
        ${naParty ? 'Remover da party' : 'Adicionar à party'}
      </button>
    `;
    document.getElementById('modal-fechar').addEventListener('click', () => this.fecharModal());
    document.getElementById('modal-subir-nivel').addEventListener('click', () => Main.subirNivel(instId));
    document.getElementById('modal-toggle-party').addEventListener('click', () => Main.alternarParty(instId));
    this.els.overlayEspirito.classList.add('ativo');
  },

  fecharModal() {
    this.els.overlayEspirito.classList.remove('ativo');
    this.instSelecionada = null;
  },

  renderMapa() {
    const lista = this.els.mapaLista;
    lista.innerHTML = '';
    const maior = State.data.progresso.maiorEstagio;
    const inicioJanela = Math.max(1, maior - 2);
    for (let n = inicioJanela; n <= maior + 6; n++) {
      const chakra = CHAKRAS[(n - 1) % CHAKRAS.length];
      const bloqueado = n > maior + 1;
      const concluido = n <= maior;
      const item = document.createElement('div');
      item.className = 'mapa-item' + (bloqueado ? ' bloqueado' : '') + (concluido ? ' concluido' : '');
      item.innerHTML = `
        <div class="badge-chakra" style="background:${chakra.cor}">${n}</div>
        <div class="info">
          <div class="titulo">Reino de ${chakra.nome}</div>
          <p class="sub">${concluido ? 'Concluído' : bloqueado ? 'Bloqueado' : 'Disponível'} · Elemento ${chakra.elemento}</p>
        </div>
        <div>${concluido ? '✅' : bloqueado ? '🔒' : '▶️'}</div>
      `;
      if (!bloqueado) item.addEventListener('click', () => Main.iniciarBatalha(n));
      lista.appendChild(item);
    }
  },

  mostrarMapa() {
    this.els.cardMapa.style.display = '';
    this.els.cardBatalha.style.display = 'none';
  },

  mostrarBatalha() {
    this.els.cardMapa.style.display = 'none';
    this.els.cardBatalha.style.display = '';
  },

  combatenteHtml(c) {
    const pct = Math.max(0, Math.round((c.hp / c.hpMax) * 100));
    return `
      <div class="combatente ${c.hp <= 0 ? 'caido' : ''}">
        <span class="emoji">${c.emoji}</span>
        <span class="nome">${c.nome}</span>
        <div class="hp-barra"><div style="width:${pct}%"></div></div>
        <span class="hp-texto">${Math.max(0, c.hp)}/${c.hpMax}</span>
      </div>
    `;
  },

  renderBatalha() {
    const b = Battle.atual;
    if (!b) return;
    this.els.batalhaTitulo.textContent = `Reino de ${b.estagio.chakra.nome} — Onda ${b.ondaIdx + 1}/${b.estagio.ondas.length}`;
    this.els.colJogador.innerHTML = b.jogador.map(c => this.combatenteHtml(c)).join('');
    this.els.colInimigo.innerHTML = b.inimigos.map(c => this.combatenteHtml(c)).join('');
    this.els.logBatalha.innerHTML = [...b.log].reverse().map(l => `<div>${l}</div>`).join('');
    this.els.btnBencao.disabled = b.bencaoUsada || b.terminado || State.data.luz < Battle.custoBencao;
    this.els.btnRound.disabled = b.terminado;
    this.els.btnRound.textContent = b.terminado ? (b.vitoria ? 'Vitória!' : 'Derrota…') : 'Avançar';
  },

  renderInvocarCusto() {
    this.els.custoInvocar.textContent = State.custoInvocacao;
  },

  mostrarResultadoInvocacao(inst) {
    const { linha, stats, nome, emoji } = this.espiritoLabel(inst);
    const raridade = raridadePorId(inst.raridadeId);
    const box = this.els.resultadoInvocacao;
    box.style.display = 'flex';
    box.innerHTML = `
      <div class="emoji-grande">${emoji}</div>
      <div style="font-weight:700;">${nome}</div>
      <div class="sub" style="color:${raridade.cor}">${raridade.nome}</div>
    `;
  },

  renderTudo() {
    this.renderHud();
    this.renderInicio();
    this.renderEspiritos();
    this.renderMapa();
  },
};
