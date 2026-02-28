USE restaurant_db;

-- CREATE TABLE expenses (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   description VARCHAR(255),
--   amount DECIMAL(10,2),
--   status ENUM('credit', 'paid') DEFAULT 'credit',
--   added_by INT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (added_by) REFERENCES users(id)
-- );

-- INSERT INTO expenses (description, amount, status, added_by) VALUES
-- ('UMEME Electricity Bill', 420000.00, 'paid', 1),
-- ('National Water Bill', 185000.00, 'credit', 2),
-- ('MTN Internet Subscription', 250000.00, 'paid', 1),
-- ('Office Rent - Kampala', 2500000.00, 'credit', 1),
-- ('Fuel - Shell Ntinda', 320000.00, 'paid', 2),
-- ('Printer Toner Purchase', 150000.00, 'credit', 3),
-- ('Airtel Office Internet', 180000.00, 'paid', 2),
-- ('Staff Allowances', 900000.00, 'credit', 1);

ALTER TABLE sales
MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled')
DEFAULT 'pending';