/* ANALOG FEED STUDIO */

// 1. Referências aos elementos principais
const feed = document.querySelector("#feed");
const botaoNovaFileira = document.querySelector("#nova-fileira");
const contadorFileiras = document.querySelector("#contador-fileiras");
const botaoDesfazer = document.querySelector("#desfazer-remocao");
const botaoRevelar = document.querySelector("#revelar-fotografias");
const seletorFotografias = document.querySelector("#seletor-fotografias");
const bandeja = document.querySelector("#bandeja");
const bandejaVazia = document.querySelector("#bandeja-vazia");

// Controles de salvamento e gerenciamento do projeto
const botaoSalvar = document.querySelector("#salvar-projeto");
const botaoExportar = document.querySelector("#exportar-projeto");
const botaoImportar = document.querySelector("#importar-projeto");
const seletorProjeto = document.querySelector("#seletor-projeto");
const estadoSalvamento = document.querySelector("#estado-salvamento");

let ultimaRemocao = null;
let publicacaoAReceberFoto = null;
let posicaoArrastada = null;

/* 2.1. Armazenamento persistente do projeto: O IndexedDB e a salvaguarda dos dados do feed e arquivos originais das fotografias diretamente no navegador */
const NOME_BANCO = "FeedStudioDB";
const VERSAO_BANCO = 1;
const ID_PROJETO_ATUAL = "projeto-atual";

function abrirBancoDeDados() {
    return new Promise((resolve, reject) => {
        const requisicao = indexedDB.open(
            NOME_BANCO,
            VERSAO_BANCO
        );

        requisicao.onupgradeneeded = () => {
            const banco = requisicao.result;

            if (!banco.objectStoreNames.contains("projetos")) {
                banco.createObjectStore("projetos", {
                    keyPath: "id"
                });
            }
        };

        requisicao.onsuccess = () => {
            resolve(requisicao.result);
        };

        requisicao.onerror = () => {
            reject(requisicao.error);
        };
    });
}

function atualizarStatusSalvamento(mensagem, tipo = "") {
    estadoSalvamento.textContent = mensagem;
    estadoSalvamento.classList.remove("sucesso", "erro");

    if (tipo) {
        estadoSalvamento.classList.add(tipo);
    }
}

/* 2.2. Coleta o estado atual da aplicação: Salva os arquivos da bandeja e a organização de cada fileira, incluindo publicações vazias e imagens dos carrosséis */
function coletarEstadoDoProjeto() {
    const fotografias = [
        ...bandeja.querySelectorAll(".foto-bandeja")
    ].map((cartao) => ({
        id: cartao.dataset.fotoId,
        nome: cartao.querySelector("img").alt,
        arquivo: cartao.arquivoOriginal
    }));

    const fileiras = [
        ...feed.querySelectorAll(".feed-row")
    ].map((fileira) => {
        const posicoes = [
            ...fileira.querySelector(".row-slots").children
        ].map((posicao) => {
            const publicacao = posicao.publicacao;

            if (!publicacao) {
                return null;
            }

            return {
                id: publicacao.id,
                indiceCapa: publicacao.indiceCapa ?? 0,
                indiceAtual: publicacao.indiceAtual ?? 0,
                imagens: publicacao.imagens.map((foto) => ({
                    fotoId: foto.cartaoOrigem.dataset.fotoId
                }))
            };
        });

        return { posicoes };
    });

    return {
        id: ID_PROJETO_ATUAL,
        atualizadoEm: new Date().toISOString(),
        fotografias,
        fileiras
    };
}

/* 2.3. Grava o projeto no IndexedDB */
async function salvarProjetoNoBanco() {
    const projeto = coletarEstadoDoProjeto();

    const banco = await abrirBancoDeDados();

    try {
        await new Promise((resolve, reject) => {
            const transacao = banco.transaction(
                "projetos",
                "readwrite"
            );

            transacao.objectStore("projetos").put(projeto);

            transacao.oncomplete = resolve;
            transacao.onerror = () => reject(transacao.error);
            transacao.onabort = () => reject(transacao.error);
        });

        atualizarStatusSalvamento(
            `Projeto salvo às ${new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit"
            })}.`,
            "sucesso"
        );
    } catch (erro) {
        console.error("Erro ao salvar o projeto:", erro);

        atualizarStatusSalvamento(
            "Não foi possível salvar o projeto.",
            "erro"
        );

        throw erro;
    } finally {
        banco.close();
    }
}

