/* ===== ARQUIVO PRINCIPAL ORIGINAL: Código colado(5).js ===== */
const selecionar = (query) => document.querySelector(query);
const selecionarTodos = (query) => document.querySelectorAll(query);

const SCRIPT_ATUAL = document.currentScript?.src || location.href;
const SPOTIFY_CACHE_URL = new URL("../../data/spotify-cache.json", SCRIPT_ATUAL).href;

const SPOTIFY_ARTIST_ID =
  document.querySelector(".spotify-artista")?.id?.trim() || "";

async function carregarSpotify() {
  if (!SPOTIFY_ARTIST_ID) {
    console.warn("Nenhum ID de artista foi encontrado em .spotify-artista.");
    return;
  }

  try {
    const cache = await carregarCacheSpotify();

    const artista = cache.artistas?.[SPOTIFY_ARTIST_ID];

    if (artista) {
      aplicarPerfilArtista(artista);
      atualizarSeo(artista);
    }

    aplicarCapasAlbuns(cache.albuns || {});
    aplicarCapasMusicas(cache.musicas || {});
    aplicarCapasCertificados(cache.musicas || {});
    aplicarCapasNumeroUm(cache.musicas || {}, cache.albuns || {});
  } catch (erro) {
    console.error("Erro ao carregar spotify-cache.json:", erro);
  }
}

async function carregarCacheSpotify() {
  const resposta = await fetch(`${SPOTIFY_CACHE_URL}?v=${Date.now()}`);

  if (!resposta.ok) {
    throw new Error(`Erro ao carregar cache: ${resposta.status}`);
  }

  return resposta.json();
}

function aplicarPerfilArtista(artista) {
  const nomeArtista = artista.name || "Artista";
  const imagem = artista.image || "";
  const linkSpotify = artista.spotify || "#";

  const titulo = selecionar("#nomeArtista");
  const link = selecionar("#linkSpotifyArtista");
  const imagemArtista = selecionar("#imagemArtista");
  const heroImagemBox = selecionar("#heroImagemBox");

  if (titulo) titulo.textContent = nomeArtista;
  if (link) link.href = linkSpotify;

  if (imagem && imagemArtista && heroImagemBox) {
    imagemArtista.src = imagem;
    imagemArtista.alt = `Imagem de ${nomeArtista}`;
    imagemArtista.classList.add("hero-imagem-carregada");
    heroImagemBox.classList.add("hero-imagem-box-com-imagem");
  }

  selecionarTodos(".nome-artista-api").forEach((elemento) => {
    elemento.textContent = nomeArtista;
  });
}

function aplicarCapasAlbuns(albuns) {
  const cards = Array.from(document.querySelectorAll("[data-spotify-album-id]"));

  cards.forEach((card) => {
    const albumId = card.dataset.spotifyAlbumId;
    const album = albuns[albumId];

    if (!album) return;

    const imagem = card.querySelector(".card-album-imagem");
    const capa = card.querySelector(".card-album-capa");
    const nome = card.querySelector(".card-album-nome");

    if (capa && "href" in capa) capa.href = album.spotify || "#";
    if (nome && "href" in nome) nome.href = album.spotify || "#";

    if (imagem && album.image) {
      imagem.src = album.image;
      imagem.alt = `Capa de ${album.name || "álbum"}`;
      capa?.classList.add("card-album-com-imagem");
    }
  });
}

function aplicarCapasMusicas(musicas) {
  const linhas = Array.from(
    document.querySelectorAll(".linha-musica[data-spotify-track-id]")
  );

  linhas.forEach((linha) => {
    const trackId = linha.dataset.spotifyTrackId;
    const musica = musicas[trackId];

    if (!musica) return;

    const imagem = linha.querySelector(".musica-imagem");
    const capaLink = linha.querySelector(".musica-capa-link");
    const nome = linha.querySelector(".musica-nome");

    if (capaLink && "href" in capaLink) capaLink.href = musica.spotify || "#";
    if (nome && "href" in nome) nome.href = musica.spotify || "#";

    if (imagem && musica.image) {
      imagem.src = musica.image;
      imagem.alt = `Capa de ${musica.name || "música"}`;
    }
  });
}

function aplicarCapasCertificados(musicas) {
  const cards = Array.from(
    document.querySelectorAll(".card-certificado[data-spotify-track-id]")
  );

  cards.forEach((card) => {
    const trackId = card.dataset.spotifyTrackId;
    const musica = musicas[trackId];

    if (!musica) return;

    const imagem = card.querySelector(".card-certificado-imagem");
    const capa = card.querySelector(".card-certificado-capa");
    const nome = card.querySelector(".card-certificado-nome");

    if (capa && "href" in capa) capa.href = musica.spotify || "#";
    if (nome && "href" in nome) nome.href = musica.spotify || "#";

    if (imagem && musica.image) {
      imagem.src = musica.image;
      imagem.alt = `Capa de ${musica.name || "música"}`;
    }
  });
}

