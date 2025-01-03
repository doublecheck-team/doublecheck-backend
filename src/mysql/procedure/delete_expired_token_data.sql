DELIMITER $$

CREATE PROCEDURE delete_expired_token_data()
BEGIN
    DELETE FROM verification
    WHERE exp_date < NOW();
END$$

DELIMITER ;