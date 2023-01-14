import { cloneDeep } from "lodash";
import { EventEmitter, TransformCallback, TransformOptions } from "stream";
import { StreamError } from "../../errors/stream-error";
import { BaseTransform } from "../base/base-transform";
import { AsyncTransformFunction } from "../base/simple-async-transform";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { TypedTransformCallback } from "../types/typed-transform-callback";

function isTruthy<T>(item?:T | null): item is T{
    return item !== undefined && item !== null;
}

export class ConcurrentTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination> {

    itemQueue: TSource[] = [];
    outputQueue: Awaited<TDestination>[] = [];
    liveWorkers = 0;
    ee: EventEmitter = new EventEmitter();
    funcStack: string[] = [];

    tempLogInterval: NodeJS.Timer;
    tempStackInterval: NodeJS.Timer;
    itemsDone = 0;

    constructor(private transformer: AsyncTransformFunction<TSource, TDestination | undefined>, private concurrency: number, private options?: FullTransformOptions<TSource>) {
        // const finaloptions = Object.assign({ objectMode: true }, options);

        super(options);
        // if(!this.options?.errorStream){
        //     throw Error('ConcurrentTransform does not support passing ')
        // }
        this.ee.setMaxListeners(concurrency + 5);
        this.tempLogInterval = setInterval(() => console.log(`in: ${this.itemQueue.length} out:${this.outputQueue.length}, done:${this.itemsDone}`), 1000)
        this.tempStackInterval = setInterval(() => console.log(`func stack: ${this.funcStack}`), 1000)
        // setInterval(() => console.log(`aborted: ${finaloptions.signal?.aborted}`), 1000)
    }

    async itemQueueEmptyPromise(): Promise<void> {
        this.funcStack.push(`itemQueueEmptyPromise`)
        this.itemQueue.length === 0 ? await Promise.resolve() : await new Promise(res => this.ee.once('itemQueueEmpty', res));
        this.funcStack.pop();
    }

    async promiseQueueEmptyPromise(): Promise<void> {
        this.funcStack.push(`promiseQueueEmptyPromise`)
        this.liveWorkers === 0 ? await Promise.resolve() : await new Promise(res => this.ee.once('promiseQueueEmpty', res))
        this.funcStack.pop();
    }

    async startWorker(): Promise<void> {
        this.funcStack.push(`startWorker`)
        if (this.liveWorkers >= this.concurrency) {
            this.funcStack.pop();
            return;
        }
        // console.log(`starting new worker`);
        this.liveWorkers++;
        while ((await this.worker()) === true) undefined
        // console.log(`removing worker, ${this.liveWorkers}`);
        this.liveWorkers--;
        if (this.liveWorkers === 0) {
            this.ee.emit('promiseQueueEmpty');
        }
        this.funcStack.pop();
    }

    getItemFromQueue(): TSource | undefined {
        this.funcStack.push(`getItemFromQueue`)
        const item = this.itemQueue.shift();
        if (this.itemQueue.length === 0) {
            this.ee.emit('itemQueueEmpty')
        }
        this.funcStack.pop();
        return item;
    }

    async worker(): Promise<boolean> {
        this.funcStack.push(`worker`)
        const item = this.getItemFromQueue();
        const chunkClone = cloneDeep(item)

        if (!isTruthy(item)) {
            this.funcStack.pop();
            return false;
        }
        try {
            this.push(await this.transformer(item));
            return true;
        } catch (error) {
            const finalError = error instanceof Error ? error : new Error(`${error}`)
            if (this.options?.errorStream) {
                const streamError = new StreamError(finalError, chunkClone);
                this.push(streamError)
            } else {
                this.destroy(finalError);
            }
        } finally {
            this.itemsDone++;
            this.funcStack.pop();
        }
        return true;
    }

    async enqueueItems(items: TSource[]): Promise<void> {
        this.funcStack.push(`enqueueItems`)
        items.forEach(item => {
            this.itemQueue.push(item);
            void this.startWorker();
        })
        const a = await this.itemQueueEmptyPromise();
        this.funcStack.pop();
        return a;
    }

    async _write(item: TSource, encoding: BufferEncoding, callback: (error?: Error) => void): Promise<void> {
        this.funcStack.push(`_write`)
        // this.emit('pause');
        await this.enqueueItems([item]);
        this.funcStack.pop();
        // this.emit('resume');
        callback();
    }

    async _writev(items: { chunk: TSource; encoding: BufferEncoding; }[], callback: (error?: Error) => void): Promise<void> {
        this.funcStack.push(`_writev`)
        // this.emit('pause');
        await this.enqueueItems(items.map(item => item.chunk));
        this.funcStack.pop();
        // this.emit('resume');
        callback();
    }

    async _transform(item: TSource, encoding: BufferEncoding, callback: TypedTransformCallback<TDestination>): Promise<void> {
        // this.emit('pause');
        this.funcStack.push(`_transform`)
        await this.enqueueItems([item]);
        this.funcStack.pop();
        // this.emit('resume');
        // this.emit('drain');

        callback();
    }

    async _destroy(error: Error | null, callback: (error: Error | null) => void): Promise<void> {
        this.itemQueue = [];
        await this.onStreamEnd('_destroy')
        callback(error);
    }

    async _flush(callback: TransformCallback): Promise<void> {
        await this.onStreamEnd('_flush')
        callback();
    }

    async _final(callback: (error?: Error | null | undefined) => void): Promise<void> {
        await this.onStreamEnd('_final')
        callback();
    }

    async onStreamEnd(calledFunc: string) {
        console.log(`ConcurrentTransform7 ${calledFunc}`);
        await this.promiseQueueEmptyPromise();
        console.log(`ConcurrentTransform7 ${calledFunc} after promiseQueueEmptyPromise`);
        clearInterval(this.tempLogInterval);
        clearInterval(this.tempStackInterval);
        console.log(`final - in: ${this.itemQueue.length} out:${this.outputQueue.length}, done:${this.itemsDone}`)
    }
}