function aplicarCapasNumeroUm(musicas, albuns) {
  const cards = Array.from(
    document.querySelectorAll(".no1-card[data-spotify-track-id]")
  );

  cards.forEach((card) => {
    const trackId = card.dataset.spotifyTrackId;
    const albumId = card.dataset.spotifyAlbumId;

    const musica = musicas[trackId];
    const album = albuns[albumId];

    const imagem = card.querySelector(".no1-img");
    const capa = card.querySelector(".no1-capa");

    if (musica && "href" in card) {
      card.href = musica.spotify || "#";
    }

    if (imagem && album?.image) {
      imagem.src = album.image;
      imagem.alt = `Capa de ${album.name || "álbum"}`;
      card.classList.add("no1-card-com-img");
      capa?.classList.add("no1-capa-com-img");
      return;
    }

    if (imagem && musica?.image) {
      imagem.src = musica.image;
      imagem.alt = `Capa de ${musica.name || "música"}`;
      card.classList.add("no1-card-com-img");
      capa?.classList.add("no1-capa-com-img");
    }
  });
}

function aplicarPeriodo(periodo) {
  selecionarTodos(".seletor-periodo").forEach((select) => {
    select.value = periodo;
  });

  selecionarTodos(".conteudo-periodo[data-periodo]").forEach((bloco) => {
    bloco.classList.toggle(
      "conteudo-periodo-ativo",
      bloco.dataset.periodo === periodo
    );
  });

  filtrarSemanas(periodo);
  atualizarBotoesMusicas();
}

function filtrarSemanas(periodoSelecionado) {
  const periodosPermitidos = {
    all: ["all", "12m", "6m", "3m", "1m"],
    "12m": ["12m", "6m", "3m", "1m"],
    "6m": ["6m", "3m", "1m"],
    "3m": ["3m", "1m"],
    "1m": ["1m"]
  };

  selecionarTodos(".grade-semanas .sem-cel").forEach((semana) => {
    const periodoSemana = semana.dataset.periodo || "all";

    semana.hidden =
      !periodosPermitidos[periodoSelecionado].includes(periodoSemana);
  });
}

function configurarPeriodos() {
  selecionarTodos(".seletor-periodo").forEach((select) => {
    select.addEventListener("change", (evento) => {
      aplicarPeriodo(evento.target.value);
    });
  });
}

function configurarListaMusicas(listaSelector, itemSelector, botaoExibirSelector, botaoRecolherSelector) {
  const botaoExibir = selecionar(botaoExibirSelector);
  const botaoRecolher = selecionar(botaoRecolherSelector);

  if (!botaoExibir || !botaoRecolher) return;

  selecionarTodos(listaSelector).forEach((lista) => {
    const itens = Array.from(lista.querySelectorAll(itemSelector));

    itens.forEach((item, indice) => {
      item.hidden = indice >= 10;
    });
  });

  botaoExibir.addEventListener("click", () => {
    const lista = selecionar(listaSelector);
    if (!lista) return;

    const escondidas = Array.from(lista.querySelectorAll(`${itemSelector}[hidden]`));

    escondidas.slice(0, 10).forEach((item) => {
      item.hidden = false;
    });

    atualizarBotoesMusicas();
  });

  botaoRecolher.addEventListener("click", () => {
    const lista = selecionar(listaSelector);
    if (!lista) return;

    const itens = Array.from(lista.querySelectorAll(itemSelector));

    itens.forEach((item, indice) => {
      item.hidden = indice >= 10;
    });

    atualizarBotoesMusicas();
  });
}

function atualizarBotoesListaMusicas(listaSelector, itemSelector, botaoExibirSelector, botaoRecolherSelector) {
  const lista = selecionar(listaSelector);
  const botaoExibir = selecionar(botaoExibirSelector);
  const botaoRecolher = selecionar(botaoRecolherSelector);

  if (!lista || !botaoExibir || !botaoRecolher) return;

  const itens = Array.from(lista.querySelectorAll(itemSelector));
  const visiveis = itens.filter((item) => !item.hidden).length;

  botaoExibir.disabled = visiveis >= itens.length;
  botaoRecolher.disabled = visiveis <= 10;
}

function configurarMusicas() {
  configurarListaMusicas(
    ".musicas-area.conteudo-periodo-ativo .linhas-musicas",
    ".linha-musica",
    "#btnExibirMais",
    "#btnRecolherTudo"
  );

  configurarListaMusicas(
    ".no1-area .grade-no1.conteudo-periodo-ativo",
    ".no1-card",
    "#btnExibirMaisNo1",
    "#btnRecolherTudoNo1"
  );
}

function atualizarBotoesMusicas() {
  atualizarBotoesListaMusicas(
    ".musicas-area.conteudo-periodo-ativo .linhas-musicas",
    ".linha-musica",
    "#btnExibirMais",
    "#btnRecolherTudo"
  );

  atualizarBotoesListaMusicas(
    ".no1-area .grade-no1.conteudo-periodo-ativo",
    ".no1-card",
    "#btnExibirMaisNo1",
    "#btnRecolherTudoNo1"
  );
}

function converterValorMusica(texto) {
  if (!texto) return null;

  const valorLimpo = texto
    .trim()
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!valorLimpo) return null;

  const numero = Number(valorLimpo);

  return Number.isFinite(numero) ? numero : null;
}

function obterValorMusica(linha, seletor) {
  const elemento = linha.querySelector(seletor);

  return converterValorMusica(elemento?.textContent || "");
}

