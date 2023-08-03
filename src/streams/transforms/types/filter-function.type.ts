export type FilterFunction<TSource> = (chunk: TSource) => boolean;
export type AsyncFilterFunction<TSource> = (chunk: TSource) => Promise<boolean>;
