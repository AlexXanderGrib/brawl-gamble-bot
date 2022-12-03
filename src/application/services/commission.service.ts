import { createCommissionCalculator } from "@xxhax/bablo";
import { container } from "src/config";

@container.ProvideClass()
export class CommissionService {
  public readonly getCashoutCommission = createCommissionCalculator(
    {
      min: 0,
      max: Infinity,
      fixed: 0,
      percent: 0
    },
    {
      min: 15,
      max: 30,
      percent: 5
    },
    {
      min: 20,
      max: 40,
      fixed: 2
    },
    {
      min: 31,
      fixed: 3,
      percent: 3,
      max: 99
    },
    {
      min: 100,
      fixed: 4,
      percent: 50
    },
    {
      min: 300,
      percent: 10,
      max: 500
    },
    {
      min: 501,
      percent: 90
    }
  );

  public readonly getCurrencyConversionTax = createCommissionCalculator(
    {
      min: 0,
      percent: 13,
      max: 20
    },
    {
      min: 21,
      percent: 40,
      max: 50
    },
    {
      min: 51,
      percent: 90,
      max: 100
    },
    {
      min: 100,
      percent: 99
    }
  );
}
