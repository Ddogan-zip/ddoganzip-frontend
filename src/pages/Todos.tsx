import { useState } from "react";

export default function Todos() {
  const [items, setItems] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  const add = () => {
    const t = title.trim();
    if (!t) return;
    setItems((prev) => [...prev, t]);
    setTitle("");
  };

  return (
    <div>
      <h1>Todos</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일 입력"
        />
        <button onClick={add}>추가</button>
      </div>
      <ul style={{ paddingLeft: 20 }}>
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