// 2. Modelo de dados das publicações
function criarPublicacao() {
    return {
        id: crypto.randomUUID(),
        imagens: [],
        indiceCapa: 0,
        indiceAtual: 0
    };
}

function obterImagensDaPublicacao(publicacao) {
    return publicacao?.imagens ?? [];
}

function atualizarEstadoDoCartao(cartao, naComposicao) {
    if (!cartao) return;

    const estadoFoto = cartao.querySelector(".estado-foto");
    const botaoAdicionar = cartao.querySelector(".button-adicionar-foto");

    if (estadoFoto) {
        estadoFoto.textContent = naComposicao
            ? "Na composição"
            : "Disponível";
    }

    if (botaoAdicionar) {
        botaoAdicionar.disabled = naComposicao;
        botaoAdicionar.textContent = naComposicao
            ? "Já adicionada"
            : "Adicionar à composição";
    }
}

// 3. Criação das posições e atualização da grade
function criarPosicao() {
    const posicao = document.createElement("div");
    posicao.classList.add("feed-slot", "feed-slot-empty");

    const indicador = document.createElement("span");
    indicador.classList.add("empty-indicator");
    indicador.textContent = "+";

    posicao.appendChild(indicador);
    return posicao;
}

function atualizarContador() {
    const total = feed.querySelectorAll(".feed-row").length;
    contadorFileiras.textContent =
        total === 1 ? "1 fileira" : `${total} fileiras`;
}

function atualizarControles() {
    const fileiras = feed.querySelectorAll(".feed-row");

    fileiras.forEach((fileira, indice) => {
        const botaoSubir = fileira.querySelector(".move-up");
        const botaoDescer = fileira.querySelector(".move-down");

        botaoSubir.disabled = indice === 0;
        botaoDescer.disabled = indice === fileiras.length - 1;
    });
}

function atualizarEstadoDasFotos(fileira, naComposicao) {
    fileira.querySelectorAll(".feed-slot-filled").forEach((posicao) => {
        const publicacao = posicao.publicacao;
        if (!publicacao) return;

        obterImagensDaPublicacao(publicacao).forEach((foto) => {
            atualizarEstadoDoCartao(foto.cartaoOrigem, naComposicao);
        });
    });
}

// 4. Indicador do carrossel
function atualizarIndicadorCarrossel(posicao, publicacao) {
    const indicadorExistente =
        posicao.querySelector(".indicador-carrossel");

    if (indicadorExistente) indicadorExistente.remove();

    if (publicacao.imagens.length > 1) {
        const indicador = document.createElement("span");
        indicador.classList.add("indicador-carrossel");

        indicador.textContent =
            `${publicacao.indiceAtual + 1}/${publicacao.imagens.length}`;

        indicador.setAttribute(
            "aria-label",
            `Fotografia ${publicacao.indiceAtual + 1} de ${publicacao.imagens.length}`
        );

        posicao.appendChild(indicador);
    }
}

