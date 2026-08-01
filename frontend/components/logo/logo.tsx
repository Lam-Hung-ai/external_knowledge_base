export function Logo() {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap font-mono font-semibold uppercase tracking-wider text-black">
      <span className="shrink-0 text-neutral-400">{"//"}</span>

      <span className="truncate whitespace-nowrap group-data-[collapsible=icon]:hidden">
        EXT KNOWLEDGE
      </span>
    </div>
  );
}
