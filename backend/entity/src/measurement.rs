// use chrono::serde::ts_seconds;

use sea_orm::{entity::prelude::*, DeleteMany};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "measurements")]
pub struct Model {
    #[sea_orm(primary_key)]
    #[serde(skip_deserializing)]
    pub id: i32,

    pub status: Status,
    // #[serde(with = "ts_seconds")]
    pub date: DateTimeLocal,

    pub category: Category,

    pub parameters: Option<Json>,

    pub data: Option<Json>,

}

#[derive(Copy, Clone, Debug, EnumIter)]
pub enum Relation {}
impl RelationTrait for Relation {

    fn def(&self) -> RelationDef {

        panic!("No RelationDef")

    }

}

impl ActiveModelBehavior for ActiveModel {}

#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(Some(1))")]
pub enum Status {
    #[sea_orm(string_value = "I")]
    InProgress,
    #[sea_orm(string_value = "D")]
    Done,
    #[sea_orm(string_value = "E")]
    Error,
}

#[derive(Debug, Clone, PartialEq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "String(Some(4))")]
pub enum Category {
    #[sea_orm(string_value = "P")]
    Pulse,
    #[sea_orm(string_value = "PC")]
    PulseCollection,
    #[sea_orm(string_value = "ST")]
    Stdp,
    #[sea_orm(string_value = "STC")]
    StdpCollection,
}

impl Entity {

    pub fn find_by_id(id: i32) -> Select<Entity> {

        Self::find().filter(Column::Id.eq(id))

    }

    pub fn delete_by_id(id: i32) -> DeleteMany<Entity> {

        Self::delete_many().filter(Column::Id.eq(id))

    }

}