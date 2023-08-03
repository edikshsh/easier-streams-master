import { SimpleAsyncTransform } from '../base/simple-async-transform';
import { SimpleTransform } from '../base/simple-transform';
import { AsyncFilterFunction, FilterFunction } from '../types/filter-function.type';
import { FullTransformOptions } from '../types/full-transform-options.type';

export type FilterOptions = {
    considerErrorAsFilterOut?: boolean;
};

export function filterTransform<TSource>(
    filterFunction: FilterFunction<TSource>,
    options?: FullTransformOptions<TSource> & FilterOptions,
) {
    const filter = (chunk: TSource) => {
        try {
            return filterFunction(chunk) ? chunk : undefined;
        } catch (error) {
            onFilterError(error, options?.considerErrorAsFilterOut);
        }
    };
    return new SimpleTransform<TSource, TSource>(filter, options);
}

export function asyncFilterTransform<TSource>(
    filterFunction: AsyncFilterFunction<TSource>,
    options?: FullTransformOptions<TSource> & FilterOptions,
) {
    const filter = async (chunk: TSource) => {
        try {
            return (await filterFunction(chunk)) ? chunk : undefined;
        } catch (error) {
            onFilterError(error, options?.considerErrorAsFilterOut);
        }
    };
    return new SimpleAsyncTransform<TSource, TSource>(filter, options);
}

function onFilterError(error: unknown, considerErrorAsFilterOut?: boolean) {
    if (considerErrorAsFilterOut) {
        return undefined;
    }
    throw error;
}
