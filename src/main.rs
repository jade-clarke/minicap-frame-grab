use clap::Parser;
use std::error::Error;
use std::sync::Arc;
use tokio::sync::Mutex;

mod minicap_client;
mod server;

use bytes::Bytes;
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
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let args = Args::parse();

    let latest_frame: Arc<Mutex<Option<Bytes>>> = Arc::new(Mutex::new(None));
    let latest_fps: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));

    let frame_storage = Arc::clone(&latest_frame);
    let fps_storage = Arc::clone(&latest_fps);
    let connect_addr = args.connect_addr.clone();

    tokio::spawn(async move {
        if let Err(e) = start_frame_reader(&connect_addr, frame_storage, fps_storage).await {
            eprintln!("Error reading frames: {}", e);
        }
    });

    start_server(&args.serve_addr, latest_frame, latest_fps).await?;

    Ok(())
}