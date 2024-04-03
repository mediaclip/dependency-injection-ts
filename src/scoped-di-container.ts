import {DiContainer, IDiContainer} from './di-container';
import {disposeIfDisposable, isFunction} from './utils';
import {DiToken} from "./token";


export interface IScopedDiContainer extends IDiContainer {
    registerScoped<T>(token: DiToken<T>, valueOrFactory: ((container: IDiContainer) => T) | T): void;
}

export class ScopedDiContainer extends DiContainer {
    private scopedInstances: Map<symbol, any> = new Map<symbol, any>();

    constructor(private readonly parentContainer: IDiContainer) {
        super();
    }

    override registerScoped<T>(token: DiToken<T>, valueOrFactory: ((container: IScopedDiContainer) => T) | T): void {
        if (isFunction(valueOrFactory))
            super.registerScoped(token, valueOrFactory);
        else {
            this.ensureCanBeRegistered(token, 'scoped');
            this.saveScopeInstances(token, valueOrFactory);
        }
    }

    override isScopedRegistered<T>(token: DiToken<T>) {
        return super.isScopedRegistered(token) || this.scopedInstances.has(token.symbol);
    }

    override tryResolve<T>(token: DiToken<T>): T | undefined {
        const instance = this.tryResolveFrom(token, this.scopedInstances);
        if (instance)
            return instance;

        const newInstance = this.tryResolveFromFactory(token, this.scopedFactories);
        if (newInstance)
            return this.saveScopeInstances(token, newInstance);

        const parentScopedFactory = this.parentContainer.tryResolveScopedFactory(token);
        if (parentScopedFactory) {
            return this.saveScopeInstances(token, parentScopedFactory(this));
        }

        const singletonInstance = super.tryResolve(token);
        if (singletonInstance) {
            return singletonInstance;
        }

        return this.parentContainer.tryResolve<T>(token);
    }

    override createScope(): IScopedDiContainer {
        return new ScopedDiContainer(this);
    }

    override [Symbol.dispose](): void {
        for (const instance of Object.values(this.scopedInstances)) {
            disposeIfDisposable(instance);
        }
        super[Symbol.dispose]();
    }

    private saveScopeInstances<T>(token: DiToken<T>, value: T): T {
        let scopedInstances = this.scopedInstances.get(token.symbol);
        if (scopedInstances === undefined) {
            scopedInstances = [];
            this.scopedInstances.set(token.symbol, scopedInstances);
        }
        scopedInstances.push(value);
        return value;
    }
}
