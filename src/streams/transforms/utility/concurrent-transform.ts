import { cloneDeep } from 'lodash';
import { EventEmitter, TransformCallback, TransformOptions } from 'stream';
import { StreamError } from '../../errors/stream-error';
import { getFormattedChunk } from '../../utility/get-formatted-chunk';
import { onTransformError } from '../../utility/on-transform-error';
import { BaseTransform } from '../base/base-transform';
import { AsyncTransformFunction } from '../base/simple-async-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { TypedTransformCallback } from '../types/typed-transform-callback';

function isTruthy<T>(item?: T | null): item is T {
    return item !== undefined && item !== null;
}

export class ConcurrentTransform<TSource, TDestination> extends BaseTransform<TSource, TDestination> {
    itemQueue: TSource[] = [];
    liveWorkers = 0;
    ee: EventEmitter = new EventEmitter();
    itemsDone = 0;

    constructor(
        private transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        private concurrency: number,
        private options?: FullTransformOptions<TSource>,
    ) {
        super(options);
        this.ee.setMaxListeners(concurrency + 5);
    }

    async inputQueueIsEmpty(): Promise<void> {
        return this.itemQueue.length === 0
            ? Promise.resolve()
            : new Promise((res) => this.ee.once('itemQueueEmpty', res));
    }

    async allWorkersFinished(): Promise<void> {
        return this.liveWorkers === 0
            ? Promise.resolve()
            : new Promise((res) => this.ee.once('promiseQueueEmpty', res));
    }

    async startWorker(): Promise<void> {
        if (this.liveWorkers >= this.concurrency) {
            return;
        }
        this.liveWorkers++;
        while ((await this.worker()) === true) undefined;
        this.liveWorkers--;
        if (this.liveWorkers === 0) {
            this.ee.emit('promiseQueueEmpty');
        }
    }

    getItemFromQueue(): TSource | undefined {
        const item = this.itemQueue.shift();
        if (this.itemQueue.length === 0) {
            this.ee.emit('itemQueueEmpty');
        }
        return item;
    }

    async worker(): Promise<boolean> {
        const item = this.getItemFromQueue();
        if (!isTruthy(item)) {
            return false;
        }
        const chunkClone = cloneDeep(item);

        try {
            this.push(await this.transformer(item, this));
            return true;
        } catch (error) {
            this.onWorkerError(error, chunkClone);
        } finally {
            this.itemsDone++;
        }
        return true;
    }

    onWorkerError(error: unknown, chunk: TSource){
        const callback:TypedTransformCallback<TDestination>  = (error, chunk) => {
            if(error){
                return this.destroy(error);
            }
            this.push(chunk);
        }
        return onTransformError(this, error, chunk, callback, this.options);
    }

    async enqueueItems(items: TSource[]): Promise<void> {
        items.forEach((item) => {
            this.itemQueue.push(item);
            void this.startWorker();
        });
        return this.inputQueueIsEmpty();
    }

    async _transform(
        item: TSource,
        encoding: BufferEncoding,
        callback: TypedTransformCallback<TDestination>,
    ): Promise<void> {
        await this.enqueueItems([item]);
        callback();
    }

    async _destroy(error: Error | null, callback: (error: Error | null) => void): Promise<void> {
        this.itemQueue = [];
        await this.onStreamEnd();
        callback(error);
    }

    async _flush(callback: TransformCallback): Promise<void> {
        await this.onStreamEnd();
        callback();
    }

    async _final(callback: (error?: Error | null | undefined) => void): Promise<void> {
        await this.onStreamEnd();
        callback();
    }

    async onStreamEnd() {
        return this.allWorkersFinished();
    }
}
