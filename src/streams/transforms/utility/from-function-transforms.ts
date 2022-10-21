import { AsyncTransformFunction, SimpleAsyncTransform } from "../base/simple-async-transform";
import { SimpleTransform, TransformFunction } from "../base/simple-transform";
import { FullTransformOptions } from "../types/full-transform-options.type";


export function fromFunctionTransform<TSource, TDestination>(transformer: TransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
    return new SimpleTransform<TSource, TDestination>(transformer, options);
}


export function fromAsyncFunctionTransform<TSource, TDestination>(transformer: AsyncTransformFunction<TSource, TDestination | undefined>, options?: FullTransformOptions<TSource>) {
    return new SimpleAsyncTransform<TSource, TDestination>(transformer, options);
}