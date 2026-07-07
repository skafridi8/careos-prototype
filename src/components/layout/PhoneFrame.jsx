export default function PhoneFrame({ children }) {
  return (
    <div className="flex w-[340px] shrink-0 flex-col items-center">
      <div className="relative h-[700px] w-[340px] rounded-[2.75rem] border-[10px] border-brand-950 bg-brand-950 shadow-xl">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-brand-950" />
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-brand-50">
          <div className="scrollbar-none flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
      <span className="mt-3 text-xs font-medium text-brand-900/40">Carer mobile app</span>
    </div>
  );
}
