import { pipeHelper } from "../../pipe-helper";
import { AsyncTransformFunction } from "../base/simple-async-transform";
import { FullTransformOptions } from "../types/full-transform-options.type";
import { ArrayJoinTransform } from "./array-join-transform";
import { fromAsyncFunctionTransform } from "./from-function-transforms";
import { pickElementFromArrayTransform } from "./pick-element-from-array-transform";
import { TypedPassThrough } from "./typed-pass-through";


export function fromFunctionConcurrentTransform<TSource, TDestination>(
  transformer: AsyncTransformFunction<TSource, TDestination | undefined>,
  concurrency: number,
  options: FullTransformOptions<any> = {}) {

  const input = new TypedPassThrough<TSource>(options)
  const toArray = new ArrayJoinTransform<TSource>(concurrency, options);
  const pickFromArrayLayer = [...Array(concurrency).keys()].map((a) => pickElementFromArrayTransform<TSource>(a, options))
  const actionLayer = [...Array(concurrency).keys()].map(() => fromAsyncFunctionTransform(transformer, options));
  const output = new TypedPassThrough<TDestination>(options)
  actionLayer.forEach(action => action.on('error', (error) => output.emit('error', error)))

  pipeHelper.pipe(options, input, toArray, pickFromArrayLayer, actionLayer, output);
  return { input, output }
}