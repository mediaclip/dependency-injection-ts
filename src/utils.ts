import {IDiContainer} from './di-container';

export function isFunction<T>(valueOrFactory: T | ((container: IDiContainer) => T)): valueOrFactory is (container: IDiContainer) => T {
    return typeof valueOrFactory === "function";
}

export function disposeIfDisposable(instance: any) {
    if (typeof instance === "object" || typeof instance === "function") {
        if (typeof instance[Symbol.dispose] === "function") {
            instance[Symbol.dispose]();
        }
    }
}
