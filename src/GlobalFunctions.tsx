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

export function randomFloatFromTo(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomIntFromTo(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min)
}

export function downloadJSON(data: Record<string, unknown>, filename = "data.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function getCurrentDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}