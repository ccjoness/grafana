package migrations

import (
	. "github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

func addEventActionsMigrations(mg *Migrator) {
	// create table
	table := Table{
		Name: "event_action",
		Columns: []*Column{
			{Name: "id", Type: DB_BigInt, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "org_id", Type: DB_BigInt, Nullable: false},
			{Name: "name", Type: DB_NVarchar, Length: 190, Nullable: false},
			{Name: "type", Type: DB_NVarchar, Length: 60, Nullable: false},
			{Name: "description", Type: DB_Text, Nullable: false},
			{Name: "script", Type: DB_Text, Nullable: false},
			{Name: "url", Type: DB_NVarchar, Length: 255, Nullable: false},
		},
		Indices: []*Index{
			{Cols: []string{"org_id"}},
			{Cols: []string{"org_id", "name"}, Type: UniqueIndex},
		},
	}
	mg.AddMigration("create event_action table", NewAddTableMigration(table))
	addTableIndicesMigrations(mg, "v1", table)
}
