use adb_control::ADBControl;
use bytes::Bytes;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server, StatusCode};
use serde_json::json;
use std::error::Error;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::models::Stats;

use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Asset;

pub async fn start_server(
    serve_addr: &str,
    frame_storage: Arc<Mutex<Option<Bytes>>>,
    stats_storage: Arc<Mutex<Stats>>,
    adb_control: Arc<Mutex<ADBControl>>,
) -> Result<(), Box<dyn Error>> {
    let make_svc = make_service_fn(move |_conn| {
        let frame_storage = Arc::clone(&frame_storage);
        let stats_storage = Arc::clone(&stats_storage);
        let adb_control = Arc::clone(&adb_control);
        async move {
            Ok::<_, hyper::Error>(service_fn(move |req| {
                handle_request(req, Arc::clone(&frame_storage), Arc::clone(&stats_storage), Arc::clone(&adb_control))
            }))
        }
    });

    let addr = serve_addr.parse()?;

    let server = Server::bind(&addr).serve(make_svc);

    println!("Server running on http://{}", addr);

    server.await?;

    Ok(())
}

async fn handle_request(
    req: Request<Body>,
    frame_storage: Arc<Mutex<Option<Bytes>>>,
    stats_storage: Arc<Mutex<Stats>>,
    adb_control: Arc<Mutex<ADBControl>>,
) -> Result<Response<Body>, hyper::Error> {
    match (req.method(), req.uri().path()) {
        (&hyper::Method::GET, "/frame") => {
            let frame = {
                let storage = frame_storage.lock().await;
                storage.clone()
            };

            if let Some(frame_data) = frame {
                Ok(Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", "image/jpeg")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .body(Body::from(frame_data))
                    .unwrap())
            } else {
                Ok(Response::builder()
                    .status(StatusCode::SERVICE_UNAVAILABLE)
                    .body(Body::from("Frame not available"))
                    .unwrap())
            }
        }
        (&hyper::Method::GET, "/status") => {
            let fps = {
                let stats = stats_storage.lock().await;
                stats.frame_count
            };

            let response_body = json!({
                "status": "up",
                "data": {
                    "fps": fps
                }
            })
            .to_string();

            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(response_body))
                .unwrap())
        }
        (&hyper::Method::GET, path) => {
            if let Some(content) = Asset::get(&path[1..]) {
                // Remove leading '/'
                let body = Body::from(content.data.into_owned());
                let mime_type = mime_guess::from_path(path).first_or_octet_stream();
                Ok(Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", mime_type.as_ref())
                    .body(body)
                    .unwrap())
            } else {
                // Return 404 Not Found
                Ok(Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .body(Body::from("Not Found"))
                    .unwrap())
            }
        }
        (&hyper::Method::POST, "/input") => {
            let body = hyper::body::to_bytes(req.into_body()).await?;
            let body_str = std::str::from_utf8(&body).unwrap();
            let json_body: serde_json::Value = serde_json::from_str(body_str).unwrap();

            if !json_body.is_object() {
                return Ok(Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from("Invalid JSON"))
                    .unwrap());
            }

            // action key with the values of "tap", "swipe", "keyevent"
            if let Some(action) = json_body.get("action") {
                match action.as_str() {
                    Some("tap") => {
                        // x, y
                        if let (Some(x), Some(y)) = (
                            json_body.get("x").and_then(|x| x.as_u64()),
                            json_body.get("y").and_then(|y| y.as_u64()),
                        ) {
                            let mut adb_control = adb_control.lock().await;
                            let _ = adb_control.tap(x as i32, y as i32);
                        }
                    }
                    Some("swipe") => {
                        // x1, y1, x2, y2
                        if let (Some(x1), Some(y1), Some(x2), Some(y2), Some(duration)) = (
                            json_body.get("x1").and_then(|x1| x1.as_u64()),
                            json_body.get("y1").and_then(|y1| y1.as_u64()),
                            json_body.get("x2").and_then(|x2| x2.as_u64()),
                            json_body.get("y2").and_then(|y2| y2.as_u64()),
                            json_body.get("duration").and_then(|duration| duration.as_u64()),
                        ) {
                            let mut adb_control = adb_control.lock().await;
                            let _ = adb_control.swipe(x1 as i32, y1 as i32, x2 as i32, y2 as i32, duration as i32);
                        }
                    }
                    Some("keyevent") => {
                        // key
                        if let Some(key) = json_body.get("key").and_then(|key| key.as_u64()) {
                            let mut adb_control = adb_control.lock().await;
                            let _ = adb_control.keyevent(key as i32);
                        }
                    }
                    _ => {
                        return Ok(Response::builder()
                            .status(StatusCode::BAD_REQUEST)
                            .body(Body::from("Invalid action"))
                            .unwrap());
                    }
                }
            } else {
                return Ok(Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from("Missing action"))
                    .unwrap());
            }

            Ok(Response::builder()
                .status(StatusCode::OK)
                .body(Body::from("Valid JSON"))
                .unwrap())
        }
        _ => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(Body::from("Not Found"))
            .unwrap()),
    }
}
