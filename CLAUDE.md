# Tutora de Voz — Luz em Movimento

App de conversação para praticar idiomas (espanhol, inglês, francês, italiano) por voz, com correção de erros. Publicado no GitHub Pages: https://eliana-gomes.github.io/eliana-voz.html

## Arquivos
- `eliana-voz.html` — o app inteiro (HTML, CSS e JavaScript num só arquivo).
- `tutora-manifest.json`, `tutora-icon-192.png`, `tutora-icon-512.png` — instalação como app no telemóvel (PWA).
- O resto do repositório é o site pessoal da Eliana: não mexer sem pedido.

## Como funciona
- IA: API da Anthropic chamada direto do navegador, modelo `claude-haiku-5-5`, `thinking: { type: 'disabled' }`, `max_tokens: 1024`.
- A chave API e o perfil (nome, cidade, nível por idioma, variante do português, velocidade da voz, sotaque do espanhol, estilo da tutora) ficam no `localStorage` de cada telemóvel.
- Voz: reconhecimento do Chrome (Web Speech API, modo contínuo, envio só ao tocar ⏹, botão "Cancelar esta frase") e leitura pela síntese de voz do aparelho (prefere vozes "Natural"/"Google").
- Avatar SVG animado, fixo no topo: pisca, mexe a boca ao falar, brilha em verde ao ouvir.

## Recursos
- **💡 O que dizer?** (perto do microfone): pede à IA 2 sugestões curtas de resposta, no idioma e no nível da aluna. Só mostra, não envia. Tocar numa sugestão lê-a em voz alta. As sugestões somem quando a aluna envia a frase.
- **🔊 e 🌐 em cada mensagem da tutora:** 🔊 repete o que a tutora falou; 🌐 pede a tradução para a variante de português do perfil (pedida uma vez, depois só mostra/esconde).
- **Erro destacado:** quando há correção, o trecho errado (lado esquerdo do 📝) fica em vermelho no balão "TU" (função `highlightError`, ignora maiúsculas, acentos e pontuação).
- **📒 Meu caderno** (link "📒 Caderno" perto do Perfil), guardado no `localStorage` (`tutora_caderno`), separado por idioma, no máximo 300 itens por idioma (apaga os mais antigos):
  - Cada correção 📝 é guardada sozinha em "Meus erros": o que a aluna disse, a forma correta, a explicação e a data.
  - Botão ⭐ em cada mensagem da tutora guarda em "Salvas" a frase ✅ (nas correções), a frase "Puedes decir" ou a mensagem inteira; se a aluna selecionar um trecho antes, guarda só o trecho.
  - A tela mostra o idioma atual, com as abas "Meus erros" e "Salvas", os mais recentes primeiro, e em cada item 🔊 (ouvir a forma certa) e 🗑️ (apagar).
  - Memória da tutora: `topErrors(5)` agrupa os erros iguais ("errado → certo", sem maiúsculas, acentos e pontuação) e envia os 5 mais repetidos nas instruções. A tutora cria, de vez em quando, perguntas que levem a aluna a usar essas estruturas, sem anunciar nem mencionar a lista. Com poucos erros repetidos, a lista completa-se com os erros mais recentes.
- **🔥 Racha** (`localStorage` `tutora_racha` = nº de falas por dia): um dia conta como praticado com pelo menos 5 falas enviadas (voz ou texto). O contador "🔥 N" no topo mostra os dias seguidos (até hoje, ou até ontem se hoje ainda não completou; volta a zero se pular um dia), fica esbatido enquanto o dia não está completo e abre o Perfil ao tocar. Na 5.ª fala do dia: celebração rápida (chama animada, "¡Eres genial!" no idioma estudado, a semana de segunda a domingo com os dias marcados), que fecha sozinha em 4 s ou ao tocar. No Perfil: racha atual, melhor racha, total de dias, a semana atual e as falas de hoje. Cores douradas da marca.
- **Cópia de segurança** (na tela do Perfil): "Exportar meus dados" baixa `tutora-dados-AAAA-MM-DD.json` com `{ app: 'tutora-voz', version, exportedAt, profile, caderno, racha }`; a chave API nunca entra no arquivo. "Importar meus dados" lê esse arquivo, recusa arquivos que não sejam da tutora, mostra o que vai ser substituído e pede confirmação antes de gravar; a chave API não muda.
- **Perfil:**
  - Velocidade da voz: lenta (0.75), normal (0.95), rápida (1.15).
  - Sotaque do espanhol: Espanha (voz es-ES, vosotros/ordenador) ou América Latina (voz e microfone es-MX, ustedes/computadora). A tutora não corrige formas certas da outra variante.
  - Estilo da tutora: amigável, formal (usted/vous/Lei) ou divertida.
  - Perfis antigos sem estes campos usam: normal, Espanha, amigável.

