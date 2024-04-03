import {DiContainer, DiToken} from "@mediaclip/dependency-injection";
import {IModule2Service1, IModule2Service2, Module2} from "./modules/module-2";
import {IModule1Service1, IModule1Service2, Module1} from "./modules/module-1";

class App {
    constructor(
        private readonly service1: IModule1Service1,
        private readonly service2: IModule1Service2,
        private readonly service3: IModule2Service1,
        private readonly service4: IModule2Service2,
    ) {
    }
}

const moduleTokens = {
    App: DiToken.create<App>("App")
};

export class AppModule {

    static register(container: DiContainer) {
        const dependencyTokens = DiToken.mergeTokens(
            Module1.register(container),
            Module2.register(container)
        );

        container.registerSingleton(moduleTokens.App, c => new App(
            c.resolve(dependencyTokens.Module1Service1),
            c.resolve(dependencyTokens.Module1Service2),
            c.resolve(dependencyTokens.Module2Service1),
            c.resolve(dependencyTokens.Module2Service2),
        ))

        return DiToken.mergeTokens(dependencyTokens, moduleTokens);
    }
}

const container = new DiContainer();
const tokens = AppModule.register(container);
const app = container.resolve(tokens.App);
