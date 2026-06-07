import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [localValue, setLocalValue] = React.useState(defaultValue);
  const activeValue = value !== undefined ? value : localValue;
  
  const handleValueChange = React.useCallback((val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setLocalValue(val);
    }
  }, [onValueChange]);

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-900 p-1 text-zinc-500 dark:text-zinc-400", className)} 
      {...props} 
    />
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within a Tabs component");
  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive 
          ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-sm" 
          : "hover:text-zinc-900 dark:hover:text-zinc-100",
        className
      )}
      {...props}
    />
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within a Tabs component");
  const isActive = context.value === value;

  if (!isActive) return null;

  return (
    <div 
      className={cn("mt-2 focus-visible:outline-none", className)} 
      {...props}
    >
      {children}
    </div>
  )
}
