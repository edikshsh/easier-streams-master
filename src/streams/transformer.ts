import { TransformOptions } from 'stream';
import { FullTransformOptions } from './transforms/types/full-transform-options.type';
import { ErrorTransform } from './errors/error-transform';
import { AsyncTransformFunction } from './transforms/base/simple-async-transform';
import { TransformFunction } from './transforms/base/simple-transform';
import { arraySplitTransform } from './transforms/utility/array-split-transform';
import { callOnDataSyncTransform, callOnDataAsyncTransform } from './transforms/utility/call-on-data-transforms';
import { voidInputTransform } from './transforms/utility/void-input-transform';
import { asyncFilterTransform, FilterOptions, filterTransform } from './transforms/utility/filter-transforms';
import { fromAsyncFunctionTransform, fromFunctionTransform } from './transforms/utility/from-function-transforms';
import {
    fromFunctionConcurrentTransform,
    fromFunctionConcurrentTransform2,
} from './transforms/utility/from-function-concurrent-transform';
import { fromIterable } from './transforms/utility/from-iterable-transform';
import { TypedPassThrough } from './transforms/utility/typed-pass-through';
import { pickElementFromArrayTransform } from './transforms/utility/pick-element-from-array-transform';
import { arrayJoinTransform } from './transforms/utility/array-join-transform';
import { typeFilterTransform } from './transforms/utility/type-filter-transforms';
import { PlumberOptions } from './utility/plumber-options.type';

export class TransformerBase {
    constructor(private defaultTrasformOptions?: TransformOptions) {}

    protected mergeOptions<T>(options?: T) {
        return Object.assign({}, this.defaultTrasformOptions, options);
    }

    errorTransform<T>(options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return new ErrorTransform<T>(finalOptions);
    }
}

export class Transformer extends TransformerBase {
    readonly async: AsyncTransformer;
    constructor(defaultTrasformOptions?: TransformOptions) {
        super(defaultTrasformOptions);
        this.async = new AsyncTransformer(defaultTrasformOptions);
    }

    /**
     *
     * @param length - max length of the created array
     * @param options
     * @returns a transform that creates an array from incoming chunks
     * @example
     * const source = Readable.from([1,2,3]);
     *
     * const arrayJoiner = transformer.arrayJoin<number>(2);
     *
     * source.pipe(arrayJoiner);
     * for await (const elem of arrayJoiner) {
     *     console.log(elem); // [1, 2], [3]
     * }
     */
    arrayJoin<TSource>(length: number, options?: FullTransformOptions<TSource>) {
        const finalOptions = super.mergeOptions(options);
        return arrayJoinTransform<TSource>(length, finalOptions);
    }

    /**
     *
     * @param options
     * @returns a transform that pushes elements of array individually
     * @example
     * const source = Readable.from([
     *     [1, 2, 3],
     *     [4, 5],
     * ]);
     *
     * const arraySplitter = transformer.arraySplit<number>();
     *
     * source.pipe(arraySplitter);
     * for await (const elem of arraySplitter) {
     *     console.log(elem); // 1, 2, 3, 4, 5
     * }
     */
    arraySplit<TSource>(options?: FullTransformOptions<TSource[]>) {
        const finalOptions = this.mergeOptions(options);
        return arraySplitTransform<TSource[]>(finalOptions);
    }

    /**
     *
     * @param functionToCallOnData
     * @param options
     * @returns a transform that does an action on the chunk without modifying it
     * @example
     * const source = Readable.from([1, 2, 3].map((n) => ({ a: n })));
     *
     * const callOnDataTransform = transformer.callOnData((chunk: { a: number }) => {
     *     chunk.a *= 2;
     *     console.log(chunk.a); // 2, 4, 6
     * });
     *
     * source.pipe(callOnDataTransform);
     * for await (const elem of callOnDataTransform) {
     *     console.log(elem.a); // 1, 2, 3
     * }
     */
    callOnData<TSource>(functionToCallOnData: (data: TSource) => void, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return callOnDataSyncTransform<TSource>(functionToCallOnData, finalOptions);
    }

    /**
     *
     * @param options
     * @returns a tranform that removes all chunks
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const voidTransform = transformer.void();
     *
     * source.pipe(voidTransform);
     * for await (const elem of voidTransform) {
     *     console.log(elem); // no output
     * }
     */
    void<TSource>(options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        return voidInputTransform<TSource>(finalOptions);
    }

    /**
     *
     * @param options
     * @returns a transform that passes data as is
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const passThrough = transformer.passThrough();
     * source.pipe(passThrough);
     * for await (const elem of passThrough) {
     *     console.log(elem); // 1, 2, 3
     * }
     */
    passThrough<T>(options?: FullTransformOptions<T>) {
        const finalOptions = this.mergeOptions(options);
        return new TypedPassThrough<T>(finalOptions);
    }

