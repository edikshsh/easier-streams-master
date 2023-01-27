import { range } from "lodash"
import { Readable } from "stream"
import { pipeline } from "stream/promises";
import {transformer} from '../../src/streams/transformer'
import {plumber} from '../../src/streams/plumber'

function getFailOnNumberFunction(input: number, errorText = 'asdf'){
    return (num: number) => {
        if(num === input){
            throw Error(errorText);
        }
        return num;
    }
}

async function sleep(n: number) {
    return new Promise((res) => setTimeout(res, n));
}



(async () => {
    const readable = transformer.fromIterable(range(200));
    // const concurrent = transformer.async.fromFunctionConcurrent2(async (n: number) => n, 2)
    const concurrent = transformer.async.fromFunctionConcurrent(async (n: number) => n, 10)
    const failingTransform = transformer.fromFunction(getFailOnNumberFunction(100));
    const passThrough = transformer.passThrough<number>();
    const writable = transformer.void();

    pipeline(readable, concurrent.input).catch(() => undefined);
    pipeline(concurrent.output, failingTransform, passThrough, writable).catch(() => undefined);
    // pipeline(concurrent.output, failingTransform, passThrough, writable).catch(() => undefined);

    // plumber.pipe({usePipeline: true}, readable, concurrent.input);
    // plumber.pipe({usePipeline: true}, concurrent.output, failingTransform, passThrough, writable);



    // pipeline(readable, concurrent, failingTransform, passThrough, writable).catch(() => undefined);
    // readable.pipe(failingTransform).pipe(passThrough).pipe(writable);
    // plumber.pipe({usePipeline: true}, readable, concurrent, failingTransform, passThrough, writable)

    failingTransform.on('data', console.log)

    // await new Promise<void>((res,rej) => {
    //     readable.on('error', (error) => res())    
    //     readable.on('close', res)    
    // });

    await readable.promisifyEvents(['close', 'error']);

    await sleep(1000);
    console.log('done');
    
})();