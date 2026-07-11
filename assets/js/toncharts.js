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
    .replace(/#/g, "")
    .replace(/x$/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!valorLimpo) return null;

  const numero = Number(valorLimpo);

  return Number.isFinite(numero) ? numero : null;
}

function obterValorOrdenacaoMusica(linha, coluna) {
  const seletores = {
    scrobbles: ".musica-scrobbles",
    pontuacao: ".musica-pontuacao",
    pico: ".pico-posicao",
    semanas: ".musica-semanas",
    dias: ".musica-dias"
  };

  const seletor = seletores[coluna];
  const elemento = linha.querySelector(seletor);

  return converterValorMusica(elemento?.textContent || "");
}

function obterPosicaoOriginalMusica(linha) {
  const elementoPosicao = linha.querySelector(".musica-posicao");

  return converterValorMusica(elementoPosicao?.textContent || "") || 0;
}

function ordenarListaMusicas(botao) {
  const listaMusicas = botao.closest(".lista-musicas");
  const linhasContainer = listaMusicas?.querySelector(".linhas-musicas");

  if (!listaMusicas || !linhasContainer) return;

  const coluna = botao.dataset.ordenar;
  const direcaoAtual = botao.dataset.direcao;
  const novaDirecao = direcaoAtual === "desc" ? "asc" : "desc";

  listaMusicas
    .querySelectorAll(".cabecalho-musica-ordenavel")
    .forEach((outroBotao) => {
      outroBotao.dataset.direcao = "";
    });

  botao.dataset.direcao = novaDirecao;

  const linhas = Array.from(
    linhasContainer.querySelectorAll(".linha-musica")
  );

  /*
   * Antes de ordenar, exibe todas as músicas.
   */
  linhas.forEach((linha) => {
    linha.hidden = false;
  });

  linhas.sort((linhaA, linhaB) => {
    const valorA = obterValorOrdenacaoMusica(linhaA, coluna);
    const valorB = obterValorOrdenacaoMusica(linhaB, coluna);

    /*
     * Valores vazios permanecem sempre no final.
     */
    if (valorA === null && valorB === null) {
      return (
        obterPosicaoOriginalMusica(linhaA) -
        obterPosicaoOriginalMusica(linhaB)
      );
    }

    if (valorA === null) return 1;
    if (valorB === null) return -1;

    const diferenca =
      novaDirecao === "desc"
        ? valorB - valorA
        : valorA - valorB;

    /*
     * Em caso de empate, mantém a ordem da posição original.
     */
    if (diferenca === 0) {
      return (
        obterPosicaoOriginalMusica(linhaA) -
        obterPosicaoOriginalMusica(linhaB)
      );
    }

    return diferenca;
  });

  linhas.forEach((linha) => {
    linhasContainer.appendChild(linha);
  });

  atualizarBotoesMusicas();
}

function configurarOrdenacaoMusicas() {
  selecionarTodos(".cabecalho-musica-ordenavel").forEach((botao) => {
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

function iniciarPagina() {
  configurarTema();
  configurarPeriodos();
  configurarMusicas();
  configurarOrdenacaoMusicas();
  configurarTooltipSemanas();
  atualizarLabelsPeriodoResponsivo();

  const periodoInicial = selecionar(".seletor-periodo")?.value || "12m";

  aplicarPeriodo(periodoInicial);
  carregarSpotify();
}

iniciarPagina();

window.addEventListener("resize", atualizarLabelsPeriodoResponsivo);