import * as Rx from "rxjs";
import { bufferTime } from "rxjs/operators";

export class BufferStream<T> {
    _subject = new Rx.Subject<T>();

    constructor(time: number, onNext: (value: T[]) => void) {
        this._subject
            .pipe(bufferTime(time))
            .subscribe((value) => {
                value && value.length && onNext(value);
            });
    }

    next(value: T) {
        this._subject.next(value);
    }
}