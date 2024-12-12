use adb_control::ADBControl;
use clap::Parser;
use std::error::Error;
use std::sync::Arc;
use tokio::signal;
use tokio::sync::{Mutex, Notify};

mod models;
mod minicap_client;
mod web_server;

use minicap_client::start_frame_reader;
use web_server::start_server;

/// A simple application to read frames from Minicap and serve them over HTTP.
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// The address to connect to (e.g., 127.0.0.1:1717)
    #[arg(short, long, default_value = "127.0.0.1:1717")]
    connect_addr: String,

    /// The address to serve on (e.g., 127.0.0.1:3000)
    #[arg(short, long, default_value = "127.0.0.1:57321")]
    serve_addr: String,

    /// The address to serve on (e.g., 127.0.0.1:3000)
    #[arg(short, long, default_value = "127.0.0.1:64987")]
    aq_addr: String,

    /// The device name to connect to
    #[arg(short, long, default_value = "")]
    device_name: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();

    // initialize the AppState
    let app_state = Arc::new(models::AppState {
        config: models::Config {
            aq_addr: args.aq_addr.clone(),
        },
        frame_storage: Mutex::new(None),
        stats_storage: Mutex::new(models::Stats {
            frame_count: 0,
            last_frame_time: std::time::Instant::now(),
        }),
        adb_control: Mutex::new(ADBControl::new(None, Some(args.device_name.clone()))),
    });

    // Create a notify signal for shutdown
    let shutdown_notify = Arc::new(Notify::new());
    let connect_addr = args.connect_addr.clone();

    // Clone the shutdown notify for each task to avoid ownership issues
    let shutdown_signal_frame_reader = Arc::clone(&shutdown_notify);
    let shutdown_signal_server = Arc::clone(&shutdown_notify);

    // ensure the minicap server is port forwarded
    let mut adb_control = app_state.adb_control.lock().await;
    let _ = adb_control.port_forward("tcp:1717", "localabstract:minicap");
    drop(adb_control);

    // Spawn the frame reader task
    let frame_reader_state = app_state.clone();
    let frame_reader_handle = tokio::spawn(async move {
        if let Err(e) = start_frame_reader(&connect_addr, frame_reader_state).await {
            eprintln!("Error reading frames: {}", e);
            shutdown_signal_frame_reader.notify_waiters(); // Notify on error
        }
    });

    // Spawn the server task with graceful shutdown handling
    let server_handle_state = app_state.clone();
    let server_handle = tokio::spawn(async move {
        if let Err(e) = start_server(&args.serve_addr, server_handle_state).await {
            eprintln!("Error in server: {}", e);
            shutdown_signal_server.notify_waiters(); // Notify on error
        }
    });

    // Wait for either a signal or an error to occur
    tokio::select! {
        _ = frame_reader_handle => {
            eprintln!("Frame reader task ended. Shutting down...");
            shutdown_notify.notify_waiters();
        }
        _ = server_handle => {
            eprintln!("Server task ended. Shutting down...");
            shutdown_notify.notify_waiters();
        }
        _ = signal::ctrl_c() => {
            eprintln!("Received CTRL+C. Shutting down...");
            shutdown_notify.notify_waiters();
        }
    }

    Ok(())
}
