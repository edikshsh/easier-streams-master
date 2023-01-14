import { ErrorTransform } from './error-transform';

export type ErrorTransformOptions<TSource> = {
    errorStream?: ErrorTransform<TSource>;
    chunkFormatter?: (chunk: TSource) => unknown;
};
