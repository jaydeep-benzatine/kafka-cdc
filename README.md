# CDC with Kafka, PostgreSQL, and Debezium

This project demonstrates **Change Data Capture (CDC)** using:

* **PostgreSQL** as the source database
* **Debezium** as the CDC connector
* **Kafka** as the event streaming platform

Debezium captures row-level changes from PostgreSQL's **Write-Ahead Log (WAL)** using **logical replication** and publishes those changes to **Kafka topics**.

---

# Architecture

```
+-----------+        WAL         +-------------+        CDC Events        +-------+
| Postgres  |  ----------------> |  Debezium   | -----------------------> | Kafka |
+-----------+                    +-------------+                           +-------+
                                      |
                                      |
                               Kafka Topics
```

Flow:

1. PostgreSQL writes database changes to **WAL (Write-Ahead Log)**
2. Debezium reads WAL using **logical replication**
3. Debezium converts changes into **CDC events**
4. Events are published to **Kafka topics**
5. Consumers can subscribe to those topics

---

# Prerequisites

Make sure the following tools are installed:

* Docker / Docker Compose
* PostgreSQL **10+**
* Kafka
* Kafka Connect
* Bun runtime

Install project dependencies:

```bash
bun install
```

Run the demo:

```bash
bun run index.ts
```

---

# PostgreSQL Configuration

Debezium requires **logical replication** to be enabled.

Update the `postgresql.conf` file:

```bash
wal_level = logical
max_wal_senders = 4
max_replication_slots = 4
```

Restart PostgreSQL after modifying the configuration:

```bash
docker restart postgres
```

---

# Create Replication User

Debezium requires a user with **replication privileges**.

```sql
CREATE ROLE debezium WITH REPLICATION LOGIN PASSWORD 'dbz';
```

---

# Configure pg_hba.conf

Allow the replication user to connect.

Add this line to `pg_hba.conf`:

```bash
host replication debezium 0.0.0.0/0 md5
```

Restart PostgreSQL again if the file was modified.

---

# Table Requirements

Debezium requires tables to have either:

* A **Primary Key**, OR
* `REPLICA IDENTITY FULL`

Example:

```sql
ALTER TABLE users REPLICA IDENTITY FULL;
```

Without this, updates may fail with:

```
cannot update table because it does not have a replica identity
```

---

# Create Publication

Debezium reads database changes from **PostgreSQL publications**.

Create a publication manually:

```sql
CREATE PUBLICATION dbz_publication
FOR TABLE public.users;
```

Or capture all tables:

```sql
CREATE PUBLICATION dbz_publication
FOR ALL TABLES;
```

Verify publication:

```sql
SELECT * FROM pg_publication;
```

---

# Create Debezium Connector

Kafka Connect exposes a **REST API** for creating connectors.

Create the Debezium connector:

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
    "topic.prefix": "cdc",
    "table.include.list": "public.users",
    "publication.autocreate.mode": "filtered"
  }
}'
```

Replace configuration values according to your setup.

---

# Verify Connector

List connectors:

```bash
curl http://localhost:8083/connectors
```

Example output:

```json
["postgres-connector"]
```

Check connector status:

```bash
curl http://localhost:8083/connectors/postgres-connector/status
```

Example output:

```json
{
  "connector": { "state": "RUNNING" },
  "tasks": [{ "state": "RUNNING" }]
}
```

If the status is **FAILED**, check the connector logs.

---

# Verify Replication Slot

Replication slots are created **after the connector starts successfully**.

Check replication slots:

```sql
SELECT * FROM pg_replication_slots;
```

Example output:

```
slot_name     | plugin
--------------+---------
debezium_slot | pgoutput
```

---

# Kafka Topic Naming

Topic naming format:

```
<topic.prefix>.<schema>.<table>
```

Example:

```
cdc.public.users
```

---

# List Kafka Topics

Enter the Kafka container and list topics:

```bash
kafka-topics --bootstrap-server localhost:9092 --list
```

Or:

```bash
/opt/kafka/bin/kafka-topics --bootstrap-server localhost:9092 --list
```

Example output:

```
cdc.public.users
```

---

# Consume CDC Events

You can read CDC events using the Kafka console consumer:

```bash
kafka-console-consumer \
--bootstrap-server localhost:9092 \
--topic cdc.public.users \
--from-beginning
```

---

# Example CDC Event

Example message produced by Debezium:

```json
{
  "op": "c",
  "before": null,
  "after": {
    "id": 1,
    "name": "John"
  },
  "source": {
    "db": "appdb",
    "table": "users"
  }
}
```

Operation codes:

| Code | Meaning  |
| ---- | -------- |
| c    | create   |
| u    | update   |
| d    | delete   |
| r    | snapshot |

---

# Snapshot Behavior

When the connector starts for the first time, Debezium performs a **snapshot** of the existing table data before streaming WAL changes.

---

# Troubleshooting

## Connector in FAILED state

Check connector logs:

```bash
docker logs debezium-connect
```

---

## Permission denied for table

Grant access to the replication user:

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium;
```

---

## Table missing replica identity

Error:

```
cannot update table because it does not have a replica identity
```

Fix:

```sql
ALTER TABLE users REPLICA IDENTITY FULL;
```

---

## No Kafka topic created

Verify:

1. Connector status
2. PostgreSQL logical replication settings
3. Debezium logs
4. Publication configuration

---

# Summary

This project demonstrates how to build a **Change Data Capture pipeline** using:

* PostgreSQL logical replication
* Debezium CDC connector
* Kafka event streaming

Database changes are captured in real time and published as **event streams** that downstream services can consume.
