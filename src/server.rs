use bytes::Bytes;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server, StatusCode};
use serde_json::json;
use std::error::Error;
use std::sync::Arc;
use tokio::sync::Mutex;

pub async fn start_server(
    serve_addr: &str,
    frame_storage: Arc<Mutex<Option<Bytes>>>,
    fps_storage: Arc<Mutex<u32>>,
) -> Result<(), Box<dyn Error>> {
    let make_svc = make_service_fn(move |_conn| {
        let frame_storage = Arc::clone(&frame_storage);
        let fps_storage = Arc::clone(&fps_storage);
        async move {
            Ok::<_, hyper::Error>(service_fn(move |req| {
                handle_request(req, Arc::clone(&frame_storage), Arc::clone(&fps_storage))
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
    fps_storage: Arc<Mutex<u32>>,
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
                    .body(Body::from(frame_data))
                    .unwrap())
            } else {
                Ok(Response::builder()
                    .status(StatusCode::SERVICE_UNAVAILABLE)
                    .body(Body::from("Frame not available"))
                    .unwrap())
            }
        }
        _ => {
            let fps = {
                let fps_lock = fps_storage.lock().await;
                *fps_lock
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
    }
}