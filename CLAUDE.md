# Tutora de Voz — Luz em Movimento

App de conversação para praticar idiomas (espanhol, inglês, francês, italiano) por voz, com correção de erros. Publicado no GitHub Pages: https://eliana-gomes.github.io/eliana-voz.html

## Arquivos
- `eliana-voz.html` — o app inteiro (HTML, CSS e JavaScript num só arquivo).
- `tutora-manifest.json`, `tutora-icon-192.png`, `tutora-icon-512.png` — instalação como app no telemóvel (PWA).
- O resto do repositório é o site pessoal da Eliana: não mexer sem pedido.

## Como funciona
- IA: API da Anthropic chamada direto do navegador, modelo `claude-haiku-5-5`, `thinking: { type: 'disabled' }`, `max_tokens: 1024`.
- A chave API e o perfil (nome, cidade, nível por idioma, variante do português) ficam no `localStorage` de cada telemóvel.
- Voz: reconhecimento do Chrome (Web Speech API, modo contínuo, envio só ao tocar ⏹, botão "Cancelar esta frase") e leitura pela síntese de voz do aparelho (prefere vozes "Natural"/"Google").
- Avatar SVG animado, fixo no topo: pisca, mexe a boca ao falar, brilha em verde ao ouvir.

## Regras da tutora (não quebrar)
- Corrige só erros reais. Não corrige frases certas, alternativas de estilo, hesitações ("eh", "pues") nem palavras mal transcritas pelo microfone (essas viram linha 🗣️ de pronúncia).
- Corrige só a forma (gramática, conjugação, concordância, preposição, palavra em português). Nunca muda o sentido nem acrescenta informação.
- Uma correção por vez: no máximo UMA linha 📝, com o erro mais importante; os outros erros ficam para outra rodada. O código também corta para uma só linha 📝.
- Formato da resposta: `📝 errado → certo · explicação curta em português` (o lado esquerdo é exatamente o trecho que a aluna disse), e `✅ frase corrigida` (a frase da aluna só com essa correção, sem acrescentar palavras). A IA não escreve a frase para repetir.
- Frase confusa por erro do microfone: a tutora não adivinha, pergunta "¿Puedes decirlo otra vez?" (ou o equivalente no idioma).
- Quando há erro: a tutora fala "Mejor di: … Y no: …", mostra a caixa de correção ANTES do texto, e pede para repetir ("Repite conmigo 🔁: «…»") a própria frase ✅, escolhida pelo código (função `repeatPhrase`): inteira se tiver até 10 palavras; se for maior, só a parte que contém a correção (a oração entre vírgulas/pontos, ou 10 palavras a partir da correção). Nunca trechos soltos juntos com "…". Não continua o tema antes disso.
- Modo repetição: avalia só a frase, tolera erros do microfone, máximo 2 tentativas, depois "¡Correcto!" e segue a conversa. Se a aluna perguntar algo ou disser que não entendeu, a tutora explica em português com uma frase curta e repete a frase certa (isso não conta como tentativa). Marcadores internos `🎯 OK` / `🎯 DE NOVO` / `🎯 PERGUNTA` nunca aparecem na tela.
- Explicações sempre em português (do Brasil ou de Portugal, conforme o perfil).

## Fluxo de trabalho
- Depois de cada mudança: testar a sintaxe do JavaScript, fazer commit com mensagem clara em português e push para `main`.
- O GitHub Pages leva alguns minutos para publicar; para testar no telemóvel usar `?v=N` no fim do endereço.

## Futuro (ainda não fazer)
Versão produto para clientes: servidor próprio com a chave da API, login, assinatura, limite de uso por pessoa e política de privacidade (RGPD).
