"use client";

import { SelectableChip } from "@/components/ui/Chip";
import { COUNTRIES } from "@/lib/constants";

export function CountryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COUNTRIES.map((country) => (
        <SelectableChip
          key={country.code}
          selected={value.includes(country.code)}
          onClick={() =>
            onChange(
              value.includes(country.code)
                ? value.filter((c) => c !== country.code)
                : [...value, country.code],
            )
          }
        >
          {country.flag} {country.name}
        </SelectableChip>
      ))}
    </div>
  );
}
