"use client";

import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Block, HiddenProps } from "@/lib/types";
import {
  evaluateExpression,
  extractFormatWrapper,
  formatComputedValue,
  buildTopLevelValueMap,
  buildItemisationRowValueMap,
  resolveItemAggregations,
} from "@/lib/itemisation/expression";

interface Props {
  block: Block;
  allValues: Record<string, unknown>;
  formBlocks: Block[];
}

export default function HiddenInput({ block, allValues, formBlocks }: Props) {
  const p = block.properties as HiddenProps;
  const { register, setValue, getValues } = useFormContext();

  // Detect itemisation context early — needed by both static and computed modes
  const isInsideItemisation = block.id.includes(".");

  // Static / queryParam mode
  useEffect(() => {
    if (p.expression) return; // handled by computed mode below

    // Inside an itemisation row, the row initializer may have already
    // seeded a per-item value — don't overwrite it.
    if (isInsideItemisation && !p.queryParam) {
      const current = getValues(block.id);
      if (current !== undefined && current !== "") return;
    }

    let value = p.defaultValue ?? "";

    if (p.queryParam && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qpValue = params.get(p.queryParam);
      if (qpValue !== null) {
        value = qpValue;
      }
    }

    setValue(block.id, value);
  }, [block.id, p.defaultValue, p.queryParam, p.expression, setValue, isInsideItemisation, getValues]);

  const valueMap = useMemo(() => {
    if (!p.expression) return {};
    if (isInsideItemisation) {
      return buildItemisationRowValueMap(block.id, allValues, formBlocks);
    }
    return buildTopLevelValueMap(allValues, formBlocks, block.id);
  }, [p.expression, isInsideItemisation, block.id, allValues, formBlocks]);

  const computedValue = useMemo(() => {
    if (!p.expression) return undefined;

    // DIMS({Label1}, {Label2}, {Label3}) — format as LxBxH
    const dimsMatch = p.expression.trim().match(/^DIMS\(\{([^}]+)\},\s*\{([^}]+)\},\s*\{([^}]+)\}\)$/);
    if (dimsMatch) {
      const a = valueMap[dimsMatch[1].trim()] ?? 0;
      const b = valueMap[dimsMatch[2].trim()] ?? 0;
      const c = valueMap[dimsMatch[3].trim()] ?? 0;
      return `${a}x${b}x${c}`;
    }

    const { innerExpr, format: wrapperFormat } = extractFormatWrapper(p.expression);
    // Resolve ITEM_* aggregations before evaluating the expression
    const resolved = isInsideItemisation ? innerExpr : resolveItemAggregations(innerExpr, allValues, formBlocks);
    const num = evaluateExpression(resolved, valueMap);

    if (p.format === "currency") {
      const formatted = wrapperFormat
        ? formatComputedValue(num, wrapperFormat, p.decimalPlaces ?? 2)
        : num.toFixed(p.decimalPlaces ?? 2);
      return `${p.currencySymbol ?? "$"}${formatted}`;
    }
    if (wrapperFormat) {
      return formatComputedValue(num, wrapperFormat, p.decimalPlaces);
    }
    if (p.format === "number") {
      return num.toFixed(p.decimalPlaces ?? 2);
    }
    return String(num);
  }, [p.expression, p.format, p.currencySymbol, p.decimalPlaces, valueMap]);

  useEffect(() => {
    if (computedValue !== undefined) {
      setValue(block.id, computedValue);
    }
  }, [block.id, computedValue, setValue]);

  return <input type="hidden" {...register(block.id)} />;
}
