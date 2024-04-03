# Dependency injection

A library for a simple strongly typed dependency injection.

It supports Singleton and Scoped registrations and guarantee at compile time that everything as been registered.

## Example

Simple example with singletons only. You need to create a token to register a service in the container, and then you can use this token to resolve the service.
You can register a service with it's instance directly or with a factory.
The first parameter of the factory is the `IDiContainer` so you can use this to resolve other services if you have a service depending on naother one.

```ts
import {DiContainer, DiToken} from "@mediaclip/dependency-injection";

interface IService1 {}
class Service1 implements IService1 {}
interface IService2 {}
class Service2 implements IService2 {}
interface IService3 {}
class Service3 implements IService3 {
    constructor(
        private readonly service1: IService1,
        private readonly service2: IService2
    ) {
    }
}

let tokenService1 = DiToken.create<IService1>('Service1')
let tokenService2 = DiToken.create<IService2>('Service2')
let tokenService3 = DiToken.create<IService3>('Service3')

let container = new DiContainer();
container.registerSingleton(tokenService1, new Service1());
container.registerSingleton(tokenService2, new Service2());
container.registerSingleton(tokenService3, c => new Service3(
    c.resolve(tokenService1),
    c.resolve(tokenService2)
));

const service3 = container.resolve(tokenService3)
```

## Scoped vs Singleton

When registering a service on the container you can either register it as `singleton` or as `scoped`.
A singleton service will only be instantiated once, and a scoped service will have one instance of each scope.
A scope is created by calling `container.createScope()`

Example: See [sample](samples/src/scoped.ts)

## Module patterns

To avoid having a big file with the configuration of all the DI, it's preferable to split this into multiple files, kind of 1 module / folder or per things that go together.


Example: See [sample](samples/src/module.ts)
