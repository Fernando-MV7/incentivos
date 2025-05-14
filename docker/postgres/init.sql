SELECT 'CREATE DATABASE db_incsm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'db_incsm');