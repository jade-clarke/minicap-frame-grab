use tokio::sync::Mutex;
use bytes::Bytes;
use adb_control::ADBControl;

pub struct Stats {
  pub frame_count: u32,
  pub last_frame_time: std::time::Instant,
}

pub struct AppState {
  pub frame_storage: Mutex<Option<Bytes>>,
  pub stats_storage: Mutex<Stats>,
  pub adb_control: Mutex<ADBControl>,
}