// on(event: "data", listener: (chunk: any) => void): this;
// on(event: "end", listener: () => void): this;
// on(event: "error", listener: (err: Error) => void): this;

import { EventEmitter } from "stream";
import { TypedEventEmitter } from "../emitters/Emitter"

type StreamPipeEvents<T> = {
    data: (chunk: T) => void,
    end: () => void,
    error: (error: Error) => void
}

describe('TypedEventEmitter', () => {
    it('Should resolve correctly', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents(['data'], []);
    
        ee.emit('data', 12);
        await expect(promise).resolves.toBe(12);
    })
    it('Should reject correctly', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents([], ['error']);
    
        setTimeout(() => ee.emit('error', Error('asdf')), 10);
        await expect(promise).rejects.toThrow(Error('asdf'));
    })
    it('Should not throw if rejected after resolving', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents(['data'], ['error']);

        //Adding a dummy error handler because node passes all "error" events to process unless there is a listener.
        ee.on('error', () => undefined);
    
        debugger;
        setTimeout(() =>  ee.emit('data', 12), 10);
        setTimeout(() => ee.emit('error', Error('asdf12123')), 20);
        await expect(promise).resolves.toBe(12);
        debugger;
    })
})

// async function testTypedEventEmitterPromisify(){
//     const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

//     const promise = ee.promisifyEvents(['data'], ['end']);
//     const promise2 = ee.promisifyEvents(['end'], ['error']);
    
//     promise.then((data) => {
//         console.log(data);
//     }).catch((error) => {
//         console.log(error);
//     })

//     promise2.catch((error: Error) => {
//         console.log(`caught error ${error.name}`);
        
//         console.log(error);
//     });
//     ee.emit('data', 12);
//     ee.emit('error', Error('asdf'));

//     await Promise.all([promise, promise2]).catch((e) => undefined);
//     ee.emit('end');
//     console.log('done');
    
// }
    
// testTypedEventEmitterPromisify();