function obterValorOrdenacaoMusica(linha, coluna) {
  const seletores = {
    ranking: ".musica-ranking",
    scrobbles: ".musica-scrobbles",
    pontuacao: ".musica-pontuacao",
    semanas: ".musica-semanas",
    dias: ".musica-dias"
  };

  return obterValorMusica(linha, seletores[coluna]);
}

function compararValoresNulos(valorA, valorB) {
  if (valorA === null && valorB === null) return 0;
  if (valorA === null) return 1;
  if (valorB === null) return -1;

  return null;
}

function compararPico(linhaA, linhaB, direcao) {
  const picoA =
    obterValorMusica(linhaA, ".pico-posicao");

  const picoB =
    obterValorMusica(linhaB, ".pico-posicao");

  const vezesA =
    obterValorMusica(linhaA, ".pico-vezes") ?? 0;

  const vezesB =
    obterValorMusica(linhaB, ".pico-vezes") ?? 0;

  const comparacaoNulos =
    compararValoresNulos(picoA, picoB);

  if (comparacaoNulos !== null && comparacaoNulos !== 0) {
    return comparacaoNulos;
  }

  /*
   * DESC = melhor para pior.
   *
   * Pico menor primeiro:
   * 1, 2, 3, 4...
   *
   * Em empate, mais vezes primeiro:
   * 10x, 8x, 5x...
   */
  if (direcao === "desc") {
    if (picoA !== picoB) {
      return picoA - picoB;
    }

    return vezesB - vezesA;
  }

  /*
   * ASC = pior para melhor.
   *
   * Pico maior primeiro:
   * 100, 99, 98...
   *
   * Em empate, menos vezes primeiro.
   */
  if (picoA !== picoB) {
    return picoB - picoA;
  }

  return vezesA - vezesB;
}

function ordenarListaMusicas(botao) {
  const listaMusicas = botao.closest(".lista-musicas");
  const linhasContainer =
    listaMusicas?.querySelector(".linhas-musicas");

  if (!listaMusicas || !linhasContainer) return;

  const coluna = botao.dataset.ordenar;
  const direcaoAtual = botao.dataset.direcao || "";

  /*
   * Pico começa do melhor para o pior:
   * #1, #2, #3...
   *
   * As demais colunas começam do maior para o menor.
   */
  const direcaoInicial =
    coluna === "ranking"
      ? "asc"
      : "desc";

  const novaDirecao =
    direcaoAtual === ""
      ? direcaoInicial
      : direcaoAtual === "desc"
        ? "asc"
        : "desc";

  listaMusicas
    .querySelectorAll(".cabecalho-musica-ordenavel")
    .forEach((outroBotao) => {
      outroBotao.dataset.direcao = "";
    });

  botao.dataset.direcao = novaDirecao;

  const linhas = Array.from(
    linhasContainer.querySelectorAll(".linha-musica")
  );

  const ordemAtual = new Map(
    linhas.map((linha, indice) => [linha, indice])
  );

  linhas.forEach((linha) => {
    linha.hidden = false;
  });

  linhas.sort((linhaA, linhaB) => {
    if (coluna === "pico") {
      const resultadoPico = compararPico(
        linhaA,
        linhaB,
        novaDirecao
      );

      if (resultadoPico !== 0) {
        return resultadoPico;
      }

      return (
        ordemAtual.get(linhaA) -
        ordemAtual.get(linhaB)
      );
    }

    const valorA =
      obterValorOrdenacaoMusica(linhaA, coluna);

    const valorB =
      obterValorOrdenacaoMusica(linhaB, coluna);

    const comparacaoNulos =
      compararValoresNulos(valorA, valorB);

    if (comparacaoNulos !== null) {
      if (comparacaoNulos !== 0) {
        return comparacaoNulos;
      }

      return (
        ordemAtual.get(linhaA) -
        ordemAtual.get(linhaB)
      );
    }

    const diferenca =
      novaDirecao === "desc"
        ? valorB - valorA
        : valorA - valorB;

    if (diferenca !== 0) {
      return diferenca;
    }

    return (
      ordemAtual.get(linhaA) -
      ordemAtual.get(linhaB)
    );
  });

  linhas.forEach((linha) => {
    linhasContainer.appendChild(linha);
  });

  atualizarBotoesMusicas();
}

function configurarOrdenacaoMusicas() {
  selecionarTodos(
    ".cabecalho-musica-ordenavel"
  ).forEach((botao) => {
    botao.addEventListener("click", () => {
      ordenarListaMusicas(botao);
    });
  });
}

function configurarTema() {
  const temaSalvo = localStorage.getItem("toncharts-theme") || "dark";

  document.documentElement.setAttribute("data-theme", temaSalvo);
  atualizarIconeTema(temaSalvo);

  selecionar("#botaoTema")?.addEventListener("click", () => {
    const temaAtual = document.documentElement.getAttribute("data-theme");
    const proximoTema = temaAtual === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", proximoTema);
    localStorage.setItem("toncharts-theme", proximoTema);
    atualizarIconeTema(proximoTema);
  });
}

function atualizarIconeTema(tema) {
  const botao = selecionar("#botaoTema");
  const icone = botao?.querySelector(".icone-tema");

  if (!botao || !icone) return;

  icone.classList.toggle("fa-sun", tema === "dark");
  icone.classList.toggle("fa-moon", tema === "light");
  botao.setAttribute(
    "aria-label",
    tema === "dark" ? "Alternar modo claro" : "Alternar modo escuro"
  );
}

