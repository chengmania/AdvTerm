// AdvTerm — main terminal view
// Author: chengmania KC3SMW

import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = new Terminal({ cursorBlink: true });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current!);
    fit.fit();

    invoke("pty_create").catch((e) => term.writeln(`\r\n[AdvTerm] PTY error: ${e}`));

    const unlisten = listen<string>("pty-data", (event) => {
      term.write(event.payload);
    });

    term.onData((data) => {
      invoke("pty_write", { data });
    });

    const observer = new ResizeObserver(() => {
      fit.fit();
      invoke("pty_resize", { rows: term.rows, cols: term.cols });
    });
    observer.observe(containerRef.current!);

    return () => {
      unlisten.then((f) => f());
      observer.disconnect();
      term.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh", background: "#000" }} />;
}
