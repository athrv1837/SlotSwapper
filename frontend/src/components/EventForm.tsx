import { useState } from "react";

export default function EventForm({ onSubmit }: { onSubmit: (p: any) => void }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
      <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
      <button
        onClick={() =>
          onSubmit({
            title,
            start_time: new Date(start).toISOString(),
            end_time: new Date(end).toISOString(),
            status: "BUSY",
          })
        }
      >
        Create
      </button>
    </div>
  );
}
