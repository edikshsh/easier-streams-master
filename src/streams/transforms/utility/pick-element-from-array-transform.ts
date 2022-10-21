import { FullTransformOptions } from "../types/full-transform-options.type";
import { fromFunctionTransform } from "./from-function-transforms";


export function pickElementFromArrayTransform<T>(index: number, options?: FullTransformOptions<T[]>) {
    return fromFunctionTransform((arr: T[]) => arr[index], options)
}
