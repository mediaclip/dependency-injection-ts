import {DiContainer, DiToken} from "@mediaclip/dependency-injection";

export interface IModule1Service1 {}
export class Module1Service1 implements Module1Service1 {}
export interface IModule1Service2 {}
export class Module1Service2 implements Module1Service2 {}

const moduleTokens = {
    Module1Service1: DiToken.create<IModule1Service1>("Module1Service1"),
    Module1Service2: DiToken.create<IModule1Service2>("Module1Service2"),
};

export class Module1 {

    static register(container: DiContainer) {
        if (container.isRegistered(moduleTokens.Module1Service1))
            return moduleTokens;

        container.registerSingleton(moduleTokens.Module1Service1, new Module1Service1());
        container.registerSingleton(moduleTokens.Module1Service2, new Module1Service2());

        return moduleTokens;
    }
}
