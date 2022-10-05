import { ArraySplitTransform } from "./classes/utility-transforms/array-split-transform";
import { ArrayJoinTransform } from "./classes/utility-transforms/array-join-transform";
import { objectUtilityTransforms, UtilityTransforms, utilityTransforms } from "./classes/utility-transforms";
import { SimpleAsyncTransform } from "./classes/simple-async-transform";
import { SimpleTransform } from "./classes/simple-transform";
import { getStreamPipe } from "./classes/stream-pipe";

// class _SimpleStreams {
//     // ArraySplitTransform = ArraySplitTransform
//     // ArrayJoinTransform = ArrayJoinTransform
//     // utility = {
//     //     Transform: UtilityTransforms,
//     //     objectTransforms: objectUtilityTransforms,
//     //     transforms: utilityTransforms
//     // }
//     // SimpleAsyncTransform = SimpleAsyncTransform
//     // SimpleTransform = SimpleTransform
//     // StreamPipe = getStreamPipe

//     utility = new UtilityTransforms({});
//     objectUtility = new UtilityTransforms({objectMode: true});
//     Utility = UtilityTransforms
//     StreamPipe = getStreamPipe
// }

// export const SimpleStreams = new _SimpleStreams();
export const utility = new UtilityTransforms();
export const objectUtility = new UtilityTransforms({objectMode: true});
export const Utility = UtilityTransforms
export const StreamPipe = getStreamPipe

// function SimpleStreams() {
//     return new _SimpleStreams();
// }
  
// SimpleStreams.SimpleStreams = SimpleStreams;
// SimpleStreams.default = SimpleStreams;
// module.exports = SimpleStreams;


