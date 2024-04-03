import {isFunction} from './utils';
import {DiToken} from "./token";
import {IDiContainer, InstanceFactory, IScopedDiContainer, TypedInstanceFactory} from "./interfaces";

export type DiContainerOption = {
    overridesBehaviour: "use-last" | "use-first" | "deny";
}

export class DiContainer implements IDiContainer {
    protected singletonInstances: Map<symbol, Array<any>> = new Map<symbol, Array<any>>();
    protected singletonFactories: Map<symbol, Array<InstanceFactory>> = new Map<symbol, Array<InstanceFactory>>();
    protected scopedFactories: Map<symbol, Array<InstanceFactory>> = new Map<symbol, Array<InstanceFactory>>();
    protected containerOption: DiContainerOption;

    constructor(containerOption?: DiContainerOption) {
        this.containerOption = containerOption ?? {
            overridesBehaviour: "use-last"
        };
    }

    registerSingleton<T>(token: DiToken<T>, valueOrFactory: ((container: IDiContainer) => T) | T): void {
        this.ensureCanBeRegistered(token, 'singleton');

        if (isFunction(valueOrFactory)) {
            let singletonFactories = this.singletonFactories.get(token.symbol);
            if (singletonFactories === undefined) {
                singletonFactories = [];
                this.singletonFactories.set(token.symbol, singletonFactories);
            }
            singletonFactories.push(valueOrFactory);
        } else {
            this.saveSingletonInstance(token, valueOrFactory);
        }
    }

    registerScoped<T>(token: DiToken<T>, factory: TypedInstanceFactory<T>): void {
        this.ensureCanBeRegistered(token, 'scoped');

        let scopedFactories = this.scopedFactories.get(token.symbol);
        if (scopedFactories === undefined) {
            scopedFactories = [];
            this.scopedFactories.set(token.symbol, scopedFactories);
        }
        scopedFactories.push(factory);
    }

    isRegistered<T>(token: DiToken<T>): boolean {
        return this.isSingletonRegistered(token) || this.isScopedRegistered(token);
    }

    isSingletonRegistered<T>(token: DiToken<T>): boolean {
        return this.singletonInstances.has(token.symbol) || this.singletonFactories.has(token.symbol);
    }

    isScopedRegistered<T>(token: DiToken<T>) {
        return this.scopedFactories.has(token.symbol);
    }

    ensureCanBeRegistered<T>(token: DiToken<T>, scope: 'singleton' | 'scoped') {
        if (this.containerOption.overridesBehaviour === "deny" && this.isRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI container`);
        if (scope === 'scoped' && this.isSingletonRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI as Singleton`);
        if (scope === 'singleton' && this.isScopedRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI as Scoped`);
    }

    resolve<T>(token: DiToken<T>): T {
        const instance = this.tryResolve(token);

        if (instance === undefined)
            throw new Error(`The key '${token.symbol.toString()}' was not registered in the DI`);

        return instance;
    }

    tryResolve<T>(token: DiToken<T>): T | undefined {
        const instance = this.tryResolveFrom(token, this.singletonInstances);
        if (instance)
            return instance;

        const newInstance = this.tryResolveFromFactory(token, this.singletonFactories);
        if (newInstance)
            return this.saveSingletonInstance(token, newInstance);

        if (this.scopedFactories.has(token.symbol)) {
            throw new Error(`The key '${token.symbol.toString()}' was registered as Scoped but this container is not scoped. Call 'createScope' first.`);
        }

        return undefined;
    }

    tryResolveScopedFactory<T>(token: DiToken<T>): TypedInstanceFactory<T> | undefined {
        return this.tryResolveFrom<TypedInstanceFactory<T>>(token, this.scopedFactories);
    }

    createScope(): IScopedDiContainer {
        return new ScopedDiContainer(this);
    }

    protected tryResolveFrom<T>(token: DiToken<T>, registrations: Map<symbol, Array<T>>): T | undefined {
        const registeredElements = registrations.get(token.symbol);
        if (registeredElements !== undefined && registeredElements.length > 0) {
            if (this.containerOption.overridesBehaviour === "use-last") {
                return registeredElements[registeredElements.length - 1];
            } else {
                return registeredElements[0];
            }
        }
        return undefined;
    }

    protected tryResolveFromFactory<T>(token: DiToken<T>, registrations: Map<symbol, Array<InstanceFactory>>): T | undefined {
        const registeredElements = registrations.get(token.symbol);
        if (registeredElements !== undefined && registeredElements.length > 0) {
            let factory: InstanceFactory;
            if (this.containerOption.overridesBehaviour === "use-last") {
                factory = registeredElements[registeredElements.length - 1];
            } else {
                factory = registeredElements[0];
            }
            return factory(this);
        }
        return undefined;
    }

    private saveSingletonInstance<T>(token: DiToken<T>, value: T): T {
        let singletonInstances = this.singletonInstances.get(token.symbol);
        if (singletonInstances === undefined) {
            singletonInstances = [];
            this.singletonInstances.set(token.symbol, singletonInstances);
        }
        singletonInstances.push(value);
        return value;
    }
}

export class ScopedDiContainer extends DiContainer {
    private scopedInstances: Map<symbol, any> = new Map<symbol, any>();

    constructor(private readonly parentContainer: IDiContainer) {
        super();
    }

    override registerScoped<T>(token: DiToken<T>, valueOrFactory: TypedInstanceFactory<T> | T): void {
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
