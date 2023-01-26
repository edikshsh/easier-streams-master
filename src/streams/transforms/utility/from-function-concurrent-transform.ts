import { plumber } from '../../plumber';
import { AsyncTransformFunction } from '../base/simple-async-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';
import { ArrayJoinTransform } from './array-join-transform';
import { ConcurrentTransform } from './concurrent-transform';
import { fromAsyncFunctionTransform } from './from-function-transforms';
import { pickElementFromArrayTransform } from './pick-element-from-array-transform';
import { TypedPassThrough } from './typed-pass-through';
import { PlumbingOptions } from '../../utility/plumber-options.type';
import { transformer } from '../../transformer';

export function fromFunctionConcurrentTransform<TSource, TDestination>(
    transformFunction: AsyncTransformFunction<TSource, TDestination | undefined>,
    concurrency: number,
    transformOptions: FullTransformOptions<any> = {},
) {
    const input = new TypedPassThrough<TSource>(transformOptions);
    const toArray = new ArrayJoinTransform<TSource>(concurrency, transformOptions);
    const pickFromArrayLayer = [...Array(concurrency).keys()].map((a) =>
        pickElementFromArrayTransform<TSource>(a, transformOptions),
    );
    const actionLayer = [...Array(concurrency).keys()].map(() =>
        fromAsyncFunctionTransform(transformFunction, transformOptions),
    );
    const output = new TypedPassThrough<TDestination>(transformOptions);
    plumber.pipe(transformOptions, input, toArray, pickFromArrayLayer, actionLayer, output);
    return { input, output };
}

export function fromFunctionConcurrentTransform2<TSource, TDestination>(
    transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
    concurrency: number,
    options: FullTransformOptions<any> = {},
) {
    return new ConcurrentTransform(transformer, concurrency, options);
}
