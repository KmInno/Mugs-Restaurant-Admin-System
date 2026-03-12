-- Add payment_status column to sales table if it doesn't exist
USE restaurant_db;

ALTER TABLE sales ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid';
