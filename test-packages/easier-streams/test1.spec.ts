import { objectUtility } from "easier-streams";
import { range } from "lodash";
import { Readable } from "stream";


(async () => {
    const a = Readable.from(range(10)).pipe(objectUtility.arrayJoin<number>(3));
    const b = a.pipe(objectUtility.fromFunction((data) => data));
    a.on('data',(data) => console.log(data))
    await a.promisifyEvents(['data'],['error']);
    console.log('done');
})();