    /**
     *
     * @param filterFunction - function that filters incoming data, passing it only if the filter is true
     * @param options
     * @returns a transform that will remove filtered out chunks
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const filter = transformer.filter((n: number) => n % 2 === 1);
     * source.pipe(filter);
     * for await (const elem of filter) {
     *     console.log(elem); // 1, 3
     * }
     */
    filter<TSource>(
        filterFunction: (chunk: TSource) => boolean,
        options?: FullTransformOptions<TSource> & FilterOptions,
    ) {
        const finalOptions = this.mergeOptions(options);
        return filterTransform<TSource>(filterFunction, finalOptions);
    }

    /**
     *
     * @param filterFunction - function that gets a chunks are returns a boolean
     * @param options
     * @returns 2 transforms, one that gets all the chunks that the filter functions returned true, and one that gets the others
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const fork = transformer.fork((n: number) => n % 2 === 1);
     *
     * fork.filterTrueTransform.on('data', (data) => console.log(`true: ${data}`));
     * fork.filterFalseTransform.on('data', (data) => console.log(`false: ${data}`));
     *
     * source.pipe(fork.filterTrueTransform);
     * source.pipe(fork.filterFalseTransform);
     *
     * await Promise.all([streamEnd(fork.filterTrueTransform), streamEnd(fork.filterFalseTransform)]);
     * // true: 1, false: 2, true: 3
     */
    fork<TSource>(filterFunction: (chunk: TSource) => boolean, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        const filterTrueTransform = filterTransform<TSource>(filterFunction, finalOptions);
        const filterFalseTransform = filterTransform<TSource>((chunk: TSource) => !filterFunction(chunk), finalOptions);

        return {
            filterTrueTransform,
            filterFalseTransform,
        };
    }

    /**
     *
     * @param filterFunction - type guard function
     * @param options
     * @returns a transform that filters chunks and changes the type of the output
     * @example
     * const source = Readable.from(['1', '2', 3]);
     * const takeOnlyStrings = (chunk: unknown): chunk is string => {
     *     return typeof chunk === 'string';
     * };
     * const filter = transformer.typeFilter(takeOnlyStrings);
     * source.pipe(filter);
     * for await (const elem of filter) {
     *     console.log(elem); // 1, 2
     * }
     */
    typeFilter<TSource, TDestination extends TSource>(
        typeGuardFunction: (chunk: TSource) => chunk is TDestination,
        options?: FullTransformOptions<TSource>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return typeFilterTransform(typeGuardFunction, finalOptions);
    }

    /**
     *
     * @param transformer  - function that changes the chunk it gets
     * @param options
     * @returns a transform that changes the chunk it gets and passes forward
     * @example
     * const source = Readable.from([1, 2, 3]);
     *
     * const transform = transformer.fromFunction((n: number) => n + 1);
     * source.pipe(transform);
     * for await (const elem of transform) {
     *     console.log(elem); // 2, 3, 4
     * }
     */
    fromFunction<TSource, TDestination>(
        transformer: TransformFunction<TSource, TDestination | undefined>,
        options?: FullTransformOptions<TSource>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return fromFunctionTransform<TSource, TDestination>(transformer, finalOptions);
    }

    /**
     *
     * @param index - index of array to pick
     * @param options
     * @returns a tranform that takes a certain element from a chunk array
     * @example
     * const source = Readable.from([[1, 2, 3], [4, 5, 6], [7, 8], [9]]);
     *
     * const pickThirdElement = transformer.pickElementFromArray(2);
     * source.pipe(pickThirdElement);
     * for await (const elem of pickThirdElement) {
     *     console.log(elem); // 3, 6
     * }
     */
    pickElementFromArray<T>(index: number, options?: FullTransformOptions<T[]>) {
        const finalOptions = this.mergeOptions(options);
        return pickElementFromArrayTransform(index, finalOptions);
    }

    /**
     *
     * @param iterable
     * @param options
     * @returns transform like Readable.from but type safe
     * @example
     * const source = transformer.fromIterable([1,2,3]);
     * for await (const elem of source) {
     *     console.log(elem); // 1, 2, 3
     * }
     */
    fromIterable<T>(iterable: Iterable<T>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return fromIterable(iterable, finalOptions);
    }
}

export class AsyncTransformer extends TransformerBase {
    /**
     *
     * @param functionToCallOnData
     * @param options
     * @returns a transform that does an async action on the chunk without modifying it
     * @example
     * const source = Readable.from([1, 2, 3].map((n) => ({ a: n })));
     *
     * const callOnDataTransform = transformer.async.callOnData(async (chunk: { a: number }) => {
     *     chunk.a *= 2;
     *     console.log(chunk.a); // 2, 4, 6
     * });
     *
     * source.pipe(callOnDataTransform);
     * for await (const elem of callOnDataTransform) {
     *     console.log(elem.a); // 1, 2, 3
     * }
     */
    callOnData<TSource>(
        functionToCallOnData: (data: TSource) => Promise<void>,
        options?: FullTransformOptions<TSource>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return callOnDataAsyncTransform<TSource>(functionToCallOnData, finalOptions);
    }