function renderizarPublicacao(posicao, publicacao) {
    posicao.publicacao = publicacao;
    posicao.classList.remove("feed-slot-empty");
    posicao.classList.add("feed-slot-filled");
    posicao.draggable = true;

    const totalFotos = publicacao.imagens.length;

    if (totalFotos === 0) {
        esvaziarPosicao(posicao);
        return;
    }

    publicacao.indiceAtual = Math.max(
        0,
        Math.min(publicacao.indiceAtual ?? 0, totalFotos - 1)
    );

    const fotoAtual = publicacao.imagens[publicacao.indiceAtual];

    const imagemCapa = document.createElement("img");
    imagemCapa.src = fotoAtual.url;
    imagemCapa.alt = fotoAtual.nome;

    const botaoRemover = document.createElement("button");
    botaoRemover.type = "button";
    botaoRemover.textContent = "×";
    botaoRemover.classList.add("remover-do-feed");
    botaoRemover.setAttribute(
        "aria-label",
        "Remover publicação da composição"
    );

    botaoRemover.addEventListener("click", () => {
        publicacao.imagens.forEach((foto) => {
            atualizarEstadoDoCartao(foto.cartaoOrigem, false);
        });

        esvaziarPosicao(posicao);
    });

    const botaoAdicionarCarrossel = document.createElement("button");
    botaoAdicionarCarrossel.type = "button";
    botaoAdicionarCarrossel.textContent = "+ Fotos";
    botaoAdicionarCarrossel.classList.add("adicionar-ao-carrossel");
    botaoAdicionarCarrossel.setAttribute(
        "aria-label",
        "Adicionar fotografias a esta publicação"
    );

    botaoAdicionarCarrossel.addEventListener("click", () => {
        publicacaoAReceberFoto = publicacao;

        document.querySelectorAll(".feed-slot").forEach((slot) => {
            slot.classList.toggle("aguardando-foto", slot === posicao);
        });

        bandeja.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    });

    const controlesCarrossel = [];

    if (totalFotos > 1) {
        const botaoAnterior = document.createElement("button");
        botaoAnterior.type = "button";
        botaoAnterior.classList.add(
            "seta-carrossel",
            "seta-carrossel-anterior"
        );
        botaoAnterior.textContent = "‹";
        botaoAnterior.setAttribute(
            "aria-label",
            "Fotografia anterior"
        );

        botaoAnterior.addEventListener("click", () => {
            publicacao.indiceAtual =
                (publicacao.indiceAtual - 1 + publicacao.imagens.length)
                % publicacao.imagens.length;

            renderizarPublicacao(posicao, publicacao);
        });

        const botaoProximo = document.createElement("button");
        botaoProximo.type = "button";
        botaoProximo.classList.add(
            "seta-carrossel",
            "seta-carrossel-proxima"
        );
        botaoProximo.textContent = "›";
        botaoProximo.setAttribute(
            "aria-label",
            "Próxima fotografia"
        );

        botaoProximo.addEventListener("click", () => {
            publicacao.indiceAtual =
                (publicacao.indiceAtual + 1) % publicacao.imagens.length;

            renderizarPublicacao(posicao, publicacao);
        });

        controlesCarrossel.push(botaoAnterior, botaoProximo);
    }

    posicao.replaceChildren(
        imagemCapa,
        ...controlesCarrossel,
        botaoRemover,
        botaoAdicionarCarrossel
    );

    atualizarIndicadorCarrossel(posicao, publicacao);
}

function esvaziarPosicao(posicao) {
    posicao.publicacao = null;
    posicao.draggable = false;
    posicao.classList.remove(
        "feed-slot-filled",
        "aguardando-foto"
    );
    posicao.classList.add("feed-slot-empty");

    const indicador = document.createElement("span");
    indicador.classList.add("empty-indicator");
    indicador.textContent = "+";

    posicao.replaceChildren(indicador);
}

// 5. Controles das fileiras
function criarControles(fileira) {
    const controles = document.createElement("div");
    controles.classList.add("row-actions");

    const botaoSubir = document.createElement("button");
    botaoSubir.type = "button";
    botaoSubir.classList.add(
        "button",
        "button-secondary",
        "move-up"
    );
    botaoSubir.textContent = "↑ Subir";
    botaoSubir.setAttribute("aria-label", "Subir fileira");

    const botaoDescer = document.createElement("button");
    botaoDescer.type = "button";
    botaoDescer.classList.add(
        "button",
        "button-secondary",
        "move-down"
    );
    botaoDescer.textContent = "↓ Descer";
    botaoDescer.setAttribute("aria-label", "Descer fileira");

    const botaoRemover = document.createElement("button");
    botaoRemover.type = "button";
    botaoRemover.classList.add("button", "button-secondary");
    botaoRemover.textContent = "Remover";
    botaoRemover.setAttribute("aria-label", "Remover fileira");

    botaoSubir.addEventListener("click", () => {
        const anterior = fileira.previousElementSibling;

        if (anterior) {
            feed.insertBefore(fileira, anterior);
            atualizarControles();
        }
    });

    botaoDescer.addEventListener("click", () => {
        const proxima = fileira.nextElementSibling;

        if (proxima) {
            feed.insertBefore(proxima, fileira);
            atualizarControles();
        }
    });

    botaoRemover.addEventListener("click", () => {
        const fileiras = [...feed.querySelectorAll(".feed-row")];
        const indice = fileiras.indexOf(fileira);

        ultimaRemocao = { fileira, indice };
        atualizarEstadoDasFotos(fileira, false);
        fileira.remove();
        botaoDesfazer.disabled = false;

        if (
            publicacaoAReceberFoto &&
            ![...feed.querySelectorAll(".feed-slot-filled")]
                .some((slot) =>
                    slot.publicacao === publicacaoAReceberFoto
                )
        ) {
            publicacaoAReceberFoto = null;

            document.querySelectorAll(".aguardando-foto")
                .forEach((slot) => {
                    slot.classList.remove("aguardando-foto");
                });
        }

        atualizarContador();
        atualizarControles();
    });

    controles.append(
        botaoSubir,
        botaoDescer,
        botaoRemover
    );

    return controles;
}

