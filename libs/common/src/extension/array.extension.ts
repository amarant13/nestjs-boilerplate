declare global {
  interface Array<T> {
    isEmpty(): boolean;

    isNotEmpty(): boolean;

    sum(): number;

    hasDuplicates(): boolean;

    distinct(): T[];

    hasCommonElements(items: (T | ConcatArray<T>)[]): boolean;
  }
}

Array.prototype.isEmpty = function (): boolean {
  return this.length === 0;
};

Array.prototype.isNotEmpty = function (): boolean {
  return this.length !== 0;
};

Array.prototype.sum = function (): number {
  return this.reduce((acc: number, cur: number) => acc + cur, 0);
};

Array.prototype.hasDuplicates = function (): boolean {
  const uniqueSet = new Set(this);
  return this.length - uniqueSet.size > 0;
};

Array.prototype.distinct = function <T>(): T[] {
  return [...new Set(this)] as T[];
};

Array.prototype.hasCommonElements = function <T>(
  items: (T | ConcatArray<T>)[],
): boolean {
  const combinedSet = new Set([...this, ...items]);

  return combinedSet.size < this.length + items.length;
};

export {};
