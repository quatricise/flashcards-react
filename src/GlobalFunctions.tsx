export function waitFor(durationMS: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, durationMS);
  });
}