function atualizarLabelsPeriodoResponsivo() {
  const usarTextoCurto = window.matchMedia("(max-width: 32.5rem)").matches;

  selecionarTodos(".opcao-periodo").forEach((opcao) => {
    opcao.textContent = usarTextoCurto
      ? opcao.dataset.short
      : opcao.dataset.full;
  });
}

function configurarTooltipSemanas() {
  selecionarTodos(".sem-item").forEach((quadrinho) => {
    quadrinho.addEventListener("mouseenter", () => mostrarTooltipSemana(quadrinho));
    quadrinho.addEventListener("focus", () => mostrarTooltipSemana(quadrinho));
    quadrinho.addEventListener("mouseleave", esconderTooltipSemana);
    quadrinho.addEventListener("blur", esconderTooltipSemana);
  });
}

function mostrarTooltipSemana(quadrinho) {
  const tooltip = selecionar("#tooltipSemana");
  const tooltipData = selecionar("#tooltipData");
  const tooltipPosicao = selecionar("#tooltipPosicao");
  const tooltipPlays = selecionar("#tooltipPlays");
  const tooltipMelhor = selecionar("#tooltipMelhor");

  if (!tooltip || !tooltipData || !tooltipPosicao || !tooltipPlays || !tooltipMelhor) return;

  const rect = quadrinho.getBoundingClientRect();

  tooltipData.textContent = quadrinho.dataset.data || "";
  tooltipPosicao.textContent = quadrinho.dataset.posicao || "";
  tooltipPlays.textContent = quadrinho.dataset.plays || "";

  tooltipMelhor.classList.toggle(
    "tooltip-melhor-visivel",
    quadrinho.dataset.melhor === "true"
  );

  tooltip.classList.add("tooltip-semana-visivel");

  tooltip.style.left = `${Math.min(
    Math.max(rect.left + rect.width / 2, 112),
    window.innerWidth - 112
  )}px`;

  tooltip.style.top = `${Math.max(rect.top - 8, 90)}px`;
}

function esconderTooltipSemana() {
  selecionar("#tooltipSemana")?.classList.remove("tooltip-semana-visivel");
}

function atualizarSeo(artista) {
  const nome = artista.name || "Artista";
  const imagem = artista.image || "";

  const descricao = `Perfil musical de ${nome} com métricas, desempenho por período, semanas, álbuns, principais músicas e certificações.`;

  document.title = `${nome} — TonCharts`;

  atualizarMetaNome("description", descricao);
  atualizarMetaPropriedade("og:title", `${nome} — TonCharts`);
  atualizarMetaPropriedade("og:description", descricao);
  atualizarMetaPropriedade("og:image", imagem);
  atualizarMetaNome("twitter:title", `${nome} — TonCharts`);
  atualizarMetaNome("twitter:description", descricao);
  atualizarMetaNome("twitter:image", imagem);
}

function atualizarMetaNome(nome, conteudo) {
  const meta = document.querySelector(`meta[name="${nome}"]`);
  if (meta) meta.setAttribute("content", conteudo || "");
}

function atualizarMetaPropriedade(propriedade, conteudo) {
  const meta = document.querySelector(`meta[property="${propriedade}"]`);
  if (meta) meta.setAttribute("content", conteudo || "");
}

function atualizarUnidadeSemanas() {
  selecionarTodos(".sequencia-semanas").forEach((elemento) => {
    const numero = Number(
      elemento.querySelector("strong")?.textContent.trim()
    );

    const unidade = elemento.querySelector(
      ".sequencia-semanas-unidade"
    );

    if (!unidade) return;

    unidade.textContent = numero === 1
      ? "semana"
      : "semanas";
  });
}

function configurarSequenciasDobraveis() {
  selecionarTodos(".sequencia-ranking").forEach(
    (ranking, indice) => {
      const titulo = ranking.querySelector(
        ".sequencia-ranking-titulo"
      );

      const lista = ranking.querySelector(
        ".sequencia-ranking-lista"
      );

      if (!titulo || !lista) return;

      if (titulo.dataset.dobravel === "true") return;

      titulo.dataset.dobravel = "true";

      const listaId =
        lista.id ||
        `sequencia-ranking-lista-${indice + 1}`;

      lista.id = listaId;

      const abertoInicialmente = ranking.classList.contains(
        "sequencia-ranking-chart"
      );

      titulo.setAttribute("role", "button");
      titulo.setAttribute("tabindex", "0");
      titulo.setAttribute("aria-controls", listaId);

      const seta = document.createElement("i");

      seta.className = "fa-solid sequencia-ranking-seta";
      seta.setAttribute("aria-hidden", "true");

      titulo.appendChild(seta);

      function atualizarEstado(aberto) {
        titulo.setAttribute(
          "aria-expanded",
          String(aberto)
        );

        lista.hidden = !aberto;

        ranking.classList.toggle(
          "sequencia-ranking-fechado",
          !aberto
        );

        seta.classList.toggle(
          "fa-chevron-up",
          aberto
        );

        seta.classList.toggle(
          "fa-chevron-down",
          !aberto
        );
      }

      function alternarRanking() {
        const estaAberto =
          titulo.getAttribute("aria-expanded") === "true";

        atualizarEstado(!estaAberto);
      }

      atualizarEstado(abertoInicialmente);

      titulo.addEventListener(
        "click",
        alternarRanking
      );

      titulo.addEventListener(
        "keydown",
        (evento) => {
          if (
            evento.key !== "Enter" &&
            evento.key !== " "
          ) {
            return;
          }

          evento.preventDefault();
          alternarRanking();
        }
      );
    }
  );
}

