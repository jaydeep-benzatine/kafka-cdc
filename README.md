### CDC with kafka, postgres, and Debezium

This project includes cdc implementation with kafka as a broker, postgres as it's source of truth and debezium connector to facilitate cdc.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

---

### DB changes

Update `postgresql.conf`:

```bash
wal_level = logical
max_wal_senders = 4
max_replication_slots = 4
```

Create a replication user

```sql
CREATE ROLE username_here WITH REPLICATION LOGIN PASSWORD password_here;
```

Allow replication in `pg_hba.conf`:

```bash
host replication debezium 0.0.0.0/0 md5
```

replace debezium with your newly created user name

#### Create Publication

Debezium reads from publications.

```sql
CREATE PUBLICATION dbz_publication
FOR TABLE your_table_name;
```

OR

```sql
CREATE PUBLICATION dbz_publication
FOR ALL TABLES;
```

verify publication

```sql
SELECT * FROM pg_publication;
```

verify replication slot

```sql
SELECT * FROM pg_replication_slots;
```

this will show something like below

```
slot_name     | plugin
--------------+---------
debezium_slot | pgoutput
```

#### Create debezium connector

Kafka connectors provides REST api you can create by calling REST Endpoint

```bash
curl -X POST http://localhost:8083/connectors \
-H "Content-Type: application/json" \
-d '{
  "name": "postgres-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "dbz",
    "database.dbname": "appdb",
    "database.server.name": "postgres_server",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_slot",
    "publication.autocreate.mode": "filtered",
    "topic.prefix": "cdc",
    "table.include.list": "public.users"
  }
}'
```

replace values with you values

Check your connector is created or not but again calling kafka connector REST Endpoint

```bash
CURL http://localhost:8083/connectors
```

Sample Output

```json
["postgres-connector"]
```

You can also verify that your connector is running or not by providing connector name to kafka REST Endpoint

```bash
curl http://localhost:8083/connectors/postgres-connector/status
```

replace postgres-connector with your connector name

Sample Output

```json
{
  "connector": { "state": "RUNNING" },
  "tasks": [{ "state": "RUNNING" }]
}
```

if you see any other status maybe there is problem in the postgres config, replication or your setup verify it again by check error provided by kafka in the API response

You can also check in debezium connector docker image and see logs to find the error

If every things is working you can check a new kafka topic has been created to check go into kafka docker container and run below command

```bash
kafka-topics --bootstrap-server localhost:9092 --list
```

OR

```bash
/opt/kafka/bin/kafka-topics --bootstrap-server localhost:9092 --list
```

you will see all the topics kafka and also

`cdc.public.users`

or your table name which you are tracking as topic if not then check debezium logs

One common issues that the table you are tracking must have a Primary Key for debezium to replicate it
