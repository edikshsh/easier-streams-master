export type TypedTransformFunction<TSource, TDestination> = (item: TSource) => (TDestination | Promise<TDestination> | undefined);

// const a: TypedTransformFunction<number, string> = (a: number) => Promise.resolve('asd');