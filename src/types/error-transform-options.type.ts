import { ErrorTransform, StreamError } from "../classes/error-stream";
import { TypedTransform } from "./typed-transform";

export type ErrorTransformOptions<TSource> = {
    errorStream?: ErrorTransform<TSource>
}
