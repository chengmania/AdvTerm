// AdvTerm — Tauri backend
// Author: chengmania KC3SMW

use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager, State};

struct TabPty {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
}

pub struct PtyState {
    tabs: Mutex<HashMap<String, TabPty>>,
}

// Stores the --cwd arg so pty_create can pass it directly to CommandBuilder
pub struct InitialCwdState(Mutex<Option<String>>);

#[tauri::command]
fn get_initial_cwd(state: State<Arc<InitialCwdState>>) -> Option<String> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn pty_create(
    tab_id: String,
    command: Option<String>,
    cwd: Option<String>,
    app: AppHandle,
    state: State<Arc<PtyState>>,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;

    let launch = command
        .unwrap_or_else(|| std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string()));
    let mut cmd = CommandBuilder::new(&launch);
    if let Some(ref dir) = cwd {
        cmd.cwd(dir);
    }
    pair.slave
        .spawn_command(cmd)
        .map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    state.tabs.lock().unwrap().insert(tab_id.clone(), TabPty {
        writer,
        master: pair.master,
    });

    let event_name = format!("pty-data-{}", tab_id);
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app.emit(&event_name, data);
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn pty_write(tab_id: String, data: String, state: State<Arc<PtyState>>) -> Result<(), String> {
    let mut tabs = state.tabs.lock().unwrap();
    if let Some(tab) = tabs.get_mut(&tab_id) {
        tab.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_resize(tab_id: String, rows: u16, cols: u16, state: State<Arc<PtyState>>) -> Result<(), String> {
    let tabs = state.tabs.lock().unwrap();
    if let Some(tab) = tabs.get(&tab_id) {
        tab.master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn pty_close(tab_id: String, state: State<Arc<PtyState>>) -> Result<(), String> {
    state.tabs.lock().unwrap().remove(&tab_id);
    Ok(())
}

// Session save / restore

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SessionTab {
    pub title:   String,
    pub profile: String,
}

#[tauri::command]
fn session_save(tabs: Vec<SessionTab>, app: AppHandle) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("session.json");
    let json = serde_json::to_string_pretty(&tabs).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn session_load(app: AppHandle) -> Result<Vec<SessionTab>, String> {
    let path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("session.json");
    if !path.exists() { return Ok(vec![]); }
    let json = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&json).map_err(|e| e.to_string())
}

// Generic profile-agnostic helpers

#[tauri::command]
fn check_command_exists(name: String) -> bool {
    std::process::Command::new("which")
        .arg(&name)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
fn check_file_exists(path: String) -> bool {
    let home = std::env::var("HOME").unwrap_or_default();
    let expanded = path.replace('~', &home);
    std::path::Path::new(&expanded).exists()
}

#[tauri::command]
fn run_headless(program: String, args: Vec<String>) -> Result<String, String> {
    let output = std::process::Command::new(&program)
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pty_state = Arc::new(PtyState {
        tabs: Mutex::new(HashMap::new()),
    });

    // Parse --cwd before building the app so it's available in managed state
    let initial_cwd: Option<String> = {
        let args: Vec<String> = std::env::args().collect();
        args.iter().position(|a| a == "--cwd")
            .and_then(|pos| args.get(pos + 1))
            .cloned()
    };
    let cwd_state = Arc::new(InitialCwdState(Mutex::new(initial_cwd)));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(pty_state)
        .manage(cwd_state)
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_icon(tauri::include_image!("icons/icon.png"));
            }
            // AppImages run with a stripped PATH — restore common user-local bin dirs
            // so that `which claude`, `which aider`, etc. work correctly.
            let home = std::env::var("HOME").unwrap_or_default();
            let current_path = std::env::var("PATH").unwrap_or_default();
            let extra = [
                format!("{home}/.local/bin"),
                format!("{home}/.npm-global/bin"),
                format!("{home}/.cargo/bin"),
                format!("{home}/.opencode/bin"),
                format!("{home}/.nvm/bin"),
                "/usr/local/bin".to_string(),
            ];
            let augmented = format!("{}:{}", extra.join(":"), current_path);
            std::env::set_var("PATH", augmented);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            pty_create,
            pty_write,
            pty_resize,
            pty_close,
            get_initial_cwd,
            check_command_exists,
            check_file_exists,
            run_headless,
            session_save,
            session_load,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
