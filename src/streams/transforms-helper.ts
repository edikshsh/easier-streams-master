import cloneDeep from "lodash.clonedeep";
import { Readable, TransformOptions } from "stream";
import { FullTransformOptions } from "./transforms/types/full-transform-options.type";
import { ErrorTransform } from "./errors/error-transform";
import { pipeHelper } from "./pipe-helper";
import { AsyncTransformFunction, SimpleAsyncTransform } from "./transforms/base/simple-async-transform";
import { SimpleTransform, TransformFunction } from "./transforms/base/simple-transform";
import { ArraySplitTransform } from "./transforms/utility/array-split-transform";
import { callOnDataSyncTransform, callOnDataAsyncTransform } from "./transforms/utility/call-on-data-transforms";
import { voidInputTransform } from "./transforms/utility/void-input-transform";
import { asyncFilterTransform, filterTransform } from "./transforms/utility/filter-transforms";
import { fromAsyncFunctionTransform, fromFunctionTransform } from "./transforms/utility/from-function-transforms";
import { fromFunctionConcurrentTransform } from "./transforms/utility/from-function-concurrent-transform";
import { fromIterable } from "./transforms/utility/from-iterable-transform";
import { TypedPassThrough } from "./transforms/utility/typed-pass-through";
import { pickElementFromArrayTransform } from "./transforms/utility/pick-element-from-array-transform";
import { ArrayJoinTransform } from "./transforms/utility/array-join-transform";
import { typeFilterTransform } from "./transforms/utility/type-filter-transforms";




export class TransformsHelperBase {
    constructor(private defaultTrasformOptions?: TransformOptions) { }

    protected mergeOptions<T>(options?: T) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    errorTransform<T>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ErrorTransform<T>(finalOptions);
    }

}


export class TransformsHelper extends TransformsHelperBase {

    readonly async: AsyncTransformsHelper;
    constructor(defaultTrasformOptions?: TransformOptions) {
        super(defaultTrasformOptions);
        this.async = new AsyncTransformsHelper(defaultTrasformOptions);
     }

    arrayJoin<TSource>(length: number, options?: FullTransformOptions<TSource>) {
        const finalOptions = super.mergeOptions(options);
        return new ArrayJoinTransform<TSource>(length, finalOptions);
    }

    arraySplit<TSource>(options?: FullTransformOptions<TSource[]>) {
        const finalOptions = this.mergeOptions(options);
        return new ArraySplitTransform<TSource[]>(finalOptions);
    }

    callOnDataSync<TSource>(functionToCallOnData: (data: TSource) => void,
        options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return callOnDataSyncTransform<TSource>(functionToCallOnData, finalOptions)
    }

    void<TSource>(options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return voidInputTransform<TSource>(finalOptions);
    }

    passThrough<T>(options?: FullTransformOptions<T>) {
        const finalOptions = this.mergeOptions(options);
        return new TypedPassThrough<T>(finalOptions)
    }

    filter<TSource>(filterFunction: (chunk: TSource) => boolean, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return filterTransform<TSource>(filterFunction, finalOptions);
    }

    typeFilter<TSource, TDestination extends TSource>(filterFunction: (chunk: TSource) => chunk is TDestination, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return typeFilterTransform(filterFunction, finalOptions);
    }

    fromFunction<TSource, TDestination>(transformer: TransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return fromFunctionTransform<TSource, TDestination>(transformer, finalOptions);
    }

    pickElementFromArray<T>(index: number, options?: FullTransformOptions<T[]>) {
        const finalOptions = this.mergeOptions(options);
        return pickElementFromArrayTransform(index, finalOptions);
    }

    fromIterable<T>(iterable: Iterable<T>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return fromIterable(iterable, finalOptions);
    }

}


export class AsyncTransformsHelper extends TransformsHelperBase {
    callOnData<TSource>(functionToCallOnData: (data: TSource) => Promise<void>,
        options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return callOnDataAsyncTransform<TSource>(functionToCallOnData, finalOptions)
    }

    filter<TSource>(filterFunction: (chunk: TSource) => Promise<boolean>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return asyncFilterTransform<TSource>(filterFunction, finalOptions);
    }

    fromFunction<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return fromAsyncFunctionTransform<TSource, TDestination>(transformer, finalOptions);
    }

    fromFunctionConcurrent<TSource, TDestination>(
        transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        concurrency: number,
        options?: FullTransformOptions<any>) {
        const finalOptions = this.mergeOptions(options);
        return fromFunctionConcurrentTransform(transformer, concurrency, finalOptions);
    }

    fromIterable<T>(iterable: AsyncIterable<T>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return fromIterable(iterable, finalOptions);
    }
}


export const transformsHelper = new TransformsHelper();

export const objectTransformsHelper = new TransformsHelper({ objectMode: true });
