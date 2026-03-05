# Aadhaar Circuit Compilation Instructions

## Compile the circuit

```bash
cd zero-auth-wallet/circuits

# Compile the circuit
circom aadhaar_check.circom --r1cs --wasm --sym -o aadhaar_check

# Generate the trusted setup (phase 2)
# This is a multi-party computation that should be done securely
# For development/testing, you can use a pre-generated ptau

# Generate powers of tau
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="random entropy"

# Prepare phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Generate zkey
snarkjs groth16 setup aadhaar_check.r1cs pot12_final.ptau aadhaar_check_0000.zkey

# Contribute to phase 2
snarkjs zkey contribute aadhaar_check_0000.zkey aadhaar_check_0001.zkey --name="Contributor 1" -v -e="more random entropy"

# Export the verification key
snarkjs zkey export verificationkey aadhaar_check_0001.zkey verification_key_aadhaar.json

# Generate the final zkey (for proving)
snarkjs zkey export rawparams aadhaar_check_0001.zkey aadhaar_check_final.zkey
```

## Copy to assets

```bash
# Copy compiled files to assets folder for the app
cp aadhaar_check_js/aadhaar_check.wasm ../assets/circuits/
cp aadhaar_check_final.zkey ../assets/circuits/
cp verification_key_aadhaar.json ../assets/circuits/
```
