(() => {
  "use strict";

  const raiz = document.getElementById("graficoEvolucao");

  if (!raiz) {
    return;
  }

if (typeof Chart === "undefined") {
  console.error("Chart.js não foi carregado.");
  return;
}

/* Usa no gráfico a mesma fonte aplicada à página */
const fontePagina = getComputedStyle(raiz).fontFamily;

Chart.defaults.font.family = fontePagina;
Chart.defaults.font.size = 12;
Chart.defaults.font.weight = "400";

const canvas = raiz.querySelector(".grafico-evolucao__canvas");
  const plot = raiz.querySelector(".grafico-evolucao__plot");
  const elementoDados = raiz.querySelector(".grafico-evolucao__dados");
  const tooltipPeriodo = raiz.querySelector(".grafico-tooltip--periodo");
  const tooltipAno = raiz.querySelector(".grafico-tooltip--ano");
  const botoes = [...raiz.querySelectorAll("[data-periodo]")];

  const CHAVE_PERIODO = "toncharts-periodo-grafico-evolucao";
  const PERIODOS = ["semana", "mes", "ano"];

  const CORES = {
    scrobbles: "#08d4f2",
    pontos: "#08dfb0",
    grade: "rgba(180, 195, 210, 0.16)",
    divisao: "rgba(180, 195, 210, 0.30)",
    texto: "#9ea9b5"
  };

  const MESES = [
    "jan", "fev", "mar", "abr",
    "mai", "jun", "jul", "ago",
    "set", "out", "nov", "dez"
  ];

  const formatadorNumero = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0
  });

  const formatadorPercentual = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  let dadosOriginais;

  try {
    dadosOriginais = JSON.parse(elementoDados?.textContent || "[]");
  } catch (erro) {
    console.error("Erro no JSON do gráfico:", erro);
    return;
  }

  if (!Array.isArray(dadosOriginais) || !dadosOriginais.length) {
    console.warn("O gráfico não possui dados.");
    return;
  }

  const dadosSemanais = normalizarDados(dadosOriginais);
  const resumosAnuais = criarResumosAnuais(dadosSemanais);

  let periodoAtual = obterPeriodoInicial();
  let serieAtual = criarSerie(periodoAtual);

  const pluginDivisoesAnuais = {
    id: "divisoesAnuais",

    beforeDatasetsDraw(chart) {
      chart.$divisoesAnuais = [];

      if (periodoAtual === "ano") {
        return;
      }

      const pontos = chart.getDatasetMeta(0).data;
      const { ctx, chartArea } = chart;

      for (let i = 1; i < serieAtual.length; i++) {
        const atual = serieAtual[i];
        const anterior = serieAtual[i - 1];

        if (atual.ano === anterior.ano) {
          continue;
        }

        const x = (pontos[i - 1].x + pontos[i].x) / 2;
        const resumo = resumosAnuais.get(anterior.ano);

        chart.$divisoesAnuais.push({
          x,
          ano: anterior.ano,
          resumo
        });

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = CORES.divisao;
        ctx.lineWidth = 1;
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      }
    },

    afterDatasetsDraw(chart) {
      const divisao = chart.$divisaoAnoAtiva;

      if (!divisao) {
        return;
      }

      const { ctx, chartArea } = chart;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = "rgba(225, 235, 245, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.moveTo(divisao.x, chartArea.top);
      ctx.lineTo(divisao.x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    }
  };

  const pluginLinhaHover = {
    id: "linhaHover",

    afterDatasetsDraw(chart) {
      if (chart.$divisaoAnoAtiva) {
        return;
      }

      const ativos = chart.getActiveElements();

      if (!ativos.length) {
        return;
      }

      const x = ativos[0].element.x;
      const { ctx, chartArea } = chart;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(205, 220, 235, 0.40)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    }
  };

  const grafico = new Chart(canvas, {
    type: "line",

    data: {
      labels: serieAtual.map(item => item.rotulo),

      datasets: [
        {
          label: "Scrobbles",
          data: serieAtual.map(item => item.scrobbles),
          yAxisID: "yScrobbles",

          borderColor: CORES.scrobbles,
          backgroundColor: CORES.scrobbles,

          borderWidth: 3,
          tension: 0.38,
          cubicInterpolationMode: "monotone",

          fill: false,

          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#08111b",
          pointHoverBackgroundColor: CORES.scrobbles
        },

        {
          label: "Pontos",
          data: serieAtual.map(item => item.pontos),
          yAxisID: "yPontos",

          borderColor: CORES.pontos,
          backgroundColor: CORES.pontos,

          borderWidth: 3,
          tension: 0.38,
          cubicInterpolationMode: "monotone",

          fill: false,

          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#08111b",
          pointHoverBackgroundColor: CORES.pontos
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      normalized: true,

      animation: {
        duration: 300
      },

      interaction: {
        mode: "index",
        intersect: false,
        axis: "x"
      },

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          enabled: false,
          external: exibirTooltipPeriodo
        }
      },

      scales: {
        x: {
          offset: false,

          border: {
            display: false
          },

          grid: {
            display: false
          },

          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 12,
            color: CORES.texto,

            font: {
              size: 11
            },

            callback(valor, indice) {
              return obterRotuloEixo(indice);
            }
          }
        },

        yScrobbles: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          grace: "5%",

          border: {
            display: true,
            color: CORES.scrobbles,
            width: 1
          },

          grid: {
            display: true,
            drawTicks: false,
            color: CORES.grade,
            lineWidth: 1,
            borderDash: [4, 5]
          },

          ticks: {
            color: CORES.scrobbles,
            padding: 10,

            callback(valor) {
              return formatarNumero(valor);
            }
          }
        },

        yPontos: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          grace: "5%",

          border: {
            display: true,
            color: CORES.pontos,
            width: 1
          },

          grid: {
            drawOnChartArea: false,
            drawTicks: false
          },

          ticks: {
            color: CORES.pontos,
            padding: 10,

            callback(valor) {
              return formatarNumero(valor);
            }
          }
        }
      }
    },

    plugins: [
      pluginDivisoesAnuais,
      pluginLinhaHover
    ]
  });

  atualizarBotoes();

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      alterarPeriodo(botao.dataset.periodo);
    });
  });

  canvas.addEventListener("mousemove", evento => {
    verificarDivisaoAnual(evento.clientX, evento.clientY);
  });

  canvas.addEventListener("mouseleave", limparInteracoes);

  let toqueInicial = null;
  let gestoHorizontal = false;

  canvas.addEventListener(
    "touchstart",
    evento => {
      const toque = evento.touches[0];

      if (!toque) {
        return;
      }

      toqueInicial = {
        x: toque.clientX,
        y: toque.clientY
      };

      gestoHorizontal = false;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    evento => {
      const toque = evento.touches[0];

      if (!toque || !toqueInicial) {
        return;
      }

      const diferencaX = toque.clientX - toqueInicial.x;
      const diferencaY = toque.clientY - toqueInicial.y;

      if (!gestoHorizontal) {
        gestoHorizontal =
          Math.abs(diferencaX) > Math.abs(diferencaY);
      }

      if (!gestoHorizontal) {
        return;
      }

      evento.preventDefault();

      if (!verificarDivisaoAnual(toque.clientX, toque.clientY)) {
        ativarPontoMaisProximo(toque.clientX, toque.clientY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    () => {
      toqueInicial = null;
      gestoHorizontal = false;
    },
    { passive: true }
  );

  function normalizarDados(dados) {
    return dados
      .map(item => {
        const dataObjeto = converterData(item.data);

        return {
          data: item.data,
          dataObjeto,
          ano: dataObjeto.getFullYear(),
          mes: dataObjeto.getMonth(),
          scrobbles: Number(item.scrobbles) || 0,
          pontos: Number(item.pontos) || 0
        };
      })
      .filter(item => !Number.isNaN(item.dataObjeto.getTime()))
      .sort((a, b) => a.dataObjeto - b.dataObjeto);
  }

  function criarSerie(periodo) {
    let registros;

    if (periodo === "semana") {
      registros = dadosSemanais.map(item => ({
        ...item,
        dataExibicao: item.dataObjeto
      }));
    } else {
      const grupos = new Map();

      dadosSemanais.forEach(item => {
        const chave =
          periodo === "mes"
            ? `${item.ano}-${String(item.mes + 1).padStart(2, "0")}`
            : String(item.ano);

        grupos.set(chave, item);
      });

      registros = [...grupos.values()].map(item => {
        const dataExibicao =
          periodo === "mes"
            ? new Date(item.ano, item.mes + 1, 0)
            : new Date(item.ano, 11, 31);

        return {
          ...item,
          dataExibicao,
          ano: dataExibicao.getFullYear(),
          mes: dataExibicao.getMonth()
        };
      });
    }

    let anterior = null;
    let ganhoAnteriorScrobbles = null;
    let ganhoAnteriorPontos = null;

    return registros.map(item => {
      const ganhoScrobbles =
        item.scrobbles - (anterior?.scrobbles ?? 0);

      const ganhoPontos =
        item.pontos - (anterior?.pontos ?? 0);

      const resultado = {
        ...item,

        rotulo: formatarPeriodo(item.dataExibicao, periodo),

        ganhoScrobbles,
        ganhoPontos,

        variacaoScrobbles: calcularVariacao(
          ganhoScrobbles,
          ganhoAnteriorScrobbles
        ),

        variacaoPontos: calcularVariacao(
          ganhoPontos,
          ganhoAnteriorPontos
        )
      };

      anterior = resultado;
      ganhoAnteriorScrobbles = ganhoScrobbles;
      ganhoAnteriorPontos = ganhoPontos;

      return resultado;
    });
  }

  function criarResumosAnuais(dados) {
    const ultimoPorAno = new Map();

    dados.forEach(item => {
      ultimoPorAno.set(item.ano, item);
    });

    const anos = [...ultimoPorAno.keys()].sort((a, b) => a - b);
    const primeiroRegistro = dados[0];

    let acumuladoAnteriorScrobbles = 0;
    let acumuladoAnteriorPontos = 0;

    let totalAnteriorScrobbles = null;
    let totalAnteriorPontos = null;

    const resumos = new Map();

    anos.forEach(ano => {
      const ultimo = ultimoPorAno.get(ano);

      const totalScrobbles =
        ultimo.scrobbles - acumuladoAnteriorScrobbles;

      const totalPontos =
        ultimo.pontos - acumuladoAnteriorPontos;

      const parcial =
        ano === primeiroRegistro.ano &&
        (
          primeiroRegistro.mes !== 0 ||
          primeiroRegistro.dataObjeto.getDate() !== 1
        );

      resumos.set(ano, {
        ano,
        parcial,

        totalScrobbles,
        totalPontos,

        acumuladoScrobbles: ultimo.scrobbles,
        acumuladoPontos: ultimo.pontos,

        variacaoScrobbles: calcularVariacao(
          totalScrobbles,
          totalAnteriorScrobbles
        ),

        variacaoPontos: calcularVariacao(
          totalPontos,
          totalAnteriorPontos
        )
      });

      acumuladoAnteriorScrobbles = ultimo.scrobbles;
      acumuladoAnteriorPontos = ultimo.pontos;

      totalAnteriorScrobbles = totalScrobbles;
      totalAnteriorPontos = totalPontos;
    });

    return resumos;
  }

  function alterarPeriodo(periodo) {
    if (!PERIODOS.includes(periodo)) {
      return;
    }

    periodoAtual = periodo;
    serieAtual = criarSerie(periodoAtual);

    localStorage.setItem(CHAVE_PERIODO, periodoAtual);

    esconderTooltips();

    grafico.$divisaoAnoAtiva = null;

    grafico.data.labels = serieAtual.map(item => item.rotulo);
    grafico.data.datasets[0].data =
      serieAtual.map(item => item.scrobbles);

    grafico.data.datasets[1].data =
      serieAtual.map(item => item.pontos);

    grafico.setActiveElements([]);

    grafico.tooltip.setActiveElements([], {
      x: 0,
      y: 0
    });

    atualizarBotoes();
    grafico.update();
  }

  function atualizarBotoes() {
    botoes.forEach(botao => {
      botao.setAttribute(
        "aria-pressed",
        String(botao.dataset.periodo === periodoAtual)
      );
    });
  }

  function obterPeriodoInicial() {
    const salvo = localStorage.getItem(CHAVE_PERIODO);

    return PERIODOS.includes(salvo)
      ? salvo
      : "mes";
  }

  function exibirTooltipPeriodo(contexto) {
    const { chart, tooltip } = contexto;

    if (
      chart.$divisaoAnoAtiva ||
      tooltip.opacity === 0 ||
      !tooltip.dataPoints?.length
    ) {
      esconderTooltip(tooltipPeriodo);
      return;
    }

    const indice = tooltip.dataPoints[0].dataIndex;
    const item = serieAtual[indice];

    if (!item) {
      return;
    }

    tooltipPeriodo.innerHTML =
      periodoAtual === "semana"
        ? criarTooltipSemana(item)
        : criarTooltipPeriodoCompleto(item);

    tooltipPeriodo.classList.add("is-visible");

    posicionarTooltip(
      tooltipPeriodo,
      tooltip.caretX,
      tooltip.caretY
    );
  }

function criarTooltipSemana(item) {
  return `
    <div class="grafico-tooltip__titulo">
      ${item.rotulo}
    </div>

    <div class="grafico-tooltip__bloco">

      <div class="grafico-tooltip__subtitulo">
        Acumulado até aqui
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--scrobbles
        ">
          ${formatarNumero(item.scrobbles)}
        </strong>

        <span class="grafico-tooltip__unidade">
          scrobbles
        </span>
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--pontos
        ">
          ${formatarNumero(item.pontos)}
        </strong>

        <span class="grafico-tooltip__unidade">
          pontos
        </span>
      </div>

    </div>
  `;
}
function criarTooltipPeriodoCompleto(item) {
  const nomePeriodo =
    periodoAtual === "mes"
      ? "No mês"
      : "No ano";

  return `
    <div class="grafico-tooltip__titulo">
      ${item.rotulo}
    </div>

    <div class="grafico-tooltip__bloco">

      <div class="grafico-tooltip__subtitulo">
        ${nomePeriodo}
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--scrobbles
        ">
          ${formatarNumero(item.ganhoScrobbles)}
        </strong>

        <span class="grafico-tooltip__unidade">
          scrobbles
        </span>

        ${criarVariacao(item.variacaoScrobbles)}
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--pontos
        ">
          ${formatarNumero(item.ganhoPontos)}
        </strong>

        <span class="grafico-tooltip__unidade">
          pontos
        </span>

        ${criarVariacao(item.variacaoPontos)}
      </div>

    </div>

    <div class="grafico-tooltip__bloco">

      <div class="grafico-tooltip__subtitulo">
        Acumulado até aqui
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--scrobbles
        ">
          ${formatarNumero(item.scrobbles)}
        </strong>

        <span class="grafico-tooltip__unidade">
          scrobbles
        </span>
      </div>

      <div class="grafico-tooltip__metrica">
        <strong class="
          grafico-tooltip__valor
          grafico-tooltip__valor--pontos
        ">
          ${formatarNumero(item.pontos)}
        </strong>

        <span class="grafico-tooltip__unidade">
          pontos
        </span>
      </div>

    </div>
  `;
}
  function verificarDivisaoAnual(clientX, clientY) {
    if (periodoAtual === "ano") {
      limparDivisaoAno();
      return false;
    }

    const posicao = obterPosicaoCanvas(clientX, clientY);
    const area = grafico.chartArea;

    if (
      !area ||
      posicao.y < area.top ||
      posicao.y > area.bottom
    ) {
      limparDivisaoAno();
      return false;
    }

    const divisao = grafico.$divisoesAnuais?.find(
      item => Math.abs(item.x - posicao.x) <= 7
    );

    if (!divisao) {
      limparDivisaoAno();
      return false;
    }

    grafico.$divisaoAnoAtiva = divisao;

    grafico.setActiveElements([]);

    grafico.tooltip.setActiveElements([], {
      x: posicao.x,
      y: posicao.y
    });

    esconderTooltip(tooltipPeriodo);

    tooltipAno.innerHTML =
      criarTooltipAno(divisao.resumo);

    tooltipAno.classList.add("is-visible");

    posicionarTooltip(
      tooltipAno,
      divisao.x,
      posicao.y
    );

    grafico.draw();

    return true;
  }

  function criarTooltipAno(resumo) {
    if (!resumo) {
      return "";
    }

    const tituloPeriodo = resumo.parcial
      ? "No período disponível"
      : "No ano";

    return `
      <div class="grafico-tooltip__titulo">
        Ano ${resumo.ano}
      </div>

      <div class="grafico-tooltip__bloco">

        <div class="grafico-tooltip__subtitulo">
          ${tituloPeriodo}
        </div>

        <div class="grafico-tooltip__metrica">
          <strong class="
            grafico-tooltip__valor
            grafico-tooltip__valor--scrobbles
          ">
            ${formatarNumero(resumo.totalScrobbles)}
          </strong>

          <span class="grafico-tooltip__unidade">
            scrobbles
          </span>

          ${criarVariacao(resumo.variacaoScrobbles)}
        </div>

        <div class="grafico-tooltip__metrica">
          <strong class="
            grafico-tooltip__valor
            grafico-tooltip__valor--pontos
          ">
            ${formatarNumero(resumo.totalPontos)}
          </strong>

          <span class="grafico-tooltip__unidade">
            pontos
          </span>

          ${criarVariacao(resumo.variacaoPontos)}
        </div>

      </div>

      <div class="grafico-tooltip__bloco">

        <div class="grafico-tooltip__subtitulo">
          Acumulado até aqui
        </div>

        <div class="grafico-tooltip__metrica">
          <strong class="
            grafico-tooltip__valor
            grafico-tooltip__valor--scrobbles
          ">
            ${formatarNumero(resumo.acumuladoScrobbles)}
          </strong>

          <span class="grafico-tooltip__unidade">
            scrobbles
          </span>
        </div>

        <div class="grafico-tooltip__metrica">
          <strong class="
            grafico-tooltip__valor
            grafico-tooltip__valor--pontos
          ">
            ${formatarNumero(resumo.acumuladoPontos)}
          </strong>

          <span class="grafico-tooltip__unidade">
            pontos
          </span>
        </div>

      </div>
    `;
  }

function criarVariacao(valor) {
  if (valor === null || !Number.isFinite(valor)) {
    return "";
  }

  let classe = "grafico-tooltip__variacao--neutra";
  let icone = "fa-minus";

  if (valor > 0) {
    classe = "grafico-tooltip__variacao--alta";
    icone = "fa-arrow-up";
  }

  if (valor < 0) {
    classe = "grafico-tooltip__variacao--queda";
    icone = "fa-arrow-down";
  }

  return `
    <span class="grafico-tooltip__variacao ${classe}">
      <i class="fa-solid ${icone}"></i>
      ${formatadorPercentual.format(Math.abs(valor))}%
    </span>
  `;
}

  function ativarPontoMaisProximo(clientX, clientY) {
    const posicao = obterPosicaoCanvas(clientX, clientY);
    const area = grafico.chartArea;

    if (!area || !serieAtual.length) {
      return;
    }

    esconderTooltip(tooltipAno);
    grafico.$divisaoAnoAtiva = null;

    const proporcao = limitar(
      (posicao.x - area.left) /
      (area.right - area.left),
      0,
      1
    );

    const indice = Math.round(
      proporcao * (serieAtual.length - 1)
    );

    const elementos = [
      {
        datasetIndex: 0,
        index: indice
      },
      {
        datasetIndex: 1,
        index: indice
      }
    ];

    const pontoX =
      grafico.getDatasetMeta(0).data[indice]?.x ??
      posicao.x;

    grafico.setActiveElements(elementos);

    grafico.tooltip.setActiveElements(elementos, {
      x: pontoX,
      y: posicao.y
    });

    grafico.update("none");
  }

  function obterRotuloEixo(indice) {
    const total = serieAtual.length;

    if (!total) {
      return "";
    }

    if (indice === 0 || indice === total - 1) {
      return serieAtual[indice].rotulo;
    }

    const celular = window.innerWidth <= 720;

    let limite;

    if (celular) {
      limite =
        periodoAtual === "semana"
          ? 4
          : periodoAtual === "mes"
            ? 5
            : 6;
    } else {
      limite =
        periodoAtual === "semana"
          ? 10
          : periodoAtual === "mes"
            ? 13
            : 12;
    }

    if (total <= limite) {
      return serieAtual[indice].rotulo;
    }

    const intervalo = Math.ceil(
      (total - 1) / (limite - 1)
    );

    return indice % intervalo === 0
      ? serieAtual[indice].rotulo
      : "";
  }

  function formatarPeriodo(data, periodo) {
    if (periodo === "semana") {
      return `${data.getDate()} ${MESES[data.getMonth()]} ${data.getFullYear()}`;
    }

    if (periodo === "mes") {
      const mes = MESES[data.getMonth()];

      return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${data.getFullYear()}`;
    }

    return String(data.getFullYear());
  }

  function calcularVariacao(atual, anterior) {
    if (
      anterior === null ||
      anterior === undefined ||
      anterior === 0
    ) {
      return null;
    }

    return ((atual - anterior) / Math.abs(anterior)) * 100;
  }

  function converterData(dataISO) {
    const [ano, mes, dia] =
      String(dataISO).split("-").map(Number);

    return new Date(ano, mes - 1, dia);
  }

  function formatarNumero(valor) {
    return formatadorNumero.format(Number(valor) || 0);
  }

  function obterPosicaoCanvas(clientX, clientY) {
    const retangulo = canvas.getBoundingClientRect();

    return {
      x:
        (clientX - retangulo.left) *
        (grafico.width / retangulo.width),

      y:
        (clientY - retangulo.top) *
        (grafico.height / retangulo.height)
    };
  }

  function posicionarTooltip(elemento, xCanvas, yCanvas) {
    const retanguloCanvas = canvas.getBoundingClientRect();
    const retanguloPlot = plot.getBoundingClientRect();

    const escalaX = retanguloCanvas.width / grafico.width;
    const escalaY = retanguloCanvas.height / grafico.height;

    let esquerda =
      retanguloCanvas.left -
      retanguloPlot.left +
      xCanvas * escalaX +
      14;

    let topo =
      retanguloCanvas.top -
      retanguloPlot.top +
      yCanvas * escalaY +
      14;

    const largura = elemento.offsetWidth;
    const altura = elemento.offsetHeight;

    const limiteDireito =
      plot.clientWidth - largura - 8;

    const limiteInferior =
      plot.clientHeight - altura - 8;

    if (esquerda > limiteDireito) {
      esquerda =
        retanguloCanvas.left -
        retanguloPlot.left +
        xCanvas * escalaX -
        largura -
        14;
    }

    elemento.style.left =
      `${limitar(esquerda, 8, Math.max(8, limiteDireito))}px`;

    elemento.style.top =
      `${limitar(topo, 8, Math.max(8, limiteInferior))}px`;
  }

  function limparDivisaoAno() {
    if (!grafico.$divisaoAnoAtiva) {
      return;
    }

    grafico.$divisaoAnoAtiva = null;
    esconderTooltip(tooltipAno);
    grafico.draw();
  }

  function limparInteracoes() {
    grafico.$divisaoAnoAtiva = null;

    grafico.setActiveElements([]);

    grafico.tooltip.setActiveElements([], {
      x: 0,
      y: 0
    });

    esconderTooltips();
    grafico.draw();
  }

  function esconderTooltips() {
    esconderTooltip(tooltipPeriodo);
    esconderTooltip(tooltipAno);
  }

  function esconderTooltip(elemento) {
    elemento.classList.remove("is-visible");
  }

  function limitar(valor, minimo, maximo) {
    return Math.min(
      Math.max(valor, minimo),
      maximo
    );
  }

  window.addEventListener("resize", () => {
    esconderTooltips();
    grafico.resize();
    grafico.update("none");
  });
})();