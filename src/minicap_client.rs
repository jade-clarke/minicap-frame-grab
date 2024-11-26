use bytes::Bytes;
use std::error::Error;
use std::sync::Arc;
use tokio::io::AsyncReadExt;
use tokio::net::TcpStream;
use tokio::sync::Mutex;

use crate::models::Stats;

pub struct MinicapClient {
    stream: TcpStream,
    banner_parsed: bool,
}

impl MinicapClient {
    pub async fn new(addr: &str) -> Result<Self, Box<dyn Error>> {
        let stream = TcpStream::connect(addr).await?;
        Ok(Self {
            stream,
            banner_parsed: false,
        })
    }

    pub async fn read_frame(&mut self) -> Result<Bytes, Box<dyn Error>> {
        if !self.banner_parsed {
            self.parse_banner().await?;
        }

        // Read frame length (4 bytes)
        let frame_length = self.read_exact_u32_le().await?;

        // Read frame data
        let mut frame_data = vec![0u8; frame_length as usize];
        self.stream.read_exact(&mut frame_data).await?;

        Ok(Bytes::from(frame_data))
    }

    async fn parse_banner(&mut self) -> Result<(), Box<dyn Error>> {
        // The banner is 24 bytes long
        let mut banner = [0u8; 24];
        self.stream.read_exact(&mut banner).await?;
        // You can parse the banner data if needed
        self.banner_parsed = true;
        Ok(())
    }

    async fn read_exact_u32_le(&mut self) -> Result<u32, Box<dyn Error>> {
        let mut buf = [0u8; 4];
        self.stream.read_exact(&mut buf).await?;
        Ok(u32::from_le_bytes(buf))
    }
}

pub async fn start_frame_reader(
    connect_addr: &str,
    frame_storage: Arc<Mutex<Option<Bytes>>>,
    stats_storage: Arc<Mutex<Stats>>,
) -> Result<(), Box<dyn Error>> {
    let mut client = MinicapClient::new(connect_addr).await?;

    let mut frame_count = 0;
    let mut start_time = tokio::time::Instant::now();

    loop {
        let frame = client.read_frame().await?;
        // Update the latest frame
        {
            let mut storage = frame_storage.lock().await;
            *storage = Some(frame);
        }
        frame_count += 1;

        let elapsed = start_time.elapsed().as_secs_f64();
        if elapsed >= 1.0 {
            // Update the fps value
            {
                let mut stats = stats_storage.lock().await;
                stats.frame_count = frame_count;
                stats.last_frame_time = std::time::Instant::now();
            }

            frame_count = 0;
            start_time = tokio::time::Instant::now();
        }
    }
}
