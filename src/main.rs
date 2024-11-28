use adb_control::ADBControl;
use bytes::Bytes;
use clap::Parser;
use models::Stats;
use std::error::Error;
use std::sync::Arc;
use tokio::signal;
use tokio::sync::{Mutex, Notify};

mod minicap_client;
mod models;
mod server;

use minicap_client::start_frame_reader;
use server::start_server;

/// A simple application to read frames from Minicap and serve them over HTTP.
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// The address to connect to (e.g., 127.0.0.1:1717)
    #[arg(short, long, default_value = "127.0.0.1:1717")]
    connect_addr: String,

    /// The address to serve on (e.g., 127.0.0.1:3000)
    #[arg(short, long, default_value = "127.0.0.1:3000")]
    serve_addr: String,

    /// The device name to connect to
    #[arg(short, long, default_value = "")]
    device_name: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();
    let adb_control = Arc::new(Mutex::new(ADBControl::new(
        None,
        Some(args.device_name.clone()),
    )));

    // Shared data for frame and FPS storage
    let latest_frame: Arc<Mutex<Option<Bytes>>> = Arc::new(Mutex::new(None));
    let latest_stats = Arc::new(Mutex::new(Stats {
        frame_count: 0,
        last_frame_time: std::time::Instant::now(),
    }));

    // Create a notify signal for shutdown
    let shutdown_notify = Arc::new(Notify::new());
    let frame_storage = Arc::clone(&latest_frame);
    let connect_addr = args.connect_addr.clone();
    let latest_stats_clone = Arc::clone(&latest_stats);

    // Clone the shutdown notify for each task to avoid ownership issues
    let shutdown_signal_frame_reader = Arc::clone(&shutdown_notify);
    let shutdown_signal_server = Arc::clone(&shutdown_notify);

    // Spawn the frame reader task
    let frame_reader_handle = tokio::spawn(async move {
        if let Err(e) = start_frame_reader(&connect_addr, frame_storage, latest_stats).await {
            eprintln!("Error reading frames: {}", e);
            shutdown_signal_frame_reader.notify_waiters(); // Notify on error
        }
    });

    // Spawn the server task with graceful shutdown handling
    let server_handle = tokio::spawn(async move {
        if let Err(e) = start_server(&args.serve_addr, latest_frame, latest_stats_clone, adb_control).await {
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
