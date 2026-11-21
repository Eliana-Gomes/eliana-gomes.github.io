package com.luzemmovimento.parlia;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

/**
 * Reconhecimento de voz da Parlia (Android).
 *
 * Uma "sessão" vai do toque no microfone até ao ⏹ (stop) ou ao cancelar (abort). O SpeechRecognizer do Android
 * acaba sozinho a cada pausa; aqui ele é religado por dentro, sem passar pela página, e cada pedaço reconhecido
 * vai para a página como "segment" (o texto ao vivo como "partial"). Nada aqui pode fechar o app: todos os erros
 * são apanhados e viram um evento "error" ou "end".
 *
 * Bip do sistema: durante a sessão, os canais de som do bip (música, notificações e sistema) ficam mudos e são
 * repostos no fim (também se o app for para segundo plano, e na abertura seguinte se o app tiver sido fechado à
 * força). Só são repostos os canais que este plugin silenciou.
 */
@CapacitorPlugin(name = "ParliaSpeech", permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") })
public class ParliaSpeechPlugin extends Plugin {

    private static final int[] BEEP_STREAMS = { AudioManager.STREAM_MUSIC, AudioManager.STREAM_NOTIFICATION, AudioManager.STREAM_SYSTEM };
    private static final String PREFS = "parlia_fala", PREF_MUTED = "mudos";

    private final Handler main = new Handler(Looper.getMainLooper());
    private SpeechRecognizer recognizer;
    private boolean active = false;
    private boolean stopping = false;
    private boolean recreate = false;
    private String language = "pt-BR";
    private long silenceMs = 6000;
    private boolean muteBeep = true;
    private int restarts = 0;
    private int errorsInRow = 0;
    private final Set<Integer> mutedByUs = new HashSet<>();
    private final Runnable stopTimeout = () -> safeEnd("stop-timeout");

    @Override
    public void load() {
        // Se o app foi fechado à força durante uma escuta, repõe o som que ficou mudo.
        main.post(this::restorePersistedStreams);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("not-allowed", "not-allowed");
            return;
        }
        language = call.getString("language", "pt-BR");
        Integer s = call.getInt("silenceMs", 6000);
        silenceMs = s == null ? 6000 : s;
        Boolean m = call.getBoolean("muteBeep", true);
        muteBeep = m == null || m;
        main.post(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    call.reject("unavailable", "unavailable");
                    return;
                }
                if (active) safeEnd("restart-session");
                active = true;
                stopping = false;
                restarts = 0;
                errorsInRow = 0;
                if (muteBeep) muteStreams();
                listen();
                call.resolve();
            } catch (Exception e) {
                safeEnd("start-error");
                call.reject("start-error", String.valueOf(e.getMessage()));
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        main.post(() -> {
            try {
                if (active) {
                    stopping = true;
                    if (recognizer != null) recognizer.stopListening();
                    main.removeCallbacks(stopTimeout);
                    main.postDelayed(stopTimeout, 2500); // se o reconhecedor não responder, termina na mesma
                }
            } catch (Exception e) {
                safeEnd("stop-error");
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void abort(PluginCall call) {
        main.post(() -> {
            safeEnd("abort");
            call.resolve();
        });
    }

    private void listen() {
        try {
            if (!active) return;
            if (recreate && recognizer != null) {
                try { recognizer.destroy(); } catch (Exception ignored) {}
                recognizer = null;
                recreate = false;
            }
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(listener);
            }
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
            // Pausas mais longas antes de parar (o Android pode não respeitar).
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, silenceMs);
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, silenceMs);
            i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 15000L);
            recognizer.startListening(i);
            emitState(restarts == 0 ? "listening" : "relistening");
        } catch (Exception e) {
            emitError(-1, "start-failed: " + e.getMessage());
            safeEnd("start-failed");
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) { emitState("ready"); }
        @Override public void onBeginningOfSpeech() { errorsInRow = 0; emitState("speech"); }
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() { emitState("endOfSpeech"); }
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onPartialResults(Bundle b) {
            try {
                String t = first(b);
                if (!t.isEmpty()) { JSObject r = new JSObject(); r.put("text", t); notifyListeners("partial", r); }
            } catch (Exception ignored) {}
        }

        @Override
        public void onResults(Bundle b) {
            try {
                String t = first(b);
                if (!t.isEmpty()) { errorsInRow = 0; JSObject r = new JSObject(); r.put("text", t); notifyListeners("segment", r); }
            } catch (Exception ignored) {}
            afterSession();
        }

        @Override
        public void onError(int code) {
            try {
                emitError(code, errorName(code));
                if (code == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) { safeEnd("not-allowed"); return; }
                if (code == SpeechRecognizer.ERROR_CLIENT || code == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) recreate = true;
                // Silêncio sem fala (no-match, speech-timeout) é normal numa pausa; outros erros seguidos param a sessão.
                if (code != SpeechRecognizer.ERROR_NO_MATCH && code != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) errorsInRow++;
                if (errorsInRow >= 5) { safeEnd("too-many-errors"); return; }
            } catch (Exception ignored) {}
            afterSession();
        }
    };

    // Fim de um pedaço (pausa): com ⏹ pedido, termina; senão, volta a ouvir.
    private void afterSession() {
        try {
            if (!active) return;
            if (stopping) { safeEnd("stopped"); return; }
            restarts++;
            if (restarts > 400) { safeEnd("too-long"); return; }
            emitState("restart");
            main.postDelayed(() -> { if (active && !stopping) listen(); }, 80);
        } catch (Exception e) {
            safeEnd("restart-error");
        }
    }

    private void safeEnd(String reason) {
        main.removeCallbacks(stopTimeout);
        boolean was = active;
        active = false;
        stopping = false;
        try {
            if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); }
        } catch (Exception ignored) {}
        recognizer = null;
        // O bip de fim ainda toca mudo; o som volta logo a seguir.
        main.postDelayed(this::restoreStreams, 600);
        if (was) {
            JSObject r = new JSObject();
            r.put("reason", reason);
            r.put("restarts", restarts);
            try { notifyListeners("end", r); } catch (Exception ignored) {}
        }
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        if (active) safeEnd("paused");
        main.removeCallbacksAndMessages(null);
        restoreStreams();
    }

    @Override
    protected void handleOnDestroy() {
        try { if (recognizer != null) recognizer.destroy(); } catch (Exception ignored) {}
        recognizer = null;
        restoreStreams();
        super.handleOnDestroy();
    }

    // ── som do bip ──
    private void muteStreams() {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            for (int s : BEEP_STREAMS) {
                try {
                    if (!am.isStreamMute(s)) { am.adjustStreamVolume(s, AudioManager.ADJUST_MUTE, 0); mutedByUs.add(s); }
                } catch (Exception ignored) {} // ex.: "Não incomodar" ativo
            }
            persistMuted();
        } catch (Exception ignored) {}
    }

    private void restoreStreams() {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am != null) for (int s : mutedByUs) { try { am.adjustStreamVolume(s, AudioManager.ADJUST_UNMUTE, 0); } catch (Exception ignored) {} }
        } catch (Exception ignored) {}
        mutedByUs.clear();
        persistMuted();
    }

    private void persistMuted() {
        try {
            StringBuilder sb = new StringBuilder();
            for (int s : mutedByUs) sb.append(s).append(',');
            prefs().edit().putString(PREF_MUTED, sb.toString()).apply();
        } catch (Exception ignored) {}
    }

    private void restorePersistedStreams() {
        try {
            String v = prefs().getString(PREF_MUTED, "");
            if (v == null || v.isEmpty()) return;
            for (String p : v.split(",")) { try { if (!p.isEmpty()) mutedByUs.add(Integer.parseInt(p)); } catch (Exception ignored) {} }
            restoreStreams();
        } catch (Exception ignored) {}
    }

    private SharedPreferences prefs() { return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    // ── eventos para a página ──
    private void emitState(String s) {
        try { JSObject r = new JSObject(); r.put("state", s); notifyListeners("state", r); } catch (Exception ignored) {}
    }

    private void emitError(int code, String name) {
        try { JSObject r = new JSObject(); r.put("code", code); r.put("name", name); notifyListeners("error", r); } catch (Exception ignored) {}
    }

    private static String first(Bundle b) {
        if (b == null) return "";
        ArrayList<String> m = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (m == null || m.isEmpty() || m.get(0) == null) return "";
        return m.get(0).trim();
    }

    private static String errorName(int c) {
        switch (c) {
            case SpeechRecognizer.ERROR_AUDIO: return "audio";
            case SpeechRecognizer.ERROR_CLIENT: return "client";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "permissions";
            case SpeechRecognizer.ERROR_NETWORK: return "network";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "network-timeout";
            case SpeechRecognizer.ERROR_NO_MATCH: return "no-match";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "busy";
            case SpeechRecognizer.ERROR_SERVER: return "server";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "speech-timeout";
            default: return "error-" + c;
        }
    }
}
