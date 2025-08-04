export function counter(count: number): number[] {
    //Returns an array with the numbers 0 through number. This is useful
    //for creating for loops with a set length inside of *ngFor directives
    return Array.from({ length: count }, (_, i) => i);
}