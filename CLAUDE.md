# Tutora de Voz — Luz em Movimento

App de conversação para praticar idiomas (espanhol, inglês, francês, italiano e português do Brasil) por voz, com correção de erros. A interface e as explicações saem na língua nativa do aluno (português do Brasil, português de Portugal ou espanhol). Publicado no GitHub Pages: https://eliana-gomes.github.io/eliana-voz.html

## Arquivos
- `eliana-voz.html` — o app inteiro (HTML, CSS e JavaScript num só arquivo).
- `tutora-manifest.json`, `tutora-icon-192.png`, `tutora-icon-512.png` — instalação como app no telemóvel (PWA).
- O resto do repositório é o site pessoal da Eliana: não mexer sem pedido.

## Como funciona
- IA: API da Anthropic chamada direto do navegador, modelo `claude-haiku-5-5`, `thinking: { type: 'disabled' }`, `max_tokens: 1024`.
- A chave API e o perfil (língua nativa, nome, cidade, nível por idioma, velocidade da voz, sotaque do espanhol, estilo da tutora) ficam no `localStorage` de cada telemóvel.
- Voz: reconhecimento do Chrome (Web Speech API, modo contínuo, envio só ao tocar ⏹, botão "Cancelar esta frase") e leitura pela síntese de voz do aparelho (prefere vozes "Natural"/"Google").
- Avatar SVG animado, fixo no topo: pisca, mexe a boca ao falar, brilha em verde ao ouvir.

## Línguas
- **Língua nativa** ("Minha língua" no perfil, campo `native`): `pt-BR`, `pt-PT` ou `es` (objeto `NATIVES`). Substitui o antigo campo `expl`; perfis antigos são lidos com `getNative()` (`expl` = português de Portugal → `pt-PT`, senão `pt-BR`). Sem perfil, segue a língua do navegador.
- **Textos da interface** ficam no dicionário `I18N` (`pt-BR`, `pt-PT`, `es`) e são lidos com `t('chave', {vars})`. No HTML, os elementos usam `data-i18n` (texto), `data-i18n-html`, `data-i18n-ph` (placeholder) e `data-i18n-title`; `applyI18n()` aplica tudo. Ao mudar "Minha língua" no perfil, a tela muda logo (pré-visualização). Qualquer texto novo para o aluno entra nas três línguas.
- **Idiomas para aprender** (`LANGS`): espanhol, inglês, francês, italiano e 🇧🇷 português do Brasil. O idioma igual à língua nativa fica escondido (português para pt-BR/pt-PT, espanhol para es), na lista e nos níveis do perfil.
- **Textos no idioma estudado** ("Repite conmigo", "Mejor di", "Puedes decir", "¡Eres genial!"…) ficam em `TARGET_TXT` e `BETTER`, com versão para os 5 idiomas.
- **Vozes**: cada linha da tutora pode começar por `[nat]` (língua nativa, lida com a voz dessa língua, `nativeVoiceLocale()`) ou `[alvo]` (idioma estudado; linha sem marca = idioma estudado). `voiceParts()` junta as linhas por voz e `speak()` lê-as em sequência. As marcas nunca aparecem na tela (`renderTagged`, `stripTags`); as linhas `[nat]` aparecem em itálico. A explicação do modo repetição (🎯 PERGUNTA) vem numa linha `[nat]`.
- **Instruções da tutora**: usam a língua nativa do perfil ("falante nativo de …", explicações em …) e os erros típicos dessa combinação (`TYPICAL[grupo][idioma]`, ex.: hispanofalante a aprender português: "yo" → "eu", nasalização, "ão", "você/tu", falsos amigos "exquisito" e "embarazada"). Dicas por língua e idioma em `TIPS`.

