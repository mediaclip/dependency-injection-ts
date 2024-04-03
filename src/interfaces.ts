import {DiToken, DiTokenBase, ScopedDiToken} from "./token";

export type InstanceFactory = (container: IDiContainer) => any;
export type TypedInstanceFactory<T> = (container: IDiContainer) => T;
export type ScopedInstanceFactory = (container: IScopedDiContainer) => any;
export type TypedScopedInstanceFactory<T> = (container: IScopedDiContainer) => T;

export interface IDiContainer {
    registerSingleton<T>(token: DiToken<T>, valueOrFactory: TypedInstanceFactory<T> | T): void;

    registerScoped<T>(token: ScopedDiToken<T>, factory: TypedScopedInstanceFactory<T>): void;

    createScope(): IScopedDiContainer;

    isRegistered<T>(token: DiTokenBase<T>): boolean;

    resolve<T>(token: DiTokenBase<T>): T;

    tryResolve<T>(token: DiTokenBase<T>): T | undefined;

    tryResolveScopedFactory<T>(token: ScopedDiToken<T>): TypedInstanceFactory<T> | undefined;
}

export interface IScopedDiContainer extends IDiContainer {
    registerScoped<T>(token: ScopedDiToken<T>, valueOrFactory: TypedScopedInstanceFactory<T> | T): void;

    resolve<T>(token: ScopedDiToken<T>): T;
}
