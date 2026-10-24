# Analog Feed Studio 🎞️
 
### Sua mesa de composição fotográfica 📷
Um espaço para experimentar, compor e descobrir 💭

O **Analog Feed Studio** é uma aplicação web desenvolvida para organizar fotografias, experimentar combinações visuais e planejar a composição de um feed fotográfico. Inspirado na fotografia analógica e na liberdade do processo criativo, o projeto transforma a organização de imagens em uma experiência de experimentação visual.

A proposta da aplicação é criar um espaço para testar possibilidades, reorganizar imagens, descobrir relações entre cores e formas e encontrar composições inesperadas — antes de decidir qual será o resultado final.

## Sobre o projeto
A fotografia nem sempre começa com uma composição definida. Pra mim, enquanto fotógrafa, muitas vezes ela nasce de um encontro, de um detalhe percebido por acaso ou de uma combinação que só se revela quando diferentes imagens são colocadas lado a lado.

O Analog Feed Studio surgiu da vontade de criar uma ferramenta que respeitasse esse processo: um ambiente em que organizar fotografias não significasse apenas distribuir imagens em uma grade, mas também experimentar, observar, reorganizar e descobrir.

A referência à fotografia analógica está presente tanto na identidade visual quanto na concepção do projeto. O nome, o ícone inspirado em um fotograma de filme e a paleta de cores remetem a um universo material, tátil e contemplativo, em que cada imagem carrega sua própria presença e a composição se constrói ao longo do tempo.

A ideia de uma *mesa de composição* orienta a experiência: as fotografias estão disponíveis para serem movimentadas, combinadas e revisitadas. Não existe uma única disposição correta, nem a necessidade de chegar imediatamente a um resultado definitivo. A ferramenta foi pensada para acompanhar o processo de descoberta.

**O Analog Feed Studio é, acima de tudo, um espaço para experimentar.**

## Identidade visual
A identidade visual procura traduzir a atmosfera do projeto em uma interface simples, acolhedora e funcional.

- **Fotografia analógica:** o ícone inspirado em um fotograma de filme evoca a materialidade da fotografia e estabelece a referência visual central da aplicação.
- **Verde-sálvia e oliva:** tons associados à natureza, à serenidade e à observação, utilizados para construir uma interface visualmente tranquila.
- **Papel e carvão:** tons neutros que ajudam a destacar as fotografias sem competir com suas cores e formas.
- **Tema claro e escuro:** duas experiências visuais que permitem adaptar a interface à preferência de quem utiliza a ferramenta.

A intenção é que a interface funcione como um espaço de trabalho discreto: presente o suficiente para orientar a experiência, mas sem tirar das fotografias o protagonismo.

## Funcionalidades

### Mesa de composição
A mesa de composição apresenta as publicações em uma grade de três colunas, com prévias em proporção 3:4. As imagens são exibidas com recorte visual para simular a apresentação no feed, sem alterar os arquivos fotográficos originais.

- Organização das publicações em linhas.
- Adição e remoção de linhas.
- Reordenação das linhas por controles de movimentação.
- Movimentação de publicações entre posições por arrastar e soltar.
- Troca de posição entre publicações quando o destino já está ocupado.
- Restauração de publicações removidas.

### Bandeja de revelação
A bandeja de revelação reúne as fotografias importadas e disponíveis para compor o feed.

Cada fotografia é apresentada com sua prévia, nome de arquivo e controles para adicioná-la à composição ou removê-la da bandeja.

Essa separação entre a coleção de imagens e a mesa de composição permite experimentar diferentes arranjos sem precisar importar novamente os arquivos a cada mudança.

### Publicações com carrosséis

Uma publicação pode conter uma única fotografia ou um conjunto de imagens organizado como carrossel.

- Adição de fotografias a uma publicação existente.
- Navegação entre as imagens por setas.
- Indicador da posição atual no carrossel.
- Escolha da primeira imagem como capa padrão.
- Remoção individual de fotografias.
- Atualização da composição quando uma fotografia é removida da bandeja.

### Salvamento e restauração
O projeto utiliza o **IndexedDB** do navegador para armazenar os dados da composição e os arquivos de imagem associados.

Isso permite salvar o projeto e restaurá-lo posteriormente, preservando a organização das publicações, a bandeja de fotografias e a ordem das imagens nos carrosséis.

O salvamento é iniciado manualmente, dando à pessoa usuária controle sobre quando registrar o estado atual do trabalho.

### Backup e restauração portátil
Além do salvamento local, a aplicação permite exportar o projeto para um arquivo JSON e importar um backup anteriormente exportado.

As imagens são incorporadas ao backup em formato de dados, permitindo transportar a composição junto com os arquivos fotográficos, em vez de depender apenas de referências a imagens externas.

A importação substitui o projeto atualmente carregado e solicita confirmação antes de prosseguir.

### Tema claro e escuro
A interface oferece dois temas visuais, alternáveis por um controle no cabeçalho.

A preferência selecionada é armazenada no `localStorage`, permitindo que o tema seja recuperado em visitas posteriores no mesmo navegador.

## Tecnologias utilizadas
O projeto foi desenvolvido com tecnologias fundamentais do desenvolvimento web, sem dependência de frameworks de interface.

| Tecnologia | Aplicação no projeto |
|---|---|
| **HTML5** | Estrutura semântica da aplicação e organização do conteúdo. |
| **CSS3** | Identidade visual, layout responsivo, grade de publicações, componentes e temas. |
| **JavaScript** | Interações, manipulação das publicações, carrosséis, arrastar e soltar, salvamento e restauração. |
| **IndexedDB** | Persistência local do projeto e dos arquivos de imagem. |
| **localStorage** | Armazenamento da preferência de tema. |
| **JSON** | Formato utilizado para exportação e importação de backups. |
| **Git e GitHub** | Controle de versão e organização do histórico de desenvolvimento. |
| **Vercel** | Plataforma planejada para publicação da aplicação. |