## Recursos
- **💡 O que dizer?** (perto do microfone): pede à IA 2 sugestões curtas de resposta, no idioma e no nível da aluna. Só mostra, não envia. Tocar numa sugestão lê-a em voz alta. As sugestões somem quando a aluna envia a frase.
- **🔊 e 🌐 em cada mensagem da tutora:** 🔊 repete o que a tutora falou; 🌐 pede a tradução para a língua nativa do perfil (pedida uma vez, depois só mostra/esconde).
- **Erro destacado:** quando há correção, o trecho errado (lado esquerdo do 📝) fica em vermelho no balão "TU" (função `highlightError`, ignora maiúsculas, acentos e pontuação).
- **📒 Meu caderno** (link "📒 Caderno" perto do Perfil), guardado no `localStorage` (`tutora_caderno`), separado por idioma, no máximo 300 itens por idioma (apaga os mais antigos):
  - Cada correção 📝 é guardada sozinha em "Meus erros": o que a aluna disse, a forma correta, a explicação e a data.
  - Botão ⭐ em cada mensagem da tutora guarda em "Salvas" a frase ✅ (nas correções), a frase "Puedes decir" ou a mensagem inteira; se a aluna selecionar um trecho antes, guarda só o trecho.
  - A tela mostra o idioma atual, com as abas "Meus erros" e "Salvas", os mais recentes primeiro, e em cada item 🔊 (ouvir a forma certa) e 🗑️ (apagar).
  - Memória da tutora: `topErrors(5)` agrupa os erros iguais ("errado → certo", sem maiúsculas, acentos e pontuação) e envia os 5 mais repetidos nas instruções. A tutora cria, de vez em quando, perguntas que levem a aluna a usar essas estruturas, sem anunciar nem mencionar a lista. Com poucos erros repetidos, a lista completa-se com os erros mais recentes.
- **🔥 Racha** (`localStorage` `tutora_racha` = nº de falas por dia): um dia conta como praticado com pelo menos 5 falas enviadas (voz ou texto). O contador "🔥 N" no topo mostra os dias seguidos (até hoje, ou até ontem se hoje ainda não completou; volta a zero se pular um dia), fica esbatido enquanto o dia não está completo e abre o Perfil ao tocar. Na 5.ª fala do dia: celebração rápida (chama animada, "¡Eres genial!" no idioma estudado, a semana de segunda a domingo com os dias marcados), que fecha sozinha em 4 s ou ao tocar. No Perfil: racha atual, melhor racha, total de dias, a semana atual e as falas de hoje. Cores douradas da marca.
- **🌱 Do zero** (botão no início da fila de temas): trilha de 12 lições iniciais, iguais para todos os idiomas (`LESSONS_UI` com título e meta em pt e es; `LESSON_CONTENT` diz à tutora o que cada lição cobre): cumprimentar e despedir-se; dizer o nome; de onde sou e onde moro; como estou; família; números de 0 a 20; idade e telefone; gostos e preferências; comida e bebida; pedir numa loja ou café; dias e horas; rotina diária.
  - A tela da trilha mostra as lições do idioma atual, com ✓ nas concluídas e a próxima em destaque. Abre sozinha na primeira vez num idioma em que o perfil diz "iniciante" (`maybeAutoZero`); se for fechada sem escolher, começa a conversa normal.
  - Na lição (`currentLesson`, faixa "🌱 Lição N/12" acima da conversa), as instruções vêm de `buildLessonSystem()`: a tutora explica a meta na língua nativa, ensina UMA frase por vez (frase `[alvo]`, tradução `[nat]`, pedido para repetir), faz a pergunta real, corrige com 📝 e "Repite conmigo" (no máximo 2 tentativas por frase, conta pelo histórico), usa 3 a 5 frases e termina com uma mini-conversa e o marcador `🎯 LIÇÃO CONCLUÍDA`. O app marca ✓, guarda o erro 📝 no caderno e mostra uma celebração com o progresso (12 pontos) e o botão "Próxima lição".
  - No modo Do zero, as partes no idioma estudado são lidas mais devagar (velocidade do perfil × 0,8, mínimo 0,55). Usa até 40 mensagens de histórico (o modo normal usa 20).
  - Escolher um tema, trocar de idioma ou guardar o perfil sai da lição.
  - Progresso no `localStorage` `tutora_zero` = `{ idioma: { done: [índices], seen } }`.
- **Cópia de segurança** (na tela do Perfil): "Exportar meus dados" baixa `tutora-dados-AAAA-MM-DD.json` com `{ app: 'tutora-voz', version, exportedAt, profile, caderno, racha, zero }`; cópias antigas sem `zero` não apagam o progresso das lições; a chave API nunca entra no arquivo. "Importar meus dados" lê esse arquivo, recusa arquivos que não sejam da tutora, mostra o que vai ser substituído e pede confirmação antes de gravar; a chave API não muda.
- **Perfil:**
  - Velocidade da voz: lenta (0.75), normal (0.95), rápida (1.15).
  - Sotaque do espanhol: Espanha (voz es-ES, vosotros/ordenador) ou América Latina (voz e microfone es-MX, ustedes/computadora). A tutora não corrige formas certas da outra variante.
  - Estilo da tutora: amigável, formal (usted/vous/Lei) ou divertida.
  - Perfis antigos sem estes campos usam: normal, Espanha, amigável.

