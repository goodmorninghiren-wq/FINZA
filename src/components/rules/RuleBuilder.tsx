"use client";

import { RuleCondition, ConditionField, ConditionOperator } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface RuleBuilderProps {
    conditions: RuleCondition[];
    matchType: 'AND' | 'OR';
    onChange: (conditions: RuleCondition[], matchType: 'AND' | 'OR') => void;
}

// QBO-style field labels
const FIELDS: { value: ConditionField; label: string; description: string }[] = [
    { value: 'Description', label: 'Bank Text', description: 'Transaction description from bank' },
    { value: 'Payee', label: 'Payee / Name', description: 'Who sent or received money' },
    { value: 'Vendor', label: 'Vendor', description: 'Vendor name in QBO' },
    { value: 'Amount', label: 'Amount', description: 'Transaction amount (absolute value)' },
    { value: 'Type', label: 'Type', description: 'Transaction type category' },
    { value: 'Reference', label: 'Reference / Ref #', description: 'Check or reference number' },
];

const OPERATORS_BY_FIELD: Record<ConditionField, { label: string; value: ConditionOperator }[]> = {
    'Description': [
        { label: 'contains', value: 'contains' },
        { label: 'is exactly', value: 'equals' },
        { label: 'does not contain', value: 'not_contains' },
        { label: 'starts with', value: 'starts_with' },
        { label: 'ends with', value: 'ends_with' },
    ],
    'Payee': [
        { label: 'contains', value: 'contains' },
        { label: 'is exactly', value: 'equals' },
        { label: 'does not contain', value: 'not_contains' },
        { label: 'starts with', value: 'starts_with' },
        { label: 'ends with', value: 'ends_with' },
    ],
    'Vendor': [
        { label: 'contains', value: 'contains' },
        { label: 'is exactly', value: 'equals' },
        { label: 'does not contain', value: 'not_contains' },
        { label: 'starts with', value: 'starts_with' },
        { label: 'ends with', value: 'ends_with' },
    ],
    'Amount': [
        { label: 'is greater than', value: 'gt' },
        { label: 'is less than', value: 'lt' },
        { label: 'is equal to', value: 'eq' },
        { label: 'is at least', value: 'gte' },
        { label: 'is at most', value: 'lte' },
        { label: 'is exactly', value: 'equals' },
    ],
    'Type': [
        { label: 'is exactly', value: 'equals' },
        { label: 'contains', value: 'contains' },
        { label: 'starts with', value: 'starts_with' },
    ],
    'Reference': [
        { label: 'contains', value: 'contains' },
        { label: 'starts with', value: 'starts_with' },
        { label: 'is exactly', value: 'equals' },
    ]
};

export function RuleBuilder({ conditions, matchType, onChange }: RuleBuilderProps) {

    const addCondition = () => {
        const newCondition: RuleCondition = {
            id: Math.random().toString(36).substr(2, 9),
            field: 'Description',
            operator: 'contains',
            value: ''
        };
        onChange([...conditions, newCondition], matchType);
    };

    const removeCondition = (id: string) => {
        onChange(conditions.filter(c => c.id !== id), matchType);
    };

    const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
        onChange(conditions.map(c => {
            if (c.id !== id) return c;
            if (updates.field && updates.field !== c.field) {
                return {
                    ...c,
                    ...updates,
                    operator: OPERATORS_BY_FIELD[updates.field as ConditionField]?.[0]?.value || 'contains'
                };
            }
            return { ...c, ...updates };
        }), matchType);
    };

    return (
        <div className="space-y-2.5 border border-border rounded-xl p-3.5 bg-muted/20">
            {/* Match type selector */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium flex-shrink-0">Match</span>
                <div className="flex rounded-lg border border-border overflow-hidden bg-background">
                    {(['AND', 'OR'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => onChange(conditions, type)}
                            className={`text-xs px-3 py-1.5 font-semibold transition-all ${matchType === type
                                ? type === 'AND'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-amber-500 text-white'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            {type === 'AND' ? 'ALL' : 'ANY'}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">of the following rules</span>
            </div>

            {/* Conditions list */}
            <div className="space-y-2">
                {conditions.map((condition, index) => (
                    <div key={condition.id} className="relative">
                        {/* AND / OR connector badge */}
                        {index > 0 && (
                            <div className="flex items-center justify-center -mt-0.5 mb-1.5">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest ${matchType === 'OR'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                    }`}>
                                    {matchType}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 group">
                            {/* Field */}
                            <Select
                                value={condition.field}
                                onValueChange={(val: ConditionField) => updateCondition(condition.id, { field: val })}
                            >
                                <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-input text-foreground font-medium flex-shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELDS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div>
                                                <p className="text-xs font-medium">{f.label}</p>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Operator */}
                            <Select
                                value={condition.operator}
                                onValueChange={(val: ConditionOperator) => updateCondition(condition.id, { operator: val })}
                            >
                                <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-input text-foreground flex-shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(OPERATORS_BY_FIELD[condition.field] || []).map(op => (
                                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Value */}
                            <Input
                                className="flex-1 h-8 text-xs bg-background border-input text-foreground min-w-0"
                                value={condition.value}
                                onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                                placeholder={
                                    condition.field === 'Amount' ? '0.00' :
                                        condition.field === 'Type' ? 'e.g. Expense' :
                                            'Enter value...'
                                }
                                type={condition.field === 'Amount' ? 'number' : 'text'}
                            />

                            {/* Delete */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                onClick={() => removeCondition(condition.id)}
                                disabled={conditions.length === 1}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Condition */}
            <Button
                size="sm"
                variant="ghost"
                onClick={addCondition}
                className="w-full text-xs h-7 border border-dashed border-border hover:bg-accent hover:border-primary/30 text-muted-foreground hover:text-primary transition-all"
            >
                <Plus className="h-3 w-3 mr-1" /> Add Condition
            </Button>
        </div>
    );
}
