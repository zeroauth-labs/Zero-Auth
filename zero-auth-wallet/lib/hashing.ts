
/**
 * Computes a Poseidon hash of an array of inputs via the ZK Bridge.
 */
export async function poseidonHash(engine: any, inputs: (bigint | number | string)[]): Promise<string> {
    return engine.execute('POSEIDON_HASH', inputs.map(i => i.toString()));
}

/**
 * Creates a commitment for specific attribute value(s) via the ZK Bridge.
 * Commitment = Poseidon([val1, val2, ..., salt])
 */
export async function commitAttribute(engine: any, value: string | number | boolean | (string | number | boolean)[], salt: string): Promise<string> {
    const values = Array.isArray(value) ? value : [value];
    const inputs = [...values, salt];
    return poseidonHash(engine, inputs.map(i => i.toString()));
}
