import type { Either } from "@sweet-monads/either";

export type AdvancedValidator<E, I = any, O = void> = (arg: I) => Either<E, O>;
