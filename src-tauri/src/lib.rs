// AdvTerm — Tauri backend
// Author: chengmania KC3SMW

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

pub struct PtyState {
    writer: Mutex<Option<Box<dyn Write + Send>>>,
}

#[tauri::command]
fn pty_create(app: AppHandle, state: State<Arc<PtyState>>) -> Result<(), String> {
    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
    let cmd = CommandBuilder::new(shell);

    pair.slave
        .spawn_command(cmd)
        .map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    *state.writer.lock().unwrap() = Some(writer);

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app.emit("pty-data", data);
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn pty_write(data: String, state: State<Arc<PtyState>>) -> Result<(), String> {
    let mut guard = state.writer.lock().unwrap();
    if let Some(writer) = guard.as_mut() {
        writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_resize(rows: u16, cols: u16, _state: State<Arc<PtyState>>) -> Result<(), String> {
    // Resize support — master handle needed; tracked for Phase 1 improvement
    let _ = (rows, cols);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_state = Arc::new(PtyState {
        writer: Mutex::new(None),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(pty_state)
        .invoke_handler(tauri::generate_handler![pty_create, pty_write, pty_resize])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
