import {DiToken} from "./token";

export type InstanceFactory = (container: IDiContainer) => any;
export type TypedInstanceFactory<T> = (container: IDiContainer) => T;

export interface IDiContainer {
    registerSingleton<T>(token: DiToken<T>, valueOrFactory: TypedInstanceFactory<T> | T): void;

    registerScoped<T>(token: DiToken<T>, factory: TypedInstanceFactory<T>): void;

    createScope(): IScopedDiContainer;

    isRegistered<T>(token: DiToken<T>): boolean;

    resolve<T>(token: DiToken<T>): T;

    tryResolve<T>(token: DiToken<T>): T | undefined;

    tryResolveScopedFactory<T>(token: DiToken<T>): TypedInstanceFactory<T> | undefined;
}

export interface IScopedDiContainer extends IDiContainer {
    registerScoped<T>(token: DiToken<T>, valueOrFactory: ((container: IDiContainer) => T) | T): void;
}
