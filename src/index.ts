import { Transformer, transformer } from './streams/transformer';
import { SimpleAsyncTransform } from './streams/transforms/base/simple-async-transform';
import { SimpleTransform } from './streams/transforms/base/simple-transform';
import { getStreamPipe } from './streams/stream-pipe';
import { plumber } from './streams/plumber';
import { BaseTransform } from './streams/transforms/base/base-transform';
import { TypedTransform } from './streams/transforms/typed-transform/typed-transform.interface';
import { ArrayJoinTransform } from './streams/transforms/utility/array-join-transform';
import { ArraySplitTransform } from './streams/transforms/utility/array-split-transform';
import {
    callOnDataAsyncTransform,
    callOnDataSyncTransform,
} from './streams/transforms/utility/call-on-data-transforms';
import { asyncFilterTransform, filterTransform } from './streams/transforms/utility/filter-transforms';
import { typeFilterTransform } from './streams/transforms/utility/type-filter-transforms';
import { fromFunctionConcurrentTransform } from './streams/transforms/utility/from-function-concurrent-transform';
import {
    fromAsyncFunctionTransform,
    fromFunctionTransform,
} from './streams/transforms/utility/from-function-transforms';
import { fromIterable } from './streams/transforms/utility/from-iterable-transform';
import { pickElementFromArrayTransform } from './streams/transforms/utility/pick-element-from-array-transform';
import { TypedPassThrough } from './streams/transforms/utility/typed-pass-through';
import { TypedEventEmitter } from './emitters/Emitter';
import { voidInputTransform } from './streams/transforms/utility/void-input-transform';
import { ErrorTransform } from './streams/errors/error-transform';
import { StreamError } from './streams/errors/stream-error';

const StreamPipe = getStreamPipe;
export {
    transformer,
    Transformer,
    plumber,
    StreamPipe,
    SimpleTransform,
    SimpleAsyncTransform,
    BaseTransform,
    TypedTransform,
    ArrayJoinTransform,
    ArraySplitTransform,
    callOnDataSyncTransform,
    callOnDataAsyncTransform,
    filterTransform,
    asyncFilterTransform,
    typeFilterTransform,
    fromFunctionConcurrentTransform,
    fromFunctionTransform,
    fromAsyncFunctionTransform,
    fromIterable,
    pickElementFromArrayTransform,
    TypedPassThrough,
    TypedEventEmitter,
    voidInputTransform,
    ErrorTransform,
    StreamError,
};
