use actix_web::{http::header::ContentType, web, HttpResponse};

use crate::AppState;

use super::measurements::types::ErrorJson;

pub fn measuring_guard(app: &web::Data<AppState>) -> Result<(), HttpResponse> {
    if app.measuring {
        return Result::Err(
            HttpResponse::Conflict()
                .content_type(ContentType::json())
                .body(
                    (ErrorJson {
                        error: "Another measurement is already in progress.".to_string(),
                    })
                    .to_string(),
                ),
        );
    }
    Ok(())
}
