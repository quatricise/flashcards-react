export function waitFor(durationMS: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved');
    }, durationMS);
  });
}

export function sum(...numbers: number[]): number {
  let sum = 0
  for(const num of numbers) {
    sum += num
  }
  return sum
}

export function clamp(num: number, min: number, max: number): number {
  if(num < min) return min
  if(num > max) return max
  return num
}