// app/components/CalculatorFields.tsx

// 🚨 每個函式前面都加上 export
export function Segment({ value, onChange, options }:{
    value:string; onChange:(v:string)=>void; options:{label:string;value:string}[];
  }) {
    return (
      <div className="grid grid-cols-2 rounded-lg border bg-neutral-50 p-1 text-sm">
        {options.map(o=>{
          const active=value===o.value;
          return (
            <button key={o.value} onClick={()=>onChange(o.value)}
              className={`rounded-md py-1.5 ${active?"bg-white shadow-sm font-semibold":"text-neutral-600"}`}>
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

export function Kpi({ label, value }:{label:string; value:string}) {
    return (
      <div className="rounded-xl border bg-white p-4 text-center">
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="mt-1 text-xl font-semibold break-all">{value}</div>
      </div>
    );
  }

export function NumberField({ label, value, onChange, placeholder }:{
    label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
        <input
          type="text" inputMode="numeric"
          value={value}
          onChange={(e)=>onChange(e.target.value.replace(/[^\d]/g,""))}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          placeholder={placeholder || "請輸入數字"}
        />
      </div>
    );
  }

export function CurrencyField({ label, value, onChange, placeholder }:{
    label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
  }) {
    const handleChange = (s: string) => {
      const digits = s.replace(/[^\d]/g, "");
      if (!digits) { onChange(""); return; }
      onChange(Number(digits).toLocaleString());
    };
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e)=>handleChange(e.target.value)}
          onBlur={()=>value && onChange(Number(value.replaceAll(",","")).toLocaleString())}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          placeholder={placeholder || "請輸入金額"}
        />
      </div>
    );
  }

export function PercentField({ label, value, onChange, placeholder }:{
    label:string; value:string; onChange:(v:string)=>void; placeholder?:string;
  }) {
    const handleChange = (s: string) => {
      const cleaned = s.replace(/[^\d.]/g,"").replace(/^(\d*\.\d*).*$/,"$1");
      onChange(cleaned);
    };
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
        <div className="flex items-center">
          <input
            value={value}
            onChange={(e)=>handleChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            placeholder={placeholder || "例如 2 或 2.5"}
            inputMode="decimal"
          />
          <span className="ml-3 text-sm font-medium text-neutral-600">%</span>
        </div>
      </div>
    );
  }

export function Select({ label, value, onChange, options }:{
    label:string; value:string; onChange:(v:string)=>void; options:{label:string; value:string}[];
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">{label}</label>
        <select
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }