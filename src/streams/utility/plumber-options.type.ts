import { ErrorTransformOptions } from "../errors/error-transform-options.type"

export type PlumberOptions<TSource> = PlumbingOptions & ErrorTransformOptions<TSource>

export type PlumbingOptions = {
    usePipeline?: boolean
}