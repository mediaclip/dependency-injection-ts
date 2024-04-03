import {DiContainer, DiToken} from "@mediaclip/dependency-injection";
interface IService1 {
    id: string;
}
class Service1 implements IService1 {
    id = Math.floor(Math.random() * 10000).toString(16).padStart(4, '0');
}
interface IService2 {
    id: string;
}
class Service2 implements IService2 {
    id = Math.floor(Math.random() * 10000).toString(16).padStart(4, '0');
}
interface IService3 { printId(): void }
class Service3 implements IService3 {
    constructor(
        private readonly service1: IService1,
        private readonly service2: IService2
    ) {
    }

    printId() {
        console.log("Service3: Service 1: " + this.service1.id + " Service 2: " + this.service2.id)
    }
}

let tokenService1 = DiToken.create<IService1>('Service1')
let tokenService2 = DiToken.create<IService2>('Service2')
let tokenService3 = DiToken.create<IService3>('Service3')

let container = new DiContainer();
container.registerSingleton(tokenService1, new Service1());
container.registerScoped(tokenService2, c => new Service2());
container.registerScoped(tokenService3, c => new Service3(
    c.resolve(tokenService1),
    c.resolve(tokenService2)
));

for (let i = 0; i < 3; i++) {
    const scopedContainer = container.createScope();
    const service3 = scopedContainer.resolve(tokenService3)
    service3.printId();
}
console.log('Service 1: ' + container.resolve(tokenService1).id);
console.log('Service 1: ' + container.resolve(tokenService1).id);

/*
Output:
Service3: Service 1: 1adf Service 2: 200b
Service3: Service 1: 1adf Service 2: 238b
Service3: Service 1: 1adf Service 2: 244a
Service 1: 1adf
Service 1: 1adf
*/