function configurarSequenciasAcumuladasDobraveis() {
  selecionarTodos(".sequencia-acumulado").forEach(
    (acumulado, indice) => {
      const titulo = acumulado.querySelector(
        ".sequencia-acumulado-titulo"
      );

      const lista = acumulado.querySelector(
        ".sequencia-acumulado-lista"
      );

      if (!titulo || !lista) return;

      if (titulo.dataset.dobravel === "true") return;

      titulo.dataset.dobravel = "true";

      const listaId =
        lista.id ||
        `sequencia-acumulado-lista-${indice + 1}`;

      lista.id = listaId;

      const abertoInicialmente =
        acumulado.classList.contains(
          "sequencia-acumulado-chart"
        );

      titulo.setAttribute("role", "button");
      titulo.setAttribute("tabindex", "0");
      titulo.setAttribute("aria-controls", listaId);

      const seta = document.createElement("i");

      seta.className =
        "fa-solid sequencia-acumulado-seta";

      seta.setAttribute("aria-hidden", "true");

      titulo.appendChild(seta);

      function atualizarEstado(aberto) {
        titulo.setAttribute(
          "aria-expanded",
          String(aberto)
        );

        lista.hidden = !aberto;

        acumulado.classList.toggle(
          "sequencia-acumulado-fechado",
          !aberto
        );

        seta.classList.toggle(
          "fa-chevron-up",
          aberto
        );

        seta.classList.toggle(
          "fa-chevron-down",
          !aberto
        );
      }

      function alternarAcumulado() {
        const estaAberto =
          titulo.getAttribute("aria-expanded") === "true";

        atualizarEstado(!estaAberto);
      }

      atualizarEstado(abertoInicialmente);

      titulo.addEventListener(
        "click",
        alternarAcumulado
      );

      titulo.addEventListener(
        "keydown",
        (evento) => {
          if (
            evento.key !== "Enter" &&
            evento.key !== " "
          ) {
            return;
          }

          evento.preventDefault();
          alternarAcumulado();
        }
      );
    }
  );
}

let destinoScroll = window.scrollY;
let scrollAtual = window.scrollY;
let animandoScroll = false;

window.addEventListener("wheel", function (e) {
  e.preventDefault();

  destinoScroll += e.deltaY;

  destinoScroll = Math.max(
    0,
    Math.min(
      destinoScroll,
      document.documentElement.scrollHeight - window.innerHeight
    )
  );

  if (!animandoScroll) {
    animandoScroll = true;
    animarScroll();
  }
}, { passive: false });

function animarScroll() {
  scrollAtual += (destinoScroll - scrollAtual) * 0.4;

  window.scrollTo(0, scrollAtual);

  if (Math.abs(destinoScroll - scrollAtual) > 0.5) {
    requestAnimationFrame(animarScroll);
  } else {
    scrollAtual = destinoScroll;
    window.scrollTo(0, destinoScroll);
    animandoScroll = false;
  }
}

function iniciarPagina() {
  configurarTema();
  configurarPeriodos();
  configurarSequenciasDobraveis();
  configurarSequenciasAcumuladasDobraveis();
  configurarMusicas();
  configurarOrdenacaoMusicas();
  configurarTooltipSemanas();
  atualizarLabelsPeriodoResponsivo();
  atualizarUnidadeSemanas();

  const periodoInicial =
    selecionar(".seletor-periodo")?.value || "12m";

  aplicarPeriodo(periodoInicial);
  carregarSpotify();
}

iniciarPagina();

window.addEventListener("resize", atualizarLabelsPeriodoResponsivo);
/* ===== INÍCIO: bloco-inline-1 ===== */

/* Sincroniza exclusivamente os cards do hero com .seletor-periodo-hero.
   Não renomeia nem substitui hooks usados pelos JS externos. */
