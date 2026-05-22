/**
 * Concurrency limiter — execução paralela com cap.
 */

export function pLimit(concurrency: number) {
  const queue: Array<() => void> = [];
  let active = 0;

  const next = () => {
    active--;
    if (queue.length > 0) {
      const fn = queue.shift()!;
      fn();
    }
  };

  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(
          (v) => { resolve(v); next(); },
          (e) => { reject(e); next(); },
        );
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
  };
}