function adicionarFileira() {
    const fileira = document.createElement("div");
    fileira.classList.add("feed-row");
    fileira.appendChild(criarControles(fileira));

    const posicoes = document.createElement("div");
    posicoes.classList.add("row-slots");

    for (let i = 0; i < 3; i++) {
        posicoes.appendChild(criarPosicao());
    }

    fileira.appendChild(posicoes);
    feed.appendChild(fileira);

    atualizarContador();
    atualizarControles();
}

// 6. Desfazer a remoção de uma fileira
function desfazerRemocao() {
    if (ultimaRemocao === null) return;

    const { fileira, indice } = ultimaRemocao;
    const fileiras = feed.querySelectorAll(".feed-row");
    const proxima = fileiras[indice];

    if (proxima) {
        feed.insertBefore(fileira, proxima);
    } else {
        feed.appendChild(fileira);
    }

    atualizarEstadoDasFotos(fileira, true);

    ultimaRemocao = null;
    botaoDesfazer.disabled = true;

    atualizarContador();
    atualizarControles();
}

// 7. Eventos principais
adicionarFileira();

botaoNovaFileira.addEventListener("click", adicionarFileira);
botaoDesfazer.addEventListener("click", desfazerRemocao);

botaoRevelar.addEventListener("click", () => {
    seletorFotografias.click();
});

botaoSalvar.addEventListener("click", async () => {
    try {
        await salvarProjetoNoBanco();
    } catch (erro) {
        // O status e o console já registram o problem
    }
});

/* 8. Criação dos cartões e importação de fotografias */
function criarCartaoFotografia(fotografia, idSalvo = crypto.randomUUID()) {
    const cartao = document.createElement("div");
    cartao.classList.add("foto-bandeja");

    cartao.dataset.fotoId = idSalvo;
    cartao.arquivoOriginal = fotografia;

    const url = URL.createObjectURL(fotografia);

    const imagem = document.createElement("img");
    imagem.src = url;
    imagem.alt = fotografia.name;

    const nome = document.createElement("p");
    nome.textContent = fotografia.name;

    const estadoFoto = document.createElement("p");
    estadoFoto.textContent = "Disponível";
    estadoFoto.classList.add("estado-foto");

    const botaoAdicionarFoto = document.createElement("button");
    botaoAdicionarFoto.type = "button";
    botaoAdicionarFoto.textContent = "Adicionar à composição";
    botaoAdicionarFoto.classList.add(
        "button",
        "button-secondary",
        "button-adicionar-foto"
    );

    const botaoRemoverFoto = document.createElement("button");
    botaoRemoverFoto.type = "button";
    botaoRemoverFoto.textContent = "Remover";
    botaoRemoverFoto.classList.add(
        "button",
        "button-secondary"
    );

    botaoRemoverFoto.addEventListener("click", () => {
        const posicoes = [
            ...feed.querySelectorAll(".feed-slot-filled"),
            ...(ultimaRemocao
                ? ultimaRemocao.fileira.querySelectorAll(
                    ".feed-slot-filled"
                )
                : [])
        ];

        posicoes.forEach((posicao) => {
            const publicacao = posicao.publicacao;
            if (!publicacao) return;

            publicacao.imagens = publicacao.imagens.filter(
                (foto) => foto.cartaoOrigem !== cartao
            );

            if (publicacao.imagens.length === 0) {
                esvaziarPosicao(posicao);
            } else {
                publicacao.indiceAtual = Math.min(
                    publicacao.indiceAtual,
                    publicacao.imagens.length - 1
                );

                publicacao.indiceCapa = Math.min(
                    publicacao.indiceCapa,
                    publicacao.imagens.length - 1
                );

                renderizarPublicacao(posicao, publicacao);
            }
        });

        if (
            publicacaoAReceberFoto &&
            ![...feed.querySelectorAll(".feed-slot-filled")]
                .some((slot) =>
                    slot.publicacao === publicacaoAReceberFoto
                )
        ) {
            publicacaoAReceberFoto = null;

            document.querySelectorAll(".aguardando-foto")
                .forEach((slot) => {
                    slot.classList.remove("aguardando-foto");
                });
        }

        cartao.remove();

        if (!bandeja.querySelector(".foto-bandeja")) {
            bandejaVazia.hidden = false;
        }
    });

    botaoAdicionarFoto.addEventListener("click", () => {
        if (publicacaoAReceberFoto) {
            const posicaoAlvo = [
                ...feed.querySelectorAll(".feed-slot-filled")
            ].find(
                (slot) =>
                    slot.publicacao === publicacaoAReceberFoto
            );

            if (posicaoAlvo) {
                publicacaoAReceberFoto.imagens.push({
                    url,
                    nome: fotografia.name,
                    cartaoOrigem: cartao
                });

                atualizarEstadoDoCartao(cartao, true);

                renderizarPublicacao(
                    posicaoAlvo,
                    publicacaoAReceberFoto
                );

                publicacaoAReceberFoto = null;

                document.querySelectorAll(".aguardando-foto")
                    .forEach((slot) => {
                        slot.classList.remove("aguardando-foto");
                    });

                return;
            }

            publicacaoAReceberFoto = null;
        }

        let posicaoVazia = feed.querySelector(".feed-slot-empty");

        if (!posicaoVazia) {
            adicionarFileira();
            posicaoVazia = feed.querySelector(".feed-slot-empty");
        }

        const publicacao = criarPublicacao();

        publicacao.imagens.push({
            url,
            nome: fotografia.name,
            cartaoOrigem: cartao
        });

        renderizarPublicacao(posicaoVazia, publicacao);
        atualizarEstadoDoCartao(cartao, true);
    });

    cartao.append(
        imagem,
        nome,
        estadoFoto,
        botaoAdicionarFoto,
        botaoRemoverFoto
    );

    bandeja.appendChild(cartao);

    bandejaVazia.hidden = true;

    return cartao;
}

