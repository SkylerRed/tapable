import {
    SyncHook, SyncBailHook, SyncLoopHook, SyncWaterfallHook,
    AsyncSeriesHook, AsyncSeriesBailHook, AsyncSeriesLoopHook, AsyncSeriesWaterfallHook,
    AsyncParallelHook, AsyncParallelBailHook
} from 'tapable';
import { sleep } from './utils';

const compilation = {
    assets: {
        'index.js': 'index.js',
        'index.css': 'index.css'
    }
}

interface Compilation {
    assets: Record<string, string>
}

const hooks: Readonly<{
    make: AsyncParallelHook<[Compilation]>;
    finishMake: AsyncParallelHook<[Compilation]>;
}> = {
    make: new AsyncParallelHook<[Compilation]>(["compilation"]),
    finishMake: new AsyncParallelHook<[Compilation]>(["compilation"]),
}

function compile(callback: (err?: Error, compilation?: Compilation) => void) {
    hooks.make.callAsync(compilation, err => {
        if (err) return callback(err);

        hooks.finishMake.callAsync(compilation, err => {
            if (err) return callback(err);
            console.log('done');
            callback(null, compilation);
        });
    });
}

hooks.make.tapPromise('TestPlugin', async (compilation) => {
    await sleep(3000);
    compilation.assets['TestPlugin.js'] = 'TestPlugin.js';
});

hooks.make.tapAsync('Test2Plugin', (compilation, callback) => {
    console.log('make', compilation);
    compilation.assets['Test2Plugin.js'] = 'Test2Plugin.js';
    hooks.finishMake.tapAsync('Test2Plugin', (compilation, cb) => {
        console.log('finishMake', compilation);
        setTimeout(() => {
            callback();
            cb();
        }, 5000);
    });
});

function callback(err?: Error, compilation?: Compilation) {
    if (err) {
        console.log(err);
        return err;
    }

    console.log(compilation);
}

compile(callback);

