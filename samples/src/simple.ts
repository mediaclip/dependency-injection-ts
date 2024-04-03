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
