// import { EventEmitter } from "stream";
// import { eventPromisifier } from "./eventPromisifier";
// import { IPromisifiableEvents } from "./promisifiableEvents";

// export class PromisifiableEventListener  implements IPromisifiableEvents {
//     constructor(protected emitter: EventEmitter) {
//     }

//     async promisifyEvents(resolveEvents: string[] = [], rejectEvents: string[] = []): Promise<unknown> {
//         return eventPromisifier._promisifyEvents(this.emitter, resolveEvents, rejectEvents);
//     }
// }