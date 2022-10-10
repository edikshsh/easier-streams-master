import cloneDeep from "lodash.clonedeep";
import { TransformOptions } from "stream";
import { streamsManyToOneController } from "./concurrent-stream-output-ender";
import { AsyncTransformFunction, SimpleAsyncTransform } from "./simple-async-transform";
import { SimpleTransform, TransformFunction } from "./simple-transform";
import { TypedPassThrough } from "./TypedPassThrough";
import { ArrayJoinTransform } from "./utility-transforms/array-join-transform";
import { ArraySplitTransform } from "./utility-transforms/array-split-transform";

export class UtilityTransforms {
    constructor(private defaultTrasformOptions?: TransformOptions) { }

    private mergeOptions(options?: TransformOptions) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    arrayJoin<TSource>(length: number, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArrayJoinTransform<TSource>(length, finalOptions);
    }

    arraySplit<TSource>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ArraySplitTransform<TSource[]>(finalOptions);
    }

    callOnDataSync<TSource>(functionToCallOnData: (data: TSource) => void,
        options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = (data: TSource) => {
            const dataCopy = cloneDeep(data);
            functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleTransform(callOnData, finalOptions);
    }

    callOnDataAsync<TSource>(functionToCallOnData: (data: TSource) => Promise<void>,
        options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = async (data: TSource) => {
            const dataCopy = cloneDeep(data);
            await functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleAsyncTransform(callOnData, finalOptions);
    }

    void<TSource>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, void>(() => undefined, finalOptions);
    }

    filter<TSource>(filterFunction: (chunk: TSource) => boolean, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        const filter = (chunk: TSource) => {
            try {
                return filterFunction(chunk) ? chunk : undefined
            } catch {
                return undefined;
            }
        }
        return new SimpleTransform<TSource, TSource>(filter, finalOptions);
    }

    fromFunction<TSource, TDestination>(transformer: TransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, TDestination>(transformer, finalOptions);
    }

    fromAsyncFunction<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleAsyncTransform<TSource, TDestination>(transformer, finalOptions);
    }

    passThrough<T>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new TypedPassThrough<T>(finalOptions)
    }

    pickElementFromArray<T>(index: number, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return this.fromFunction((arr: T[]) => arr[index], finalOptions)
    }

    fromFunctionConcurrent<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, concurrency: number, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);

        const input = this.passThrough<TSource>(finalOptions)
        const toArray = this.arrayJoin(concurrency, finalOptions);
        const pickFromArrayLayer = [...Array(concurrency).keys()].map((a) => this.pickElementFromArray<TSource[]>(a, finalOptions))
        const actionLayer = [...Array(concurrency).keys()].map(() => this.fromAsyncFunction(transformer), finalOptions);
        const output = this.passThrough<number>(finalOptions)
        streamsManyToOneController(actionLayer, output);

        input.pipe(toArray);
        pickFromArrayLayer.forEach(picker => toArray.pipe(picker));
        actionLayer.forEach((action, index) => pickFromArrayLayer[index].pipe(action))
        actionLayer.forEach(action => {
            action.pipe(output, { end: false });
            action.on('error', (error) => output.emit('error', error));
        });


        return { input, output }
    }

}

export const utilityTransforms = new UtilityTransforms();
export const objectUtilityTransforms = new UtilityTransforms({ objectMode: true });
