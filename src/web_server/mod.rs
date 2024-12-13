use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server, StatusCode};
use serde_json::json;
use std::error::Error;
use std::sync::Arc;
use rust_utils::http_client_utils::*;

use crate::models::AppState;

use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Asset;

pub async fn start_server(
    serve_addr: &str,
    app_state: Arc<AppState>,
) -> Result<(), Box<dyn Error>> {
    let app_state_clone = Arc::clone(&app_state);
    let make_svc = make_service_fn(move |_conn| {
        let app_state = Arc::clone(&app_state_clone);
        async move {
            Ok::<_, hyper::Error>(service_fn(move |req| {
                handle_request(req, Arc::clone(&app_state))
            }))
        }
    });

    let addr = serve_addr.parse()?;

    let server = Server::bind(&addr).serve(make_svc);

    println!("Server running on http://{}", addr);

    server.await?;

    Ok(())
}

// the response from the aq server seems to be common so we can create a function to handle the response
// and return the response with the status of the aq server
// if the response is an error, only respond with the status of down
// if the response is a success, respond with the status of up and the response json merged with the status
// this function will be used in the handle_request function
fn handle_aq_response(response: Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>>) -> Result<Response<Body>, hyper::Error> {
    // if the response is a status error responsd with the status of down
    if response.is_err() {
        let response_body = json!({
            "status": "down",
        })
        .to_string();

        return Ok(Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/json")
            .body(Body::from(response_body))
            .unwrap());
    }

    // add the status of up to the response
    let mut response_json = response.unwrap();
    response_json["status"] = json!("up");

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body(Body::from(response_json.to_string()))
        .unwrap())
}

async fn handle_request(
    req: Request<Body>,
    app_state: Arc<AppState>,
) -> Result<Response<Body>, hyper::Error> {
    match (req.method(), req.uri().path()) {
        (&hyper::Method::GET, "/frame") => {
            let frame = {
                let storage = app_state.frame_storage.lock().await;
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
                let stats = app_state.stats_storage.lock().await;
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
        (&hyper::Method::GET, "/aq_status") => {
            let endpoint = format!("http://{}{}", app_state.config.aq_addr, "/status");
            let response = get::http_get_json(&endpoint).await;
            handle_aq_response(response)
        }
        (&hyper::Method::GET, "/aq_queues") => {
            let endpoint = format!("http://{}{}", app_state.config.aq_addr, "/queues");
            let response = get::http_get_json(&endpoint).await;
            handle_aq_response(response)
        }
        (&hyper::Method::POST, "/aq_run") => {
            let body = hyper::body::to_bytes(req.into_body()).await?;
            let body_str = std::str::from_utf8(&body).unwrap();
            let json_body: serde_json::Value = serde_json::from_str(body_str).unwrap();

            if !json_body.is_object() {
                return Ok(Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from("Invalid JSON"))
                    .unwrap());
            }

            if let (Some(queue), Some(iterations)) = (
                json_body.get("queue").and_then(|x| x.as_str()),
                json_body.get("iterations").and_then(|y| y.as_u64()),
            ) {
                let run_request = json!({
                    "queue": queue,
                    "iterations": iterations
                });
            
                let endpoint = format!("http://{}{}", app_state.config.aq_addr, "/run");
                let run_request_str = run_request.to_string();
                let response = post::http_post_json(&endpoint, &run_request_str).await;
                handle_aq_response(response)
            } else {
                return Ok(Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .body(Body::from("Invalid JSON"))
                    .unwrap());
            }        
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
                            let mut adb_control = app_state.adb_control.lock().await;
                            let _ = adb_control.tap(x as u32, y as u32);
                        }
                    }
                    Some("long_tap") => {
                        // x, y
                        if let (Some(x), Some(y), Some(duration)) = (
                            json_body.get("x").and_then(|x| x.as_u64()),
                            json_body.get("y").and_then(|y| y.as_u64()),
                            json_body
                                .get("duration")
                                .and_then(|duration| duration.as_u64()),
                        ) {
                            let mut adb_control = app_state.adb_control.lock().await;
                            let _ = adb_control.long_tap(x as u32, y as u32, duration as u32);
                        }
                    }
                    Some("swipe") => {
                        // x1, y1, x2, y2
                        if let (Some(x1), Some(y1), Some(x2), Some(y2), Some(duration)) = (
                            json_body.get("x1").and_then(|x1| x1.as_u64()),
                            json_body.get("y1").and_then(|y1| y1.as_u64()),
                            json_body.get("x2").and_then(|x2| x2.as_u64()),
                            json_body.get("y2").and_then(|y2| y2.as_u64()),
                            json_body
                                .get("duration")
                                .and_then(|duration| duration.as_u64()),
                        ) {
                            let mut adb_control = app_state.adb_control.lock().await;
                            let _ = adb_control.swipe(
                                x1 as u32,
                                y1 as u32,
                                x2 as u32,
                                y2 as u32,
                                duration as u32,
                            );
                        }
                    }
                    Some("keyevent") => {
                        if let (Some(keycode), Some(longpress)) = (
                            json_body
                                .get("keycode")
                                .and_then(|keycode| keycode.as_str()),
                            json_body
                                .get("longpress")
                                .and_then(|longpress| longpress.as_bool()),
                        ) {
                            let mut adb_control = app_state.adb_control.lock().await;
                            let _ = adb_control.keyevent(keycode, longpress);
                        }
                    }
                    Some("text") => {
                        // text
                        if let Some(text) = json_body.get("text").and_then(|text| text.as_str()) {
                            let mut adb_control = app_state.adb_control.lock().await;
                            let _ = adb_control.text(text.into());
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

            return Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(Body::from(
                    json!({
                        "status": "success"
                    })
                    .to_string(),
                ))
                .unwrap());
        }
        _ => Ok(Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header("Content-Type", "application/json")
            .body(Body::from(
                json!({
                    "error": "Not Found"
                })
                .to_string(),
            ))
            .unwrap()),
    }
}
