export interface Converter<A, B> {
  fromA(a: A): B;
  fromB?(b: B): A;
  applyB2A?(a: A, b: B): A;
}
