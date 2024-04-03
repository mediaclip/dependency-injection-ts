export type Prettify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

export class DiToken<T> {
    constructor(
        public readonly symbol: symbol
    ) {
    }

    static create<T>(name: string): DiToken<T> {
        return new DiToken<T>(Symbol(name));
    }

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
