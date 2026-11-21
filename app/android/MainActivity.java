package com.luzemmovimento.parlia;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin próprio da Parlia (reconhecimento de voz contínuo, sem bip e sem fechar o app).
        registerPlugin(ParliaSpeechPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
