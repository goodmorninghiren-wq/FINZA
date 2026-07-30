"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
    value: string;
    label: string;
    sublabel?: string;
}

export interface SearchableSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const selectedOption = useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase().trim();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(q) ||
                (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
                opt.value.toLowerCase().includes(q)
        );
    }, [options, searchQuery]);

    const handleSelect = (val: string) => {
        onValueChange(val);
        setOpen(false);
        setSearchQuery("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between h-9 text-xs px-3 bg-background border-input text-foreground font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                        !value && "text-muted-foreground font-normal",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[--radix-popover-trigger-width] min-w-[260px] p-0 bg-popover border border-border shadow-xl rounded-xl z-[100] overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* Search Bar */}
                <div className="flex items-center px-3 border-b border-border/80 bg-muted/20 sticky top-0 z-10">
                    <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-9 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-foreground placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="p-1 hover:text-foreground text-muted-foreground rounded"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Options List */}
                <div
                    className="max-h-[260px] overflow-y-auto p-1 space-y-0.5 overscroll-contain touch-pan-y"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                            No matching options found.
                        </div>
                    ) : (
                        filteredOptions.map((opt, idx) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={`${opt.value}-${idx}`}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors",
                                        isSelected
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "hover:bg-accent text-foreground"
                                    )}
                                >
                                    <div className="flex flex-col truncate pr-2">
                                        <span className="truncate">{opt.label}</span>
                                        {opt.sublabel && (
                                            <span className="text-[10px] text-muted-foreground font-normal truncate">
                                                {opt.sublabel}
                                            </span>
                                        )}
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
