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
  var TTS = P.TextToSpeech, PS = P.ParliaSpeech;
  // Registo da fala para o Diagnóstico (a função slog vem do código da Parlia).
  var slog = function (m) { try { if (typeof window.slog === 'function') window.slog(m); } catch (e) {} };
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

  // ── Microfone (plugin próprio ParliaSpeech, Android): UMA sessão do toque no microfone até ao ⏹. O plugin religa o
  // reconhecedor a cada pausa por dentro (sem bip e sem perder o fio); cada pedaço chega como "segment" e o texto ao
  // vivo como "partial". Aqui juntam-se TODOS os pedaços da sessão (resultados finais) mais o pedaço em curso. ──
  if (PS) {
    var askedBefore = false;
    // Antes do pedido do Android (texto do sistema), uma explicação nossa na língua da interface.
    var ensurePermission = function () {
      return PS.checkPermissions().then(function (s) {
        if (s && s.microphone === 'granted') return true;
        var ask = function () { return PS.requestPermissions().then(function (r) { return !!(r && r.microphone === 'granted'); }, function () { return false; }); };
        if (askedBefore || typeof window.askChoice !== 'function' || typeof window.t !== 'function') return ask();
        askedBefore = true;
        return new Promise(function (res) {
          window.askChoice(window.t('mic_perm_q'), window.t('mic_perm_sub'), window.t('mic_perm_ok'), function () { ask().then(res); }, window.t('mic_perm_later'), function () { res(false); });
        });
      }, function () { return false; });
    };
    var current = null; // sessão ativa (para os eventos do plugin)
    var on = function (ev, fn) { try { return Promise.resolve(PS.addListener(ev, fn)); } catch (e) { return Promise.resolve(null); } };
    on('partial', function (d) { if (current) current._partial(String(d && d.text || '')); });
    on('segment', function (d) { if (current) current._segment(String(d && d.text || '')); });
    on('state', function (d) { var st = d && d.state; if (st === 'restart' || st === 'listening' || st === 'relistening') slog('nativo: ' + st); });
    on('error', function (d) { slog('nativo: erro ' + (d && d.name) + ' (' + (d && d.code) + ')'); if (current && d && d.name === 'permissions') current._fire('onerror', { error: 'not-allowed' }); });
    on('end', function (d) { slog('nativo: fim (' + (d && d.reason) + ', ' + (d && d.restarts) + ' reinícios)'); if (current) current._end(); });

    var NativeRecognition = function () { this.lang = 'pt-BR'; this.continuous = false; this.interimResults = false; this.maxAlternatives = 1; this.onstart = this.onresult = this.onerror = this.onend = null; this._active = false; this._segs = []; this._cur = ''; };
    NativeRecognition.prototype._fire = function (name, ev) { try { if (typeof this[name] === 'function') this[name](ev || {}); } catch (e) { setTimeout(function () { throw e; }); } };
    // Lista de resultados como no navegador: os pedaços finais (isFinal) e o pedaço em curso (provisório).
    NativeRecognition.prototype._emit = function () {
      var mk = function (text, fin) { var r = [{ transcript: text, confidence: 0.9 }]; r.isFinal = fin; r.item = function (i) { return r[i]; }; return r; };
      var results = this._segs.map(function (t) { return mk(t, true); });
      if (this._cur) results.push(mk(this._cur, false));
      results.item = function (i) { return results[i]; };
      this._fire('onresult', { resultIndex: 0, results: results });
    };
    NativeRecognition.prototype._partial = function (t) { if (!this._active || !t) return; this._cur = t; this._emit(); };
    NativeRecognition.prototype._segment = function (t) { if (!this._active) return; if (t) { this._segs.push(t); slog('segmento: «' + t + '»'); } this._cur = ''; this._emit(); };
    NativeRecognition.prototype.start = function () {
      if (this._active) throw new Error('InvalidStateError: recognition has already started');
      var self = this; this._active = true; this._segs = []; this._cur = ''; current = this;
      ensurePermission().then(function (ok) {
        if (current !== self || !self._active) return;
        if (!ok) { slog('microfone: sem permissão'); self._fire('onerror', { error: 'not-allowed' }); self._end(); return; }
        return PS.start({ language: self.lang, silenceMs: 6000, muteBeep: true }).then(function () {
          if (current === self && self._active) { slog('início da escuta (' + self.lang + ')'); self._fire('onstart'); }
        }, function (e) {
          slog('microfone: não arrancou (' + String(e && e.message || e) + ')');
          self._fire('onerror', { error: /not-allowed/.test(String(e && e.message)) ? 'not-allowed' : 'audio-capture' }); self._end();
        });
      });
    };
    NativeRecognition.prototype.stop = function () { if (!this._active) return; slog('⏹ pedido'); try { PS.stop(); } catch (e) { this._end(); } };
    NativeRecognition.prototype.abort = function () { if (!this._active) return; try { PS.abort(); } catch (e) {} this._end(); };
    NativeRecognition.prototype._end = function () {
      if (!this._active) return;
      this._active = false; if (current === this) current = null;
      this._fire('onend');
    };
    window.SpeechRecognition = NativeRecognition;
    window.webkitSpeechRecognition = NativeRecognition;
  }
})();
