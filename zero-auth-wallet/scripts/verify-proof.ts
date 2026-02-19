import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

async function verify(proofPath: string, publicSignalsPath: string) {
    const vKey = JSON.parse(fs.readFileSync(path.join(__dirname, '../circuits/verification_key.json'), 'utf8'));
    const proof = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
    const publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, 'utf8'));

    const res = await groth16.verify(vKey, publicSignals, proof);

    if (res === true) {
        console.log("✅ Proof is VALID");
    } else {
        console.log("❌ Proof is INVALID");
    }
}

// Usage: npx ts-node scripts/verify-proof.ts <proof.json> <publicSignals.json>
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: npx ts-node scripts/verify-proof.ts <proof.json> <publicSignals.json>");
} else {
    verify(args[0], args[1]);
}
