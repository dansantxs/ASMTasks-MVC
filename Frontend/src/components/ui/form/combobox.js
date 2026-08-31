"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon,
} from "lucide-react";

import { cn } from "./utils";

const DIACRITICOS = /[̀-ͯ]/g;

function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(DIACRITICOS, "").toLowerCase();
}

/**
 * Select com campo de busca por digitação, para listas com muitas opções
 * (cliente, colaborador, projeto...). API enxuta e independente do Radix Select:
 *
 *   <Combobox
 *     value={valor}
 *     onValueChange={setValor}
 *     options={[{ value: '1', label: 'Fulano' }, ...]}
 *     placeholder="Selecione o cliente"
 *   />
 *
 * `value` e `option.value` são comparados como string.
 */
export function Combobox({
  value,
  onValueChange,
  options = [],
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhuma opção encontrada.",
  disabled = false,
  className,
  contentClassName,
  id,
  name,
  "aria-invalid": ariaInvalid,
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  const selected = options.find((o) => String(o.value) === String(value ?? ""));

  const filtered = React.useMemo(() => {
    const q = normalizar(query).trim();
    if (!q) return options;
    return options.filter((o) => normalizar(o.label).includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const handleSelect = (v) => {
    onValueChange?.(String(v));
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          data-slot="combobox-trigger"
          data-placeholder={selected ? undefined : ""}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className="line-clamp-1 text-left font-normal">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 w-[var(--radix-popover-trigger-width)] min-w-[8rem] overflow-hidden rounded-md border shadow-md",
            contentClassName,
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((o) => {
                const isSelected = String(o.value) === String(value ?? "");
                return (
                  <button
                    type="button"
                    key={String(o.value)}
                    disabled={o.disabled}
                    onClick={() => handleSelect(o.value)}
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      isSelected && "bg-accent/50",
                    )}
                  >
                    <span className="line-clamp-1">{o.label}</span>
                    {isSelected && <CheckIcon className="absolute right-2 size-4" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default Combobox;
