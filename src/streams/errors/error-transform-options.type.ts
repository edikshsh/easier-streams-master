export type ErrorTransformOptions<TSource> = {
    shouldPushErrorsForward?: boolean;
    chunkFormatter?: (chunk: TSource) => unknown;
    ignoreErrors?: boolean;
};
