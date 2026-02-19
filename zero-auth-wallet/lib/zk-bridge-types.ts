export type ZKProofPayload = {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
    publicSignals: string[];
};

export type ZKAssetMap = {
    wasm: string; // Base64 or URI
    zkey: string; // Base64 or URI
};

// Requests sent FROM React Native TO WebView
export type BridgeRequest =
    | { id: string; type: 'POSEIDON_HASH'; payload: string[] } // payload: array of bigints as strings
    | { id: string; type: 'GENERATE_PROOF'; payload: { inputs: any; wasmB64: string; zkeyB64: string } }
    | { id: string; type: 'PING'; payload?: never };

// Responses sent FROM WebView TO React Native
export type BridgeResponse =
    | { id: string; type: 'RESULT'; payload: string | ZKProofPayload }
    | { id: string; type: 'ERROR'; payload: string }
    | { id: string; type: 'LOG'; payload: string } // For forwarding console logs
    | { id: string; type: 'PROGRESS'; payload: { step: string; progress: number } }; // Optional progress
