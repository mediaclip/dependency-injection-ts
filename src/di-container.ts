import {DiToken, ScopedDiToken} from "./token";
import {
    IDiContainer,
    InstanceFactory,
    IScopedDiContainer, ScopedDiOptions,
    ScopedInstanceFactory,
    TypedInstanceFactory, TypedScopedInstanceFactory
} from "./interfaces";
import {ident} from "./utils";

export type DiContainerOption = {
    overridesBehaviour?: "use-last" | "use-first" | "deny";
    name?: string;
}

export class DiContainer implements IDiContainer {
    protected singletonInstances: Map<symbol, Array<any>> = new Map<symbol, Array<any>>();
    protected singletonFactories: Map<symbol, Array<InstanceFactory>> = new Map<symbol, Array<InstanceFactory>>();
    protected scopedFactories: Map<symbol, Array<ScopedInstanceFactory>> = new Map<symbol, Array<ScopedInstanceFactory>>();
    public readonly containerOption: Readonly<DiContainerOption>;

    constructor(containerOption?: Readonly<DiContainerOption>) {
        this.containerOption = {
            overridesBehaviour: "use-last",
            name: undefined,
            ...containerOption
        };
    }

    registerSingleton<T>(token: DiToken<T>, valueOrFactory: TypedInstanceFactory<T> | T): void {
        this.ensureCanBeRegistered(token, 'singleton');

        if (this.isSingletonFactory(valueOrFactory)) {
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

    isSingletonFactory<T>(valueOrFactory: TypedInstanceFactory<T> | T): valueOrFactory is TypedInstanceFactory<T> {
        return typeof valueOrFactory === "function";
    }

    registerScoped<T>(token: ScopedDiToken<T>, factory: TypedScopedInstanceFactory<T>): void {
        this.ensureCanBeRegistered(token, 'scoped');

        let scopedFactories = this.scopedFactories.get(token.symbol);
        if (scopedFactories === undefined) {
            scopedFactories = [];
            this.scopedFactories.set(token.symbol, scopedFactories);
        }
        scopedFactories.push(factory);
    }

    isRegistered<T>(token: DiToken<T> | ScopedDiToken<T>): boolean {
        return this.isSingletonRegistered(token) || this.isScopedRegistered(token);
    }

    isSingletonRegistered<T>(token: DiToken<T> | ScopedDiToken<T>): boolean {
        return this.singletonInstances.has(token.symbol) || this.singletonFactories.has(token.symbol);
    }

    isScopedRegistered<T>(token: DiToken<T> | ScopedDiToken<T>) {
        return this.scopedFactories.has(token.symbol);
    }

    ensureCanBeRegistered<T>(token: DiToken<T> | ScopedDiToken<T>, scope: 'singleton' | 'scoped') {
        if (this.containerOption.overridesBehaviour === "deny" && this.isRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI container`);
        if (scope === 'scoped' && this.isSingletonRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI as Singleton`);
        if (scope === 'singleton' && this.isScopedRegistered(token))
            throw new Error(`The key '${token.symbol.toString()}' is already registered in the DI as Scoped`);
    }

    resolve<T>(token: DiToken<T>): T {
        try {
            const instance = this.tryResolve(token);

            if (instance === undefined)
                throw new Error(`The key '${token.symbol.toString()}' was not registered in the DI container named '${this.containerOption.name ?? 'unnamed'}'`);

            return instance;
        } catch (e) {
            throw new Error(`Error when resolving '${token.symbol.toString()}' from DI container named '${this.containerOption.name ?? 'unnamed'}':\n${ident(e.toString(), '  ')}`);
        }
    }

    tryResolve<T>(token: DiToken<T>): T | undefined {
        const instance = this.tryResolveFrom(token, this.singletonInstances);
        if (instance)
            return instance;

        const newInstance = this.tryResolveSingletonFromFactory(token);
        if (newInstance)
            return this.saveSingletonInstance(token, newInstance);

        if (this.scopedFactories.has(token.symbol)) {
            throw new Error(`The key '${token.symbol.toString()}' was registered as Scoped but this container is not scoped. Call 'createScope' first.`);
        }

        return undefined;
    }

    tryResolveScopedFactory<T>(token: ScopedDiToken<T>): TypedScopedInstanceFactory<T> | undefined {
        return this.tryResolveFrom<TypedScopedInstanceFactory<T>>(token, this.scopedFactories);
    }

    createScope(options: ScopedDiOptions): IScopedDiContainer {
        return new ScopedDiContainer(this, options);
    }

    protected tryResolveFrom<T>(token: DiToken<T> | ScopedDiToken<T>, registrations: Map<symbol, Array<T>>): T | undefined {
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

    private tryResolveSingletonFromFactory<T>(token: DiToken<T>): T | undefined {
        const registeredElements = this.singletonFactories.get(token.symbol);
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

export class ScopedDiContainer extends DiContainer implements IScopedDiContainer{
    private scopedInstances: Map<symbol, any> = new Map<symbol, any>();

    constructor(
        private readonly parentContainer: DiContainer | ScopedDiContainer,
        private readonly options?: ScopedDiOptions
    ) {
        super({...parentContainer.containerOption, ...options});
    }

    override registerScoped<T>(token: ScopedDiToken<T>, valueOrFactory: TypedScopedInstanceFactory<T> | T): void {
        if (this.isScopedFactory(valueOrFactory))
            super.registerScoped(token, valueOrFactory);
        else {
            this.ensureCanBeRegistered(token, 'scoped');
            this.saveScopeInstances(token, valueOrFactory);
        }
    }

    isScopedFactory<T>(valueOrFactory: TypedScopedInstanceFactory<T> | T): valueOrFactory is TypedScopedInstanceFactory<T> {
        return typeof valueOrFactory === "function";
    }

    override isScopedRegistered<T>(token: DiToken<T> | ScopedDiToken<T>) {
        return super.isScopedRegistered(token) || this.scopedInstances.has(token.symbol);
    }

    override tryResolve<T>(token: DiToken<T> | ScopedDiToken<T>, container?: ScopedDiContainer): T | undefined {
        if (token instanceof ScopedDiToken) {
            const instance = this.tryResolveInstance(token);
            if (instance)
                return instance;

            const newInstance = this.tryResolveScopedFromFactory(token, container);
            if (newInstance)
                return this.saveScopeInstances(token, newInstance);

            const parentScopedFactory = this.parentContainer.tryResolveScopedFactory(token);
            if (parentScopedFactory) {
                return this.saveScopeInstances(token, parentScopedFactory(container ?? this));
            }

            if(this.parentContainer instanceof ScopedDiContainer) {
                const parentInstance = this.parentContainer.tryResolve<T>(token, container);
                if (parentInstance)
                    return parentInstance;
            }

        } else if (token instanceof DiToken) {
            const singletonInstance = super.tryResolve(token);
            if (singletonInstance) {
                return singletonInstance;
            }
            return this.parentContainer.tryResolve<T>(token);
        }
    }

    tryResolveScopedFactory<T>(token: ScopedDiToken<T>): TypedScopedInstanceFactory<T> | undefined {
        return this.tryResolveFrom<TypedScopedInstanceFactory<T>>(token, this.scopedFactories)
            ?? this.parentContainer.tryResolveScopedFactory(token);
    }

    tryResolveInstance<T>(token: ScopedDiToken<T>): T | undefined {
        const instance = this.tryResolveFrom(token, this.scopedInstances);
        if (instance)
            return instance;
        if(this.parentContainer instanceof ScopedDiContainer) {
            const parentInstance = this.parentContainer.tryResolveInstance<T>(token);
            if (parentInstance)
                return parentInstance;
        }
        return undefined;
    }


    private tryResolveScopedFromFactory<T>(token: ScopedDiToken<T>, container?: ScopedDiContainer): T | undefined {
        const registeredElements = this.scopedFactories.get(token.symbol);
        if (registeredElements !== undefined && registeredElements.length > 0) {
            let factory: InstanceFactory;
            if (this.containerOption.overridesBehaviour === "use-last") {
                factory = registeredElements[registeredElements.length - 1];
            } else {
                factory = registeredElements[0];
            }
            return factory(container ?? this);
        }
        return undefined;
    }


    override createScope(options: ScopedDiOptions): IScopedDiContainer {
        return new ScopedDiContainer(this, options);
    }

    private saveScopeInstances<T>(token: ScopedDiToken<T>, value: T): T {
        let scopedInstances = this.scopedInstances.get(token.symbol);
        if (scopedInstances === undefined) {
            scopedInstances = [];
            this.scopedInstances.set(token.symbol, scopedInstances);
        }
        scopedInstances.push(value);
        return value;
    }
}
