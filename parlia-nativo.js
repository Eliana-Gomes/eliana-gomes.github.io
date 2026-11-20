// Parlia — ponte para o app nativo (Capacitor). No navegador não faz nada.
// No app (Android agora, iOS depois), troca a voz e o microfone do navegador pelos plugins nativos,
// imitando a API do navegador (speechSynthesis, SpeechSynthesisUtterance, webkitSpeechRecognition):
// assim o resto do código da Parlia é o mesmo no site e no app.
(function () {
  var cap = window.Capacitor;
  var native = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  window.PARLIA_NATIVE = native;
  if (!native) return;
  var P = cap.Plugins || {};
  var TTS = P.TextToSpeech, SR = P.SpeechRecognition;
  window.PARLIA_PLATFORM = typeof cap.getPlatform === 'function' ? cap.getPlatform() : 'android';

  // ── Voz (TextToSpeech): fila de falas, com onstart / onend / onerror como no navegador ──
  if (TTS) {
    var NativeUtterance = function (text) { this.text = String(text || ''); this.lang = ''; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; this.onstart = this.onend = this.onerror = this.onboundary = null; };
    var synth = {
      speaking: false, pending: false, paused: false, onvoiceschanged: null, _voices: [], _q: [], _cur: null,
      getVoices: function () { return this._voices; },
      speak: function (u) { this._q.push(u); this.pending = this._q.length > 0; if (!this._cur) this._next(); },
      _next: function () {
        var self = this, u = this._q.shift();
        this.pending = this._q.length > 0;
        if (!u) { this._cur = null; this.speaking = false; return; }
        this._cur = u; this.speaking = true; u._done = false;
        var idx = u.voice ? this._voices.indexOf(u.voice) : -1;
        setTimeout(function () { if (!u._done && u.onstart) u.onstart({ utterance: u }); }, 0);
        var opts = { text: u.text, lang: u.lang || (u.voice && u.voice.lang) || 'pt-BR', rate: u.rate || 1, pitch: u.pitch || 1, volume: u.volume == null ? 1 : u.volume, queueStrategy: 0 };
        if (idx >= 0) opts.voice = idx;
        TTS.speak(opts).then(function () {
          if (u._done) return; u._done = true; self._cur = null; self.speaking = false;
          if (u.onend) u.onend({ utterance: u }); self._next();
        }, function (e) {
          if (u._done) return; u._done = true; self._cur = null; self.speaking = false;
          if (u.onerror) u.onerror({ utterance: u, error: 'synthesis-failed', message: String(e && e.message || e) }); self._next();
        });
      },
      cancel: function () {
        var u = this._cur; this._q = []; this.pending = false; this._cur = null; this.speaking = false;
        try { TTS.stop(); } catch (e) {}
        if (u && !u._done) { u._done = true; if (u.onerror) u.onerror({ utterance: u, error: 'interrupted' }); }
      },
      pause: function () {}, resume: function () {}
    };
    // Vozes instaladas no aparelho (nome, língua, local ou de rede), como no navegador.
    TTS.getSupportedVoices().then(function (r) {
      synth._voices = (r && r.voices || []).map(function (v) { return { name: v.name || v.voiceURI, voiceURI: v.voiceURI, lang: String(v.lang || '').replace('_', '-'), localService: !!v.localService, default: !!v.default }; });
      if (typeof synth.onvoiceschanged === 'function') synth.onvoiceschanged();
    }, function () {});
    try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); } catch (e) { window.speechSynthesis = synth; }
    window.SpeechSynthesisUtterance = NativeUtterance;
  }

  // ── Microfone (SpeechRecognizer do Android): cada sessão termina sozinha no silêncio; o código da Parlia
  // já religa o microfone no onend enquanto a aluna não toca em ⏹, e aproveita o último texto parcial. ──
  if (SR) {
    var askedBefore = false;
    // Antes do pedido do Android (texto do sistema), uma explicação nossa na língua da interface.
    var ensurePermission = function () {
      return SR.checkPermissions().then(function (s) {
        if (s && s.speechRecognition === 'granted') return true;
        var ask = function () { return SR.requestPermissions().then(function (r) { return !!(r && r.speechRecognition === 'granted'); }, function () { return false; }); };
        if (askedBefore || typeof window.askChoice !== 'function' || typeof window.t !== 'function') return ask();
        askedBefore = true;
        return new Promise(function (res) {
          window.askChoice(window.t('mic_perm_q'), window.t('mic_perm_sub'), window.t('mic_perm_ok'), function () { ask().then(res); }, window.t('mic_perm_later'), function () { res(false); });
        });
      }, function () { return false; });
    };
    var NativeRecognition = function () { this.lang = 'pt-BR'; this.continuous = false; this.interimResults = false; this.maxAlternatives = 1; this.onstart = this.onresult = this.onerror = this.onend = null; this._active = false; };
    NativeRecognition.prototype._fire = function (name, ev) { try { if (typeof this[name] === 'function') this[name](ev || {}); } catch (e) { setTimeout(function () { throw e; }); } };
    NativeRecognition.prototype._emit = function (text) {
      var alt = { transcript: text, confidence: 0.9 }, res = [alt]; res.isFinal = false; res.item = function (i) { return res[i]; };
      var results = [res]; results.item = function (i) { return results[i]; };
      this._fire('onresult', { resultIndex: 0, results: results });
    };
    NativeRecognition.prototype.start = function () {
      if (this._active) throw new Error('InvalidStateError: recognition has already started');
      var self = this; this._active = true; this._ending = false; this._gen = (this._gen || 0) + 1; var gen = this._gen;
      ensurePermission().then(function (ok) {
        if (gen !== self._gen || !self._active) return;
        if (!ok) { self._fire('onerror', { error: 'not-allowed' }); self._end(); return; }
        return Promise.resolve(SR.addListener('partialResults', function (d) {
          var m = d && d.matches && d.matches[0];
          if (gen === self._gen && self._active && m != null && m !== '') self._emit(String(m));
        })).then(function (h) {
          self._sub = h;
          return SR.start({ language: self.lang, maxResults: 1, partialResults: true, popup: false });
        }).then(function () {
          if (gen !== self._gen || !self._active) return;
          self._fire('onstart');
          // O plugin não avisa quando a sessão acaba em silêncio: verifica de tempos a tempos.
          self._poll = setInterval(function () {
            SR.isListening().then(function (r) {
              if (gen !== self._gen || !self._active || self._ending) return;
              if (!(r && r.listening)) { self._ending = true; clearInterval(self._poll); setTimeout(function () { if (gen === self._gen) self._end(); }, 700); }
            }, function () {});
          }, 400);
        }, function (e) {
          if (gen !== self._gen) return;
          self._fire('onerror', { error: 'audio-capture', message: String(e && e.message || e) }); self._end();
        });
      });
    };
    NativeRecognition.prototype.stop = function () { if (!this._active) return; try { SR.stop(); } catch (e) {} };
    NativeRecognition.prototype.abort = function () { if (!this._active) return; try { SR.stop(); } catch (e) {} this._end(); };
    NativeRecognition.prototype._end = function () {
      if (!this._active) return;
      this._active = false; this._ending = false; clearInterval(this._poll);
      try { if (this._sub && this._sub.remove) this._sub.remove(); } catch (e) {}
      this._sub = null; this._gen++;
      this._fire('onend');
    };
    window.SpeechRecognition = NativeRecognition;
    window.webkitSpeechRecognition = NativeRecognition;
  }
})();
