"use client";

import { Flame, Library, Settings, Shapes, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReadingMode = "lateral" | "vertical";
type ReadingTheme = "claro" | "escuro" | "sepia";
type Highlight = { page: number; color: string; note?: string };

type Book = {
  id: string;
  title: string;
  author: string;
  url: string;
  pages: number;
  uploaderHash: string;
};

type UserBook = {
  progressPage: number;
  highlights: Highlight[];
  addedAt: string;
  weeklyGoal: number;
  streak: number;
};

const COMMON_BOOKS: Book[] = [
  {
    id: "1",
    title: "Noites de Âmbar",
    author: "Aiko M.",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    pages: 30,
    uploaderHash: "seed",
  },
  {
    id: "2",
    title: "Cartas de uma Livraria",
    author: "Luiz H.",
    url: "https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf",
    pages: 42,
    uploaderHash: "seed",
  },
];

const HIGHLIGHT_COLORS = ["#C9A84C", "#8B4513", "#A0522D"];

const sha256 = async (text: string) => {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T) : fallback;
};

const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

export default function HomePage() {
  const [pin, setPin] = useState("");
  const [userHash, setUserHash] = useState("");
  const [tab, setTab] = useState<"shelf" | "catalog" | "settings">("shelf");
  const [catalog, setCatalog] = useState<Book[]>(COMMON_BOOKS);
  const [shelf, setShelf] = useState<Record<string, UserBook>>({});
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>("lateral");
  const [theme, setTheme] = useState<ReadingTheme>("escuro");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    setCatalog(read<Book[]>("catalog-books", COMMON_BOOKS));
  }, []);

  useEffect(() => {
    if (!userHash) return;
    setShelf(read<Record<string, UserBook>>(`shelf-${userHash}`, {}));
  }, [userHash]);

  useEffect(() => {
    if (!userHash) return;
    write(`shelf-${userHash}`, shelf);
  }, [shelf, userHash]);

  useEffect(() => {
    write("catalog-books", catalog);
  }, [catalog]);

  const activeBook = useMemo(() => catalog.find((book) => book.id === activeBookId) ?? null, [catalog, activeBookId]);

  const unlock = async () => {
    if (pin.length < 4 || pin.length > 6) return;
    const hash = await sha256(pin);
    const users = read<string[]>("users", []);
    if (!users.includes(hash)) {
      write("users", [...users, hash]);
    }
    setUserHash(hash);
  };

  const addToShelf = (book: Book) => {
    if (shelf[book.id]) return;
    setShelf((old) => ({
      ...old,
      [book.id]: {
        progressPage: 1,
        highlights: [],
        addedAt: new Date().toISOString(),
        weeklyGoal: 50,
        streak: 1,
      },
    }));
  };

  const uploadBook = async (file: File) => {
    if (file.size > 15 * 1024 * 1024 || file.type !== "application/pdf" || !userHash) {
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler o PDF"));
      reader.readAsDataURL(file);
    });

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.pdf$/i, ""),
      author: "Upload da comunidade",
      url: dataUrl,
      pages: 100,
      uploaderHash: userHash,
    };

    setCatalog((old) => [newBook, ...old]);
  };

  if (!userHash) {
    return (
      <main className="pin-screen">
        <h1>Âmbar</h1>
        <p>Biblioteca particular de colecionador.</p>
        <div className="pin-display">{pin.replace(/\d/g, "●") || "••••"}</div>
        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0, "OK"].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === "←") return setPin((old) => old.slice(0, -1));
                if (key === "OK") return unlock();
                if (pin.length < 6) setPin((old) => `${old}${String(key)}`);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="home-header">
        <h1>Minha Biblioteca</h1>
        <div className="streak">
          <Flame size={16} /> {Math.max(...Object.values(shelf).map((item) => item.streak), 0)} dias
        </div>
      </header>

      {tab === "shelf" && (
        <section className="book-grid">
          {Object.keys(shelf).length === 0 && <p className="empty">Nenhum livro ainda. Adicione no acervo.</p>}
          {catalog
            .filter((book) => shelf[book.id])
            .map((book, idx) => {
              const info = shelf[book.id];
              const progress = Math.round((info.progressPage / book.pages) * 100);
              return (
                <article key={book.id} className="book-card" style={{ animationDelay: `${idx * 80}ms` }}>
                  <button onClick={() => setActiveBookId(book.id)}>
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                    <small>{progress}% lido</small>
                    <div className="progress" style={{ width: `${progress}%` }} />
                  </button>
                </article>
              );
            })}
        </section>
      )}

      {tab === "catalog" && (
        <section>
          <label className="upload">
            <Upload size={16} /> Enviar PDF (máx. 15MB)
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadBook(file);
              }}
            />
          </label>

          <div className="book-grid">
            {catalog.map((book, idx) => (
              <article key={book.id} className="book-card" style={{ animationDelay: `${idx * 80}ms` }}>
                <strong>{book.title}</strong>
                <span>{book.author}</span>
                <small>{book.pages} páginas</small>
                <button className="add-button" onClick={() => addToShelf(book)}>
                  Adicionar à prateleira
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="settings">
          <h2>Configurações de leitura</h2>
          <label>
            Direção
            <select value={mode} onChange={(event) => setMode(event.target.value as ReadingMode)}>
              <option value="lateral">Lateral</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
          <label>
            Tema
            <select value={theme} onChange={(event) => setTheme(event.target.value as ReadingTheme)}>
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
              <option value="sepia">Sépia</option>
            </select>
          </label>
          <p>PIN hash: <code>{userHash.slice(0, 16)}...</code></p>
        </section>
      )}

      <nav className="bottom-nav">
        <button onClick={() => setTab("shelf")} className={tab === "shelf" ? "active" : ""}>
          <Library size={16} /> Prateleira
        </button>
        <button onClick={() => setTab("catalog")} className={tab === "catalog" ? "active" : ""}>
          <Shapes size={16} /> Acervo
        </button>
        <button onClick={() => setTab("settings")} className={tab === "settings" ? "active" : ""}>
          <Settings size={16} /> Perfil
        </button>
      </nav>

      {activeBook && (
        <Reader
          key={activeBook.id}
          book={activeBook}
          initial={shelf[activeBook.id]}
          onClose={(next) => {
            setShelf((old) => ({ ...old, [activeBook.id]: next }));
            setActiveBookId(null);
          }}
          mode={mode}
          theme={theme}
        />
      )}
    </main>
  );
}

