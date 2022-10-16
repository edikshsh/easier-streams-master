import { TransformOptions } from "stream";
import { ErrorTransformOptions } from "./error-transform-options.type";

export type FullTransformOptions<TSource> = TransformOptions & ErrorTransformOptions<TSource>;