## Como executar localmente
O Analog Feed Studio é uma aplicação web estática. Não é necessário instalar um framework ou configurar um servidor de backend para executar a versão atual.

### Pré-requisitos
- Um navegador moderno com suporte a JavaScript, IndexedDB e localStorage.
- Git, caso queira clonar o repositório.
- Um editor de código, como o Visual Studio Code.
- Uma extensão de servidor local, como o Live Server, para facilitar o desenvolvimento.

### Executando com Git
Clone o repositório:

```bash
git clone <URL-DO-REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd feed-studio
```

Abra a pasta no Visual Studio Code e inicie o `index.html` com o Live Server.

Também é possível abrir o `index.html` diretamente no navegador para uma inspeção inicial, embora o uso de um servidor local seja recomendado para o funcionamento consistente das APIs de armazenamento do navegador.

## Estrutura do projeto
A estrutura principal da aplicação é composta pelos seguintes arquivos:

```text
feed-studio/
├── index.html
├── style.css
├── app.js
├── favicon-analogfeedstudio.ico
└── icone-analogfeedstudio.png
```

- **`index.html`** — estrutura da aplicação, cabeçalho, áreas de composição, bandeja de revelação e rodapé.
- **`style.css`** — estilos, identidade visual, disposição dos componentes e temas claro e escuro.
- **`app.js`** — lógica das interações, gerenciamento das publicações, carrosséis, persistência e backups.
- **`favicon-analogfeedstudio.ico`** — ícone da aplicação na aba do navegador.
- **`icone-analogfeedstudio.png`** — versão em imagem do símbolo utilizado na interface.

## Decisões de desenvolvimento
O projeto foi construído de maneira incremental, onde destacam-se:

- **JavaScript sem frameworks:** escolha que permite estudar e compreender diretamente os fundamentos da linguagem e do desenvolvimento web.
- **Separação entre estrutura, apresentação e comportamento:** organização do HTML, CSS e JavaScript em arquivos próprios.
- **Persistência local:** uso do IndexedDB para armazenar o projeto sem exigir uma conta ou um serviço de backend.
- **Backup portátil:** exportação e importação de dados para permitir a transferência de projetos entre ambientes.
- **Organização modular da experiência de composição:** distinção entre a bandeja de fotografias e a mesa de composição.
- **Controle de versão:** registro das etapas de desenvolvimento com commits descritivos e identificação de uma versão estável por meio de tag.

Essas escolhas refletem tanto os objetivos práticos da aplicação quanto seu papel como projeto de aprendizagem em desenvolvimento web.

## Limitações e considerações
A versão atual funciona localmente no navegador e não utiliza uma infraestrutura de backend.

Por isso:

- Os projetos salvos no IndexedDB ficam associados ao armazenamento do navegador e da origem em que a aplicação é executada.
- Limpar os dados do navegador pode apagar os projetos salvos localmente.
- O backup JSON é o mecanismo previsto para transportar ou preservar uma cópia independente do projeto.
- A publicação na web não sincroniza automaticamente os projetos entre dispositivos ou navegadores.
- A aplicação não depende de uma conta de usuário nem oferece, nesta versão, sincronização em nuvem.

Para preservar um trabalho importante, recomenda-se exportar backups periodicamente e mantê-los em um local seguro.

## Roadmap
O desenvolvimento futuro poderá explorar novas possibilidades de composição e ampliar a aplicação para além de sua versão inicial.

Algumas possibilidades incluem:

- [ ] Aprimorar a experiência em dispositivos móveis.
- [ ] Explorar novas ferramentas de composição e organização visual.
- [ ] Desenvolver recursos adicionais de visualização e planejamento do feed.
- [ ] Investigar formas de sincronização e persistência em nuvem.
- [ ] Avaliar a evolução da aplicação para uma ferramenta mais completa de organização fotográfica.

Esses itens são possibilidades futuras, não funcionalidades já implementadas.

## Versão
**v1.0.0 — Primeira versão estável**

A versão 1.0.0 reúne a mesa de composição, a bandeja de revelação, os carrosséis, a movimentação de publicações, o salvamento local, os backups e a identidade visual com temas claro e escuro.

O histórico de desenvolvimento é mantido com Git, e a versão estável está identificada pela tag `v1.0.0`.

## Acesso à aplicação
- **Aplicação online:** [LINK DA VERCEL](<https://analogfeedstudio.vercel.app/>)
- **Repositório:** [LINK DO GITHUB](<https://github.com/keroliveira/AnalogFeedStudio>)

## Autoria
Desenvolvido por **[@keroliveira.dev](<https://www.instagram.com/keroliveira.dev>)**

O Analog Feed Studio é um projeto pessoal de aprendizagem e experimentação em desenvolvimento web, nascido do encontro entre fotografia, composição visual e programação.

## Demonstração do modo claro
<img width="1112" height="905" alt="modoclaro-analogfeedstudio" src="https://github.com/user-attachments/assets/20f587cc-9fe3-401e-93b3-37bc16b1ec5b" />

## Demonstração do modo escuro
<img width="1049" height="901" alt="modoescuro-analogfeedstudio" src="https://github.com/user-attachments/assets/4644e159-09fe-48f1-9352-af57bd36f89d"/>

## Demonstração do modo escuro com fotos
<img width="996" height="872" alt="modoescuro-analogfeedstudio-comfotos" src="https://github.com/user-attachments/assets/2a90278b-08f7-401c-a617-6cc1db7abdcf"/>

*Um espaço para experimentar, compor e descobrir. Espero que aproveitem 🎀*
