const brand = Symbol("brand");

export type Branded<Brand extends string> = {
  [brand]: Brand;
};