seletorFotografias.addEventListener("change", () => {
    const fotografias = Array.from(seletorFotografias.files);

    fotografias.forEach((fotografia) => {
        if (!fotografia.type.startsWith("image/")) return;

        criarCartaoFotografia(fotografia);
    });

    seletorFotografias.value = "";
});

/* 9. Recuperação do projeto salvo */
async function carregarProjetoSalvo() {
    const banco = await abrirBancoDeDados();

    try {
        return await new Promise((resolve, reject) => {
            const transacao = banco.transaction(
                "projetos",
                "readonly"
            );

            const requisicao = transacao
                .objectStore("projetos")
                .get(ID_PROJETO_ATUAL);

            requisicao.onsuccess = () => {
                resolve(requisicao.result ?? null);
            };

            requisicao.onerror = () => {
                reject(requisicao.error);
            };
        });
    } finally {
        banco.close();
    }
}

async function restaurarProjeto(projeto) {
    atualizarStatusSalvamento(
        "Restaurando projeto...",
        ""
    );

    // Limpa a composição e a bandeja atuais
    feed.replaceChildren();
    bandeja.querySelectorAll(".foto-bandeja").forEach((cartao) => {
        cartao.remove();
    });

    ultimaRemocao = null;
    publicacaoAReceberFoto = null;
    botaoDesfazer.disabled = true;

    // Reconstrói os cartões e cria novos endereços para as imagens
    const fotosPorId = new Map();

    projeto.fotografias.forEach((fotoSalva) => {
        const arquivo = fotoSalva.arquivo;

        const fotografia = new File(
            [arquivo],
            fotoSalva.nome,
            {
                type: arquivo.type || "application/octet-stream",
                lastModified: arquivo.lastModified || Date.now()
            }
        );

        const cartao = criarCartaoFotografia(
            fotografia,
            fotoSalva.id
        );

        fotosPorId.set(fotoSalva.id, {
            url: cartao.querySelector("img").src,
            nome: fotoSalva.nome,
            cartaoOrigem: cartao
        });
    });

    // Recria todas as fileiras, inclusive as que estavam vazias
    projeto.fileiras.forEach(() => {
        adicionarFileira();
    });

    const fileiras = [...feed.querySelectorAll(".feed-row")];

    projeto.fileiras.forEach((fileiraSalva, indiceFileira) => {
        const posicoes = [
            ...fileiras[indiceFileira].querySelector(".row-slots").children
        ];

        fileiraSalva.posicoes.forEach((posicaoSalva, indicePosicao) => {
            if (!posicaoSalva) return;

            const posicao = posicoes[indicePosicao];

            const publicacao = {
                id: posicaoSalva.id,
                indiceCapa: posicaoSalva.indiceCapa ?? 0,
                indiceAtual: posicaoSalva.indiceAtual ?? 0,
                imagens: []
            };

            publicacao.imagens = posicaoSalva.imagens
                .map((imagemSalva) => fotosPorId.get(imagemSalva.fotoId))
                .filter(Boolean);

            if (publicacao.imagens.length > 0) {
                renderizarPublicacao(posicao, publicacao);

                publicacao.imagens.forEach((foto) => {
                    atualizarEstadoDoCartao(
                        foto.cartaoOrigem,
                        true
                    );
                });
            }
        });
    });

    atualizarContador();
    atualizarControles();

    atualizarStatusSalvamento(
        `Projeto restaurado. Último salvamento: ${
            new Date(projeto.atualizadoEm).toLocaleString("pt-BR")
        }.`,
        "sucesso"
    );
}

