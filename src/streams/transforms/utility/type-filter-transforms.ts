import { SimpleTransform } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export function typeFilterTransform<TSource, TDestination extends TSource>(
    typeFilterFunction: (chunk: TSource) => chunk is TDestination,
    options?: FullTransformOptions<TSource>,
) {
    const filter = (chunk: TSource) => {
        try {
            return typeFilterFunction(chunk) ? chunk : undefined;
        } catch (error) {
            if (options?.shouldPushErrorsForward) {
                throw error;
            }
            return undefined;
        }
    };
    return new SimpleTransform<TSource, TDestination>(filter, options);
}