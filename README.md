# ✨ Caminho da Luz

Um jogo de navegador (browser) de coleção e progressão espiritual — pensado
como alternativa ao *Fiends*, mas trocando demónios e violência por
crescimento interior, meditação e transmutação de sombras emocionais.

Funciona diretamente no telemóvel ou no PC, sem instalação: é uma aplicação
web estática (HTML + CSS + JavaScript puro, sem dependências ou build).

## 🎮 Jogar online

**https://david12345.github.io/ideia/**

O site é publicado automaticamente no GitHub Pages a cada push a este
branch, através do workflow em `.github/workflows/deploy-pages.yml`.

## Conceito

- **Medita** para gerar Luz, a energia principal do jogo (também cresce
  sozinha com o tempo, incluindo enquanto estiveres offline).
- **Invoca Espíritos** ligados aos sete chakras (Raiz, Sacral, Plexo Solar,
  Coração, Garganta, Terceiro Olho e Coroa), cada um com a sua própria
  linha evolutiva de três estágios e quatro níveis de raridade.
- **Evolui** os teus espíritos com Essência ganha em combate.
- **Percorre o Caminho da Luz**, uma jornada infinita por reinos temáticos,
  enfrentando Sombras — personificações de emoções como dúvida, apego,
  raiva ou ilusão — num combate por turnos com vantagens elementais.
- **Mantém uma sequência diária** de meditação para ganhar Karma.

## Como jogar

Basta abrir `index.html` num navegador — não requer servidor nem build.

Para servir localmente (opcional, útil para testar em telemóvel na mesma rede):

```bash
python3 -m http.server 8000
# depois abre http://localhost:8000 no navegador
```

O progresso é guardado automaticamente no `localStorage` do navegador. Em
"Ajustes" é possível exportar/importar o progresso como código de texto, ou
reiniciar o jogo.

## Estrutura do código

```
index.html        Estrutura da página e das várias vistas (views)
css/style.css      Estilo responsivo (mobile-first, com layout adaptado a PC)
js/data.js         Definições estáticas: chakras, espíritos, raridades, sombras
js/state.js        Estado do jogador, persistência e economia (luz/essência/karma)
js/battle.js       Geração de estágios e motor de combate por turnos
js/ui.js           Renderização das vistas a partir do estado do jogo
js/main.js         Arranque, navegação e ligação de eventos
.github/workflows/deploy-pages.yml   Publicação automática no GitHub Pages
```