async function inicializarProjeto() {
    try {
        const projeto = await carregarProjetoSalvo();

        if (projeto) {
            await restaurarProjeto(projeto);
        } else {
            atualizarStatusSalvamento(
                "Nenhum projeto salvo encontrado.",
                ""
            );
        }
    } catch (erro) {
        console.error("Erro ao restaurar o projeto:", erro);

        atualizarStatusSalvamento(
            "Não foi possível restaurar o projeto salvo.",
            "erro"
        );
    }
}

// Ao abrir a página, procura um projeto salvo anteriormente
inicializarProjeto();

/* 10. Exportação e importação de backups */
// Converte um arquivo de imagem em texto para incluí-lo no JSON
function arquivoParaDataURL(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(leitor.error);

        leitor.readAsDataURL(arquivo);
    });
}

// Converte os dados exportados novamente em um arquivo de imagem
function dataURLParaArquivo(dataURL, nome, tipo, ultimaModificacao) {
    const partes = dataURL.split(",");

    if (partes.length !== 2 || !partes[0].startsWith("data:")) {
        throw new Error("Formato de imagem inválido no backup.");
    }

    const correspondencia = partes[0].match(/^data:([^;]+);base64$/);

    if (!correspondencia) {
        throw new Error("Codificação de imagem não reconhecida.");
    }

    const tipoReal = correspondencia[1];
    const binario = atob(partes[1]);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
        bytes[i] = binario.charCodeAt(i);
    }

    const arquivo = new File(
        [bytes],
        nome,
        {
            type: tipo || tipoReal,
            lastModified: ultimaModificacao || Date.now()
        }
    );

    if (!arquivo.type.startsWith("image/")) {
        throw new Error("O backup contém um arquivo que não é uma imagem.");
    }

    return arquivo;
}

