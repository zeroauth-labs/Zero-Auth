import { parentPort, workerData } from 'worker_threads';
import * as snarkjs from 'snarkjs';

export interface ProofWorkerData {
    proof: Record<string, unknown>;
    publicSignals: string[];
    verificationKey: Record<string, unknown>;
}

async function verifyProof() {
    if (!parentPort || !workerData) return;

    const { proof, publicSignals, verificationKey } = workerData as ProofWorkerData;

    try {
        // Format the proof for snarkjs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedProof: any = {
            pi_a: proof.pi_a,
            pi_b: proof.pi_b,
            pi_c: proof.pi_c,
            protocol: (proof.protocol as string) || 'groth16',
            curve: (proof.curve as string) || 'bn128',
        };

        // Run the heavy cryptographic verification
        const isValid = await snarkjs.groth16.verify(
            verificationKey,
            publicSignals,
            formattedProof
        );

        parentPort.postMessage({ success: true, isValid });
    } catch (error: any) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

verifyProof();