## Regras da tutora (não quebrar)
- Corrige só erros reais. Não corrige frases certas, alternativas de estilo, hesitações ("eh", "pues") nem palavras mal transcritas pelo microfone (essas viram linha 🗣️ de pronúncia).
- Corrige só a forma (gramática, conjugação, concordância, preposição, palavra na língua nativa). Nunca muda o sentido nem acrescenta informação.
- Uma correção por vez: no máximo UMA linha 📝, com o erro mais importante; os outros erros ficam para outra rodada. O código também corta para uma só linha 📝 e ignora linhas 📝 cujos dois lados só diferem em maiúsculas, acentos ou pontuação: essas não aparecem, não pedem repetição e não entram no caderno. Palavra estranha por erro do microfone vai para a linha 🗣️, nunca para a 📝.
- A tutora revê a gramática das próprias frases antes de responder (ex.: "¿qué necesitaste hacer la última vez que fuiste?", não "¿qué necesitas…?").
- Formato da resposta: `📝 errado → certo · explicação curta na língua nativa` (o lado esquerdo é exatamente o trecho que a aluna disse; o lado direito é a correção real, igual ao trecho correspondente da ✅, ex.: "tengo muchos gerais → tengo muchas dudas"), e `✅ frase corrigida`: a frase da aluna 100% correta, com TODOS os erros corrigidos (também os que não têm linha 📝), sem mudar o sentido nem acrescentar informação. A IA não escreve a frase para repetir.
- Frase confusa por erro do microfone: a tutora não adivinha, pergunta "¿Puedes decirlo otra vez?" (ou o equivalente no idioma).
- Letras, siglas, números e tamanhos ditos em voz alta ("ex el", "doble ex") são falhas de transcrição: nunca corrigir; ensinar como se fala (XL = "equis ele") numa linha 🗣️.
- Se a aluna corrigir uma informação ("no, es XXL"), a tutora aceita e continua, sem "¡Correcto!" e sem corrigir. No modo repetição, isso vem com o marcador `🎯 ESCLARECIMENTO` e o app sai do modo repetição.
- Erros de conjugação e de imperativo são sempre corrigidos, mesmo com o sentido claro e mesmo na primeira fala da conversa (ex.: "me cuenten más" → "cuéntame más", "me explico primero los documentos" → "explícame primero los documentos").
- Atenção especial ao "se" em vez do "si" condicional e ao pronome objeto que falta ("lo compro").
- A cidade do perfil é só contexto: a tutora não a menciona, a não ser que a aluna fale dela primeiro.
- Frase inteira na língua nativa não é erro: a IA responde com uma linha `💬 frase no idioma`, e o app mostra "Puedes decir: «…»" e pede para repetir (entra no modo repetição).
- Quando há erro: a tutora fala "Mejor di: … Y no: …", mostra a caixa de correção ANTES do texto, e pede para repetir ("Repite conmigo 🔁: «…»") só o trecho da ✅ com a correção principal, escolhido pelo código (função `repeatPhrase`): a oração entre vírgulas/pontos que contém a correção do 📝; se não houver, a ✅ inteira quando tem até 10 palavras; senão 10 palavras a partir da correção. Nunca trechos soltos juntos com "…". Não continua o tema antes disso.
- Modo repetição: avalia só a frase, tolera erros do microfone, máximo 2 tentativas, depois "¡Correcto!" e segue a conversa. Se a aluna perguntar algo ou disser que não entendeu, a tutora explica na língua nativa com uma frase curta e repete a frase certa (isso não conta como tentativa). Marcadores internos `🎯 OK` / `🎯 DE NOVO` / `🎯 PERGUNTA` / `🎯 ESCLARECIMENTO` nunca aparecem na tela.
- Fazer a aluna falar mais: a tutora fala pouco (no máximo 2 frases curtas antes da pergunta) e faz perguntas abertas que exigem frases completas (porquê, como, o que farias, conta-me sobre…). Evita perguntas "A ou B?" e de sim/não, e não acrescenta opções de resposta depois de uma pergunta aberta ("¿es por A, por B o por C?"). Se a aluna responder com só 1 a 3 palavras, de vez em quando pede com gentileza uma frase completa.
- Explicações sempre na língua nativa do perfil (português do Brasil, português de Portugal ou espanhol).

## Fluxo de trabalho
- Depois de cada mudança: testar a sintaxe do JavaScript, fazer commit com mensagem clara em português e push para `main`.
- O GitHub Pages leva alguns minutos para publicar; para testar no telemóvel usar `?v=N` no fim do endereço.

## Futuro (ainda não fazer)
Versão produto para clientes: servidor próprio com a chave da API, login, assinatura, limite de uso por pessoa e política de privacidade (RGPD).
