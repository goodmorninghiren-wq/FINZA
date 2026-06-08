"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FadeInSectionProps extends React.ComponentPropsWithoutRef<"section"> {
    children: ReactNode;
}

export function FadeInSection({ children, className, ...props }: FadeInSectionProps) {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            {...props}
            className={cn(
                "transition-all duration-700 ease-out",
                visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                className
            )}
        >
            {children}
        </section>
    );
}
