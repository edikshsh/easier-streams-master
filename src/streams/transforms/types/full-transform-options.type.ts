import { TransformOptions } from 'stream';
import { ErrorTransformOptions } from '../../errors/error-transform-options.type';

export type FullTransformOptions<TSource> = TransformOptions & ErrorTransformOptions<TSource>;
