import {Observable} from 'rxjs';

/* !!! THIS FILE IS A COPY OF RXJS AND GETS REMOVED AFTER TESTS !!! */


export function animationFrames(timestampProvider: TimestampProvider = Date) {
  return timestampProvider === Date ? DEFAULT_ANIMATION_FRAMES : animationFramesFactory(timestampProvider);
}

/**
 * Does the work of creating the observable for `animationFrames`.
 * @param timestampProvider The timestamp provider to use to create the observable
 */
function animationFramesFactory(timestampProvider: TimestampProvider) {
  return new Observable<number>(subscriber => {
    let id: number;
    const start = timestampProvider.now();
    const run = () => {
      subscriber.next(timestampProvider.now() - start);
      if (!subscriber.closed) {
        id = requestAnimationFrame(run);
      }
    };
    id = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(id);
    }
  });
}

/**
 * In the common case, where `Date` is passed to `animationFrames` as the default,
 * we use this shared observable to reduce overhead.
 */
const DEFAULT_ANIMATION_FRAMES = animationFramesFactory(Date);

// @TODO delete when decide for rxjs target version
export interface TimestampProvider {
  now(): number;
}