## Regras da tutora (não quebrar)
- Corrige só erros reais. Não corrige frases certas, alternativas de estilo, hesitações ("eh", "pues") nem palavras mal transcritas pelo microfone (essas viram linha 🗣️ de pronúncia).
- Corrige só a forma (gramática, conjugação, concordância, preposição, palavra em português). Nunca muda o sentido nem acrescenta informação.
- Uma correção por vez: no máximo UMA linha 📝, com o erro mais importante; os outros erros ficam para outra rodada. O código também corta para uma só linha 📝.
- Formato da resposta: `📝 errado → certo · explicação curta em português` (o lado esquerdo é exatamente o trecho que a aluna disse), e `✅ frase corrigida`: a frase da aluna 100% correta, com TODOS os erros corrigidos (também os que não têm linha 📝), sem mudar o sentido nem acrescentar informação. A IA não escreve a frase para repetir.
- Frase confusa por erro do microfone: a tutora não adivinha, pergunta "¿Puedes decirlo otra vez?" (ou o equivalente no idioma).
- Letras, siglas, números e tamanhos ditos em voz alta ("ex el", "doble ex") são falhas de transcrição: nunca corrigir; ensinar como se fala (XL = "equis ele") numa linha 🗣️.
- Se a aluna corrigir uma informação ("no, es XXL"), a tutora aceita e continua, sem "¡Correcto!" e sem corrigir. No modo repetição, isso vem com o marcador `🎯 ESCLARECIMENTO` e o app sai do modo repetição.
- Erros de conjugação e de imperativo são sempre corrigidos, mesmo com o sentido claro e mesmo na primeira fala da conversa (ex.: "me cuenten más" → "cuéntame más").
- Atenção especial ao "se" em vez do "si" condicional e ao pronome objeto que falta ("lo compro").
- A cidade do perfil é só contexto: a tutora não a menciona, a não ser que a aluna fale dela primeiro.
- Frase inteira em português não é erro: a IA responde com uma linha `💬 frase no idioma`, e o app mostra "Puedes decir: «…»" e pede para repetir (entra no modo repetição).
- Quando há erro: a tutora fala "Mejor di: … Y no: …", mostra a caixa de correção ANTES do texto, e pede para repetir ("Repite conmigo 🔁: «…»") só o trecho da ✅ com a correção principal, escolhido pelo código (função `repeatPhrase`): a oração entre vírgulas/pontos que contém a correção do 📝; se não houver, a ✅ inteira quando tem até 10 palavras; senão 10 palavras a partir da correção. Nunca trechos soltos juntos com "…". Não continua o tema antes disso.
- Modo repetição: avalia só a frase, tolera erros do microfone, máximo 2 tentativas, depois "¡Correcto!" e segue a conversa. Se a aluna perguntar algo ou disser que não entendeu, a tutora explica em português com uma frase curta e repete a frase certa (isso não conta como tentativa). Marcadores internos `🎯 OK` / `🎯 DE NOVO` / `🎯 PERGUNTA` / `🎯 ESCLARECIMENTO` nunca aparecem na tela.
- Fazer a aluna falar mais: a tutora fala pouco (no máximo 2 frases curtas antes da pergunta) e faz perguntas abertas que exigem frases completas (porquê, como, o que farias, conta-me sobre…). Evita perguntas "A ou B?" e de sim/não, e não acrescenta opções de resposta depois de uma pergunta aberta ("¿es por A, por B o por C?"). Se a aluna responder com só 1 a 3 palavras, de vez em quando pede com gentileza uma frase completa.
- Explicações sempre em português (do Brasil ou de Portugal, conforme o perfil).

## Fluxo de trabalho
- Depois de cada mudança: testar a sintaxe do JavaScript, fazer commit com mensagem clara em português e push para `main`.
- O GitHub Pages leva alguns minutos para publicar; para testar no telemóvel usar `?v=N` no fim do endereço.

## Futuro (ainda não fazer)
Versão produto para clientes: servidor próprio com a chave da API, login, assinatura, limite de uso por pessoa e política de privacidade (RGPD).
