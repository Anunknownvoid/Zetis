use napi_derive::napi;
use napi::bindgen_prelude::*;

#[napi]
pub struct NativeEngine {}

#[napi]
impl NativeEngine {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {}
    }

    #[napi]
    pub fn get_screen_frame(&self) -> Result<String> {
        // Fallback for environment without native display libs
        Ok("MOCK_FRAME".to_string())
    }
}
