declare module 'solana-encryption' {
    export function encrypt( 
        message: string,
        newNonce: Uint8Array,
        publicKeyB: any,
        privateKeyA: Uint8Array): string;
    export function nonce(): Uint8Array;
}