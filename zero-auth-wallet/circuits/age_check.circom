pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template AgeCheck() {
    // Public Inputs
    signal input currentYear;
    signal input minAge;

    // Private Inputs
    signal input birthYear;
    signal input salt; // Blinding factor for commitment

    // Commitment Verification: prove user knows birthYear + salt that hashes to public commitment
    signal input commitment; // Public input from credential

    // 1. Verify Commitment: H(birthYear, salt) == commitment
    component hasher = Poseidon(2);
    hasher.inputs[0] <== birthYear;
    hasher.inputs[1] <== salt;
    
    // Constraint: calculated hash must match the public commitment
    hasher.out === commitment;

    // 2. Logic Check: (currentYear - birthYear) >= minAge
    signal age;
    age <== currentYear - birthYear;

    component ge = GreaterEqThan(32); // 32 bits is enough for age
    ge.in[0] <== age;
    ge.in[1] <== minAge;

    // Constraint: age must be >= minAge
    ge.out === 1;
}

component main {public [currentYear, minAge, commitment]} = AgeCheck();
