pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template StudentCheck() {
    // Public Inputs
    signal input currentYear;
    
    // Private Inputs
    signal input isStudent; // 1 for student, 0 for not
    signal input expiryYear; // Year student status expires
    signal input salt; // Blinding factor for commitment

    // Commitment Verification
    signal input commitment; 

    // 1. Verify Commitment: H(isStudent, expiryYear, salt) == commitment
    component hasher = Poseidon(3);
    hasher.inputs[0] <== isStudent;
    hasher.inputs[1] <== expiryYear;
    hasher.inputs[2] <== salt;
    
    hasher.out === commitment;

    // 2. Logic Check: isStudent == 1
    isStudent === 1;

    // 3. Logic Check: expiryYear >= currentYear
    component ge = GreaterEqThan(32);
    ge.in[0] <== expiryYear;
    ge.in[1] <== currentYear;
    ge.out === 1;
}

component main {public [currentYear, commitment]} = StudentCheck();
