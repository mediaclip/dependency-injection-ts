import {DiToken, ScopedDiToken} from "./token";

export type InstanceFactory = (container: IDiContainer) => any;
export type TypedInstanceFactory<T> = (container: IDiContainer) => T;
export type ScopedInstanceFactory = (container: IScopedDiContainer) => any;
export type TypedScopedInstanceFactory<T> = (container: IScopedDiContainer) => T;

export type ScopedDiOptions = {
    name: string;
}

export interface IDiContainer {
    registerSingleton<T>(token: DiToken<T>, valueOrFactory: TypedInstanceFactory<T> | T): void;

    registerScoped<T>(token: ScopedDiToken<T>, factory: TypedScopedInstanceFactory<T>): void;

    createScope(options: ScopedDiOptions): IScopedDiContainer;

    isRegistered<T>(token: DiToken<T> | ScopedDiToken<T>): boolean;

    resolve<T>(token: DiToken<T>): T;

    tryResolve<T>(token: DiToken<T>): T | undefined;

    tryResolveScopedFactory<T>(token: ScopedDiToken<T>): TypedScopedInstanceFactory<T> | undefined;
}

export interface IScopedDiContainer extends IDiContainer {
    registerScoped<T>(token: ScopedDiToken<T>, valueOrFactory: TypedScopedInstanceFactory<T> | T): void;

    resolve<T>(token: ScopedDiToken<T> | DiToken<T>): T;
}