function Reader({
  book,
  initial,
  onClose,
  mode,
  theme,
}: {
  book: Book;
  initial: UserBook;
  onClose: (next: UserBook) => void;
  mode: ReadingMode;
  theme: ReadingTheme;
}) {
  const [page, setPage] = useState(initial?.progressPage ?? 1);
  const [weeklyGoal, setWeeklyGoal] = useState(initial?.weeklyGoal ?? 50);
  const [highlights, setHighlights] = useState<Highlight[]>(initial?.highlights ?? []);
  const [newNote, setNewNote] = useState("");

  const close = () => {
    onClose({
      progressPage: page,
      highlights,
      addedAt: initial?.addedAt ?? new Date().toISOString(),
      weeklyGoal,
      streak: (initial?.streak ?? 0) + 1,
    });
  };

  return (
    <div className={`reader theme-${theme}`}>
      <div className="reader-top">
        <strong>{book.title}</strong>
        <button onClick={close}>Fechar</button>
      </div>

      <div className={`reader-frame ${mode}`}>
        <iframe src={book.url} title={book.title} />
      </div>

      <div className="reader-menu">
        <label>
          Página atual
          <input type="range" min={1} max={book.pages} value={page} onChange={(event) => setPage(Number(event.target.value))} />
        </label>
        <p>{Math.round((page / book.pages) * 100)}% concluído</p>

        <label>
          Meta semanal (páginas)
          <input
            type="number"
            min={10}
            step={5}
            value={weeklyGoal}
            onChange={(event) => setWeeklyGoal(Number(event.target.value))}
          />
        </label>

        <div className="highlight-row">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              className="dot"
              style={{ background: color }}
              onClick={() => setHighlights((old) => [...old, { page, color, note: newNote }])}
            />
          ))}
          <input value={newNote} onChange={(event) => setNewNote(event.target.value)} placeholder="Anotação do trecho" />
        </div>

        <ul>
          {highlights.map((item, index) => (
            <li key={`${item.page}-${index}`}>
              <span style={{ color: item.color }}>●</span> pág. {item.page} {item.note ? `— ${item.note}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
