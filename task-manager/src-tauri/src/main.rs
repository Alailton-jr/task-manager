// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, menu::{MenuBuilder, MenuItemBuilder}, tray::{TrayIconBuilder, TrayIconEvent}};
use std::sync::{Arc, Mutex};
use std::net::TcpListener;
use std::io::{Read, Write};

#[tauri::command]
fn show_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn log_message(msg: String) {
    println!("[DEBUG] {msg}");
}

#[tauri::command]
fn hide_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

#[tauri::command]
async fn start_oauth_server(auth_url: String) -> Result<String, String> {
    // Open browser with auth URL
    if let Err(e) = open::that(&auth_url) {
        return Err(format!("Failed to open browser: {}", e));
    }

    // Start local server to receive OAuth callback
    let listener = TcpListener::bind("127.0.0.1:8888")
        .map_err(|e| format!("Failed to start OAuth server: {}", e))?;

    // Set a timeout for the server
    listener.set_nonblocking(false)
        .map_err(|e| format!("Failed to configure server: {}", e))?;

    // Wait for exactly one connection
    let code = Arc::new(Mutex::new(None::<String>));
    
    if let Ok((mut stream, _)) = listener.accept() {
        let mut buffer = [0u8; 4096];
        if let Ok(size) = stream.read(&mut buffer) {
            let request = String::from_utf8_lossy(&buffer[..size]);
            
            // Parse the authorization code from the request
            if let Some(code_start) = request.find("code=") {
                let code_section = &request[code_start + 5..];
                if let Some(code_end) = code_section.find(|c: char| c == '&' || c.is_whitespace()) {
                    let auth_code = code_section[..code_end].to_string();
                    *code.lock().unwrap() = Some(auth_code.clone());
                    
                    // Send success response to browser
                    let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
                        <html><body>\
                        <h1>Authentication Successful!</h1>\
                        <p>You can close this window and return to the Task Manager app.</p>\
                        <script>window.close();</script>\
                        </body></html>";
                    let _ = stream.write_all(response.as_bytes());
                    let _ = stream.flush();
                    
                    return Ok(auth_code);
                }
            }
            
            // Send error response if code not found
            let response = "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html\r\n\r\n\
                <html><body>\
                <h1>Authentication Failed</h1>\
                <p>Could not retrieve authorization code. Please try again.</p>\
                </body></html>";
            let _ = stream.write_all(response.as_bytes());
        }
    }
    
    Err("Failed to receive OAuth callback".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            // Build tray menu
            let show = MenuItemBuilder::with_id("show", "Show").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&show, &quit])
                .build()?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button, .. } = event {
                        if button == tauri::tray::MouseButton::Left {
                            if let Some(app) = tray.app_handle().get_webview_window("main") {
                                let _ = app.show();
                                let _ = app.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Handle window close event - hide instead of quit
            let window = app.get_webview_window("main").unwrap();
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // Hide window instead of closing
                    let _ = window_clone.hide();
                    api.prevent_close();
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_window, hide_window, start_oauth_server, log_message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}