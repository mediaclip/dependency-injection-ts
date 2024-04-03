import {DiContainer, DiToken} from "@mediaclip/dependency-injection";

export interface IModule2Service1 {}
export class Module2Service1 implements Module2Service1 {}
export interface IModule2Service2 {}
export class Module2Service2 implements Module2Service2 {}

const moduleTokens = {
    Module2Service1: DiToken.create<IModule2Service1>("Module2Service1"),
    Module2Service2: DiToken.create<IModule2Service2>("Module2Service2"),
};

export class Module2 {

    static register(container: DiContainer) {
        if (container.isRegistered(moduleTokens.Module2Service1))
            return moduleTokens;

        container.registerSingleton(moduleTokens.Module2Service1, new Module2Service1());
        container.registerSingleton(moduleTokens.Module2Service2, new Module2Service2());

        return moduleTokens;
    }
}
