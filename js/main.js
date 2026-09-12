/* ============================================================
   MAIN.JS — Arranque, navegação entre views e ligação de eventos.
   ============================================================ */

const Main = {
  init() {
    State.carregar();
    UI.init();
    UI.renderTudo();
    this.ligarNavegacao();
    this.ligarEventos();
    this.mostrarMensagensDeEntrada();
    this.loop();
    setInterval(() => this.tickVisual(), 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        State.aplicarGanhosOffline();
        UI.renderTudo();
      }
    });
    window.addEventListener('beforeunload', () => {
      State.data.ultimoTick = Date.now();
      State.guardar();
    });
  },

  mostrarMensagensDeEntrada() {
    if (State.ultimoGanhoOffline && State.ultimoGanhoOffline > 1) {
      UI.toast(`Enquanto meditava em silêncio, ganhou ${UI.fmt(State.ultimoGanhoOffline)} 💡 de Luz.`);
    }
    if (State.ultimoBonusStreak) {
      UI.toast(`Sequência diária: +${State.ultimoBonusStreak} ☯️ Karma (dia ${State.data.streak.contagem}).`);
    }
  },

  ligarNavegacao() {
    document.querySelectorAll('.nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav button').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('ativa'));
        document.getElementById('view-' + btn.dataset.view).classList.add('ativa');
        if (btn.dataset.view === 'espiritos') UI.renderEspiritos();
        if (btn.dataset.view === 'jornada') UI.renderMapa();
      });
    });
  },

  ligarEventos() {
    document.getElementById('btn-meditar').addEventListener('click', () => this.meditar());
    document.getElementById('btn-invocar').addEventListener('click', () => this.invocar());
    document.getElementById('btn-round').addEventListener('click', () => this.avancarRound());
    document.getElementById('btn-bencao').addEventListener('click', () => this.usarBencao());
    document.getElementById('btn-fugir').addEventListener('click', () => this.recuarBatalha());
    UI.els.overlayEspirito.addEventListener('click', (e) => {
      if (e.target === UI.els.overlayEspirito) UI.fecharModal();
    });
    document.getElementById('btn-reset').addEventListener('click', () => this.reiniciar());
    document.getElementById('btn-exportar').addEventListener('click', () => this.exportarSave());
    document.getElementById('btn-importar').addEventListener('click', () => this.importarSave());
  },

  loop() {
    // Salvaguarda periódica do progresso
    setInterval(() => State.guardar(), 5000);
  },

  tickVisual() {
    State.tick(1);
    UI.renderHud();
    if (document.getElementById('view-inicio').classList.contains('ativa')) {
      UI.atualizarBotaoMeditar();
    }
  },

  meditar() {
    const ganho = State.meditar();
    if (ganho == null) return;
    UI.toast(`+${ganho} 💡 de Luz através da meditação.`);
    UI.renderHud();
    UI.atualizarBotaoMeditar();
  },

  subirNivel(instId) {
    const r = State.subirNivel(instId);
    if (!r.ok) {
      UI.toast(`Precisa de ${r.faltaEssencia} 🔮 de Essência para evoluir.`);
      return;
    }
    UI.toast(`Espírito subiu para o nível ${r.novoNivel}!`);
    UI.renderHud();
    UI.abrirModalEspirito(instId);
    UI.renderEspiritos();
  },

  alternarParty(instId) {
    const res = State.alternarParty(instId);
    if (res === null) {
      UI.toast('A sua party já tem 3 espíritos. Remova um primeiro.');
      return;
    }
    UI.abrirModalEspirito(instId);
    UI.renderEspiritos();
  },

  invocar() {
    if (State.data.luz < State.custoInvocacao) {
      UI.toast('Luz insuficiente para invocar.');
      return;
    }
    const orbe = UI.els.orbeInvocar;
    orbe.classList.add('girando');
    UI.els.resultadoInvocacao.style.display = 'none';
    setTimeout(() => {
      const inst = State.invocar();
      orbe.classList.remove('girando');
      if (!inst) return;
      UI.mostrarResultadoInvocacao(inst);
      UI.renderHud();
      State.guardar();
    }, 750);
  },

  iniciarBatalha(n) {
    if (State.data.party.length === 0) {
      UI.toast('Escolha ao menos um espírito para a sua party antes de partir.');
      return;
    }
    Battle.iniciar(n);
    UI.mostrarBatalha();
    UI.renderBatalha();
  },

  avancarRound() {
    const b = Battle.atual;
    if (!b || b.terminado) {
      this.finalizarBatalha();
      return;
    }
    Battle.avancarRound();
    UI.renderBatalha();
    UI.renderHud();
    if (b.terminado) {
      const rec = Battle.aplicarRecompensas();
      if (rec) {
        UI.toast(`Recompensa: +${rec.essencia} 🔮 +${rec.luz} 💡${rec.karma ? ' +' + rec.karma + ' ☯️' : ''}`);
      }
      UI.renderHud();
      State.guardar();
    }
  },

  usarBencao() {
    const ok = Battle.usarBencao();
    if (!ok) return;
    UI.renderBatalha();
    UI.renderHud();
  },

  finalizarBatalha() {
    Battle.atual = null;
    UI.mostrarMapa();
    UI.renderMapa();
    UI.renderInicio();
  },

  recuarBatalha() {
    this.finalizarBatalha();
  },

  reiniciar() {
    if (!confirm('Tem a certeza que quer reiniciar todo o progresso? Esta ação não pode ser desfeita.')) return;
    localStorage.removeItem(SAVE_KEY);
    State.data = State.novoJogo();
    State.darEspiritoInicial();
    State.guardar();
    UI.renderTudo();
    UI.toast('Uma nova jornada começa.');
  },

  exportarSave() {
    const texto = btoa(unescape(encodeURIComponent(JSON.stringify(State.data))));
    prompt('Copie este código para guardar o seu progresso:', texto);
  },

  importarSave() {
    const texto = prompt('Cole aqui o código do seu progresso guardado:');
    if (!texto) return;
    try {
      const json = decodeURIComponent(escape(atob(texto.trim())));
      const dados = JSON.parse(json);
      State.data = dados;
      State.migrar();
      State.data.ultimoTick = Date.now();
      State.guardar();
      UI.renderTudo();
      UI.toast('Progresso importado com sucesso.');
    } catch (e) {
      UI.toast('Código inválido. Verifique e tente novamente.');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Main.init());