(() => {
  const seletor = document.querySelector('.seletor-periodo-hero');
  const grade = document.querySelector('.hero-grade');

  if (!seletor || !grade) return;

  const cards = [...grade.querySelectorAll('.card-metrica')];

  const chave = (periodo, campo) =>
    `${periodo}${campo.charAt(0).toUpperCase()}${campo.slice(1)}`;

function atualizarHero(periodo) {
  grade.classList.add('hero-periodo-atualizando');

  requestAnimationFrame(() => {
    cards.forEach((card) => {
      const numero = card.dataset[chave(periodo, 'numero')] ?? '—';
      const crescimento = card.dataset[chave(periodo, 'crescimento')] ?? '—';
      const ranking =
        card.dataset[chave(periodo, 'ranking')] ??
        'dados do período não preenchidos';
      const link = card.dataset[chave(periodo, 'link')] ?? '';

      const elNumero = card.querySelector('.card-metrica-numero');
      const elCrescimento = card.querySelector('.badge-crescimento-texto');
      const elRanking = card.querySelector('.card-metrica-ranking');
      const badge = card.querySelector('.badge-crescimento');
      const icone = card.querySelector('.icone-crescimento');

      if (elNumero) elNumero.textContent = numero;
      if (elCrescimento) elCrescimento.textContent = crescimento;
      if (elRanking) elRanking.textContent = ranking;

      card.dataset.linkAtual = link;

      const ausente = numero === '—';
      card.classList.toggle('card-metrica-dado-ausente', ausente);

      if (badge) badge.hidden = crescimento === '—';

      if (icone && crescimento !== '—') {
        const valor = Number.parseFloat(
          String(crescimento).replace(',', '.')
        );

        icone.classList.toggle('fa-arrow-up', !(valor < 0));
        icone.classList.toggle('fa-arrow-down', valor < 0);
      }
    });

    grade.dataset.periodoAtivo = periodo;
    grade.classList.remove('hero-periodo-atualizando');
  });
}

cards.forEach((card) => {
  card.addEventListener('click', () => {
    const link = card.dataset.linkAtual;
    if (link) window.location.href = link;
  });
});

seletor.addEventListener(
  'change',
  () => atualizarHero(seletor.value)
);

atualizarHero(seletor.value);

  seletor.addEventListener(
    'change',
    () => atualizarHero(seletor.value)
  );

  atualizarHero(seletor.value);
})();

/* ===== FIM: bloco-inline-1 ===== */


/* ===== INÍCIO: toncharts-scrollspy-v3 ===== */

