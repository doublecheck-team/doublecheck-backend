DELIMITER $$

CREATE PROCEDURE insert_user_flag_data(IN new_user_id INT)
BEGIN
    INSERT INTO user_flag (key_user, type)
    VALUES
        (new_user_id, 1),
        (new_user_id, 2),
        (new_user_id, 3),
        (new_user_id, 4),
        (new_user_id, 5);
END$$

DELIMITER ;