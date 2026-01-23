
# Goal
Switch from using mongodb to mariaDB as the database for the URL Shortener Web Application.

# Requirements
1. Backend server
- Update the backend to connect to a MariaDB database instead of MongoDB.
- Modify the data models to be compatible with relational database structure.
- Ensure all CRUD operations work correctly with MariaDB.
- Update any relevant documentation to reflect the changes in database setup.

2. Docker compose
- Update the Docker Compose configuration to deploy a MariaDB container instead of a MongoDB container.
- Ensure that the backend service is correctly configured to connect to the MariaDB container.
- Test the entire application stack to ensure everything works seamlessly with the new database.

3. Helm chart
- Update the Helm chart to deploy a MariaDB instance instead of MongoDB.
- Ensure that the Kubernetes deployment configurations for the backend service are updated to connect to the MariaDB instance.
- Validate that the application functions correctly in a Kubernetes environment with the new database setup.

4. Testing
- Use playwright mcp to verify that the URL shortening and redirection functionalities work as expected after the migration.

# Context
1. Database Schema Design
Table Name: use urls (plural, SQL convention)
Primary Key Strategy: use an auto-incrementing id with unique index on urlCode?
Timestamp Fields: rename to created_at (SQL convention)?
Do you want updated_at field for tracking modifications? yes
Additional Fields: Do you want to add now (for future observability):
click_count INT - track redirect usage? yes
last_accessed_at DATETIME - for analytics? yes
expires_at DATETIME - for TTL/cleanup? yes
user_id - for multi-tenancy later? yes

2. Connection Pooling & Configuration
Pool Size: What connection pool limits do you want? Default: min=5, max=10
ORM vs Raw SQL:
Use raw queries with mysql2 (lightweight, learning-friendly). 
Database Initialization: include SQL schema initialization script in the repo. Auto-create tables on startup if not exist.

3. Docker Compose Configuration
MariaDB Version: Which version? Recommend 11.2
Persistent Storage: Keep same volume strategy
Health Check: Use mysqladmin ping.
Credentials Management: Switch to .env only.

4. Helm Chart Configuration
Bitnami Chart: use Bitnami's MariaDB subchart (production-ready) 
External Database Support:

You mentioned deploying DB standalone (RDS/self-hosted): Helm chart should support both internal MariaDB StatefulSet and external DB connection
Secrets Management: Use Kubernetes Secrets for DB credentials.

5. Migration Strategy
no need. this is new codebase.

6. Observability Preparation
no need for now. 

7. Environment Variables
New env vars needed - naming convention:

DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD?
Or MARIADB_* prefix?
Or DATABASE_URL single connection string (12-factor app)?

You decide. Recommend DB_HOST etc for clarity.

# Contraints
You should create new branch before updating the codebase.
