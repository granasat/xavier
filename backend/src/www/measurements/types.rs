use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MeasurementRef {
    pub id: usize
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ErrorJson {
    pub error: String
}

impl ErrorJson {
    pub fn to_string(self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}

// #[derive(Serialize, Deserialize, Debug)]
// pub enum Error {
//     DbInsertError(String)    
//     DbInserError(String)    
// }