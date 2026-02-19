#!/bin/bash
set -e

# 1. Compile Circuit
echo "Compiling circuit..."
circom circuits/age_check.circom -l node_modules --r1cs --wasm --sym --output circuits/

# 2. Download Powers of Tau (Phase 1) - using a small one for testing (12)
if [ ! -f circuits/pot12_final.ptau ]; then
    echo "Downloading Powers of Tau..."
    curl -L -o circuits/pot12_final.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau
fi

# 3. Phase 2 - Circuit Specific Setup
echo "Generating zkey..."
npx snarkjs groth16 setup circuits/age_check.r1cs circuits/pot12_final.ptau circuits/age_check_0000.zkey
    
# 4. Contribute randomness (Phase 2 contribution)
echo "Contributing randomness..."
echo "randomtext" | npx snarkjs zkey contribute circuits/age_check_0000.zkey circuits/age_check_final.zkey --name="First contributor" -v

# 5. Export Verification Key
echo "Exporting verification key..."
npx snarkjs zkey export verificationkey circuits/age_check_final.zkey circuits/verification_key.json

echo "✅ Compilation complete! Files in circuits/"
