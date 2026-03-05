pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template AadhaarCheck() {
    // Public Inputs
    signal input currentYear;
    signal input minAge; // Usually 18 for most verifications
    
    // Private Inputs
    signal input birthYear;
    signal input salt; // Blinding factor for commitment
    signal input ageOver18; // 1 if age >= 18, 0 otherwise
    signal input ageOver23; // 1 if age >= 23, 0 otherwise  
    signal input indianCitizen; // 1 if verified Indian citizen

    // Commitment Verification
    signal input commitment; 

    // 1. Verify Commitment: H(birthYear, salt) == commitment
    component hasher = Poseidon(2);
    hasher.inputs[0] <== birthYear;
    hasher.inputs[1] <== salt;
    
    // Constraint: calculated hash must match the public commitment
    hasher.out === commitment;

    // 2. Calculate age from birthYear and verify against claims
    signal age;
    age <== currentYear - birthYear;

    // 3. Verify ageOver18 claim: age >= 18
    component ge18 = GreaterEqThan(32);
    ge18.in[0] <== age;
    ge18.in[1] <== 18;
    ge18.out === ageOver18;

    // 4. Verify ageOver23 claim: age >= 23
    component ge23 = GreaterEqThan(32);
    ge23.in[0] <== age;
    ge23.in[1] <== 23;
    ge23.out === ageOver23;

    // 5. Verify indianCitizen is 1 (must be verified Indian citizen)
    indianCitizen === 1;
}

// Main circuit: public inputs are currentYear, minAge, and commitment
// The verifier can set minAge to 18 or 23 depending on verification requirement
component main {public [currentYear, minAge, commitment]} = AadhaarCheck();
