export type Prettify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

export abstract class DiTokenBase<T> {
    public readonly symbol: symbol;

    static mergeTokens<A extends object, B, C, D, E, F, G, H>(
        a: A,
        b?: B,
        c?: C,
        d?: D,
        e?: E,
        f?: F,
        g?: G,
        h?: H
    ): Prettify<A & B & C & D & E & F & G & H> {
        return Object.assign(a, b || {}, c || {}, d || {}, e || {}, f || {}, g || {}, h || {});
    }
}

export class DiToken<T> implements DiTokenBase<T> {
    constructor(
        public readonly symbol: symbol
    ) {
    }

    static create<T>(name: string): DiToken<T> {
        return new DiToken<T>(Symbol(name));
    }
}


export class ScopedDiToken<T> implements DiTokenBase<T> {
    constructor(
        public readonly symbol: symbol
    ) {
    }

    static create<T>(name: string): ScopedDiToken<T> {
        return new ScopedDiToken<T>(Symbol(name));
    }
}
