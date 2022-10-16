import cloneDeep from "lodash.clonedeep";
import { Readable, TransformOptions } from "stream";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { ErrorTransform } from "./error-stream";
import { pipeHelper } from "./pipe-helper";
import { AsyncTransformFunction, SimpleAsyncTransform } from "./simple-async-transform";
import { SimpleTransform, TransformFunction } from "./simple-transform";
import { TypedPassThrough } from "./TypedPassThrough";
import { ArrayJoinTransform } from "./utility-transforms/array-join-transform";
import { ArraySplitTransform } from "./utility-transforms/array-split-transform";

// export type UtilityTransformsOptions<TSource> = {
//     errorStream?: TypedTransform<StreamError<TSource>, unknown>
// }

// type FilterOptions = {
//     filterOutOnError?: boolean;
// }

// function getDefaultFilterOptions():FilterOptions{
//     return {
//         filterOutOnError: true,
//     }
// }

export class UtilityTransforms {
    constructor(private defaultTrasformOptions?: TransformOptions) { }

    private mergeOptions<T>(options?: T) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    // pipeErrorTransform<TSource, TDestination>(srcTransform: TypedTransform<TSource, TDestination>, errorTransform: TypedTransform<StreamError<TSource>, unknown>, options?: TransformOptions){
    //     const id = v4();
    //     srcTransform.pipe(this.filter(passStreamError(id))).pipe(errorTransform);
    //     return srcTransform.pipe(this.filter(filterOutStreamError(id))); 
    // }

    arrayJoin<TSource>(length: number, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return new ArrayJoinTransform<TSource>(length, finalOptions);
    }

    arraySplit<TSource>(options?: FullTransformOptions<TSource[]>) {
        const finalOptions = this.mergeOptions(options);
        return new ArraySplitTransform<TSource[]>(finalOptions);
    }

    callOnDataSync<TSource>(functionToCallOnData: (data: TSource) => void,
        options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = (data: TSource) => {
            const dataCopy = cloneDeep(data);
            functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleTransform(callOnData, finalOptions);
    }

    callOnDataAsync<TSource>(functionToCallOnData: (data: TSource) => Promise<void>,
        options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        const callOnData = async (data: TSource) => {
            const dataCopy = cloneDeep(data);
            await functionToCallOnData(dataCopy);
            return data;
        }
        return new SimpleAsyncTransform(callOnData, finalOptions);
    }

    void<TSource>(options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, void>(() => undefined, finalOptions);
    }

    filter<TSource>(filterFunction: (chunk: TSource) => boolean, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        const filter = (chunk: TSource) => {
            try {
                return filterFunction(chunk) ? chunk : undefined
            } catch (error) {
                if (finalOptions.errorStream) {
                    throw error
                }
                return undefined;
            }
        }
        return new SimpleTransform<TSource, TSource>(filter, finalOptions);
    }

    fromFunction<TSource, TDestination>(transformer: TransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleTransform<TSource, TDestination>(transformer, finalOptions);
    }

    fromAsyncFunction<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return new SimpleAsyncTransform<TSource, TDestination>(transformer, finalOptions);
    }

    passThrough<T>(options?: FullTransformOptions<T>) {
        const finalOptions = this.mergeOptions(options);
        return new TypedPassThrough<T>(finalOptions)
    }

    pickElementFromArray<T>(index: number, options?: FullTransformOptions<T[]>) {
        const finalOptions = this.mergeOptions(options);
        return this.fromFunction((arr: T[]) => arr[index], finalOptions)
    }

    fromFunctionConcurrent<TSource, TDestination>(
        transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
         concurrency: number,
          options?: FullTransformOptions<any>) {
        const finalOptions = this.mergeOptions(options);

        const input = this.passThrough<TSource>(finalOptions)
        const toArray = this.arrayJoin<TSource>(concurrency, finalOptions);
        const pickFromArrayLayer = [...Array(concurrency).keys()].map((a) => this.pickElementFromArray<TSource>(a, finalOptions))
        const actionLayer = [...Array(concurrency).keys()].map(() => this.fromAsyncFunction(transformer), finalOptions);
        const output = this.passThrough<TDestination>(finalOptions)
        actionLayer.forEach(action => action.on('error', (error) => output.emit('error', error)))

        pipeHelper.pipe(finalOptions, input, toArray, pickFromArrayLayer, actionLayer, output);
        return { input, output }
    }

    fromIterable<T>(iterable: Iterable<T>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return Readable.from(iterable).pipe(this.passThrough<T>(finalOptions))
    }

    errorTransform<T>(options?: TransformOptions){
        const finalOptions = this.mergeOptions(options);
        return new ErrorTransform<T>(finalOptions);
    }

}

export const utilityTransforms = new UtilityTransforms();
export const objectUtilityTransforms = new UtilityTransforms({ objectMode: true });
