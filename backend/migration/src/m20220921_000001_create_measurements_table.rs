use entity::{sea_orm::{EntityTrait, Schema, DbBackend}, measurement};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20220921_000001_create_measurements_table" // Make sure this matches with the file name
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    // Define how to apply this migration: Create the Bakery table.
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let stmts = vec![get_seaorm_create_stmt(measurement::Entity)];

        for stmt in stmts {

            manager.create_table(stmt.to_owned()).await?;

        }

        Ok(())
    }

    // Define how to rollback this migration: Drop the Measurement table.
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let stmts = vec![get_seaorm_drop_stmt(measurement::Entity)];

        for stmt in stmts {

            manager.drop_table(stmt.to_owned()).await?;

        }

        Ok(())
    }
}

fn get_seaorm_create_stmt<E: EntityTrait>(e: E) -> TableCreateStatement {
    let schema = Schema::new(DbBackend::Sqlite);
    schema
        .create_table_from_entity(e)
        .if_not_exists()
        .to_owned()

}

fn get_seaorm_drop_stmt<E: EntityTrait>(e: E) -> TableDropStatement {
    Table::drop().table(e).if_exists().to_owned()
}