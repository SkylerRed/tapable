import {
    SyncHook, SyncBailHook, SyncLoopHook, SyncWaterfallHook,
    AsyncSeriesHook, AsyncSeriesBailHook, AsyncSeriesLoopHook, AsyncSeriesWaterfallHook,
    AsyncParallelHook, AsyncParallelBailHook
} from 'tapable';
import { sleep } from './utils.js';

const TestPlugin = 'TestPlugin';

// class MyPlugin {
//     apply(compiler) {
//         compiler.hooks.done.tap('MyPlugin', (stats) => {
//             console.log('MyPlugin done', stats);
//         });
//     }
// }

interface Addition {
    bb?: string
}

class Compiler {
    compilation: Compilation

    hooks = {
        thisCompilation: new SyncHook<[string, number]>(["compilation", "compilationParams"]),
        shouldEmit: new SyncBailHook(["compilation"]),
        make: new AsyncParallelHook(["compilation"]),
        afterCompile: new AsyncSeriesHook<Compilation, Addition>(["compilation"]),
    }

    constructor() {
        this.compilation = new Compilation()
    }
}

class Compilation {
    assets: Assets
    module: Module
    modules: Module[]

    hooks = {
        buildModule: new SyncHook<string>(["module"]),
        optimizeModules: new SyncBailHook(["modules"]),
        optimizeAssets: new AsyncSeriesHook(["assets"]),
        assetPath: new SyncWaterfallHook(["stats"]),
    }

    constructor() {
        this.assets = new Assets()
    }
}


class Assets {

}

class Module {
    constructor() {

    }
}


const compiler = new Compiler()

compiler.hooks.afterCompile.tapPromise({
    name: TestPlugin,
    bb: 'bb'
}, async (compilation) => {
    await sleep(2000)
    compilation.hooks.optimizeAssets.tapAsync(TestPlugin, (assets, callback) => {
        console.log('optimizeAssets', assets);
        callback()
    })
    return Promise.reject(111)
})

compiler.hooks.afterCompile.intercept({
    register: (tapInfo) => {
        console.log('intercept register', tapInfo)
        return {
            ...tapInfo,
            name: 'intercept register'
        }
    },
    call: (tapInfo, fn) => {
        console.log('intercept call', tapInfo)
        return fn()
    }
})

compiler.hooks.afterCompile.callAsync(compiler.compilation, (err, result) => {
    if (err) {
        console.error(`user hooks error: ${err}`);
    } else {
        console.log(`user return success with result: ${result}`);
    }
})