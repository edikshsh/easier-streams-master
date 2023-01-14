import { SimpleAsyncTransform } from '../base/simple-async-transform';
import { SimpleTransform } from '../base/simple-transform';
import { FullTransformOptions } from '../types/full-transform-options.type';

export function filterTransform<TSource>(
    filterFunction: (chunk: TSource) => boolean,
    options?: FullTransformOptions<TSource>,
) {
    const filter = (chunk: TSource) => {
        try {
            return filterFunction(chunk) ? chunk : undefined;
        } catch (error) {
            if (options?.errorStream) {
                throw error;
            }
            return undefined;
        }
    };
    return new SimpleTransform<TSource, TSource>(filter, options);
}

export function asyncFilterTransform<TSource>(
    filterFunction: (chunk: TSource) => Promise<boolean>,
    options?: FullTransformOptions<TSource>,
) {
    const filter = async (chunk: TSource) => {
        try {
            return (await filterFunction(chunk)) ? chunk : undefined;
        } catch (error) {
            if (options?.errorStream) {
                throw error;
            }
            return undefined;
        }
    };
    return new SimpleAsyncTransform<TSource, TSource>(filter, options);
}