(() => {
  const links = [
    ...document.querySelectorAll(
      '.navegacao-secoes__link[href^="#"]'
    )
  ];

/* Texto dos links da navegação */
links.forEach((link) => {
    if (link.querySelector('.navegacao-secoes__texto')) return;

    const texto = link.textContent
        .trim()
        .replace(/\s+/g, ' ');

    link.textContent = '';

    const span = document.createElement('span');
    span.className = 'navegacao-secoes__texto';
    span.textContent = texto;

    link.appendChild(span);

    if (!link.hasAttribute('aria-label')) {
        link.setAttribute('aria-label', texto);
    }
});


/* Abertura suave da navegação */
const navegacao = document.querySelector('.navegacao-secoes');

if (navegacao) {
    let temporizadorFechar;

    const abrirNavegacao = () => {
        clearTimeout(temporizadorFechar);

        requestAnimationFrame(() => {
            navegacao.classList.add('navegacao-secoes--aberta');
        });
    };

    const fecharNavegacao = () => {
        clearTimeout(temporizadorFechar);

        temporizadorFechar = setTimeout(() => {
            if (!navegacao.matches(':hover') &&
                !navegacao.contains(document.activeElement)) {
                navegacao.classList.remove('navegacao-secoes--aberta');
            }
        }, 100);
    };

    navegacao.addEventListener('mouseenter', abrirNavegacao);
    navegacao.addEventListener('mouseleave', fecharNavegacao);
    navegacao.addEventListener('focusin', abrirNavegacao);
    navegacao.addEventListener('focusout', fecharNavegacao);
}

  if (!links.length || !('IntersectionObserver' in window)) return;

  const map = new Map();

  links.forEach(link => {
    const target = document.querySelector(
      link.getAttribute('href')
    );

    if (target) map.set(target, link);
  });

  const setActive = (link) => {
    links.forEach(item => {
      item.classList.toggle('is-active', item === link);

      if (item === link) {
        item.setAttribute('aria-current', 'location');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    const list = link.closest('.navegacao-secoes__lista');

    if (list && list.scrollWidth > list.clientWidth) {
      const left =
        link.offsetLeft -
        (list.clientWidth / 2) +
        (link.offsetWidth / 2);

      list.scrollTo({
        left: Math.max(0, left),
        behavior: 'smooth'
      });
    }
  };

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort(
        (a, b) =>
          b.intersectionRatio -
          a.intersectionRatio
      )[0];

    if (!visible) return;

    const link = map.get(visible.target);

    if (link) setActive(link);
  }, {
    rootMargin: '-15% 0px -68% 0px',
    threshold: [0, .12, .3]
  });

  map.forEach(
    (_, section) => observer.observe(section)
  );

  if (links[0]) setActive(links[0]);
})();

/* ===== FIM: toncharts-scrollspy-v3 ===== */


/* ===== INÍCIO: toncharts-ajustes-finais-20260829 ===== */

(() => {
  const PERIODOS = ['all', '12m', '6m', '3m', '1m'];

  const FATORES = {
    all: 1.78,
    '12m': 1,
    '6m': .56,
    '3m': .31,
    '1m': .12
  };

  const HERO = [
    {
      all: ['412.840', '+18%', '#1 no ranking'],
      '12m': ['75.255', '+200%', '#1 no ranking'],
      '6m': ['39.840', '+46%', '#1 no ranking'],
      '3m': ['20.310', '+21%', '#1 no ranking'],
      '1m': ['6.940', '+8%', '#1 no ranking']
    },
    {
      all: ['1.386.420', '+22%', '#1 no ranking'],
      '12m': ['254.865', '+200%', '#1 no ranking'],
      '6m': ['136.940', '+51%', '#1 no ranking'],
      '3m': ['72.480', '+24%', '#1 no ranking'],
      '1m': ['23.760', '+9%', '#1 no ranking']
    },
    {
      all: ['398', '+14%', '#4 no ranking'],
      '12m': ['146', '+200%', '#6 no ranking'],
      '6m': ['82', '+38%', '#5 no ranking'],
      '3m': ['47', '+19%', '#5 no ranking'],
      '1m': ['18', '+7%', '#6 no ranking']
    },
    {
      all: ['214', '+17%', '#1 no ranking'],
      '12m': ['78', '+200%', '#1 no ranking'],
      '6m': ['41', '+33%', '#1 no ranking'],
      '3m': ['24', '+16%', '#1 no ranking'],
      '1m': ['9', '+6%', '#2 no ranking']
    },
    {
      all: ['4.968', '+20%', '#1 no ranking'],
      '12m': ['1.547', '+200%', '#1 no ranking'],
      '6m': ['836', '+42%', '#1 no ranking'],
      '3m': ['452', '+18%', '#1 no ranking'],
      '1m': ['156', '+7%', '#1 no ranking']
    },
    {
      all: ['682', '+16%', '#1 no ranking'],
      '12m': ['243', '+200%', '#1 no ranking'],
      '6m': ['132', '+36%', '#1 no ranking'],
      '3m': ['74', '+17%', '#1 no ranking'],
      '1m': ['28', '+8%', '#1 no ranking']
    }
  ];

  const numero = (txt) => {
    const s = String(txt ?? '')
      .trim()
      .replace(/\./g, '')
      .replace(',', '.');

    const m = s.match(/-?\d+(?:\.\d+)?/);

    return m ? Number(m[0]) : NaN;
  };

  const formatarEscalado = (original, fator) => {
    const txt = String(original).trim();

    const match =
      txt.match(/-?\d[\d.]*([,]\d+)?/);

    if (!match) return txt;

    const raw = match[0];

    const n = Number(
      raw
        .replace(/\./g, '')
        .replace(',', '.')
    );

    if (!Number.isFinite(n)) return txt;

    const scaled = Math.max(
      n > 0 ? 1 : 0,
      Math.round(n * fator)
    );

    const novo =
      scaled.toLocaleString('pt-BR');

    return txt.replace(raw, novo);
  };

  function preencherHero() {
    document
      .querySelectorAll('.hero-grade .card-metrica')
      .forEach((card, i) => {
        const dados = HERO[i];

        if (!dados) return;

        PERIODOS.forEach(p => {
          card.dataset[`${p}Numero`] =
            dados[p][0];

          card.dataset[`${p}Crescimento`] =
            dados[p][1];

          card.dataset[`${p}Ranking`] =
            dados[p][2];
        });
      });
  }

  function guardarBases(root) {
    const seletores = [
      '.top-card-numero',
      '.top-card-info div',
      '.card-album-numero',
      '.album-top5-plays',
      '.musica-numero',
      '.musica-posicao',
      '.musica-scrobbles',
      '.musica-semanas',
      '.card-certificado-quantidade',
      '.card-certificado-numero'
    ].join(',');

    root
      .querySelectorAll(seletores)
      .forEach(el => {
        if (!el.dataset.tcBase) {
          el.dataset.tcBase =
            el.textContent.trim();
        }
      });
  }

  function simularContainer(root, periodo) {
    guardarBases(root);

    const fator =
      FATORES[periodo] ?? 1;

    root
      .querySelectorAll('[data-tc-base]')
      .forEach(el => {
        el.textContent =
          periodo === '12m'
            ? el.dataset.tcBase
            : formatarEscalado(
                el.dataset.tcBase,
                fator
              );
      });
  }

  function animar(root, antes, depois) {
    if (!root) return;

    root.classList.remove(
      'tc-periodo-sobe',
      'tc-periodo-desce'
    );

    void root.offsetWidth;

    root.classList.add(
      Number.isFinite(antes) &&
      Number.isFinite(depois) &&
      depois >= antes
        ? 'tc-periodo-sobe'
        : 'tc-periodo-desce'
    );

    setTimeout(
      () =>
        root.classList.remove(
          'tc-periodo-sobe',
          'tc-periodo-desce'
        ),
      380
    );
  }

  function sincronizarPeriodo(select) {
    const section =
      select.closest('section') ||
      select.closest('.hero-area');

    if (!section) return;

    if (
      [
        'musicas',
        'albuns',
        'calendario',
        'certificados',
        'numeroUm',
        'sequenciasAcumuladas'
      ].includes(section.id)
    ) {
      return;
    }

    const periodo = select.value;

    const containers = [
      ...section.querySelectorAll(
        '.conteudo-periodo[data-periodo]'
      )
    ];

    const antesRoot =
      section.querySelector(
        '.conteudo-periodo-ativo'
      ) ||
      section
        .querySelector(
          '.card-metrica-numero'
        )
        ?.closest('.hero-grade');

    const antes = numero(
      antesRoot
        ?.querySelector?.(
          '.top-card-numero,.card-album-numero,.musica-numero,.card-certificado-quantidade,.card-metrica-numero'
        )
        ?.textContent
    );

    requestAnimationFrame(() => {
      if (containers.length) {
        const exato =
          containers.filter(
            c =>
              c.dataset.periodo ===
              periodo
          );

        if (exato.length) {
          containers.forEach(c =>
            c.classList.toggle(
              'conteudo-periodo-ativo',
              c.dataset.periodo ===
                periodo
            )
          );
        } else {
          const fallback =
            containers.find(
              c =>
                c.dataset.periodo ===
                '12m'
            ) ||
            containers[0];

          containers.forEach(c =>
            c.classList.remove(
              'conteudo-periodo-ativo'
            )
          );

          fallback.classList.add(
            'conteudo-periodo-ativo'
          );

          simularContainer(
            fallback,
            periodo
          );
        }
      }

      const ativos = [
        ...section.querySelectorAll(
          '.conteudo-periodo-ativo'
        )
      ];

      if (
        ativos.length &&
        !containers.some(
          c =>
            c.dataset.periodo ===
            periodo
        )
      ) {
        ativos.forEach(c =>
          simularContainer(
            c,
            periodo
          )
        );
      }

      const root =
        section.querySelector(
          '.conteudo-periodo-ativo'
        ) ||
        section.querySelector(
          '.hero-grade'
        );

      const depois = numero(
        root
          ?.querySelector?.(
            '.top-card-numero,.card-album-numero,.musica-numero,.card-certificado-quantidade,.card-metrica-numero'
          )
          ?.textContent
      );

      animar(
        root,
        antes,
        depois
      );
    });
  }

  function normalizarDropdowns() {
    const titulos =
      document.querySelectorAll(
        '.sequencia-ranking-titulo,.sequencia-acumulado-titulo'
      );

    titulos.forEach(titulo => {
      const box =
        titulo.closest(
          '.sequencia-ranking,.sequencia-acumulado'
        );

      const lista =
        box?.querySelector(
          '.sequencia-ranking-lista,.sequencia-acumulado-lista'
        );

      if (!lista) return;

      const aplicar = () => {
        const aberto = !lista.hidden;

        titulo.setAttribute(
          'aria-expanded',
          String(aberto)
        );

        box.classList.toggle(
          'is-open',
          aberto
        );

        const seta =
          titulo.querySelector(
            '.sequencia-ranking-seta,.sequencia-acumulado-seta'
          );

        if (seta) {
          seta.classList.remove(
            'fa-chevron-up'
          );

          seta.classList.add(
            'fa-chevron-down'
          );
        }

        titulo
          .querySelectorAll(
            '.fa-chevron-up'
          )
          .forEach(i => {
            if (i !== seta) i.remove();
          });
      };

      aplicar();

      const obs =
        new MutationObserver(aplicar);

      obs.observe(lista, {
        attributes: true,
        attributeFilter: [
          'hidden',
          'class',
          'style'
        ]
      });

      obs.observe(titulo, {
        childList: true,
        subtree: true
      });
    });
  }

  function compactarEixosChart() {
    if (!window.Chart) return;

    const callback = (value) => {
      const n = Number(value);

      if (!Number.isFinite(n)) {
        return value;
      }

      if (Math.abs(n) >= 1000) {
        const k = n / 1000;

        return `${
          Number.isInteger(k)
            ? k
            : k
                .toFixed(1)
                .replace('.', ',')
        }K`;
      }

      return String(n);
    };

    try {
      Chart.defaults.scales.linear.ticks.callback =
        callback;

      Object
        .values(
          Chart.instances || {}
        )
        .forEach(chart => {
          Object
            .entries(
              chart.options?.scales || {}
            )
            .forEach(
              ([eixo, scale]) => {
                if (eixo === 'x') {
                  scale.ticks = {
                    ...(scale.ticks || {}),
                    display: false
                  };
                } else {
                  scale.ticks = {
                    ...(scale.ticks || {}),
                    callback
                  };
                }
              }
            );

          chart.update('none');
        });
    } catch (_) {}
  }

  function garantirMinimo14(
    root = document
  ) {
    root
      .querySelectorAll('body *')
      .forEach(el => {
        if (
          el.hidden ||
          getComputedStyle(el).display ===
            'none'
        ) {
          return;
        }

        const fs = parseFloat(
          getComputedStyle(el).fontSize
        );

        if (
          Number.isFinite(fs) &&
          fs < 14
        ) {
          el.classList.add(
            'tc-min-font'
          );
        }
      });
  }

  function inicializar() {
    preencherHero();
    normalizarDropdowns();

    document
      .querySelectorAll(
        '.seletor-periodo'
      )
      .forEach(select => {
        select.addEventListener(
          'change',
          () =>
            setTimeout(
              () =>
                sincronizarPeriodo(
                  select
                ),
              0
            )
        );

        sincronizarPeriodo(select);
      });

    garantirMinimo14();

    setTimeout(
      compactarEixosChart,
      80
    );

    setTimeout(
      compactarEixosChart,
      500
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      inicializar,
      { once: true }
    );
  } else {
    inicializar();
  }
})();

/* ===== FIM: toncharts-ajustes-finais-20260829 ===== */



/* ===== HEADER E FOOTER EXTERNOS ===== */

async function carregarComponente(seletor, arquivo) {
    const elemento = document.querySelector(seletor);
    if (!elemento) return;

    const resposta = await fetch(arquivo);
    if (!resposta.ok) return;

    elemento.innerHTML = await resposta.text();
}

carregarComponente("#header", "/blog/header.html");
carregarComponente("#footer", "/blog/footer.html");