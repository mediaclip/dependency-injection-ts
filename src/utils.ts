import {IDiContainer} from './di-container';

export function isFunction<T>(valueOrFactory: T | ((container: IDiContainer) => T)): valueOrFactory is (container: IDiContainer) => T {
    return typeof valueOrFactory === "function";
}
