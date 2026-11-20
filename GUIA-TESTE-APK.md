# Instalar a Parlia no seu celular (APK de teste)

Um passo por linha.
Este APK é só para o seu teste. Para os testadores, use a Play Store (GUIA-PLAY-STORE.md).

---

## Parte A — Antes de instalar (uma vez só, no painel da Cloudflare)

Dentro do app, a Parlia corre no endereço "localhost". O anti-robô (Turnstile) precisa de o conhecer.

1. Abra https://dash.cloudflare.com
2. No menu da esquerda, abra "Turnstile".
3. Toque no widget "Parlia".
4. Em "Hostname Management" (ou "Domínios"), toque em "Add hostname".
5. Escreva: localhost
6. Salve.
7. Sem este passo, o app mostra "A Lia não está disponível agora".

---

## Parte B — Levar o APK para o celular

O arquivo fica no computador em:
C:\Users\HP 840 G1\parlia-app\saida\Parlia-1.0.2-codigo3-site-v91-teste.apk

1. Abra o Google Drive no computador (drive.google.com).
2. Arraste o arquivo .apk para uma pasta sua do Drive.
3. No celular, abra o app Google Drive.
4. Toque no arquivo Parlia-…-teste.apk.
5. Toque em "Instalar" (ou "Abrir").

(Também pode ligar o celular ao computador com cabo USB e copiar o arquivo para a pasta "Download".)

---

## Parte C — Permitir a instalação

O Android pergunta se pode instalar apps desta origem.

1. Toque em "Configurações" na mensagem.
2. Ative "Permitir desta fonte".
3. Volte e toque em "Instalar".
4. Se aparecer um aviso do Play Protect, toque em "Mais detalhes" e depois em "Instalar mesmo assim".
5. Toque em "Abrir".

---

## Parte D — Teste rápido

1. A Parlia abre com a tela petróleo e o logotipo.
2. Vá ao Perfil e role até ao fim.
3. Deve aparecer: "Parlia v91 · …" e, por baixo, "App 1.0.2 (código 3) · feito do site v91".
4. Vá a Conversar.
5. A Lia fala (voz do celular).
6. Toque no microfone.
7. Aparece a nossa mensagem "A Lia precisa do microfone" → toque em "Continuar".
8. O Android pergunta se a Parlia pode gravar áudio → toque em "Durante o uso do app".
9. Fale uma frase. Ela aparece escrita enquanto fala.
10. Faça uma pausa de 2 ou 3 segundos e continue a falar: o microfone continua a ouvir (pode ouvir um bip).
11. Toque em ⏹: a frase inteira vai para a Lia.
12. A Lia responde em voz alta.

---

## Parte E — Teste da denúncia (⚑)

1. Em Conversar, espere uma resposta da Lia.
2. Por baixo da resposta, à direita, toque no ⚑ (pequeno, ao lado de 🔊 🌐 ⭐).
3. Abre "Denunciar esta resposta".
4. Toque em "Enviar" sem escolher nada: aparece "Escolha um motivo.".
5. Escolha "Outro motivo" e escreva no comentário: TESTE.
6. Toque em "Enviar".
7. Aparece "Obrigada. Vamos analisar." e o ⚑ dessa mensagem fica vermelho (já não abre de novo).
8. Para testar sem internet: ponha o celular em modo avião, denuncie outra resposta e toque em "Enviar": aparece "Não foi possível enviar agora. Tente de novo mais tarde.".
9. No computador, abra o link das denúncias (no COFRE-PARLIA.txt) e confirme que a denúncia "TESTE" aparece no topo.

---

## Se algo não funcionar

1. A Lia não fala: Configurações do Android → Sistema → Idiomas → "Saída de texto para fala" → confirme o "Mecanismo do Google" e instale a voz do idioma.
2. O microfone não ouve: Configurações → Apps → Parlia → Permissões → Microfone → "Permitir durante o uso".
3. Reconhecimento de voz em falta: instale (ou atualize) o app "Google" na Play Store.
4. "A Lia não está disponível agora": confirme a Parte A (localhost no Turnstile).
5. Diagnóstico: Perfil → 5 toques em "Parlia v91" → código → "Copiar registro" e mande-me o texto.

---

## Atualizar o app de teste

1. Peça ao Claude um APK novo.
2. Instale por cima do anterior (os dados ficam).
3. O app de teste e o da Play Store usam a mesma chave: pode passar de um para o outro sem perder dados.