    /**
     *
     * @param filterFunction - async function that filters incoming data, passing it only if the filter is true
     * @param options
     * @returns a transform that will remove filtered out chunks
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const filter = transformer.async.filter(async (n: number) => n % 2 === 1);
     * source.pipe(filter);
     * for await (const elem of filter) {
     *     console.log(elem); // 1, 3
     * }
     */
    filter<TSource>(
        filterFunction: (chunk: TSource) => Promise<boolean>,
        options?: FullTransformOptions<TSource> & FilterOptions,
    ) {
        const finalOptions = this.mergeOptions(options);
        return asyncFilterTransform<TSource>(filterFunction, finalOptions);
    }

    /**
     *
     * @param filterFunction - async function that gets a chunks are returns a boolean
     * @param options
     * @returns 2 transforms, one that gets all the chunks that the filter functions returned true, and one that gets the others
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const fork = transformer.async.fork(async (n: number) => n % 2 === 1);
     *
     * fork.filterTrueTransform.on('data', (data) => console.log(`true: ${data}`));
     * fork.filterFalseTransform.on('data', (data) => console.log(`false: ${data}`));
     *
     * source.pipe(fork.filterTrueTransform);
     * source.pipe(fork.filterFalseTransform);
     *
     * await Promise.all([streamEnd(fork.filterTrueTransform), streamEnd(fork.filterFalseTransform)]);
     * // true: 1, false: 2, true: 3
     */
    fork<TSource>(filterFunction: (chunk: TSource) => Promise<boolean>, options?: FullTransformOptions<TSource>) {
        const finalOptions = this.mergeOptions(options);
        const filterTrueTransform = asyncFilterTransform<TSource>(filterFunction, finalOptions);
        const filterFalseTransform = asyncFilterTransform<TSource>(
            async (chunk: TSource) => !(await filterFunction(chunk)),
            finalOptions,
        );

        return {
            filterTrueTransform,
            filterFalseTransform,
        };
    }

    /**
     *
     * @param transformer  - async function that changes the chunk it gets
     * @param options
     * @returns a transform that changes the chunk it gets and passes forward
     * @example
     * const source = Readable.from([1, 2, 3]);
     *
     * const transform = transformer.async.fromFunction(async (n: number) => n + 1);
     * source.pipe(transform);
     * for await (const elem of transform) {
     *     console.log(elem); // 2, 3, 4
     * }
     */
    fromFunction<TSource, TDestination>(
        transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        options?: FullTransformOptions<TSource>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return fromAsyncFunctionTransform<TSource, TDestination>(transformer, finalOptions);
    }

    /**
     *
     * @deprecated please use fromFunctionConcurrent2
     * @param transformer - async function that changes the chunk it gets
     * @param concurrency - number of concurrent running transformer functions
     * @param options
     * @param plumberOptions - options for piping inner transforms
     * @returns a input and output transform
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const { input, output } = transformer.async.fromFunctionConcurrent(async (n: number) => n + 1, 2);
     *
     * source.pipe(input);
     *
     * for await (const elem of output) {
     *    console.log(elem); // 2, 3, 4
     * }
     */
    fromFunctionConcurrent<TSource, TDestination>(
        transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        concurrency: number,
        options?: FullTransformOptions<any>,
        plumberOptions?: PlumberOptions<any>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return fromFunctionConcurrentTransform(transformer, concurrency, finalOptions, plumberOptions);
    }

    /**
     *
     * @param transformer - async function that changes the chunk it gets
     * @param concurrency - number of concurrent running transformer functions
     * @param options
     * @returns a transform that changes the chunk it gets and passes forward
     * @example
     * const source = Readable.from([1, 2, 3]);
     * const concurrentTransform = transformer.async.fromFunctionConcurrent2(async (n: number) => n + 1, 2);
     *
     * source.pipe(concurrentTransform);
     *
     * for await (const elem of concurrentTransform) {
     *    console.log(elem); // 2, 3, 4
     * }
     */
    fromFunctionConcurrent2<TSource, TDestination>(
        transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
        concurrency: number,
        options?: FullTransformOptions<any>,
    ) {
        const finalOptions = this.mergeOptions(options);
        return fromFunctionConcurrentTransform2(transformer, concurrency, finalOptions);
    }

    /**
     *
     * @param iterable
     * @param options
     * @returns transform like Readable.from but type safe
     * @example
     * const source = transformer.async.fromIterable(someAsyncIterator);
     * for await (const elem of source) {
     *     console.log(elem);
     * }
     */
    fromIterable<T>(iterable: AsyncIterable<T>, options?: TransformOptions) {
        const finalOptions = this.mergeOptions(options);
        return fromIterable(iterable, finalOptions);
    }
}

export const transformer = new Transformer({ objectMode: true });