// Exporta a composição e as fotografias para um arquivo JSON
async function exportarProjeto() {
    atualizarStatusSalvamento("Preparando backup...", "");

    try {
        const projeto = coletarEstadoDoProjeto();

        const fotografias = await Promise.all(
            projeto.fotografias.map(async (foto) => ({
                id: foto.id,
                nome: foto.nome,
                tipo: foto.arquivo.type,
                ultimaModificacao: foto.arquivo.lastModified,
                dados: await arquivoParaDataURL(foto.arquivo)
            }))
        );

        const backup = {
            formato: "FeedStudio",
            versao: 1,
            exportadoEm: new Date().toISOString(),
            projeto: {
                id: projeto.id,
                atualizadoEm: projeto.atualizadoEm,
                fotografias,
                fileiras: projeto.fileiras
            }
        };

        const conteudo = JSON.stringify(backup, null, 2);

        const arquivoBackup = new Blob(
            [conteudo],
            { type: "application/json" }
        );

        const urlBackup = URL.createObjectURL(arquivoBackup);
        const link = document.createElement("a");

        link.href = urlBackup;
        link.download = `feed-studio-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(urlBackup), 1000);

        atualizarStatusSalvamento(
            "Backup exportado com sucesso.",
            "sucesso"
        );
    } catch (erro) {
        console.error("Erro ao exportar o projeto:", erro);

        atualizarStatusSalvamento(
            "Não foi possível exportar o projeto.",
            "erro"
        );
    }
}

botaoExportar.addEventListener("click", exportarProjeto);

function validarBackup(backup) {
    if (
        !backup ||
        backup.formato !== "FeedStudio" ||
        backup.versao !== 1 ||
        !backup.projeto
    ) {
        throw new Error("Este arquivo não é um backup válido do Feed Studio.");
    }

    const projeto = backup.projeto;

    if (
        !Array.isArray(projeto.fotografias) ||
        !Array.isArray(projeto.fileiras)
    ) {
        throw new Error("O backup não contém a estrutura esperada.");
    }

    const idsFotos = new Set();

    for (const foto of projeto.fotografias) {
        if (
            typeof foto.id !== "string" ||
            typeof foto.nome !== "string" ||
            typeof foto.dados !== "string" ||
            !foto.dados.startsWith("data:image/")
        ) {
            throw new Error("Uma fotografia do backup está inválida.");
        }

        if (idsFotos.has(foto.id)) {
            throw new Error("O backup contém identificadores duplicados.");
        }

        idsFotos.add(foto.id);
    }

    for (const fileira of projeto.fileiras) {
        if (
            !fileira ||
            !Array.isArray(fileira.posicoes) ||
            fileira.posicoes.length !== 3
        ) {
            throw new Error("Uma fileira do backup está inválida.");
        }

        for (const publicacao of fileira.posicoes) {
            if (publicacao === null) continue;

            if (
                !publicacao ||
                typeof publicacao.id !== "string" ||
                !Array.isArray(publicacao.imagens) ||
                publicacao.imagens.some(
                    (foto) =>
                        !foto ||
                        !idsFotos.has(foto.fotoId)
                )
            ) {
                throw new Error("Uma publicação do backup está inválida.");
            }
        }
    }

    return true;
}

async function importarProjeto(arquivoSelecionado) {
    atualizarStatusSalvamento("Lendo backup...", "");

    try {
        const texto = await arquivoSelecionado.text();
        const backup = JSON.parse(texto);

        validarBackup(backup);

        const confirmar = window.confirm(
            "Importar este backup substituirá o projeto atual. " +
            "Deseja continuar?"
        );

        if (!confirmar) {
            atualizarStatusSalvamento(
                "Importação cancelada.",
                ""
            );
            return;
        }

        const projetoImportado = {
            id: ID_PROJETO_ATUAL,
            atualizadoEm: backup.projeto.atualizadoEm,
            fotografias: backup.projeto.fotografias.map((foto) => ({
                id: foto.id,
                nome: foto.nome,
                arquivo: dataURLParaArquivo(
                    foto.dados,
                    foto.nome,
                    foto.tipo,
                    foto.ultimaModificacao
                )
            })),
            fileiras: backup.projeto.fileiras
        };

        // Persiste o backup importado antes de reconstruir a tela
        const banco = await abrirBancoDeDados();

        try {
            await new Promise((resolve, reject) => {
                const transacao = banco.transaction(
                    "projetos",
                    "readwrite"
                );

                transacao.objectStore("projetos").put(projetoImportado);

                transacao.oncomplete = resolve;
                transacao.onerror = () => reject(transacao.error);
                transacao.onabort = () => reject(transacao.error);
            });
        } finally {
            banco.close();
        }

        await restaurarProjeto(projetoImportado);

        atualizarStatusSalvamento(
            "Backup importado e salvo com sucesso.",
            "sucesso"
        );
    } catch (erro) {
        console.error("Erro ao importar o backup:", erro);

        atualizarStatusSalvamento(
            "Não foi possível importar o backup. Verifique se o arquivo é válido.",
            "erro"
        );
    } finally {
        seletorProjeto.value = "";
    }
}

botaoImportar.addEventListener("click", () => {
    seletorProjeto.click();
});

seletorProjeto.addEventListener("change", async () => {
    const arquivo = seletorProjeto.files[0];

    if (!arquivo) return;

    await importarProjeto(arquivo);
});

// Arrastar e reposicionar fotografias
/* 11. Arrastar e soltar publicações */
// 11.1. Arraste nativo para desktop
// Mantém o comportamento que já funciona com mouse.
feed.addEventListener("dragstart", (evento) => {
    const posicao = evento.target.closest(".feed-slot-filled");

    if (!posicao || !feed.contains(posicao)) {
        evento.preventDefault();
        return;
    }

    posicaoArrastada = posicao;

    evento.dataTransfer.effectAllowed = "move";
    evento.dataTransfer.setData("text/plain", "publicacao");

    posicao.classList.add("arrastando");
});

feed.addEventListener("dragover", (evento) => {
    const alvo = evento.target.closest(".feed-slot");

    if (!posicaoArrastada || !alvo || !feed.contains(alvo)) {
        return;
    }

    if (alvo === posicaoArrastada) return;

    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";

    feed.querySelectorAll(".alvo-arrasto").forEach((posicao) => {
        posicao.classList.remove("alvo-arrasto");
    });

    alvo.classList.add("alvo-arrasto");
});

feed.addEventListener("drop", (evento) => {
    const alvo = evento.target.closest(".feed-slot");

    if (!posicaoArrastada || !alvo || !feed.contains(alvo)) {
        return;
    }

    evento.preventDefault();

    if (alvo === posicaoArrastada) return;

    reposicionarPublicacao(posicaoArrastada, alvo);
});

feed.addEventListener("dragend", limparDestaquesArraste);

// 11.2. Função compartilhada para mover ou trocar publicações
// É utilizada tanto pelo desktop quanto pelo toque.
function reposicionarPublicacao(origem, destino) {
    if (!origem || !destino || origem === destino) return;

    const publicacaoOrigem = origem.publicacao;
    const publicacaoDestino = destino.publicacao;

    if (!publicacaoOrigem) return;

    if (!publicacaoDestino) {
        esvaziarPosicao(origem);
        renderizarPublicacao(destino, publicacaoOrigem);
    } else {
        renderizarPublicacao(origem, publicacaoDestino);
        renderizarPublicacao(destino, publicacaoOrigem);
    }

    atualizarContador();
    atualizarControles();
}

// 11.3. Arraste por toque para celulares e tablets
let arrastePorToque = null;

feed.addEventListener("pointerdown", (evento) => {
    // O mouse continua utilizando o arraste nativo.
    if (evento.pointerType === "mouse") return;

    // Começa o arraste somente ao tocar na fotografia,
    // sem interferir nos botões da publicação.
    if (evento.target.closest("button")) return;

    const posicao = evento.target.closest(".feed-slot-filled");

    if (!posicao || !feed.contains(posicao)) return;
    if (!evento.target.closest(".feed-slot-filled img")) return;

    evento.preventDefault();

    arrastePorToque = {
        origem: posicao,
        ponteiroId: evento.pointerId,
        iniciou: false
    };

    posicao.classList.add("arraste-toque-pendente");
});

document.addEventListener("pointermove", (evento) => {
    if (
        !arrastePorToque ||
        evento.pointerId !== arrastePorToque.ponteiroId
    ) {
        return;
    }

    evento.preventDefault();

    const origem = arrastePorToque.origem;

    // O movimento começa quando o dedo sai da posição inicial.
    if (!arrastePorToque.iniciou) {
        arrastePorToque.iniciou = true;
        origem.classList.remove("arraste-toque-pendente");
        origem.classList.add("arrastando");
    }

    const elementoSobOPonteiro = document.elementFromPoint(
        evento.clientX,
        evento.clientY
    );

    const alvo = elementoSobOPonteiro?.closest(".feed-slot");

    feed.querySelectorAll(".alvo-arrasto").forEach((posicao) => {
        posicao.classList.remove("alvo-arrasto");
    });

    if (alvo && feed.contains(alvo) && alvo !== origem) {
        alvo.classList.add("alvo-arrasto");
    }
}, { passive: false });

document.addEventListener("pointerup", (evento) => {
    if (
        !arrastePorToque ||
        evento.pointerId !== arrastePorToque.ponteiroId
    ) {
        return;
    }

    const origem = arrastePorToque.origem;
    const iniciou = arrastePorToque.iniciou;

    const elementoSobOPonteiro = document.elementFromPoint(
        evento.clientX,
        evento.clientY
    );

    const destino = elementoSobOPonteiro?.closest(".feed-slot");

    if (
        iniciou &&
        destino &&
        feed.contains(destino) &&
        destino !== origem
    ) {
        reposicionarPublicacao(origem, destino);
    }

    arrastePorToque = null;
    limparDestaquesArraste();
});

document.addEventListener("pointercancel", () => {
    arrastePorToque = null;
    limparDestaquesArraste();
});

function limparDestaquesArraste() {
    feed.querySelectorAll(
        ".arrastando, .alvo-arrasto, .arraste-toque-pendente"
    ).forEach((posicao) => {
        posicao.classList.remove(
            "arrastando",
            "alvo-arrasto",
            "arraste-toque-pendente"
        );
    });

    posicaoArrastada = null;
}

/* 12. Alternância entre tema claro e tema escuro */
const botaoTema = document.querySelector("#alternar-tema");
const chaveTema = "analog-feed-studio-tema";

function aplicarTema(tema) {
    const temaEscuro = tema === "dark";

    document.documentElement.dataset.theme = temaEscuro
        ? "dark"
        : "light";

    botaoTema.textContent = temaEscuro
        ? "☀ Ativar tema claro"
        : "☾ Ativar tema escuro";

    botaoTema.setAttribute("aria-pressed", String(temaEscuro));
}

const temaSalvo = localStorage.getItem(chaveTema);

aplicarTema(temaSalvo === "dark" ? "dark" : "light");

botaoTema.addEventListener("click", () => {
    const temaAtual = document.documentElement.dataset.theme;
    const novoTema = temaAtual === "dark" ? "light" : "dark";

    aplicarTema(novoTema);
    localStorage.setItem(chaveTema, novoTema);
});